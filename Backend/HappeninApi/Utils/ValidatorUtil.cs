using System.Text.RegularExpressions;

namespace HappeninApi.Utils
{
    public static class ValidatorUtil
    {
        public static bool IsValidEmail(string email)
        {
            if (string.IsNullOrWhiteSpace(email))
                return false;

            // Basic email pattern
            var pattern = @"^[^@\s]+@[^@\s]+\.[^@\s]+$";
            return Regex.IsMatch(email, pattern);
        }

        public static bool IsValidPhone(string phone)
        {
            if (string.IsNullOrWhiteSpace(phone))
                return false;

            // Exactly 10 digits
            var pattern = @"^\d{10}$";
            return Regex.IsMatch(phone, pattern);
        }
    }
}
