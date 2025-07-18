namespace HappeninApi.DTOs
{
    public class CreateEventDto
    {
        public required string Title { get; set; }
        public string? Description { get; set; }
        public DateTime Date { get; set; }
        public required string TimeSlot { get; set; }
        public int Duration { get; set; }
        public Guid LocationId { get; set; }
        public required string Category { get; set; }
        public decimal Price { get; set; }
        public int MaxRegistrations { get; set; }
        public Guid CreatedById { get; set; }
        public string? Artist { get; set; }
        public string? Organization { get; set; }
    }
}