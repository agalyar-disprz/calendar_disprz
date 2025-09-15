import React, { useState, useEffect } from "react";
import AppointmentCard from "./AppointmentCard";
import { Appointment } from "../../types/appointment";
import { getMockAppointments } from "../../utils/mockAppointments";

interface Props {
  selectedDate: Date;
}

const TimelineView: React.FC<Props> = ({ selectedDate }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  // Load mock appointments for the selected date
  useEffect(() => {
    const mockAppointments = getMockAppointments(selectedDate);
    setAppointments(mockAppointments);
  }, [selectedDate]);

  // Generate hours dynamically based on earliest and latest appointments
  const hours = (() => {
    if (appointments.length === 0) return Array.from({ length: 16 }, (_, i) => i + 8);

    const startHour = Math.min(
      ...appointments.map(a => new Date(a.startTime).getHours()),
      8
    );
    const endHour = Math.max(
      ...appointments.map(a => new Date(a.endTime).getHours()),
      23
    );

    return Array.from({ length: endHour - startHour + 1 }, (_, i) => i + startHour);
  })();

  // Position an appointment on the timeline
  const getAppointmentPosition = (appointment: Appointment) => {
    const startTime = new Date(appointment.startTime);
    const endTime = new Date(appointment.endTime);

    const startMinutes = startTime.getHours() * 60 + startTime.getMinutes();
    const endMinutes = endTime.getHours() * 60 + endTime.getMinutes();

    const durationMinutes = endMinutes - startMinutes;

    const topPosition = (startMinutes - hours[0] * 60) * 1.25; // relative to first hour
    const height = durationMinutes * 1.25;

    return {
      top: `${topPosition}px`,
      height: `${height}px`
    };
  };

  // Filter appointments for the selected date
  const filteredAppointments = appointments.filter(
    appt => new Date(appt.startTime).toDateString() === selectedDate.toDateString()
  );

  // Current time indicator
  const isToday = selectedDate.toDateString() === new Date().toDateString();

  const getCurrentTimePosition = () => {
    const now = currentTime;
    const hoursNow = now.getHours();
    const minutes = now.getMinutes();
    const totalMinutes = hoursNow * 60 + minutes;

    if (hoursNow < hours[0] || hoursNow > hours[hours.length - 1]) {
      return { display: "none" };
    }

    return {
      display: isToday ? "block" : "none",
      top: `${(totalMinutes - hours[0] * 60) * 1.25}px`
    };
  };

  // Format time for tooltip
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="timeline-view">
      <div className="timeline-container">
        {/* Hours timeline */}
        <div className="timeline-hours">
          {hours.map(hour => (
            <div key={`hour-${hour}`} className="timeline-hour">
              <div className="hour-label">
                {hour % 12 || 12} {hour >= 12 ? "PM" : "AM"}
              </div>
              <div className="hour-line"></div>
            </div>
          ))}
        </div>

        {/* Current time indicator */}
        <div className="current-time-indicator" style={getCurrentTimePosition()}>
          <div
            className="current-time-dot"
            title={`Current time: ${formatTime(currentTime)}`}
          ></div>
          <div className="current-time-line"></div>
        </div>

        {/* Appointments */}
        <div className="appointments-container">
          {filteredAppointments.map(appointment => (
            <div
              key={appointment.id}
              className="appointment-wrapper"
              style={getAppointmentPosition(appointment)}
            >
              <AppointmentCard appointment={appointment} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TimelineView;
