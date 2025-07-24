public class AnalyticsDataDto
{
    public int TotalEvents { get; set; }
    public int UpcomingEvents { get; set; }
    public int ExpiredEvents { get; set; }
    public int TotalRegistrations { get; set; }
    public Dictionary<string, int> EventsByCategory { get; set; } = new();
    public Dictionary<string, int> EventsByMonth { get; set; } = new();
    public List<EventCountDto> RegistrationsByEvent { get; set; } = new();
    public List<EventRevenueDto> RevenueByEvent { get; set; } = new();
}

public class EventCountDto
{
    public string EventTitle { get; set; } = "";
    public int Registrations { get; set; }
}

public class EventRevenueDto
{
    public string EventTitle { get; set; } = "";
    public decimal Revenue { get; set; }
}
