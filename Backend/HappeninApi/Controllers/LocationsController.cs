using HappeninApi.DTOs;
using HappeninApi.Models;
using HappeninApi.Repositories;
using Microsoft.AspNetCore.Mvc;

namespace HappeninApi.Controllers
{
    /// <summary>
    /// Controller for managing event locations, including creation, booking, cancellation, and deletion.
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class LocationsController : ControllerBase
    {
        private readonly ILocationRepository _locationRepo;

        public LocationsController(ILocationRepository locationRepo)
        {
            _locationRepo = locationRepo;
        }

        // POST /locations
        /// <summary>
        /// Creates a new location.
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> CreateLocation([FromBody] CreateLocationDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var location = new Location
            {
                Id = Guid.NewGuid(),
                State = dto.State,
                City = dto.City,
                PlaceName = dto.PlaceName,
                Address = dto.Address,
                MaxSeatingCapacity = dto.MaxSeatingCapacity,
                Amenities = dto.Amenities,
                Bookings = new List<Booking>()
            };

            await _locationRepo.CreateAsync(location);
            return CreatedAtAction(nameof(GetLocationById), new { locationId = location.Id }, location);
        }

        // GET /locations
        /// <summary>
        /// Retrieves all locations.
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetAllLocations()
        {
            var locations = await _locationRepo.GetAllAsync();
            return Ok(locations);
        }

        // GET /locations/{locationId}
        /// <summary>
        /// Retrieves a location by its unique identifier.
        /// </summary>
        [HttpGet("{locationId}")]
        public async Task<IActionResult> GetLocationById(Guid locationId)
        {
            var location = await _locationRepo.GetByIdAsync(locationId);
            return location is null ? NotFound("Location not found") : Ok(location);
        }

        // POST /locations/book
        /// <summary>
        /// Books a location for an event.
        /// </summary>
        [HttpPost("book")]
        public async Task<IActionResult> BookLocation([FromBody] BookLocationDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var booking = new Booking
            {
                Id = Guid.NewGuid(),
                Date = dto.Date,
                TimeSlot = dto.TimeSlot,
                EventId = dto.EventId
            };

            var success = await _locationRepo.BookLocationAsync(dto.LocationId, booking);
            if (!success)
                return NotFound("Location not found");

            return Ok("Booking added successfully");
        }

        // POST /locations/cancel
        /// <summary>
        /// Cancels a booking for a location.
        /// </summary>
        [HttpPost("cancel")]
        public async Task<IActionResult> CancelBooking([FromBody] CancelBookingDto dto)
        {
            var success = await _locationRepo.CancelBookingAsync(dto.LocationId, dto.BookingId);
            if (!success)
                return NotFound("Location not found");

            return Ok(new { message = "Booking cancelled successfully" });

        }

        // DELETE /locations/{locationId}
        /// <summary>
        /// Deletes a location.
        /// </summary>
        [HttpDelete("{locationId}")]
        public async Task<IActionResult> DeleteLocation(Guid locationId)
        {
            var success = await _locationRepo.DeleteAsync(locationId);
            if (!success)
                return NotFound("Location not found");

            return Ok(new { message = "Location deleted successfully" });
        }
    }
}
