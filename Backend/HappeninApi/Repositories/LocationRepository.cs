using HappeninApi.Models;
using MongoDB.Driver;

namespace HappeninApi.Repositories
{
    public class LocationRepository : ILocationRepository
    {
        private readonly IMongoCollection<Location> _locations;

        public LocationRepository(IMongoDatabase db)
        {
            _locations = db.GetCollection<Location>("Locations");
        }

        public async Task<List<Location>> GetAllAsync()
        {
            return await _locations.Find(_ => true).ToListAsync();
        }

        public async Task<Location?> GetByIdAsync(Guid id)
        {
            return await _locations.Find(x => x.Id == id).FirstOrDefaultAsync();
        }

        public async Task<Location> CreateAsync(Location location)
        {
            await _locations.InsertOneAsync(location);
            return location;
        }

        public async Task<bool> DeleteAsync(Guid id)
        {
            var result = await _locations.DeleteOneAsync(x => x.Id == id);
            return result.DeletedCount > 0;
        }

        public async Task<bool> BookLocationAsync(Guid locationId, Booking booking)
        {
            var update = Builders<Location>.Update.Push(x => x.Bookings, booking);
            var result = await _locations.UpdateOneAsync(x => x.Id == locationId, update);
            return result.MatchedCount > 0;
        }

        public async Task<bool> CancelBookingAsync(Guid locationId, Guid bookingId)
        {
            var update = Builders<Location>.Update.PullFilter(x => x.Bookings,
                b => b.Id == bookingId);
            var result = await _locations.UpdateOneAsync(x => x.Id == locationId, update);
            return result.MatchedCount > 0;
        }

        public async Task<List<Location>> GetLocationsByCityAsync(string city)
        {
            return await _locations.Find(l => l.City.ToLower() == city.ToLower()).ToListAsync();
        }

    }
}
