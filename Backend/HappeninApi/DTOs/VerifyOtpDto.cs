namespace HappeninApi.DTOs
{
    public class VerifyOtpDto
    {
        public required string Email { get; set; }
        public required string Otp { get; set; }
    }
}
