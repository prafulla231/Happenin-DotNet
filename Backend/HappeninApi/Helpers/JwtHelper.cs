using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using HappeninApi.Models;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace HappeninApi.Helpers
{
    public static class JwtHelper
    {
        public static string GenerateJwtToken(User user, IConfiguration config)
        {
            var jwtKey = config["Jwt:Key"];
            var jwtIssuer = config["Jwt:Issuer"];
            var jwtAudience = config["Jwt:Audience"];

            var claims = new[]
            {
                new Claim("userId", user.Id.ToString()),
                new Claim(ClaimTypes.Name, user.Name),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Role, user.Role.ToString())

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
