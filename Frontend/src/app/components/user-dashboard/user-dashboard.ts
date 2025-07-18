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
// import { EventFilter } from '../../common/event-filter/event-filter';
// import { MyRegisteredEvents } from './my-registered-events/my-registered-events';

export interface Event {
  _id: string;
  title: string;
  description: string;
  date: string;
  timeSlot: string;
  duration: string;
  city: string;

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

  //  userName = 'John Doe';
  //  Math = Math;

  get displayUserName(): string {
    return this.userName || 'Guest';
  }

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
    this.decodeToken();
    // this.loadAllEvents();
    this.fetchEvents(this.currentPage);
    this.loadRegisteredEvents();
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

  //   loadAllEvents() {
  //   this.loadingService.show();
  //   this.eventService.getUpcomingEvents().subscribe({
  //     next: (res) => {
  //       this.events = res;
  //       this.filteredEvents = [...this.events];
  //       this.extractFilterOptions();
  //       this.applySorting();
  //       this.calculatePagination(); // Add this line
  //       this.loadingService.hide();
  //       this.showAlert('success', 'Events Loaded', 'Successfully loaded all available events!');
  //     },
  //     error: (err) => {
  //       console.error('Error loading events', err);
  //       this.loadingService.hide();
  //       this.showAlert('error', 'Loading Failed', 'Failed to load events. Please try again later.');
  //     }
  //   });
  // }

  // fetchEvents(page: number) {
  //   this.isLoading = true;

  // //     const filters = {
  // //   search: this.searchQuery.trim(),
  // //   category: this.selectedCategory,
  // //   city: this.selectedCity,
  // //   fromDate: this.dateFrom,
  // //   toDate: this.dateTo,
  // //   priceRange: this.selectedPriceRange,
  // //   sortBy: this.sortBy
  // // };

  //   this.eventService.getPaginatedEvents(page, this.eventsPerPage).subscribe({
  //     next: (response) => {
  //       this.events = response.data.events;
  //       this.paginatedEvents = response.data.events;
  //       console.log('Fetched events:', this.paginatedEvents);
  //       this.filteredEvents = [...this.events]
  //       console.log('Filtered events:', this.filteredEvents);
  //       const pagination = response.data.pagination;
  //       this.extractFilterOptions();
  //   this.applySorting();

