/**
 * Organizer Dashboard component for managing events, venues, and user registrations.
 * Handles event creation, editing, deletion, and displays analytics and user lists.
 * Integrates with services for authentication, event management, location, and approval.
 * Provides UI feedback via custom alerts and confirmation dialogs.
 * Implements state/city/venue filtering and form validation.
 */
import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  Validators,
  FormGroup,
  FormsModule,
} from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RouterModule, Router } from '@angular/router';
import { LoadingService } from '../loading';
import { forkJoin, Subject } from 'rxjs';
import { LocationService } from '../../services/location';
import { ApprovalService } from '../../services/approval';
import { AuthService } from '../../services/auth';
import { EventService } from '../../services/event';
import { map, takeUntil, finalize } from 'rxjs/operators';
import { HeaderComponent, HeaderButton } from '../../common/header/header';
import { FooterComponent } from '../../common/footer/footer';
import { OnInit } from '@angular/core';
import { ChatbotWidgetComponent } from '../chatbot-widget/chatbot-widget';
import { CustomAlertComponent } from '../custom-alert/custom-alert';

/**
 * Event interface representing an event's properties.
 */
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

/**
 * Location interface representing a venue's properties.
 */
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

/**
 * RegisteredUser interface representing a user's registration details.
 */
export interface RegisteredUser {
  id: string;
  name: string;
  email: string;
}

/**
 * RegisteredUsersResponse interface for event registration data.
 */
export interface RegisteredUsersResponse {
  currentRegistration: number;
  users: RegisteredUser[];
}

/**
 * PopupConfig interface for alert and confirmation dialog configuration.
 */
export interface PopupConfig {
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  showConfirmation?: boolean;
  confirmText?: string;
  cancelText?: string;
}

