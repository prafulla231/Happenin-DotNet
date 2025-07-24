import { Injectable } from '@angular/core';
import { environment } from '../../environment';
import { HttpClient , HttpHeaders } from '@angular/common/http';
import { Event } from '../components/organizer-dashboard/organizer-dashboard';
import { RegisteredUser } from '../components/organizer-dashboard/organizer-dashboard';
import { RegisteredUsersResponse } from '../components/organizer-dashboard/organizer-dashboard';
import  { Location } from '../components/admin-dashboard/admin-dashboard';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';


@Injectable({
  providedIn: 'root'
})
export class LocationService {

   constructor(private http: HttpClient) {}

   private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  // createEvent(data: any) {
  //   return this.http.post(`${environment.apiBaseUrl}${environment.apis.createEvent}`, data, {
  //     headers: this.getAuthHeaders()
  //   });
  // }

 fetchLocations(): Observable<Location[]> {
  return this.http.get<any>(`${environment.apiBaseUrl}${environment.apis.fetchLocations}`, {
    headers: this.getAuthHeaders()
  }).pipe(
    map(response => response.data || response) // Handle both wrapped and direct responses
  );
}


  addLocation(location: Location): Observable<{ data: Location }> {
  return this.http.post<{ data: Location }>(`${environment.apiBaseUrl}${environment.apis.addLocation}`, location,{
      headers: this.getAuthHeaders()
    });
}


  bookLocation(data: any) {
    return this.http.post(`${environment.apiBaseUrl}${environment.apis.bookLocation}`, data  , {
      headers: this.getAuthHeaders()
    }); // not defined in environment — consider adding
  }

  cancelBooking(data: any) {
    return this.http.post(`${environment.apiBaseUrl}${environment.apis.cancelBooking}`, data, {
      headers: this.getAuthHeaders()
    }); // not defined in environment
  }

  // deleteLocation(data)

  viewLocation(): Observable<Location[]> {
    return this.http.get<{ data: Location[] }>(`${environment.apiBaseUrl}${environment.apis.viewLocation}`, {
      headers: this.getAuthHeaders()
    })
      .pipe(map(res => res.data));
  }

  // DELETE: Delete a location using state, city, and placeName
 deleteLocation(locationId: string): Observable<any> {
  return this.http.delete(`${environment.apiBaseUrl}${environment.apis.deleteLocation(locationId)}`, {
    headers: this.getAuthHeaders()
  });
}
}
