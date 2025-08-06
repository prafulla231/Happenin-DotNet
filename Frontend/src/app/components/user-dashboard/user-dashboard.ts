/**
 * User Dashboard component for displaying, filtering, and registering for events.
 * Handles user authentication, event registration, filtering, pagination, and custom alerts.
 * Integrates with services for events, locations, approvals, authentication, email, and loading.
 * Provides UI logic for event details, clipboard sharing, and navigation.
 */
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

/**
 * Event interface representing the structure of an event object.
 */
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

/**
 * CustomAlert interface for alert dialog configuration.
 */
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

/**
 * UserDashboardComponent displays available events, allows registration, filtering, and manages user session.
 */
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
  /** List of all events fetched from the server */
  events: Event[] = [];
  /** List of events after applying filters */
  filteredEvents: Event[] = [];
  /** Current user's ID */
  userId: string | null = null;
  /** Current user's name */
  userName: string | null = null;
  /** Events the user has registered for */
  registeredEvents: Event[] = [];
  /** Currently selected event for details view */
  selectedEvent: Event | null = null;
  /** Flag to show/hide event details modal */
  showEventDetails: boolean = false;
  /** Current user's email */
  userEmail: string | null = null;
  /** List of available cities for filtering */
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

  /** Timeout handler for search debounce */
  private searchTimeout: any;

  /** Returns the display name for the user */
  get displayUserName(): string {
    return this.userName || 'Guest';
  }

  /** Header navigation buttons configuration */
  headerButtons: HeaderButton[] = [
    { text: 'Available Events', action: 'scrollToAvailableEvents' },
    { text: 'My Events', action: 'scrollToRegisteredEvents' },
    { text: 'Contact', action: 'openContact' },
    { text: 'Logout', action: 'logout', style: 'primary' },
  ];

  /**
   * Handles header button actions.
   * @param action Action string from header button
   */
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

  /** Custom alert dialog configuration */
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

  /** List of available categories for filtering */
  availableCategories: string[] = [];
  /** Flag for mobile menu state */
  isMobileMenuOpen = false;

  /** List of event categories */
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
  /** Events to display on current page */
  paginatedEvents: Event[] = [];
  /** Current page number */
  currentPage = 1;
  /** Total number of pages */
  totalPages = 0;
  /** Total number of pages */
  eventsPerPage = 6; // Can be passed as `limit`
  /** Loading state flag */
  isLoading = false;

  /**
   * Constructor injects required services and initializes dashboard.
   */
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
  /** Flag to show/hide filters section */
  showFilters: boolean = false;

  // Custom Alert Methods
  /**
   * Shows a custom alert dialog.
   * @param type Alert type
   * @param title Alert title
   * @param message Alert message
   * @param autoClose Auto-close flag
   * @param duration Duration before auto-close
   */
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

  /**
   * Shows a confirmation dialog with actions.
   * @param title Dialog title
   * @param message Dialog message
   * @param confirmAction Action on confirm
   * @param cancelAction Action on cancel
   */
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

  /**
   * Copies selected event details to clipboard.
   */
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

  /** Handles confirmation action for alert dialog */
  handleAlertConfirm() {
    if (this.customAlert.confirmAction) {
      this.customAlert.confirmAction();
    }
    this.closeAlert();
  }

  /** Handles cancel action for alert dialog */
  handleAlertCancel() {
    if (this.customAlert.cancelAction) {
      this.customAlert.cancelAction();
    }
    this.closeAlert();
  }

  /** Closes the custom alert dialog */
  closeAlert() {
    this.customAlert.show = false;
    this.customAlert.confirmAction = undefined;
    this.customAlert.cancelAction = undefined;
  }

  /** Handles confirm action for alert dialog */
  onConfirmAction() {
    if (this.customAlert.confirmAction) {
      this.customAlert.confirmAction();
    }
    this.closeAlert();
  }

  /** Handles cancel action for alert dialog */
  onCancelAction() {
    if (this.customAlert.cancelAction) {
      this.customAlert.cancelAction();
    }
    this.closeAlert();
  }

  /**
   * Returns the minimum of two numbers.
   * @param a First number
   * @param b Second number
   */
  getMaxValue(a: number, b: number): number {
    return Math.min(a, b);
  }

  /** Scrolls to the events section in the view */
  scrollToEventsSection() {
    const eventsSection = document.querySelector('.events-section');
    if (eventsSection) {
      eventsSection.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  }

  /** Toggles the filters section visibility */
  toggleFilters(): void {
    this.showFilters = !this.showFilters;
  }

  /** Navigates to the contact page */
  openContact() {
    this.router.navigate(['/contact']);
  }

  /**
   * Loads events the user has registered for.
   */
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

  /**
   * Fetches paginated events from the server.
   * @param page Page number
   */
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

          // console.log('Fetched events:', this.events);

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

  /**
   * Fetches paginated events with applied filters.
   * @param page Page number
   * @param filters Filter object
   */
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

  /**
   * Registers the user for an event.
   * @param eventId Event ID
   */
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
    this.loadingService.show();
    this.showConfirmation(
      'Register for Event',
      `Are you sure you want to register for "${eventTitle}"?`,
      () => {
        this.eventService.registerForEvent(this.userId!, eventId).subscribe({
          next: (response) => {
            this.loadingService.hide();
            // this.loadRegisteredEvents();
            const registeredEvent = this.events.find((e) => e.id === eventId);
            if (
              registeredEvent &&
              !this.registeredEvents.some((e) => e.id === eventId)
            ) {
              this.registeredEvents.push(registeredEvent);
            }
            // this.sendRegistrationEmail(event!);

            this.showAlert(
              'success',
              'Registration Successful',
              `You have successfully registered for "${eventTitle}"! A confirmation email will be sent shortly.`
            );
            setTimeout(() => {
              this.sendRegistrationEmail(event!);
            }, 100);
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

  /**
   * Sends registration confirmation email with ticket PDF.
   * @param event Event object
   */
  private sendRegistrationEmail(event: Event) {
    // Check if we have user email

    if (!this.userEmail) {
      console.warn('No user email available for sending confirmation');
      return;
    }

    const pdfBase64 = this.emailService.generateTicketPDFBase64(
      event,
      this.userName || 'Guest'
    );

    const emailRequest = {
      userId: this.userId || 'anonymous',
      eventId: event.id,
      userEmail: this.userEmail,
      userName: this.userName || 'Guest',
      sendPDF: true, // Send PDF ticket attachment
      sendDetails: true, // Send event details in email body
      pdfBase64,
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

  /**
   * Extracts available filter options from events.
   */
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

  /**
   * Extracts city name from a location string.
   * @param location Location string
   */
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

  /**
   * Extracts city name from a location object or string.
   * @param location Location object or string
   */
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

  /**
   * Returns the full address from a location object or string.
   * @param location Location object or string
   */
  getFullAddress(location: any): string {
    if (!location) return '';

    if (typeof location === 'string') {
      return location;
    }

    if (typeof location === 'object') {
      // Customize this based on your location object structure
      return `${location.address || ''}, ${location.city || ''}, ${
        location.state || ''
      }, ${location.country || ''}`
        .replace(/,\s*,/g, ',')
        .replace(/^,\s*/, '')
        .replace(/,\s*$/, '');
    }

    return JSON.stringify(location);
  }

  /**
   * Decodes JWT token to extract user information.
   */
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
      console.log('Decoded token payload:', decoded);

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

  /**
   * Checks if the user is registered for a given event.
   * @param eventId Event ID
   */
  isRegistered(eventId: string): boolean {
    return this.registeredEvents.some((e) => e.id === eventId);
  }

  // Filter logic
  /**
   * Handles search input change with debounce.
   */
  onSearchChange() {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    this.searchTimeout = setTimeout(() => {
      this.onFilterChange();
    }, 300);
  }

  /**
   * Angular lifecycle hook for cleanup.
   */
  ngOnDestroy() {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
  }

  /**
   * Handles page change for pagination.
   * @param page Page number
   */
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

  /**
   * Applies price filter to events.
   * @param events List of events
   */
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

  /**
   * Applies sorting to filtered events.
   */
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

  /**
   * Handles filter change and fetches filtered events.
   */
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

  /**
   * Clears all filters and resets events.
   */
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

  /**
   * Clears search and filters, resets pagination.
   */
  clearSearch() {
    this.clearFilters();

    // Clear any pending search timeout
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    this.currentPage = 1; // Reset to first page
    this.fetchEvents(1); // Fetch fresh data from server
  }

  /**
   * Checks if any filters are active.
   */
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

  /**
   * Formats the date range for display.
   */
  formatDateRange(): string {
    return this.dateFrom && this.dateTo
      ? `${this.formatDate(this.dateFrom)} - ${this.formatDate(this.dateTo)}`
      : this.dateFrom
      ? `From ${this.formatDate(this.dateFrom)}`
      : this.dateTo
      ? `Until ${this.formatDate(this.dateTo)}`
      : '';
  }

  /**
   * Formats a date string for display.
   * @param date Date string
   */
  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  /**
   * Formats the selected price range for display.
   */
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

  /**
   * Shows event details modal for a selected event.
   * @param event Event object
   */
  showEventDetail(event: Event) {
    this.selectedEvent = event;
    this.showEventDetails = true;
    document.body.style.overflow = 'hidden';
  }

  /** Closes the event details modal */
  closeEventDetails() {
    this.showEventDetails = false;
    this.selectedEvent = null;
    document.body.style.overflow = 'auto';
  }

  /** Scrolls to the available events section */
  scrollToAvailableEvents() {
    const availableSection = document.querySelector('.events-section');
    if (availableSection) {
      availableSection.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  }

  /**
   * Logs out the user and clears session.
   */
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
