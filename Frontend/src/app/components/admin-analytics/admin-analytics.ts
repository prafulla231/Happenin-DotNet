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

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule, RouterModule, HeaderComponent, FooterComponent],
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

  adminButtons: HeaderButton[] = [
    { text: 'Dashboard', action: 'dashboard', style: 'primary' },
    // { text: 'Upcoming Events', action: 'viewAvailableEvents' },
    // { text: 'Pending Approvals', action: 'viewPendingEvents' },
    // { text: 'Expired Events', action: 'viewExpiredEvents' },
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
    this.loadAnalyticsData();
    this.setupResizeObserver();
  }

  ngAfterViewInit(): void {
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
      // case 'viewAvailableEvents':
      //   this.router.navigate(['/admin-dashboard']); // Navigate to admin dashboard and handle the action there
      //   break;
      // case 'viewPendingEvents':
      //   this.router.navigate(['/admin-dashboard']); // Navigate to admin dashboard and handle the action there
      //   break;
      // case 'viewExpiredEvents':
      //   this.router.navigate(['/admin-dashboard']); // Navigate to admin dashboard and handle the action there
      //   break;
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

  private setupResizeObserver(): void {
    this.resizeObserver = new ResizeObserver(() => {
      Object.values(this.charts).forEach((chart) => {
        if (chart && !chart.isDisposed()) {
          chart.resize();
        }
      });
    });
  }

  /*loadAnalyticsData(): void {
    this.loadingService.show();

    // Call the admin analytics API endpoint
    this.http.get<{ success: boolean; data: AnalyticsData }>('http://localhost:5000/api/analytics/admin', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token') || sessionStorage.getItem('token')}`
      }
    }).subscribe({
      next: (response) => {
        if (response.success) {
          this.analyticsData = response.data;
          console.log('Analytics data loaded:', this.analyticsData);
          this.dataLoaded = true;
          this.loadingService.hide();

          // Initialize charts if view is ready
          if (this.viewInitialized) {
            this.initializeChartsWhenReady();
          }
        } else {
          console.error('Failed to load analytics data');
          this.loadingService.hide();
        }
      },
      error: (err) => {
        console.error('Error loading analytics data:', err);
        this.loadingService.hide();
        // Handle authentication errors
        if (err.status === 401 || err.status === 403) {
          this.logout();
        }
      }
    });
  }*/

  loadAnalyticsData(): void {
    this.loadingService.show();

    this.AnalyticsService.getAdminAnalytics().subscribe({
      next: (data: AdminAnalytics) => {
        this.analyticsData = data;
        this.dataLoaded = true;
        if (this.viewInitialized) this.initializeChartsWhenReady();
        this.loadingService.hide();
      },
      error: (err) => {
        console.error('Error loading analytics data:', err.message);
        this.loadingService.hide();
        if (err.message.includes('401') || err.message.includes('403')) {
          this.logout();
        }
      },
    });
  }

  private initializeChartsWhenReady(): void {
    // Wait a bit for DOM to be fully ready
    setTimeout(() => {
      this.initializeAllCharts();
    }, 300);
  }

  private initializeAllCharts(): void {
    // Dispose existing charts first to prevent multiple initialization
    this.disposeAllCharts();

    // Initialize each chart individually with error handling
    try {
      this.initializeOverviewChart();
    } catch (error) {
      console.error('Error initializing overview chart:', error);
    }

    try {
      this.initializeCategoryChart();
    } catch (error) {
      console.error('Error initializing category chart:', error);
    }

    try {
      this.initializeMonthlyTrendsChart();
    } catch (error) {
      console.error('Error initializing monthly trends chart:', error);
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

  private initializeOverviewChart(): void {
    const chartDom = document.getElementById('overviewChart');
    if (!chartDom) {
      console.warn('Overview chart container not found');
      return;
    }

    const myChart = echarts.init(chartDom);
    this.charts['overview'] = myChart;

    const option = {
      title: {
        text: 'Key Performance Indicators',
        left: 'center',
        textStyle: { color: '#333', fontSize: 18, fontWeight: 'bold' },
      },
      tooltip: { trigger: 'item' },
      series: [
        {
          type: 'gauge',
          center: ['25%', '60%'],
          radius: '50%',
          detail: { formatter: '{value}' },
          data: [
            { value: this.analyticsData.totalEvents, name: 'Total Events' },
          ],
          axisLine: { lineStyle: { color: [[1, '#4CAF50']] } },
        },
        {
          type: 'gauge',
          center: ['75%', '60%'],
          radius: '50%',
          max: Math.max(this.analyticsData.totalRegistrations, 100),
          detail: { formatter: '{value}' },
          data: [
            {
              value: this.analyticsData.totalRegistrations,
              name: 'Registrations',
            },
          ],
          axisLine: { lineStyle: { color: [[1, '#2196F3']] } },
        },
      ],
    };

    myChart.setOption(option);
    this.setupChartResize('overview');
  }

  private initializeCategoryChart(): void {
    const chartDom = document.getElementById('categoryChart');
    if (!chartDom) {
      console.warn('Category chart container not found');
      return;
    }

    const myChart = echarts.init(chartDom);
    this.charts['category'] = myChart;

    const data = Object.entries(this.analyticsData.eventsByCategory).map(
      ([name, value]) => ({
        name,
        value,
      })
    );

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

  private initializeMonthlyTrendsChart(): void {
    const chartDom = document.getElementById('monthlyTrendsChart');
    if (!chartDom) {
      console.warn('Monthly trends chart container not found');
      return;
    }

    const myChart = echarts.init(chartDom);
    this.charts['monthlyTrends'] = myChart;

    // Sort months chronologically
    const monthOrder = [
      'Jan 2025',
      'Feb 2025',
      'Mar 2025',
      'Apr 2025',
      'May 2025',
      'Jun 2025',
      'Jul 2024',
      'Aug 2024',
      'Sep 2024',
      'Oct 2024',
      'Nov 2024',
      'Dec 2024',
    ];

    const months = monthOrder.filter((month) =>
      this.analyticsData.eventsByMonth.hasOwnProperty(month)
    );
    const eventCounts = months.map(
      (month) => this.analyticsData.eventsByMonth[month] || 0
    );

    const option = {
      title: {
        text: 'Monthly Event Trends',
        left: 'center',
        textStyle: { color: '#333', fontSize: 16, fontWeight: 'bold' },
      },
      tooltip: {
        trigger: 'axis',
        formatter: function (params: any) {
          return `${params[0].name}<br/>Events: ${params[0].value}`;
        },
      },
      xAxis: {
        type: 'category',
        data: months,
        axisPointer: { type: 'shadow' },
        axisLabel: { rotate: 45 },
      },
      yAxis: {
        type: 'value',
        name: 'Number of Events',
      },
      series: [
        {
          name: 'Events',
          type: 'line',
          data: eventCounts,
          itemStyle: { color: '#4CAF50' },
          lineStyle: { width: 3 },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(76, 175, 80, 0.3)' },
              { offset: 1, color: 'rgba(76, 175, 80, 0.1)' },
            ]),
          },
          smooth: true,
        },
      ],
    };

    myChart.setOption(option);
    this.setupChartResize('monthlyTrends');
  }

  private initializeRegistrationsChart(): void {
    const chartDom = document.getElementById('registrationsChart');
    if (!chartDom) {
      console.warn('Registrations chart container not found');
      return;
    }

    const myChart = echarts.init(chartDom);
    this.charts['registrations'] = myChart;

    // Get events with registrations > 0, sorted by registrations
    const eventsWithRegistrations = this.analyticsData.registrationsByEvent
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

    const myChart = echarts.init(chartDom);
    this.charts['revenue'] = myChart;

    // Get events with revenue > 0, sorted by revenue
    const eventsWithRevenue = this.analyticsData.revenueByEvent
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

    const myChart = echarts.init(chartDom);
    this.charts['eventStatus'] = myChart;

    const data = [
      { name: 'Upcoming Events', value: this.analyticsData.upcomingEvents },
      { name: 'Expired Events', value: this.analyticsData.expiredEvents },
    ];

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

  logout(): void {
    localStorage.clear();
    sessionStorage.clear();
    this.router.navigate(['/login']);
  }
}
