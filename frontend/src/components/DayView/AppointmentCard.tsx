import React from "react";

interface Props {
  title: string;
  time: string;
}

const AppointmentCard: React.FC<Props> = ({ title, time }) => {
  return (
    <div className="appointment-card">
      <strong>{title}</strong>
      <p>{time}</p>
    </div>
  );
};

export default AppointmentCard;
