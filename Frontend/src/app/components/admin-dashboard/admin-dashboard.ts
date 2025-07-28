import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterModule, Router } from '@angular/router';
// import { FormsModule } from '@angular/forms';
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
import { ApprovalService } from '../../services/approval';
import { AuthService } from '../../services/auth';
import { EventService } from '../../services/event';
import { HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { environment } from '../../../environment';
import { HeaderComponent, HeaderButton } from '../../common/header/header';
import { FooterComponent } from '../../common/footer/footer';
import { CustomAlertComponent } from '../custom-alert/custom-alert';

// export interface Location {
//   id: string; // This should be a GUID string
//   state: string;
//   city: string;
//   placeName: string;
//   address: string;
//   maxSeatingCapacity: number;
//   amenities: string[];
//   bookings?: Booking[]; // This might be optional
// }

export interface Booking {
  id: string; // This should be a GUID string (BookingId)
  date: string; // or Date type
  timeSlot: string;
  eventId: string; // This should be a GUID string
}

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

export interface RegisteredUser {
  userId: string;
  name: string;
  email: string;
  id: string;
}

export interface AdminRegisteredUser {
  userId: string;
  name: string;
  email: string;
  id: string;
}

export interface AdminRegisteredUsersResponse {
  users: AdminRegisteredUser[];
  currentRegistration: number;
}

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
  ngOnInit(): void {
    // Add this to your existing ngOnInit or create one if it doesn't exist
    this.loadUserCounts();
  }
  private fb = inject(FormBuilder);

  userName: string | null = null;

  showViewLocations = false;

  // get displayUserName(): string {
  //     return this.userName || 'Guest';
  //   }

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

    // this.loadLocations();
    // console.log('Locations have been loaded');

    this.setUserFromLocalUser();

    this.registerForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      phone: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      role: ['admin'], // Fixed value
    });
  }

  // Admin dashboard cards test
  navigateToPage(route: string): void {
    try {
      this.router.navigate([route]);
    } catch (error) {
      console.error('Navigation error:', error);
      // Handle navigation error appropriately
      this.handleNavigationError(route);
    }
  }

  private handleNavigationError(route: string): void {
    // You can implement custom error handling here
    console.warn(
      `Failed to navigate to ${route}. Please check if the route exists.`
    );
  }
  onKeyboardNavigation(event: KeyboardEvent, route: string): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.navigateToPage(route);
    }
  }

  getCardById(cardId: string): DashboardCard | undefined {
    return this.dashboardCards.find((card) => card.id === cardId);
  }

  isRouteAccessible(route: string): boolean {
    return true;
  }

  onCardClick(cardId: string, route: string): void {
    // Track analytics if needed
    this.trackCardClick(cardId);

    // Navigate to the route
    this.navigateToPage(route);
  }

  private trackCardClick(cardId: string): void {
    // Implement analytics tracking here
    console.log(`Card clicked: ${cardId}`);
  }

  viewAnalytics(): void {
    this.router.navigate(['/admin-analytics']);
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

  toggleViewLocations(): void {
    this.showViewLocations = !this.showViewLocations;
    if (this.showViewLocations) {
      this.loadLocations(); // Refresh locations when opening
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
  }

  closeViewLocations(): void {
    this.showViewLocations = false;
    document.body.style.overflow = 'auto';
  }

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

  // Read user info from sessiontorage key 'user' and set email & isSuperAdmin flag
  setUserFromLocalUser() {
    try {
      const userString = localStorage.getItem('user');
      // console.log('User string from sessionStorage:', userString);

      if (userString) {
        const user = JSON.parse(userString);
        this.userEmail = user.email || '';
        this.isSuperAdmin = this.userEmail === 'happenin.events.app@gmail.com';
        // console.log('Parsed user:', user);
        // console.log('User email:', this.userEmail);
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

  toggleRegisterForm(): void {
    this.showRegisterForm = !this.showRegisterForm;
  }

  onRegisterSubmit(): void {
    if (this.registerForm.valid) {
      const data = this.registerForm.value;
      // console.log('Registering admin with data:', data);

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

  toggleLocationForm() {
    this.showLocationForm = !this.showLocationForm;
  }

  onStateChange() {
    this.availablecitys = this.statesAndcitys[this.newLocation.state] || [];
  }

  getStates(): string[] {
    return Object.keys(this.statesAndcitys);
  }

  toggleAmenity(amenity: string, event: any) {
    const checked = event.target.checked;
    if (checked) this.newLocation.amenities.push(amenity);
    else
      this.newLocation.amenities = this.newLocation.amenities.filter(
        (a) => a !== amenity
      );
  }

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

  loadUserCounts(): void {
    // Load users count
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
