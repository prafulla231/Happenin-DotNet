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
      this.router.navigate(['/login']);
      return false;
    }

    try {
      const payloadBase64 = token.split('.')[1];
      const decodedPayload = JSON.parse(atob(payloadBase64));

      const userRole = decodedPayload.role;

      const expectedRole = route.data['role'];
      if (expectedRole && userRole !== expectedRole) {
        alert('Access denied!');
        this.router.navigate(['/login']);
        return false;
      }

      return true;
    } catch (err) {
      console.error('Token error', err);
      this.router.navigate(['/login']);
      return false;
    }
  }
}
