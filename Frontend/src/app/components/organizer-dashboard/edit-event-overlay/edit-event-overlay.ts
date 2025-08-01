import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  OnChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  Validators,
  FormGroup,
} from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { EventService } from '../../../services/event';
import { LocationService } from '../../../services/location';
import { LoadingService } from '../../loading';

// Rename your Event interface to avoid conflict with DOM Event
export interface EventData {
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

@Component({
  selector: 'app-event-edit-overlay',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './edit-event-overlay.html',
  styleUrls: ['./edit-event-overlay.scss'],
})
export class EventEditOverlayComponent implements OnInit, OnDestroy, OnChanges {
  @Input() isVisible = false;
  @Input() eventToEdit: EventData | null = null; // Updated type
  @Input() organizerId: string | null = null;
  @Output() closeOverlay = new EventEmitter<void>();
  @Output() eventUpdated = new EventEmitter<void>();
  @Output() showAlert = new EventEmitter<{
    type: string;
    title: string;
    message: string;
  }>();

  private destroy$ = new Subject<void>();
  eventForm: FormGroup;
  isEditMode = false;
  isLoading = false;
  minDate: string = '';

  // Location data
  locations: any[] = [];
  filteredStates: string[] = [];
  filteredCities: string[] = [];
  filteredPlaceNames: string[] = [];
  selectedState = '';
  selectedCity = '';
  selectedVenue: any = null;

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

  constructor(
    private fb: FormBuilder,
    private eventService: EventService,
    private locationService: LocationService,
    private loadingService: LoadingService
  ) {
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
  }

  ngOnInit() {
    this.loadLocations();
  }

  ngOnChanges() {
    // This will trigger when eventToEdit input changes
    if (this.eventToEdit && this.isVisible) {
      this.loadEventData();
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadLocations() {
    this.locationService
      .fetchLocations()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.locations = Array.isArray(data) ? data : [];
          this.filteredStates = [
            ...new Set(
              this.locations.map((loc) => loc.state?.trim()).filter(Boolean)
            ),
          ];
        },
        error: (error) => {
          console.error('Error loading locations:', error);
          this.locations = [];
        },
      });
  }

  private loadEventData() {
    if (!this.eventToEdit) return;

    this.isEditMode = true;
    const event = this.eventToEdit;

    // Wait for locations to be loaded if they aren't already
    if (this.locations.length === 0) {
      // Wait a bit and try again, or watch for locations to load
      setTimeout(() => {
        if (this.locations.length > 0) {
          this.populateEventForm(event);
        }
      }, 500);
    } else {
      this.populateEventForm(event);
    }
  }

  private populateEventForm(event: EventData) {
    const loc = this.locations.find((l) => l.id === event.locationId);

    // Format date for input
    const eventDate = new Date(event.date);
    const formattedDate = eventDate.toISOString().split('T')[0];

    // Extract time slots
    const timeSlots = event.timeSlot.split(' - ');
    const startTime = timeSlots[0] || '';
    const endTime = timeSlots[1] || '';

    this.eventForm.patchValue({
      title: event.title || '',
      description: event.description || '',
      date: formattedDate,
      startTime: startTime,
      endTime: endTime,
      location: loc?.placeName || '',
      category: event.category || '',
      price: event.price || 0,
      maxRegistrations: event.maxRegistrations || 1,
      artist: event.artist || '',
      organization: event.organization || '',
      state: loc?.state || '',
      city: loc?.city || '',
    });

    // Set up location dropdowns
    if (loc) {
      this.selectedState = loc.state;
      this.onStateChange();
      this.selectedCity = loc.city;
      this.onCityChange();

      // Set the venue after dropdowns are populated
      setTimeout(() => {
        this.selectedVenue =
          this.locations.find((place) => place.id === event.locationId) || null;
        this.eventForm.patchValue({ location: loc.placeName });
      }, 100);
    }

    // Calculate duration
    this.calculateDuration();
  }

  calculateDuration() {
    const start = this.eventForm.get('startTime')?.value;
    const end = this.eventForm.get('endTime')?.value;

    if (start && end) {
      const [startHour, startMinute] = start.split(':').map(Number);
      const [endHour, endMinute] = end.split(':').map(Number);

      let startTotalMinutes = startHour * 60 + startMinute;
      let endTotalMinutes = endHour * 60 + endMinute;

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

  onVenueChange() {
    const selectedPlace = this.eventForm.get('location')?.value;
    this.selectedVenue =
      this.locations.find((place) => place.placeName === selectedPlace) || null;
    this.validateMaxRegistrations();
  }

  validateMaxRegistrations() {
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

  onMaxRegistrationsChange() {
    this.validateMaxRegistrations();
  }

  async onSubmit() {
    if (this.eventForm.invalid) {
      this.showAlert.emit({
        type: 'error',
        title: 'Validation Error',
        message: 'Please fill all required fields correctly',
      });
      return;
    }

    this.isLoading = true;

    try {
      const form = this.eventForm.value;
      const timeSlot = `${form.startTime} - ${form.endTime}`;

      const selectedPlace = this.locations.find(
        (place) => place.placeName === form.location
      );

      if (!selectedPlace) {
        this.showAlert.emit({
          type: 'error',
          title: 'Error',
          message: 'Please select a valid location',
        });
        this.isLoading = false;
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
        this.isEditMode && this.eventToEdit?.id
          ? this.eventService.updateEvent(this.eventToEdit.id, eventData)
          : this.eventService.createEvent(eventData);

      request.pipe(takeUntil(this.destroy$)).subscribe({
        next: () => {
          this.showAlert.emit({
            type: 'success',
            title: 'Success',
            message: `Event ${
              this.isEditMode ? 'updated' : 'created'
            } successfully!`,
          });
          this.eventUpdated.emit();
          this.closeModal();
        },
        error: (error) => {
          console.error('Event operation error:', error);
          this.showAlert.emit({
            type: 'error',
            title: 'Error',
            message: `Failed to ${this.isEditMode ? 'update' : 'create'} event`,
          });
        },
        complete: () => {
          this.isLoading = false;
        },
      });
    } catch (error) {
      console.error('Submit error:', error);
      this.showAlert.emit({
        type: 'error',
        title: 'Error',
        message: 'An unexpected error occurred',
      });
      this.isLoading = false;
    }
  }

  closeModal() {
    this.resetForm();
    this.closeOverlay.emit();
  }

  // Fix the method signature to use MouseEvent instead of Event
  onOverlayClick(event: MouseEvent) {
    // Close modal when clicking on overlay background
    this.closeModal();
  }

  private resetForm() {
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
    this.isEditMode = false; // Reset edit mode when form is reset
  }
}
