using Microsoft.AspNetCore.Mvc;
using HappeninApi.Models;
using MongoDB.Driver;
using HappeninApi.Repositories;
public class RegistrationRepository : IRegistrationRepository
{
    private readonly IMongoCollection<Registration> _registrations;
    private readonly IMongoCollection<Event> _events;
    private readonly IMongoCollection<User> _users;

    public RegistrationRepository(IMongoDatabase db)
    {
        _registrations = db.GetCollection<Registration>("Registrations");
        _events = db.GetCollection<Event>("Events");
        _users = db.GetCollection<User>("Users");
    }

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

    public async Task<IEnumerable<User>> GetUsersForEventAsync(Guid eventId)
    {
        var registrations = await _registrations
            .Find(r => r.EventId == eventId && !r.IsDeleted)
            .ToListAsync();

        return registrations.Select(r => r.User).Where(u => u != null).ToList();
    }

    public async Task<IEnumerable<Event>> GetRegisteredEventsAsync(Guid userId)
    {
        var registrations = await _registrations
            .Find(r => r.UserId == userId && !r.IsDeleted)
            .ToListAsync();

        return registrations.Select(r => r.Event).Where(e => e != null && !e.IsDeleted).ToList();
    }

    public async Task<bool> DeleteRegistrationAsync(Guid eventId, Guid userId)
    {
        var result = await _registrations.DeleteOneAsync(r => r.EventId == eventId && r.UserId == userId);
        return result.DeletedCount > 0;
    }

    public async Task<List<Registration>> GetByEventIdsAsync(List<Guid> eventIds)
    {
        var filter = Builders<Registration>.Filter.And(
            Builders<Registration>.Filter.In(r => r.EventId, eventIds),
            Builders<Registration>.Filter.Eq(r => r.IsDeleted, false)
        );

        return await _registrations.Find(filter).ToListAsync();
    }

}
