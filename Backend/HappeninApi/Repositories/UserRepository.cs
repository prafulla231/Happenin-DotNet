using HappeninApi.Models;
using MongoDB.Driver;

namespace HappeninApi.Repositories
{
    public class UserRepository : IUserRepository
    {
        private readonly IMongoCollection<User> _users;

        public UserRepository(IMongoDatabase db)
        {
            _users = db.GetCollection<User>("Users");
        }

        public async Task<List<User>> GetUsersByRoleAsync(UserRole role)
        {
            return await _users.Find(u => u.Role == role).ToListAsync();
        }
    }
}
