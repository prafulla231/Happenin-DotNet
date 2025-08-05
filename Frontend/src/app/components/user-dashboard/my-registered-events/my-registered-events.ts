// my-registered-events.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import jsPDF from 'jspdf';
import { LoadingService } from '../../loading';
import { ApprovalService } from '../../../services/approval';
import { AuthService } from '../../../services/auth';
import { EventService } from '../../../services/event';
import { environment } from '../../../../environment';
import { EmailService } from '../../../services/email.service';
import { Router } from '@angular/router';
import { HeaderComponent, HeaderButton } from '../../../common/header/header';
import { FooterComponent } from '../../../common/footer/footer';
import { CustomAlertComponent } from '../../custom-alert/custom-alert';

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  timeSlot: string;
  duration: string;
  city: string;
  // location: string;
  location: Location;
  category: string;
  price: number;
  maxRegistrations: number;
  createdBy: string;
  artist?: string;
  organization?: string;
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

export interface Booking {
  id: string; // This should be a GUID string (BookingId)
  date: string; // or Date type
  timeSlot: string;
  eventId: string; // This should be a GUID string
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
  selector: 'app-my-registered-events',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    HeaderComponent,
    FooterComponent,
    CustomAlertComponent,
  ],
  templateUrl: './my-registered-events.html',
  styleUrls: ['./my-registered-events.scss'],
})
export class MyRegisteredEvents implements OnInit, OnDestroy {
  registeredEvents: Event[] = [];
  userId: string | null = null;
  userName: string | null = null;
  userEmail: string | null = null;

  // Single alert system
  customAlert: CustomAlert = {
    show: false,
    type: 'info',
    title: '',
    message: '',
    showCancel: false,
    autoClose: true,
  };

  private apiUrl = environment.apiBaseUrl;

  headerButtons: HeaderButton[] = [
    { text: 'Available Events', action: 'goToAvailableEvents' },
    { text: 'Contact', action: 'openContact' },
    { text: 'Logout', action: 'logout' },
  ];

  constructor(
    private http: HttpClient,
    private loadingService: LoadingService,
    private approvalService: ApprovalService,
    private authService: AuthService,
    private eventService: EventService,
    private emailService: EmailService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadingService.show();
    this.initializeUser();
    this.loadRegisteredEvents();
  }

  ngOnDestroy(): void {
    // Don't hide loading service here - it should be hidden when operations complete
    // this.loadingService.hide();
  }

