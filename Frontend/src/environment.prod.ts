import { send } from '@emailjs/browser';

export const environment = {
  production: false,
  // apiBaseUrl: 'https://happenin-byma.onrender.com/api',
  apiBaseUrl: 'http://localhost:5134/api',

  apis: {
    // Events
    getAllEvents: '/events',
    createEvent: '/events',
    getEventsByOrganizer: (organizerId: string) => `/events/${organizerId}`,
    // getEventsByOrganizer: (organizerId: string) => `/events/by-organizer/{organizerId}`,
    updateEvent: (eventId: string) => `/events/${eventId}`,
    deleteEvent: (eventId: string) => `/events/${eventId}`,
    registeredEvents: (userId: string) => `/events/registered-events/${userId}`,
    registerForEvent: '/events/register',
    deregisterForEvent: '/events/deregister',
    getUpcomingEvent: '/events/Approved',
    getExpiredEvent: '/events/expired',

    // Registrations
    getRegisteredUsers: (eventId: string) =>
      `/events/${eventId}/registered-users`,
    removeUserFromEvent: (eventId: string, userId: string) =>
      `/events/${eventId}/users/${userId}`,

    // Locations
    fetchLocations: '/locations',
    addLocation: '/locations',
    bookLocation: '/locations/book', // not defined in environment — consider adding
    cancelBooking: '/locations/cancel', // not defined in environment
    // viewLocation: (locationId: string) => `/locations/${locationId}`,
    viewLocation: (locationId: string) => `/locations`,
    // deleteLocation: (locationId: string) => `/locations/${locationId}`,
   deleteLocation: (locationId: string) => `/locations/${locationId}`,

    //Approvals
    // approveEvent: `/approval/approveEvent`,
    // denyEvent: (eventId: string) => `/approval/deny/${eventId}`,
    // inside apis: { ... }
updateEventStatus: (eventId: string) => `/events/${eventId}/status`,

    // viewApprovalRequests: '/events/Pending',
    // viewApprovalRequestById: (requestId: string) =>
    //   `/approval/viewrequests/${requestId}`,
      viewApprovalRequests: '/events/Pending',
  viewApprovalRequestById: (requestId: string) => `/approval/viewrequests/${requestId}`,

    //users
    registerUser: '/users/register',
    loginUser: '/users/login',
    // getDashboard: '/users/dashboard',

    // Roles
    getAllOrganizers: '/roles/organizers',
    getAllUsers: '/roles/users',
    getAllAdmins: '/roles/admins',

    //otp
    sendOtp: '/users/send-otp',
    verifyOtp: '/users/verify-otp',

    // Analytics
    getOrganizerAnalytics: (organizerId: string) =>
      `/analytics/organizer/${organizerId}`,
    getAdminAnalytics: '/analytics/admin',
  },
};
