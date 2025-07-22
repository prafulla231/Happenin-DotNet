using HappeninApi.DTOs;

namespace HappeninApi.Helpers
{
    public class PaginationHelper
    {
        public int Page { get; }
        public int PageSize { get; }
        public int Skip { get; }
        public int Take { get; }

        public PaginationHelper(int page, int pageSize)
        {
            Page = Math.Max(1, page);
            PageSize = Math.Max(1, Math.Min(100, pageSize));
            Skip = (Page - 1) * PageSize;
            Take = PageSize;
        }

        public PaginationHelper(PaginationRequestDto request) 
            : this(request.Page, request.PageSize)
        {
        }
    }
}