  private initializeUser(): void {
    const token =
      localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) {
      this.userId = null;
      this.userName = null;
      this.userEmail = null;
      return;
    }
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid token format');
      }
      const payloadBase64 = parts[1];
      const decoded = JSON.parse(atob(payloadBase64));
      this.userId = decoded.userId || decoded.id || null;
      this.userName = decoded.userName || decoded.name || null;
      this.userEmail = decoded.userEmail || decoded.email || null;
    } catch (err) {
      this.userId = null;
      this.userName = null;
      this.userEmail = null;
    }
  }

  handleHeaderAction(action: string): void {
    switch (action) {
      case 'goToAvailableEvents':
        this.router.navigate(['/user-dashboard']);
        break;
      case 'openContact':
        this.openContact();
        break;
      case 'logout':
        this.logout();
        break;
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
      autoClose: false,
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

  get displayUserName(): string {
    return this.userName || 'Guest';
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  loadRegisteredEvents() {
    if (!this.userId) {
      this.loadingService.hide(); // Hide loading if no user
      return;
    }

    this.eventService.getRegisteredEvents(this.userId).subscribe({
      next: (res: any[]) => {
        this.registeredEvents = res;
        this.loadingService.hide(); // Hide loading on success
      },
      error: (err) => {
        console.error('Error loading registered events', err);
        this.loadingService.hide(); // Hide loading on error
        this.showAlert(
          'error',
          'Loading Failed',
          'Failed to load your registered events.'
        );
      },
    });
  }

  deregister(userId: string, eventId: string) {
    const event = this.registeredEvents.find((e) => e.id === eventId);
    const eventTitle = event ? event.title : 'this event';

    this.showConfirmation(
      'Confirm Deregistration',
      `Are you sure you want to deregister from "${eventTitle}"? This action cannot be undone.`,
      () => {
        this.loadingService.show();

        this.eventService.deregisterFromEvent(userId, eventId).subscribe({
          next: () => {
            this.loadRegisteredEvents();
            this.showAlert(
              'success',
              'Deregistration Successful',
              `You have been deregistered from "${eventTitle}".`
            );
          },
          error: (err) => {
            console.error('Deregistration failed', err);
            this.loadingService.hide();
            this.showAlert(
              'error',
              'Deregistration Failed',
              'Failed to deregister from the event. Please try again.'
            );
          },
        });
      },
      () => {
        this.showAlert(
          'info',
          'Deregistration Cancelled',
          'You remain registered for the event.'
        );
      }
    );
  }

  downloadTicket(event: Event) {
    this.showConfirmation(
      'Download Ticket',
      `Generate and download ticket for "${event.title}"?`,
      () => {
        this.generateTicketPDF(event);
      }
    );
  }

  private generateTicketPDF(event: Event) {
    this.loadingService.show();
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      const margin = 20;
      const contentWidth = pageWidth - margin * 2;

      // Header Background
      doc.setFillColor(102, 126, 234);
      doc.rect(0, 0, pageWidth, 60, 'F');

      // Header Text
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('EVENT TICKET', pageWidth / 2, 30, { align: 'center' });

      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text('Official Entry Pass', pageWidth / 2, 45, { align: 'center' });

      // Reset text color for content
      doc.setTextColor(0, 0, 0);

      // Start content below header with more spacing
      let yPosition = 80;
      const lineHeight = 8;
      const sectionSpacing = 15;

      // Event details with better formatting
      const details = [
        { label: 'Event Name', value: event.title },
        { label: 'Description', value: event.description },
        { label: 'Date', value: this.formatDate(event.date) },
        { label: 'Time', value: event.timeSlot },
        { label: 'Duration', value: `${event.duration} min` },
        { label: 'Location', value: event.location.city },
        { label: 'Category', value: event.category || 'General' },
        { label: 'Price', value: `${event.price} rs` }, // Convert to string with currency formatting
        { label: 'Ticket Holder', value: this.userName || 'Guest' },
      ];
      console.log('Ticket Details:', details);
      details.forEach((detail, index) => {
        // Check if we need a new page
        if (yPosition > pageHeight - 40) {
          doc.addPage();
          yPosition = 30;
        }

        // Label
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text(`${detail.label}:`, margin, yPosition);

        // Value with text wrapping
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);

        const labelWidth = 60;
        const valueX = margin + labelWidth;
        const maxValueWidth = contentWidth - labelWidth;

        // Handle long text with proper wrapping - ensure value is string
        const valueString = String(detail.value); // Convert to string to be safe
        const splitText = doc.splitTextToSize(valueString, maxValueWidth);
        doc.text(splitText, valueX, yPosition);

        // Calculate next position based on wrapped text
        const textHeight = Array.isArray(splitText)
          ? splitText.length * lineHeight
          : lineHeight;
        yPosition += Math.max(textHeight, lineHeight) + 5;
      });

      // Add some spacing before footer
      yPosition += sectionSpacing;

      // Separator line
      if (yPosition > pageHeight - 60) {
        doc.addPage();
        yPosition = 30;
      }

      doc.setDrawColor(102, 126, 234);
      doc.setLineWidth(0.5);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);

      // Footer
      yPosition += 15;
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.setFont('helvetica', 'normal');

      const footerText1 =
        'This is an official ticket. Please present this ticket at the event entrance.';
      doc.text(footerText1, pageWidth / 2, yPosition, { align: 'center' });

      yPosition += 10;
      const footerText2 = `Generated on: ${new Date().toLocaleString()}`;
      doc.text(footerText2, pageWidth / 2, yPosition, { align: 'center' });

      // Add ticket ID for authenticity
      yPosition += 10;
      const ticketId = `Ticket ID: ${Date.now()}-${event.id.slice(-6)}`;
      doc.text(ticketId, pageWidth / 2, yPosition, { align: 'center' });

      // Generate filename
      const fileName = `ticket-${event.title
        .replace(/[^a-z0-9]/gi, '_')
        .toLowerCase()}.pdf`;

      // Save the PDF
      doc.save(fileName);

      this.loadingService.hide();
      this.showAlert(
        'success',
        'Ticket Downloaded',
        `Your ticket for "${event.title}" has been downloaded successfully!`
      );
    } catch (error) {
      console.error('Error generating ticket PDF:', error);
      this.loadingService.hide();
      this.showAlert(
        'error',
        'Download Failed',
        'Failed to generate the ticket. Please try again.'
      );
    }
  }

  scrollToRegisteredEvents() {
    const registeredSection = document.querySelector('.registered-section');
    if (registeredSection) {
      registeredSection.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  }

  openContact(): void {
    this.router.navigate(['/contact']);
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

  showAlert(
    type: 'success' | 'error' | 'warning' | 'info' | 'confirm',
    title: string,
    message: string,
    confirmAction?: () => void,
    cancelAction?: () => void
  ): void {
    this.customAlert = {
      show: true,
      type,
      title,
      message,
      confirmAction,
      cancelAction,
      showCancel: type === 'confirm',
      autoClose: type !== 'confirm',
    };

    // Auto-close for non-confirm alerts
    if (type !== 'confirm') {
      setTimeout(() => {
        this.closeAlert();
      }, 3000);
    }
  }

  closeAlert(): void {
    this.customAlert.show = false;
    this.customAlert.confirmAction = undefined;
    this.customAlert.cancelAction = undefined;
  }
}
