import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-event-filter',
  standalone: true,
  templateUrl: './event-filter.html',
  styleUrls: ['./event-filter.scss'],
  imports: [CommonModule,FormsModule]
})
export class EventFilter {
  @Input() categories: string[] = [];
  @Input() cities: string[] = [];

  @Input() filters = {
    searchQuery: '',
    selectedCategory: '',
    selectedCity: '',
    dateFrom: '',
    dateTo: '',
    selectedPriceRange: '',
    sortBy: 'date'
  };

  @Output() filtersChanged = new EventEmitter<typeof this.filters>();
  @Output() filtersCleared = new EventEmitter<void>();

  onFilterChange() {
    this.filtersChanged.emit({ ...this.filters });
  }

  clearFilters() {
    this.filters = {
      searchQuery: '',
      selectedCategory: '',
      selectedCity: '',
      dateFrom: '',
      dateTo: '',
      selectedPriceRange: '',
      sortBy: 'date'
    };
    this.filtersChanged.emit({ ...this.filters });
    this.filtersCleared.emit();
  }
}
