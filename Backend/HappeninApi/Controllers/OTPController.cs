using HappeninApi.DTOs;
using HappeninApi.Helpers;
using HappeninApi.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using MongoDB.Driver;
using System;

namespace HappeninApi.Controllers
{
    /// <summary>
    /// Controller for OTP (One-Time Password) operations, including sending and verifying OTPs for user authentication.
    /// </summary>
    [ApiController]
    [Route("api/users")]
    public class OTPController : ControllerBase
    {
        private readonly IMongoCollection<User> _users;
        private readonly EmailHelper _emailHelper;
        private readonly IConfiguration _config;

        public OTPController(IMongoDatabase db, IConfiguration config)
        {
            _users = db.GetCollection<User>("Users");
            _emailHelper = new EmailHelper(config);
            _config = config;
        }

        /// <summary>
        /// Sends an OTP to the user's email for authentication.
        /// </summary>
        [HttpPost("send-otp")]
        public async Task<IActionResult> SendOtp([FromBody] SendOtpDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Email))
                return BadRequest("Email is required.");

            var user = await _users.Find(u => u.Email == dto.Email).FirstOrDefaultAsync();
            if (user == null)
                return NotFound("User not found.");

            var otpCode = new Random().Next(100000, 999999).ToString();
            var expiry = DateTime.UtcNow.AddMinutes(5);

            user.Otp = new Otp
            {
                Code = otpCode,
                ExpiresAt = expiry
            };

            await _users.ReplaceOneAsync(u => u.Id == user.Id, user);
            await _emailHelper.SendOtpEmailAsync(dto.Email, otpCode);

            return Ok(new { message = "OTP sent to email." });
        }

        /// <summary>
        /// Verifies the OTP entered by the user and returns a JWT token if successful.
        /// </summary>
        [HttpPost("verify-otp")]
        public async Task<IActionResult> VerifyOtp([FromBody] VerifyOtpDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Email) || string.IsNullOrWhiteSpace(dto.Otp))
                return BadRequest("Email and OTP are required.");

            var user = await _users.Find(u => u.Email == dto.Email).FirstOrDefaultAsync();
            if (user == null || user.Otp == null)
                return BadRequest("OTP not found or not requested.");

            if (user.Otp.Code != dto.Otp || user.Otp.ExpiresAt < DateTime.UtcNow)
                return BadRequest("Invalid or expired OTP.");

            user.Otp = null;
            await _users.ReplaceOneAsync(u => u.Id == user.Id, user);

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
    }
}
