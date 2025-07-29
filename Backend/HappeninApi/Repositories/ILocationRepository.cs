using HappeninApi.Models;

namespace HappeninApi.Repositories
{
    public interface ILocationRepository
    {
        Task<List<Location>> GetAllAsync();
        Task<Location?> GetByIdAsync(Guid id);
        Task<Location> CreateAsync(Location location);
        Task<bool> DeleteAsync(Guid id);
        Task<bool> BookLocationAsync(Guid locationId, Booking booking);
        Task<bool> CancelBookingAsync(Guid locationId, Guid bookingId);
        Task<List<Location>> GetLocationsByCityAsync(string city);
    }
}
