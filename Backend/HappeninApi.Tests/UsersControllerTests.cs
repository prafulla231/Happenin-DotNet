// Required libraries for testing, mocking, MongoDB, and ASP.NET Core MVC
using Xunit;
using Moq;
using MongoDB.Driver;
using Microsoft.Extensions.Configuration;
using HappeninApi.Controllers;
using HappeninApi.DTOs;
using HappeninApi.Models;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Threading;
using System.Linq.Expressions;

namespace HappeninApi.Tests
{
    // This class contains unit tests for the UsersController
    public class UsersControllerTests
    {
        // Mocked dependencies used in the controller
        private readonly Mock<IMongoCollection<User>> _mockCollection; // Mock of the Users MongoDB collection
        private readonly Mock<IMongoDatabase> _mockDatabase;           // Mock of the MongoDB database
        private readonly Mock<IConfiguration> _mockConfig;             // Mock of configuration (e.g., for reading secrets/env vars)

        // Instance of the UsersController under test
        private readonly UsersController _controller;

        // Constructor sets up the mocked dependencies and controller instance
        public UsersControllerTests()
        {
            // Initialize mock objects
            _mockCollection = new Mock<IMongoCollection<User>>();
            _mockDatabase = new Mock<IMongoDatabase>();
            _mockConfig = new Mock<IConfiguration>();

            // Configure the mocked database to return the mocked collection when 'Users' is requested
            _mockDatabase
                .Setup(db => db.GetCollection<User>("Users", null))
                .Returns(_mockCollection.Object);

            // Setup JWT configuration for token generation
            _mockConfig.Setup(c => c["Jwt:Key"]).Returns("your-super-secret-jwt-key-that-is-at-least-256-bits-long");
            _mockConfig.Setup(c => c["Jwt:Issuer"]).Returns("HappeninApi");
            _mockConfig.Setup(c => c["Jwt:Audience"]).Returns("HappeninApiUsers");

            // Create the UsersController instance using mocked dependencies
            _controller = new UsersController(_mockDatabase.Object, _mockConfig.Object);
        }

        // Unit test: Verifies that the Register method returns a BadRequest if the email is invalid
        [Fact]
        public async Task Register_Returns_BadRequest_If_Invalid_Email()
        {
            // Arrange: Create a DTO with an invalid email format
            var dto = new RegisterDto
            {
                Name = "Rajat Mahajan",
                Email = "invalid-email", // Invalid email format (missing @ and domain)
                Phone = "9822964723",
                Password = "Password123",
                Role = "User"
            };

            // Act: Call the Register method with the invalid DTO
            var result = await _controller.Register(dto);

            // Assert: Verify the result is a BadRequest with the expected error message
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result); // Assert the result is a 400 BadRequest
            Assert.Equal("Invalid email format.", badRequestResult.Value);        // Assert the correct error message is returned
        }

        [Fact]
        public async Task Register_Returns_BadRequest_If_Invalid_Phone()
        {
            // Arrange
            var dto = new RegisterDto
            {
                Name = "Rajat Mahajan",
                Email = "rajat@mail.com",
                Phone = "123", // Invalid phone (not 10 digits)
                Password = "Password123",
                Role = "User"
            };

            // Act
            var result = await _controller.Register(dto);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
            Assert.Equal("Phone number must be exactly 10 digits.", badRequestResult.Value);
        }

        [Fact]
        public async Task Register_Returns_BadRequest_If_Password_Too_Short()
        {
            // Arrange
            var dto = new RegisterDto
            {
                Name = "Rajat Mahajan",
                Email = "rajat@mail.com",
                Phone = "9822964723",
                Password = "123", // Password too short
                Role = "User"
            };

            // Act
            var result = await _controller.Register(dto);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
            Assert.Equal("Password must be at least 6 characters long.", badRequestResult.Value);
        }

