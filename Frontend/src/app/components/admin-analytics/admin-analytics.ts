// admin-analytics.ts
import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import * as echarts from 'echarts';
import { LoadingService } from '../loading';
import { EventService } from '../../services/event';
import { LocationService } from '../../services/location';
import { HeaderComponent, HeaderButton } from '../../common/header/header';
import { FooterComponent } from '../../common/footer/footer';
import { AnalyticsService } from '../../services/analytics.service';
import { AdminAnalytics } from '../../interfaces/analytics.interface';
import { CustomAlertComponent } from '../custom-alert/custom-alert';

export interface AnalyticsData {
  totalEvents: number;
  upcomingEvents: number;
  expiredEvents: number;
  totalRegistrations: number;
  eventsByCategory: { [key: string]: number };
  eventsByMonth: { [key: string]: number };
  registrationsByEvent: { eventTitle: string; registrations: number }[];
  revenueByEvent: { eventTitle: string; revenue: number }[];
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
  selector: 'app-analytics',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    HeaderComponent,
    FooterComponent,
    CustomAlertComponent,
  ],
  templateUrl: './admin-analytics.html',
  styleUrls: ['./admin-analytics.scss'],
})
export class AnalyticsComponent implements OnInit, OnDestroy, AfterViewInit {
  analyticsData: AnalyticsData = {
    totalEvents: 0,
    upcomingEvents: 0,
    expiredEvents: 0,
    totalRegistrations: 0,
    eventsByCategory: {},
    eventsByMonth: {},
    registrationsByEvent: [],
    revenueByEvent: [],
  };

  private charts: { [key: string]: echarts.ECharts } = {};
  private resizeObserver: ResizeObserver | null = null;
  private dataLoaded = false;
  private viewInitialized = false;
  isLoading = false; // Add loading state property

  adminButtons: HeaderButton[] = [
    { text: 'Dashboard', action: 'dashboard', style: 'primary' },
    { text: 'Export Data', action: 'exportData', style: 'primary' },
    { text: 'Refresh', action: 'refresh', style: 'primary' },
    { text: 'Logout', action: 'logout', style: 'primary' },
  ];

  constructor(
    private http: HttpClient,
    private AnalyticsService: AnalyticsService,
    private router: Router,
    private loadingService: LoadingService,
    private eventService: EventService,
    private locationService: LocationService
  ) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  ngOnInit(): void {
    console.log('Analytics component initialized');
    this.loadAnalyticsData();
    this.setupResizeObserver();
  }

  ngAfterViewInit(): void {
    console.log('View initialized');
    this.viewInitialized = true;
    // Initialize charts if data is already loaded
    if (this.dataLoaded) {
      this.initializeChartsWhenReady();
    }
  }

  ngOnDestroy(): void {
    // Dispose all charts
    Object.values(this.charts).forEach((chart) => {
      if (chart && !chart.isDisposed()) {
        chart.dispose();
      }
    });
    this.charts = {};

    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }

