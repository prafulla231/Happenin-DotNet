// HappeninApi/Controllers/UsersController.cs
using HappeninApi.DTOs;
using HappeninApi.Models;
using HappeninApi.Utils;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using MongoDB.Driver;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using HappeninApi.Helpers;

namespace HappeninApi.Controllers
{
    /// <summary>
    /// Controller for user registration and authentication.
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class UsersController : ControllerBase
    {
        private readonly IMongoCollection<User> _users;
        private readonly IConfiguration _config;

        public UsersController(IMongoDatabase db, IConfiguration config)
        {
            _users = db.GetCollection<User>("Users");
            _config = config;
        }

        /// <summary>
        /// Registers a new user.
        /// </summary>
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterDto dto)
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelStateHelper.ExtractErrors(ModelState);
                return BadRequest(errors);
            }
            if (string.IsNullOrWhiteSpace(dto.Name) ||
                string.IsNullOrWhiteSpace(dto.Email) ||
                string.IsNullOrWhiteSpace(dto.Phone) ||
                string.IsNullOrWhiteSpace(dto.Password))
            {
                return BadRequest("All fields are required.");
            }

            if (!ValidatorUtil.IsValidEmail(dto.Email))
                return BadRequest("Invalid email format.");

            if (!ValidatorUtil.IsValidPhone(dto.Phone))
                return BadRequest("Phone number must be exactly 10 digits.");

            if (dto.Password.Length < 6)
                return BadRequest("Password must be at least 6 characters long.");

            if (await _users.Find(u => u.Email == dto.Email).AnyAsync())
                return Conflict("Email already in use.");

            if (await _users.Find(u => u.Phone == dto.Phone).AnyAsync())
                return Conflict("Phone number already in use.");

            var hashedPassword = HashPassword(dto.Password);

            var newUser = new User
            {
                Name = dto.Name,
                Email = dto.Email,
                Phone = dto.Phone,
                Password = hashedPassword,
                Role = Enum.TryParse<UserRole>(dto.Role, true, out var parsedRole) ? parsedRole : UserRole.User

            };

            await _users.InsertOneAsync(newUser);

            return Created("/users/register", new
            {
                userId = newUser.Id,
                newUser.Name,
                newUser.Email,
                newUser.Phone,
                newUser.Role
            });
        }

        /// <summary>
        /// Authenticates a user and returns a JWT token.
        /// </summary>
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto dto)
        {
            var user = await _users.Find(u => u.Email == dto.Email).FirstOrDefaultAsync();

            if (user == null || !VerifyPassword(dto.Password, user.Password))
                return Unauthorized("Invalid email or password.");


            var token = JwtHelper.GenerateJwtToken(user, _config);

            return Ok(new
            {
                message = "Login successful",
                token,
                user = new
                {
                    userId = user.Id,
                    user.Name,
                    user.Email,
                    user.Role
                }
            });
        }


        private string HashPassword(string password)
        {
            byte[] salt = RandomNumberGenerator.GetBytes(16);
            var hash = Rfc2898DeriveBytes.Pbkdf2(password, salt, 10000, HashAlgorithmName.SHA256, 32);
            return Convert.ToBase64String(salt.Concat(hash).ToArray());
        }

        private bool VerifyPassword(string password, string hashedPassword)
        {
            var bytes = Convert.FromBase64String(hashedPassword);
            var salt = bytes.Take(16).ToArray();
            var storedHash = bytes.Skip(16).ToArray();
            var inputHash = Rfc2898DeriveBytes.Pbkdf2(password, salt, 10000, HashAlgorithmName.SHA256, 32);
            return CryptographicOperations.FixedTimeEquals(storedHash, inputHash);
        }



    }
}