        [Fact]
        public async Task Register_Returns_BadRequest_If_Required_Fields_Missing()
        {
            // Arrange
            var dto = new RegisterDto
            {
                Name = "", // Empty name
                Email = "rajat@mail.com",
                Phone = "9822964723",
                Password = "Password123",
                Role = "User"
            };

            // Act
            var result = await _controller.Register(dto);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
            Assert.Equal("All fields are required.", badRequestResult.Value);
        }

        [Fact]
        public async Task Register_Returns_Conflict_If_Email_Already_Exists()
        {
            // Arrange
            var dto = new RegisterDto
            {
                Name = "Rajat Mahajan",
                Email = "rajat@mail.com",
                Phone = "9822964723",
                Password = "Password123",
                Role = "User"
            };

            // Setup mock to return true for email existence check
            var emailFindFluent = new Mock<IFindFluent<User, User>>();
            emailFindFluent.Setup(x => x.AnyAsync(It.IsAny<CancellationToken>())).ReturnsAsync(true);

            _mockCollection.Setup(x => x.Find(It.IsAny<Expression<Func<User, bool>>>()))
                          .Returns(emailFindFluent.Object);

            // Act
            var result = await _controller.Register(dto);

            // Assert
            var conflictResult = Assert.IsType<ConflictObjectResult>(result);
            Assert.Equal("Email already in use.", conflictResult.Value);
        }

        [Fact]
        public async Task Register_Returns_Conflict_If_Phone_Already_Exists()
        {
            // Arrange
            var dto = new RegisterDto
            {
                Name = "Rajat Mahajan",
                Email = "rajat@mail.com",
                Phone = "9822964723",
                Password = "Password123",
                Role = "User"
            };

            // Setup mock to return false for email check but true for phone check
            var emailFindFluent = new Mock<IFindFluent<User, User>>();
            emailFindFluent.Setup(x => x.AnyAsync(It.IsAny<CancellationToken>())).ReturnsAsync(false);

            var phoneFindFluent = new Mock<IFindFluent<User, User>>();
            phoneFindFluent.Setup(x => x.AnyAsync(It.IsAny<CancellationToken>())).ReturnsAsync(true);

            _mockCollection.SetupSequence(x => x.Find(It.IsAny<Expression<Func<User, bool>>>()))
                          .Returns(emailFindFluent.Object)
                          .Returns(phoneFindFluent.Object);

            // Act
            var result = await _controller.Register(dto);

            // Assert
            var conflictResult = Assert.IsType<ConflictObjectResult>(result);
            Assert.Equal("Phone number already in use.", conflictResult.Value);
        }

        [Fact]
        public async Task Register_Returns_Created_If_Valid_Data()
        {
            // Arrange
            var dto = new RegisterDto
            {
                Name = "Rajat Mahajan",
                Email = "rajat@mail.com",
                Phone = "9822964723",
                Password = "Password123",
                Role = "User"
            };

            // Setup mocks to return false for both email and phone existence checks
            var emailFindFluent = new Mock<IFindFluent<User, User>>();
            emailFindFluent.Setup(x => x.AnyAsync(It.IsAny<CancellationToken>())).ReturnsAsync(false);

            var phoneFindFluent = new Mock<IFindFluent<User, User>>();
            phoneFindFluent.Setup(x => x.AnyAsync(It.IsAny<CancellationToken>())).ReturnsAsync(false);

            _mockCollection.SetupSequence(x => x.Find(It.IsAny<Expression<Func<User, bool>>>()))
                          .Returns(emailFindFluent.Object)
                          .Returns(phoneFindFluent.Object);

            _mockCollection.Setup(x => x.InsertOneAsync(It.IsAny<User>(), null, It.IsAny<CancellationToken>()))
                          .Returns(Task.CompletedTask);

            // Act
            var result = await _controller.Register(dto);

            // Assert
            var createdResult = Assert.IsType<CreatedResult>(result);
            Assert.Equal("/users/register", createdResult.Location);

            // Verify InsertOneAsync was called
            _mockCollection.Verify(x => x.InsertOneAsync(It.Is<User>(u =>
                u.Name == dto.Name &&
                u.Email == dto.Email &&
                u.Phone == dto.Phone &&
                u.Role == UserRole.User), null, It.IsAny<CancellationToken>()), Times.Once);
        }

