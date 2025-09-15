import React, { useState, useEffect } from "react";
import { Appointment } from "../../types/appointment";
import LightbulbOutlinedIcon from "@mui/icons-material/LightbulbOutlined";
import { Alert } from "@mui/material";

interface UpcomingListProps {
  searchTerm: string;
  appointments: Appointment[];
}

const UpcomingList: React.FC<UpcomingListProps> = ({ searchTerm, appointments }) => {
  const [completedCount, setCompletedCount] = useState<number>(0);

  useEffect(() => {
    const updateCompleted = () => {
      const now = new Date();
      const completed = appointments.filter(
        (meeting) => new Date(meeting.endTime) < now
      ).length;
      setCompletedCount(completed);
    };

    updateCompleted(); // initial calculation

    // ✅ Auto-update completed count every 1 min
    const interval = setInterval(updateCompleted, 60000);
    return () => clearInterval(interval);
  }, [appointments]);

  // ✅ Filter today's appointments only
  const today = new Date();
  const todayStart = new Date(today.setHours(0, 0, 0, 0));
  const todayEnd = new Date(today.setHours(23, 59, 59, 999));

  const todaysMeetings = appointments.filter((appointment) => {
    const appointmentDate = new Date(appointment.startTime);
    return appointmentDate >= todayStart && appointmentDate <= todayEnd;
  });

  // Sort by start time
  const sortedMeetings = [...todaysMeetings].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );

  // Apply search filter
  const filteredMeetings = sortedMeetings.filter((meeting) => {
    const startTime = new Date(meeting.startTime);
    const formattedTime = `${startTime
      .getHours()
      .toString()
      .padStart(2, "0")}:${startTime
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;

    return (
      meeting.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      formattedTime.includes(searchTerm) ||
      formattedTime.replace(":", "").includes(searchTerm)
    );
  });

  return (
    <div className="upcoming-list">
      <h3>Recent & Upcoming</h3>

      {/* Completed counter */}
      <Alert
        icon={<LightbulbOutlinedIcon fontSize="small" />}
        severity="info"
        sx={{ mb: 2 }}
      >
        {completedCount}/{todaysMeetings.length} meetings completed today
      </Alert>

      <ul>
        {filteredMeetings.map((meeting) => {
          const startTime = new Date(meeting.startTime);
          const isCompleted = new Date(meeting.endTime) < new Date();

          return (
            <li key={meeting.id} className={isCompleted ? "completed" : ""}>
              {startTime.getHours().toString().padStart(2, "0")}:
              {startTime.getMinutes().toString().padStart(2, "0")} -{" "}
              {meeting.title}
            </li>
          );
        })}
        {filteredMeetings.length === 0 && (
          <li className="no-results">No matching appointments</li>
        )}
      </ul>
    </div>
  );
};

export default UpcomingList;
