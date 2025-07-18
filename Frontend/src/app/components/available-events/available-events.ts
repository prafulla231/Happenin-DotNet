import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface Event {
  _id: string;
  title: string;
  description: string;
  date: string;
  timeSlot: string;
  duration: string;
  location: string;
  category: string;
  price: number;
  maxRegistrations: number;
  createdBy: string;
  artist?: string;
  organization?: string;
}

export interface RegisteredUser {
  _id: string;
  name: string;
  email: string;
}

export interface EventUsers {
  currentRegistration: number;
  users: RegisteredUser[];
}

@Component({
  selector: 'app-available-events',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './available-events.html',
  styleUrls: ['./available-events.scss']
})
export class AvailableEventsComponent implements OnInit, OnChanges {
  @Input() events: Event[] = [];
  @Input() registeredEvents: Event[] = [];
  @Input() showFilters: boolean = true;
  @Input() allowRegistration: boolean = true;
  @Input() sectionTitle: string = 'Available Events';
  @Input() sectionIcon: string = '🎉';
  
  // Admin-specific inputs
  @Input() isAdminMode: boolean = false;
  @Input() usersMap: { [eventId: string]: EventUsers } = {};
  @Input() showUsersDropdown: { [eventId: string]: boolean } = {};

  @Output() eventRegister = new EventEmitter<string>();
  @Output() eventDetails = new EventEmitter<Event>();
  
  // Admin-specific outputs
  @Output() eventDelete = new EventEmitter<{ eventId: string, eventTitle: string }>();
  @Output() userRemove = new EventEmitter<{ eventId: string, userId: string, userName: string }>();
  @Output() toggleUsersList = new EventEmitter<string>();

  filteredEvents: Event[] = [];
  
  // Filters
  searchQuery = '';
  selectedCategory = '';
  selectedCity = '';
  dateFrom = '';
  dateTo = '';
  selectedPriceRange = '';
  sortBy = 'date';
  showFiltersPanel: boolean = false;

  availableCategories: string[] = [];
  availableCities: string[] = [];

  // Pagination properties
  currentPage: number = 1;
  eventsPerPage: number = 6;
  totalPages: number = 0;
  paginatedEvents: Event[] = [];

