import React, { useState, useEffect } from "react";
import AppointmentCard from "./AppointmentCard";
import { Appointment } from "../../types/appointment";
import CircularProgress from "@mui/material/CircularProgress";

interface Props {
  selectedDate: Date;
  appointments?: Appointment[];
  isLoading?: boolean;
  onEdit?: (appointment: Appointment) => void;
  onDelete?: (id: number) => void;
}

const TimelineView: React.FC<Props> = ({
  selectedDate,
  appointments: propAppointments,
  isLoading = false,
  onEdit,
  onDelete
}) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Use appointments from props if provided, otherwise filter from all appointments
  useEffect(() => {
    if (propAppointments) {
      // Filter appointments for the selected date
      const filtered = propAppointments.filter(
        (appt) => new Date(appt.startTime).toDateString() === selectedDate.toDateString()
      );
      setAppointments(filtered);
    }
  }, [propAppointments, selectedDate]);

  // Generate hours dynamically based on earliest and latest appointments
  const timeSlots = (() => {
    if (appointments.length === 0) {
      // Default time slots from 8:00 to 23:30 (half-hour intervals)
      return Array.from({ length: 32 }, (_, i) => {
        const hour = Math.floor(i / 2) + 8;
        const minute = (i % 2) * 30;
        return { hour, minute };
      });
    }

    // Find earliest and latest times from appointments
    const startHour = Math.min(...appointments.map((a) => new Date(a.startTime).getHours()), 8);
    const endHour = Math.max(...appointments.map((a) => {
      const endTime = new Date(a.endTime);
      return endTime.getHours() + (endTime.getMinutes() > 0 ? 1 : 0);
    }), 23);

    // Generate half-hour slots
    return Array.from({ length: (endHour - startHour) * 2 + 1 }, (_, i) => {
      const hour = Math.floor(i / 2) + startHour;
      const minute = (i % 2) * 30;
      return { hour, minute };
    });
  })();

  // Position an appointment on the timeline
  const getAppointmentPosition = (appointment: Appointment) => {
    const startTime = new Date(appointment.startTime);
    const endTime = new Date(appointment.endTime);
    
    const firstSlot = timeSlots[0];
    const firstSlotMinutes = firstSlot.hour * 60 + firstSlot.minute;
    
    const startMinutes = startTime.getHours() * 60 + startTime.getMinutes();
    const endMinutes = endTime.getHours() * 60 + endTime.getMinutes();
    const durationMinutes = endMinutes - startMinutes;
    
    const topPosition = (startMinutes - firstSlotMinutes) * 1.25; // relative to first time slot
    const height = durationMinutes * 1.25;
    
    return { top: `${topPosition}px`, height: `${height}px` };
  };

  // Current time indicator
  const isToday = selectedDate.toDateString() === new Date().toDateString();
  const getCurrentTimePosition = () => {
    const now = currentTime;
    const totalMinutes = now.getHours() * 60 + now.getMinutes();
    
    const firstSlot = timeSlots[0];
    const lastSlot = timeSlots[timeSlots.length - 1];
    const firstSlotMinutes = firstSlot.hour * 60 + firstSlot.minute;
    const lastSlotMinutes = lastSlot.hour * 60 + lastSlot.minute + 30; // Add 30 minutes for the full slot
    
    if (totalMinutes < firstSlotMinutes || totalMinutes > lastSlotMinutes) {
      return { display: "none" };
    }
    
    return { 
      display: isToday ? "block" : "none", 
      top: `${(totalMinutes - firstSlotMinutes) * 1.25}px` 
    };
  };

  // Format time in 24-hour format
  const formatTime = (date: Date) => {
    return `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
  };

  // Format time slot label
  const formatTimeSlotLabel = (hour: number, minute: number) => {
    return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
  };

  return (
    <div className="timeline-view">
      {isLoading ? (
        <div className="loading-container">
          <CircularProgress />
        </div>
      ) : (
        <div className="timeline-container">
          {/* Hours timeline with half-hour intervals */}
          <div className="timeline-hours">
            {timeSlots.map((slot, index) => (
              <div 
                key={`slot-${slot.hour}-${slot.minute}`} 
                className={`timeline-hour ${slot.minute === 0 ? 'full-hour' : 'half-hour'}`}
                style={{ height: slot.minute === 0 ? '37.5px' : '37.5px' }} // Half of the original 75px
              >
                {/* Only show labels for full hours */}
                {slot.minute === 0 && (
                  <div className="hour-label">{formatTimeSlotLabel(slot.hour, slot.minute)}</div>
                )}
                <div className="hour-line" style={{ 
                  opacity: slot.minute === 0 ? 1 : 0.5 // Full hours have solid lines, half hours have lighter lines
                }}></div>
              </div>
            ))}
          </div>
          
          {/* Current time indicator */}
          <div className="current-time-indicator" style={getCurrentTimePosition()}>
            <div className="current-time-dot" title={`Current time: ${formatTime(currentTime)}`}></div>
            <div className="current-time-line"></div>
          </div>
          
          {/* Appointments */}
          <div className="appointments-container">
            {appointments.length === 0 ? (
              <div className="no-appointments-message">
                No appointments for this day
              </div>
            ) : (
              appointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="appointment-wrapper"
                  style={getAppointmentPosition(appointment)}
                >
                  <AppointmentCard
                    appointment={appointment}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    formatTime={formatTime}
                  />
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TimelineView;
