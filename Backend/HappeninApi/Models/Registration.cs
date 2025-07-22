using System;

namespace HappeninApi.Models
{
    public class Registration
    {
        [MongoDB.Bson.Serialization.Attributes.BsonRepresentation(MongoDB.Bson.BsonType.String)]
        public Guid Id { get; set; }

        [MongoDB.Bson.Serialization.Attributes.BsonRepresentation(MongoDB.Bson.BsonType.String)]
        public Guid UserId { get; set; }

        public required User User { get; set; }

        [MongoDB.Bson.Serialization.Attributes.BsonRepresentation(MongoDB.Bson.BsonType.String)]
        public Guid EventId { get; set; }

        public required Event Event { get; set; }

        public DateTime RegisteredAt { get; set; }

        public bool IsDeleted { get; set; } = false;
    }
}