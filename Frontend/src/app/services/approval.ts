import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Event } from '../components/organizer-dashboard/organizer-dashboard';
import { RegisteredUser } from '../components/organizer-dashboard/organizer-dashboard';
import { RegisteredUsersResponse } from '../components/organizer-dashboard/organizer-dashboard';
import { Location } from '../components/admin-dashboard/admin-dashboard';
import { environment } from '../../environment';

@Injectable({
  providedIn: 'root',
})
export class ApprovalService {
  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });
  }

  // ✅ Generic status updater
  private updateEventStatus(eventId: string, status: 'Approved' | 'Rejected'): Observable<any> {
    const url = `${environment.apiBaseUrl}/events/${eventId}/status`;
    return this.http.patch(
      url,
      { status },
      { headers: this.getAuthHeaders() }
    );
  }

  // ✅ Approve Event
  approveEvent(eventId: string): Observable<any> {
    return this.updateEventStatus(eventId, 'Approved');
  }

  // ✅ Reject/Deny Event
  denyEvent(eventId: string): Observable<any> {
    return this.updateEventStatus(eventId, 'Rejected');
  }

  // ✅ Get all events with status 'Pending'
  viewApprovalRequests(): Observable<{ data: Event[] }> {
    const url = `${environment.apiBaseUrl}${environment.apis.viewApprovalRequests}`;
    return this.http.get<{ data: Event[] }>(url, {
      headers: this.getAuthHeaders(),
    });
  }

  // ✅ Get details of a single event by ID
  viewApprovalRequestById(requestId: string): Observable<Event[]> {
    const url = `${environment.apiBaseUrl}${environment.apis.viewApprovalRequestById(requestId)}`;
    return this.http.get<{ data: Event[] }>(url, {
      headers: this.getAuthHeaders(),
    }).pipe(map(res => res.data));
  }
}

