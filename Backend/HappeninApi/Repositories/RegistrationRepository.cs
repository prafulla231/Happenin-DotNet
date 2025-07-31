using Microsoft.AspNetCore.Mvc;
using HappeninApi.Models;
using MongoDB.Driver;
using HappeninApi.Repositories;

/// <summary>
/// Repository for registration-related data operations.
/// </summary>
public class RegistrationRepository : IRegistrationRepository
{
    private readonly IMongoCollection<Registration> _registrations;
    private readonly IMongoCollection<Event> _events;
    private readonly IMongoCollection<User> _users;

    /// <summary>
    /// Initializes a new instance of the <see cref="RegistrationRepository"/> class.
    /// </summary>
    /// <param name="db">MongoDB database instance.</param>
    public RegistrationRepository(IMongoDatabase db)
    {
        _registrations = db.GetCollection<Registration>("Registrations");
        _events = db.GetCollection<Event>("Events");
        _users = db.GetCollection<User>("Users");
    }

    /// <summary>
    /// Registers a user for an event.
    /// </summary>
    /// <param name="userId"></param>
    /// <param name="eventId"></param>
    /// <returns></returns>
    public async Task<bool> RegisterAsync(Guid userId, Guid eventId)
    {
        var user = await _users.Find(u => u.Id == userId).FirstOrDefaultAsync();
        var evnt = await _events.Find(e => e.Id == eventId && !e.IsDeleted).FirstOrDefaultAsync();
        if (user == null || evnt == null) return false;

        var existing = await _registrations.Find(r => r.UserId == userId && r.EventId == eventId).FirstOrDefaultAsync();

        if (existing != null && !existing.IsDeleted)
            return false;

        if (existing != null && existing.IsDeleted)
        {
            var update = Builders<Registration>.Update
                .Set(r => r.IsDeleted, false)
                .Set(r => r.RegisteredAt, DateTime.UtcNow);
            await _registrations.UpdateOneAsync(r => r.Id == existing.Id, update);
        }
        else
        {
            var registration = new Registration
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                User = user,
                EventId = eventId,
                Event = evnt,
                RegisteredAt = DateTime.UtcNow,
                IsDeleted = false
            };
            await _registrations.InsertOneAsync(registration);
        }

        var updateEvent = Builders<Event>.Update.Inc(e => e.CurrentRegistrations, 1);
        await _events.UpdateOneAsync(e => e.Id == eventId, updateEvent);
        return true;
    }

    /// <summary>
    /// Deregisters a user for an event.
    /// </summary>
    public async Task<bool> DeregisterAsync(Guid userId, Guid eventId)
    {
        var update = Builders<Registration>.Update.Set(r => r.IsDeleted, true);
        var result = await _registrations.UpdateOneAsync(
            r => r.UserId == userId && r.EventId == eventId && !r.IsDeleted, update);

        if (result.MatchedCount == 0) return false;

        var updateEvent = Builders<Event>.Update.Inc(e => e.CurrentRegistrations, -1);
        await _events.UpdateOneAsync(e => e.Id == eventId, updateEvent);

        return true;
    }

    /// <summary>
    /// Get users for an event.
    /// </summary>
    public async Task<IEnumerable<User>> GetUsersForEventAsync(Guid eventId)
    {
        var registrations = await _registrations
            .Find(r => r.EventId == eventId && !r.IsDeleted)
            .ToListAsync();

        return registrations.Select(r => r.User).Where(u => u != null).ToList();
    }

    /// <summary>
    /// Get registered events.
    /// </summary>
    public async Task<IEnumerable<Event>> GetRegisteredEventsAsync(Guid userId)
    {
        var registrations = await _registrations
            .Find(r => r.UserId == userId && !r.IsDeleted)
            .ToListAsync();

        return registrations.Select(r => r.Event).Where(e => e != null && !e.IsDeleted).ToList();
    }

    /// <summary>
    /// Delete registration for an event.
    /// </summary>
    public async Task<bool> DeleteRegistrationAsync(Guid eventId, Guid userId)
    {
        var result = await _registrations.DeleteOneAsync(r => r.EventId == eventId && r.UserId == userId);
        return result.DeletedCount > 0;
    }

    /// <summary>
    /// Gets registrations by event IDs.
    /// </summary>
    /// <param name="eventIds"></param>
    /// <returns></returns>
    public async Task<List<Registration>> GetByEventIdsAsync(List<Guid> eventIds)
    {
        var filter = Builders<Registration>.Filter.And(
            Builders<Registration>.Filter.In(r => r.EventId, eventIds),
            Builders<Registration>.Filter.Eq(r => r.IsDeleted, false)
        );

        return await _registrations.Find(filter).ToListAsync();
    }

}