/**
 * CustomAlert interface for custom alert dialog properties.
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

@Component({
  selector: 'app-organizer-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    FormsModule,
    HeaderComponent,
    FooterComponent,
    ChatbotWidgetComponent,
    CustomAlertComponent,
  ],
  templateUrl: './organizer-dashboard.html',
  styleUrls: ['./organizer-dashboard.scss'],
})
export class OrganizerDashboardComponent implements OnDestroy {
  /**
   * Initializes component, decodes token, and loads initial data.
   */
  ngOnInit() {
    this.decodeToken();
    this.initializeData();
  }

  /** Subject for unsubscribing observables on destroy. */
  private destroy$ = new Subject<void>();
  /** Organizer's display name. */
  userName: string | null = null;
  /** Flag to show/hide event creation form. */
  showCreateForm = false;
  /** Flag for edit mode. */
  isEditMode = false;
  /** Uploaded poster file for event. */
  posterFile: File | null = null;
  /** URL of uploaded poster. */
  uploadedPosterUrl: string | null = null;
  /** List of approved events. */
  events: Event[] = [];
  /** List of all events (unused). */
  eventsone: Event[] = [];
  /** ID of event being edited. */
  currentEditEventId: string | null = null;
  /** Organizer's user ID. */
  organizerId: string | null = null;
  /** Loading state flag. */
  isLoading = false;
  /** List of pending events. */
  pendingEvents: Event[] = [];
  /** Map of event IDs to registered users. */
  usersMap: {
    [eventId: string]: { currentRegistration: number; users: RegisteredUser[] };
  } = {};
  /** Reactive form for event creation/editing. */
  eventForm: FormGroup;

  /** List of all locations. */
  locations: any[] = [];
  /** Filtered states for dropdown. */
  filteredStates: string[] = [];
  /** Filtered cities for dropdown. */
  filteredCities: string[] = [];
  /** Filtered place names for dropdown. */
  filteredPlaceNames: string[] = [];
  /** List of places (venues). */
  places: any[] = [];

  /** Selected state for filtering. */
  selectedState = '';
  /** Selected city for filtering. */
  selectedCity = '';
  /** Selected venue object. */
  selectedVenue: any = null;
  /** Timeout for auto-closing alerts. */
  private alertTimeout?: any;
  /** Popup visibility flag. */
  showPopup = false;
  /** Popup configuration object. */
  popupConfig: PopupConfig = { title: '', message: '', type: 'info' };
  /** Promise resolver for popup confirmation. */
  popupResolve: ((value: boolean) => void) | null = null;

  /** Selected event ID for user modal. */
  selectedEventId: string | null = null;
  /** Selected event for details view. */
  selectedEvent: Event | null = null;
  /** Flag to show/hide event details modal. */
  isEventDetailVisible: boolean = false;

  /** List of event categories. */
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
  /** Minimum date for event creation (tomorrow). */
  minDate: string = '';

  /**
   * Returns the display name of the organizer.
   */
  get displayUserName(): string {
    return this.userName || 'Guest';
  }

  /** Header buttons configuration for dashboard navigation. */
  organizerButtons: HeaderButton[] = [
    { text: 'Contact', action: 'openContact' },
    { text: 'Logout', action: 'logout' },
  ];

  /**
   * Handles header button actions.
   * @param action Action string from button.
   */
  handleHeaderAction(action: string): void {
    switch (action) {
      case 'openContact':
        this.openContact();
        break;
      case 'logout':
        this.logout();
        break;
    }
  }

  /** Custom alert dialog configuration. */
  customAlert: CustomAlert = {
    show: false,
    type: 'info',
    title: '',
    message: '',
    showCancel: false,
  };

  /**
   * Constructor for OrganizerDashboardComponent.
   * @param fb FormBuilder for reactive forms.
   * @param http HttpClient for API calls.
   * @param loadingService Service for loading spinner.
   * @param authService Service for authentication.
   * @param eventService Service for event management.
   * @param locationService Service for location management.
   * @param ApprovalService Service for event approval.
   * @param router Angular Router for navigation.
   */
  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private loadingService: LoadingService,
    private authService: AuthService,
    private eventService: EventService,
    private locationService: LocationService,
    private ApprovalService: ApprovalService,
    private router: Router
  ) {
    // Initialize form
    this.eventForm = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      date: ['', Validators.required],
      startTime: ['', Validators.required],
      endTime: ['', Validators.required],
      duration: [''],
      location: [''],
      category: [''],
      price: [0, Validators.min(0)],
      maxRegistrations: [1, [Validators.required, Validators.min(1)]],
      artist: [''],
      organization: [''],
      state: ['', Validators.required],
      city: ['', Validators.required],
    });

    // Set minimum date
    const today = new Date();
    today.setDate(today.getDate() + 1);
    this.minDate = today.toISOString().split('T')[0];

    // Watch for end time changes to calculate duration
    this.eventForm
      .get('endTime')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.calculateDuration();
      });

    this.initializeData();
  }

  /**
   * Shows a custom alert dialog.
   * @param type Alert type.
   * @param title Alert title.
   * @param message Alert message.
   * @param autoClose Auto-close flag.
   * @param duration Duration before auto-close (ms).
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
   * Shows a confirmation dialog.
   * @param title Dialog title.
   * @param message Dialog message.
   * @param confirmAction Action on confirm.
   * @param cancelAction Action on cancel.
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
   * Cleans up subscriptions and loading state on destroy.
   */
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.isLoading = false;
    this.loadingService.hide();

    // Clear alert timeout if exists
    if (this.alertTimeout) {
      clearTimeout(this.alertTimeout);
    }
  }

  /**
   * Initializes dashboard data and checks authentication.
   */
  private async initializeData() {
    // Decode token and get organizer ID
    this.decodeToken();

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

    // Load all required data
    this.loadAllData();
  }

  /**
   * Decodes JWT token to extract organizer ID and name.
   */
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

  /**
   * Handles confirmation of alert dialog.
   */
  handleAlertConfirm() {
    if (this.customAlert.confirmAction) {
      this.customAlert.confirmAction();
    }
    this.closeAlert();
  }

  /**
   * Handles cancellation of alert dialog.
   */
  handleAlertCancel() {
    if (this.customAlert.cancelAction) {
      this.customAlert.cancelAction();
    }
    this.closeAlert();
  }

  /**
   * Closes the custom alert dialog.
   */
  closeAlert() {
    this.customAlert.show = false;
    this.customAlert.confirmAction = undefined;
    this.customAlert.cancelAction = undefined;
  }

  /**
   * Scrolls to "My Events" section.
   */
  viewMyEvents() {
    // const availableSection = document.querySelector('.events-section');
    // if (availableSection) {
    //   availableSection.scrollIntoView({
    //     behavior: 'smooth',
    //     block: 'start',
    //   });
    // }
    this.router.navigate(['/my-created-events']);
  }

  /**
   * Scrolls to "Pending Events" section.
   */
  viewPendingEvents() {
    // const availableSection = document.querySelector('.events-section');
    // if (availableSection) {
    //   availableSection.scrollIntoView({
    //     behavior: 'smooth',
    //     block: 'start',
    //   });
    // }
    this.router.navigate(['/my-pending-approvals']);
  }

  /**
   * Scrolls to "Create Event" section.
   */
  createEvent() {
    const availableSection = document.querySelector('.create-event-btn');
    if (availableSection) {
      availableSection.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  }

  /**
   * Loads all required dashboard data (locations, events).
   */
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
          this.places = this.locations;
          this.filteredStates = [
            ...new Set(
              this.locations.map((loc) => loc.state?.trim()).filter(Boolean)
            ),
          ];
        },
        error: (error) => {
          console.error('Error loading locations:', error);
          this.locations = [];
          this.places = [];
        },
      });

    // Load events with pagination - FILTER BY APPROVAL STATUS
    if (this.organizerId) {
      this.eventService
        .getEventById(this.organizerId, 1, 100)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            const allEvents = response.data || [];

            // Separate events by approval status
            this.events = allEvents.filter(
              (event: Event) => event.status === 'Approved'
            );

            this.pendingEvents = allEvents.filter(
              (event: Event) => event.status === 'Pending'
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

  /**
   * Calculates event duration from start and end time.
   */
  calculateDuration() {
    const start = this.eventForm.get('startTime')?.value;
    const end = this.eventForm.get('endTime')?.value;

    if (start && end) {
      const [startHour, startMinute] = start.split(':').map(Number);
      const [endHour, endMinute] = end.split(':').map(Number);

      let startTotalMinutes = startHour * 60 + startMinute;
      let endTotalMinutes = endHour * 60 + endMinute;

      // Handle overnight duration (if endTime is next day)
      if (endTotalMinutes < startTotalMinutes) {
        endTotalMinutes += 24 * 60;
      }

      const durationMinutes = endTotalMinutes - startTotalMinutes;
      const hours = Math.floor(durationMinutes / 60);
      const minutes = durationMinutes % 60;

      const durationStr = `${hours} hour${hours !== 1 ? 's' : ''}${
        minutes > 0 ? ` ${minutes} min${minutes !== 1 ? 's' : ''}` : ''
      }`;
      this.eventForm.get('duration')?.setValue(durationStr);
    }
  }

  // Updated venue change method
  /**
   * Handles venue selection change and validates max registrations.
   */
  onVenueChange(): void {
    const selectedPlace = this.eventForm.get('location')?.value;
    this.selectedVenue =
      this.places.find((place: any) => place.placeName === selectedPlace) ||
      null;
    this.validateMaxRegistrations();
  }

  /**
   * Validates max registrations against venue capacity.
   */
  validateMaxRegistrations(): void {
    const maxRegistrationsControl = this.eventForm.get('maxRegistrations');
    const maxRegistrationsValue = maxRegistrationsControl?.value;

    if (this.selectedVenue && maxRegistrationsValue) {
      const venueCapacity = this.selectedVenue.maxSeatingCapacity;

      if (maxRegistrationsValue > venueCapacity) {
        maxRegistrationsControl?.setErrors({ overCapacity: true });
      } else {
        const errors = maxRegistrationsControl?.errors;
        if (errors && errors['overCapacity']) {
          delete errors['overCapacity'];
          maxRegistrationsControl?.setErrors(
            Object.keys(errors).length ? errors : null
          );
        }
      }
    }
  }

  /**
   * Handles change in max registrations field.
   */
  onMaxRegistrationsChange(): void {
    this.validateMaxRegistrations();
  }

  // Event Submit/Create/Update
  /**
   * Handles event form submission for create/update.
   */
  async onSubmit() {
    if (this.eventForm.invalid) {
      this.showAlert(
        'error',
        'Validation Error',
        'Please fill required fields'
      );
      return;
    }

    this.isLoading = true;
    this.loadingService.show();

    try {
      const form = this.eventForm.value;
      const timeSlot = `${form.startTime} - ${form.endTime}`;

      // Find the selected location to get its ID
      const selectedPlace = this.places.find(
        (place: any) => place.placeName === form.location
      );
      if (!selectedPlace) {
        this.showAlert('error', 'Error', 'Please select a valid location');
        this.isLoading = false;
        this.loadingService.hide();
        return;
      }

      const eventData = {
        title: form.title,
        description: form.description,
        date: new Date(form.date).toISOString(),
        timeSlot,
        duration: this.eventService.convertDurationToMinutes(form.duration),
        locationId: selectedPlace.id,
        category: form.category,
        price: form.price,
        maxRegistrations: form.maxRegistrations,
        artist: form.artist,
        organization: form.organization,
        createdBy: this.organizerId,
      };

      const request =
        this.isEditMode && this.currentEditEventId
          ? this.eventService.updateEvent(this.currentEditEventId, eventData)
          : this.eventService.createEvent(eventData);

      request.pipe(takeUntil(this.destroy$)).subscribe({
        next: async () => {
          this.showAlert(
            'success',
            'Success',
            `Event ${this.isEditMode ? 'updated' : 'created'} successfully!`
          );
          console.log('Creating event with organizer ID:', this.organizerId);

          this.resetForm();
          this.showCreateForm = false;
          this.loadAllData();
        },
        error: async (error) => {
          console.error('Event creation/update error:', error);
          this.showAlert('error', 'Error', 'Event creation/updation failed');
        },
        complete: () => {
          this.isLoading = false;
          this.loadingService.hide();
        },
      });
    } catch (error) {
      console.error('Submit error:', error);
      this.showAlert('error', 'Error', 'An unexpected error occurred');
      this.isLoading = false;
      this.loadingService.hide();
    }
  }

  // Helper method for duration conversion
  /**
   * Converts duration string to minutes.
   * @param durationStr Duration string (e.g., "2 hours 30 mins").
   * @returns Duration in minutes.
   */
  private convertDurationToMinutes(durationStr: string): number {
    if (!durationStr) return 0;

    const hourMatch = durationStr.match(/(\d+)\s*hour/);
    const minMatch = durationStr.match(/(\d+)\s*min/);

    const hours = hourMatch ? parseInt(hourMatch[1]) : 0;
    const minutes = minMatch ? parseInt(minMatch[1]) : 0;

    return hours * 60 + minutes;
  }

  /**
   * Loads event data into form for editing.
   * @param event Event to edit.
   */
  onEdit(event: Event) {
    window.scrollTo(0, 0);
    const loc = this.locations.find((l) => l.id === event.locationId);
    // console.log('Location:', loc);

    this.eventForm.patchValue({
      title: event.title,
      description: event.description,
      date: event.date,
      startTime: event.timeSlot.split(' - ')[0],
      endTime: event.timeSlot.split(' - ')[1],
      location: loc?.placeName || '',
      category: event.category,
      price: event.price,
      maxRegistrations: event.maxRegistrations,
      artist: event.artist,
      organization: event.organization,
      state: loc?.state || '',
      city: loc?.city || '',
    });

    this.currentEditEventId = event.id;
    this.isEditMode = true;
    this.showCreateForm = true;

    if (loc) {
      this.selectedState = loc.state;
      this.onStateChange();
      this.selectedCity = loc.city;
      this.onCityChange();
      setTimeout(() => {
        this.selectedVenue =
          this.places.find((place: any) => place.id === event.locationId) ||
          null;
      }, 100);
    }
  }

  /**
   * Deletes an event after confirmation.
   * @param eventId Event ID to delete.
   */
  async onDelete(eventId: string) {
    this.showConfirmation(
      'Confirm',
      'Are you sure you want to delete this event? This action cannot be undone.',
      () => {
        // Confirm action - proceed with deletion
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

  /**
   * Loads registered users for an event.
   * @param eventId Event ID.
   * @param callback Optional callback after loading.
   */
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

  // State/City Filters
  /**
   * Handles state selection change for filtering.
   */
  onStateChange() {
    this.selectedState = this.eventForm.get('state')?.value?.trim() || '';
    const state = this.selectedState;

    const matches = this.locations.filter((loc) => loc.state?.trim() === state);
    this.filteredCities = [
      ...new Set(matches.map((loc) => loc.city?.trim()).filter(Boolean)),
    ];
    this.filteredPlaceNames = [];
    this.selectedCity = '';
    this.selectedVenue = null;
    this.eventForm.patchValue({ city: '', location: '' });
  }

  /**
   * Handles city selection change for filtering.
   */
  onCityChange() {
    this.selectedCity = this.eventForm.get('city')?.value?.trim() || '';
    const state = this.selectedState;
    const city = this.selectedCity;

    const matches = this.locations.filter(
      (loc) => loc.state?.trim() === state && loc.city?.trim() === city
    );

    this.filteredPlaceNames = [
      ...new Set(matches.map((loc) => loc.placeName?.trim()).filter(Boolean)),
    ];
    this.selectedVenue = null;
    this.eventForm.patchValue({ location: '' });
  }

  /**
   * Toggles the event creation form visibility.
   */
  toggleCreateForm() {
    this.showCreateForm = !this.showCreateForm;
    this.isEditMode = false;
    this.resetForm();
  }

  /**
   * Resets the event form and related state.
   */
  resetForm() {
    this.eventForm.reset({
      price: 0,
      maxRegistrations: 1,
      state: '',
      city: '',
    });
    this.selectedState = '';
    this.selectedCity = '';
    this.selectedVenue = null;
    this.filteredCities = [];
    this.filteredPlaceNames = [];
    this.currentEditEventId = null;
  }

  /**
   * Navigates to contact page.
   */
  openContact() {
    this.router.navigate(['/contact']);
  }

  /**
   * Navigates to analytics page.
   */
  openAnalytics() {
    this.router.navigate(['/analytics']);
  }

  /**
   * Logs out the organizer after confirmation.
   */
  async logout() {
    this.showConfirmation('Confirm', 'Are you sure you want to logout?', () => {
      localStorage.clear();
      sessionStorage.clear();
      this.showAlert('success', 'Success', 'You have been logged out');
      setTimeout(() => (window.location.href = '/login'), 500);
    });
  }

  /**
   * Opens modal to show registered users for an event.
   * @param eventId Event ID.
   */
  openUserModal(eventId: string) {
    this.loadRegisteredUsers(eventId, () => (this.selectedEventId = eventId));
  }

  /**
   * Closes the registered users modal.
   */
  closeUserModal() {
    this.selectedEventId = null;
  }

  /**
   * Shows event details modal.
   * @param event Event to show.
   */
  showEventDetail(event: Event) {
    this.selectedEvent = event;
    this.isEventDetailVisible = true;
    document.body.style.overflow = 'auto';
  }

  /**
   * Closes the event details modal.
   */
  closeEventDetails() {
    this.isEventDetailVisible = false;
    this.selectedEvent = null;
    document.body.style.overflow = 'auto';
  }
}