        [Fact]
        public async Task Register_Sets_Admin_Role_Correctly()
        {
            // Arrange
            var dto = new RegisterDto
            {
                Name = "Admin User",
                Email = "admin@mail.com",
                Phone = "9822964724",
                Password = "Password123",
                Role = "Admin"
            };

            // Setup mocks
            var emailFindFluent = new Mock<IFindFluent<User, User>>();
            emailFindFluent.Setup(x => x.AnyAsync(It.IsAny<CancellationToken>())).ReturnsAsync(false);

            var phoneFindFluent = new Mock<IFindFluent<User, User>>();
            phoneFindFluent.Setup(x => x.AnyAsync(It.IsAny<CancellationToken>())).ReturnsAsync(false);

            _mockCollection.SetupSequence(x => x.Find(It.IsAny<Expression<Func<User, bool>>>()))
                          .Returns(emailFindFluent.Object)
                          .Returns(phoneFindFluent.Object);

            _mockCollection.Setup(x => x.InsertOneAsync(It.IsAny<User>(), null, It.IsAny<CancellationToken>()))
                          .Returns(Task.CompletedTask);

            // Act
            var result = await _controller.Register(dto);

            // Assert
            var createdResult = Assert.IsType<CreatedResult>(result);

            // Verify InsertOneAsync was called with Admin role
            _mockCollection.Verify(x => x.InsertOneAsync(It.Is<User>(u =>
                u.Role == UserRole.Admin), null, It.IsAny<CancellationToken>()), Times.Once);
        }

        [Fact]
        public async Task Login_Invalid_Credentials_Returns_Unauthorized()
        {
            // Arrange
            var loginDto = new LoginDto
            {
                Email = "rajat@mail.com",
                Password = "wrongpassword"
            };

            var mockFindFluent = new Mock<IFindFluent<User, User>>();
            mockFindFluent.Setup(x => x.FirstOrDefaultAsync(It.IsAny<CancellationToken>()))
                         .ReturnsAsync((User?)null);

            _mockCollection.Setup(x => x.Find(It.IsAny<Expression<Func<User, bool>>>()))
                          .Returns(mockFindFluent.Object);

            // Act
            var result = await _controller.Login(loginDto);

            // Assert
            var unauthorizedResult = Assert.IsType<UnauthorizedObjectResult>(result);
            Assert.Equal("Invalid email or password.", unauthorizedResult.Value);
        }

        [Fact]
        public async Task Login_Valid_Credentials_Returns_Ok_With_Token()
        {
            // Arrange
            var loginDto = new LoginDto
            {
                Email = "rajat@mail.com",
                Password = "Password123"
            };

            // Create a user with hashed password (simulating what would be stored in DB)
            var user = new User
            {
                Id = Guid.NewGuid(),
                Name = "Rajat Mahajan",
                Email = "rajat@mail.com",
                Phone = "9822964723",
                Role = UserRole.User,
                Password = "" // Will be set below
            };

            // We need to create a realistic hashed password for testing
            // Using the same hashing logic as the controller
            var password = "Password123";
            var salt = new byte[] { 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16 };
            var hash = System.Security.Cryptography.Rfc2898DeriveBytes.Pbkdf2(password, salt, 10000, System.Security.Cryptography.HashAlgorithmName.SHA256, 32);
            user.Password = Convert.ToBase64String(salt.Concat(hash).ToArray());

            var mockFindFluent = new Mock<IFindFluent<User, User>>();
            mockFindFluent.Setup(x => x.FirstOrDefaultAsync(It.IsAny<CancellationToken>()))
                         .ReturnsAsync(user);

            _mockCollection.Setup(x => x.Find(It.IsAny<Expression<Func<User, bool>>>()))
                          .Returns(mockFindFluent.Object);

            // Act
            var result = await _controller.Login(loginDto);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = okResult.Value;

            // Use reflection to check the anonymous object properties
            var messageProperty = response?.GetType().GetProperty("message");
            var tokenProperty = response?.GetType().GetProperty("token");
            var userProperty = response?.GetType().GetProperty("user");

            Assert.NotNull(messageProperty);
            Assert.NotNull(tokenProperty);
            Assert.NotNull(userProperty);

            Assert.Equal("Login successful", messageProperty?.GetValue(response));
            Assert.NotNull(tokenProperty?.GetValue(response)); // Token should not be null
        }

