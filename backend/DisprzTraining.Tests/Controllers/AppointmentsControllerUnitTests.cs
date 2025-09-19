using DisprzTraining.Controllers;
using DisprzTraining.Data;
using DisprzTraining.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Xunit;

namespace DisprzTraining.Tests.Controllers
{
    public class AppointmentsControllerUnitTests
    {
        private readonly int _userId = 1;

        [Fact]
        public async Task GetAppointments_ReturnsOnlyUserAppointments()
        {
            // Arrange
            var context = GetDbContext();
            var controller = GetControllerWithUser(context);

            // Act
            var result = await controller.GetAppointments();

            // Assert
            var actionResult = Assert.IsType<ActionResult<IEnumerable<Appointment>>>(result);
            var appointments = Assert.IsAssignableFrom<IEnumerable<Appointment>>(actionResult.Value);
            
            // Should only return appointments for the current user (3 of them)
            Assert.Equal(3, appointments.Count());
            Assert.All(appointments, a => Assert.Equal(_userId, a.UserId));
        }

        [Fact]
        public async Task GetAppointmentsForDay_ReturnsAppointmentsForSpecificDay()
        {
            // Arrange
            var date = new DateTime(2023, 10, 15);
            var context = GetDbContext();
            var controller = GetControllerWithUser(context);

            // Act
            var result = await controller.GetAppointmentsForDay(date);

            // Assert
            var actionResult = Assert.IsType<ActionResult<IEnumerable<Appointment>>>(result);
            var okResult = Assert.IsType<OkObjectResult>(actionResult.Result);
            var appointments = Assert.IsAssignableFrom<IEnumerable<Appointment>>(okResult.Value);
            
            // Should return 2 appointments for the specified day
            Assert.Equal(2, appointments.Count());
            Assert.All(appointments, a => 
            {
                Assert.Equal(_userId, a.UserId);
                Assert.Equal(date.Date, a.StartTime.Date);
            });
        }

        [Fact]
        public async Task GetAppointment_WithValidId_ReturnsAppointment()
        {
            // Arrange
            int appointmentId = 1;
            var context = GetDbContext();
            var controller = GetControllerWithUser(context);

            // Act
            var result = await controller.GetAppointment(appointmentId);

            // Assert
            var actionResult = Assert.IsType<ActionResult<Appointment>>(result);
            var appointment = Assert.IsType<Appointment>(actionResult.Value);
            
            Assert.Equal(appointmentId, appointment.Id);
            Assert.Equal(_userId, appointment.UserId);
        }

        [Fact]
        public async Task GetAppointment_WithInvalidId_ReturnsNotFound()
        {
            // Arrange
            int invalidId = 999;
            var context = GetDbContext();
            var controller = GetControllerWithUser(context);

            // Act
            var result = await controller.GetAppointment(invalidId);

            // Assert
            var actionResult = Assert.IsType<ActionResult<Appointment>>(result);
            Assert.IsType<NotFoundObjectResult>(actionResult.Result);
        }

        [Fact]
        public async Task Create_WithValidAppointment_ReturnsCreatedAppointment()
        {
            // Arrange
            var context = GetDbContext();
            var controller = GetControllerWithUser(context);
            
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
            var result = await controller.Create(newAppointment);

            // Assert
            var actionResult = Assert.IsType<ActionResult<Appointment>>(result);
            var createdResult = Assert.IsType<CreatedAtActionResult>(actionResult.Result);
            var appointment = Assert.IsType<Appointment>(createdResult.Value);
            
            Assert.Equal(newAppointment.Title, appointment.Title);
            Assert.Equal(newAppointment.Description, appointment.Description);
            Assert.Equal(_userId, appointment.UserId);
            Assert.Equal(5, appointment.Id); // Should be assigned a new ID
        }

        [Fact]
        public async Task Create_WithInvalidTimeRange_ReturnsBadRequest()
        {
            // Arrange
            var context = GetDbContext();
            var controller = GetControllerWithUser(context);
            
            var invalidAppointment = new Appointment
            {
                Title = "Invalid Meeting",
                Description = "Meeting with invalid time range",
                StartTime = new DateTime(2023, 10, 17, 11, 0, 0),
                EndTime = new DateTime(2023, 10, 17, 10, 0, 0), // End before start
                Location = "Room 105",
                Attendees = "New attendees",
                Type = "Meeting"
            };

            // Act
            var result = await controller.Create(invalidAppointment);

            // Assert
            var actionResult = Assert.IsType<ActionResult<Appointment>>(result);
            Assert.IsType<BadRequestObjectResult>(actionResult.Result);
        }

