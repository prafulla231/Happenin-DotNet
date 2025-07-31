import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterModule, Router } from '@angular/router';
import { LoadingService } from '../loading';
import { UserService } from '../../services/user.service';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { LocationService } from '../../services/location';
import { AuthService } from '../../services/auth';
import { inject } from '@angular/core';
import { HeaderComponent, HeaderButton } from '../../common/header/header';
import { FooterComponent } from '../../common/footer/footer';
import { CustomAlertComponent } from '../custom-alert/custom-alert';

/**
 * Booking interface representing a booking for an event.
 */
export interface Booking {
  id: string;
  date: string;
  timeSlot: string;
  eventId: string;
}

/**
 * Event interface representing an event's details.
 */
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

/**
 * RegisteredUser interface for a user registered for an event.
 */
export interface RegisteredUser {
  userId: string;
  name: string;
  email: string;
  id: string;
}

/**
 * AdminRegisteredUser interface for admin-registered users.
 */
export interface AdminRegisteredUser {
  userId: string;
  name: string;
  email: string;
  id: string;
}

/**
 * Response containing admin registered users and current registration count.
 */
export interface AdminRegisteredUsersResponse {
  users: AdminRegisteredUser[];
  currentRegistration: number;
}

/**
 * Location interface representing a physical event location.
 */
export interface Location {
  id?: string;
  state: string;
  city: string;
  placeName: string;
  address: string;
  maxSeatingCapacity: number;
  amenities: string[];
  createdBy?: string;
}

/**
 * Response containing registered users and current registration count.
 */
export interface RegisteredUsersResponse {
  users: RegisteredUser[];
  currentRegistration: number;
}

/**
 * CustomAlert interface for alert system configuration.
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
 * DashboardCard interface for admin dashboard cards.
 */
interface DashboardCard {
  id: string;
  title: string;
  description: string;
  route: string;
  icon: string;
  buttonText: string;
  imageUrl: string;
  color: string;
}

/**
 * AdminDashboardComponent
 * Main admin dashboard for managing events, users, locations, and analytics.
 */
@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    HeaderComponent,
    FooterComponent,
    CustomAlertComponent,
  ],
  // providers: [FormBuilder],
  templateUrl: './admin-dashboard.html',
  styleUrls: ['./admin-dashboard.scss'],
})
export class AdminDashboardComponent implements OnInit {
  /**
   * Initializes the dashboard and loads user counts.
   */
  ngOnInit(): void {
    this.loadUserCounts();
  }
  private fb = inject(FormBuilder);

  userName: string | null = null;

  showViewLocations = false;

  userCounts = {
    users: 0,
    organizers: 0,
    admins: 0,
  };

  downloadingData = {
    users: false,
    organizers: false,
    admins: false,
  };

  adminButtons: HeaderButton[] = [
    { text: 'Logout', action: 'logout', style: 'primary' },
  ];

