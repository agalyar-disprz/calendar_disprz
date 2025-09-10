import React from "react";

interface Props {
  selectedDate: Date;
  onPrevDay: () => void;
  onNextDay: () => void;
  onNewAppointment: () => void;
}

const DateHeader: React.FC<Props> = ({ selectedDate, onPrevDay, onNextDay, onNewAppointment }) => {
  return (
    <div className="date-header">
      <button onClick={onPrevDay}>{"<"}</button>
      <h2>{selectedDate.toDateString()}</h2>
      <button onClick={onNextDay}>{">"}</button>
      <button className="new-btn" onClick={onNewAppointment}>
        + New Appointment
      </button>
    </div>
  );
};

export default DateHeader;
