// interfaces/analytics.interface.ts
export interface EventAnalytics {
  totalEvents: number;
  upcomingEvents: number;
  expiredEvents: number;
  totalRegistrations: number;
  eventsByCategory: { [key: string]: number };
  eventsByMonth: { [key: string]: number };
  registrationsByEvent: { eventTitle: string; registrations: number }[];
  revenueByEvent: { eventTitle: string; revenue: number }[];
}

export interface AdminAnalytics {
  totalEvents: number;
  upcomingEvents: number;
  expiredEvents: number;
  totalRegistrations: number;
  eventsByCategory: { [key: string]: number };
  eventsByMonth: { [key: string]: number };
  registrationsByEvent: { eventTitle: string; registrations: number }[];
  revenueByEvent: { eventTitle: string; revenue: number }[];
}
export interface UserAnalytics {
  totalRegistrations: number;
  upcomingEvents: number;
  pastEvents: number;
  favoriteCategories: { [key: string]: number };
  registrationsByMonth: { [key: string]: number };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}
