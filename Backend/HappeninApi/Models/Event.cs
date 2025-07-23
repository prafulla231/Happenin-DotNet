using System;
using System.Text.Json.Serialization;

namespace HappeninApi.Models

{

public class Event
{
    [MongoDB.Bson.Serialization.Attributes.BsonId]
    [MongoDB.Bson.Serialization.Attributes.BsonRepresentation(MongoDB.Bson.BsonType.String)]
    [MongoDB.Bson.Serialization.Attributes.BsonElement("_id")]
    public Guid Id { get; set; }

    public required string Title { get; set; }

    public string? Description { get; set; }

    public DateTime Date { get; set; }

    public required string TimeSlot { get; set; } //starting time

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

[JsonConverter(typeof(JsonStringEnumConverter))]
    public enum EventStatus
    {
        Pending,
        Approved,
        Rejected,
        Expired
    }
}