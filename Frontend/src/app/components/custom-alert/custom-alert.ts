import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';


export interface CustomAlert {
  show: boolean;
  type: 'success' | 'error' | 'warning' | 'info' | 'confirm';
  title: string;
  message: string;
  confirmAction?: () => void;
  cancelAction?: () => void;
  showCancel?: boolean;
  autoClose?: boolean;
}

@Component({
  selector: 'app-custom-alert',
  imports:[CommonModule],
  templateUrl: './custom-alert.html',
  styleUrls: ['./custom-alert.scss']
})
export class CustomAlertComponent implements OnChanges, OnDestroy {
  @Input() alertData: CustomAlert = {
    show: false,
    type: 'info',
    title: '',
    message: '',
    showCancel: false
  };

  @Input() autoCloseDuration: number = 2000;

  @Output() alertClosed = new EventEmitter<void>();
  @Output() alertConfirmed = new EventEmitter<void>();
  @Output() alertCancelled = new EventEmitter<void>();

  private autoCloseTimer?: number;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['alertData'] && this.alertData.show) {
      this.handleAutoClose();
    }
  }

  ngOnDestroy(): void {
    this.clearAutoCloseTimer();
  }

  private handleAutoClose(): void {
    this.clearAutoCloseTimer();

    if (this.alertData.autoClose && this.alertData.type !== 'confirm') {
      this.autoCloseTimer = window.setTimeout(() => {
        this.closeAlert();
      }, this.autoCloseDuration);
    }
  }

  private clearAutoCloseTimer(): void {
    if (this.autoCloseTimer) {
      clearTimeout(this.autoCloseTimer);
      this.autoCloseTimer = undefined;
    }
  }

  closeAlert(): void {
    this.clearAutoCloseTimer();
    this.alertClosed.emit();
  }

  onConfirm(): void {
    this.clearAutoCloseTimer();
    this.alertConfirmed.emit();
  }

  onCancel(): void {
    this.clearAutoCloseTimer();
    this.alertCancelled.emit();
  }

  onOverlayClick(): void {
    // Close alert when clicking on overlay (outside modal)
    this.closeAlert();
  }
}
