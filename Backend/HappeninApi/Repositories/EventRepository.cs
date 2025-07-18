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
    }
}
