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
    public class UsersControllerTests
    {
        private readonly Mock<IMongoCollection<User>> _mockCollection;
        private readonly Mock<IMongoDatabase> _mockDatabase;
        private readonly Mock<IConfiguration> _mockConfig;
        private readonly UsersController _controller;

        public UsersControllerTests()
        {
            _mockCollection = new Mock<IMongoCollection<User>>();
            _mockDatabase = new Mock<IMongoDatabase>();
            _mockConfig = new Mock<IConfiguration>();

            _mockDatabase
                .Setup(db => db.GetCollection<User>("Users", null))
                .Returns(_mockCollection.Object);

            _controller = new UsersController(_mockDatabase.Object, _mockConfig.Object);
        }

        [Fact]
        public async Task Register_Returns_BadRequest_If_Invalid_Email()
        {
            // Arrange
            var dto = new RegisterDto
            {
                Name = "John",
                Email = "invalid-email",
                Phone = "1234567890",
                Password = "securePass123",
                Role = "User"
            };

            // Act
            var result = await _controller.Register(dto);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
            Assert.Equal("Invalid email format.", badRequestResult.Value);
        }

    }
}