        [Fact]
        public async Task Create_WithConflictingAppointment_ReturnsConflict()
        {
            // Arrange
            var context = GetDbContext();
            var controller = GetControllerWithUser(context);
            
            var conflictingAppointment = new Appointment
            {
                Title = "Conflicting Meeting",
                Description = "Meeting that conflicts with an existing one",
                StartTime = new DateTime(2023, 10, 15, 10, 30, 0), // Overlaps with Meeting 1
                EndTime = new DateTime(2023, 10, 15, 11, 30, 0),
                Location = "Room 105",
                Attendees = "New attendees",
                Type = "Meeting"
            };

            // Act
            var result = await controller.Create(conflictingAppointment);

            // Assert
            var actionResult = Assert.IsType<ActionResult<Appointment>>(result);
            var statusCodeResult = Assert.IsType<ObjectResult>(actionResult.Result);
            Assert.Equal(409, statusCodeResult.StatusCode);
        }

        [Fact]
        public async Task PutAppointment_WithValidUpdate_ReturnsUpdatedAppointment()
        {
            // Arrange
            int appointmentId = 1;
            var context = GetDbContext();
            var controller = GetControllerWithUser(context);
            
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
            var result = await controller.PutAppointment(appointmentId, updateDto);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var updatedAppointment = Assert.IsType<Appointment>(okResult.Value);
            
            Assert.Equal(updateDto.Title, updatedAppointment.Title);
            Assert.Equal(updateDto.Description, updatedAppointment.Description);
            Assert.Equal(updateDto.StartTime, updatedAppointment.StartTime);
            Assert.Equal(updateDto.EndTime, updatedAppointment.EndTime);
        }

        [Fact]
        public async Task PutAppointment_WithInvalidId_ReturnsNotFound()
        {
            // Arrange
            int invalidId = 999;
            var context = GetDbContext();
            var controller = GetControllerWithUser(context);
            
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
            var result = await controller.PutAppointment(invalidId, updateDto);

            // Assert
            Assert.IsType<NotFoundObjectResult>(result);
        }

        [Fact]
        public async Task PutAppointment_WithInvalidTimeRange_ReturnsBadRequest()
        {
            // Arrange
            int appointmentId = 1;
            var context = GetDbContext();
            var controller = GetControllerWithUser(context);
            
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
            var result = await controller.PutAppointment(appointmentId, updateDto);

            // Assert
            Assert.IsType<BadRequestObjectResult>(result);
        }

        [Fact]
        public async Task Delete_WithValidId_ReturnsNoContent()
        {
            // Arrange
            int appointmentId = 1;
            var context = GetDbContext();
            var controller = GetControllerWithUser(context);

            // Act
            var result = await controller.Delete(appointmentId);

            // Assert
            Assert.IsType<NoContentResult>(result);
        }

        [Fact]
        public async Task Delete_WithInvalidId_ReturnsNotFound()
        {
            // Arrange
            int invalidId = 999;
            var context = GetDbContext();
            var controller = GetControllerWithUser(context);

            // Act
            var result = await controller.Delete(invalidId);

            // Assert
            Assert.IsType<NotFoundObjectResult>(result);
        }

        #region Helper Methods

        private AppDbContext GetDbContext()
        {
            // Create a fresh instance of an in-memory database for each test
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            var context = new AppDbContext(options);
            
            // Clear the database
            context.Database.EnsureDeleted();
            context.Database.EnsureCreated();
            
            // Add test data
            context.Appointments.AddRange(new List<Appointment>
            {
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
            });
            
            context.SaveChanges();
            
            return context;
        }

        private AppointmentsController GetControllerWithUser(AppDbContext context)
        {
            var controller = new AppointmentsController(context);
            
            // Setup user claims
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, _userId.ToString())
            };
            var identity = new ClaimsIdentity(claims, "TestAuthType");
            var claimsPrincipal = new ClaimsPrincipal(identity);

            // Setup controller context
            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = claimsPrincipal }
            };
            
            return controller;
        }

        #endregion
    }
}
