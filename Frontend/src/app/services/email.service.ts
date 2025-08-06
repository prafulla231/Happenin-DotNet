// email.service.ts - Add this new service to your services folder
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environment';
import jsPDF from 'jspdf';

export interface EmailRequest {
  to: string;
  subject: string;
  htmlContent?: string;
  textContent?: string;
  attachments?: {
    filename: string;
    content: string; // base64 encoded
    contentType: string;
  }[];
}

export interface TicketEmailRequest {
  userId: string;
  eventId: string;
  userEmail: string;
  userName: string;
  sendPDF?: boolean;
  sendDetails?: boolean;
  pdfBase64?: string;
}

@Injectable({
  providedIn: 'root',
})
export class EmailService {
  private apiUrl = `${environment.apiBaseUrl}/email`;

  constructor(private http: HttpClient) {}

  /**
   * Send ticket confirmation email with event details and/or PDF
   */

  private getAuthHeaders(): HttpHeaders {
    const token =
      localStorage.getItem('token') || sessionStorage.getItem('token');
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });
  }

  sendTicketEmail(request: TicketEmailRequest): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${
        localStorage.getItem('token') || sessionStorage.getItem('token')
      }`,
    });

    return this.http.post(`${this.apiUrl}/send-ticket`, request, { headers });
  }

  /**
   * Send custom email
   */
  sendEmail(request: EmailRequest): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${
        localStorage.getItem('token') || sessionStorage.getItem('token')
      }`,
    });

    return this.http.post(`${this.apiUrl}/send`, request, { headers });
  }

  /**
   * Generate ticket PDF as base64 string for email attachment
   */
  generateTicketPDFBase64(event: any, userName: string): string {
    // This is a simplified version of your existing PDF generation
    // You might want to create a shared utility for this
    try {
      const doc = new jsPDF();

      const pageWidth = doc.internal.pageSize.width;
      const margin = 20;

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

      let yPosition = 80;
      const details = [
        { label: 'Event Name', value: String(event.title) },
        { label: 'Description', value: String(event.description) },
        { label: 'Date', value: new Date(event.date).toLocaleDateString() },
        { label: 'Time', value: String(event.timeSlot) },
        { label: 'Duration', value: String(event.duration ?? '') },
        { label: 'Location', value: String(event.location.city) },
        { label: 'Category', value: String(event.category || 'General') },
        { label: 'Price', value: `${event.price} rs` },
        { label: 'Ticket Holder', value: userName },
      ];

      details.forEach((detail) => {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text(`${detail.label}:`, margin, yPosition);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(String(detail.value ?? ''), margin + 70, yPosition);

        yPosition += 12;
      });

      // Footer
      yPosition += 20;
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      const footerText =
        'This is an official ticket. Please present this at the event entrance.';
      doc.text(footerText, pageWidth / 2, yPosition, { align: 'center' });

      yPosition += 10;
      const ticketId = `Ticket ID: ${Date.now()}-${event.id.slice(-6)}`;
      doc.text(ticketId, pageWidth / 2, yPosition, { align: 'center' });

      // Return base64 string of PDF
      return doc.output('datauristring').split(',')[1];
    } catch (error) {
      console.error('Error generating PDF base64:', error);
      return '';
    }
  }
}
