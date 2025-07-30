using Microsoft.AspNetCore.Mvc;
using HappeninApi.DTOs;
using HappeninApi.Repositories;

namespace HappeninApi.Controllers
{
    /// <summary>
    /// Controller for email-related operations, such as sending ticket emails.
    /// </summary>
    [ApiController]
    [Route("api/email")]
    public class EmailController : ControllerBase
    {
        private readonly IEmailService _emailService;

        public EmailController(IEmailService emailService)
        {
            _emailService = emailService;
        }

        /// <summary>
        /// Sends a ticket email to the user for a specific event.
        /// </summary>
        /// <param name="request">Ticket email details</param>

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
