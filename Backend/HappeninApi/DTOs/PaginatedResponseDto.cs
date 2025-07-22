namespace HappeninApi.DTOs
{
    public class PaginatedResponseDto<T>
    {
        public IEnumerable<T> Data { get; set; } = new List<T>();
        public int CurrentPage { get; set; }
        public int PageSize { get; set; }
        public int TotalCount { get; set; }
        public int TotalPages { get; set; }
        public bool HasPreviousPage { get; set; }
        public bool HasNextPage { get; set; }

        public PaginatedResponseDto()
        {
        }

        public PaginatedResponseDto(IEnumerable<T> data, int currentPage, int pageSize, int totalCount)
        {
            Data = data;
            CurrentPage = currentPage;
            PageSize = pageSize;
            TotalCount = totalCount;
            TotalPages = (int)Math.Ceiling((double)totalCount / pageSize);
            HasPreviousPage = currentPage > 1;
            HasNextPage = currentPage < TotalPages;
        }
    }
}