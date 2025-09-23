using System;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace DisprzTraining.Models
{
    public class Appointment
    {
        public int Id { get; set; }

        [Required]
        public string Title { get; set; }

        public string Description { get; set; }

        public string Location { get; set; }

        public string Attendees { get; set; }

        [Required]
        public DateTime StartTime { get; set; }

        [Required]
        public DateTime EndTime { get; set; }
        [Required]
        public string Type { get; set; }

        // Foreign key
        public int UserId { get; set; }

        // Navigation property - should NOT have [Required] attribute
        [JsonIgnore] // Add this to prevent serialization issues
        public virtual User? User { get; set; }
        // New properties for recurrence
        public bool IsRecurring { get; set; } = false;
        
        public RecurrenceInterval RecurrenceInterval { get; set; } = RecurrenceInterval.Daily;
        
        public DateTime? RecurrenceEndDate { get; set; }
        
        // For tracking instances of a recurring series
        public int? ParentAppointmentId { get; set; }
    }
    
    public enum RecurrenceInterval
    {
        Daily = 0,
        Weekly = 1,
        Monthly = 2
    }
}