// spinner.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoadingService } from './loading';
import { Subscription } from 'rxjs';
// import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-spinner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="spinner-overlay" *ngIf="isLoading">
      <div class="spinner-container">
        <div class="spinner">
          <div class="spinner-inner">
            <div class="spinner-circle"></div>
            <div class="spinner-circle"></div>
            <div class="spinner-circle"></div>
          </div>
        </div>
        <div class="spinner-text">
          <span class="loading-text">Loading</span>
          <span class="dots">
            <span class="dot"></span>
            <span class="dot"></span>
            <span class="dot"></span>
          </span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .spinner-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(15, 23, 42, 0.9);
  background-color: rgba(15, 23, 42, 0.95); /* fallback */
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px); /* Safari */
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  animation: fadeIn 0.3s ease-in-out;
}

@supports ((-webkit-backdrop-filter: blur(8px)) or (backdrop-filter: blur(8px))) {
  .spinner-overlay {
    background-color: rgba(15, 23, 42, 0.9);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
  }
}

    .spinner-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2rem;
    }

    .spinner {
      width: 80px;
      height: 80px;
      position: relative;
    }

    .spinner-inner {
      width: 100%;
      height: 100%;
      position: relative;
      animation: rotate 2s linear infinite;
    }

    .spinner-circle {
      position: absolute;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      animation: bounce 1.4s ease-in-out infinite both;
    }

    .spinner-circle:nth-child(1) {
      top: 0;
      left: 50%;
      transform: translateX(-50%);
      background: linear-gradient(45deg, #667eea, #764ba2);
      animation-delay: -0.32s;
    }

    .spinner-circle:nth-child(2) {
      top: 50%;
      right: 0;
      transform: translateY(-50%);
      background: linear-gradient(45deg, #f093fb, #f5576c);
      animation-delay: -0.16s;
    }

    .spinner-circle:nth-child(3) {
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
      background: linear-gradient(45deg, #4facfe, #00f2fe);
      animation-delay: 0s;
    }

    .spinner-text {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: white;
      font-size: 1.2rem;
      font-weight: 600;
      letter-spacing: 0.1em;
    }

   .loading-text {
  background: linear-gradient(45deg, #667eea, #764ba2, #f093fb, #f5576c);
  background-size: 400% 400%;
  background-clip: text;
  -webkit-background-clip: text; /* Safari, Chrome */
  color: transparent;
  color: #ffffff;
  -webkit-text-fill-color: transparent; /* Safari */
  animation: gradient 3s ease infinite;
}

    .dots {
      display: flex;
      gap: 0.3rem;
    }

    .dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #667eea;
      animation: dotBounce 1.4s ease-in-out infinite both;
    }

    .dot:nth-child(1) { animation-delay: -0.32s; }
    .dot:nth-child(2) { animation-delay: -0.16s; }
    .dot:nth-child(3) { animation-delay: 0s; }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes rotate {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    @keyframes bounce {
      0%, 80%, 100% {
        transform: scale(0.8);
        opacity: 0.5;
      }
      40% {
        transform: scale(1.2);
        opacity: 1;
      }
    }

    @keyframes gradient {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }

    @keyframes dotBounce {
      0%, 80%, 100% {
        transform: scale(0.8);
        opacity: 0.5;
      }
      40% {
        transform: scale(1.2);
        opacity: 1;
      }
    }

    /* Mobile responsiveness */
    @media (max-width: 640px) {
      .spinner {
        width: 60px;
        height: 60px;
      }

      .spinner-circle {
        width: 16px;
        height: 16px;
      }

      .spinner-text {
        font-size: 1rem;
      }
    }
  `],
  animations: []
})
export class SpinnerComponent implements OnInit, OnDestroy {
  isLoading = false;
  private subscription?: Subscription;

  constructor(private loadingService: LoadingService) {}

  ngOnInit() {
    this.subscription = this.loadingService.loading$.subscribe(
      loading => this.isLoading = loading
    );
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}
