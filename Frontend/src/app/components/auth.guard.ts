import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const token = localStorage.getItem('token');

    if (!token) {
      console.warn('❌ No token found in localStorage');
      this.router.navigate(['/login']);
      return false;
    }

    try {
      const payloadBase64 = token.split('.')[1];
      const decodedPayload = JSON.parse(atob(payloadBase64));

      const userRole =
        decodedPayload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ||
        decodedPayload.role ||
        decodedPayload.Role ||
        decodedPayload.roles;

      const expectedRole = route.data['role'];

      console.log('✅ Decoded Token Payload (full):', JSON.stringify(decodedPayload, null, 2));
      console.log('🔑 User role:', userRole);
      console.log('📌 Expected role:', expectedRole);

      if (expectedRole && userRole?.toLowerCase() !== expectedRole.toLowerCase()) {
        console.warn('🚫 Role mismatch. Access denied.');
        this.router.navigate(['/unauthorized']);
        return false;
      }

      return true;
    } catch (err) {
      console.error('❌ Error decoding token:', err);
      this.router.navigate(['/login']);
      return false;
    }
  }
}
