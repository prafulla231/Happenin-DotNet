// components/organizer-analytics/organizer-analytics.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { NgChartsModule } from 'ng2-charts';
import { Subject, takeUntil } from 'rxjs';
// import { AnalyticsService } from '../../services/analytics.service';
import { EventAnalytics } from '../../interfaces/analytics.interface';
import { RouterModule, Router } from '@angular/router';
import { HeaderComponent, HeaderButton } from '../../common/header/header';
import { FooterComponent } from '../../common/footer/footer';
import { AnalyticsService } from '../../services/analytics.service';
import { CustomAlertComponent } from '../custom-alert/custom-alert';

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
  selector: 'app-organizer-analytics',
  standalone: true,
  imports: [
    CommonModule,
    NgChartsModule,
    HeaderComponent,
    FooterComponent,
    RouterModule,
    CustomAlertComponent,
  ],
  templateUrl: './organizer-analytics.html',
  styleUrls: ['./organizer-analytics.scss'],
})
export class OrganizerAnalyticsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Properties
  organizerId: string | null = null;
  userName: string | null = null;

  analytics: EventAnalytics | null = null;
  loading = true;
  error = '';
  refreshing = false;
  dataLoaded = false; // Added missing property

  organizerButtons: HeaderButton[] = [
    { text: 'Dashboard', action: 'dashboard', style: 'primary' },
    { text: 'Export Data', action: 'exportData', style: 'primary' },
    { text: 'Refresh', action: 'refresh', style: 'primary' },
    { text: 'Logout', action: 'logout', style: 'primary' },
  ];

  // Chart configurations
  pieChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
      },
    },
  };

  barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
    },
  };

  doughnutChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
      },
    },
  };

  // Chart data
  categoryChartData: ChartData<'pie'> = {
    labels: [],
    datasets: [
      {
        data: [],
        backgroundColor: [
          '#3498db',
          '#e74c3c',
          '#2ecc71',
          '#f39c12',
          '#9b59b6',
          '#1abc9c',
          '#34495e',
          '#e67e22',
        ],
      },
    ],
  };

  monthlyChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [
      {
        data: [],
        backgroundColor: '#3498db',
        borderColor: '#2980b9',
        borderWidth: 1,
      },
    ],
  };

  registrationsChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [
      {
        data: [],
        backgroundColor: '#2ecc71',
        borderColor: '#27ae60',
        borderWidth: 1,
      },
    ],
  };

  revenueChartData: ChartData<'doughnut'> = {
    labels: [],
    datasets: [
      {
        data: [],
        backgroundColor: [
          '#f39c12',
          '#e74c3c',
          '#9b59b6',
          '#1abc9c',
          '#34495e',
          '#e67e22',
          '#3498db',
          '#2ecc71',
        ],
      },
    ],
  };

  customAlert: CustomAlert = {
    show: false,
    type: 'info',
    title: '',
    message: '',
    showCancel: false,
  };

  constructor(
    private analyticsService: AnalyticsService,
    private router: Router // Added missing Router injection
  ) {}

  ngOnInit(): void {
    this.decodeToken();
    this.loadAnalyticsData(); // Fixed method name
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  handleHeaderAction(action: string): void {
    switch (action) {
      case 'dashboard':
        this.router.navigate(['/organizer-dashboard']);
        break;
      case 'exportData':
        this.exportAnalyticsData();
        break;
      case 'refresh':
        this.refreshData();
        break;
      case 'logout':
        this.logout();
        break;
    }
  }

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

  loadAnalyticsData(): void {
    this.loading = true;
    this.error = '';

    if (!this.organizerId) {
      this.error = 'Organizer ID not found. Please log in again.';
      this.loading = false;
      return;
    }

    this.analyticsService
      .getOrganizerAnalytics(this.organizerId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.analytics = data;
          this.updateCharts(data);
          this.loading = false;
          this.dataLoaded = true;
        },
        error: (error) => {
          this.error = error.message;
          this.loading = false;
          this.dataLoaded = false;
        },
      });
  }

  refreshAnalytics(): void {
    if (!this.organizerId) {
      console.error('No organizer ID available');
      return;
    }

    this.refreshing = true;
    this.analyticsService
      .refreshAnalytics('organizer', this.organizerId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loadAnalyticsData(); // Fixed method name
          this.refreshing = false;
        },
        error: (error) => {
          console.error('Failed to refresh analytics:', error);
          this.refreshing = false;
        },
      });
  }

  private decodeToken(): void {
    try {
      const token =
        sessionStorage.getItem('token') || localStorage.getItem('token');

      if (!token) {
        console.error('No token found in storage');
        this.error = 'Authentication required. Please log in.';
        return;
      }

      const tokenParts = token.split('.');
      if (tokenParts.length !== 3) {
        console.error('Invalid token format');
        this.error = 'Invalid authentication token. Please log in again.';
        return;
      }

      const payload = JSON.parse(atob(tokenParts[1]));
      this.organizerId = payload.userId || payload.id || null;
      this.userName = payload.userName || payload.name || null;

      if (!this.organizerId) {
        this.error = 'User ID not found in token. Please log in again.';
      }
    } catch (error) {
      console.error('Error decoding token:', error);
      this.organizerId = null;
      this.error =
        'Failed to decode authentication token. Please log in again.';
    }
  }

  private updateCharts(data: EventAnalytics): void {
    // Update category chart
    this.categoryChartData = {
      labels: Object.keys(data.eventsByCategory),
      datasets: [
        {
          data: Object.values(data.eventsByCategory),
          backgroundColor: [
            '#3498db',
            '#e74c3c',
            '#2ecc71',
            '#f39c12',
            '#9b59b6',
            '#1abc9c',
            '#34495e',
            '#e67e22',
          ],
        },
      ],
    };

    // Update monthly events chart
    this.monthlyChartData = {
      labels: Object.keys(data.eventsByMonth),
      datasets: [
        {
          data: Object.values(data.eventsByMonth),
          backgroundColor: '#3498db',
          borderColor: '#2980b9',
          borderWidth: 1,
          label: 'Events',
        },
      ],
    };

    // Update registrations chart (top 10 events)
    const topRegistrations = data.registrationsByEvent
      .sort((a, b) => b.registrations - a.registrations)
      .slice(0, 10);

    this.registrationsChartData = {
      labels: topRegistrations.map((item) =>
        this.truncateLabel(item.eventTitle)
      ),
      datasets: [
        {
          data: topRegistrations.map((item) => item.registrations),
          backgroundColor: '#2ecc71',
          borderColor: '#27ae60',
          borderWidth: 1,
          label: 'Registrations',
        },
      ],
    };

    // Update revenue chart (top 8 events)
    const topRevenue = data.revenueByEvent
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8);

    this.revenueChartData = {
      labels: topRevenue.map((item) => this.truncateLabel(item.eventTitle)),
      datasets: [
        {
          data: topRevenue.map((item) => item.revenue),
          backgroundColor: [
            '#f39c12',
            '#e74c3c',
            '#9b59b6',
            '#1abc9c',
            '#34495e',
            '#e67e22',
            '#3498db',
            '#2ecc71',
          ],
        },
      ],
    };
  }

  private truncateLabel(label: string, maxLength: number = 20): string {
    return label.length > maxLength
      ? label.substring(0, maxLength) + '...'
      : label;
  }

  getChartType(type: string): ChartType {
    return type as ChartType;
  }

  refreshData(): void {
    this.disposeAllCharts();
    this.dataLoaded = false;
    this.loadAnalyticsData();
  }

  // Added missing disposeAllCharts method
  private disposeAllCharts(): void {
    // This method should handle chart disposal if needed
    // Implementation depends on your chart library requirements
    console.log('Disposing charts...');
  }

  exportAnalyticsData(): void {
    if (!this.analytics) {
      console.error('No analytics data to export');
      return;
    }

    const dataStr = JSON.stringify(this.analytics, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `analytics-data-${
      new Date().toISOString().split('T')[0]
    }.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async logout() {
    this.showConfirmation('Confirm', 'Are you sure you want to logout?', () => {
      localStorage.clear();
      sessionStorage.clear();
      this.showAlert('success', 'Success', 'You have been logged out');
      setTimeout(() => (window.location.href = '/login'), 500);
    });
  }
}