  //       this.currentPage = pagination.currentPage;
  //       this.totalPages = pagination.totalPages;
  //       this.eventsPerPage = pagination.perPage;
  //       console.log('Current Page:', this.currentPage);
  //       console.log('Total Pages:', this.totalPages);
  //       console.log('Events Per Page:', this.eventsPerPage);
  //     },
  //     error: (error) => {
  //       console.error('Error fetching events:', error);
  //     },
  //     complete: () => {
  //       this.isLoading = false;
  //     }
  //   });
  // }
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
    const filters: any = {};
    if (this.searchQuery?.trim()) {
      filters.search = this.searchQuery.trim();
    }
    if (this.selectedCategory) {
      filters.category = this.selectedCategory;
    }
    if (this.selectedCity) {
      filters.city = this.selectedCity;
    }
    if (this.dateFrom) {
      filters.fromDate = this.dateFrom;
    }
    if (this.dateTo) {
      filters.toDate = this.dateTo;
    }
    if (this.selectedPriceRange) {
      filters.priceRange = this.selectedPriceRange;
    }
    this.eventService
      .getPaginatedEvents(page, this.eventsPerPage, filters)
      .subscribe({
        next: (response) => {
          this.events = response.data.events;
          this.paginatedEvents = response.data.events;
          this.filteredEvents = [...this.events];
          this.applySorting();
          const pagination = response.data.pagination;
          this.currentPage = pagination.currentPage;
          this.totalPages = pagination.totalPages;
          this.eventsPerPage = pagination.perPage;
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

    const event = this.events.find((e) => e._id === eventId);
    const eventTitle = event ? event.title : 'this event';

    if (event) {
      // console.log('Event found:', event);
    }

    this.showConfirmation(
      'Register for Event',
      `Are you sure you want to register for "${eventTitle}"?`,
      () => {
        // this.loadingService.show();

        // Use the service method
        this.eventService.registerForEvent(this.userId!, eventId).subscribe({
          next: (response) => {
            // IMPORTANT: Reload registered events to update the UI
            this.loadRegisteredEvents();

            // Send confirmation email after successful registration
            this.sendRegistrationEmail(event!);

            // this.loadingService.hide();
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
                this.logout(); // Force logout if user not found
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
      eventId: event._id,
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

  // deregister(userId: string, eventId: string) {
  //   const event = this.registeredEvents.find((e) => e._id === eventId);
  //   const eventTitle = event ? event.title : 'this event';

  //   this.showConfirmation(
  //     'Confirm Deregistration',
  //     `Are you sure you want to deregister from "${eventTitle}"? This action cannot be undone.`,
  //     () => {
  //       this.loadingService.show();

  //       this.eventService.deregisterFromEvent(userId, eventId).subscribe({
  //         next: () => {
  //           this.loadRegisteredEvents();
  //           this.loadingService.hide();
  //           this.showAlert(
  //             'success',
  //             'Deregistration Successful',
  //             `You have been deregistered from "${eventTitle}".`
  //           );
  //         },
  //         error: (err) => {
  //           console.error('Deregistration failed', err);
  //           this.loadingService.hide();
  //           this.showAlert(
  //             'error',
  //             'Deregistration Failed',
  //             'Failed to deregister from the event. Please try again.'
  //           );
  //         },
  //       });
  //     },
  //     () => {
  //       this.showAlert(
  //         'info',
  //         'Deregistration Cancelled',
  //         'You remain registered for the event.'
  //       );
  //     }
  //   );
  // }

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
      // console.log('Token length:', token.length);
      // console.log('Token starts with:', token.substring(0, 20) + '...');

      const parts = token.split('.');
      // console.log('Token parts count:', parts.length);

      if (parts.length !== 3) {
        throw new Error('Invalid token format');
      }

      const payloadBase64 = parts[1];

      const decoded = JSON.parse(atob(payloadBase64));
      // console.log('Decoded token payload:', decoded);

      this.userId = decoded.userId || decoded.id || null;
      this.userName = decoded.userName || decoded.name || null;
      this.userEmail = decoded.userEmail || decoded.email || null; // Add this line
    } catch (err) {
      console.error('Token decode error:', err);
      this.userId = null;
      this.userName = null;
      this.userEmail = null; // Add this line
      this.showAlert(
        'warning',
        'Session Warning',
        'There was an issue with your session. Please log in again if needed.'
      );
    }
  }

  isRegistered(eventId: string): boolean {
    return this.registeredEvents.some((e) => e._id === eventId);
  }

  // Filter logic
  onSearchChange() {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    // Set new timeout for debounced search
    this.searchTimeout = setTimeout(() => {
      this.currentPage = 1; // Reset to first page when searching
      this.fetchEvents(1); // Fetch from server with search filter
    }, 300); // 300ms delay
  }

  ngOnDestroy() {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
  }

  //   applyFilters() {
  //     let filtered = [...this.paginatedEvents];

  //     // Enhanced search with trimming and better matching
  //     if (this.searchQuery && this.searchQuery.trim()) {
  //       const query = this.searchQuery.toLowerCase().trim();
  //       filtered = filtered.filter(e => {
  //         const searchableText = [
  //           e.title,
  //           e.description,
  //           e.artist || '',
  //           e.organization || '',
  //           e.category || '',
  //           e.city
  //         ].join(' ').toLowerCase();

  //         return searchableText.includes(query);
  //       });
  //     }

  //   if (this.selectedCategory) {
  //     filtered = filtered.filter(e => e.category === this.selectedCategory);
  //   }

  //   if (this.selectedCity) {
  //     filtered = filtered.filter(e => this.extractCityFromLocation(e.city) === this.selectedCity);
  //   }

  //   if (this.dateFrom) {
  //     const fromDate = new Date(this.dateFrom);
  //     filtered = filtered.filter(e => new Date(e.date) >= fromDate);
  //   }

  //   if (this.dateTo) {
  //     const toDate = new Date(this.dateTo);
  //     filtered = filtered.filter(e => new Date(e.date) <= toDate);
  //   }

  //   if (this.selectedPriceRange) {
  //     filtered = this.applyPriceFilter(filtered);
  //   }

  //   this.filteredEvents = filtered;
  //   this.applySorting();

  //   // Reset to first page when filters change
  //   this.currentPage = 1;
  //   // this.calculatePagination();
  // }

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

    // Recalculate pagination after sorting
    // this.calculatePagination();
  }
  onFilterChange() {
    this.currentPage = 1; // Reset to first page
    this.fetchEvents(1); // Fetch from server with new filters
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

  //  debugSearch() {
  //   console.log('Search Debug Info:');
  //   console.log('Search Query:', this.searchQuery);
  //   console.log('All Events Count:', this.events.length);
  //   console.log('Filtered Events Count:', this.filteredEvents.length);
  //   console.log('Paginated Events Count:', this.paginatedEvents.length);
  //   console.log('Current Page:', this.currentPage);
  //   console.log('Total Pages:', this.totalPages);
  // }

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

  // downloadTicket(event: Event) {
  //   this.showConfirmation(
  //     'Download Ticket',
  //     `Generate and download ticket for "${event.title}"?`,
  //     () => {
  //       this.generateTicketPDF(event);
  //     }
  //   );
  // }

  // private generateTicketPDF(event: Event) {
  //   this.loadingService.show();
  //   try {
  //     const doc = new jsPDF();
  //     const pageWidth = doc.internal.pageSize.width;
  //     const pageHeight = doc.internal.pageSize.height;
  //     const margin = 20;
  //     const contentWidth = pageWidth - margin * 2;

  //     // Header Background
  //     doc.setFillColor(102, 126, 234);
  //     doc.rect(0, 0, pageWidth, 60, 'F');

  //     // Header Text
  //     doc.setTextColor(255, 255, 255);
  //     doc.setFontSize(24);
  //     doc.setFont('helvetica', 'bold');
  //     doc.text('EVENT TICKET', pageWidth / 2, 30, { align: 'center' });

  //     doc.setFontSize(12);
  //     doc.setFont('helvetica', 'normal');
  //     doc.text('Official Entry Pass', pageWidth / 2, 45, { align: 'center' });

  //     // Reset text color for content
  //     doc.setTextColor(0, 0, 0);

  //     // Start content below header with more spacing
  //     let yPosition = 80;
  //     const lineHeight = 8;
  //     const sectionSpacing = 15;

  //     // Event details with better formatting
  //     const details = [
  //       { label: 'Event Name', value: event.title },
  //       { label: 'Description', value: event.description },
  //       { label: 'Date', value: this.formatDate(event.date) },
  //       { label: 'Time', value: event.timeSlot },
  //       { label: 'Duration', value: event.duration },
  //       { label: 'Location', value: event.location },
  //       { label: 'Category', value: event.category || 'General' },
  //       { label: 'Price', value: `${event.price}` },
  //       { label: 'Ticket Holder', value: this.userName || 'Guest' },
  //     ];

  //     details.forEach((detail, index) => {
  //       // Check if we need a new page
  //       if (yPosition > pageHeight - 40) {
  //         doc.addPage();
  //         yPosition = 30;
  //       }

  //       // Label
  //       doc.setFont('helvetica', 'bold');
  //       doc.setFontSize(11);
  //       doc.text(`${detail.label}:`, margin, yPosition);

  //       // Value with text wrapping
  //       doc.setFont('helvetica', 'normal');
  //       doc.setFontSize(10);

  //       const labelWidth = 60;
  //       const valueX = margin + labelWidth;
  //       const maxValueWidth = contentWidth - labelWidth;

  //       // Handle long text with proper wrapping
  //       const splitText = doc.splitTextToSize(detail.value, maxValueWidth);
  //       doc.text(splitText, valueX, yPosition);

  //       // Calculate next position based on wrapped text
  //       const textHeight = Array.isArray(splitText)
  //         ? splitText.length * lineHeight
  //         : lineHeight;
  //       yPosition += Math.max(textHeight, lineHeight) + 5;
  //     });

  //     // Add some spacing before footer
  //     yPosition += sectionSpacing;

  //     // Separator line
  //     if (yPosition > pageHeight - 60) {
  //       doc.addPage();
  //       yPosition = 30;
  //     }

  //     doc.setDrawColor(102, 126, 234);
  //     doc.setLineWidth(0.5);
  //     doc.line(margin, yPosition, pageWidth - margin, yPosition);

  //     // Footer
  //     yPosition += 15;
  //     doc.setFontSize(9);
  //     doc.setTextColor(100, 100, 100);
  //     doc.setFont('helvetica', 'normal');

  //     const footerText1 =
  //       'This is an official ticket. Please present this ticket at the event entrance.';
  //     doc.text(footerText1, pageWidth / 2, yPosition, { align: 'center' });

  //     yPosition += 10;
  //     const footerText2 = `Generated on: ${new Date().toLocaleString()}`;
  //     doc.text(footerText2, pageWidth / 2, yPosition, { align: 'center' });

  //     // Add ticket ID for authenticity
  //     yPosition += 10;
  //     const ticketId = `Ticket ID: ${Date.now()}-${event._id.slice(-6)}`;
  //     doc.text(ticketId, pageWidth / 2, yPosition, { align: 'center' });

  //     // Generate filename
  //     const fileName = `ticket-${event.title
  //       .replace(/[^a-z0-9]/gi, '_')
  //       .toLowerCase()}.pdf`;

  //     // Save the PDF
  //     doc.save(fileName);

  //     this.loadingService.hide();
  //     this.showAlert(
  //       'success',
  //       'Ticket Downloaded',
  //       `Your ticket for "${event.title}" has been downloaded successfully!`
  //     );
  //   } catch (error) {
  //     console.error('Error generating ticket PDF:', error);
  //     this.loadingService.hide();
  //     this.showAlert(
  //       'error',
  //       'Download Failed',
  //       'Failed to generate the ticket. Please try again.'
  //     );
  //   }
  // }

  // scrollToRegisteredEvents() {
  //   const registeredSection = document.querySelector('.registered-section');
  //   if (registeredSection) {
  //     registeredSection.scrollIntoView({
  //       behavior: 'smooth',
  //       block: 'start',
  //     });
  //   }
  // }
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
