using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using HappeninApi.Models;
using HappeninApi.Helpers;
using HappeninApi.DTOs;

namespace HappeninApi.Repositories
{
    public interface IEventRepository
    {
        Task<Event> CreateEventAsync(Event evnt);
        Task<Event?> GetByIdAsync(Guid id);

        // Updated methods with pagination support
        Task<(IEnumerable<Event> Events, int TotalCount)> GetEventsByStatusAsync(EventStatus status, PaginationHelper pagination);
        Task<(IEnumerable<Event> Events, int TotalCount)> GetAllEventsAsync(PaginationHelper pagination);
        Task<(IEnumerable<Event> Events, int TotalCount)> GetEventsByOrganizerAsync(Guid organizerId, PaginationHelper pagination);

        Task<List<Event>> GetEventsByOrganizerIdAsync(Guid organizerId);
        Task<List<Event>> GetAllNonDeletedEventsAsync();


        Task MarkExpiredEventsAsync();
        Task<bool> UpdateEventStatusAsync(Guid id, EventStatus newStatus);
        Task<bool> DeleteEventAsync(Guid id);
        Task<bool> UpdateEventAsync(Guid id, UpdateEventDto dto);
    }
}