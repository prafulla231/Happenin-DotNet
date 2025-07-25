// user-dashboard.ts
import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import jsPDF from 'jspdf';
import { LoadingService } from '../loading';
import { LocationService } from '../../services/location';
import { ApprovalService } from '../../services/approval';
import { AuthService } from '../../services/auth';
import { EventService } from '../../services/event';
import { environment } from '../../../environment';
import { EmailService } from '../../services/email.service';
import { Router } from '@angular/router';
import { Contact } from '../contact/contact';
import { HeaderComponent, HeaderButton } from '../../common/header/header';
import { FooterComponent } from '../../common/footer/footer';
import { CustomAlertComponent } from '../custom-alert/custom-alert';
import { PaginationComponent } from '../../common/pagination/pagination';

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  timeSlot: string;
  duration: string;
  city: string;
  tempCity: string;

  location: string;
  category: string;
  price: number;
  maxRegistrations: number;
  createdBy: string;
  artist?: string;
  organization?: string;
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
  selector: 'app-user-dashboard',
  standalone: true,
  // imports: [CommonModule, RouterModule, FormsModule,ReactiveFormsModule, HeaderComponent, FooterComponent, CustomAlertComponent,PaginationComponent,EventFilter],
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    HeaderComponent,
    FooterComponent,
    CustomAlertComponent,
    PaginationComponent,
    // MyRegisteredEvents,
  ],
  templateUrl: './user-dashboard.html',
  styleUrls: ['./user-dashboard.scss'],
})
export class UserDashboardComponent implements OnDestroy {
  events: Event[] = [];
  filteredEvents: Event[] = [];
  userId: string | null = null;
  userName: string | null = null;
  registeredEvents: Event[] = [];
  selectedEvent: Event | null = null;
  showEventDetails: boolean = false;
  userEmail: string | null = null;
  availableCiti: string[] = [
    'Mumbai',
    'Pune',
    'Nagpur',
    'Nashik',
    'Thane',
    'Ahmedabad',
    'Surat',
    'Vadodara',
    'Rajkot',
    'Bhavnagar',
    'Bengaluru',
    'Mysuru',
    'Hubli',
    'Mangaluru',
    'Belagavi',
    'Chennai',
    'Coimbatore',
    'Madurai',
    'Tiruchirappalli',
    'Jaipur',
    'Udaipur',
    'Jodhpur',
    'Ajmer',
    'Kota',
    'New Delhi',
    'Central Delhi',
    'North Delhi',
    'South Delhi',
    'Lucknow',
    'Kanpur',
    'Varanasi',
    'Agra',
    'Noida',
  ];

  private searchTimeout: any;
  // tempCity: string = '';

  //  userName = 'John Doe';
  //  Math = Math;

  get displayUserName(): string {
    return this.userName || 'Guest';
  }
  // tempcity: string ='';

  headerButtons: HeaderButton[] = [
    { text: 'Available Events', action: 'scrollToAvailableEvents' },
    { text: 'My Events', action: 'scrollToRegisteredEvents' },
    { text: 'Contact', action: 'openContact' },
    { text: 'Logout', action: 'logout', style: 'primary' },
  ];

  handleHeaderAction(action: string): void {
    switch (action) {
      case 'scrollToAvailableEvents':
        this.scrollToAvailableEvents();
        break;
      case 'scrollToRegisteredEvents':
        this.router.navigate(['/my-registered-events']);
        break;
      case 'openContact':
        this.openContact();
        break;
      case 'logout':
        this.logout();
        break;
    }
  }

  // Custom Alert System
  customAlert: CustomAlert = {
    show: false,
    type: 'info',
    title: '',
    message: '',
    showCancel: false,
  };

  // Filters
  searchQuery = '';
  selectedCategory = '';
  selectedCity = '';
  dateFrom = '';
  dateTo = '';
  selectedPriceRange = '';
  sortBy = 'date';

  availableCategories: string[] = [];
  //availableCities: string[] = [];
  isMobileMenuOpen = false;

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

