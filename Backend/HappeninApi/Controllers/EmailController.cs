using Microsoft.AspNetCore.Mvc;
using HappeninApi.DTOs;
using HappeninApi.Repositories;

namespace HappeninApi.Controllers
{
    [ApiController]
    [Route("api/email")]
    public class EmailController : ControllerBase
    {
        private readonly IEmailService _emailService;

        public EmailController(IEmailService emailService)
        {
            _emailService = emailService;
        }

        [HttpPost("send-ticket")]
        public async Task<IActionResult> SendTicketEmail([FromBody] TicketEmailDto request)
        {
            try
            {
                await _emailService.SendTicketEmailAsync(request);
                return Ok(new { success = true, message = "Ticket email sent." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Failed to send email", error = ex.Message });
            }
        }
    }
}
