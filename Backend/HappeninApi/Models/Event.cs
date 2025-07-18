using System;

namespace HappeninApi.Models

{

public class Event
{
    [MongoDB.Bson.Serialization.Attributes.BsonRepresentation(MongoDB.Bson.BsonType.String)]
    public Guid Id { get; set; }

    public required string Title { get; set; }

    public string? Description { get; set; }

    public DateTime Date { get; set; }

    public required string TimeSlot { get; set; }

    public int Duration { get; set; } // In minutes

    [MongoDB.Bson.Serialization.Attributes.BsonRepresentation(MongoDB.Bson.BsonType.String)]
    public Guid LocationId { get; set; }

    public required Location Location { get; set; }

    public required string Category { get; set; }

    public decimal Price { get; set; }

    public int MaxRegistrations { get; set; }

    public int CurrentRegistrations { get; set; }

    [MongoDB.Bson.Serialization.Attributes.BsonRepresentation(MongoDB.Bson.BsonType.String)]
    public Guid CreatedById { get; set; }

    public required User CreatedBy { get; set; }

    public string? Artist { get; set; }

    public string? Organization { get; set; }

    public bool IsDeleted { get; set; } = false;

    public EventStatus Status { get; set; } = EventStatus.Pending;

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }
}

public enum EventStatus
{
    Pending,
    Approved,
     Rejected,
    Expired
}
}