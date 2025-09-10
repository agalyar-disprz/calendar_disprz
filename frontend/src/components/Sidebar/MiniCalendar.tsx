import React from "react";

interface Props {
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
}

const MiniCalendar: React.FC<Props> = ({ selectedDate }) => {
  return (
    <div className="mini-calendar">
      <h3>{selectedDate.toLocaleString("default", { month: "long", year: "numeric" })}</h3>
      <p>[Mini Calendar Placeholder]</p>
    </div>
  );
};

export default MiniCalendar;
