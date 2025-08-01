# Deployment Guide

This guide explains how to deploy the Happenin-dotnet backend and frontend, either locally or to a cloud provider.

---

## Backend Deployment (.NET 8 Web API)

### Local Deployment
1. **Build and run:**
   ```sh
   cd Backend/HappeninApi
   dotnet build
   dotnet run
   ```
2. **API will be available at:** `https://localhost:5134`

### Cloud Deployment (Azure Example)
1. **Publish the app:**
   ```sh
   dotnet publish -c Release -o ./publish
   ```
2. **Deploy to Azure App Service:**
   - Create a new App Service (Linux or Windows).
   - Set environment variables for MongoDB connection.
   - Upload the contents of the `publish` folder.

---

## Frontend Deployment (Angular)

### Local Deployment
1. **Run locally:**
   ```sh
   cd Frontend
   ng serve
   ```
2. **App will be available at:** `http://localhost:4200`

### Production Build
1. **Build the app:**
   ```sh
   ng build --prod
   ```
2. **Deploy the contents of `dist/`** to any static web host (Azure Static Web Apps, Netlify, Vercel, etc.).

---

## Environment Variables
- **Backend:** Set MongoDB URI and JWT secret in `appsettings.json` or as environment variables.
- **Frontend:** Set API base URL in `src/environments/environment.prod.ts`.

---

For troubleshooting, see [getting-started](getting-started) or open an issue.
