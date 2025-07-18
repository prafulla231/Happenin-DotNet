import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { importProvidersFrom } from '@angular/core';
import { AuthGuard } from './components/auth.guard';
// import { NgChartsModule } from 'ng2-charts';

import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

export const appConfig = [
  provideRouter(routes),
  provideHttpClient(withInterceptorsFromDi()),
  AuthGuard,
  // importProvidersFrom(NgChartsModule)
];