  /**
   * Handles header button actions.
   * @param action The action string from header button.
   */
  handleHeaderAction(action: string): void {
    switch (action) {
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
    autoClose: false,
  };

  registerForm: FormGroup;
  showRegisterForm = false;

  showLocationForm = false;
  locations: Location[] = [];

  newLocation: Location = {
    state: '',
    city: '',
    placeName: '',
    address: '',
    maxSeatingCapacity: 0,
    amenities: [],
  };

  statesAndcitys: { [key: string]: string[] } = {
    Maharashtra: ['Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Thane'],
    Gujarat: ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar'],
    Karnataka: ['Bengaluru', 'Mysuru', 'Hubli', 'Mangaluru', 'Belagavi'],
    TamilNadu: ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli'],
    Rajasthan: ['Jaipur', 'Udaipur', 'Jodhpur', 'Ajmer', 'Kota'],
    Delhi: ['New Delhi', 'Central Delhi', 'North Delhi', 'South Delhi'],
    UttarPradesh: ['Lucknow', 'Kanpur', 'Varanasi', 'Agra', 'Noida'],
  };

  availablecitys: string[] = [];
  amenities: string[] = [
    'Wi-Fi',
    'AC',
    'Parking',
    'Projector',
    'Water Supply',
    'Microphone',
    'Speaker',
  ];
  showUsersDropdown: Record<string, boolean> = {};
  userEmail: string = '';
  isSuperAdmin: boolean = false;

  dashboardCards: DashboardCard[] = [
    {
      id: 'upcoming-events',
      title: 'Upcoming Events',
      description:
        'Manage and view all scheduled events that are coming up. Monitor registrations and event details.',
      route: '/upcoming-events',
      icon: '📅',
      buttonText: 'View Events',
      imageUrl:
        'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
      color: '#4CAF50',
    },
    {
      id: 'expired-events',
      title: 'Expired Events',
      description:
        'Review past events, analyze attendance data, and archive completed event information.',
      route: '/expired-events',
      icon: '⏰',
      buttonText: 'View Archive',
      imageUrl:
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
      color: '#f44336',
    },
    {
      id: 'waiting-approval',
      title: 'Waiting for Approval',
      description:
        'Review and approve pending event submissions. Manage event approval workflow efficiently.',
      route: '/waiting-approval',
      icon: '⏳',
      buttonText: 'Review Pending',
      imageUrl:
        'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
      color: '#FF9800',
    },
    {
      id: 'analytics',
      title: 'Analytics',
      description:
        'View comprehensive reports, statistics, and insights about events, attendance, and performance metrics.',
      route: '/analytics',
      icon: '📊',
      buttonText: 'View Analytics',
      imageUrl:
        'https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
      color: '#2196F3',
    },
  ];

  constructor(
    private http: HttpClient,
    private loadingService: LoadingService,
    private authService: AuthService,
    private locationService: LocationService,
    private router: Router,
    private userService: UserService
  ) {
    window.scrollTo({ top: 0, behavior: 'smooth' });

    this.setUserFromLocalUser();

    this.registerForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      phone: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      role: ['admin'],
    });
  }

  /**
   * Navigates to a page by route.
   * @param route Route string.
   */
  navigateToPage(route: string): void {
    try {
      this.router.navigate([route]);
    } catch (error) {
      console.error('Navigation error:', error);
      // Handle navigation error appropriately
      this.handleNavigationError(route);
    }
  }

  /**
   * Handles navigation errors.
   * @param route Route string.
   */
  private handleNavigationError(route: string): void {
    // You can implement custom error handling here
    console.warn(
      `Failed to navigate to ${route}. Please check if the route exists.`
    );
  }

  /**
   * Handles keyboard navigation for dashboard cards.
   * @param event Keyboard event.
   * @param route Route string.
   */
  onKeyboardNavigation(event: KeyboardEvent, route: string): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.navigateToPage(route);
    }
  }

  /**
   * Gets a dashboard card by its ID.
   * @param cardId Card ID.
   * @returns DashboardCard or undefined.
   */
  getCardById(cardId: string): DashboardCard | undefined {
    return this.dashboardCards.find((card) => card.id === cardId);
  }

  /**
   * Checks if a route is accessible.
   * @param route Route string.
   * @returns True if accessible.
   */
  isRouteAccessible(route: string): boolean {
    return true;
  }

  /**
   * Handles dashboard card click.
   * @param cardId Card ID.
   * @param route Route string.
   */
  onCardClick(cardId: string, route: string): void {
    // Track analytics if needed
    this.trackCardClick(cardId);

    // Navigate to the route
    this.navigateToPage(route);
  }

  /**
   * Tracks dashboard card click for analytics.
   * @param cardId Card ID.
   */
  private trackCardClick(cardId: string): void {
    // Implement analytics tracking here
    console.log(`Card clicked: ${cardId}`);
  }

  /**
   * Navigates to analytics page.
   */
  viewAnalytics(): void {
    this.router.navigate(['/admin-analytics']);
  }

  private alertTimeout: any;

  // Custom Alert Methods
  /**
   * Shows a custom alert.
   * @param type Alert type.
   * @param title Alert title.
   * @param message Alert message.
   * @param duration Duration before auto-close (ms).
   */
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

  /**
   * Shows a confirmation alert.
   * @param title Confirmation title.
   * @param message Confirmation message.
   * @param confirmAction Action on confirm.
   * @param cancelAction Action on cancel.
   */
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

  /**
   * Handles confirmation of alert.
   */
  handleAlertConfirm() {
    if (this.customAlert.confirmAction) {
      this.customAlert.confirmAction();
    }
    this.closeAlert();
  }

  /**
   * Handles cancellation of alert.
   */
  handleAlertCancel() {
    if (this.customAlert.cancelAction) {
      this.customAlert.cancelAction();
    }
    this.closeAlert();
  }

  /**
   * Closes the custom alert.
   */
  closeAlert() {
    this.customAlert.show = false;
    this.customAlert.confirmAction = undefined;
    this.customAlert.cancelAction = undefined;
    this.clearAlertTimeout();
  }

  /**
   * Clears the alert timeout.
   */
  private clearAlertTimeout() {
    if (this.alertTimeout) {
      clearTimeout(this.alertTimeout);
      this.alertTimeout = null;
    }
  }

  /**
   * Toggles the view locations modal.
   */
  toggleViewLocations(): void {
    this.showViewLocations = !this.showViewLocations;
    if (this.showViewLocations) {
      this.loadLocations(); // Refresh locations when opening
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
  }

  /**
   * Closes the view locations modal.
   */
  closeViewLocations(): void {
    this.showViewLocations = false;
    document.body.style.overflow = 'auto';
  }

  /**
   * Shows confirmation before deleting a location.
   * @param locationId Location ID.
   * @param placeName Location name.
   * @param city City name.
   * @param state State name.
   */
  confirmDeleteLocation(
    locationId: string,
    placeName: string,
    city: string,
    state: string
  ): void {
    console.log('[DEBUG] confirmDeleteLocation called with:', {
      locationId,
      placeName,
      city,
      state,
    });
    this.showConfirmation(
      'Delete Location',
      `Are you sure you want to delete "${placeName}" in ${city}, ${state}? This action cannot be undone.`,
      () => this.deleteLocation(locationId, placeName)
    );
  }

  /**
   * Deletes a location.
   * @param locationId Location ID.
   * @param placeName Location name.
   */
  deleteLocation(locationId: string, placeName: string): void {
    console.log(
      '[DEBUG] deleteLocation called with locationId:',
      locationId,
      'placeName:',
      placeName
    );
    this.locationService.deleteLocation(locationId).subscribe({
      next: (res) => {
        console.log('[DEBUG] deleteLocation success response:', res);
        this.showAlert(
          'success',
          'Location Deleted',
          `Location "${placeName}" has been deleted successfully.`
        );
        this.loadLocations(); // Refresh the locations list
      },
      error: (err) => {
        console.error(
          '[DEBUG] Failed to delete location',
          err,
          'locationId:',
          locationId
        );
        this.showAlert(
          'error',
          'Delete Failed',
          'Failed to delete location. Please try again.'
        );
      },
      complete: () => {
        console.log('[DEBUG] deleteLocation observable complete');
      },
    });
  }

  /**
   * Reads user info from localStorage and sets email and super admin flag.
   */
  setUserFromLocalUser() {
    try {
      const userString = localStorage.getItem('user');

      if (userString) {
        const user = JSON.parse(userString);
        this.userEmail = user.email || '';
        this.isSuperAdmin = this.userEmail === 'happenin.events.app@gmail.com';
      } else {
        this.userEmail = '';
        this.isSuperAdmin = false;
      }
    } catch (error) {
      console.error('Failed to parse user from sessionStorage', error);
      this.userEmail = '';
      this.isSuperAdmin = false;
    }
  }

  /**
   * Toggles the register form visibility.
   */
  toggleRegisterForm(): void {
    this.showRegisterForm = !this.showRegisterForm;
  }

  /**
   * Handles admin registration form submission.
   */
  onRegisterSubmit(): void {
    if (this.registerForm.valid) {
      const data = this.registerForm.value;

      this.authService.registerUser(data).subscribe({
        next: () => {
          this.showAlert(
            'success',
            'Registration Successful',
            'Admin registered successfully!'
          );
          this.registerForm.reset({ role: 'admin' });
          this.showRegisterForm = false;
        },
        error: (error) => {
          console.error('Registration failed', error);
          this.showAlert(
            'error',
            'Registration Failed',
            'Registration failed. Please try again.'
          );
        },
      });
    }
  }

  /**
   * Logs out the current user.
   */
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

  /**
   * Toggles the location form visibility.
   */
  toggleLocationForm() {
    this.showLocationForm = !this.showLocationForm;
  }

  /**
   * Handles state change for location form.
   */
  onStateChange() {
    this.availablecitys = this.statesAndcitys[this.newLocation.state] || [];
  }

  /**
   * Gets available states for location form.
   * @returns Array of state names.
   */
  getStates(): string[] {
    return Object.keys(this.statesAndcitys);
  }

  /**
   * Toggles amenity selection for location form.
   * @param amenity Amenity name.
   * @param event Event object.
   */
  toggleAmenity(amenity: string, event: any) {
    const checked = event.target.checked;
    if (checked) this.newLocation.amenities.push(amenity);
    else
      this.newLocation.amenities = this.newLocation.amenities.filter(
        (a) => a !== amenity
      );
  }

  /**
   * Adds a new location.
   * @param location Location object.
   */
  addLocation(location: Location): void {
    this.locationService.addLocation(location).subscribe({
      next: (response) => {
        this.showAlert(
          'success',
          'Location Added',
          'Location has been added successfully!'
        );
        this.loadLocations();
        this.showLocationForm = false;
        this.resetForm();
      },
      error: (err) => {
        console.error('Failed to add location', err);
        this.showAlert(
          'error',
          'Add Location Failed',
          'Failed to add location. Please try again.'
        );
      },
    });
  }

  /**
   * Loads all locations.
   */
  loadLocations(): void {
    this.locationService.fetchLocations().subscribe({
      next: (locations) => {
        this.locations = locations;
      },
      error: (err) => {
        console.error('Error loading locations', err);
        this.showAlert('error', 'Loading Failed', 'Failed to load locations.');
      },
    });
  }

  /**
   * Resets the location form.
   */
  resetForm() {
    this.newLocation = {
      state: '',
      city: '',
      placeName: '',
      address: '',
      maxSeatingCapacity: 0,
      amenities: [],
    };
    this.availablecitys = [];
  }

  /**
   * Loads user, organizer, and admin counts.
   */
  loadUserCounts(): void {
    this.userService.getAllUsers().subscribe({
      next: (users) => {
        this.userCounts.users = users.length;
      },
      error: (err) => console.error('Error loading users count:', err),
    });

    // Load organizers count
    this.userService.getAllOrganizers().subscribe({
      next: (organizers) => {
        this.userCounts.organizers = organizers.length;
      },
      error: (err) => console.error('Error loading organizers count:', err),
    });

    // Load admins count
    this.userService.getAllAdmins().subscribe({
      next: (admins) => {
        this.userCounts.admins = admins.length;
      },
      error: (err) => console.error('Error loading admins count:', err),
    });
  }

  /**
   * Downloads user data as CSV.
   * @param type Type of user data to download.
   */
  downloadUserData(type: 'users' | 'organizers' | 'admins'): void {
    this.downloadingData[type] = true;

    let apiCall;
    let filename;

    switch (type) {
      case 'users':
        apiCall = this.userService.getAllUsers();
        filename = 'all_users.xlsx';
        break;
      case 'organizers':
        apiCall = this.userService.getAllOrganizers();
        filename = 'all_organizers.xlsx';
        break;
      case 'admins':
        apiCall = this.userService.getAllAdmins();
        filename = 'all_admins.xlsx';
        break;
    }

    apiCall.subscribe({
      next: (data) => {
        this.exportToExcel(data, filename, type);
        this.downloadingData[type] = false;
        this.showAlert(
          'success',
          'Download Complete',
          `${type} data downloaded successfully!`
        );
      },
      error: (err) => {
        console.error(`Error downloading ${type} data:`, err);
        this.downloadingData[type] = false;
        this.showAlert(
          'error',
          'Download Failed',
          `Failed to download ${type} data. Please try again.`
        );
      },
    });
  }

  /**
   * Exports data to CSV and triggers download.
   * @param data Array of data objects.
   * @param filename Filename for download.
   * @param type Type of data.
   */
  private exportToExcel(data: any[], filename: string, type: string): void {
    // Create workbook and worksheet
    const ws: any = {};

    if (data.length === 0) {
      this.showAlert(
        'warning',
        'No Data',
        `No ${type} data available to download.`
      );
      return;
    }

    // Define headers based on type
    let headers: string[] = [];
    let processedData: any[] = [];

    switch (type) {
      case 'users':
        headers = ['ID', 'Name', 'Email', 'Phone', 'Created Date'];
        processedData = data.map((user) => ({
          ID: user.id || user.userId || '',
          Name: user.name || '',
          Email: user.email || '',
          Phone: user.phone || '',
          'Created Date': user.createdAt
            ? new Date(user.createdAt).toLocaleDateString()
            : '',
        }));
        break;
      case 'organizers':
        headers = [
          'ID',
          'Name',
          'Email',
          'Phone',
          'Organization',
          'Created Date',
        ];
        processedData = data.map((organizer) => ({
          ID: organizer.id || organizer.userId || '',
          Name: organizer.name || '',
          Email: organizer.email || '',
          Phone: organizer.phone || '',
          Organization: organizer.organization || '',
          'Created Date': organizer.createdAt
            ? new Date(organizer.createdAt).toLocaleDateString()
            : '',
        }));
        break;
      case 'admins':
        headers = ['ID', 'Name', 'Email', 'Phone', 'Role', 'Created Date'];
        processedData = data.map((admin) => ({
          ID: admin.id || admin.userId || '',
          Name: admin.name || '',
          Email: admin.email || '',
          Phone: admin.phone || '',
          Role: admin.role || 'Admin',
          'Created Date': admin.createdAt
            ? new Date(admin.createdAt).toLocaleDateString()
            : '',
        }));
        break;
    }

    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...processedData.map((row) =>
        headers
          .map((header) => {
            const value = row[header] || '';
            // Escape commas and quotes in CSV
            return typeof value === 'string' &&
              (value.includes(',') || value.includes('"'))
              ? `"${value.replace(/"/g, '""')}"`
              : value;
          })
          .join(',')
      ),
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename.replace('.xlsx', '.csv'));
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
