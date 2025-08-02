import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// Services
import { LoadingService } from '../../loading';
import { AuthService } from '../../../services/auth';
import { EventService } from '../../../services/event';
import { LocationService } from '../../../services/location';

// Components
import { HeaderComponent, HeaderButton } from '../../../common/header/header';
import { FooterComponent } from '../../../common/footer/footer';
import { CustomAlertComponent } from '../../custom-alert/custom-alert';
import { PaginationComponent } from '../../../common/pagination/pagination';
import {
  EventEditOverlayComponent,
  EventData,
} from '../edit-event-overlay/edit-event-overlay'; // Import the overlay component

// Interfaces (reuse from organizer-dashboard)
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
  selector: 'app-organizer-pending-approvals',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HeaderComponent,
    FooterComponent,
    CustomAlertComponent,
    PaginationComponent,
    EventEditOverlayComponent, // Add the overlay component to imports
  ],
  templateUrl: './my-pending-approvals.html',
  styleUrls: ['./my-pending-approvals.scss'],
})
export class OrganizerPendingApprovalsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // User data
  userName: string | null = null;
  organizerId: string | null = null;

  // Loading states
  isLoading = false;

  // Events data
  pendingEvents: Event[] = [];
  filteredEvents: Event[] = [];
  locations: any[] = [];
  // Pagination
  paginatedEvents: Event[] = [];
  currentPage = 1;
  totalPages = 0;
  eventsPerPage = 6;

  // Modal data
  selectedEvent: Event | null = null;
  isEventDetailVisible: boolean = false;

  // Add properties for edit overlay
  isEditOverlayVisible: boolean = false;
  eventToEdit: Event | null = null;

  // Filter and sort options
  sortBy: string = 'date';
  sortOrder: string = 'asc';
  selectedCategory: string = '';

  categories: string[] = [
    'Music',
    'Sports',
    'Workshop',
    'Dance',
    'Theatre',
    'Technical',
    'Comedy',
    'Arts',
    'Exhibition',
    'other',
  ];

  // Alert system
  customAlert: CustomAlert = {
    show: false,
    type: 'info',
    title: '',
    message: '',
    showCancel: false,
  };

  // Header configuration
  get displayUserName(): string {
    return this.userName || 'Guest';
  }

  organizerButtons: HeaderButton[] = [
    { text: 'Dashboard', action: 'dashboard' },
    { text: 'My Events', action: 'viewMyEvents' },
    { text: 'Create Event', action: 'createEvent', style: 'primary' },
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

  // Token handling
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

    // Load locations first, then events
    this.locationService
      .fetchLocations()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.locations = Array.isArray(data) ? data : [];
          // Load events after locations are loaded
          this.loadPendingEvents();
        },
        error: (error) => {
          console.error('Error loading locations:', error);
          this.locations = [];
          // Still try to load events even if locations failed
          this.loadPendingEvents();
        },
      });
  }

  // Data loading
  private loadPendingEvents(page: number = 1): void {
    if (!this.organizerId) {
      return;
    }

    this.eventService
      .getEventsByOrganizerAndStatus(
        this.organizerId,
        'Pending',
        page,
        this.eventsPerPage
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const pageEvents = response.data || [];

          // Map location details to events
          this.pendingEvents = pageEvents.map((event: Event) => {
            if (event.locationId && this.locations.length > 0) {
              const locationDetails = this.locations.find(
                (loc) => loc.id === event.locationId
              );
              if (locationDetails) {
                event.location = {
                  id: locationDetails.id,
                  state: locationDetails.state,
                  city: locationDetails.city,
                  placeName: locationDetails.placeName,
                  address: locationDetails.address,
                  maxSeatingCapacity: locationDetails.maxSeatingCapacity,
                  amenities: locationDetails.amenities || [],
                  bookings: locationDetails.bookings || [],
                };
              } else {
                // If location not found, create a minimal location object
                event.location = {
                  id: event.locationId,
                  state: 'Not specified',
                  city: 'Not specified',
                  placeName: 'Not specified',
                  address: 'Not specified',
                  maxSeatingCapacity: 0,
                  amenities: [],
                  bookings: [],
                };
              }
            } else if (!event.location) {
              // If no location info at all, create default
              event.location = {
                id: '',
                state: 'Not specified',
                city: 'Not specified',
                placeName: 'Not specified',
                address: 'Not specified',
                maxSeatingCapacity: 0,
                amenities: [],
                bookings: [],
              };
            }
            return event;
          });

          this.paginatedEvents = this.pendingEvents;
          this.filteredEvents = this.pendingEvents;
          this.currentPage = response.currentPage || page;
          this.totalPages = response.totalPages || 1;
          this.isLoading = false;
          this.loadingService.hide();
        },
        error: (error) => {
          this.isLoading = false;
          this.loadingService.hide();
          this.pendingEvents = [];
          this.filteredEvents = [];
        },
        complete: () => {},
      });
  }

  // Called by pagination component
  onPageChange(page: number): void {
    this.loadPendingEvents(page);
  }

  // Filtering and sorting
  applyFilters(): void {
    let filtered = [...this.pendingEvents];

    // Apply category filter
    if (this.selectedCategory) {
      filtered = filtered.filter(
        (event) => event.category === this.selectedCategory
      );
    }

    this.filteredEvents = filtered;
    this.applySorting();
  }

  applySorting(): void {
    this.filteredEvents.sort((a, b) => {
      let valueA: any;
      let valueB: any;

      switch (this.sortBy) {
        case 'date':
          valueA = new Date(a.date);
          valueB = new Date(b.date);
          break;
        case 'created':
          valueA = new Date(a.createdAt);
          valueB = new Date(b.createdAt);
          break;
        case 'title':
          valueA = a.title.toLowerCase();
          valueB = b.title.toLowerCase();
          break;
        case 'category':
          valueA = (a.category || 'General').toLowerCase();
          valueB = (b.category || 'General').toLowerCase();
          break;
        default:
          return 0;
      }

      if (valueA < valueB) {
        return this.sortOrder === 'asc' ? -1 : 1;
      }
      if (valueA > valueB) {
        return this.sortOrder === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }

  // TrackBy function for ngFor performance
  trackByEventId(index: number, event: Event): string {
    return event.id;
  }

  // Event actions
  onEdit(event: Event): void {
    console.log('Editing event:', event); // Debug log
    this.eventToEdit = event;
    this.isEditOverlayVisible = true;
  }

  // Methods to handle overlay events
  onCloseEditOverlay() {
    console.log('Closing overlay'); // Debug log
    this.isEditOverlayVisible = false;
    this.eventToEdit = null;
  }

  onEventUpdated() {
    // Reload the events list after successful update
    this.loadAllData();
    this.onCloseEditOverlay();
  }

  onShowAlertFromOverlay(alertData: {
    type: string;
    title: string;
    message: string;
  }) {
    this.showAlert(alertData.type as any, alertData.title, alertData.message);
  }

  onDelete(eventId: string): void {
    this.showConfirmation(
      'Confirm Delete',
      'Are you sure you want to delete this event? This action cannot be undone.',
      () => {
        this.isLoading = true;
        this.loadingService.show();

        this.eventService
          .deleteEvent(eventId)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.showAlert(
                'success',
                'Success',
                'Event deleted successfully!'
              );
              this.loadAllData(); // Reload the list
            },
            error: (error) => {
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

  // Modal handling
  showEventDetail(event: Event): void {
    this.selectedEvent = event;
    this.isEventDetailVisible = true;
    document.body.style.overflow = 'hidden';
  }

  closeEventDetails(): void {
    this.isEventDetailVisible = false;
    this.selectedEvent = null;
    document.body.style.overflow = 'auto';
  }

  // Navigation
  goBack(): void {
    this.router.navigate(['/organizer-dashboard']);
  }

  createNewEvent(): void {
    this.router.navigate(['/organizer-dashboard'], {
      queryParams: { openCreateForm: 'true' },
    });
  }

  // Header actions
  handleHeaderAction(action: string): void {
    switch (action) {
      case 'dashboard':
        this.router.navigate(['/organizer-dashboard']);
        break;
      case 'viewMyEvents':
        this.router.navigate(['/my-created-events']);
        break;
      case 'createEvent':
        this.createNewEvent();
        break;

      case 'logout':
        this.logout();
        break;
    }
  }

  // Utility methods
  getTimeAgo(dateString: string): string {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMs = now.getTime() - date.getTime();

    const minutes = Math.floor(diffInMs / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days} day${days !== 1 ? 's' : ''} ago`;
    } else if (hours > 0) {
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    } else if (minutes > 0) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  }

  // Alert system
  showAlert(
    type: 'success' | 'error' | 'warning' | 'info',
    title: string,
    message: string,
    autoClose: boolean = true,
    duration: number = 2000
  ): void {
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
  ): void {
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

  handleAlertConfirm(): void {
    if (this.customAlert.confirmAction) {
      this.customAlert.confirmAction();
    }
    this.closeAlert();
  }

  handleAlertCancel(): void {
    if (this.customAlert.cancelAction) {
      this.customAlert.cancelAction();
    }
    this.closeAlert();
  }

  closeAlert(): void {
    this.customAlert.show = false;
    this.customAlert.confirmAction = undefined;
    this.customAlert.cancelAction = undefined;
  }

  // Logout
  logout(): void {
    this.showConfirmation(
      'Confirm Logout',
      'Are you sure you want to logout?',
      () => {
        localStorage.clear();
        sessionStorage.clear();
        this.showAlert('success', 'Success', 'You have been logged out');
        setTimeout(() => (window.location.href = '/login'), 500);
      }
    );
  }
}
