import { Injectable } from '@angular/core';
import { environment } from '../../environment';
import { HttpClient } from '@angular/common/http';

/**
 * Service for handling authentication-related operations such as login, registration,
 * token management, and user role retrieval.
 */
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  /**
   * Retrieves the JWT token from local storage.
   * @returns {string | null} The JWT token if present, otherwise null.
   */
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  /**
   * Extracts and returns the user role from the JWT token.
   * @returns {string | null} The user role if available, otherwise null.
   */
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

  /**
   * Checks if the user is currently logged in.
   * @returns {boolean} True if a token exists, otherwise false.
   */
  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  /**
   * Initializes the AuthService with HttpClient.
   * @param http The Angular HttpClient instance.
   */
  constructor(private http: HttpClient) {}

  /**
   * Registers a new user.
   * @param data The registration data.
   * @returns {Observable<any>} The HTTP response observable.
   */
  registerUser(data: any) {
    return this.http.post(
      `${environment.apiBaseUrl}${environment.apis.registerUser}`,
      data
    );
  }

  /**
   * Logs in a user.
   * @param data The login credentials.
   * @returns {Observable<any>} The HTTP response observable.
   */
  loginUser(data: any) {
    return this.http.post(
      `${environment.apiBaseUrl}${environment.apis.loginUser}`,
      data
    );
  }

  /**
   * Fetches protected user data from the backend.
   * @returns {Observable<any>} The HTTP response observable.
   */
  getProtected() {
    return this.http.get(`${environment.apiBaseUrl}/users/protected`);
  }
}
