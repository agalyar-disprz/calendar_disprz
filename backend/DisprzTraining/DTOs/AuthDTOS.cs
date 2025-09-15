using System.ComponentModel.DataAnnotations;

namespace DisprzTraining.DTOs
{
    public class RegisterDTO
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; }
        
        [Required]
        [MinLength(3)]
        public string Username { get; set; }
        
        [Required]
        [MinLength(6)]
        public string Password { get; set; }
        
        public string FirstName { get; set; }
        
        public string LastName { get; set; }
    }
    
    public class LoginDTO
    {
        [Required]
        public string UsernameOrEmail { get; set; }
        
        [Required]
        public string Password { get; set; }
    }
    
    public class UserDTO
    {
        public int Id { get; set; }
        public string Email { get; set; }
        public string Username { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string Token { get; set; }
    }
}
