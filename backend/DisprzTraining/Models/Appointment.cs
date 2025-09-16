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
        
        // Foreign key
        public int UserId { get; set; }
        
        // Navigation property - should NOT have [Required] attribute
        [JsonIgnore] // Add this to prevent serialization issues
        public virtual User? User { get; set; }
    }
}
