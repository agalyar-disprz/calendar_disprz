using Microsoft.AspNetCore.Mvc;
using DisprzTraining.Data;
using DisprzTraining.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;

namespace DisprzTraining.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize] // Add authorization to ensure user is authenticated
    public class AppointmentsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AppointmentsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Appointment>>> GetAppointments()
        {
            try
            {
                // Get the current user's ID from the claims
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                
                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
                {
                    return BadRequest("User ID not found in token");
                }

                // Use AsNoTracking for better performance on read-only queries
                // Filter appointments to only show those belonging to the current user
                return await _context.Appointments
                    .AsNoTracking()
                    .Where(a => a.UserId == userId)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        // New endpoint to get appointments for a specific day
        [HttpGet("day")]
        public async Task<ActionResult<IEnumerable<Appointment>>> GetAppointmentsForDay([FromQuery] DateTime date)
        {
            try
            {
                // Get the current user's ID from the claims
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                
                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
                {
                    return BadRequest("User ID not found in token");
                }

                // Get start and end of the day
                var startOfDay = new DateTime(date.Year, date.Month, date.Day, 0, 0, 0);
                var endOfDay = startOfDay.AddDays(1).AddTicks(-1);

                // Get appointments for the specified day
                var appointments = await _context.Appointments
                    .AsNoTracking()
                    .Where(a => a.UserId == userId &&
                           a.StartTime >= startOfDay &&
                           a.StartTime <= endOfDay)
                    .OrderBy(a => a.StartTime)
                    .ToListAsync();

                return Ok(appointments);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Appointment>> GetAppointment(int id)
        {
            try
            {
                // Get the current user's ID from the claims
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                
                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
                {
                    return BadRequest("User ID not found in token");
                }

                var appointment = await _context.Appointments
                    .AsNoTracking()
                    .FirstOrDefaultAsync(a => a.Id == id && a.UserId == userId);

                if (appointment == null)
                {
                    return NotFound("Appointment not found or you don't have permission to view it");
                }

                return appointment;
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpPost]
        public async Task<ActionResult<Appointment>> Create(Appointment appointment)
        {
            try
            {
                // Look for the NameIdentifier claim which contains the user ID
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                
                if (userIdClaim != null && int.TryParse(userIdClaim.Value, out int userId))
                {
                    appointment.UserId = userId;
                }
                else
                {
                    return BadRequest("User ID not found in token");
                }
                
                // Validate appointment times
                if (appointment.StartTime >= appointment.EndTime)
                {
                    return BadRequest(new { error = "End time must be after start time" });
                }

                // Check for conflicts with existing appointments
                bool hasConflict = await _context.Appointments
                    .Where(a => a.UserId == userId && a.Id != appointment.Id)
                    .AnyAsync(a =>
                        (appointment.StartTime < a.EndTime && a.StartTime < appointment.EndTime)
                    );

                if (hasConflict)
                {
                    // Return 409 Conflict for appointment conflicts
                    return StatusCode(409, new { error = "This appointment conflicts with an existing appointment" });
                }

                _context.Appointments.Add(appointment);
                await _context.SaveChangesAsync();

                return CreatedAtAction(nameof(GetAppointment), new { id = appointment.Id }, appointment);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutAppointment(int id, [FromBody] AppointmentUpdateDto appointmentDto)
        {
            try
            {
                // Get the current user's ID from the claims
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                
                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
                {
                    return BadRequest("User ID not found in token");
                }

                // Check if the appointment exists and belongs to the current user
                var existingAppointment = await _context.Appointments
                    .FirstOrDefaultAsync(a => a.Id == id && a.UserId == userId);

                if (existingAppointment == null)
                {
                    return NotFound("Appointment not found or you don't have permission to update it");
                }

                // Validate appointment times
                if (appointmentDto.StartTime >= appointmentDto.EndTime)
                {
                    return BadRequest(new { error = "End time must be after start time" });
                }

                // Check for conflicts with existing appointments (excluding the current one)
                bool hasConflict = await _context.Appointments
                    .Where(a => a.UserId == userId && a.Id != id)
                    .AnyAsync(a =>
                        (appointmentDto.StartTime < a.EndTime && a.StartTime < appointmentDto.EndTime)
                    );

                if (hasConflict)
                {
                    // Return 409 Conflict for appointment conflicts
                    return StatusCode(409, new { error = "This appointment conflicts with an existing appointment" });
                }

                // Update the existing appointment properties
                existingAppointment.Title = appointmentDto.Title;
                existingAppointment.Description = appointmentDto.Description;
                existingAppointment.StartTime = appointmentDto.StartTime;
                existingAppointment.EndTime = appointmentDto.EndTime;
                existingAppointment.Location = appointmentDto.Location;
                existingAppointment.Attendees = appointmentDto.Attendees;
                existingAppointment.Type = appointmentDto.Type;

                // Save changes
                await _context.SaveChangesAsync();

                // Return the updated appointment
                return Ok(existingAppointment);
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!AppointmentExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                // Get the current user's ID from the claims
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                
                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
                {
                    return BadRequest("User ID not found in token");
                }

                // Check if the appointment exists and belongs to the current user
                var appointment = await _context.Appointments
                    .FirstOrDefaultAsync(a => a.Id == id && a.UserId == userId);

                if (appointment == null)
                {
                    return NotFound("Appointment not found or you don't have permission to delete it");
                }

                _context.Appointments.Remove(appointment);
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        private bool AppointmentExists(int id)
        {
            return _context.Appointments.Any(e => e.Id == id);
        }
    }
}

public class AppointmentUpdateDto
{
    public string Title { get; set; }
    public string Description { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public string Location { get; set; }
    public string Attendees { get; set; }
    public string Type { get; set; }
}