  ngOnInit() {
    this.initializeComponent();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['events'] && this.events) {
      this.initializeComponent();
    }
  }

  private initializeComponent() {
    this.filteredEvents = [...this.events];
    this.extractFilterOptions();
    this.applySorting();
    this.calculatePagination();
  }

  extractFilterOptions() {
    this.availableCategories = [...new Set(
      this.events.map(e => e.category).filter(Boolean)
    )].sort();

    this.availableCities = [...new Set(
      this.events.map(e => this.extractCityFromLocation(e.location)).filter(Boolean)
    )].sort();
  }

  extractCityFromLocation(location: string): string {
    if (!location) return '';
    const parts = location.split(',').map(part => part.trim());
    if (parts.length >= 2) {
      return parts[parts.length - 1];
    } else {
      return parts[0];
    }
  }

  isRegistered(eventId: string): boolean {
    return this.registeredEvents.some(e => e._id === eventId);
  }

  onSearchChange() {
    this.applyFilters();
  }

  applyFilters() {
    let filtered = [...this.events];

    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(e =>
        e.title.toLowerCase().includes(query) ||
        e.description.toLowerCase().includes(query) ||
        (e.artist && e.artist.toLowerCase().includes(query)) ||
        (e.organization && e.organization.toLowerCase().includes(query)) ||
        (e.category && e.category.toLowerCase().includes(query)) ||
        e.location.toLowerCase().includes(query)
      );
    }

    if (this.selectedCategory) {
      filtered = filtered.filter(e => e.category === this.selectedCategory);
    }

    if (this.selectedCity) {
      filtered = filtered.filter(e => this.extractCityFromLocation(e.location) === this.selectedCity);
    }

    if (this.dateFrom) {
      const fromDate = new Date(this.dateFrom);
      filtered = filtered.filter(e => new Date(e.date) >= fromDate);
    }

    if (this.dateTo) {
      const toDate = new Date(this.dateTo);
      filtered = filtered.filter(e => new Date(e.date) <= toDate);
    }

    if (this.selectedPriceRange) {
      filtered = this.applyPriceFilter(filtered);
    }

    this.filteredEvents = filtered;
    this.applySorting();
    this.currentPage = 1;
    this.calculatePagination();
  }

  applyPriceFilter(events: Event[]): Event[] {
    switch (this.selectedPriceRange) {
      case '0-500':
        return events.filter(e => e.price <= 500);
      case '500-1000':
        return events.filter(e => e.price > 500 && e.price <= 1000);
      case '1000-2000':
        return events.filter(e => e.price > 1000 && e.price <= 2000);
      case '2000+':
        return events.filter(e => e.price > 2000);
      default:
        return events;
    }
  }

  applySorting() {
    this.filteredEvents.sort((a, b) => {
      switch (this.sortBy) {
        case 'date': return new Date(a.date).getTime() - new Date(b.date).getTime();
        case 'title': return a.title.localeCompare(b.title);
        case 'price': return a.price - b.price;
        case 'category': return (a.category || '').localeCompare(b.category || '');
        default: return 0;
      }
    });
    this.calculatePagination();
  }

  calculatePagination() {
    this.totalPages = Math.ceil(this.filteredEvents.length / this.eventsPerPage);
    this.updatePaginatedEvents();
  }

  updatePaginatedEvents() {
    const startIndex = (this.currentPage - 1) * this.eventsPerPage;
    const endIndex = startIndex + this.eventsPerPage;
    this.paginatedEvents = this.filteredEvents.slice(startIndex, endIndex);
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePaginatedEvents();
      this.scrollToEventsSection();
    }
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePaginatedEvents();
      this.scrollToEventsSection();
    }
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePaginatedEvents();
      this.scrollToEventsSection();
    }
  }

  scrollToEventsSection() {
    const eventsSection = document.querySelector('.events-section');
    if (eventsSection) {
      eventsSection.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxPagesToShow = 5;

    if (this.totalPages <= maxPagesToShow) {
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      let startPage = Math.max(1, this.currentPage - 2);
      let endPage = Math.min(this.totalPages, startPage + maxPagesToShow - 1);

      if (endPage - startPage < maxPagesToShow - 1) {
        startPage = Math.max(1, endPage - maxPagesToShow + 1);
      }

      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
    }

    return pages;
  }

  getMaxValue(a: number, b: number): number {
    return Math.min(a, b);
  }

  toggleFilters(): void {
    this.showFiltersPanel = !this.showFiltersPanel;
  }

  clearFilters() {
    this.searchQuery = '';
    this.selectedCategory = '';
    this.selectedCity = '';
    this.dateFrom = '';
    this.dateTo = '';
    this.selectedPriceRange = '';
    this.sortBy = 'date';
    this.applyFilters();
  }

  clearSearch() {
    this.searchQuery = '';
    this.applyFilters();
  }

  hasActiveFilters(): boolean {
    return !!(this.searchQuery || this.selectedCategory || this.selectedCity || this.dateFrom || this.dateTo || this.selectedPriceRange);
  }

  formatDateRange(): string {
    return this.dateFrom && this.dateTo
      ? `${this.formatDate(this.dateFrom)} - ${this.formatDate(this.dateTo)}`
      : this.dateFrom
        ? `From ${this.formatDate(this.dateFrom)}`
        : this.dateTo
          ? `Until ${this.formatDate(this.dateTo)}`
          : '';
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  formatPriceRange(): string {
    switch (this.selectedPriceRange) {
      case '0-500': return 'Free - ₹500';
      case '500-1000': return '₹500 - ₹1000';
      case '1000-2000': return '₹1000 - ₹2000';
      case '2000+': return '₹2000+';
      default: return '';
    }
  }

  // Event handlers
  onRegisterClick(eventId: string) {
    this.eventRegister.emit(eventId);
  }

  onShowDetails(event: Event) {
    this.eventDetails.emit(event);
  }

  // Admin-specific event handlers
  onDeleteEvent(eventId: string, eventTitle: string) {
    this.eventDelete.emit({ eventId, eventTitle });
  }

  onRemoveUser(eventId: string, userId: string, userName: string) {
    this.userRemove.emit({ eventId, userId, userName });
  }

  onToggleUsersDropdown(eventId: string) {
    this.toggleUsersList.emit(eventId);
  }
}