# Getting Started

Welcome to Happenin-dotnet! This guide will help you set up the project for local development and testing.

## Prerequisites
- **Node.js** (v18+ recommended)
- **.NET 8 SDK** (https://dotnet.microsoft.com/download)
- **MongoDB** (local or cloud instance)
- **Angular CLI** (`npm install -g @angular/cli`)

---

## Backend Setup (.NET 8 Web API)

1. **Clone the repository:**
   ```sh
   git clone <your-repo-url>
   cd Happenin-dotnet
   ```
2. **Navigate to the backend folder:**
   ```sh
   cd Backend/HappeninApi
   ```
3. **Restore dependencies:**
   ```sh
   dotnet restore
   ```
4. **Configure MongoDB connection:**
   - Edit `appsettings.Development.json` and `appsettings.json` with your MongoDB URI and JWT secret.
5. **Build and run the API:**
   ```sh
   dotnet build
   dotnet run
   ```
   The API will be available at `https://localhost:5134` (or as configured).
6. **API Documentation:**
   - Visit `/swagger` for interactive API docs.

---

## Frontend Setup (Angular)

1. **Navigate to the frontend folder:**
   ```sh
   cd Frontend
   ```
2. **Install dependencies:**
   ```sh
   npm install
   ```
3. **Configure environment:**
   - Edit `src/environment.ts` and `src/environment.prod.ts` to set the API base URL (e.g., `http://localhost:5134`).
4. **Run the Angular app:**
   ```sh
   ng serve
   ```
   The app will be available at `http://localhost:4200`.
5. **Frontend Documentation:**
   - Use Compodoc (`npx compodoc -p tsconfig.json`) for Angular docs.

---

## Useful Commands
- **Run backend tests:**
  ```sh
  cd Backend/HappeninApi.Tests
  dotnet test
  ```
- **Run frontend tests:**
  ```sh
  cd Frontend
  ng test
  ```
- **Lint frontend code:**
  ```sh
  ng lint
  ```

---

For troubleshooting, see [overview](overview) or open an issue in the repository.
