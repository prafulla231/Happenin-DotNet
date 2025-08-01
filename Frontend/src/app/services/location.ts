import { Injectable } from '@angular/core';
import { environment } from '../../environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Location } from '../components/admin-dashboard/admin-dashboard';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * Service for managing location-related API calls.
 * Handles fetching, adding, booking, cancelling, viewing, and deleting locations.
 */
@Injectable({
  providedIn: 'root',
})
export class LocationService {
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
   * Fetches all locations from the backend.
   * @returns {Observable<Location[]>} An observable of the locations array.
   */
  fetchLocations(): Observable<Location[]> {
    return this.http
      .get<any>(`${environment.apiBaseUrl}${environment.apis.fetchLocations}`, {
        headers: this.getAuthHeaders(),
      })
      .pipe(
        map((response) => response.data || response) // Handle both wrapped and direct responses
      );
  }

  /**
   * Adds a new location.
   * @param {Location} location - The location object to add.
   * @returns {Observable<{ data: Location }>} An observable of the added location.
   */
  addLocation(location: Location): Observable<{ data: Location }> {
    return this.http.post<{ data: Location }>(
      `${environment.apiBaseUrl}${environment.apis.addLocation}`,
      location,
      {
        headers: this.getAuthHeaders(),
      }
    );
  }

  /**
   * Books a location.
   * @param {any} data - The booking data.
   * @returns {Observable<any>} An observable of the booking response.
   */
  bookLocation(data: any) {
    return this.http.post(
      `${environment.apiBaseUrl}${environment.apis.bookLocation}`,
      data,
      {
        headers: this.getAuthHeaders(),
      }
    ); // not defined in environment — consider adding
  }

  /**
   * Cancels a location booking.
   * @param {any} data - The cancellation data.
   * @returns {Observable<any>} An observable of the cancellation response.
   */
  cancelBooking(data: any) {
    return this.http.post(
      `${environment.apiBaseUrl}${environment.apis.cancelBooking}`,
      data,
      {
        headers: this.getAuthHeaders(),
      }
    );
  }

  /**
   * Fetches details of all locations for viewing.
   * @returns {Observable<Location[]>} An observable of the locations array.
   */
  viewLocation(): Observable<Location[]> {
    return this.http
      .get<{ data: Location[] }>(
        `${environment.apiBaseUrl}${environment.apis.viewLocation}`,
        {
          headers: this.getAuthHeaders(),
        }
      )
      .pipe(map((res) => res.data));
  }

  // DELETE: Delete a location using state, city, and placeName
  /**
   * Deletes a location by its ID.
   * @param {string} locationId - The ID of the location to delete.
   * @returns {Observable<any>} An observable of the delete response.
   */
  deleteLocation(locationId: string): Observable<any> {
    return this.http.delete(
      `${environment.apiBaseUrl}${environment.apis.deleteLocation(locationId)}`,
      {
        headers: this.getAuthHeaders(),
      }
    );
  }
}
