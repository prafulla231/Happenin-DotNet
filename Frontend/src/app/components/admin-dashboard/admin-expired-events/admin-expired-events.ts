import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterModule, Router } from '@angular/router';
import { LoadingService } from '../../loading';
import { EventService } from '../../../services/event';
import { AuthService } from '../../../services/auth';
import { HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { environment } from '../../../../environment';
import { HeaderComponent, HeaderButton } from '../../../common/header/header';
import { FooterComponent } from '../../../common/footer/footer';
import { CustomAlertComponent } from '../../custom-alert/custom-alert';

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
  selector: 'app-admin-expired-events',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    HeaderComponent,
    FooterComponent,
    CustomAlertComponent,
  ],
  templateUrl: './admin-expired-events.html',
  styleUrls: ['./admin-expired-events.scss'],
})
export class AdminExpiredEvents implements OnInit {
  private router = inject(Router);
  private http = inject(HttpClient);
  private loadingService = inject(LoadingService);
  private eventService = inject(EventService);
  private authService = inject(AuthService);

  expiredEvents: Event[] = [];
  selectedEvent: Event | null = null;
  showEventDetails: boolean = false;
  usersMap: { [eventId: string]: RegisteredUsersResponse } = {};

  customAlert: CustomAlert = {
    show: false,
    type: 'info',
    title: '',
    message: '',
    autoClose: false,
  };

  adminButtons: HeaderButton[] = [
    { text: 'Dashboard', action: 'dashboard' },
    // { text: 'Upcoming Events', action: 'viewAvailableEvents' },
    // { text: 'Pending Approvals', action: 'viewPendingEvents' },
    { text: 'Analytics', action: 'viewAnalytics', style: 'primary' },
    { text: 'Logout', action: 'logout', style: 'primary' },
  ];

  ngOnInit(): void {
    this.loadExpiredEvents();
  }

  handleHeaderAction(action: string): void {
    switch (action) {
      case 'dashboard':
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

  private alertTimeout: any;

  showAlert(
    type: 'success' | 'error' | 'warning' | 'info',
    title: string,
    message: string,
    duration: number = 2000
  ) {
    this.clearAlertTimeout(); // Clear any previous timeout

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

  loadExpiredEvents(): void {
    this.loadingService.show();

    this.eventService.getExpiredEvents().subscribe({
      next: (events: any[]) => {
        this.expiredEvents = events;

        this.loadingService.hide();
        this.showAlert(
          'success',
          'Events Loaded',
          'Successfully loaded all available events!'
        );
      },
      error: (err) => {
        console.error('Error loading events', err);
        this.loadingService.hide();
        this.showAlert(
          'error',
          'Loading Failed',
          'Failed to load events. Please try again later.'
        );
      },
    });
  }

  confirmDeleteEvent(eventId: string, eventTitle: string): void {
    this.customAlert = {
      show: true,
      type: 'confirm',
      title: 'Confirm Delete',
      message: `Are you sure you want to delete the event "${eventTitle}"? This action cannot be undone.`,
      confirmAction: () => this.deleteEvent(eventId),
      cancelAction: () => this.hideAlert(),
      showCancel: true,
      autoClose: false,
    };
  }

  deleteEvent(eventId: string): void {
    this.loadingService.show();
    this.eventService.deleteEvent(eventId).subscribe({
      next: () => {
        this.expiredEvents = this.expiredEvents.filter(
          (event) => event.id !== eventId
        );
        this.showAlert('success', 'Success', 'Event deleted successfully');
        this.loadingService.hide();
      },
      error: (error: HttpErrorResponse) => {
        console.error('Error deleting event:', error);
        this.showAlert('error', 'Error', 'Failed to delete event');
        this.loadingService.hide();
      },
    });
  }

  showEventDetail(event: Event) {
    this.selectedEvent = event;
    this.showEventDetails = true;
    document.body.style.overflow = 'hidden';
  }

  loadRegisteredUsers(eventId: string) {
    this.eventService.getRegisteredUsers(eventId).subscribe({
      next: (res: any) => {
        // Map the response to ensure compatibility
        const mappedResponse = {
          users:
            res.data?.users?.map((user: any) => ({
              userId: user.userId,
              name: user.name,
              email: user.email,
              _id: user.id || user.userId,
            })) || [],
          currentRegistration: res.data?.currentRegistration || 0,
        };
        this.usersMap[eventId] = mappedResponse;
      },
      error: (err) => console.error('Error loading users for event', err),
    });
  }
  closeEventDetails(): void {
    this.showEventDetails = false;
    this.selectedEvent = null;
  }

  hideAlert(): void {
    this.customAlert.show = false;
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
