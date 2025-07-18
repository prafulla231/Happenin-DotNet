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
                Location = new Location {
                    Id = dto.LocationId,
                    State = "",
                    City = "",
                    PlaceName = "",
                    Address = ""
                },
                CreatedBy = new User {
                    Id = dto.CreatedById,
                    Name = "",
                    Phone = "",
                    Email = "",
                    Password = ""
                }
            };

            var created = await _repository.CreateEventAsync(evnt);

            return CreatedAtAction(nameof(GetEvent), new { id = created.Id }, created);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetEvent(Guid id)
        {
            var evnt = await _repository.GetByIdAsync(id);
            if (evnt == null)
                return NotFound();

            return Ok(evnt);
        }
    }
}
