namespace HappeninApi.Models.Filters
{
    public class EventFilters
    {
        public string? Search { get; set; }
        public string? Category { get; set; }
        public List<string>? LocationPlaceNames { get; set; }
        public bool ForceNoLocationMatch { get; set; } = false;
        public DateTime? DateFrom { get; set; }
        public DateTime? DateTo { get; set; }
        public decimal? MinPrice { get; set; }
        public decimal? MaxPrice { get; set; }
        public string? SortField { get; set; }
        public SortDirection? SortDirection { get; set; }
    }

    public enum SortDirection
    {
        Ascending,
        Descending
    }
}
