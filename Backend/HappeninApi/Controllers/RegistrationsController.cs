using Microsoft.AspNetCore.Mvc;
using HappeninApi.Models;
using MongoDB.Driver;
using HappeninApi.Repositories;

namespace HappeninApi.Controllers{


[ApiController]
[Route("api/events")]
public class RegistrationsController : ControllerBase
{
    private readonly IRegistrationRepository _repository;

    public RegistrationsController(IRegistrationRepository repository)
    {
        _repository = repository;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegistrationDto dto)
    {
        if (dto.UserId == Guid.Empty || dto.EventId == Guid.Empty)
            return BadRequest("UserId and EventId are required.");

        var success = await _repository.RegisterAsync(dto.UserId, dto.EventId);
        return success ? Ok("Successfully registered.") : BadRequest("Registration failed.");
    }

    [HttpPost("deregister")]
    public async Task<IActionResult> Deregister([FromBody] RegistrationDto dto)
    {
        if (dto.UserId == Guid.Empty || dto.EventId == Guid.Empty)
            return BadRequest("UserId and EventId are required.");

        var success = await _repository.DeregisterAsync(dto.UserId, dto.EventId);
        return success ? Ok("Deregistered successfully.") : NotFound("Registration not found.");
    }

    [HttpGet("{eventId}/registered-users")]
    public async Task<IActionResult> GetRegisteredUsers(Guid eventId)
    {
        var users = await _repository.GetUsersForEventAsync(eventId);
        return Ok(new
        {
            message = "Registered users fetched",
            data = users.Select(u => new { u.Id, u.Name, u.Email })
        });
    }

    [HttpDelete("{eventId}/users/{userId}")]
    public async Task<IActionResult> DeleteRegistration(Guid eventId, Guid userId)
    {
        var success = await _repository.DeleteRegistrationAsync(eventId, userId);
        return success ? NoContent() : NotFound("Registration not found.");
    }

    [HttpGet("registered/{userId}")]
    public async Task<IActionResult> GetRegisteredEvents(Guid userId)
    {
        var events = await _repository.GetRegisteredEventsAsync(userId);
        return Ok(new { events });
    }
}
}