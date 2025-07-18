using System;

namespace HappeninApi.Models
{

public class Location
{
    [MongoDB.Bson.Serialization.Attributes.BsonRepresentation(MongoDB.Bson.BsonType.String)]
    public Guid Id { get; set; }

    public required string State { get; set; }

    public required string City { get; set; }

    public required string PlaceName { get; set; }

    public required string Address { get; set; }

    public int MaxSeatingCapacity { get; set; }

    public List<string> Amenities { get; set; } = new();

    public List<Booking> Bookings { get; set; } = new();
}


public class Booking
{
    [MongoDB.Bson.Serialization.Attributes.BsonRepresentation(MongoDB.Bson.BsonType.String)]
    public Guid Id { get; set; }

    public DateTime Date { get; set; }

    public required string TimeSlot { get; set; }

    [MongoDB.Bson.Serialization.Attributes.BsonRepresentation(MongoDB.Bson.BsonType.String)]
    public Guid EventId { get; set; }
}
}