
// ...existing code...
import { Injectable } from '@angular/core';
import { environment } from '../../environment';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Event } from '../components/user-dashboard/user-dashboard';
import { RegisteredUser } from '../components/organizer-dashboard/organizer-dashboard';
import { RegisteredUsersResponse } from '../components/organizer-dashboard/organizer-dashboard';
import { Location } from '../components/admin-dashboard/admin-dashboard';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})

/**
 * Service for handling event-related API calls.
 */
export class EventService {

  constructor(private http: HttpClient) {}

  /**
   * Gets paginated events by organizer and status.
   * @param organizerId Organizer ID
   * @param status Event status (Approved, Pending, etc.)
   * @param page Page number
   * @param pageSize Page size
   * @returns API response
   */
  getEventsByOrganizerAndStatus(organizerId: string, status: string, page: number = 1, pageSize: number = 6): Observable<any> {
    const url = `${environment.apiBaseUrl}${environment.apis.getEventsByOrganizerAndStatus(organizerId, status)}?page=${page}&pageSize=${pageSize}`;
    return this.http.get<any>(url, { headers: this.getAuthHeaders() });
  }

  /**
   * Returns HTTP headers with authorization token.
   * @returns {HttpHeaders} Auth headers
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
   * Creates a new event.
   * @param {any} data Event data
   * @returns {Observable<any>} API response
   */
  createEvent(data: any) {
    // Transform the data to match C# backend expectations
    const eventData = {
      title: data.title,
      description: data.description,
      date: data.date,
      timeSlot: data.timeSlot,
      // duration: this.convertDurationToMinutes(data.duration), // Convert to minutes
      duration: data.duration,
      locationId: data.locationId, // This should come from selected venue
      category: data.category,
      price: data.price,
      maxRegistrations: data.maxRegistrations,
      createdById: data.createdBy, // Map createdBy to createdById
      artist: data.artist,
      organization: data.organization,
    };

    return this.http.post(
      `${environment.apiBaseUrl}${environment.apis.createEvent}`,
      eventData,
      {
        headers: this.getAuthHeaders(),
      }
    );
  }



  // Add helper method to convert duration
  /**
   * Converts a duration string (e.g., "2 hours 30 min") to minutes.
   * @param {string} durationStr Duration string
   * @returns {number} Duration in minutes
   */
  convertDurationToMinutes(durationStr: string): number {
    if (!durationStr || typeof durationStr !== 'string') return 0;

    if (!durationStr) return 0;

    const hourMatch = durationStr.match(/(\d+)\s*hour/);
    const minMatch = durationStr.match(/(\d+)\s*min/);

    const hours = hourMatch ? parseInt(hourMatch[1]) : 0;
    const minutes = minMatch ? parseInt(minMatch[1]) : 0;

    return hours * 60 + minutes;
  }

  /**
   * Gets all events with pagination.
   * @param {number} [page=1] Page number
   * @param {number} [pageSize=10] Page size
   * @returns {Observable<any>} API response
   */
  getAllEvents(page: number = 1, pageSize: number = 10): Observable<any> {
    let params = new HttpParams().set('page', page).set('pageSize', pageSize);

    const url = `${environment.apiBaseUrl}/events`;
    return this.http.get<any>(url, {
      headers: this.getAuthHeaders(),
      params,
    });
  }

