using HappeninApi.Models;
using HappeninApi.Repositories;
using Microsoft.AspNetCore.Mvc;

namespace HappeninApi.Controllers
{
    /// <summary>
    /// Controller for retrieving users by role (organizer, user, admin).
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class RolesController : ControllerBase
    {
        private readonly IUserRepository _userRepository;

        public RolesController(IUserRepository userRepository)
        {
            _userRepository = userRepository;
        }

        /// <summary>
        /// Gets all users with the Organizer role.
        /// </summary>
        [HttpGet("organizers")]
        public async Task<IActionResult> GetAllOrganizers()
        {
            var organizers = await _userRepository.GetUsersByRoleAsync(UserRole.Organizer);
            return Ok(organizers.Select(u => new
            {
                u.Id,
                u.Name,
                u.Email,
                u.Phone,
                Role = u.Role.ToString()
            }));
        }

        /// <summary>
        /// Gets all users with the User role.
        /// </summary>
        [HttpGet("users")]
        public async Task<IActionResult> GetAllUsers()
        {
            var users = await _userRepository.GetUsersByRoleAsync(UserRole.User);
            return Ok(users.Select(u => new
            {
                u.Id,
                u.Name,
                u.Email,
                u.Phone,
                Role = u.Role.ToString()
            }));
        }

        /// <summary>
        /// Gets all users with the Admin role.
        /// </summary>
        [HttpGet("admins")]
        public async Task<IActionResult> GetAllAdmins()
        {
            var admins = await _userRepository.GetUsersByRoleAsync(UserRole.Admin);
            return Ok(admins.Select(u => new
            {
                u.Id,
                u.Name,
                u.Email,
                u.Phone,
                Role = u.Role.ToString()
            }));
        }
    }
}
