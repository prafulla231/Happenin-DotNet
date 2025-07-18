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

export interface Event {
  _id: string;
  title: string;
  description: string;
  date: string;
  city: string;
  timeSlot: string;
  duration: string;
  location: string;
  category: string;
  price: number;
  maxRegistrations: number;
  createdBy: string;
  artist?: string;
  organization?: string;
}

export interface RegisteredUser {
  userId: string;
  name: string;
  email: string;
  _id: string;
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
    CustomAlertComponent,
  ],
  templateUrl: './admin-pending-approvals.html',
  styleUrls: ['./admin-pending-approvals.scss'],
})
export class PendingApprovals implements OnInit {
  // private router = inject(Router);
  // private approvalService = inject(ApprovalService);
  // private authService = inject(AuthService);
  // private loadingService = inject(LoadingService);
  eventsone: Event[] = [];
  filteredEventsone: Event[] = [];
  selectedEvent: Event | null = null;
  showEventDetails: boolean = false;
  usersMap: { [eventId: string]: RegisteredUsersResponse } = {};
  userName: string | null = null;

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

  loadRegisteredUsers(eventId: string) {
    this.eventService.getRegisteredUsers(eventId).subscribe({
      next: (res) => (this.usersMap[eventId] = res.data),
      error: (err) => console.error('Error loading users for event', err),
    });
  }

  loadApprovals(): void {
    this.loadingService.show();

    this.ApprovalService.viewApprovalRequests().subscribe({
      next: (res: { data: Event[] }) => {
        this.eventsone = res.data;
        this.filteredEventsone = [...this.eventsone];
        // this.extractFilterOptions();
        // this.applySorting();

        res.data.forEach((event: Event) => this.loadRegisteredUsers(event._id));

        this.loadingService.hide();

        if (res.data.length > 0) {
          this.showAlert(
            'info',
            'Pending Approvals',
            `${res.data.length} events are waiting for approval.`
          );
        }
      },
      error: (err: any) => {
        console.error('Error loading events', err);
        this.loadingService.hide();
        this.showAlert(
          'error',
          'Loading Failed',
          'Failed to load pending events. Please try again later.'
        );
      },
    });
  }

  confirmApproveEvent(eventId: string, eventTitle: string) {
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
    eventLocation: string
  ) {
    this.showConfirmation(
      'Deny Event',
      `Are you sure you want to deny "${eventTitle}"? This action cannot be undone.`,
      () => this.denyEvent(eventId, eventDate, eventTimeSlot, eventLocation)
    );
  }

  approveEvent(eventId: string) {
    const eventToApprove = this.eventsone.find((e) => e._id === eventId);

    if (!eventToApprove) {
      this.showAlert(
        'error',
        'Event Not Found',
        'The event could not be found.'
      );
      return;
    }

    return this.ApprovalService.approveEvent(eventToApprove).subscribe({
      next: (res) => {
        this.loadApprovals();
        // this.loadEvents();
        this.showAlert(
          'success',
          'Event Approved',
          `Event "${eventToApprove.title}" has been approved successfully!`
        );
        // console.log('Approved:', res);
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

  denyEvent(
    eventId: string,
    eventDate: string,
    eventTimeSlot: string,
    eventLocation: string
  ) {
    const eventToDeny = this.eventsone.find((e) => e._id === eventId);
    const eventTitle = eventToDeny ? eventToDeny.title : 'Unknown Event';

    const { startTime, endTime } = this.extractStartEndTime(
      eventTimeSlot,
      eventDate
    );

    let cancelData = { eventLocation, startTime, endTime };

    this.locationService.cancelBooking(cancelData).subscribe({
      next: (cancelRes) => {
        // Proceed only if cancelBooking is successful
        this.ApprovalService.denyEvent(eventId).subscribe({
          next: (res) => {
            this.loadApprovals();
            // this.loadExpiredEvents();
            // this.loadEvents();
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
