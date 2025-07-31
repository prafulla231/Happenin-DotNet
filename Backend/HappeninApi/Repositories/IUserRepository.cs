using HappeninApi.Models;

namespace HappeninApi.Repositories
{
    /// <summary>
    /// Interface for user-related data operations.
    /// </summary>
    public interface IUserRepository
    {
        /// <summary>
        /// Gets users by their role.
        /// </summary>
        /// <param name="role">User role.</param>
        /// <returns>List of users with the specified role.</returns>
        Task<List<User>> GetUsersByRoleAsync(UserRole role);
    }
}
