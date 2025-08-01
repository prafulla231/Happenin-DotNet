# Authentication & Authorization

Happenin-dotnet uses JWT (JSON Web Tokens) for secure authentication and role-based authorization. The backend issues signed tokens, and the frontend attaches them to all protected API requests.

---

## Authentication Flow
1. **User logs in** via `/api/auth/login` with email and password.
2. **Backend validates credentials** and issues a JWT token containing user ID, email, and role.
3. **Frontend stores the token** (in localStorage/sessionStorage).
4. **Subsequent API requests** include the token in the `Authorization: Bearer <token>` header.

---

## JWT Token Structure
- Contains user ID, email, and role (user, organizer, admin).
- Signed with a secret key (see `appsettings.json`).
- Expires after a set period (configurable, e.g., 1 hour).
- Example payload:
  ```json
  {
    "userId": "...",
    "email": "user@example.com",
    "role": "Admin",
    "exp": 1720000000
  }
  ```

---

## Authorization
- **Middleware** in .NET checks for valid JWT on protected routes.
- **Role-based access**:
  - **User:** Can view and register for events.
  - **Organizer:** Can create, edit, and manage their own events.
  - **Admin:** Can approve/reject events, manage users and locations.
- **Custom attributes** can be used to restrict endpoints:
  ```csharp
  [Authorize(Roles = "Admin")]
  [ApiController]
  [Route("api/[controller]")]
  public class UsersController : ControllerBase
  {
      // ...
  }
  ```

---

## Token Validation Middleware
- Implemented in `Program.cs` using `AddAuthentication` and `AddJwtBearer`.
- Rejects requests with missing, invalid, or expired tokens.
- Example configuration:
  ```csharp
  builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
      .AddJwtBearer(options =>
      {
          options.TokenValidationParameters = new TokenValidationParameters
          {
              ValidateIssuer = true,
              ValidateAudience = true,
              ValidateLifetime = true,
              ValidateIssuerSigningKey = true,
              ValidIssuer = builder.Configuration["Jwt:Issuer"],
              ValidAudience = builder.Configuration["Jwt:Audience"],
              IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]))
          };
      });
  ```

---

## Security Best Practices
- Always use HTTPS in production.
- Store JWT secrets securely (never commit to source control).
- Set short token lifetimes and implement refresh tokens if needed.
- Validate all user input on both frontend and backend.

---

For more, see [api-design](api-design) and your backend's `Helpers/JwtHelper.cs`.
