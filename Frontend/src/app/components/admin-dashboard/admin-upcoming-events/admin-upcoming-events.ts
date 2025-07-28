// admin-upcoming-events.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { EventService } from '../../../services/event';
import { LoadingService } from '../../loading';
import { AuthService } from '../../../services/auth';
import { HeaderComponent, HeaderButton } from '../../../common/header/header';
import { FooterComponent } from '../../../common/footer/footer';
import { CustomAlertComponent } from '../../custom-alert/custom-alert';
import { environment } from '../../../../environment';
import { PaginationComponent } from '../../../common/pagination/pagination';

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  city: string;
  timeSlot: string;
  duration: string;
  location: Location;
  category: string;
  price: number;
  maxRegistrations: number;
  createdBy: string;
  artist?: string;
  organization?: string;
}

export interface Location {
  id: string;
  state: string;
  city: string;
  placeName: string;
  address: string;
  maxSeatingCapacity: number;
  amenities: string[];
  bookings?: Booking[];
}

export interface Booking {
  id: string;
  date: string;
  timeSlot: string;
  eventId: string;
}

export interface RegisteredUser {
  userId: string;
  name: string;
  email: string;
  id: string;
}

export interface RegisteredUsersResponse {
  users: RegisteredUser[];
  currentRegistration: number;
}

export interface CustomAlert {
  show: boolean;
  type: 'success' | 'error' | 'warning' | 'info' | 'confirm';
  title: string;
  message: string;
  confirmAction?: () => void;
  cancelAction?: () => void;
  showCancel?: boolean;
  autoClose?: boolean;
}

@Component({
  selector: 'app-admin-upcoming-events',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    HeaderComponent,
    FooterComponent,
    CustomAlertComponent,
    PaginationComponent
  ],
  templateUrl: './admin-upcoming-events.html',
  styleUrls: ['./admin-upcoming-events.scss'],
})
export class AdminUpcomingEvents {
  events: Event[] = [];
  filteredEvents: Event[] = [];
  usersMap: { [eventId: string]: RegisteredUsersResponse } = {};
  showUsersDropdown: { [eventId: string]: boolean } = {};
  userName: string | null = null;

  // Event details modal properties
  selectedEvent: Event | null = null;
  showEventDetails: boolean = false;

  // Alert properties
  alert: CustomAlert = {
    show: false,
    type: 'info',
    title: '',
    message: '',
    showCancel: false,
    autoClose: false,
  };

  adminButtons: HeaderButton[] = [
    { text: 'Back to Dashboard', action: 'backToDashboard' },

    { text: 'Analytics', action: 'viewAnalytics', style: 'primary' },
    { text: 'Logout', action: 'logout', style: 'primary' },
  ];
   paginatedEvents: Event[] = [];
    currentPage = 1;
    totalPages = 0;
    eventsPerPage = 6; // Can be passed as `limit`
    isLoading = false;

  constructor(
    private eventService: EventService,
    private authService: AuthService,
    private loadingService: LoadingService,
    private router: Router,
    private http: HttpClient
  ) {
    this.loadEvents();
  }

  handleHeaderAction(action: string): void {
    switch (action) {
      case 'backToDashboard':
        this.router.navigate(['/admin-dashboard']);
        break;
      case 'viewAnalytics':
        this.router.navigate(['/admin-analytics']);
        break;
      case 'logout':
        this.logout();
        break;
    }
  }
  customAlert: CustomAlert = {
    show: false,
    type: 'info',
    title: '',
    message: '',
    showCancel: false,
    autoClose: false,
  };

  private alertTimeout: any;

  showAlert(
    type: 'success' | 'error' | 'warning' | 'info',
    title: string,
    message: string,
    duration: number = 2000
  ) {
    this.clearAlertTimeout();

    this.customAlert = {
      show: true,
      type,
      title,
      message,
      showCancel: false,
    };

    this.alertTimeout = setTimeout(() => {
      this.closeAlert();
    }, duration);
  }

  showConfirmation(
    title: string,
    message: string,
    confirmAction: () => void,
    cancelAction?: () => void
  ) {
    this.clearAlertTimeout();
    this.customAlert = {
      show: true,
      type: 'confirm',
      title,
      message,
      confirmAction,
      cancelAction,
      showCancel: true,
    };
  }

  handleAlertConfirm() {
    if (this.customAlert.confirmAction) {
      this.customAlert.confirmAction();
    }
    this.closeAlert();
  }

  handleAlertCancel() {
    if (this.customAlert.cancelAction) {
      this.customAlert.cancelAction();
    }
    this.closeAlert();
  }

  closeAlert() {
    this.customAlert.show = false;
    this.customAlert.confirmAction = undefined;
    this.customAlert.cancelAction = undefined;
    this.clearAlertTimeout();
  }

  private clearAlertTimeout() {
    if (this.alertTimeout) {
      clearTimeout(this.alertTimeout);
      this.alertTimeout = null;
    }
  }

  getFullAddress(location: any): string {
  if (!location) return '';

  if (typeof location === 'string') {
    return location;
  }

  if (typeof location === 'object') {
    // Customize this based on your location object structure
    return `${location.address || ''}, ${location.city || ''}, ${location.state || ''}, ${location.country || ''}`.replace(/,\s*,/g, ',').replace(/^,\s*/, '').replace(/,\s*$/, '');
  }

  return JSON.stringify(location);
}

