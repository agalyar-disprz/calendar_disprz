import React from "react";
import { Appointment } from "../../types/appointment";

interface Props {
  appointment: Appointment;
}

const AppointmentCard: React.FC<Props> = ({ appointment }) => {
  // Format time from ISO string to readable format
  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };


  const startTime = formatTime(appointment.startTime);
  const endTime = formatTime(appointment.endTime);

  return (
    <div className="appointment-card ">
      <div className="appointment-time">
        {startTime} - {endTime}
      </div>
      <div className="appointment-content">
        <h4>{appointment.title}</h4>
        {appointment.description && <p>{appointment.description}</p>}
      </div>
    </div>
  );
};

export default AppointmentCard;
