import { Injectable } from '@angular/core';
import { environment } from '../../environment';
import { HttpClient, HttpHeaders , HttpParams  } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Event } from '../components/user-dashboard/user-dashboard';
import { RegisteredUser } from '../components/organizer-dashboard/organizer-dashboard';
import { RegisteredUsersResponse } from '../components/organizer-dashboard/organizer-dashboard';
import { Location } from '../components/admin-dashboard/admin-dashboard';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class EventService {

  constructor(private http: HttpClient) {}

  // Helper method to get auth headers
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  createEvent(data: any) {
    return this.http.post(`${environment.apiBaseUrl}${environment.apis.createEvent}`, data, {
      headers: this.getAuthHeaders()
    });
  }

  getAllEvents(): Observable<Event[]> {
    const url = `${environment.apiBaseUrl}${environment.apis.getAllEvents}`;
    return this.http.get<{ data: Event[] }>(url, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(res => res.data)
    );
  }

//   getPaginatedEvents(page: number = 1, limit: number =10): Observable<any> {
//   const url = `${environment.apiBaseUrl}/events/paginatedEvents?page=${page}&limit=${limit}`;
//   return this.http.get<any>(url, {
//     // headers: this.getAuthHeaders()
//   });
// }

getPaginatedEvents(page: number = 1, limit: number = 10, filters: any = {}): Observable<any> {
  let params = new HttpParams()
    .set('page', page)
    .set('limit', limit);

  Object.entries(filters).forEach(([key, value]) => {
    if (value) {
      params = params.set(key, String(value));

    }
  });

  const url = `${environment.apiBaseUrl}/events/paginatedEvents`;

  return this.http.get<any>(url, {
    headers: this.getAuthHeaders(),
    params
  });
}


  getUpcomingEvents(): Observable<Event[]> {
    const url = `${environment.apiBaseUrl}${environment.apis.getUpcomingEvent}`;
    return this.http.get<{ data: Event[] }>(url, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(res => res.data)
    );
  }


  getExpiredEvents(): Observable<Event[]> {
    const url = `${environment.apiBaseUrl}${environment.apis.getExpiredEvent}`;
    return this.http.get<{ data: Event[] }>(url, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(res => res.data)
    );
  }


  getEventById(organizerId: string): Observable<Event[]> {
    return this.http.get<{ data: Event[] }>(`${environment.apiBaseUrl}${environment.apis.getEventsByOrganizer(organizerId)}`, {
      headers: this.getAuthHeaders()
    }).pipe(map(res => res.data));
  }

  updateEvent(eventId: string, data: any) {
    return this.http.put(`${environment.apiBaseUrl}${environment.apis.updateEvent(eventId)}`, data, {
      headers: this.getAuthHeaders()
    });
  }

  deleteEvent(eventId: string) {
    return this.http.delete(`${environment.apiBaseUrl}${environment.apis.deleteEvent(eventId)}`, {
      headers: this.getAuthHeaders()
    });
  }

  getRegisteredUsers(eventId: string): Observable<{ data: RegisteredUsersResponse }> {
    return this.http.get<{ data: RegisteredUsersResponse }>(`${environment.apiBaseUrl}${environment.apis.getRegisteredUsers(eventId)}`, {
      headers: this.getAuthHeaders()
    });
  }

  removeUserFromEvent(eventId: string, userId: string) {
    return this.http.delete(`${environment.apiBaseUrl}${environment.apis.removeUserFromEvent(eventId, userId)}`, {
      headers: this.getAuthHeaders()
    });
  }

  getRegisteredEvents(userId: string): Observable<Event[]> {
    return this.http
      .get<{ events: Event[] }>(`${environment.apiBaseUrl}${environment.apis.registeredEvents(userId)}`, {
        headers: this.getAuthHeaders()
      })
      .pipe(map(res => res.events));
  }

  registerForEvent(userId: string, eventId: string): Observable<any> {
    const payload = { userId, eventId };
    const url = `${environment.apiBaseUrl}${environment.apis.registerForEvent}`;
    return this.http.post(url, payload, {
      headers: this.getAuthHeaders()
    });
  }

  deregisterFromEvent(userId: string, eventId: string): Observable<any> {
    const url = `${environment.apiBaseUrl}${environment.apis.deregisterForEvent}`;
    const payload = { userId, eventId };

    return this.http.request('delete', url, {
      body: payload,
      headers: this.getAuthHeaders()
    });
  }
}