  /**
   * Gets paginated approved events with optional filters.
   * @param {number} [page=1] Page number
   * @param {number} [pageSize=10] Page size
   * @param {any} [filters] Filter options
   * @returns {Observable<any>} API response
   */
  getPaginatedEvents(
    page: number = 1,
    pageSize: number = 10,
    filters?: any
  ): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());

    // Add filter parameters if provided
    if (filters) {
      if (filters.searchQuery)
        params = params.set('search', filters.searchQuery);
      if (filters.category) params = params.set('category', filters.category);
      if (filters.city) params = params.set('city', filters.city);
      if (filters.dateFrom) params = params.set('dateFrom', filters.dateFrom);
      if (filters.dateTo) params = params.set('dateTo', filters.dateTo);
      if (filters.sortBy) params = params.set('sortBy', filters.sortBy);
    }

    const url = `${environment.apiBaseUrl}/events/approved`;

    return this.http.get<any>(url, {
      headers: this.getAuthHeaders(),
      params,
    });
  }

  /**
   * Gets paginated expired events with optional filters.
   * @param {number} [page=1] Page number
   * @param {number} [pageSize=10] Page size
   * @param {any} [filters] Filter options
   * @returns {Observable<any>} API response
   */
  getExpiredPaginatedEvents(
    page: number = 1,
    pageSize: number = 10,
    filters?: any
  ): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());

    // Add filter parameters if provided
    if (filters) {
      if (filters.searchQuery)
        params = params.set('search', filters.searchQuery);
      if (filters.category) params = params.set('category', filters.category);
      if (filters.city) params = params.set('city', filters.city);
      if (filters.dateFrom) params = params.set('dateFrom', filters.dateFrom);
      if (filters.dateTo) params = params.set('dateTo', filters.dateTo);
      if (filters.sortBy) params = params.set('sortBy', filters.sortBy);
    }

    const url = `${environment.apiBaseUrl}/events/expired`;

    return this.http.get<any>(url, {
      headers: this.getAuthHeaders(),
      params,
    });
  }

  /**
   * Gets paginated pending events with optional filters.
   * @param {number} [page=1] Page number
   * @param {number} [pageSize=10] Page size
   * @param {any} [filters] Filter options
   * @returns {Observable<any>} API response
   */
  getPendingPaginatedEvents(
    page: number = 1,
    pageSize: number = 10,
    filters?: any
  ): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());

    // Add filter parameters if provided
    if (filters) {
      if (filters.searchQuery)
        params = params.set('search', filters.searchQuery);
      if (filters.category) params = params.set('category', filters.category);
      if (filters.city) params = params.set('city', filters.city);
      if (filters.dateFrom) params = params.set('dateFrom', filters.dateFrom);
      if (filters.dateTo) params = params.set('dateTo', filters.dateTo);
      if (filters.sortBy) params = params.set('sortBy', filters.sortBy);
    }

    const url = `${environment.apiBaseUrl}/events/pending`;

    return this.http.get<any>(url, {
      headers: this.getAuthHeaders(),
      params,
    });
  }

  /**
   * Gets upcoming events.
   * @returns {Observable<Event[]>} List of upcoming events
   */
  getUpcomingEvents(): Observable<Event[]> {
    const url = `${environment.apiBaseUrl}${environment.apis.getUpcomingEvent}`;
    return this.http
      .get<{ data: Event[] }>(url, {
        headers: this.getAuthHeaders(),
      })
      .pipe(map((res) => res.data));
  }

  /**
   * Gets expired events.
   * @returns {Observable<Event[]>} List of expired events
   */
  getExpiredEvents(): Observable<Event[]> {
    const url = `${environment.apiBaseUrl}${environment.apis.getExpiredEvent}`;
    return this.http
      .get<{ data: Event[] }>(url, {
        headers: this.getAuthHeaders(),
      })
      .pipe(map((res) => res.data));
  }

  /**
   * Gets events by organizer ID with pagination.
   * @param {string} organizerId Organizer ID
   * @param {number} [page=1] Page number
   * @param {number} [pageSize=10] Page size
   * @returns {Observable<any>} API response
   */
  getEventById(
    organizerId: string,
    page: number = 1,
    pageSize: number = 10
  ): Observable<any> {
    let params = new HttpParams().set('page', page).set('pageSize', pageSize);

    return this.http.get<any>(
      `${environment.apiBaseUrl}/events/by-organizer/${organizerId}`,
      {
        headers: this.getAuthHeaders(),
        params,
      }
    );
  }

  /**
   * Updates an event.
   * @param {string} eventId Event ID
   * @param {any} data Updated event data
   * @returns {Observable<any>} API response
   */
  updateEvent(eventId: string, data: any) {
    return this.http.put(
      `${environment.apiBaseUrl}${environment.apis.updateEvent(eventId)}`,
      data,
      {
        headers: this.getAuthHeaders(),
      }
    );
  }

  /**
   * Deletes an event.
   * @param {string} eventId Event ID
   * @returns {Observable<any>} API response
   */
  deleteEvent(eventId: string) {
    return this.http.delete(
      `${environment.apiBaseUrl}${environment.apis.deleteEvent(eventId)}`,
      {
        headers: this.getAuthHeaders(),
      }
    );
  }

  /**
   * Gets registered users for an event.
   * @param {string} eventId Event ID
   * @returns {Observable<{ data: RegisteredUsersResponse }>} Registered users
   */
  getRegisteredUsers(
    eventId: string
  ): Observable<{ data: RegisteredUsersResponse }> {
    return this.http.get<{ data: RegisteredUsersResponse }>(
      `${environment.apiBaseUrl}${environment.apis.getRegisteredUsers(
        eventId
      )}`,
      {
        headers: this.getAuthHeaders(),
      }
    );
  }

  /**
   * Removes a user from an event.
   * @param {string} eventId Event ID
   * @param {string} userId User ID
   * @returns {Observable<any>} API response
   */
  removeUserFromEvent(eventId: string, userId: string) {
    return this.http.delete(
      `${environment.apiBaseUrl}${environment.apis.removeUserFromEvent(
        eventId,
        userId
      )}`,
      {
        headers: this.getAuthHeaders(),
      }
    );
  }

  /**
   * Gets events registered by a user.
   * @param {string} userId User ID
   * @returns {Observable<Event[]>} Registered events
   */
  getRegisteredEvents(userId: string): Observable<Event[]> {
    return this.http
      .get<{ events: Event[] }>(
        `${environment.apiBaseUrl}${environment.apis.registeredEvents(userId)}`,
        {
          headers: this.getAuthHeaders(),
        }
      )
      .pipe(map((res) => res.events));
  }

  /**
   * Registers a user for an event.
   * @param {string} userId User ID
   * @param {string} eventId Event ID
   * @returns {Observable<any>} API response
   */
  registerForEvent(userId: string, eventId: string): Observable<any> {
    const payload = { userId, eventId };
    const url = `${environment.apiBaseUrl}${environment.apis.registerForEvent}`;
    return this.http.post(url, payload, {
      headers: this.getAuthHeaders(),
    });
  }

  /**
   * Deregisters a user from an event.
   * @param {string} userId User ID
   * @param {string} eventId Event ID
   * @returns {Observable<any>} API response
   */
  deregisterFromEvent(userId: string, eventId: string): Observable<any> {
    const url = `${environment.apiBaseUrl}${environment.apis.deregisterForEvent}`;
    const payload = { userId, eventId };

    return this.http.post(
      `${environment.apiBaseUrl}${environment.apis.deregisterForEvent}`,
      { userId, eventId },
      { headers: this.getAuthHeaders() }
    );
  }

  /**
   * Checks for event conflict at a location, date, and time slot.
   * @param {string} locationId Location ID
   * @param {string} date Date string
   * @param {string} timeSlot Time slot
   * @param {string} [excludeEventId] Event ID to exclude from conflict check
   * @returns {Observable<any>} API response
   */
  checkEventConflict(
    locationId: string,
    date: string,
    timeSlot: string,
    excludeEventId?: string
  ): Observable<any> {
    let params = new HttpParams()
      .set('locationId', locationId)
      .set('date', date)
      .set('timeSlot', timeSlot);

    if (excludeEventId) {
      params = params.set('excludeEventId', excludeEventId);
    }

    return this.http.get(`${environment.apiBaseUrl}/events/check-conflict`, {
      headers: this.getAuthHeaders(),
      params,
    });
  }
}
