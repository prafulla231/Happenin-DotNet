using HappeninApi.Models;

namespace HappeninApi.Repositories
{
    public interface IUserRepository
    {
        Task<List<User>> GetUsersByRoleAsync(UserRole role);
    }
}
