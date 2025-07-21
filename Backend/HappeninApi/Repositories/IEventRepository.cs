using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using HappeninApi.Models;
using HappeninApi.DTOs;

namespace HappeninApi.Repositories
{
  public interface IEventRepository
  {
    // Task<List<Event>>   GetAllAsync();
    // Task<Event?>        GetByIdAsync(Guid id);
    // Task                CreateAsync(Event evt);
    // Task                UpdateAsync(Guid id, Event evt);
    // Task                DeleteAsync(Guid id);

    Task<Event> CreateEventAsync(Event evnt);
    Task<Event?> GetByIdAsync(Guid id);
    Task<List<Event>> GetEventsByStatusAsync(EventStatus status, int page, int pageSize);
    Task MarkExpiredEventsAsync(); // Optional: if you want to update status in DB
    Task<bool> UpdateEventStatusAsync(Guid id, EventStatus newStatus);
    Task<List<Event>> GetAllEventsAsync(int page, int pageSize);

    Task<bool> DeleteEventAsync(Guid id);
    Task<bool> UpdateEventAsync(Guid id, UpdateEventDto dto);




  }
}
