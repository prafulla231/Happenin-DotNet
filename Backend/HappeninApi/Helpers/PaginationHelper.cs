using HappeninApi.DTOs;

namespace HappeninApi.Helpers
{
    /// <summary>
    /// Provides pagination calculation logic for paginated API responses.
    /// </summary>
    public class PaginationHelper
    {
        /// <summary>
        /// The current page number (1-based).
        /// </summary>
        public int Page { get; }

        /// <summary>
        /// The number of items per page.
        /// </summary>
        public int PageSize { get; }

        /// <summary>
        /// The number of items to skip.
        /// </summary>
        public int Skip { get; }

        /// <summary>
        /// The number of items to take.
        /// </summary>
        public int Take { get; }

        /// <summary>
        /// Initializes a new instance of the <see cref="PaginationHelper"/> class.
        /// </summary>
        /// <param name="page">The page number.</param>
        /// <param name="pageSize">The page size.</param>

        public PaginationHelper(int page, int pageSize)
        {
            Page = Math.Max(1, page);
            PageSize = Math.Max(1, Math.Min(100, pageSize));
            Skip = (Page - 1) * PageSize;
            Take = PageSize;
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="PaginationHelper"/> class using a <see cref="PaginationRequestDto"/>.
        /// </summary>
        /// <param name="request">The pagination request DTO.</param>
        public PaginationHelper(PaginationRequestDto request)
            : this(request.Page, request.PageSize)
        {
        }
    }
}