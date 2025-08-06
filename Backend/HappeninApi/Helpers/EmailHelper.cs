using MailKit.Net.Smtp;
using MimeKit;

namespace HappeninApi.Helpers
{
    /// <summary>
    /// Provides helper methods for sending emails such as OTPs and registration tickets.
    /// </summary>
    public class EmailHelper
    {
        private readonly IConfiguration _config;

        /// <summary>
        /// Initializes a new instance of the <see cref="EmailHelper"/> class.
        /// </summary>
        /// <param name="config">Application configuration for email credentials.</param>
        public EmailHelper(IConfiguration config)
        {
            _config = config;
        }

        /// <summary>
        /// Sends an OTP email to the specified recipient.
        /// </summary>
        /// <param name="toEmail">Recipient's email address.</param>
        /// <param name="otpCode">OTP code to send.</param>
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

        /// <summary>
        /// Sends a registration ticket email with an optional PDF attachment.
        /// </summary>
        /// <param name="toEmail">Recipient's email address.</param>
        /// <param name="userName">Name of the user.</param>
        /// <param name="eventName">Name of the event.</param>
        /// <param name="pdfAttachment">PDF ticket attachment (optional).</param>
        public async Task SendRegistrationTicketAsync(string toEmail, string userName, string eventName, string? pdfBase64 = null)
        {
            var message = new MimeMessage();
            message.From.Add(MailboxAddress.Parse(_config["Email:User"]));
            message.To.Add(MailboxAddress.Parse(toEmail));
            message.Subject = $"🎫 Your Ticket for {eventName}";

            var builder = new BodyBuilder
            {
                HtmlBody = $"<h2>Hello {userName},</h2><p>You are registered for <strong>{eventName}</strong>.</p><p>Please find your ticket attached.</p>"
            };

            if (!string.IsNullOrEmpty(pdfBase64))
            {
                try
                {
                    // Convert base64 string to byte array
                    byte[] pdfBytes = Convert.FromBase64String(pdfBase64);
                    builder.Attachments.Add("ticket.pdf", pdfBytes, new ContentType("application", "pdf"));
                }
                catch (Exception ex)
                {
                    // Log the error but continue sending email without attachment
                    Console.WriteLine($"Error processing PDF attachment: {ex.Message}");
                }
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
