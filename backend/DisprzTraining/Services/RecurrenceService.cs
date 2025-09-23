using DisprzTraining.Models;

namespace DisprzTraining.Services
{
    public interface IRecurrenceService
    {
        List<DateTime> GenerateRecurrenceDates(Appointment appointment, DateTime endDate);
    }

    public class RecurrenceService : IRecurrenceService
    {
        public List<DateTime> GenerateRecurrenceDates(Appointment appointment, DateTime endDate)
        {
            var dates = new List<DateTime>();

            Console.WriteLine($"Generating dates for appointment {appointment.Id}, IsRecurring: {appointment.IsRecurring}");

            // If not recurring, just return the original date
            if (!appointment.IsRecurring)
            {
                dates.Add(appointment.StartTime);
                return dates;
            }

            // Use the appointment's recurrence end date if it exists and is earlier than the provided end date
            DateTime recurrenceEndDate = appointment.RecurrenceEndDate.HasValue &&
                                        appointment.RecurrenceEndDate.Value < endDate ?
                                        appointment.RecurrenceEndDate.Value : endDate;

            // Add the original date
            dates.Add(appointment.StartTime);

            // Generate dates based on recurrence pattern
            DateTime currentDate = appointment.StartTime;

            while (true)
            {
                // Calculate next date based on recurrence interval
                switch (appointment.RecurrenceInterval)
                {
                    case RecurrenceInterval.Daily:
                        currentDate = currentDate.AddDays(1);
                        break;
                    case RecurrenceInterval.Weekly:
                        currentDate = currentDate.AddDays(7);
                        break;
                    case RecurrenceInterval.Monthly:
                        currentDate = currentDate.AddMonths(1);
                        break;
                    default:
                        currentDate = currentDate.AddDays(1);
                        break;
                }


                // Stop if we've passed the end date (inclusive)
                if (currentDate.Date > recurrenceEndDate.Date)
                    break;


                // Add this date to our list
                dates.Add(currentDate);
            }
            Console.WriteLine($"Generated {dates.Count} dates");
            foreach (var date in dates)
            {
                Console.WriteLine($"  - {date}");
            }

            return dates;
        }
    }
}