  // Pagination properties
  paginatedEvents: Event[] = [];
  currentPage = 1;
  totalPages = 0;
  eventsPerPage = 6; // Can be passed as `limit`
  isLoading = false;

  constructor(
    private http: HttpClient,
    private router: Router,
    private loadingService: LoadingService,
    private authService: AuthService,
    private eventService: EventService,
    private locationService: LocationService,
    private ApprovalService: ApprovalService,
    private emailService: EmailService
  ) {
    this.showFilters = false;
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Decode token first, then fetch events
    this.decodeToken();

    // Add a small delay to ensure token decoding completes
    setTimeout(() => {
      this.fetchEvents(this.currentPage);
      this.loadRegisteredEvents();
    }, 100);
  }
  showFilters: boolean = false;
  // Custom Alert Methods
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

    // Auto-close after specified duration
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

  copyEventToClipboard() {
    if (!this.selectedEvent) return;

    const event = this.selectedEvent;
    const details = `🎉 YOU'RE INVITED! 🎉
              📌 ${event.title.toUpperCase()} (${event.category || 'Event'})
              📝 ${event.description}

              📅 DATE: ${new Date(event.date).toDateString()}
              ⏰ TIME: ${event.timeSlot}
              🕒 DURATION: ${event.duration}
              📍 LOCATION: ${event.location}
              💰 ENTRY FEE: ₹${event.price}
              👥 MAX ATTENDEES: ${event.maxRegistrations}
              ${event.artist ? '🎭 ARTIST: ' + event.artist : ''}
              ${
                event.organization
                  ? '🏢 ORGANIZED BY: ' + event.organization
                  : ''
              }

              ✨ DON'T MISS OUT ON THIS AMAZING EVENT!
              👉 JOIN ME FOR AN UNFORGETTABLE EXPERIENCE!`;

    navigator.clipboard
      .writeText(details)
      .then(() => {
        // alert('Event details copied to clipboard and ready to share!');
        this.showAlert(
          'success',
          'Event copied',
          'Event details copied to clipboard and ready to share!'
        );
      })
      .catch((err) => {
        console.error('Failed to copy: ', err);
      });
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

  onConfirmAction() {
    if (this.customAlert.confirmAction) {
      this.customAlert.confirmAction();
    }
    this.closeAlert();
  }

  onCancelAction() {
    if (this.customAlert.cancelAction) {
      this.customAlert.cancelAction();
    }
    this.closeAlert();
  }

  getMaxValue(a: number, b: number): number {
    return Math.min(a, b);
  }

  scrollToEventsSection() {
    const eventsSection = document.querySelector('.events-section');
    if (eventsSection) {
      eventsSection.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  }

  toggleFilters(): void {
    this.showFilters = !this.showFilters;
  }

  openContact() {
    this.router.navigate(['/contact']);
  }

  loadRegisteredEvents() {
    if (!this.userId) return;
    this.eventService.getRegisteredEvents(this.userId).subscribe({
      next: (res) => {
        this.registeredEvents = res;
      },
      error: (err) => {
        console.error('Error loading registered events', err);
        this.showAlert(
          'error',
          'Loading Failed',
          'Failed to load your registered events.'
        );
      },
    });
  }

  fetchEvents(page: number = 1): void {
    this.isLoading = true;

    this.eventService.getPaginatedEvents(page, this.eventsPerPage).subscribe({
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

          console.log('Fetched events:', this.events);

          this.paginatedEvents = [...this.events];
          this.filteredEvents = [...this.events];

          this.applySorting();

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

  fetchEventsWithFilters(page: number = 1, filters: any = {}): void {
    this.isLoading = true;

    this.eventService
      .getPaginatedEvents(page, this.eventsPerPage, filters)
      .subscribe({
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

            this.currentPage = response.currentPage || 1;
            this.totalPages = response.totalPages || 1;
            this.eventsPerPage = response.pageSize || this.eventsPerPage;
          } else {
            this.showAlert(
              'error',
              'Invalid Response',
              'Unexpected data format'
            );
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

  registerForEvent(eventId: string) {
    // Validate that we have a user ID
    if (!this.userId) {
      console.error('No user ID available');
      this.showAlert(
        'error',
        'Authentication Error',
        'Please log in again to register for events.'
      );
      return;
    }

    // Validate event ID
    if (!eventId) {
      console.error('No event ID provided');
      this.showAlert('error', 'Invalid Event', 'Invalid event selected.');
      return;
    }

    const event = this.events.find((e) => e.id === eventId);
    const eventTitle = event ? event.title : 'this event';

    if (event) {
      // console.log('Event found:', event);
    }

    this.showConfirmation(
      'Register for Event',
      `Are you sure you want to register for "${eventTitle}"?`,
      () => {
        this.eventService.registerForEvent(this.userId!, eventId).subscribe({
          next: (response) => {
            this.loadRegisteredEvents();
            this.sendRegistrationEmail(event!);
            this.showAlert(
              'success',
              'Registration Successful',
              `You have successfully registered for "${eventTitle}"!`
            );
            this.showAlert(
              'info',
              'Email Sent',
              'A confirmation email with your ticket has been sent to your email address.'
            );
          },
          error: (err) => {
            console.error('Registration failed:', err);
            this.loadingService.hide();

            let errorMessage =
              'Failed to register for the event. Please try again.';

            // Handle specific error cases
            if (err.status === 404) {
              if (err.error?.message === 'User not found') {
                errorMessage =
                  'Your account was not found. Please log in again.';
                this.logout();
              } else if (err.error?.message === 'Event not found or deleted') {
                errorMessage = 'This event is no longer available.';
              }
            } else if (err.status === 400) {
              if (
                err.error?.message === 'User already registered for this event'
              ) {
                errorMessage = 'You are already registered for this event.';
              } else if (err.error?.message === 'Event registration full') {
                errorMessage = 'Sorry, this event is full.';
              } else if (err.error?.message) {
                errorMessage = err.error.message;
              }
            } else if (err.status === 0) {
              errorMessage =
                'Network error. Please check your connection and try again.';
            }

            this.showAlert('error', 'Registration Failed', errorMessage);
          },
        });
      }
    );
  }

  private sendRegistrationEmail(event: Event) {
    // Check if we have user email
    if (!this.userEmail) {
      console.warn('No user email available for sending confirmation');
      return;
    }

    const emailRequest = {
      userId: this.userId || 'anonymous',
      eventId: event.id,
      userEmail: this.userEmail,
      userName: this.userName || 'Guest',
      sendPDF: true, // Send PDF ticket attachment
      sendDetails: true, // Send event details in email body
    };

    this.emailService.sendTicketEmail(emailRequest).subscribe({
      next: (response) => {
        // Email sent successfully - already showing success message in registerForEvent
      },
      error: (err) => {
        console.error('Failed to send confirmation email:', err);
      },
    });
  }

  extractFilterOptions() {
    this.availableCategories = [
      ...new Set(this.events.map((e) => e.category).filter(Boolean)),
    ].sort();

    this.availableCiti = [
      ...new Set(
        this.events
          .map((e) => this.extractCityFromLocation(e.city))
          .filter(Boolean)
      ),
    ].sort();
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

  decodeToken() {
    // console.log('=== TOKEN DECODE START ===');
    const token =
      localStorage.getItem('token') || sessionStorage.getItem('token');
    // console.log('Token found:', !!token);

    if (!token) {
      console.log('No token found');
      return;
    }

    try {
      const parts = token.split('.');

      if (parts.length !== 3) {
        throw new Error('Invalid token format');
      }

      const payloadBase64 = parts[1];

      const decoded = JSON.parse(atob(payloadBase64));
      // console.log('Decoded token payload:', decoded);

      this.userId = decoded.userId || decoded.id || null;
      this.userName = decoded.userName || decoded.name || null;
      this.userEmail = decoded.userEmail || decoded.email || null;
    } catch (err) {
      console.error('Token decode error:', err);
      this.userId = null;
      this.userName = null;
      this.userEmail = null;
      this.showAlert(
        'warning',
        'Session Warning',
        'There was an issue with your session. Please log in again if needed.'
      );
    }
  }

  isRegistered(eventId: string): boolean {
    return this.registeredEvents.some((e) => e.id === eventId);
  }

  // Filter logic
  onSearchChange() {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    this.searchTimeout = setTimeout(() => {
      this.onFilterChange();
    }, 300);
  }

  ngOnDestroy() {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
  }

  onPageChange(page: number): void {
    if (this.hasActiveFilters()) {
      const filters = {
        searchQuery: this.searchQuery,
        category: this.selectedCategory,
        city: this.selectedCity,
        dateFrom: this.dateFrom,
        dateTo: this.dateTo,
        sortBy: this.sortBy,
      };
      this.fetchEventsWithFilters(page, filters);
    } else {
      this.fetchEvents(page);
    }
  }

  applyPriceFilter(events: Event[]): Event[] {
    switch (this.selectedPriceRange) {
      case '0-500':
        return events.filter((e) => e.price <= 500);
      case '500-1000':
        return events.filter((e) => e.price > 500 && e.price <= 1000);
      case '1000-2000':
        return events.filter((e) => e.price > 1000 && e.price <= 2000);
      case '2000+':
        return events.filter((e) => e.price > 2000);
      default:
        return events;
    }
  }

  applySorting() {
    this.filteredEvents.sort((a, b) => {
      switch (this.sortBy) {
        case 'date':
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case 'title':
          return a.title.localeCompare(b.title);
        case 'price':
          return a.price - b.price;
        case 'category':
          return (a.category || '').localeCompare(b.category || '');
        default:
          return 0;
      }
    });
  }
  onFilterChange() {
    this.currentPage = 1;
    const filters = {
      searchQuery: this.searchQuery,
      category: this.selectedCategory,
      city: this.selectedCity,
      dateFrom: this.dateFrom,
      dateTo: this.dateTo,
      sortBy: this.sortBy,
    };
    this.fetchEventsWithFilters(1, filters);
  }
  clearFilters() {
    this.searchQuery = '';
    this.selectedCategory = '';
    this.selectedCity = '';
    this.dateFrom = '';
    this.dateTo = '';
    this.selectedPriceRange = '';
    this.sortBy = 'date';
    this.onFilterChange(); // Use server-side filtering
    this.showAlert('info', 'Filters Cleared', 'All filters have been reset.');
  }

  clearSearch() {
    this.clearFilters();

    // Clear any pending search timeout
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    this.currentPage = 1; // Reset to first page
    this.fetchEvents(1); // Fetch fresh data from server
  }

  hasActiveFilters(): boolean {
    return !!(
      this.searchQuery ||
      this.selectedCategory ||
      this.selectedCity ||
      this.dateFrom ||
      this.dateTo ||
      this.selectedPriceRange
    );
  }

  formatDateRange(): string {
    return this.dateFrom && this.dateTo
      ? `${this.formatDate(this.dateFrom)} - ${this.formatDate(this.dateTo)}`
      : this.dateFrom
      ? `From ${this.formatDate(this.dateFrom)}`
      : this.dateTo
      ? `Until ${this.formatDate(this.dateTo)}`
      : '';
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  formatPriceRange(): string {
    switch (this.selectedPriceRange) {
      case '0-500':
        return 'Free - ₹500';
      case '500-1000':
        return '₹500 - ₹1000';
      case '1000-2000':
        return '₹1000 - ₹2000';
      case '2000+':
        return '₹2000+';
      default:
        return '';
    }
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

  scrollToAvailableEvents() {
    const availableSection = document.querySelector('.events-section');
    if (availableSection) {
      availableSection.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  }

  logout() {
    this.showConfirmation(
      'Confirm Logout',
      'Are you sure you want to logout? You will need to login again to access your dashboard.',
      () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        sessionStorage.clear();
        window.location.href = '/';
      }
    );
  }
}
