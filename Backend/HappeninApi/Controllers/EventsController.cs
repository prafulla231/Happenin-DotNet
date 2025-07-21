using HappeninApi.DTOs;
using HappeninApi.Models;
using HappeninApi.Repositories;
using Microsoft.AspNetCore.Mvc;

namespace HappeninApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class EventsController : ControllerBase
    {
        private readonly IEventRepository _repository;

        public EventsController(IEventRepository repository)
        {
            _repository = repository;
        }

        [HttpPost]
        public async Task<IActionResult> CreateEvent([FromBody] CreateEventDto dto)
        {
            Console.WriteLine($"📥 Creating Event: {dto.Title} by {dto.CreatedById}");

            var evnt = new Event
            {
                Id = Guid.NewGuid(),
                Title = dto.Title,
                Description = dto.Description,
                Date = dto.Date,
                TimeSlot = dto.TimeSlot,
                Duration = dto.Duration,
                LocationId = dto.LocationId,
                Category = dto.Category,
                Price = dto.Price,
                MaxRegistrations = dto.MaxRegistrations,
                CurrentRegistrations = 0,
                CreatedById = dto.CreatedById,
                Artist = dto.Artist,
                Organization = dto.Organization,
                IsDeleted = false,
                Status = EventStatus.Pending,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                Location = new Location
                {
                    Id = dto.LocationId,
                    State = "",
                    City = "",
                    PlaceName = "",
                    Address = ""
                },
                CreatedBy = new User
                {
                    Id = dto.CreatedById,
                    Name = "",
                    Phone = "",
                    Email = "",
                    Password = ""
                }
            };

            var created = await _repository.CreateEventAsync(evnt);

            Console.WriteLine("✅ Event created with ID: " + created.Id);

            return CreatedAtAction(nameof(GetEvent), new { id = created.Id }, created);
        }

        [HttpGet("by-id/{id}")]
        public async Task<IActionResult> GetEvent(Guid id)
        {
            Console.WriteLine("🔍 Fetching Event with ID: " + id);
            var evnt = await _repository.GetByIdAsync(id);
            if (evnt == null)
            {
                Console.WriteLine("❌ Event not found.");
                return NotFound();
            }

            return Ok(evnt);
        }

        [HttpGet]
        public async Task<IActionResult> GetAllEvents([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        {
            Console.WriteLine("📄 Fetching ALL events, Page: " + page);
            await _repository.MarkExpiredEventsAsync();
            var events = await _repository.GetAllEventsAsync(page, pageSize);
            return Ok(events);
        }

        [HttpGet("pending")]
        public async Task<IActionResult> GetPendingEvents([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        {
            Console.WriteLine("📄 Fetching PENDING events, Page: " + page);
            await _repository.MarkExpiredEventsAsync();
            var events = await _repository.GetEventsByStatusAsync(EventStatus.Pending, page, pageSize);
            return Ok(events);
        }

        [HttpGet("approved")]
        public async Task<IActionResult> GetApprovedEvents([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        {
            Console.WriteLine("📄 Fetching APPROVED events, Page: " + page);
            await _repository.MarkExpiredEventsAsync();
            var events = await _repository.GetEventsByStatusAsync(EventStatus.Approved, page, pageSize);
            return Ok(events);
        }

        [HttpGet("rejected")]
        public async Task<IActionResult> GetRejectedEvents([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        {
            Console.WriteLine("📄 Fetching REJECTED events, Page: " + page);
            await _repository.MarkExpiredEventsAsync();
            var events = await _repository.GetEventsByStatusAsync(EventStatus.Rejected, page, pageSize);
            return Ok(events);
        }

        [HttpGet("expired")]
        public async Task<IActionResult> GetExpiredEvents([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        {
            Console.WriteLine("📄 Fetching EXPIRED events, Page: " + page);
            await _repository.MarkExpiredEventsAsync();
            var events = await _repository.GetEventsByStatusAsync(EventStatus.Expired, page, pageSize);
            return Ok(events);
        }

        [HttpPatch("{id}/status")]
        public async Task<IActionResult> UpdateEventStatus(Guid id, [FromBody] EventStatusUpdateDto dto)
        {
            if (!Enum.TryParse<EventStatus>(dto.Status, true, out var newStatus))
                return BadRequest("Invalid status value.");

            var success = await _repository.UpdateEventStatusAsync(id, newStatus);
            return success ? NoContent() : NotFound();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteEvent(Guid id)
        {
            Console.WriteLine("🗑️ Deleting Event with ID: " + id);
            var deleted = await _repository.DeleteEventAsync(id);
            if (!deleted)
            {
                Console.WriteLine("❌ Failed to delete. Event not found.");
                return NotFound();
            }

            Console.WriteLine("✅ Event deleted successfully.");
            return NoContent();
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateEvent(Guid id, [FromBody] UpdateEventDto dto)
        {
            Console.WriteLine("✏️ Updating Event with ID: " + id);

            var updated = await _repository.UpdateEventAsync(id, dto);
            if (!updated)
            {
                Console.WriteLine("❌ Update failed. Event not found.");
                return NotFound();
            }

            Console.WriteLine("✅ Event updated successfully.");
            return NoContent();
        }

         [HttpGet("by-organizer/{organizerId}")]
        public async Task<IActionResult> GetEventsByOrganizer(Guid organizerId, [FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        {
            Console.WriteLine($"📄 Fetching events by Organizer ID: {organizerId}, Page: {page}");
            var events = await _repository.GetEventsByOrganizerAsync(organizerId, page, pageSize);
            return Ok(events);
        }

    }
}
