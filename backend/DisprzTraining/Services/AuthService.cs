using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using DisprzTraining.Data;  // Changed from DisprzTraining.DataAccess to DisprzTraining.Data
using DisprzTraining.DTOs;
using DisprzTraining.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace DisprzTraining.Services
{
    public interface IAuthService
    {
        Task<UserDTO> Register(RegisterDTO registerDto);
        Task<UserDTO> Login(LoginDTO loginDto);
        Task<UserDTO> GetCurrentUser(int userId);
    }
    
    public class AuthService : IAuthService
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _config;
        
        public AuthService(AppDbContext context, IConfiguration config)
        {
            _context = context;
            _config = config;
        }
        
        public async Task<UserDTO> Register(RegisterDTO registerDto)
        {
            // Check if email already exists
            if (await _context.Users.AnyAsync(u => u.Email == registerDto.Email))
                throw new Exception("Email already exists");
                
            // Check if username already exists
            if (await _context.Users.AnyAsync(u => u.Username == registerDto.Username))
                throw new Exception("Username already exists");
                
            // Create new user
            var user = new User
            {
                Email = registerDto.Email,
                Username = registerDto.Username,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(registerDto.Password),
                FirstName = registerDto.FirstName,
                LastName = registerDto.LastName
            };
            
            _context.Users.Add(user);
            await _context.SaveChangesAsync();
            
            // Return user with token
            return new UserDTO
            {
                Id = user.Id,
                Email = user.Email,
                Username = user.Username,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Token = GenerateJwtToken(user)
            };
        }
        
        public async Task<UserDTO> Login(LoginDTO loginDto)
        {
            // Find user by email or username
            var user = await _context.Users
                .FirstOrDefaultAsync(u => 
                    u.Email == loginDto.UsernameOrEmail || 
                    u.Username == loginDto.UsernameOrEmail);
                    
            if (user == null)
                throw new Exception("Invalid credentials");
                
            // Verify password
            if (!BCrypt.Net.BCrypt.Verify(loginDto.Password, user.PasswordHash))
                throw new Exception("Invalid credentials");
                
            // Return user with token
            return new UserDTO
            {
                Id = user.Id,
                Email = user.Email,
                Username = user.Username,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Token = GenerateJwtToken(user)
            };
        }
        
        public async Task<UserDTO> GetCurrentUser(int userId)
        {
            var user = await _context.Users.FindAsync(userId);
            
            if (user == null)
                throw new Exception("User not found");
                
            return new UserDTO
            {
                Id = user.Id,
                Email = user.Email,
                Username = user.Username,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Token = GenerateJwtToken(user)
            };
        }
        
        private string GenerateJwtToken(User user)
        {
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
            var expires = DateTime.Now.AddDays(7);
            
            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
                new Claim(JwtRegisteredClaimNames.Email, user.Email),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                new Claim(ClaimTypes.Name, user.Username)
            };
            
            var token = new JwtSecurityToken(
                _config["Jwt:Issuer"],
                _config["Jwt:Audience"],
                claims,
                expires: expires,
                signingCredentials: creds
            );
            
            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}
