using HappeninApi.DTOs;
using HappeninApi.Helpers;
using HappeninApi.Repositories;

namespace HappeninApi.Repositories
{
    public class EmailService : IEmailService
    {
        private readonly EmailHelper _emailHelper;

        public EmailService(EmailHelper emailHelper)
        {
            _emailHelper = emailHelper;
        }

        public async Task SendTicketEmailAsync(TicketEmailDto request)
        {
            byte[]? pdf = null;

            if (request.SendPDF)
            {
                // TODO: Generate actual PDF. Placeholder:
                pdf = GeneratePdfTicket(request);
            }

            await _emailHelper.SendRegistrationTicketAsync(
                request.UserEmail,
                request.UserName,
                $"Event #{request.EventId}",
                pdf
            );
        }

        private byte[] GeneratePdfTicket(TicketEmailDto request)
        {
            // Placeholder PDF generation
            var content = $"Ticket for {request.UserName} - Event ID: {request.EventId}";
            return System.Text.Encoding.UTF8.GetBytes(content); // use real PDF lib like iTextSharp/PDFsharp
        }
    }
}
