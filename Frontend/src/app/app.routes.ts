import { Routes } from '@angular/router';
import { OrganizerDashboardComponent } from './components/organizer-dashboard/organizer-dashboard';
import { UserDashboardComponent } from './components/user-dashboard/user-dashboard';
import { AdminDashboardComponent } from './components/admin-dashboard/admin-dashboard';
import { AdminUpcomingEvents } from './components/admin-dashboard/admin-upcoming-events/admin-upcoming-events';
import { AdminExpiredEvents } from './components/admin-dashboard/admin-expired-events/admin-expired-events';
import { AuthGuard } from './components/auth.guard';
import { Contact } from './components/contact/contact';
import { OrganizerAnalyticsComponent } from './components/organizer-analytics/organizer-analytics';
import { AnalyticsComponent } from './components/admin-analytics/admin-analytics';
import { MyRegisteredEvents } from './components/user-dashboard/my-registered-events/my-registered-events';
import { PendingApprovals } from './components/admin-dashboard/admin-pending-approvals/admin-pending-approvals';
import { MyCreatedEventsComponent } from './components/organizer-dashboard/my-created-events/my-created-events';
import { OrganizerPendingApprovalsComponent } from './components/organizer-dashboard/my-pending-approvals/my-pending-approvals';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/home/home').then((m) => m.HomeComponent),
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./components/auth/login/login').then((m) => m.LoginComponent),
  },
  { path: 'contact', component: Contact },
  {
    path: 'analytics',
    component: OrganizerAnalyticsComponent,
    // canActivate: [AuthGuard],
    data: { role: 'organizer' },
  },
  {
    path: 'admin-analytics',
    component: AnalyticsComponent,
    canActivate: [AuthGuard],
    data: { role: 'admin' },
  },
  {
    path: 'admin-upcoming-events',
    component: AdminUpcomingEvents,
    canActivate: [AuthGuard],
    data: { role: 'admin' },
  },
  {
    path: 'admin-expired-events',
    component: AdminExpiredEvents,
    canActivate: [AuthGuard],
    data: { role: 'admin' },
  },
  {
    path: 'admin-pending-approvals',
    component: PendingApprovals,
    canActivate: [AuthGuard],
    data: { role: 'admin' },
  },
  {
    path: 'organizer-dashboard',
    component: OrganizerDashboardComponent,
    canActivate: [AuthGuard],
    data: { role: 'organizer' },
  },
  {
    path: 'my-created-events',
    component: MyCreatedEventsComponent,
    canActivate: [AuthGuard],
    data: { role: 'organizer' },
  },
  {
    path: 'my-pending-approvals',
    component: OrganizerPendingApprovalsComponent,
    canActivate: [AuthGuard],
    data: { role: 'organizer' },
  },
  {
    path: 'user-dashboard',
    component: UserDashboardComponent,
    canActivate: [AuthGuard],
    data: { role: 'user' },
  },
  {
    path: 'my-registered-events',
    component: MyRegisteredEvents,
    canActivate: [AuthGuard],
    data: { role: 'user' },
  },
  {
    path: 'admin-dashboard',
    component: AdminDashboardComponent,
    canActivate: [AuthGuard],
    data: { role: 'admin' },
  },
  { path: '**', redirectTo: 'fallback' },
];
