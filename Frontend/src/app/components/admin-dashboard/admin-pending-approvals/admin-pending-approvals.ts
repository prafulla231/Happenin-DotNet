// admin-pending-approvals.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { inject } from '@angular/core';
import { HeaderComponent, HeaderButton } from '../../../common/header/header';
import { FooterComponent } from '../../../common/footer/footer';
import { CustomAlertComponent } from '../../custom-alert/custom-alert';
import { ApprovalService } from '../../../services/approval';
import { AuthService } from '../../../services/auth';
import { LoadingService } from '../../loading';
import { EventService } from '../../../services/event';
import { LocationService } from '../../../services/location';
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { PaginationComponent } from '../../../common/pagination/pagination';

export interface Location {
  id: string; // This should be a GUID string
  state: string;
  city: string;
  placeName: string;
  address: string;
  maxSeatingCapacity: number;
  amenities: string[];
  bookings?: Booking[]; // This might be optional
}

export interface Booking {
  id: string; // This should be a GUID string (BookingId)
  date: string; // or Date type
  timeSlot: string;
  eventId: string; // This should be a GUID string
}

// Updated Event interface to ensure locationId is properly typed
export interface Event {
  _id?: string; // MongoDB ObjectId (if using MongoDB)
  id?: string; // Event GUID
  title: string;
  description: string;
  date: string;
  city: string;
  timeSlot: string;
  duration: string;
  location: Location; // Display name
  locationId: string; // GUID of the location - THIS IS CRITICAL
  category: string;
  price: number;
  maxRegistrations: number;
  createdBy: string;
  artist?: string;
  organization?: string;
}

export interface RegisteredUser {
  id: string;
  name: string;
  email: string;
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
  selector: 'app-pending-approvals',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    HeaderComponent,
    FooterComponent,
    CustomAlertComponent,PaginationComponent
  ],
  templateUrl: './admin-pending-approvals.html',
  styleUrls: ['./admin-pending-approvals.scss'],
})
export class PendingApprovals implements OnInit {
  private destroy$ = new Subject<void>();
  // private router = inject(Router);
  // private approvalService = inject(ApprovalService);
  // private authService = inject(AuthService);
  // private loadingService = inject(LoadingService);
  events: Event[] = [];
  filteredEvents: Event[] = [];
  selectedEvent: Event | null = null;
  showEventDetails: boolean = false;
  usersMap: { [eventId: string]: RegisteredUsersResponse } = {};
  userName: string | null = null;

   paginatedEvents: Event[] = [];
    currentPage = 1;
    totalPages = 0;
    eventsPerPage = 6; // Can be passed as `limit`
    isLoading = false;


  adminButtons: HeaderButton[] = [
    { text: 'Dashboard', action: 'dashboard' },
    // { text: 'Upcoming Events', action: 'viewAvailableEvents' },
    // { text: 'Expired Events', action: 'viewExpiredEvents' },
    { text: 'Analytics', action: 'viewAnalytics', style: 'primary' },
    { text: 'Logout', action: 'logout', style: 'primary' },
  ];

  // Custom Alert System
  customAlert: CustomAlert = {
    show: false,
    type: 'info',
    title: '',
    message: '',
    showCancel: false,
    autoClose: false,
  };

  ngOnInit(): void {
    this.loadApprovals();
  }

  handleHeaderAction(action: string): void {
    switch (action) {
      case 'dashboard':
        this.router.navigate(['/admin-dashboard']);
        break;
      // case 'viewAvailableEvents':
      //   this.router.navigate(['/admin-upcoming-events']);
      //   break;
      // case 'viewExpiredEvents':
      //   this.router.navigate(['/admin-expired-events']);
      //   break;
      case 'viewAnalytics':
        this.viewAnalytics();
        break;
      case 'logout':
        this.logout();
        break;
    }
  }

  constructor(
    private http: HttpClient,
    private loadingService: LoadingService,
    // private fb: FormBuilder,
    private authService: AuthService,
    private eventService: EventService,
    private locationService: LocationService,
    private ApprovalService: ApprovalService,
    private router: Router
  ) {
    // this.loadEvents();
    this.loadApprovals();
    // this.loadExpiredEvents();
  }

  private alertTimeout: any;

  // Custom Alert Methods
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
    this.clearAlertTimeout(); // Prevent accidental closure
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

