import { Injectable } from '@angular/core';
import { environment } from '../../environment';
import { HttpClient , HttpHeaders } from '@angular/common/http';
import { Event } from '../components/organizer-dashboard/organizer-dashboard';
import { RegisteredUser } from '../components/organizer-dashboard/organizer-dashboard';
import { RegisteredUsersResponse } from '../components/organizer-dashboard/organizer-dashboard';
import  { Location } from '../components/admin-dashboard/admin-dashboard';
import  { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
@Injectable({
  providedIn: 'root'
})
export class ApprovalService {

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  approveEvent(data: any) {
    return this.http.post(`${environment.apiBaseUrl}${environment.apis.approveEvent}`, data,{
      headers: this.getAuthHeaders()
    });
  }

  denyEvent(eventId: string) {
    return this.http.delete(`${environment.apiBaseUrl}${environment.apis.denyEvent(eventId)}`,{
      headers: this.getAuthHeaders()
    });
  }

  viewApprovalRequests(): Observable<{ data: Event[] }> {
    const url = `${environment.apiBaseUrl}${environment.apis.viewApprovalRequests}`;
    return this.http.get<{ data: Event[] }>(url,{
      headers: this.getAuthHeaders()
    });
  }


  viewApprovalRequestById(requestId: string): Observable<Event[]> {
  return this.http
    .get<{ data: Event[] }>(
      `${environment.apiBaseUrl}${environment.apis.viewApprovalRequestById(requestId)}`,{
      headers: this.getAuthHeaders()
    }
    )
    .pipe(map(res => res.data)); // Extract data only
}

}
