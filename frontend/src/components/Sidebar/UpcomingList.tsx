import React, { useState, useEffect } from "react";
import { Appointment } from "../../types/appointment";
import { getMockAppointments } from "../../utils/mockAppointments";
import LightbulbOutlinedIcon from "@mui/icons-material/LightbulbOutlined";
import { Alert } from "@mui/material";

interface UpcomingListProps {
  searchTerm: string;
}
const UpcomingList: React.FC<UpcomingListProps> = ({ searchTerm }) => {
  const [meetings, setMeetings] = useState<Appointment[]>([]);
  const [completedCount, setCompletedCount] = useState<number>(0);

  useEffect(() => {
    const today = new Date();
    const todaysMeetings = getMockAppointments(today);
    setMeetings(todaysMeetings);

    const now = new Date();
    const completed = todaysMeetings.filter(
      (meeting) => new Date(meeting.endTime) < now
    ).length;
    setCompletedCount(completed);

    const timer = setInterval(() => {
      const currentTime = new Date();
      const updatedCompleted = todaysMeetings.filter(
        (meeting) => new Date(meeting.endTime) < currentTime
      ).length;
      setCompletedCount(updatedCompleted);
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  // Sort meetings by start time
  const sortedMeetings = [...meetings].sort(
    (a, b) =>
      new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );

  // ✅ Apply search filter (title + time)
  const filteredMeetings = sortedMeetings.filter((meeting) => {
    const startTime = new Date(meeting.startTime);
    const formattedTime = `${startTime
      .getHours()
      .toString()
      .padStart(2, "0")}:${startTime.getMinutes().toString().padStart(2, "0")}`;

    return (
      meeting.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      formattedTime.includes(searchTerm) ||
      formattedTime.replace(":", "").includes(searchTerm)
    );
  });

  return (
    <div className="upcoming-list">
      <h3>Recent & Upcoming</h3>

      {/* Hint Alert */}
      <Alert
        icon={<LightbulbOutlinedIcon fontSize="small" />}
        severity="info"
        sx={{ mb: 2 }}
      >
        {completedCount}/{meetings.length} meetings completed today
      </Alert>

      <ul>
        {filteredMeetings.map((meeting) => {
          const startTime = new Date(meeting.startTime);
          const isCompleted = new Date(meeting.endTime) < new Date();

          return (
            <li
              key={meeting.id}
              className={isCompleted ? "completed" : ""}
            >
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
