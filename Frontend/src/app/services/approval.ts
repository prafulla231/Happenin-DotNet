import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Event } from '../components/organizer-dashboard/organizer-dashboard';
import { environment } from '../../environment';

/**
 * Service for handling event approval workflows.
 * Provides methods to approve, deny, and view approval requests for events.
 */
@Injectable({
  providedIn: 'root',
})
export class ApprovalService {
  constructor(private http: HttpClient) {}

  /**
   * Returns HTTP headers with authorization token for API requests.
   * @returns {HttpHeaders} The HTTP headers with Authorization and Content-Type.
   */
  private getAuthHeaders(): HttpHeaders {
    const token =
      localStorage.getItem('token') || sessionStorage.getItem('token');
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });
  }

  /**
   * Updates the status of an event (approve or reject).
   * @param {string} eventId - The ID of the event.
   * @param {'Approved' | 'Rejected'} status - The new status for the event.
   * @returns {Observable<any>} An observable of the update response.
   */
  private updateEventStatus(
    eventId: string,
    status: 'Approved' | 'Rejected'
  ): Observable<any> {
    const url = `${environment.apiBaseUrl}/events/${eventId}/status`;
    return this.http.patch(url, { status }, { headers: this.getAuthHeaders() });
  }

  /**
   * Approves an event by its ID.
   * @param {string} eventId - The ID of the event to approve.
   * @returns {Observable<any>} An observable of the approval response.
   */
  approveEvent(eventId: string): Observable<any> {
    return this.updateEventStatus(eventId, 'Approved');
  }

  /**
   * Denies (rejects) an event by its ID.
   * @param {string} eventId - The ID of the event to deny.
   * @returns {Observable<any>} An observable of the denial response.
   */
  denyEvent(eventId: string): Observable<any> {
    return this.updateEventStatus(eventId, 'Rejected');
  }

  /**
   * Retrieves all events with status 'Pending' for approval.
   * @returns {Observable<{ data: Event[] }>} An observable of the pending events.
   */
  viewApprovalRequests(): Observable<{ data: Event[] }> {
    const url = `${environment.apiBaseUrl}${environment.apis.viewApprovalRequests}`;
    return this.http.get<{ data: Event[] }>(url, {
      headers: this.getAuthHeaders(),
    });
  }

  /**
   * Retrieves details of a single event approval request by its ID.
   * @param {string} requestId - The ID of the approval request.
   * @returns {Observable<Event[]>} An observable of the event details.
   */
  viewApprovalRequestById(requestId: string): Observable<Event[]> {
    const url = `${
      environment.apiBaseUrl
    }${environment.apis.viewApprovalRequestById(requestId)}`;
    return this.http
      .get<{ data: Event[] }>(url, {
        headers: this.getAuthHeaders(),
      })
      .pipe(map((res) => res.data));
  }
}
