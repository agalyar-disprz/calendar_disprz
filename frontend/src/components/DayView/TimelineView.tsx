import React from "react";
import AppointmentCard from "./AppointmentCard";

interface Props {
  selectedDate: Date;
}

const TimelineView: React.FC<Props> = ({ selectedDate }) => {
  return (
    <div className="timeline-view">
      <h3>Appointments for {selectedDate.toDateString()}</h3>
      <AppointmentCard title="Strategic Planning" time="09:00 - 10:30" />
      <AppointmentCard title="Client Presentation" time="11:00 - 12:00" />
      <AppointmentCard title="Feature Review" time="14:00 - 15:30" />
    </div>
  );
};

export default TimelineView;
