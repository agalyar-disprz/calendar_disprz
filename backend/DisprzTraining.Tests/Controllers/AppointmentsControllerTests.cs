using DisprzTraining.Controllers;
using DisprzTraining.Data;
using DisprzTraining.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.InMemory;

using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Xunit;

namespace DisprzTraining.Tests.Controllers
{
    public class AppointmentsControllerTests : IDisposable
    {
        private readonly AppDbContext _context;
        private readonly AppointmentsController _controller;
        private readonly int _userId = 1;

        public AppointmentsControllerTests()
        {
            // Create options for in-memory database
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            // Create context with in-memory database
            _context = new AppDbContext(options);
            
            // Seed test data
            SeedDatabase();
            
            // Create controller with real context
            _controller = new AppointmentsController(_context);
            
            // Setup user claims
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, _userId.ToString())
            };
            var identity = new ClaimsIdentity(claims, "TestAuthType");
            var claimsPrincipal = new ClaimsPrincipal(identity);

            // Setup controller context
            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = claimsPrincipal }
            };
        }

        private void SeedDatabase()
        {
            // Add test appointments
            _context.Appointments.AddRange(
                new Appointment
                {
                    Id = 1,
                    Title = "Meeting 1",
                    Description = "First meeting",
                    StartTime = new DateTime(2023, 10, 15, 10, 0, 0),
                    EndTime = new DateTime(2023, 10, 15, 11, 0, 0),
                    Location = "Room 101",
                    Attendees = "John, Jane",
                    Type = "Meeting",
                    UserId = _userId
                },
                new Appointment
                {
                    Id = 2,
                    Title = "Meeting 2",
                    Description = "Second meeting",
                    StartTime = new DateTime(2023, 10, 15, 14, 0, 0),
                    EndTime = new DateTime(2023, 10, 15, 15, 0, 0),
                    Location = "Room 102",
                    Attendees = "Alice, Bob",
                    Type = "Meeting",
                    UserId = _userId
                },
                new Appointment
                {
                    Id = 3,
                    Title = "Other User's Meeting",
                    Description = "Not my meeting",
                    StartTime = new DateTime(2023, 10, 15, 16, 0, 0),
                    EndTime = new DateTime(2023, 10, 15, 17, 0, 0),
                    Location = "Room 103",
                    Attendees = "Someone else",
                    Type = "Meeting",
                    UserId = 2 // Different user
                },
                new Appointment
                {
                    Id = 4,
                    Title = "Tomorrow's Meeting",
                    Description = "Meeting on a different day",
                    StartTime = new DateTime(2023, 10, 16, 10, 0, 0),
                    EndTime = new DateTime(2023, 10, 16, 11, 0, 0),
                    Location = "Room 104",
                    Attendees = "Future attendees",
                    Type = "Meeting",
                    UserId = _userId
                }
            );
            _context.SaveChanges();
        }

        #region GetAppointments Tests

        [Fact]
        public async Task GetAppointments_ReturnsOnlyUserAppointments()
        {
            // Act
            var result = await _controller.GetAppointments();

            // Assert
            var actionResult = Assert.IsType<ActionResult<IEnumerable<Appointment>>>(result);
            var appointments = Assert.IsAssignableFrom<List<Appointment>>(actionResult.Value);
            Assert.Equal(3, appointments.Count); // Only user's appointments (3 of them)
            Assert.All(appointments, a => Assert.Equal(_userId, a.UserId));
        }

        [Fact]
        public async Task GetAppointments_WithNoUserIdClaim_ReturnsBadRequest()
        {
            // Arrange - Create controller with no user claims
            var controller = new AppointmentsController(_context);
            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = new ClaimsPrincipal() }
            };

            // Act
            var result = await controller.GetAppointments();

            // Assert
            var actionResult = Assert.IsType<ActionResult<IEnumerable<Appointment>>>(result);
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(actionResult.Result);
            Assert.Equal("User ID not found in token", badRequestResult.Value);
        }

        [Fact]
        public async Task GetAppointments_WithDatabaseError_ReturnsInternalServerError()
        {
            // Arrange - Create a controller with a null context to force an exception
            var controller = new AppointmentsController(null);
            controller.ControllerContext = _controller.ControllerContext;

            // Act
            var result = await controller.GetAppointments();

            // Assert
            var actionResult = Assert.IsType<ActionResult<IEnumerable<Appointment>>>(result);
            var statusCodeResult = Assert.IsType<ObjectResult>(actionResult.Result);
            Assert.Equal(500, statusCodeResult.StatusCode);
            Assert.Contains("Internal server error", statusCodeResult.Value.ToString());
        }

        #endregion

        #region GetAppointmentsForDay Tests

        [Fact]
        public async Task GetAppointmentsForDay_ReturnsAppointmentsForSpecificDay()
        {
            // Arrange
            var date = new DateTime(2023, 10, 15);

            // Act
            var result = await _controller.GetAppointmentsForDay(date);

            // Assert
            var actionResult = Assert.IsType<ActionResult<IEnumerable<Appointment>>>(result);
            var okResult = Assert.IsType<OkObjectResult>(actionResult.Result);
            var appointments = Assert.IsAssignableFrom<List<Appointment>>(okResult.Value);
            Assert.Equal(2, appointments.Count);
            Assert.All(appointments, a => 
            {
                Assert.Equal(_userId, a.UserId);
                Assert.Equal(date.Date, a.StartTime.Date);
            });
        }

        [Fact]
        public async Task GetAppointmentsForDay_WithDifferentDay_ReturnsCorrectAppointments()
        {
            // Arrange
            var date = new DateTime(2023, 10, 16); // Different day

            // Act
            var result = await _controller.GetAppointmentsForDay(date);

            // Assert
            var actionResult = Assert.IsType<ActionResult<IEnumerable<Appointment>>>(result);
            var okResult = Assert.IsType<OkObjectResult>(actionResult.Result);
            var appointments = Assert.IsAssignableFrom<List<Appointment>>(okResult.Value);
            Assert.Single(appointments);
            Assert.Equal("Tomorrow's Meeting", appointments[0].Title);
            Assert.Equal(date.Date, appointments[0].StartTime.Date);
        }

        [Fact]
        public async Task GetAppointmentsForDay_WithNoAppointments_ReturnsEmptyList()
        {
            // Arrange
            var date = new DateTime(2023, 10, 17); // Day with no appointments

            // Act
            var result = await _controller.GetAppointmentsForDay(date);

            // Assert
            var actionResult = Assert.IsType<ActionResult<IEnumerable<Appointment>>>(result);
            var okResult = Assert.IsType<OkObjectResult>(actionResult.Result);
            var appointments = Assert.IsAssignableFrom<List<Appointment>>(okResult.Value);
            Assert.Empty(appointments);
        }

        [Fact]
        public async Task GetAppointmentsForDay_WithNoUserIdClaim_ReturnsBadRequest()
        {
            // Arrange - Create controller with no user claims
            var controller = new AppointmentsController(_context);
            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = new ClaimsPrincipal() }
            };
            var date = new DateTime(2023, 10, 15);

            // Act
            var result = await controller.GetAppointmentsForDay(date);

            // Assert
            var actionResult = Assert.IsType<ActionResult<IEnumerable<Appointment>>>(result);
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(actionResult.Result);
            Assert.Equal("User ID not found in token", badRequestResult.Value);
        }

        #endregion

        #region GetAppointment Tests

        [Fact]
        public async Task GetAppointment_WithValidId_ReturnsAppointment()
        {
            // Act
            var result = await _controller.GetAppointment(1);

            // Assert
            var actionResult = Assert.IsType<ActionResult<Appointment>>(result);
            var appointment = Assert.IsType<Appointment>(actionResult.Value);
            Assert.Equal(1, appointment.Id);
            Assert.Equal("Meeting 1", appointment.Title);
            Assert.Equal(_userId, appointment.UserId);
        }

        [Fact]
        public async Task GetAppointment_WithInvalidId_ReturnsNotFound()
        {
            // Act
            var result = await _controller.GetAppointment(999);

            // Assert
            var actionResult = Assert.IsType<ActionResult<Appointment>>(result);
            var notFoundResult = Assert.IsType<NotFoundObjectResult>(actionResult.Result);
            Assert.Equal("Appointment not found or you don't have permission to view it", notFoundResult.Value);
        }

        [Fact]
        public async Task GetAppointment_WithOtherUsersAppointment_ReturnsNotFound()
        {
            // Act
            var result = await _controller.GetAppointment(3); // ID of other user's appointment

            // Assert
            var actionResult = Assert.IsType<ActionResult<Appointment>>(result);
            var notFoundResult = Assert.IsType<NotFoundObjectResult>(actionResult.Result);
            Assert.Equal("Appointment not found or you don't have permission to view it", notFoundResult.Value);
        }

        [Fact]
        public async Task GetAppointment_WithNoUserIdClaim_ReturnsBadRequest()
        {
            // Arrange - Create controller with no user claims
            var controller = new AppointmentsController(_context);
            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = new ClaimsPrincipal() }
            };

            // Act
            var result = await controller.GetAppointment(1);

            // Assert
            var actionResult = Assert.IsType<ActionResult<Appointment>>(result);
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(actionResult.Result);
            Assert.Equal("User ID not found in token", badRequestResult.Value);
        }

        #endregion

        #region Create Tests

        [Fact]
        public async Task Create_WithValidAppointment_ReturnsCreatedAppointment()
        {
            // Arrange
            var newAppointment = new Appointment
            {
                Title = "New Meeting",
                Description = "New meeting description",
                StartTime = new DateTime(2023, 10, 17, 10, 0, 0),
                EndTime = new DateTime(2023, 10, 17, 11, 0, 0),
                Location = "Room 105",
                Attendees = "New attendees",
                Type = "Meeting"
            };

            // Act
            var result = await _controller.Create(newAppointment);

            // Assert
            var actionResult = Assert.IsType<ActionResult<Appointment>>(result);
            var createdResult = Assert.IsType<CreatedAtActionResult>(actionResult.Result);
            var appointment = Assert.IsType<Appointment>(createdResult.Value);
            
            Assert.Equal(newAppointment.Title, appointment.Title);
            Assert.Equal(newAppointment.Description, appointment.Description);
            Assert.Equal(newAppointment.StartTime, appointment.StartTime);
            Assert.Equal(newAppointment.EndTime, appointment.EndTime);
            Assert.Equal(_userId, appointment.UserId);
            
            // Verify it was added to the database
            var savedAppointment = await _context.Appointments.FindAsync(appointment.Id);
            Assert.NotNull(savedAppointment);
            Assert.Equal(newAppointment.Title, savedAppointment.Title);
        }

        [Fact]
        public async Task Create_WithInvalidTimeRange_ReturnsBadRequest()
        {
            // Arrange
            var invalidAppointment = new Appointment
            {
                Title = "Invalid Meeting",
                Description = "Invalid time range",
                StartTime = new DateTime(2023, 10, 17, 11, 0, 0),
                EndTime = new DateTime(2023, 10, 17, 10, 0, 0), // End before start
                Location = "Room 105",
                Attendees = "Attendees",
                Type = "Meeting"
            };

            // Act
            var result = await _controller.Create(invalidAppointment);

            // Assert
            var actionResult = Assert.IsType<ActionResult<Appointment>>(result);
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(actionResult.Result);
            Assert.Contains("End time must be after start time", badRequestResult.Value.ToString());
        }

        [Fact]
        public async Task Create_WithConflictingAppointment_ReturnsConflict()
        {
            // Arrange
            var conflictingAppointment = new Appointment
            {
                Title = "Conflicting Meeting",
                Description = "This conflicts with an existing meeting",
                StartTime = new DateTime(2023, 10, 15, 10, 30, 0), // Overlaps with Meeting 1
                EndTime = new DateTime(2023, 10, 15, 11, 30, 0),
                Location = "Room 105",
                Attendees = "Attendees",
                Type = "Meeting"
            };

            // Act
            var result = await _controller.Create(conflictingAppointment);

            // Assert
            var actionResult = Assert.IsType<ActionResult<Appointment>>(result);
            var conflictResult = Assert.IsType<ObjectResult>(actionResult.Result);
            Assert.Equal(409, conflictResult.StatusCode);
            Assert.Contains("conflicts with an existing appointment", conflictResult.Value.ToString());
        }

        [Fact]
        public async Task Create_WithNoUserIdClaim_ReturnsBadRequest()
        {
            // Arrange - Create controller with no user claims
            var controller = new AppointmentsController(_context);
            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = new ClaimsPrincipal() }
            };
            
            var newAppointment = new Appointment
            {
                Title = "New Meeting",
                StartTime = new DateTime(2023, 10, 17, 10, 0, 0),
                EndTime = new DateTime(2023, 10, 17, 11, 0, 0)
            };

            // Act
            var result = await controller.Create(newAppointment);

            // Assert
            var actionResult = Assert.IsType<ActionResult<Appointment>>(result);
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(actionResult.Result);
            Assert.Equal("User ID not found in token", badRequestResult.Value);
        }

        #endregion

        #region PutAppointment Tests

        [Fact]
        public async Task PutAppointment_WithValidUpdate_ReturnsUpdatedAppointment()
        {
            // Arrange
            int appointmentId = 1;
            var updateDto = new AppointmentUpdateDto
            {
                Title = "Updated Meeting",
                Description = "Updated description",
                StartTime = new DateTime(2023, 10, 15, 9, 0, 0),
                EndTime = new DateTime(2023, 10, 15, 10, 0, 0),
                Location = "Updated Room",
                Attendees = "Updated Attendees",
                Type = "Updated Type"
            };

            // Act
            var result = await _controller.PutAppointment(appointmentId, updateDto);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var updatedAppointment = Assert.IsType<Appointment>(okResult.Value);
            
            Assert.Equal(updateDto.Title, updatedAppointment.Title);
            Assert.Equal(updateDto.Description, updatedAppointment.Description);
            Assert.Equal(updateDto.StartTime, updatedAppointment.StartTime);
            Assert.Equal(updateDto.EndTime, updatedAppointment.EndTime);
            Assert.Equal(updateDto.Location, updatedAppointment.Location);
            Assert.Equal(updateDto.Attendees, updatedAppointment.Attendees);
            Assert.Equal(updateDto.Type, updatedAppointment.Type);
            
            // Verify it was updated in the database
            var savedAppointment = await _context.Appointments.FindAsync(appointmentId);
            Assert.NotNull(savedAppointment);
            Assert.Equal(updateDto.Title, savedAppointment.Title);
        }

        [Fact]
        public async Task PutAppointment_WithInvalidId_ReturnsNotFound()
        {
            // Arrange
            int invalidId = 999;
            var updateDto = new AppointmentUpdateDto
            {
                Title = "Updated Meeting",
                Description = "Updated description",
                StartTime = new DateTime(2023, 10, 15, 9, 0, 0),
                EndTime = new DateTime(2023, 10, 15, 10, 0, 0),
                Location = "Updated Room",
                Attendees = "Updated Attendees",
                Type = "Updated Type"
            };

            // Act
            var result = await _controller.PutAppointment(invalidId, updateDto);

            // Assert
            var notFoundResult = Assert.IsType<NotFoundObjectResult>(result);
            Assert.Equal("Appointment not found or you don't have permission to update it", notFoundResult.Value);
        }

        [Fact]
        public async Task PutAppointment_WithOtherUsersAppointment_ReturnsNotFound()
        {
            // Arrange
            int otherUsersAppointmentId = 3;
            var updateDto = new AppointmentUpdateDto
            {
                Title = "Updated Meeting",
                Description = "Updated description",
                StartTime = new DateTime(2023, 10, 15, 9, 0, 0),
                EndTime = new DateTime(2023, 10, 15, 10, 0, 0),
                Location = "Updated Room",
                Attendees = "Updated Attendees",
                Type = "Updated Type"
            };

            // Act
            var result = await _controller.PutAppointment(otherUsersAppointmentId, updateDto);

            // Assert
            var notFoundResult = Assert.IsType<NotFoundObjectResult>(result);
            Assert.Equal("Appointment not found or you don't have permission to update it", notFoundResult.Value);
        }

        [Fact]
        public async Task PutAppointment_WithInvalidTimeRange_ReturnsBadRequest()
        {
            // Arrange
            int appointmentId = 1;
            var updateDto = new AppointmentUpdateDto
            {
                Title = "Updated Meeting",
                Description = "Updated description",
                StartTime = new DateTime(2023, 10, 15, 11, 0, 0),
                EndTime = new DateTime(2023, 10, 15, 10, 0, 0), // End before start
                Location = "Updated Room",
                Attendees = "Updated Attendees",
                Type = "Updated Type"
            };

            // Act
            var result = await _controller.PutAppointment(appointmentId, updateDto);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
            Assert.Contains("End time must be after start time", badRequestResult.Value.ToString());
        }

        [Fact]
        public async Task PutAppointment_WithConflictingTime_ReturnsConflict()
        {
            // Arrange
            int appointmentId = 1;
            var updateDto = new AppointmentUpdateDto
            {
                Title = "Updated Meeting",
                Description = "Updated description",
                StartTime = new DateTime(2023, 10, 15, 14, 30, 0), // Conflicts with Meeting 2
                EndTime = new DateTime(2023, 10, 15, 15, 30, 0),
                Location = "Updated Room",
                Attendees = "Updated Attendees",
                Type = "Updated Type"
            };

            // Act
            var result = await _controller.PutAppointment(appointmentId, updateDto);

            // Assert
            var conflictResult = Assert.IsType<ObjectResult>(result);
            Assert.Equal(409, conflictResult.StatusCode);
            Assert.Contains("conflicts with an existing appointment", conflictResult.Value.ToString());
        }

        [Fact]
        public async Task PutAppointment_WithNoUserIdClaim_ReturnsBadRequest()
        {
            // Arrange - Create controller with no user claims
            var controller = new AppointmentsController(_context);
            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = new ClaimsPrincipal() }
            };
            
            int appointmentId = 1;
            var updateDto = new AppointmentUpdateDto
            {
                Title = "Updated Meeting",
                StartTime = new DateTime(2023, 10, 15, 9, 0, 0),
                EndTime = new DateTime(2023, 10, 15, 10, 0, 0)
            };

            // Act
            var result = await controller.PutAppointment(appointmentId, updateDto);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
            Assert.Equal("User ID not found in token", badRequestResult.Value);
        }

        #endregion

        #region Delete Tests

        [Fact]
        public async Task Delete_WithValidId_ReturnsNoContent()
        {
            // Arrange
            int appointmentId = 1;

            // Act
            var result = await _controller.Delete(appointmentId);

            // Assert
            Assert.IsType<NoContentResult>(result);
            
            // Verify it was deleted from the database
            var deletedAppointment = await _context.Appointments.FindAsync(appointmentId);
            Assert.Null(deletedAppointment);
        }

        [Fact]
        public async Task Delete_WithInvalidId_ReturnsNotFound()
        {
            // Arrange
            int invalidId = 999;

            // Act
            var result = await _controller.Delete(invalidId);

            // Assert
            var notFoundResult = Assert.IsType<NotFoundObjectResult>(result);
            Assert.Equal("Appointment not found or you don't have permission to delete it", notFoundResult.Value);
        }

        [Fact]
        public async Task Delete_WithOtherUsersAppointment_ReturnsNotFound()
        {
            // Arrange
            int otherUsersAppointmentId = 3;

            // Act
            var result = await _controller.Delete(otherUsersAppointmentId);

            // Assert
            var notFoundResult = Assert.IsType<NotFoundObjectResult>(result);
            Assert.Equal("Appointment not found or you don't have permission to delete it", notFoundResult.Value);
        }

        [Fact]
        public async Task Delete_WithNoUserIdClaim_ReturnsBadRequest()
        {
            // Arrange - Create controller with no user claims
            var controller = new AppointmentsController(_context);
            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = new ClaimsPrincipal() }
            };
            
            int appointmentId = 1;

            // Act
            var result = await controller.Delete(appointmentId);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
            Assert.Equal("User ID not found in token", badRequestResult.Value);
        }

        #endregion

        public void Dispose()
        {
            _context.Database.EnsureDeleted();
            _context.Dispose();
        }
    }
}
