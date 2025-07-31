using Microsoft.AspNetCore.Mvc;
using HappeninApi.Models;
using MongoDB.Driver;
using HappeninApi.Repositories;

/// <summary>
/// Interface for registration-related data operations.
/// </summary>
public interface IRegistrationRepository
{

    /// <summary>
    /// Registers a user for an event.
    /// </summary>
    /// <param name="userId">User ID.</param>
    /// <param name="eventId">Event ID.</param>
    /// <returns>True if registered; otherwise, false.</returns>
    Task<bool> RegisterAsync(Guid userId, Guid eventId);

    /// <summary>
    /// Deregisters a user from an event.
    /// </summary>
    /// <param name="userId">User ID.</param>
    /// <param name="eventId">Event ID.</param>
    /// <returns>True if deregistered; otherwise, false.</returns>
    Task<bool> DeregisterAsync(Guid userId, Guid eventId);

    /// <summary>
    /// Gets users registered for an event.
    /// </summary>
    /// <param name="eventId">Event ID.</param>
    /// <returns>Enumerable of users.</returns>
    Task<IEnumerable<User>> GetUsersForEventAsync(Guid eventId);

    /// <summary>
    /// Gets events a user is registered for.
    /// </summary>
    /// <param name="userId">User ID.</param>
    /// <returns>Enumerable of events.</returns>
    Task<IEnumerable<Event>> GetRegisteredEventsAsync(Guid userId);

    /// <summary>
    /// Deletes a registration for a user and event.
    /// </summary>
    /// <param name="eventId">Event ID.</param>
    /// <param name="userId">User ID.</param>
    /// <returns>True if deleted; otherwise, false.</returns>
    Task<bool> DeleteRegistrationAsync(Guid eventId, Guid userId);

    /// <summary>
    /// Gets registrations by event IDs.
    /// </summary>
    /// <param name="eventIds">List of event IDs.</param>
    /// <returns>List of registrations.</returns>
    Task<List<Registration>> GetByEventIdsAsync(List<Guid> eventIds);

}
