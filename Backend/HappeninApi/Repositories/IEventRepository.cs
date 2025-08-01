using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using HappeninApi.Models;
using HappeninApi.Helpers;
using HappeninApi.DTOs;

namespace HappeninApi.Repositories
{
    /// <summary>
    /// Interface for event-related data operations.
    /// </summary>
    public interface IEventRepository
    {
        /// <summary>
        /// Creates a new event.
        /// </summary>
        /// <param name="evnt">Event to create.</param>
        /// <returns>The created event.</returns>
        Task<Event> CreateEventAsync(Event evnt);

        /// <summary>
        /// Gets an event by its ID.
        /// </summary>
        /// <param name="id">Event ID.</param>
        /// <returns>The event if found; otherwise, null.</returns>
        Task<Event?> GetByIdAsync(Guid id);

        // Updated methods with pagination support
        /// <summary>
        /// Gets events by status with pagination.
        /// </summary>
        /// <param name="status">Event status.</param>
        /// <param name="pagination">Pagination helper.</param>
        /// <returns>Tuple of events and total count.</returns>
        Task<(IEnumerable<Event> Events, int TotalCount)> GetEventsByStatusAsync(EventStatus status, PaginationHelper pagination);

        /// <summary>
        /// Gets all events with pagination.
        /// </summary>
        /// <param name="pagination">Pagination helper.</param>
        /// <returns>Tuple of events and total count.</returns>
        Task<(IEnumerable<Event> Events, int TotalCount)> GetAllEventsAsync(PaginationHelper pagination);


        /// <summary>
        /// Gets events by organizer with pagination.
        /// </summary>
        /// <param name="organizerId">Organizer ID.</param>
        /// <param name="pagination">Pagination helper.</param>
        /// <returns>Tuple of events and total count.</returns>
        Task<(IEnumerable<Event> Events, int TotalCount)> GetEventsByOrganizerAsync(Guid organizerId, PaginationHelper pagination);

        /// <summary>
        /// Gets all events for a specific organizer.
        /// </summary>
        /// <param name="organizerId">Organizer ID.</param>
        /// <returns>List of events.</returns>
        Task<List<Event>> GetEventsByOrganizerIdAsync(Guid organizerId);

        /// <summary>
        /// Gets all non-deleted events.
        /// </summary>
        /// <returns>List of events.</returns>
        Task<List<Event>> GetAllNonDeletedEventsAsync();

        /// <summary>
        /// Marks expired events.
        /// </summary>
        Task MarkExpiredEventsAsync();

        /// <summary>
        /// Updates the status of an event.
        /// </summary>
        /// <param name="id">Event ID.</param>
        /// <param name="newStatus">New status.</param>
        /// <returns>True if updated; otherwise, false.</returns>
        Task<bool> UpdateEventStatusAsync(Guid id, EventStatus newStatus);

        /// <summary>
        /// Deletes an event.
        /// </summary>
        /// <param name="id">Event ID.</param>
        /// <returns>True if deleted; otherwise, false.</returns>
        Task<bool> DeleteEventAsync(Guid id);

        /// <summary>
        /// Updates an event.
        /// </summary>
        /// <param name="id">Event ID.</param>
        /// <param name="dto">Update details.</param>
        /// <returns>True if updated; otherwise, false.</returns>
        Task<bool> UpdateEventAsync(Guid id, UpdateEventDto dto);

        /// <summary>
        /// Gets events by organizer and status with pagination.
        /// </summary>
        /// <param name="organizerId">Organizer ID.</param>
        /// <param name="status">Event status.</param>
        /// <param name="pagination">Pagination helper.</param>
        /// <returns>Tuple of events and total count.</returns>
        Task<(IEnumerable<Event> Events, int TotalCount)> GetEventsByOrganizerAndStatusAsync(Guid organizerId, EventStatus status, PaginationHelper pagination);
    }
}