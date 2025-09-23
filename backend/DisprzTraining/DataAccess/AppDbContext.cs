using DisprzTraining.Models;
using Microsoft.EntityFrameworkCore;

namespace DisprzTraining.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }
        
        public DbSet<Appointment> Appointments { get; set; }
        public DbSet<User> Users { get; set; }
        
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            
            // Configure User entity
            modelBuilder.Entity<User>()
                .HasIndex(u => u.Email)
                .IsUnique();
                
            modelBuilder.Entity<User>()
                .HasIndex(u => u.Username)
                .IsUnique();
                
            // Configure Appointment entity with explicit relationship
            modelBuilder.Entity<Appointment>(entity =>
            {
                // Configure the foreign key relationship properly
                entity.HasOne(a => a.User)
                    .WithMany()
                    .HasForeignKey(a => a.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
                
                // Configure Attendees as optional
                entity.Property(a => a.Attendees)
                    .IsRequired(false)
                    .HasMaxLength(500); // Optional: limit the length
                
                // Configure Date property
                entity.Property(a => a.Date)
                    .IsRequired(true); // Make Date a required field
            });
        }
    }
}
