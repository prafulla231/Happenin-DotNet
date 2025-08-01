# Project Overview

## Architecture

Happenin-dotnet is a modular, scalable full-stack application with a clear separation of concerns between backend and frontend layers. The backend exposes RESTful APIs, while the frontend provides a rich, interactive user experience.

### Folder Structure
```
Happenin-dotnet/
├── Backend/
│   └── HappeninApi/           # .NET 8 Web API backend
│       ├── Controllers/       # API endpoints (Events, Users, Locations, Auth, etc.)
│       ├── DTOs/              # Data transfer objects for API contracts
│       ├── Helpers/           # Utility/helper classes (JWT, Email, etc.)
│       ├── Models/            # Domain models (Event, User, Location, Registration)
│       ├── Repositories/      # Data access logic (MongoDB abstraction)
│       ├── Services/          # Business logic and workflows
│       ├── Utils/             # Miscellaneous utilities
│       ├── docs/              # Project documentation (markdown)
│       └── appsettings.json   # Configuration files
├── Frontend/
│   ├── src/app/components/    # Angular components (dashboards, forms, modals)
│   ├── src/app/services/      # Angular services (API, auth, event, location)
│   ├── src/environments/      # Environment configs (API URLs, etc.)
│   └── angular.json           # Angular CLI config
└── Happenin-dotnet.sln        # Solution file
```

## Component Responsibilities
- **Controllers:** Handle HTTP requests, validation, and responses.
- **DTOs:** Define data contracts between client and server for strong typing.
- **Helpers/Utils:** Provide reusable logic (JWT generation, email sending, pagination, etc.).
- **Models:** Represent core business entities (Event, User, Location, Registration).
- **Repositories:** Abstract MongoDB operations for maintainability.
- **Services:** Implement business rules, workflows, and orchestration.
- **Angular Components:** UI for dashboards, event/location management, registration, analytics, etc.
- **Angular Services:** Handle API calls, authentication, state management, and business logic on the client.

## Technologies Used
- **Backend:**
  - .NET 8 Web API (C#)
  - MongoDB (NoSQL)
  - JWT for authentication and authorization
  - Swashbuckle/Swagger for API documentation
  - MailKit/MimeKit for email notifications
- **Frontend:**
  - Angular 16+ (TypeScript)
  - RxJS for reactive programming
  - Angular Material (optional, for UI components)
  - SCSS/CSS for styling

## Development Best Practices
- Use DTOs for all API input/output to decouple models from transport.
- Use async/await for all database and network operations.
- Keep business logic in services, not controllers.
- Use Angular services for all API communication and shared state.
- Write XML comments in C# and JSDoc in TypeScript for auto-generated docs.

---

For more details, see [api-design](api-design) and [database](database).
