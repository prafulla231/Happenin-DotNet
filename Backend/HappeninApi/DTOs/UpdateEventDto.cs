namespace HappeninApi.DTOs
{
    public class UpdateEventDto
    {
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public DateTime Date { get; set; }
        public string TimeSlot { get; set; } = string.Empty;
        public int Duration { get; set; }
        public Guid LocationId { get; set; }
        public string Category { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public int MaxRegistrations { get; set; }
        public string Artist { get; set; } = string.Empty;
        public string Organization { get; set; } = string.Empty;
    }
}
