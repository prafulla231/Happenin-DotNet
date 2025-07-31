using HappeninApi.Models;

namespace HappeninApi.Repositories
{
    /// <summary>
    /// Interface for location-related data operations.
    /// </summary>
    public interface ILocationRepository
    {

        /// <summary>
        /// Gets all locations.
        /// </summary>
        /// <returns>List of locations.</returns>
        Task<List<Location>> GetAllAsync();

        /// <summary>
        /// Gets a location by its ID.
        /// </summary>
        /// <param name="id">Location ID.</param>
        /// <returns>The location if found; otherwise, null.</returns>
        Task<Location?> GetByIdAsync(Guid id);

        /// <summary>
        /// Creates a new location.
        /// </summary>
        /// <param name="location">Location to create.</param>
        /// <returns>The created location.</returns>
        Task<Location> CreateAsync(Location location);

        /// <summary>
        /// Deletes a location.
        /// </summary>
        /// <param name="id">Location ID.</param>
        /// <returns>True if deleted; otherwise, false.</returns>
        Task<bool> DeleteAsync(Guid id);

        /// <summary>
        /// Books a location.
        /// </summary>
        /// <param name="locationId">Location ID.</param>
        /// <param name="booking">Booking details.</param>
        /// <returns>True if booked; otherwise, false.</returns>
        Task<bool> BookLocationAsync(Guid locationId, Booking booking);

        /// <summary>
        /// Cancels a booking for a location.
        /// </summary>
        /// <param name="locationId">Location ID.</param>
        /// <param name="bookingId">Booking ID.</param>
        /// <returns>True if cancelled; otherwise, false.</returns>
        Task<bool> CancelBookingAsync(Guid locationId, Guid bookingId);

        /// <summary>
        /// Gets locations by city.
        /// </summary>
        /// <param name="city">City name.</param>
        /// <returns>List of locations in the city.</returns>
        Task<List<Location>> GetLocationsByCityAsync(string city);
    }
}