  loadRegisteredUsers(eventId: string, callback?: () => void) {
    this.eventService
      .getRegisteredUsers(eventId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          this.usersMap[eventId] = res.data;
          if (callback) callback();
        },
        error: (error) => {
          console.error('Error loading registered users:', error);
          this.showAlert('error', 'Error', 'Failed to load registered users');
        },
      });
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

  loadApprovals(page: number = 1): void {
    this.isLoading = true;

    // Pass the page parameter to the service method
    this.eventService.getPendingPaginatedEvents(page, this.eventsPerPage).subscribe({
        next: (response) => {
            if (response && Array.isArray(response.data)) {
                this.events = (response.data as any[]).map((event) => ({
                    ...event,
                    tempCity:
                        this.extractCityFromLocationObject(event.location) ||
                        event.city ||
                        'Unknown',
                }));

                this.paginatedEvents = [...this.events];
                this.filteredEvents = [...this.events];

                this.events.forEach((event) => {
                    // Your event processing logic here
                });

                this.currentPage = response.currentPage || 1;
                this.totalPages = response.totalPages || 1;
                this.eventsPerPage = response.pageSize || this.eventsPerPage;
                this.isLoading = false;
            } else {
                this.showAlert('error', 'Invalid Response', 'Unexpected data format');
            }
        },
        error: (error) => {
            console.error('❌ Error fetching events:', error);
            this.showAlert('error', 'Load Failed', 'Failed to load events');
            this.isLoading = false;
        },
        complete: () => {
            this.isLoading = false;
        },
    });
}

   onPageChange(page: number): void {

      this.loadApprovals(page);
    }

  confirmApproveEvent(eventId: string, eventTitle: string) {
    console.log(
      'confirmApproveEvent called with eventId:',
      eventId,
      'eventTitle:',
      eventTitle
    );
    this.showConfirmation(
      'Approve Event',
      `Are you sure you want to approve "${eventTitle}"?`,
      () => this.approveEvent(eventId)
    );
  }

  confirmDenyEvent(
    eventId: string,
    eventTitle: string,
    eventDate: string,
    eventTimeSlot: string,
    eventLocationId: string
  ) {
    this.showConfirmation(
      'Deny Event',
      `Are you sure you want to deny "${eventTitle}"? This action cannot be undone.`,
      () => this.denyEvent(eventId, eventDate, eventTimeSlot, eventLocationId)
    );
  }

  approveEvent(eventId: string) {
    console.log('approveEvent called with eventId:', eventId);
    const eventToApprove = this.events.find((e) => e.id === eventId);
    console.log('eventToApprove:', eventToApprove);

    if (!eventToApprove) {
      this.showAlert(
        'error',
        'Event Not Found',
        'The event could not be found.'
      );
      return;
    }

    // Use id for eventId if available
    const idToSend = eventToApprove.id || eventId;
    console.log('Calling ApprovalService.approveEvent with id:', idToSend);
    this.ApprovalService.approveEvent(idToSend).subscribe({
      next: () => {
        this.loadApprovals();
        this.showAlert(
          'success',
          'Event Approved',
          `Event "${eventToApprove.title}" has been approved successfully!`
        );
      },
      error: (err) => {
        console.error('Approval failed:', err);
        this.showAlert(
          'error',
          'Approval Failed',
          'Failed to approve the event. Please try again.'
        );
      },
    });
  }

  private isValidGuid(guid: string): boolean {
    const guidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return guidRegex.test(guid);
  }

  denyEvent(
    eventId: string,
    eventDate: string,
    eventTimeSlot: string,
    eventLocationId: string // Now expecting the locationId instead of location name
  ) {
    const eventToDeny = this.events.find(
      (e) => e._id === eventId || e.id === eventId
    );
    const eventTitle = eventToDeny ? eventToDeny.title : 'Unknown Event';

    // Validate that we have a proper GUID for locationId
    if (!eventLocationId || !this.isValidGuid(eventLocationId)) {
      this.showAlert(
        'error',
        'Invalid Location',
        'Location ID is missing or invalid. Cannot cancel booking.'
      );
      return;
    }

    const cancelData = {
      locationId: eventLocationId, // Now using the actual GUID
      bookingId: eventId, // Assuming eventId is the bookingId
    };

    this.locationService.cancelBooking(cancelData).subscribe({
      next: (cancelRes) => {
        this.ApprovalService.denyEvent(eventId).subscribe({
          next: (res) => {
            this.loadApprovals();
            this.showAlert(
              'success',
              'Event Denied',
              `Event "${eventTitle}" has been denied and removed.`
            );
          },
          error: (err) => {
            console.error('Deny failed:', err);
            this.showAlert(
              'error',
              'Deny Failed',
              'Failed to deny the event. Please try again.'
            );
          },
        });
      },
      error: (cancelErr) => {
        console.error('Cancel booking failed:', cancelErr);
        this.showAlert(
          'error',
          'Cancellation Failed',
          'Could not cancel booking. Event denial aborted.'
        );
      },
    });
  }

  extractStartEndTime(timeSlot: string, eventDate: string | Date) {
    try {
      if (!eventDate || !timeSlot) {
        throw new Error('Missing eventDate or timeSlot');
      }

      const dateString =
        typeof eventDate === 'string'
          ? eventDate.substring(0, 10)
          : eventDate.toISOString().substring(0, 10);

      const timeParts: string[] = timeSlot.split(' - ').map((t) => t.trim());
      if (timeParts.length !== 2) {
        throw new Error('Invalid timeSlot format');
      }

      const [startTimeStr, endTimeStr]: [string, string] = [
        timeParts[0],
        timeParts[1],
      ];

      const startIST: Date = new Date(`${dateString}T${startTimeStr}:00+05:30`);
      const endIST: Date = new Date(`${dateString}T${endTimeStr}:00+05:30`);

      const startTime: string = startIST.toISOString();
      const endTime: string = endIST.toISOString();

      return { startTime, endTime };
    } catch (err: any) {
      console.error('Extraction failed:', err.message);
      return { startTime: null, endTime: null };
    }
  }

  showEventDetail(event: Event): void {
    this.selectedEvent = event;
    this.showEventDetails = true;
  }

  closeEventDetails(): void {
    this.showEventDetails = false;
    this.selectedEvent = null;
  }

  hideAlert(): void {
    this.customAlert.show = false;
  }

  viewAnalytics(): void {
    // Implement analytics navigation
    this.router.navigate(['/admin-analytics']);
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
