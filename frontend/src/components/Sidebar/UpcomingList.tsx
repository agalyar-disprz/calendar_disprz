import React from "react";

const UpcomingList: React.FC = () => {
  return (
    <div className="upcoming-list">
      <h3>Recent & Upcoming</h3>
      <ul>
        <li>09:00 - Kickoff Meeting (Confirmed)</li>
        <li>11:30 - One-on-One (Pending)</li>
        <li>14:00 - Feature Review</li>
      </ul>
    </div>
  );
};

export default UpcomingList;
