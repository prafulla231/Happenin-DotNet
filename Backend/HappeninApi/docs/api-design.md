# API Design

This document describes the major REST API endpoints for the Happenin-dotnet backend, including sample requests, responses, and status codes.

---

## Authentication
- **POST** `/api/auth/login`
  - Request: `{ "email": "user@example.com", "password": "string" }`
  - Response: `{ "token": "jwt-token", "user": { ... } }`
  - Status: 200 OK, 401 Unauthorized

- **POST** `/api/auth/register`
  - Request: `{ "name": "User", "email": "user@example.com", "password": "string", "role": "User|Organizer|Admin" }`
  - Response: `{ "user": { ... } }`
  - Status: 201 Created, 400 Bad Request

---

## Events
- **GET** `/api/events`
  - Returns all events (admin only)
  - Status: 200 OK
  - Response: `[ { "id": "...", "title": "...", ... } ]`

- **GET** `/api/events/{id}`
  - Returns event by ID
  - Status: 200 OK, 404 Not Found
  - Response: `{ "id": "...", "title": "...", ... }`

- **POST** `/api/events`
  - Create new event (organizer)
  - Request: `{ "title": "Music Fest", "date": "2025-08-01", "timeSlot": "18:00 - 22:00", "locationId": "...", ... }`
  - Status: 201 Created, 400 Bad Request
  - Response: `{ "id": "...", "title": "...", ... }`

- **PUT** `/api/events/{id}`
  - Update event (organizer)
  - Status: 200 OK, 404 Not Found
  - Response: `{ "id": "...", "title": "...", ... }`

- **DELETE** `/api/events/{id}`
  - Delete event (organizer/admin)
  - Status: 204 No Content, 404 Not Found

---

## Locations
- **GET** `/api/locations`
  - List all locations
  - Status: 200 OK
  - Response: `[ { "id": "...", "placeName": "...", ... } ]`

- **POST** `/api/locations`
  - Add new location
  - Request: `{ "placeName": "...", "city": "...", ... }`
  - Status: 201 Created
  - Response: `{ "id": "...", "placeName": "...", ... }`

- **DELETE** `/api/locations/{id}`
  - Delete location
  - Status: 204 No Content, 404 Not Found

---

## Users
- **GET** `/api/users`
  - List all users (admin)
  - Status: 200 OK
  - Response: `[ { "id": "...", "name": "...", ... } ]`

- **GET** `/api/users/{id}`
  - Get user by ID
  - Status: 200 OK, 404 Not Found
  - Response: `{ "id": "...", "name": "...", ... }`

---

## Sample Request
```http
POST /api/events HTTP/1.1
Content-Type: application/json
Authorization: Bearer <token>

{
  "title": "Music Fest",
  "date": "2025-08-01",
  "timeSlot": "18:00 - 22:00",
  "locationId": "..."
}
```

---

## Error Handling
- All endpoints return appropriate HTTP status codes.
- Error responses include a message and (optionally) a code.

---

For more endpoints and details, see your Swagger UI at `/swagger` when running the backend.
