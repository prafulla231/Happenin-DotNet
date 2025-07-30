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
        public async Task Login_Invalid_Credentials_Returns_Unauthorized()
        {
            // Arrange
            var loginDto = new LoginDto
            {
                Email = "rajat@mail.com",
                Password = "wrongpassword"
            };

            var mockCursor = new Mock<IAsyncCursor<User>>();
            mockCursor.Setup(x => x.MoveNext(It.IsAny<CancellationToken>())).Returns(false);
            mockCursor.Setup(x => x.Current).Returns(new List<User>());

            _mockCollection.Setup(x => x.FindAsync(
                It.IsAny<FilterDefinition<User>>(),
                It.IsAny<FindOptions<User, User>>(),
                It.IsAny<CancellationToken>()))
                .ReturnsAsync(mockCursor.Object);

            _mockDatabase.Setup(db => db.GetCollection<User>("Users", null))
                .Returns(_mockCollection.Object);

            // Act
            var result = await _controller.Login(loginDto);

            // Assert
            var unauthorized = Assert.IsType<UnauthorizedObjectResult>(result);
            Assert.Equal("Invalid email or password.", unauthorized.Value);
        }

    }
}
