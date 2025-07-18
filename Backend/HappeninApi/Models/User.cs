using System;

namespace HappeninApi.Models
{

public class User
{
    [MongoDB.Bson.Serialization.Attributes.BsonRepresentation(MongoDB.Bson.BsonType.String)]
    public Guid Id { get; set; }

    public required string Name { get; set; }

    public required string Phone { get; set; }

    public required string Email { get; set; }

    public required string Password { get; set; }

    public UserRole Role { get; set; } = UserRole.User;

    public Otp? Otp { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }
}

public enum UserRole
{
    Admin,
    Organizer,
    User
}


public class Otp
{
    public required string Code { get; set; }

    public DateTime ExpiresAt { get; set; }
}
}