        [Fact]
        public async Task Login_User_Exists_But_Wrong_Password_Returns_Unauthorized()
        {
            // Arrange
            var loginDto = new LoginDto
            {
                Email = "rajat@mail.com",
                Password = "WrongPassword123"
            };

            var user = new User
            {
                Id = Guid.NewGuid(),
                Name = "Rajat Mahajan",
                Email = "rajat@mail.com",
                Phone = "9822964723",
                Role = UserRole.User,
                Password = "" // Will be set below
            };

            // Hash a different password than what's being tested
            var correctPassword = "Password123";
            var salt = new byte[] { 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16 };
            var hash = System.Security.Cryptography.Rfc2898DeriveBytes.Pbkdf2(correctPassword, salt, 10000, System.Security.Cryptography.HashAlgorithmName.SHA256, 32);
            user.Password = Convert.ToBase64String(salt.Concat(hash).ToArray());

            var mockFindFluent = new Mock<IFindFluent<User, User>>();
            mockFindFluent.Setup(x => x.FirstOrDefaultAsync(It.IsAny<CancellationToken>()))
                         .ReturnsAsync(user);

            _mockCollection.Setup(x => x.Find(It.IsAny<Expression<Func<User, bool>>>()))
                          .Returns(mockFindFluent.Object);

            // Act
            var result = await _controller.Login(loginDto);

            // Assert
            var unauthorizedResult = Assert.IsType<UnauthorizedObjectResult>(result);
            Assert.Equal("Invalid email or password.", unauthorizedResult.Value);
        }

        [Fact]
        public async Task Login_Admin_User_Returns_Ok_With_Admin_Role()
        {
            // Arrange
            var loginDto = new LoginDto
            {
                Email = "admin@mail.com",
                Password = "AdminPassword123"
            };

            var adminUser = new User
            {
                Id = Guid.NewGuid(),
                Name = "Admin User",
                Email = "admin@mail.com",
                Phone = "9822964724",
                Role = UserRole.Admin,
                Password = "" // Will be set below
            };

            // Hash the password
            var password = "AdminPassword123";
            var salt = new byte[] { 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16 };
            var hash = System.Security.Cryptography.Rfc2898DeriveBytes.Pbkdf2(password, salt, 10000, System.Security.Cryptography.HashAlgorithmName.SHA256, 32);
            adminUser.Password = Convert.ToBase64String(salt.Concat(hash).ToArray());

            var mockFindFluent = new Mock<IFindFluent<User, User>>();
            mockFindFluent.Setup(x => x.FirstOrDefaultAsync(It.IsAny<CancellationToken>()))
                         .ReturnsAsync(adminUser);

            _mockCollection.Setup(x => x.Find(It.IsAny<Expression<Func<User, bool>>>()))
                          .Returns(mockFindFluent.Object);

            // Act
            var result = await _controller.Login(loginDto);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = okResult.Value;

            var userProperty = response?.GetType().GetProperty("user");
            var userData = userProperty?.GetValue(response);
            var roleProperty = userData?.GetType().GetProperty("Role");

            Assert.Equal(UserRole.Admin, roleProperty?.GetValue(userData));
        }

