import { Injectable } from '@angular/core';
import { environment } from '../../environment';
import { HttpClient } from '@angular/common/http';
import { Event } from '../components/organizer-dashboard/organizer-dashboard';
import { RegisteredUser } from '../components/organizer-dashboard/organizer-dashboard';
import { RegisteredUsersResponse } from '../components/organizer-dashboard/organizer-dashboard';
import  { Location } from '../components/admin-dashboard/admin-dashboard';


@Injectable({
  providedIn: 'root'
})
export class AuthService {

  getToken(): string | null {
    return localStorage.getItem('token');
  }

   getUserRole(): string | null {
    const token = this.getToken();
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.role;
    } catch (e) {
      return null;
    }
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }



  constructor(private http: HttpClient) {}




  registerUser(data: any) {
    return this.http.post(`${environment.apiBaseUrl}${environment.apis.registerUser}`, data);
  }

  loginUser(data: any) {
    return this.http.post(`${environment.apiBaseUrl}${environment.apis.loginUser}`, data);
  }

  getProtected() {
    return this.http.get(`${environment.apiBaseUrl}/users/protected`);
  }
}
