import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { SpinnerComponent } from './components/spinner';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HttpClientModule, SpinnerComponent],
  template: `
  
    <router-outlet></router-outlet>
    <app-spinner></app-spinner>
  `,
})
export class AppComponent { }