        [Theory]
        [InlineData("")]
        [InlineData(" ")]
        public async Task Register_Returns_BadRequest_For_Empty_Name(string name)
        {
            // Arrange
            var dto = new RegisterDto
            {
                Name = name,
                Email = "rajat@mail.com",
                Phone = "9822964723",
                Password = "Password123",
                Role = "User"
            };

            // Act
            var result = await _controller.Register(dto);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
            Assert.Equal("All fields are required.", badRequestResult.Value);
        }

        [Fact]
        public async Task Register_Returns_BadRequest_For_Null_Name()
        {
            // Arrange
            var dto = new RegisterDto
            {
                Name = null!,
                Email = "rajat@mail.com",
                Phone = "9822964723",
                Password = "Password123",
                Role = "User"
            };

            // Act
            var result = await _controller.Register(dto);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
            Assert.Equal("All fields are required.", badRequestResult.Value);
        }

        [Theory]
        [InlineData("invalid.email")]
        [InlineData("@invalid.com")]
        [InlineData("invalid@")]
        [InlineData("invalid@.com")]
        public async Task Register_Returns_BadRequest_For_Various_Invalid_Emails(string email)
        {
            // Arrange
            var dto = new RegisterDto
            {
                Name = "Test User",
                Email = email,
                Phone = "9822964723",
                Password = "Password123",
                Role = "User"
            };

            // Act
            var result = await _controller.Register(dto);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
            Assert.Equal("Invalid email format.", badRequestResult.Value);
        }

        [Theory]
        [InlineData("123456789")]   // 9 digits
        [InlineData("12345678901")] // 11 digits
        [InlineData("abcd123456")]  // Contains letters
        [InlineData("")]            // Empty
        public async Task Register_Returns_BadRequest_For_Invalid_Phone_Numbers(string phone)
        {
            // Arrange
            var dto = new RegisterDto
            {
                Name = "Test User",
                Email = "test@mail.com",
                Phone = phone,
                Password = "Password123",
                Role = "User"
            };

            // Act
            var result = await _controller.Register(dto);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
            if (string.IsNullOrWhiteSpace(phone))
            {
                Assert.Equal("All fields are required.", badRequestResult.Value);
            }
            else
            {
                Assert.Equal("Phone number must be exactly 10 digits.", badRequestResult.Value);
            }
        }

        [Fact]
        public async Task Register_Defaults_To_User_Role_For_Invalid_Role()
        {
            // Arrange
            var dto = new RegisterDto
            {
                Name = "Test User",
                Email = "test@mail.com",
                Phone = "9822964723",
                Password = "Password123",
                Role = "InvalidRole"
            };

            // Setup mocks
            var emailFindFluent = new Mock<IFindFluent<User, User>>();
            emailFindFluent.Setup(x => x.AnyAsync(It.IsAny<CancellationToken>())).ReturnsAsync(false);

            var phoneFindFluent = new Mock<IFindFluent<User, User>>();
            phoneFindFluent.Setup(x => x.AnyAsync(It.IsAny<CancellationToken>())).ReturnsAsync(false);

            _mockCollection.SetupSequence(x => x.Find(It.IsAny<Expression<Func<User, bool>>>()))
                          .Returns(emailFindFluent.Object)
                          .Returns(phoneFindFluent.Object);

            _mockCollection.Setup(x => x.InsertOneAsync(It.IsAny<User>(), null, It.IsAny<CancellationToken>()))
                          .Returns(Task.CompletedTask);

            // Act
            var result = await _controller.Register(dto);

            // Assert
            var createdResult = Assert.IsType<CreatedResult>(result);

            // Verify InsertOneAsync was called with User role (default)
            _mockCollection.Verify(x => x.InsertOneAsync(It.Is<User>(u =>
                u.Role == UserRole.User), null, It.IsAny<CancellationToken>()), Times.Once);
        }
    }
}