// my-created-events.ts
import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { LoadingService } from '../../loading';
import { AuthService } from '../../../services/auth';
import { EventService } from '../../../services/event';
import { LocationService } from '../../../services/location';
import { HeaderComponent, HeaderButton } from '../../../common/header/header';
import { FooterComponent } from '../../../common/footer/footer';
import { CustomAlertComponent } from '../../custom-alert/custom-alert';

// Interfaces
export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  timeSlot: string;
  duration: string;
  locationId: string;
  location: Location;
  category: string;
  price: number;
  maxRegistrations: number;
  currentRegistrations: number;
  createdById: string;
  artist?: string;
  organization?: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Expired';
  createdAt: string;
  updatedAt: string;
}

export interface Location {
  id: string;
  state: string;
  city: string;
  placeName: string;
  address: string;
  maxSeatingCapacity: number;
  amenities: string[];
  bookings: any[];
}

export interface RegisteredUser {
  id: string;
  name: string;
  email: string;
}

export interface RegisteredUsersResponse {
  currentRegistration: number;
  users: RegisteredUser[];
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
  selector: 'app-my-created-events',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    HeaderComponent,
    FooterComponent,
    CustomAlertComponent,
  ],
  templateUrl: './my-created-events.html',
  styleUrls: ['./my-created-events.scss'],
})
export class MyCreatedEventsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  userName: string | null = null;
  organizerId: string | null = null;
  isLoading = false;
  events: Event[] = [];
  locations: any[] = [];

  selectedEventId: string | null = null;
  selectedEvent: Event | null = null;
  isEventDetailVisible: boolean = false;

  usersMap: {
    [eventId: string]: { currentRegistration: number; users: RegisteredUser[] };
  } = {};

  customAlert: CustomAlert = {
    show: false,
    type: 'info',
    title: '',
    message: '',
    showCancel: false,
  };

  get displayUserName(): string {
    return this.userName || 'Guest';
  }

  organizerButtons: HeaderButton[] = [
    { text: 'Dashboard', action: 'backToDashboard' },
    { text: 'Create Event', action: 'createEvent', style: 'primary' },
    { text: 'Analytics', action: 'openAnalytics', style: 'primary' },
    { text: 'Contact', action: 'openContact' },
    { text: 'Logout', action: 'logout' },
  ];

  constructor(
    private loadingService: LoadingService,
    private authService: AuthService,
    private eventService: EventService,
    private locationService: LocationService,
    private router: Router
  ) {}

  ngOnInit() {
    this.decodeToken();
    this.initializeData();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.isLoading = false;
    this.loadingService.hide();
  }

  private decodeToken(): void {
    try {
      const token =
        sessionStorage.getItem('token') || localStorage.getItem('token');

      if (!token) {
        console.error('No token found in storage');
        return;
      }

      const tokenParts = token.split('.');
      if (tokenParts.length !== 3) {
        console.error('Invalid token format');
        return;
      }

      const payload = JSON.parse(atob(tokenParts[1]));
      this.organizerId = payload.userId || payload.id || null;
      this.userName = payload.userName || payload.name || null;
    } catch (error) {
      console.error('Error decoding token:', error);
      this.organizerId = null;
    }
  }

  private async initializeData() {
    if (!this.organizerId) {
      console.error('No organizer ID found');
      this.showAlert(
        'error',
        'Authentication Error',
        'No organizer ID found. Please login again.'
      );
      this.logout();
      return;
    }

    this.loadAllData();
  }

  private loadAllData(): void {
    this.isLoading = true;
    this.loadingService.show();

    // Load locations
    this.locationService
      .fetchLocations()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.locations = Array.isArray(data) ? data : [];
        },
        error: (error) => {
          console.error('Error loading locations:', error);
          this.locations = [];
        },
      });

    // Load approved events only
    if (this.organizerId) {
      this.eventService
        .getEventById(this.organizerId, 1, 100)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            const allEvents = response.data || [];
            // Only show approved events
            this.events = allEvents.filter(
              (event: Event) => event.status === 'Approved'
            );
          },
          error: (error) => {
            console.error('Error loading events:', error);
            this.events = [];
          },
          complete: () => {
            this.isLoading = false;
            this.loadingService.hide();
          },
        });
    } else {
      this.isLoading = false;
      this.loadingService.hide();
    }
  }

  handleHeaderAction(action: string): void {
    switch (action) {
      case 'backToDashboard':
        this.backToDashboard();
        break;
      case 'createEvent':
        this.createEvent();
        break;
      case 'openAnalytics':
        this.openAnalytics();
        break;
      case 'openContact':
        this.openContact();
        break;
      case 'logout':
        this.logout();
        break;
    }
  }

  backToDashboard() {
    this.router.navigate(['/organizer-dashboard']);
  }

  createEvent() {
    this.router.navigate(['/organizer-dashboard']);
  }

  openAnalytics() {
    this.router.navigate(['/analytics']);
  }

  openContact() {
    this.router.navigate(['/contact']);
  }

  onEdit(event: Event) {
    // Navigate back to dashboard with edit mode
    this.router.navigate(['/organizer-dashboard'], {
      queryParams: { editEventId: event.id },
    });
  }

  async onDelete(eventId: string) {
    this.showConfirmation(
      'Confirm',
      'Are you sure you want to delete this event? This action cannot be undone.',
      () => {
        this.isLoading = true;
        this.loadingService.show();

        this.eventService
          .deleteEvent(eventId)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: async () => {
              this.showAlert('success', 'Success', 'Event deleted!');
              this.loadAllData();
            },
            error: async (error) => {
              console.error('Delete error:', error);
              this.showAlert('error', 'Error', 'Failed to delete event');
            },
            complete: () => {
              this.isLoading = false;
              this.loadingService.hide();
            },
          });
      }
    );
  }

  loadRegisteredUsers(eventId: string, callback?: () => void) {
    this.eventService
      .getRegisteredUsers(eventId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.usersMap[eventId] = res.data;
          if (callback) callback();
        },
        error: (error) => {
          console.error('Error loading registered users:', error);
          this.showAlert('error', 'Error', 'Failed to load registered users');
        },
      });
  }

  openUserModal(eventId: string) {
    this.loadRegisteredUsers(eventId, () => (this.selectedEventId = eventId));
  }

  closeUserModal() {
    this.selectedEventId = null;
  }

  showEventDetail(event: Event) {
    this.selectedEvent = event;
    this.isEventDetailVisible = true;
    document.body.style.overflow = 'auto';
  }

  closeEventDetails() {
    this.isEventDetailVisible = false;
    this.selectedEvent = null;
    document.body.style.overflow = 'auto';
  }

  showAlert(
    type: 'success' | 'error' | 'warning' | 'info',
    title: string,
    message: string,
    autoClose: boolean = true,
    duration: number = 2000
  ) {
    this.customAlert = {
      show: true,
      type,
      title,
      message,
      showCancel: false,
      autoClose: autoClose,
    };

    if (autoClose) {
      setTimeout(() => {
        this.closeAlert();
      }, duration);
    }
  }

  showConfirmation(
    title: string,
    message: string,
    confirmAction: () => void,
    cancelAction?: () => void
  ) {
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
  }

  async logout() {
    this.showConfirmation('Confirm', 'Are you sure you want to logout?', () => {
      localStorage.clear();
      sessionStorage.clear();
      this.showAlert('success', 'Success', 'You have been logged out');
      setTimeout(() => (window.location.href = '/login'), 500);
    });
  }
}
