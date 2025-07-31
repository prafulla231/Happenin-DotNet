using HappeninApi.Models;
using MongoDB.Driver;

namespace HappeninApi.Repositories
{
    /// <summary>
    /// Repository for location-related data operations.
    /// </summary>
    public class LocationRepository : ILocationRepository
    {
        private readonly IMongoCollection<Location> _locations;

        /// <summary>
        /// Initializes a new instance of the <see cref="LocationRepository"/> class.
        /// </summary>
        /// <param name="db">MongoDB database instance.</param>
        public LocationRepository(IMongoDatabase db)
        {
            _locations = db.GetCollection<Location>("Locations");
        }

        /// <summary>
        /// Gets all locations.
        /// </summary>
        /// <returns></returns>
        public async Task<List<Location>> GetAllAsync()
        {
            return await _locations.Find(_ => true).ToListAsync();
        }

        /// <summary>
        /// Gets a location by its ID.
        /// </summary>
        /// <param name="id"></param>
        /// <returns></returns>
        public async Task<Location?> GetByIdAsync(Guid id)
        {
            return await _locations.Find(x => x.Id == id).FirstOrDefaultAsync();
        }

        /// <summary>
        /// Create a location.
        /// </summary>
        public async Task<Location> CreateAsync(Location location)
        {
            await _locations.InsertOneAsync(location);
            return location;
        }

        /// <summary>
        /// Delete a location.
        /// </summary>
        public async Task<bool> DeleteAsync(Guid id)
        {
            var result = await _locations.DeleteOneAsync(x => x.Id == id);
            return result.DeletedCount > 0;
        }

        /// <summary>
        /// Book a location.
        /// </summary>

        public async Task<bool> BookLocationAsync(Guid locationId, Booking booking)
        {
            var update = Builders<Location>.Update.Push(x => x.Bookings, booking);
            var result = await _locations.UpdateOneAsync(x => x.Id == locationId, update);
            return result.MatchedCount > 0;
        }

        /// <summary>
        /// Cancel a location booking.
        /// </summary>
        public async Task<bool> CancelBookingAsync(Guid locationId, Guid bookingId)
        {
            var update = Builders<Location>.Update.PullFilter(x => x.Bookings,
                b => b.Id == bookingId);
            var result = await _locations.UpdateOneAsync(x => x.Id == locationId, update);
            return result.MatchedCount > 0;
        }

        /// <summary>
        /// Get a location by city.
        /// </summary>
        public async Task<List<Location>> GetLocationsByCityAsync(string city)
        {
            return await _locations.Find(l => l.City.ToLower() == city.ToLower()).ToListAsync();
        }

    }
}