  loadRegisteredUsers(eventId: string) {
    this.eventService.getRegisteredUsers(eventId).subscribe({
      next: (res: any) => {
        const mappedResponse = {
          users:
            res.data?.users?.map((user: any) => ({
              userId: user.userId,
              name: user.name,
              email: user.email,
              id: user.id || user.userId,
            })) || [],
          currentRegistration: res.data?.currentRegistration || 0,
        };
        this.usersMap[eventId] = mappedResponse;
      },
      error: (err) => console.error('Error loading users for event', err),
    });
  }

  toggleUsersDropdown(eventId: string): void {
    this.showUsersDropdown[eventId] = !this.showUsersDropdown[eventId];
  }

  showEventDetail(event: Event) {
    this.selectedEvent = event;
    this.showEventDetails = true;
    document.body.style.overflow = 'hidden';
  }

  closeEventDetails() {
    this.showEventDetails = false;
    this.selectedEvent = null;
    document.body.style.overflow = 'auto';
  }

   extractCityFromLocationObject(location: any): string {
    if (!location) return '';

    // If location is an object with city property
    if (typeof location === 'object' && location.city) {
      return location.city;
    }

    // If location is a string, use existing extraction logic
    if (typeof location === 'string') {
      return this.extractCityFromLocation(location);
    }

    return '';
  }

extractCityFromLocation(location: string): string {
    // console.log('Extracting city from location:', location);
    if (!location) return '';
    const parts = location.split(',').map((part) => part.trim());
    if (parts.length >= 2) {
      return parts[parts.length - 1];
    } else {
      return parts[0];
    }
  }
  loadEvents(page: number = 1): void {
    // this.loadingService.show();

    this.eventService.getPaginatedEvents(page, this.eventsPerPage).subscribe({
  //     next: (events: any[]) => {
  //       this.events = events;
  //       this.filteredEvents = [...events];

  //       this.events.forEach((event) => {
  //         this.loadRegisteredUsers(event.id);
  //       });
  //       this.loadingService.hide();
  //       this.isLoading = false;
  //       console.log('Loaded events:', this.events);
  //       this.showAlert(
  //         'success',
  //         'Events Loaded',
  //         'Successfully loaded all available events!'
  //       );
  //     },
  //     error: (err) => {
  //       console.error('Error loading events', err);
  //       this.loadingService.hide();
  //       this.isLoading  = false;
  //       this.showAlert(
  //         'error',
  //         'Loading Failed',
  //         'Failed to load events. Please try again later.'
  //       );
  //     },
  //   });
  // }

  next: (response) => {
        if (response && Array.isArray(response.data)) {
          // Map events and extract city from location
          this.events = (response.data as any[]).map((event) => ({
            ...event,
            tempCity:
              this.extractCityFromLocationObject(event.location) ||
              event.city ||
              'Unknown',
          }));

          // console.log('Fetched events:', this.events);

          this.paginatedEvents = [...this.events];
          this.filteredEvents = [...this.events];
           this.events.forEach((event) => {
        this.loadRegisteredUsers(event.id);
     });
          // this.applySorting();

          this.currentPage = response.currentPage || 1;
          this.totalPages = response.totalPages || 1;
          this.eventsPerPage = response.pageSize || this.eventsPerPage;
        } else {
          this.showAlert('error', 'Invalid Response', 'Unexpected data format');
        }
      },
      error: (error) => {
        console.error('❌ Error fetching events:', error);
        this.showAlert('error', 'Load Failed', 'Failed to load events');
      },
      complete: () => {
        this.isLoading = false;
      },
    });
  }

   onPageChange(page: number): void {

      this.loadEvents(page);
    }


  confirmDeleteEvent(eventId: string, eventTitle: string) {
    this.showConfirmation(
      'Delete Event',
      `Are you sure you want to delete "${eventTitle}"? This action cannot be undone.`,
      () => this.deleteEvent(eventId)
    );
  }

  deleteEvent(eventId: string) {
    this.eventService.deleteEvent(eventId).subscribe({
      next: () => {
        this.loadEvents();
        this.showAlert(
          'success',
          'Event Deleted',
          'The event has been deleted successfully.'
        );
      },
      error: (err) => {
        console.error('Failed to delete event', err);
        this.showAlert(
          'error',
          'Delete Failed',
          'Failed to delete event. Please try again.'
        );
      },
    });
  }

  confirmRemoveUser(eventId: string, userId: string, userName: string) {
    this.showConfirmation(
      'Remove User',
      `Are you sure you want to remove "${userName}" from this event?`,
      () => this.removeUserFromEvent(eventId, userId)
    );
  }

  removeUserFromEvent(eventId: string, userId: string) {
    this.eventService.removeUserFromEvent(eventId, userId).subscribe({
      next: () => {
        this.loadRegisteredUsers(eventId);
        this.showAlert(
          'success',
          'User Removed',
          'User has been successfully removed from the event.'
        );
      },
      error: (err) => {
        console.error('Failed to remove user', err);
        this.showAlert(
          'error',
          'Remove Failed',
          'Failed to remove user. Please try again.'
        );
      },
    });
  }

  hideAlert(): void {
    this.alert.show = false;
  }

  logout() {
    this.showConfirmation(
      'Logout Confirmation',
      'Are you sure you want to logout?',
      () => {
        localStorage.clear();
        sessionStorage.clear();
        this.showAlert(
          'success',
          'Logged Out',
          'You have been logged out successfully.'
        );
        setTimeout(() => {
          window.location.href = '/login';
        }, 1500);
      }
    );
  }
}
