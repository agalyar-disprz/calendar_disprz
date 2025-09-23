import React from "react";
import { Appointment, getAppointmentColor, APPOINTMENT_TYPES } from "../../types/appointment";
import AppointmentCard from "../DayView/AppointmentCard";
import { Paper, Typography, Box } from "@mui/material";

interface WeekViewProps {
  selectedDate: Date;
  appointments: Appointment[];
  onEdit?: (appointment: Appointment) => void;
  onDelete?: (id: number) => void;
}

const WeekView: React.FC<WeekViewProps> = ({
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

  // Get the start of the week (Monday)
  const getWeekDays = () => {
    const day = selectedDate.getDay();
    const diff = selectedDate.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
    const monday = new Date(selectedDate);
    monday.setDate(diff);
    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(monday);
      day.setDate(monday.getDate() + i);
      weekDays.push(day);
    }
    return weekDays;
  };

  const weekDays = getWeekDays();

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

  // Format day header
  const formatDayHeader = (date: Date) => {
    const today = new Date();
    const isToday =
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
    return (
      <Box
        sx={{
          textAlign: "center",
          py: 1,
          bgcolor: isToday ? "#e3f2fd" : "transparent",
        }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
          {date.toLocaleDateString(undefined, { weekday: "short" })}
        </Typography>
        <Typography
          variant="h6"
          sx={{
            fontWeight: isToday ? "bold" : "normal",
            color: isToday ? "primary.main" : "inherit",
          }}
        >
          {date.getDate()}
        </Typography>
      </Box>
    );
  };

  return (
    <div className="week-view">
      <Box sx={{ display: "flex", gap: 1, width: "100%" }}>
        {weekDays.map((day, index) => (
          <Box
            key={index}
            sx={{
              flex: 1,
              width: `${100 / 7}%`,
            }}
          >
            <Paper elevation={1} sx={{ height: "100%", minHeight: "70vh" }}>
              {formatDayHeader(day)}
              <Box sx={{ p: 1 }}>
                {/* Updated appointment rendering with completed status and color coding */}
                {getAppointmentsForDay(day).length > 0 ? (
                  getAppointmentsForDay(day)
                    .sort(
                      (a, b) =>
                        new Date(a.startTime).getTime() -
                        new Date(b.startTime).getTime()
                    )
                    .map((appointment) => {
                      const isCompleted = isAppointmentCompleted(appointment);
                      return (
                        <Box key={appointment.id} sx={{ mb: 1 }}>
                          <AppointmentCard
                            appointment={appointment}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            isCompleted={isCompleted} // Pass this prop to AppointmentCard
                          />
                        </Box>
                      );
                    })
                ) : (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ textAlign: "center", py: 2 }}
                  >
                    No appointments
                  </Typography>
                )}
              </Box>
            </Paper>
          </Box>
        ))}
      </Box>
    </div>
  );
};

export default WeekView;
