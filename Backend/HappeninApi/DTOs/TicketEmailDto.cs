namespace HappeninApi.DTOs
{
    public class TicketEmailDto
    {
        public string UserId { get; set; } = null!;
        public string EventId { get; set; } = null!;
        public string UserEmail { get; set; } = null!;
        public string UserName { get; set; } = "Guest";
        public bool SendPDF { get; set; } = true;
        public bool SendDetails { get; set; } = true;
        public string? PdfBase64 { get; set; }
    }
}
