# Event Flow & Business Logic

This document describes the main business logic and workflows in Happenin-dotnet.

---

## Event Creation
1. **Organizer** fills out event form (title, date, location, etc.) in the Angular dashboard.
2. **Frontend** sends a POST request to `/api/events`.
3. **Backend** validates data, creates event with status `Pending`.
4. **Event** is stored in the `events` collection.

---

## Event Approval
1. **Admin** reviews pending events via dashboard.
2. **Admin** can approve or reject events.
3. **Backend** updates event status to `Approved` or `Rejected`.
4. **Approved events** become visible to users for registration.

---

## Event Booking
1. **User** browses approved events and selects one to register.
2. **Frontend** sends registration request to `/api/registrations`.
3. **Backend** checks event capacity and user eligibility.
4. **If valid:**
   - Registration is created in `registrations` collection.
   - Event's `currentRegistrations` is incremented.
   - Confirmation email is sent (with ticket PDF if enabled).
5. **If invalid:**
   - Returns error (e.g., event full, already registered).

---

## Location Management
- **Admins** can add, edit, or delete locations.
- **Events** reference locations by `locationId`.
- **Deleting a location** may require handling related events.

---

## User Roles & Permissions
- **User:** Register for events, view own registrations.
- **Organizer:** Create/manage own events, view analytics.
- **Admin:** Approve/reject events, manage users/locations, view analytics.

---

For more, see [api-design](api-design) and [auth](auth).
