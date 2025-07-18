import './polyfills';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { bootstrapApplication } from '@angular/platform-browser';
import { importProvidersFrom } from '@angular/core';
import { AppComponent } from './app/app';
import { appConfig } from './app/app.config';
import { LoadingInterceptor } from './app/components/loading.interceptor';
import { LoadingService } from './app/components/loading';
import { AuthService } from './app/services/auth';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';



function initializeAuth(authService: AuthService) {
  return () => {
    const token = authService.getToken();
    console.log('Auth initialized. Token found:', !!token);
  };
}


bootstrapApplication(AppComponent, {
  providers: [
    appConfig,
    importProvidersFrom(HttpClientModule),
        importProvidersFrom(NgbModule),

    LoadingService,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: LoadingInterceptor,
      multi: true
    }
  ]
});
