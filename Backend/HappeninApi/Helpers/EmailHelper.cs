using MailKit.Net.Smtp;
using MimeKit;

namespace HappeninApi.Helpers
{
    public class EmailHelper
    {
        private readonly IConfiguration _config;

        public EmailHelper(IConfiguration config)
        {
            _config = config;
        }

        public async Task SendOtpEmailAsync(string toEmail, string otpCode)
        {
            if (string.IsNullOrWhiteSpace(toEmail))
                throw new ArgumentException("Recipient email cannot be null or empty", nameof(toEmail));

            var message = new MimeMessage();
            message.From.Add(MailboxAddress.Parse(_config["Email:User"]));
            message.To.Add(MailboxAddress.Parse(toEmail)); // error if toEmail is null
            message.Subject = "Your Login OTP";

            message.Body = new TextPart("html")
            {
                Text = $"<h2>Your OTP is: {otpCode}</h2><p>Valid for 5 minutes.</p>"
            };

            using var client = new SmtpClient();
            await client.ConnectAsync("smtp.gmail.com", 587, false);
            await client.AuthenticateAsync(_config["Email:User"], _config["Email:Pass"]);
            await client.SendAsync(message);
            await client.DisconnectAsync(true);
        }

    }
}