  handleHeaderAction(action: string): void {
    switch (action) {
      case 'dashboard':
        this.router.navigate(['/admin-dashboard']);
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

  customAlert: CustomAlert = {
    show: false,
    type: 'info',
    title: '',
    message: '',
    showCancel: false,
    autoClose: false,
  };

  private alertTimeout: any;

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

  private setupResizeObserver(): void {
    this.resizeObserver = new ResizeObserver(() => {
      Object.values(this.charts).forEach((chart) => {
        if (chart && !chart.isDisposed()) {
          chart.resize();
        }
      });
    });
  }

  loadAnalyticsData(): void {
    console.log('Loading analytics data...');
    this.isLoading = true;
    this.loadingService.show();

    // Check authentication first
    const token =
      localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) {
      console.error('No authentication token found');
      this.loadingService.hide();
      this.isLoading = false;
      this.logout();
      return;
    }

    this.AnalyticsService.getAdminAnalytics().subscribe({
      next: (data: AdminAnalytics) => {
        console.log('Analytics data received:', data);

        // Ensure data structure matches interface
        this.analyticsData = {
          totalEvents: data.totalEvents || 0,
          upcomingEvents: data.upcomingEvents || 0,
          expiredEvents: data.expiredEvents || 0,
          totalRegistrations: data.totalRegistrations || 0,
          eventsByCategory: data.eventsByCategory || {},
          eventsByMonth: data.eventsByMonth || {},
          registrationsByEvent: data.registrationsByEvent || [],
          revenueByEvent: data.revenueByEvent || [],
        };

        console.log('Processed analytics data:', this.analyticsData);

        this.dataLoaded = true;
        this.isLoading = false;
        this.loadingService.hide();

        if (this.viewInitialized) {
          this.initializeChartsWhenReady();
        }
      },
      error: (err) => {
        console.error('Error loading analytics data:', err);
        this.isLoading = false;
        this.loadingService.hide();

        // Set default/empty data to prevent undefined errors
        this.analyticsData = {
          totalEvents: 0,
          upcomingEvents: 0,
          expiredEvents: 0,
          totalRegistrations: 0,
          eventsByCategory: {},
          eventsByMonth: {},
          registrationsByEvent: [],
          revenueByEvent: [],
        };

        // Check for authentication errors
        if (
          err.message &&
          (err.message.includes('401') || err.message.includes('403'))
        ) {
          console.log('Authentication error, redirecting to login');
          this.logout();
        } else {
          // Show error message but continue with empty data
          console.warn('Using empty data due to error:', err.message);
        }
      },
    });
  }

  private initializeChartsWhenReady(): void {
    console.log('Initializing charts when ready...');
    setTimeout(() => {
      this.initializeAllCharts();
    }, 500); // Increased timeout to ensure DOM is ready
  }

  private initializeAllCharts(): void {
    console.log('Initializing all charts...');
    this.disposeAllCharts();

    try {
      this.initializeCategoryChart();
    } catch (error) {
      console.error('Error initializing category chart:', error);
    }

    try {
      this.initializeRegistrationsChart();
    } catch (error) {
      console.error('Error initializing registrations chart:', error);
    }

    try {
      this.initializeRevenueChart();
    } catch (error) {
      console.error('Error initializing revenue chart:', error);
    }

    try {
      this.initializeEventStatusChart();
    } catch (error) {
      console.error('Error initializing event status chart:', error);
    }
  }

  private disposeAllCharts(): void {
    Object.values(this.charts).forEach((chart) => {
      if (chart && !chart.isDisposed()) {
        chart.dispose();
      }
    });
    this.charts = {};
  }

  private initializeCategoryChart(): void {
    const chartDom = document.getElementById('categoryChart');
    if (!chartDom) {
      console.warn('Category chart container not found');
      return;
    }

    console.log(
      'Initializing category chart with data:',
      this.analyticsData.eventsByCategory
    );

    const myChart = echarts.init(chartDom);
    this.charts['category'] = myChart;

    const data = Object.entries(this.analyticsData.eventsByCategory || {}).map(
      ([name, value]) => ({
        name,
        value,
      })
    );

    console.log('Category chart data:', data);

    // Handle empty data case
    if (data.length === 0) {
      const option = {
        title: {
          text: 'Event Categories Distribution',
          subtext: 'No category data available',
          left: 'center',
          textStyle: { color: '#333', fontSize: 16, fontWeight: 'bold' },
        },
      };
      myChart.setOption(option);
      this.setupChartResize('category');
      return;
    }

    const option = {
      title: {
        text: 'Event Categories Distribution',
        left: 'center',
        textStyle: { color: '#333', fontSize: 16, fontWeight: 'bold' },
      },
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b}: {c} ({d}%)',
      },
      legend: {
        orient: 'vertical',
        left: 'left',
        top: 'middle',
      },
      series: [
        {
          name: 'Categories',
          type: 'pie',
          radius: '50%',
          center: ['60%', '50%'],
          data: data,
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)',
            },
          },
          animationType: 'scale',
          animationEasing: 'elasticOut',
        },
      ],
    };

    myChart.setOption(option);
    this.setupChartResize('category');
  }

  private initializeRegistrationsChart(): void {
    const chartDom = document.getElementById('registrationsChart');
    if (!chartDom) {
      console.warn('Registrations chart container not found');
      return;
    }

    console.log(
      'Initializing registrations chart with data:',
      this.analyticsData.registrationsByEvent
    );

    const myChart = echarts.init(chartDom);
    this.charts['registrations'] = myChart;

    // Get events with registrations > 0, sorted by registrations
    const eventsWithRegistrations = (
      this.analyticsData.registrationsByEvent || []
    )
      .filter((item) => item.registrations > 0)
      .sort((a, b) => b.registrations - a.registrations)
      .slice(0, 10);

    if (eventsWithRegistrations.length === 0) {
      // Show message if no registrations
      const option = {
        title: {
          text: 'Top Events by Registrations',
          subtext: 'No registrations data available',
          left: 'center',
          textStyle: { color: '#333', fontSize: 16, fontWeight: 'bold' },
        },
      };
      myChart.setOption(option);
      this.setupChartResize('registrations');
      return;
    }

    const eventTitles = eventsWithRegistrations.map((item) =>
      item.eventTitle.length > 25
        ? item.eventTitle.substring(0, 25) + '...'
        : item.eventTitle
    );
    const registrations = eventsWithRegistrations.map(
      (item) => item.registrations
    );

    const option = {
      title: {
        text: 'Top Events by Registrations',
        left: 'center',
        textStyle: { color: '#333', fontSize: 16, fontWeight: 'bold' },
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: function (params: any) {
          const originalTitle =
            eventsWithRegistrations[params[0].dataIndex].eventTitle;
          return `${originalTitle}<br/>Registrations: ${params[0].value}`;
        },
      },
      grid: {
        left: '15%',
        right: '10%',
        top: '15%',
        bottom: '10%',
      },
      yAxis: {
        type: 'category',
        data: eventTitles,
        axisLabel: { fontSize: 10 },
      },
      xAxis: {
        type: 'value',
        name: 'Registrations',
      },
      series: [
        {
          type: 'bar',
          data: registrations,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(1, 0, 0, 0, [
              { offset: 0, color: '#2196F3' },
              { offset: 1, color: '#21CBF3' },
            ]),
          },
          barWidth: '60%',
        },
      ],
    };

    myChart.setOption(option);
    this.setupChartResize('registrations');
  }

  private initializeRevenueChart(): void {
    const chartDom = document.getElementById('revenueChart');
    if (!chartDom) {
      console.warn('Revenue chart container not found');
      return;
    }

    console.log(
      'Initializing revenue chart with data:',
      this.analyticsData.revenueByEvent
    );

    const myChart = echarts.init(chartDom);
    this.charts['revenue'] = myChart;

    // Get events with revenue > 0, sorted by revenue
    const eventsWithRevenue = (this.analyticsData.revenueByEvent || [])
      .filter((item) => item.revenue > 0)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    if (eventsWithRevenue.length === 0) {
      // Show message if no revenue
      const option = {
        title: {
          text: 'Top Events by Revenue',
          subtext: 'No revenue data available',
          left: 'center',
          textStyle: { color: '#333', fontSize: 16, fontWeight: 'bold' },
        },
      };
      myChart.setOption(option);
      this.setupChartResize('revenue');
      return;
    }

    const eventTitles = eventsWithRevenue.map((item) =>
      item.eventTitle.length > 20
        ? item.eventTitle.substring(0, 20) + '...'
        : item.eventTitle
    );
    const revenues = eventsWithRevenue.map((item) => item.revenue);

    const option = {
      title: {
        text: 'Top Events by Revenue',
        left: 'center',
        textStyle: { color: '#333', fontSize: 16, fontWeight: 'bold' },
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: function (params: any) {
          const originalTitle =
            eventsWithRevenue[params[0].dataIndex].eventTitle;
          return `${originalTitle}<br/>Revenue: ₹${params[0].value.toLocaleString()}`;
        },
      },
      grid: {
        left: '10%',
        right: '10%',
        top: '15%',
        bottom: '15%',
      },
      xAxis: {
        type: 'category',
        data: eventTitles,
        axisLabel: { rotate: 45, fontSize: 10 },
      },
      yAxis: {
        type: 'value',
        name: 'Revenue (₹)',
        axisLabel: {
          formatter: function (value: number) {
            if (value >= 1000) {
              return '₹' + (value / 1000).toFixed(1) + 'K';
            }
            return '₹' + value;
          },
        },
      },
      series: [
        {
          type: 'bar',
          data: revenues,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#FF9800' },
              { offset: 1, color: '#F57C00' },
            ]),
          },
          barWidth: '60%',
        },
      ],
    };

    myChart.setOption(option);
    this.setupChartResize('revenue');
  }

  private initializeEventStatusChart(): void {
    const chartDom = document.getElementById('eventStatusChart');
    if (!chartDom) {
      console.warn('Event status chart container not found');
      return;
    }

    console.log('Initializing event status chart');

    const myChart = echarts.init(chartDom);
    this.charts['eventStatus'] = myChart;

    const data = [
      {
        name: 'Upcoming Events',
        value: this.analyticsData.upcomingEvents || 0,
      },
      { name: 'Expired Events', value: this.analyticsData.expiredEvents || 0 },
    ];

    console.log('Event status data:', data);

    const option = {
      title: {
        text: 'Event Status Overview',
        left: 'center',
        textStyle: { color: '#333', fontSize: 16, fontWeight: 'bold' },
      },
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b}: {c} ({d}%)',
      },
      legend: {
        bottom: '5%',
        left: 'center',
      },
      series: [
        {
          name: 'Event Status',
          type: 'pie',
          radius: ['40%', '70%'],
          center: ['50%', '50%'],
          data: data,
          itemStyle: {
            borderRadius: 10,
            borderColor: '#fff',
            borderWidth: 2,
          },
          label: {
            show: true,
            formatter: '{b}: {d}%',
          },
          color: ['#4CAF50', '#FF5722'],
        },
      ],
    };

    myChart.setOption(option);
    this.setupChartResize('eventStatus');
  }

  private setupChartResize(chartKey: string): void {
    if (this.resizeObserver && this.charts[chartKey]) {
      const chartElement = document.getElementById(chartKey + 'Chart');
      if (chartElement) {
        this.resizeObserver.observe(chartElement);
      }
    }
  }

  refreshData(): void {
    console.log('Refreshing data...');
    // Dispose charts before refreshing data
    this.disposeAllCharts();
    this.dataLoaded = false;
    this.loadAnalyticsData();
  }

  exportAnalyticsData(): void {
    const dataStr = JSON.stringify(this.analyticsData, null, 2);
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
