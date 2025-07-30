using Microsoft.AspNetCore.Mvc;
using HappeninApi.Models;
using MongoDB.Driver;
using HappeninApi.Repositories;

namespace HappeninApi.Controllers
{

    /// <summary>
    /// Controller for event registration operations, including registering, deregistering, and fetching registered users/events.
    /// </summary>
    [ApiController]
    [Route("api/events")]
    public class RegistrationsController : ControllerBase
    {
        private readonly IRegistrationRepository _repository;
        private readonly ILocationRepository _locationRepo;


        public RegistrationsController(IRegistrationRepository repository, ILocationRepository locationRepo)
        {
            _repository = repository;
            _locationRepo = locationRepo;
        }

        /// <summary>
        /// Registers a user for an event.
        /// </summary>
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegistrationDto dto)
        {
            if (dto.UserId == Guid.Empty || dto.EventId == Guid.Empty)
                return BadRequest("UserId and EventId are required.");

            var success = await _repository.RegisterAsync(dto.UserId, dto.EventId);
            return success
        ? Ok(new { message = "Successfully registered." })
        : BadRequest(new { message = "Registration failed." });

        }

        /// <summary>
        /// Deregisters a user from an event.
        /// </summary>
        [HttpPost("deregister")]
        public async Task<IActionResult> Deregister([FromBody] RegistrationDto dto)
        {
            if (dto.UserId == Guid.Empty || dto.EventId == Guid.Empty)
                return BadRequest("UserId and EventId are required.");

            var success = await _repository.DeregisterAsync(dto.UserId, dto.EventId);
            return success ? Ok(new { message = "Successfully deregistered." }) : BadRequest(new { message = "Registration failed." });

        }

        /// <summary>
        /// Gets all users registered for a specific event.
        /// </summary>
        [HttpGet("{eventId}/registered-users")]
        public async Task<IActionResult> GetRegisteredUsers(Guid eventId)
        {
            var users = await _repository.GetUsersForEventAsync(eventId);

            return Ok(new
            {
                message = "Registered users fetched",
                data = new
                {
                    currentRegistration = users.Count(),
                    users = users.Select(u => new { u.Id, u.Name, u.Email })
                }
            });
        }

        /// <summary>
        /// Deletes a user's registration for an event.
        /// </summary>
        [HttpDelete("{eventId}/users/{userId}")]
        public async Task<IActionResult> DeleteRegistration(Guid eventId, Guid userId)
        {
            var success = await _repository.DeleteRegistrationAsync(eventId, userId);
            return success ? NoContent() : NotFound("Registration not found.");
        }

        /// <summary>
        /// Gets all events a user is registered for, including location data.
        /// </summary>
        [HttpGet("registered-events/{userId}")]
        public async Task<IActionResult> GetRegisteredEvents(Guid userId)
        {
            var events = await _repository.GetRegisteredEventsAsync(userId);

            // 🔁 Populate Location data for each event
            foreach (var ev in events)
            {
                if (ev.LocationId != Guid.Empty)
                {
                    Location? location = await _locationRepo.GetByIdAsync(ev.LocationId);
                    if (location != null)
                    {
                        ev.Location = location;
                    }
                }
            }

            return Ok(new { events });
        }

    }
}