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
                // Use AsNoTracking for better performance on read-only queries
                return await _context.Appointments
                    .AsNoTracking()
                    .ToListAsync();
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
        
        _context.Appointments.Add(appointment);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetAppointments), new { id = appointment.Id }, appointment);
    }
    catch (Exception ex)
    {
        return StatusCode(500, $"Internal server error: {ex.Message}");
    }
}



    }
}
