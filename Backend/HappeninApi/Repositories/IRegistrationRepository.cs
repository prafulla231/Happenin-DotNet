using Microsoft.AspNetCore.Mvc;
using HappeninApi.Models;
using MongoDB.Driver;
using HappeninApi.Repositories;
public interface IRegistrationRepository
{
    Task<bool> RegisterAsync(Guid userId, Guid eventId);
    Task<bool> DeregisterAsync(Guid userId, Guid eventId);
    Task<IEnumerable<User>> GetUsersForEventAsync(Guid eventId);
    Task<IEnumerable<Event>> GetRegisteredEventsAsync(Guid userId);
    Task<bool> DeleteRegistrationAsync(Guid eventId, Guid userId);
}
