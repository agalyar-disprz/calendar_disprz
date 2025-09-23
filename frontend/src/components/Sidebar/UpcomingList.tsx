import React, { useState, useEffect } from "react";
import { Appointment } from "../../types/appointment";
import { useAuth } from "../../contexts/AuthContext";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { IconButton, Tooltip, Box, Typography } from "@mui/material";

interface UpcomingListProps {
  searchTerm: string;
  appointments: Appointment[];
  onEdit?: (appointment: Appointment) => void;
  onDelete?: (id: number) => void;
  selectedDate?: Date; // Date selected from mini calendar
}

const UpcomingList: React.FC<UpcomingListProps> = ({
  searchTerm,
  appointments,
  onEdit,
  onDelete,
  selectedDate
}) => {
  const { currentUser } = useAuth();
  
  // Use selectedDate if provided, otherwise default to today
  const targetDate = selectedDate || new Date();
  
  // Function to check if two dates are the same day
  const isSameDay = (date1: Date, date2: Date) => {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  };
  
  // Filter appointments for the selected day
  const dayMeetings = appointments.filter((appointment) => {
    const appointmentDate = new Date(appointment.startTime);
    return isSameDay(appointmentDate, targetDate);
  });
  
  // Calculate completed meetings for the selected day
  const [completedCount, setCompletedCount] = useState<number>(0);
  
  useEffect(() => {
    const updateCompleted = () => {
      const now = new Date();
      // Only count meetings that have ended
      const completed = dayMeetings.filter(
        (meeting) => new Date(meeting.endTime) < now
      ).length;
      setCompletedCount(completed);
    };
    
    updateCompleted(); // initial calculation
    
    // Auto-update completed count every 1 min
    const interval = setInterval(updateCompleted, 60000);
    return () => clearInterval(interval);
  }, [dayMeetings]);

  // Sort by start time
  const sortedMeetings = [...dayMeetings].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );

  // Enhanced search filter - search through title, location, time, and attendees
  const filteredMeetings = sortedMeetings.filter((meeting) => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    const startTime = new Date(meeting.startTime);
    
    // Format time in 24-hour format (railway time)
    const formattedTime = `${startTime
      .getHours()
      .toString()
      .padStart(2, "0")}:${startTime
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;
    
    // Search in title
    const titleMatch = meeting.title.toLowerCase().includes(searchLower);
    
    // Search in location
    const locationMatch = meeting.location?.toLowerCase().includes(searchLower) || false;
    
    // Search in time
    const timeMatch = formattedTime.includes(searchLower);
    
    // Search in description
    const descriptionMatch = meeting.description?.toLowerCase().includes(searchLower) || false;
    
    // Search in attendees (split by comma and check each attendee)
    const attendeesMatch = meeting.attendees
      ?.split(',')
      .some(attendee => attendee.trim().toLowerCase().includes(searchLower)) || false;
    
    return titleMatch || locationMatch || timeMatch || descriptionMatch || attendeesMatch;
  });

  // Format the date for display
  const formatDate = (date: Date) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (isSameDay(date, today)) {
      return "Today's";
    } else if (isSameDay(date, tomorrow)) {
      return "Tomorrow's";
    } else if (isSameDay(date, yesterday)) {
      return "Yesterday's";
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  return (
    <div className="upcoming-list">
      <h3>{formatDate(targetDate)} Meetings ({completedCount} of {dayMeetings.length} completed)</h3>
      
      {filteredMeetings.length === 0 ? (
        <div className="no-results">
          {searchTerm 
            ? `No meetings found matching "${searchTerm}"` 
            : `No meetings scheduled for ${formatDate(targetDate).toLowerCase()}`}
        </div>
      ) : (
        <ul>
          {filteredMeetings.map((meeting) => {
            const startTime = new Date(meeting.startTime);
            const endTime = new Date(meeting.endTime);
            const isCompleted = endTime < new Date();
            return (
              <li key={meeting.id} className={isCompleted ? "completed" : ""}>
                <Tooltip
                  title={
                    <Box>
                      <Typography variant="body2">{meeting.title}</Typography>
                      {meeting.location && (
                        <Typography variant="caption" display="block">
                          Location: {meeting.location}
                        </Typography>
                      )}
                      {meeting.attendees && (
                        <Typography variant="caption" display="block">
                          Attendees: {meeting.attendees}
                        </Typography>
                      )}
                      {meeting.description && (
                        <Typography variant="caption" display="block">
                          {meeting.description}
                        </Typography>
                      )}
                    </Box>
                  }
                  placement="right"
                  arrow
                >
                  <Box sx={{ flex: 1 }}>
                    <div className="meeting-info">
                      <span className="meeting-time">
                        {startTime
                          .getHours()
                          .toString()
                          .padStart(2, "0")}
                        :
                        {startTime
                          .getMinutes()
                          .toString()
                          .padStart(2, "0")}
                      </span>
                      <span className="meeting-title">{meeting.title}</span>
                      {meeting.location && (
                        <span className="meeting-location">@ {meeting.location}</span>
                      )}
                    </div>
                    {meeting.attendees && (
                      <Typography
                        variant="caption"
                        sx={{
                          display: 'block',
                          color: 'text.secondary',
                          fontSize: '0.7rem',
                          mt: 0.5,
                          ml: 4.5
                        }}
                      >
                        With: {meeting.attendees}
                      </Typography>
                    )}
                  </Box>
                </Tooltip>
                {!isCompleted && onEdit && onDelete && (
                  <div className="meeting-actions">
                    <IconButton
                      size="small"
                      onClick={() => onEdit(meeting)}
                      aria-label="Edit meeting"
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => onDelete(meeting.id)}
                      aria-label="Delete meeting"
                      color="error"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default UpcomingList;
