using HappeninApi.Models;
using HappeninApi.Repositories;
using Microsoft.AspNetCore.Mvc;

namespace HappeninApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class RolesController : ControllerBase
    {
        private readonly IUserRepository _userRepository;

        public RolesController(IUserRepository userRepository)
        {
            _userRepository = userRepository;
        }

        [HttpGet("organizers")]
        public async Task<IActionResult> GetAllOrganizers()
        {
            var organizers = await _userRepository.GetUsersByRoleAsync(UserRole.Organizer);
            return Ok(organizers.Select(u => new {
                u.Id,
                u.Name,
                u.Email,
                u.Phone,
                Role = u.Role.ToString()
            }));
        }

        [HttpGet("users")]
        public async Task<IActionResult> GetAllUsers()
        {
            var users = await _userRepository.GetUsersByRoleAsync(UserRole.User);
            return Ok(users.Select(u => new {
                u.Id,
                u.Name,
                u.Email,
                u.Phone,
                Role = u.Role.ToString()
            }));
        }

        [HttpGet("admins")]
        public async Task<IActionResult> GetAllAdmins()
        {
            var admins = await _userRepository.GetUsersByRoleAsync(UserRole.Admin);
            return Ok(admins.Select(u => new {
                u.Id,
                u.Name,
                u.Email,
                u.Phone,
                Role = u.Role.ToString()
            }));
        }
    }
}
