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
            var message = new MimeMessage();
            message.From.Add(MailboxAddress.Parse(_config["Email:User"]));
            message.To.Add(MailboxAddress.Parse(toEmail));
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

        public async Task SendRegistrationTicketAsync(string toEmail, string userName, string eventName, byte[]? pdfAttachment = null)
        {
            var message = new MimeMessage();
            message.From.Add(MailboxAddress.Parse(_config["Email:User"]));
            message.To.Add(MailboxAddress.Parse(toEmail));
            message.Subject = $"🎫 Your Ticket for {eventName}";

            var builder = new BodyBuilder
            {
                HtmlBody = $"<h2>Hello {userName},</h2><p>You are registered for <strong>{eventName}</strong>.</p><p>Please find your ticket attached.</p>"
            };

            if (pdfAttachment != null)
            {
                builder.Attachments.Add("ticket.pdf", pdfAttachment, new ContentType("application", "pdf"));
            }

            message.Body = builder.ToMessageBody();

            using var client = new SmtpClient();
            await client.ConnectAsync("smtp.gmail.com", 587, false);
            await client.AuthenticateAsync(_config["Email:User"], _config["Email:Pass"]);
            await client.SendAsync(message);
            await client.DisconnectAsync(true);
        }
    }
}
