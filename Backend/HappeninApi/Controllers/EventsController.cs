
using HappeninApi.DTOs;
using HappeninApi.Models;
using HappeninApi.Repositories;
using Microsoft.AspNetCore.Mvc;
using HappeninApi.Helpers;

namespace HappeninApi.Controllers
{
    /// <summary>
    /// Controller for managing events, including creation, status updates, deletion, and retrieval by status or organizer.
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class EventsController : ControllerBase
    {
        private readonly IEventRepository _repository;
        private readonly ILocationRepository _locationRepo;

        public EventsController(IEventRepository repository, ILocationRepository locationRepo)
        {
            _repository = repository;
            _locationRepo = locationRepo;
        }

        [HttpPost]
        public async Task<IActionResult> CreateEvent([FromBody] CreateEventDto dto)
        {

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

            // Console.WriteLine("✅ Event created with ID: " + created.Id);

            return CreatedAtAction(nameof(GetEvent), new { id = created.Id }, created);
        }


        /// <summary>
        /// Gets events by organizer and status with pagination.
        /// </summary>
        [HttpGet("by-organizer/{organizerId}/status/{status}")]
        public async Task<IActionResult> GetEventsByOrganizerAndStatus(Guid organizerId, string status, [FromQuery] PaginationRequestDto paginationRequest)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            if (!Enum.TryParse<EventStatus>(status, true, out var parsedStatus))
                return BadRequest($"Invalid status: {status}");

            var pagination = new HappeninApi.Helpers.PaginationHelper(paginationRequest.Page, paginationRequest.PageSize);
            var (events, totalCount) = await _repository.GetEventsByOrganizerAndStatusAsync(organizerId, parsedStatus, pagination);

            var response = new PaginatedResponseDto<Event>(events, paginationRequest.Page, paginationRequest.PageSize, totalCount);
            return Ok(response);
        }

        // Duplicate namespace and class removed. Only one EventsController class and namespace block should exist.

        [HttpGet("by-id/{id}")]
        public async Task<IActionResult> GetEvent(Guid id)
        {
            // Console.WriteLine("🔍 Fetching Event with ID: " + id);
            var evnt = await _repository.GetByIdAsync(id);
            if (evnt == null)
            {
                Console.WriteLine("❌ Event not found.");
                return NotFound();
            }

            return Ok(evnt);
        }

        [HttpGet]
        public async Task<IActionResult> GetAllEvents([FromQuery] PaginationRequestDto paginationRequest)
        {
            // Console.WriteLine($"📄 Fetching ALL events, Page: {paginationRequest.Page}");

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            await _repository.MarkExpiredEventsAsync();

            var pagination = new PaginationHelper(paginationRequest);
            var (events, totalCount) = await _repository.GetAllEventsAsync(pagination);

            // Populate Location data for each event
            foreach (var ev in events)
            {
                if (ev.LocationId != Guid.Empty)
                {
                    Location? location = await _locationRepo.GetByIdAsync(ev.LocationId); // ✅
                    if (location != null)
                    {
                        ev.Location = location;
                    }

                }
            }

            var response = new PaginatedResponseDto<Event>(events, pagination.Page, pagination.PageSize, totalCount);

            return Ok(response);
        }

        /// <summary>
        /// Gets pending events with pagination.
        /// </summary>
        [HttpGet("pending")]
        public async Task<IActionResult> GetPendingEvents([FromQuery] PaginationRequestDto paginationRequest)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            await _repository.MarkExpiredEventsAsync();

            var pagination = new PaginationHelper(paginationRequest);
            var (events, totalCount) = await _repository.GetEventsByStatusAsync(EventStatus.Pending, pagination);

            // Assign locations to each event
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

            var response = new PaginatedResponseDto<Event>(events, pagination.Page, pagination.PageSize, totalCount);
            return Ok(response);
        }

        /// <summary>
        /// Gets approved events with pagination.
        /// </summary>
        [HttpGet("approved")]
        public async Task<IActionResult> GetApprovedEvents([FromQuery] PaginationRequestDto paginationRequest)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            await _repository.MarkExpiredEventsAsync();

            var pagination = new PaginationHelper(paginationRequest);
            var (events, totalCount) = await _repository.GetEventsByStatusAsync(EventStatus.Approved, pagination);

            // Assign locations to each event
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

            var response = new PaginatedResponseDto<Event>(events, pagination.Page, pagination.PageSize, totalCount);
            return Ok(response);
        }

        /// <summary>
        /// Gets rejected events with pagination.
        /// </summary>
        [HttpGet("rejected")]
        public async Task<IActionResult> GetRejectedEvents([FromQuery] PaginationRequestDto paginationRequest)
        {
            // Console.WriteLine($"📄 Fetching REJECTED events, Page: {paginationRequest.Page}");

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            await _repository.MarkExpiredEventsAsync();

            var pagination = new PaginationHelper(paginationRequest);
            var (events, totalCount) = await _repository.GetEventsByStatusAsync(EventStatus.Rejected, pagination);

            var response = new PaginatedResponseDto<Event>(events, pagination.Page, pagination.PageSize, totalCount);

            return Ok(response);
        }

        /// <summary>
        /// Gets expired events with pagination.
        /// </summary>
        [HttpGet("expired")]
        public async Task<IActionResult> GetExpiredEvents([FromQuery] PaginationRequestDto paginationRequest)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            await _repository.MarkExpiredEventsAsync();

            var pagination = new PaginationHelper(paginationRequest);
            var (events, totalCount) = await _repository.GetEventsByStatusAsync(EventStatus.Expired, pagination);

            // Assign locations to each event
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

            var response = new PaginatedResponseDto<Event>(events, pagination.Page, pagination.PageSize, totalCount);
            return Ok(response);
        }

        /// <summary>
        /// Gets events by organizer with pagination.
        /// </summary>
        [HttpGet("by-organizer/{organizerId}")]
        public async Task<IActionResult> GetEventsByOrganizer(Guid organizerId, [FromQuery] PaginationRequestDto paginationRequest)
        {
            // Console.WriteLine($"📄 Fetching events by Organizer ID: {organizerId}, Page: {paginationRequest.Page}");

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var pagination = new PaginationHelper(paginationRequest);
            var (events, totalCount) = await _repository.GetEventsByOrganizerAsync(organizerId, pagination);

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

            var response = new PaginatedResponseDto<Event>(events, pagination.Page, pagination.PageSize, totalCount);

            return Ok(response);
        }

        /// <summary>
        /// Updates the status of an event.
        /// </summary>
        [HttpPatch("{id}/status")]
        public async Task<IActionResult> UpdateEventStatus(Guid id, [FromBody] EventStatusUpdateDto dto)
        {
            if (!Enum.TryParse<EventStatus>(dto.Status, true, out var newStatus))
                return BadRequest("Invalid status value.");

            var success = await _repository.UpdateEventStatusAsync(id, newStatus);
            return success ? NoContent() : NotFound();
        }

        /// <summary>
        /// Deletes an event.
        /// </summary>
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
        /// <summary>
        /// Updates an existing event.
        /// Returns 204 No Content if successful, or 404 Not Found if the event does not exist.
        /// </summary>
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateEvent(Guid id, [FromBody] UpdateEventDto dto)
        {
            // Console.WriteLine("✏️ Updating Event with ID: " + id);

            var updated = await _repository.UpdateEventAsync(id, dto);
            if (!updated)
            {
                Console.WriteLine("❌ Update failed. Event not found.");
                return NotFound();
            }

            // Console.WriteLine("✅ Event updated successfully.");
            return NoContent();
        }
    }
}