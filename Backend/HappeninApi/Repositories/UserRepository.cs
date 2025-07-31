using HappeninApi.Models;
using MongoDB.Driver;

namespace HappeninApi.Repositories
{
    /// <summary>
    /// Repository for user-related data operations.
    /// </summary>
    public class UserRepository : IUserRepository
    {
        private readonly IMongoCollection<User> _users;

        /// <summary>
        /// Initializes a new instance of the <see cref="UserRepository"/> class.
        /// </summary>
        /// <param name="db">MongoDB database instance.</param>
        public UserRepository(IMongoDatabase db)
        {
            _users = db.GetCollection<User>("Users");
        }

        /// <summary>
        /// Gets users by their role.
        /// </summary>
        /// <param name="role"></param>
        /// <returns></returns>
        public async Task<List<User>> GetUsersByRoleAsync(UserRole role)
        {
            return await _users.Find(u => u.Role == role).ToListAsync();
        }
    }
}
