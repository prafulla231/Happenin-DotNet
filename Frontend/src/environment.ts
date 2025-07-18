import { send } from "@emailjs/browser";

export const environment = {
  production: false,
  // apiBaseUrl: 'https://happenin-byma.onrender.com/api',
  apiBaseUrl: 'http://localhost:5000/api',

  apis: {
    // Events
    getAllEvents: '/events',
    createEvent: '/events',
    getEventsByOrganizer: (organizerId: string) => `/events/${organizerId}`,
    updateEvent: (eventId: string) => `/events/${eventId}`,
    deleteEvent: (eventId: string) => `/events/${eventId}`,
    registeredEvents : (userId : string) => `/events/registered-events/${userId}`,
    registerForEvent: '/events/register',
    deregisterForEvent: '/events/deregister',
    getUpcomingEvent : '/events/upcoming',
    getExpiredEvent : '/events/expired',

    // Registrations
    getRegisteredUsers: (eventId: string) => `/events/registered-users/${eventId}`,
    removeUserFromEvent: (eventId: string, userId: string) => `/events/removeuser/${eventId}/users/${userId}`,

    // Locations
    fetchLocations: '/locations',
    addLocation: '/locations' ,
    bookLocation: '/locations/book', // not defined in environment — consider adding
    cancelBooking: '/locations/cancel', // not defined in environment
    viewLocation: '/locations/getLocations',
    deleteLocation : '/locations/deleteLocation',

    //Approvals
    approveEvent:  `/approval/approveEvent`,
    denyEvent: (eventId: string) => `/approval/deny/${eventId}`,
    viewApprovalRequests: '/approval/viewApproval',
    viewApprovalRequestById: (requestId: string) => `/approval/viewrequests/${requestId}`,

    //users
    registerUser: '/users/register',
    loginUser: '/users/login',

    //otp
    sendOtp: '/users/send-otp',
    verifyOtp: '/users/verify-otp',

    //Analytics
    analytics : '/analytics'
  }
};
