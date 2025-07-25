import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environment';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private baseUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  getAllUsers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/roles/users`);
  }

  getAllOrganizers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/roles/organizers`);
  }

  getAllAdmins(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/roles/admins`);
  }
}
