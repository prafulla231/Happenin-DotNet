using System;

namespace HappeninApi.Models
{
public class Registration
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }

    public required User User { get; set; }

    public Guid EventId { get; set; }

    public required Event Event { get; set; }

    public DateTime RegisteredAt { get; set; }

    public bool IsDeleted { get; set; } = false;
}
}