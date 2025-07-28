using HappeninApi.DTOs;

namespace HappeninApi.Repositories
{
    public interface IEmailService
    {
        Task SendTicketEmailAsync(TicketEmailDto request);
    }
}
