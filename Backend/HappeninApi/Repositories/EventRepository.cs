using HappeninApi.Models;
using MongoDB.Driver;
using HappeninApi.DTOs;

namespace HappeninApi.Repositories
{
    public class EventRepository : IEventRepository
    {
        private readonly IMongoCollection<Event> _events;

        public EventRepository(IMongoDatabase db)
        {
            _events = db.GetCollection<Event>("Events");
        }

        public async Task<Event> CreateEventAsync(Event evnt)
        {
            await _events.InsertOneAsync(evnt);
            return evnt;
        }

        public async Task<Event?> GetByIdAsync(Guid id)
        {
            var filter = Builders<Event>.Filter.Eq(e => e.Id, id);
            return await _events.Find(filter).FirstOrDefaultAsync();
        }

        public async Task<List<Event>> GetEventsByStatusAsync(EventStatus status, int page, int pageSize)
        {
            var filter = Builders<Event>.Filter.Eq(e => e.Status, status);
            return await _events
                .Find(filter)
                .Skip((page - 1) * pageSize)
                .Limit(pageSize)
                .ToListAsync();
        }

        // Optional: If you want to mark events as Expired in DB
        public async Task MarkExpiredEventsAsync()
        {
            var filter = Builders<Event>.Filter.And(
                Builders<Event>.Filter.Lt(e => e.Date, DateTime.UtcNow),
                Builders<Event>.Filter.Ne(e => e.Status, EventStatus.Expired)
            );

            var update = Builders<Event>.Update
                .Set(e => e.Status, EventStatus.Expired)
                .Set(e => e.UpdatedAt, DateTime.UtcNow);

            await _events.UpdateManyAsync(filter, update);
        }

        public async Task<bool> UpdateEventStatusAsync(Guid id, EventStatus newStatus)
        {
            var filter = Builders<Event>.Filter.Eq(e => e.Id, id);
            var update = Builders<Event>.Update
                .Set(e => e.Status, newStatus)
                .Set(e => e.UpdatedAt, DateTime.UtcNow);

            var result = await _events.UpdateOneAsync(filter, update);
            return result.ModifiedCount > 0;
        }
        public async Task<List<Event>> GetAllEventsAsync(int page, int pageSize)
        {
            var filter = Builders<Event>.Filter.Eq(e => e.IsDeleted, false);

            return await _events.Find(filter)
                                .Skip((page - 1) * pageSize)
                                .Limit(pageSize)
                                .SortByDescending(e => e.CreatedAt)
                                .ToListAsync();
        }

        public async Task<bool> DeleteEventAsync(Guid id)
        {
            var filter = Builders<Event>.Filter.Eq(e => e.Id, id);
            var update = Builders<Event>.Update
                .Set(e => e.IsDeleted, true)
                .Set(e => e.UpdatedAt, DateTime.UtcNow);

            var result = await _events.UpdateOneAsync(filter, update);
            return result.ModifiedCount > 0;
        }

        public async Task<bool> UpdateEventAsync(Guid id, UpdateEventDto dto)
{
    var filter = Builders<Event>.Filter.Eq(e => e.Id, id) & Builders<Event>.Filter.Eq(e => e.IsDeleted, false);

    var update = Builders<Event>.Update
        .Set(e => e.Title, dto.Title)
        .Set(e => e.Description, dto.Description)
        .Set(e => e.Date, dto.Date)
        .Set(e => e.TimeSlot, dto.TimeSlot)
        .Set(e => e.Duration, dto.Duration)
        .Set(e => e.LocationId, dto.LocationId)
        .Set(e => e.Category, dto.Category)
        .Set(e => e.Price, dto.Price)
        .Set(e => e.MaxRegistrations, dto.MaxRegistrations)
        .Set(e => e.Artist, dto.Artist)
        .Set(e => e.Organization, dto.Organization)
        .Set(e => e.UpdatedAt, DateTime.UtcNow);

    var result = await _events.UpdateOneAsync(filter, update);
    return result.MatchedCount > 0;
}


        








    }
}
