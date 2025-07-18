import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-pagination',
  imports: [CommonModule],
  templateUrl: './pagination.html',
  styleUrls: ['./pagination.scss']
})
export class PaginationComponent {
  @Input() currentPage: number = 1;
  @Input() totalPages: number = 1;

  @Output() pageChanged = new EventEmitter<number>();

  get pageNumbers(): number[] {
  const visiblePages = 5;
  const pages: number[] = [];

  let start = Math.max(1, this.currentPage - Math.floor(visiblePages / 2));
  let end = Math.min(this.totalPages, start + visiblePages - 1);

  if (end - start < visiblePages - 1) {
    start = Math.max(1, end - visiblePages + 1);
  }

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  return pages;
}


  goToPage(page: number): void {
    if (page !== this.currentPage && page >= 1 && page <= this.totalPages) {
      this.pageChanged.emit(page);
    }
  }

  previous(): void {
    this.goToPage(this.currentPage - 1);
  }

  next(): void {
    this.goToPage(this.currentPage + 1);
  }
}
