using System.ComponentModel.DataAnnotations;

namespace HappeninApi.DTOs
{
    public class CreateLocationDto
    {
        [Required] public string State { get; set; } = null!;
        [Required] public string City { get; set; } = null!;
        [Required] public string PlaceName { get; set; } = null!;
        [Required] public string Address { get; set; } = null!;
        [Required] public int MaxSeatingCapacity { get; set; }
        public List<string> Amenities { get; set; } = new();
    }

    public class BookLocationDto
    {
        [Required] public Guid LocationId { get; set; }
        [Required] public DateTime Date { get; set; }
        [Required] public string TimeSlot { get; set; } = null!;
        [Required] public Guid EventId { get; set; }
    }

    public class CancelBookingDto
    {
        [Required] public Guid LocationId { get; set; }
        [Required] public Guid BookingId { get; set; }
    }
}
