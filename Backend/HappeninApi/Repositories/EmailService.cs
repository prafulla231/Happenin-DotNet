using HappeninApi.DTOs;
using HappeninApi.Helpers;
using HappeninApi.Repositories;

namespace HappeninApi.Repositories
{
    /// <summary>
    /// Service for handling email-related operations, such as sending registration tickets.
    /// </summary>
    public class EmailService : IEmailService
    {
        private readonly EmailHelper _emailHelper;

        /// <summary>
        /// Initializes a new instance of the <see cref="EmailService"/> class.
        /// </summary>
        /// <param name="emailHelper">Helper for sending emails.</param>

        public EmailService(EmailHelper emailHelper)
        {
            _emailHelper = emailHelper;
        }

        /// <summary>
        /// Sends a ticket email to the user, optionally attaching a PDF if provided.
        /// </summary>
        /// <param name="dto">Ticket email details.</param>
        /// <exception cref="Exception">Thrown if the provided PDF base64 string is invalid.</exception>

        public async Task SendTicketEmailAsync(TicketEmailDto dto)
        {
            string? pdfBase64 = null;

            if (dto.SendPDF && !string.IsNullOrWhiteSpace(dto.PdfBase64))
            {
                pdfBase64 = dto.PdfBase64; // Just pass the base64 string directly
            }

            await _emailHelper.SendRegistrationTicketAsync(
                dto.UserEmail,
                dto.UserName,
                $"Event #{dto.EventId}", // Replace with actual event name if needed
                pdfBase64
            );
        }

    }
}
