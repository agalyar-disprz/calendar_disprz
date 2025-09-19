using System;
using System.Security.Claims;
using System.Threading.Tasks;
using DisprzTraining.Controllers;
using DisprzTraining.DTOs;
using DisprzTraining.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using Xunit;
using System.Collections.Generic;

namespace DisprzTraining.Tests.Controllers
{
    public class AuthControllerTests
    {
        private readonly Mock<IAuthService> _mockAuthService;
        private readonly AuthController _controller;

        public AuthControllerTests()
        {
            _mockAuthService = new Mock<IAuthService>();
            _controller = new AuthController(_mockAuthService.Object);
        }

        #region Register Tests

        [Fact]
        public async Task Register_WithValidData_ReturnsOkResult()
        {
            // Arrange
            var registerDto = new RegisterDTO
            {
                Username = "testuser",
                Email = "test@example.com",
                Password = "Password123!"
            };

            var userDto = new UserDTO
            {
                Id = 1,
                Username = "testuser",
                Email = "test@example.com",
                Token = "test-token"
            };

            _mockAuthService.Setup(service => service.Register(It.IsAny<RegisterDTO>()))
                .ReturnsAsync(userDto);

            // Act
            var result = await _controller.Register(registerDto);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var returnedUser = Assert.IsType<UserDTO>(okResult.Value);
            
            Assert.Equal(userDto.Id, returnedUser.Id);
            Assert.Equal(userDto.Username, returnedUser.Username);
            Assert.Equal(userDto.Email, returnedUser.Email);
            Assert.Equal(userDto.Token, returnedUser.Token);
            
            _mockAuthService.Verify(service => service.Register(It.IsAny<RegisterDTO>()), Times.Once);
        }

        [Fact]
        public async Task Register_WhenServiceThrowsException_ReturnsBadRequest()
        {
            // Arrange
            var registerDto = new RegisterDTO
            {
                Username = "testuser",
                Email = "test@example.com",
                Password = "Password123!"
            };

            var errorMessage = "Username already exists";
            _mockAuthService.Setup(service => service.Register(It.IsAny<RegisterDTO>()))
                .ThrowsAsync(new Exception(errorMessage));

            // Act
            var result = await _controller.Register(registerDto);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result.Result);
            // Access the error message properly
            var errorObj = Assert.IsType<Dictionary<string, string>>(badRequestResult.Value);
            Assert.True(errorObj.ContainsKey("error"));
            Assert.Equal(errorMessage, errorObj["error"]);
            
            _mockAuthService.Verify(service => service.Register(It.IsAny<RegisterDTO>()), Times.Once);
        }

        #endregion

        #region Login Tests

        [Fact]
        public async Task Login_WithValidCredentials_ReturnsOkResult()
        {
            // Arrange
            var loginDto = new LoginDTO
            {
                UsernameOrEmail = "test@example.com", // Adjust based on your actual DTO structure
                Password = "Password123!"
            };

            var userDto = new UserDTO
            {
                Id = 1,
                Username = "testuser",
                Email = "test@example.com",
                Token = "test-token"
            };

            _mockAuthService.Setup(service => service.Login(It.IsAny<LoginDTO>()))
                .ReturnsAsync(userDto);

            // Act
            var result = await _controller.Login(loginDto);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var returnedUser = Assert.IsType<UserDTO>(okResult.Value);
            
            Assert.Equal(userDto.Id, returnedUser.Id);
            Assert.Equal(userDto.Username, returnedUser.Username);
            Assert.Equal(userDto.Email, returnedUser.Email);
            Assert.Equal(userDto.Token, returnedUser.Token);
            
            _mockAuthService.Verify(service => service.Login(It.IsAny<LoginDTO>()), Times.Once);
        }

