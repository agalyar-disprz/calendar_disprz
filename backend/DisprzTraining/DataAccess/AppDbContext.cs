using Microsoft.EntityFrameworkCore;
using DisprzTraining.Models;

namespace DisprzTraining.DataAccess
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<Appointment> Appointments { get; set; }
    }
}
