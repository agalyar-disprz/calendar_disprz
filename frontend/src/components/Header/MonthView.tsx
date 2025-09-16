import React from "react";
import { Appointment } from "../../types/appointment";
import { Paper, Typography, Box, Tooltip } from "@mui/material";

interface MonthViewProps {
  selectedDate: Date;
  appointments: Appointment[];
  onEdit?: (appointment: Appointment) => void;
  onDelete?: (id: number) => void;
}

const MonthView: React.FC<MonthViewProps> = ({
  selectedDate,
  appointments,
  onEdit,
  onDelete,
}) => {
  // Helper function to check if an appointment is in the past
  const isAppointmentCompleted = (appointment: Appointment): boolean => {
    const now = new Date();
    const endTime = new Date(appointment.endTime);
    return endTime < now;
  };

  // Get all days in the month
  const getDaysInMonth = () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    // Get the day of the week for the first day (0 = Sunday, 1 = Monday, etc.)
    const firstDayOfWeek = firstDay.getDay();
    // Calculate how many days from the previous month we need to show
    const daysFromPrevMonth = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
    // Create an array for all days we need to display
    const allDays = [];
    // Add days from previous month
    const prevMonth = new Date(year, month, 0);
    const prevMonthDays = prevMonth.getDate();
    for (
      let i = prevMonthDays - daysFromPrevMonth + 1;
      i <= prevMonthDays;
      i++
    ) {
      const date = new Date(year, month - 1, i);
      allDays.push({ date, isCurrentMonth: false });
    }
    // Add days from current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const date = new Date(year, month, i);
      allDays.push({ date, isCurrentMonth: true });
    }
    // Add days from next month to complete the grid (6 rows x 7 days = 42 cells)
    const remainingDays = 42 - allDays.length;
    for (let i = 1; i <= remainingDays; i++) {
      const date = new Date(year, month + 1, i);
      allDays.push({ date, isCurrentMonth: false });
    }
    return allDays;
  };

  const days = getDaysInMonth();

  // Group appointments by day
  const getAppointmentsForDay = (date: Date) => {
    return appointments.filter((appointment) => {
      const appointmentDate = new Date(appointment.startTime);
      return (
        appointmentDate.getDate() === date.getDate() &&
        appointmentDate.getMonth() === date.getMonth() &&
        appointmentDate.getFullYear() === date.getFullYear()
      );
    });
  };

  // Format appointment for display in month cell
  const formatAppointment = (appointment: Appointment) => {
    const startTime = new Date(appointment.startTime);
    return `${startTime.getHours().toString().padStart(2, "0")}:${startTime
      .getMinutes()
      .toString()
      .padStart(2, "0")} - ${appointment.title}`;
  };

  // Check if a date is today
  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  // Calculate width for each day cell
  const cellWidth = 100 / 7;

  return (
    <div className="month-view">
      <Box sx={{ display: "flex", flexWrap: "wrap", width: "100%" }}>
        {/* Weekday headers */}
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, index) => (
          <Box
            key={`header-${index}`}
            sx={{
              width: `${cellWidth}%`,
              textAlign: "center",
              py: 1,
              fontWeight: "bold",
            }}
          >
            {day}
          </Box>
        ))}
        {/* Calendar days */}
        {days.map((day, index) => {
          const dayAppointments = getAppointmentsForDay(day.date);
          return (
            <Box
              key={`day-${index}`}
              sx={{ width: `${cellWidth}%`, padding: "2px" }}
            >
              <Paper
                elevation={0}
                sx={{
                  height: "120px",
                  p: 1,
                  bgcolor: isToday(day.date)
                    ? "#e3f2fd"
                    : day.isCurrentMonth
                    ? "white"
                    : "#f5f5f5",
                  opacity: day.isCurrentMonth ? 1 : 0.7,
                  border: isToday(day.date)
                    ? "1px solid #1976d2"
                    : "1px solid #e0e0e0",
                  overflow: "hidden",
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: isToday(day.date) ? "bold" : "normal",
                    color: isToday(day.date) ? "primary.main" : "inherit",
                  }}
                >
                  {day.date.getDate()}
                </Typography>
                <Box sx={{ mt: 1, fontSize: "0.75rem" }}>
                  {/* Updated appointment rendering with completed status */}
                  {dayAppointments.length > 0
                    ? dayAppointments
                        .sort(
                          (a, b) =>
                            new Date(a.startTime).getTime() -
                            new Date(b.startTime).getTime()
                        )
                        .slice(0, 3)
                        .map((appointment) => {
                          const isCompleted =
                            isAppointmentCompleted(appointment);
                          return (
                            <Tooltip
                              key={appointment.id}
                              title={`${formatAppointment(appointment)}${
                                appointment.location
                                  ? ` @ ${appointment.location}`
                                  : ""
                              }`}
                              arrow
                            >
                              <Box
                                sx={{
                                  p: 0.5,
                                  mb: 0.5,
                                  bgcolor: isCompleted
                                    ? "success.light"
                                    : "primary.light",
                                  color: "white",
                                  borderRadius: 1,
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                  cursor: "pointer",
                                  opacity: isCompleted ? 0.8 : 1,
                                  display: "flex",
                                  alignItems: "center",
                                }}
                                onClick={() => onEdit && onEdit(appointment)}
                              >
                                {isCompleted && (
                                  <Box
                                    component="span"
                                    sx={{ mr: 0.5, fontSize: "0.8rem" }}
                                  >
                                    ✓
                                  </Box>
                                )}
                                {formatAppointment(appointment)}
                              </Box>
                            </Tooltip>
                          );
                        })
                    : null}
                  {dayAppointments.length > 3 && (
                    <Box sx={{ textAlign: "center", color: "text.secondary" }}>
                      +{dayAppointments.length - 3} more
                    </Box>
                  )}
                </Box>
              </Paper>
            </Box>
          );
        })}
      </Box>
    </div>
  );
};

export default MonthView;