        [Fact]
        public async Task Login_WithInvalidCredentials_ReturnsBadRequest()
        {
            // Arrange
            var loginDto = new LoginDTO
            {
                UsernameOrEmail = "test@example.com", // Adjust based on your actual DTO structure
                Password = "WrongPassword"
            };

            var errorMessage = "Invalid username or password";
            _mockAuthService.Setup(service => service.Login(It.IsAny<LoginDTO>()))
                .ThrowsAsync(new Exception(errorMessage));

            // Act
            var result = await _controller.Login(loginDto);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result.Result);
            // Access the error message properly
            var errorObj = Assert.IsType<Dictionary<string, string>>(badRequestResult.Value);
            Assert.True(errorObj.ContainsKey("error"));
            Assert.Equal(errorMessage, errorObj["error"]);
            
            _mockAuthService.Verify(service => service.Login(It.IsAny<LoginDTO>()), Times.Once);
        }

        #endregion

        #region GetCurrentUser Tests

        [Fact]
        public async Task GetCurrentUser_WithAuthenticatedUser_ReturnsOkResult()
        {
            // Arrange
            int userId = 1;
            
            // Setup claims for the authenticated user
            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, userId.ToString())
            };
            var identity = new ClaimsIdentity(claims, "Test");
            var claimsPrincipal = new ClaimsPrincipal(identity);
            
            // Set the user on the controller's context
            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = claimsPrincipal }
            };

            var userDto = new UserDTO
            {
                Id = userId,
                Username = "testuser",
                Email = "test@example.com",
                Token = "test-token"
            };

            _mockAuthService.Setup(service => service.GetCurrentUser(userId))
                .ReturnsAsync(userDto);

            // Act
            var result = await _controller.GetCurrentUser();

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var returnedUser = Assert.IsType<UserDTO>(okResult.Value);
            
            Assert.Equal(userDto.Id, returnedUser.Id);
            Assert.Equal(userDto.Username, returnedUser.Username);
            Assert.Equal(userDto.Email, returnedUser.Email);
            Assert.Equal(userDto.Token, returnedUser.Token);
            
            _mockAuthService.Verify(service => service.GetCurrentUser(userId), Times.Once);
        }

        [Fact]
        public async Task GetCurrentUser_WhenServiceThrowsException_ReturnsBadRequest()
        {
            // Arrange
            int userId = 1;
            
            // Setup claims for the authenticated user
            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, userId.ToString())
            };
            var identity = new ClaimsIdentity(claims, "Test");
            var claimsPrincipal = new ClaimsPrincipal(identity);
            
            // Set the user on the controller's context
            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = claimsPrincipal }
            };

            var errorMessage = "User not found";
            _mockAuthService.Setup(service => service.GetCurrentUser(userId))
                .ThrowsAsync(new Exception(errorMessage));

            // Act
            var result = await _controller.GetCurrentUser();

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result.Result);
            // Access the error message properly
            var errorObj = Assert.IsType<Dictionary<string, string>>(badRequestResult.Value);
            Assert.True(errorObj.ContainsKey("error"));
            Assert.Equal(errorMessage, errorObj["error"]);
            
            _mockAuthService.Verify(service => service.GetCurrentUser(userId), Times.Once);
        }

        [Fact]
        public async Task GetCurrentUser_WithMissingClaim_ReturnsBadRequest()
        {
            // Arrange
            // Setup claims without the NameIdentifier claim
            var identity = new ClaimsIdentity(Array.Empty<Claim>(), "Test");
            var claimsPrincipal = new ClaimsPrincipal(identity);
            
            // Set the user on the controller's context
            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = claimsPrincipal }
            };

            // Act
            var result = await _controller.GetCurrentUser();

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result.Result);
            // Access the error message properly
            var errorObj = Assert.IsType<Dictionary<string, string>>(badRequestResult.Value);
            Assert.True(errorObj.ContainsKey("error"));
            // We don't check the exact error message here since it's a null reference exception
            Assert.NotNull(errorObj["error"]);
        }

        #endregion
    }
}
