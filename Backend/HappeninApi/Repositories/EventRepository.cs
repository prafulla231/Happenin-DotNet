using HappeninApi.Models;
using MongoDB.Driver;

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

    






    }
}
