# Database Schema (MongoDB)

Happenin-dotnet uses MongoDB as its primary data store. Collections are designed to support event management, user roles, and location booking. All collections use GUIDs for primary keys.

---

## Major Collections

### 1. `events`
- **Fields:**
  - `_id` (Guid): Unique event ID
  - `title` (string): Event name
  - `description` (string): Event details
  - `date` (DateTime): Event date
  - `timeSlot` (string): Time range (e.g., "18:00 - 22:00")
  - `duration` (int): Duration in minutes
  - `locationId` (Guid): References `locations`
  - `category` (string): Event category
  - `price` (decimal): Ticket price
  - `maxRegistrations` (int): Capacity
  - `currentRegistrations` (int): Current number of registrations
  - `createdById` (Guid): References `users` (organizer)
  - `status` (enum): Pending, Approved, Rejected, Expired
  - `createdAt`, `updatedAt` (DateTime)

### 2. `locations`
- **Fields:**
  - `_id` (Guid): Unique location ID
  - `state`, `city`, `placeName`, `address` (string)
  - `maxSeatingCapacity` (int)
  - `amenities` (array of string)
  - `bookings` (array of booking objects)
  - `createdBy` (Guid): Admin who created the location

### 3. `users`
- **Fields:**
  - `_id` (Guid): Unique user ID
  - `name`, `email`, `passwordHash` (string)
  - `role` (User, Organizer, Admin)
  - `createdAt`, `updatedAt` (DateTime)

### 4. `registrations`
- **Fields:**
  - `_id` (Guid): Unique registration ID
  - `eventId` (Guid): References `events`
  - `userId` (Guid): References `users`
  - `registrationDate` (DateTime)

---

## Relationships
- **Event** references **Location** and **User** (organizer)
- **Registration** links **User** and **Event**
- **Location** can have multiple bookings (embedded or referenced)

---

## Example: Event Document
```json
{
  "_id": "b731bbb4-b9ce-415a-bf6f-f3a5db5a2b45",
  "title": "Music Fest",
  "date": "2025-08-01T00:00:00Z",
  "locationId": "ea8785b9-5483-4a35-a134-14434065e799",
  "category": "Music",
  "status": "Approved",
  ...
}
```

---

For more, see [event-flow](event-flow) and the `Models/` and `DTOs/` folders in the backend.
