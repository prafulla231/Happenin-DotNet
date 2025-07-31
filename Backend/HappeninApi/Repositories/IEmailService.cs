using HappeninApi.DTOs;

namespace HappeninApi.Repositories
{
    /// <summary>
    /// Interface for email-related services.
    /// </summary>
    public interface IEmailService
    {
        /// <summary>
        /// Sends a ticket email to the user.
        /// </summary>
        /// <param name="request">Ticket email details.</param>
        Task SendTicketEmailAsync(TicketEmailDto request);
    }
}
