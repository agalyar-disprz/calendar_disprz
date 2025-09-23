using Microsoft.AspNetCore.Mvc;
using DisprzTraining.Data;
using DisprzTraining.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;
using DisprzTraining.Services;

namespace DisprzTraining.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize] // Add authorization to ensure user is authenticated
    public class AppointmentsController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IRecurrenceService _recurrenceService;

        public AppointmentsController(AppDbContext context, IRecurrenceService recurrenceService)
        {
            _context = context;
            _recurrenceService = recurrenceService;
        }

        // Add this debugging code to the GetAppointments method
[HttpGet]
public async Task<ActionResult<IEnumerable<Appointment>>> GetAppointments([FromQuery] DateTime? start, [FromQuery] DateTime? end)
{
    try
    {
        // Get the current user's ID from the claims
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        
        if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
        {
            return BadRequest("User ID not found in token");
        }

        // Default date range if not provided
        DateTime startDate = start ?? DateTime.Today.AddMonths(-1);
        DateTime endDate = end ?? DateTime.Today.AddMonths(3);

        Console.WriteLine($"Fetching appointments from {startDate} to {endDate}");

        // Get all appointments for the user
        var appointments = await _context.Appointments
            .AsNoTracking()
            .Where(a => a.UserId == userId)
            .ToListAsync();
        
        Console.WriteLine($"Found {appointments.Count} appointments in database");
        Console.WriteLine($"Recurring appointments: {appointments.Count(a => a.IsRecurring)}");
        
        var result = new List<Appointment>();
        
        foreach (var appointment in appointments)
        {
            // For non-recurring appointments, just check if they're in the date range
            if (!appointment.IsRecurring)
            {
                if (appointment.StartTime >= startDate && appointment.StartTime <= endDate)
                {
                    result.Add(appointment);
                }
                continue;
            }
            
            // For recurring appointments, generate all occurrences in the date range
            Console.WriteLine($"Generating recurrence for appointment {appointment.Id}, interval: {appointment.RecurrenceInterval}, end date: {appointment.RecurrenceEndDate}");
            var occurrences = _recurrenceService.GenerateRecurrenceDates(appointment, endDate);
            Console.WriteLine($"Generated {occurrences.Count} occurrences");
            
            foreach (var date in occurrences)
            {
                if (date >= startDate && date <= endDate)
                {
                    // Create a new instance for each occurrence
                    var instance = new Appointment
                    {
                        Id = appointment.Id, // Keep the same ID for frontend identification
                        Title = appointment.Title,
                        Description = appointment.Description,
                        StartTime = date,
                        EndTime = date + (appointment.EndTime - appointment.StartTime),
                        Location = appointment.Location,
                        Attendees = appointment.Attendees,
                        Type = appointment.Type,
                        UserId = appointment.UserId,
                        IsRecurring = appointment.IsRecurring,
                        RecurrenceInterval = appointment.RecurrenceInterval,
                        RecurrenceEndDate = appointment.RecurrenceEndDate,
                        ParentAppointmentId = appointment.Id
                    };
                    
                    result.Add(instance);
                    Console.WriteLine($"Added occurrence on {date}");
                }
            }
        }
        
        // Sort by start time
        result = result.OrderBy(a => a.StartTime).ToList();
        Console.WriteLine($"Returning {result.Count} appointments (including recurring instances)");
        
        return Ok(result);
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Error in GetAppointments: {ex}");
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

                // Get all appointments for the user
                var appointments = await _context.Appointments
                    .AsNoTracking()
                    .Where(a => a.UserId == userId)
                    .ToListAsync();
                
                var result = new List<Appointment>();
                
                foreach (var appointment in appointments)
                {
                    // For non-recurring appointments, just check if they're in the date range
                    if (!appointment.IsRecurring)
                    {
                        if (appointment.StartTime >= startOfDay && appointment.StartTime <= endOfDay)
                        {
                            result.Add(appointment);
                        }
                        continue;
                    }
                    
                    // For recurring appointments, check if any occurrence falls on this day
                    var occurrences = _recurrenceService.GenerateRecurrenceDates(appointment, endOfDay);
                    
                    foreach (var occurrenceDate in occurrences)
                    {
                        if (occurrenceDate.Date == startOfDay.Date)
                        {
                            // Create a new instance for this occurrence
                            var instance = new Appointment
                            {
                                Id = appointment.Id, // Keep the same ID for frontend identification
                                Title = appointment.Title,
                                Description = appointment.Description,
                                StartTime = occurrenceDate,
                                EndTime = occurrenceDate + (appointment.EndTime - appointment.StartTime),
                                Location = appointment.Location,
                                Attendees = appointment.Attendees,
                                Type = appointment.Type,
                                UserId = appointment.UserId,
                                IsRecurring = appointment.IsRecurring,
                                RecurrenceInterval = appointment.RecurrenceInterval,
                                RecurrenceEndDate = appointment.RecurrenceEndDate,
                                ParentAppointmentId = appointment.Id
                            };
                            
                            result.Add(instance);
                        }
                    }
                }
                
                // Sort by start time
                result = result.OrderBy(a => a.StartTime).ToList();
                
                return Ok(result);
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

                // For recurring appointments, check conflicts for all instances
                if (appointment.IsRecurring)
                {
                    // Determine the end date for checking conflicts
                    DateTime endCheckDate = appointment.RecurrenceEndDate ?? 
                        appointment.StartTime.AddMonths(3); // Default to 3 months if no end date
                    
                    // Generate all recurrence dates for conflict checking
                    var recurrenceDates = _recurrenceService.GenerateRecurrenceDates(appointment, endCheckDate);
                    
                    // Check each date for conflicts
                    foreach (var date in recurrenceDates)
                    {
                        DateTime instanceStart = date;
                        DateTime instanceEnd = date + (appointment.EndTime - appointment.StartTime);
                        
                        bool hasConflict = await _context.Appointments
                            .Where(a => a.UserId == userId)
                            .AnyAsync(a => 
                                (instanceStart < a.EndTime && a.StartTime < instanceEnd)
                            );
                        
                        if (hasConflict)
                        {
                            // Return 409 Conflict for appointment conflicts
                            return StatusCode(409, new { 
                                error = $"This recurring appointment conflicts with an existing appointment on {date.ToShortDateString()}" 
                            });
                        }
                    }
                }
                else
                {
                    // For non-recurring appointments, just check the single instance
                    bool hasConflict = await _context.Appointments
                        .Where(a => a.UserId == userId)
                        .AnyAsync(a =>
                            (appointment.StartTime < a.EndTime && a.StartTime < appointment.EndTime)
                        );
                        
                    if (hasConflict)
                    {
                        // Return 409 Conflict for appointment conflicts
                        return StatusCode(409, new { error = "This appointment conflicts with an existing appointment" });
                    }
                }

                // Save the appointment
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

                // For recurring appointments, check conflicts for all future instances if updating all future events
                if (appointmentDto.IsRecurring && appointmentDto.UpdateAllFutureEvents)
                {
                    // Create a temporary appointment object for conflict checking
                    var tempAppointment = new Appointment
                    {
                        StartTime = appointmentDto.StartTime,
                        EndTime = appointmentDto.EndTime,
                        RecurrenceInterval = appointmentDto.RecurrenceInterval,
                        RecurrenceEndDate = appointmentDto.RecurrenceEndDate
                    };
                    
                    // Determine the end date for checking conflicts
                    DateTime endCheckDate = appointmentDto.RecurrenceEndDate ?? 
                        appointmentDto.StartTime.AddMonths(3); // Default to 3 months if no end date
                    
                    // Generate all recurrence dates for conflict checking
                    var recurrenceDates = _recurrenceService.GenerateRecurrenceDates(tempAppointment, endCheckDate);
                    
                    // Check each date for conflicts (excluding the current appointment)
                    foreach (var date in recurrenceDates)
                    {
                        DateTime instanceStart = date;
                        DateTime instanceEnd = date + (appointmentDto.EndTime - appointmentDto.StartTime);
                        
                        bool hasConflict = await _context.Appointments
                            .Where(a => a.UserId == userId && a.Id != id)
                            .AnyAsync(a => 
                                (instanceStart < a.EndTime && a.StartTime < instanceEnd)
                            );
                        
                        if (hasConflict)
                        {
                            // Return 409 Conflict for appointment conflicts
                            return StatusCode(409, new { 
                                error = $"This recurring appointment conflicts with an existing appointment on {date.ToShortDateString()}" 
                            });
                        }
                    }
                }
                else
                {
                    // For non-recurring appointments or single instance updates, just check the single instance
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
                }

                // Update the existing appointment properties
                existingAppointment.Title = appointmentDto.Title;
                existingAppointment.Description = appointmentDto.Description;
                existingAppointment.StartTime = appointmentDto.StartTime;
                existingAppointment.EndTime = appointmentDto.EndTime;
                existingAppointment.Location = appointmentDto.Location;
                existingAppointment.Attendees = appointmentDto.Attendees;
                existingAppointment.Type = appointmentDto.Type;
                existingAppointment.IsRecurring = appointmentDto.IsRecurring;
                existingAppointment.RecurrenceInterval = appointmentDto.RecurrenceInterval;
                existingAppointment.RecurrenceEndDate = appointmentDto.RecurrenceEndDate;

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
        public async Task<IActionResult> Delete(int id, [FromQuery] bool deleteAllFuture = false)
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

                // If this is a recurring appointment and we're deleting all future occurrences
                if (appointment.IsRecurring && deleteAllFuture)
                {
                    // Option 1: Delete the appointment entirely
                    _context.Appointments.Remove(appointment);
                    
                    // Option 2: Update the recurrence end date to yesterday
                    // This would keep past occurrences but stop future ones
                    // appointment.RecurrenceEndDate = DateTime.Today.AddDays(-1);
                    // _context.Appointments.Update(appointment);
                }
                else
                {
                    // For non-recurring appointments or single instance deletion
                    _context.Appointments.Remove(appointment);
                }

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
    public bool IsRecurring { get; set; } = false;
    public RecurrenceInterval RecurrenceInterval { get; set; } = RecurrenceInterval.Daily;
    public DateTime? RecurrenceEndDate { get; set; }
    // For updating recurring series
    public bool UpdateAllFutureEvents { get; set; } = false;
}
