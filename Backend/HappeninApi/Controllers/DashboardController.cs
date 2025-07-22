using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace HappeninApi.Controllers
{
    [Route("api/users/")]
    [ApiController]
    public class DashboardController : ControllerBase
    {
        [HttpGet("dashboard")]
        [Authorize]
        public IActionResult GetDashboardRedirect()
        {
            var roleClaim = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Role);
            if (roleClaim == null)
            {
                return Forbid("No role claim found");
            }

            string redirectTo;
            switch (roleClaim.Value.ToLower())
            {
                case "admin":
                    redirectTo = "/admin-dashboard";
                    break;
                case "organizer":
                    redirectTo = "/organizer-dashboard";
                    break;
                case "user":
                    redirectTo = "/user-dashboard";
                    break;
                default:
                    return StatusCode(403, new { message = "Unknown role" });
            }

            return Ok(new
            {
                message = "Redirecting based on role",
                data = new { redirectTo }
            });
        }
    }
}
