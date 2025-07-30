using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using HappeninApi.Models;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace HappeninApi.Helpers
{

    /// <summary>
    /// Provides helper methods for generating JWT tokens for user authentication.
    /// </summary>
    public static class JwtHelper
    {

        /// <summary>
        /// Generates a JWT token for the specified user.
        /// </summary>
        /// <param name="user">The user for whom to generate the token.</param>
        /// <param name="config">Application configuration containing JWT settings.</param>
        /// <returns>A JWT token string.</returns>
        /// <exception cref="ArgumentNullException">Thrown if JWT key is missing in configuration.</exception>
        public static string GenerateJwtToken(User user, IConfiguration config)
        {
            var jwtKey = config["Jwt:Key"] ?? throw new ArgumentNullException("Jwt:Key", "JWT Key is missing in configuration");
            var jwtIssuer = config["Jwt:Issuer"];
            var jwtAudience = config["Jwt:Audience"];

            var claims = new[]
{
    new Claim("userId", user.Id.ToString()),
    new Claim("email", user.Email),
    new Claim("name", user.Name),
    new Claim("role", user.Role.ToString())
};

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: jwtIssuer,
                audience: jwtAudience,
                claims: claims,
                expires: DateTime.UtcNow.AddHours(1),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}
