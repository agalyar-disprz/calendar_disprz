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
}

const UpcomingList: React.FC<UpcomingListProps> = ({
  searchTerm,
  appointments,
  onEdit,
  onDelete
}) => {
  const { currentUser } = useAuth();
  
  // ✅ Filter today's appointments only
  const today = new Date();
  const todayStart = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
    0, 0, 0
  );
  const todayEnd = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
    23, 59, 59, 999
  );
  
  // Get only today's meetings
  const todaysMeetings = appointments.filter((appointment) => {
    const appointmentDate = new Date(appointment.startTime);
    return appointmentDate >= todayStart && appointmentDate <= todayEnd;
  });
  
  // Calculate completed meetings for today only
  const [completedCount, setCompletedCount] = useState<number>(0);
  
  useEffect(() => {
    const updateCompleted = () => {
      const now = new Date();
      // Only count meetings that are scheduled for today AND have ended
      const completed = todaysMeetings.filter(
        (meeting) => new Date(meeting.endTime) < now
      ).length;
      setCompletedCount(completed);
    };
    
    updateCompleted(); // initial calculation
    
    // ✅ Auto-update completed count every 1 min
    const interval = setInterval(updateCompleted, 60000);
    return () => clearInterval(interval);
  }, [todaysMeetings]);

  // Sort by start time
  const sortedMeetings = [...todaysMeetings].sort(
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

  return (
    <div className="upcoming-list">
      <h3>Today's Meetings ({completedCount} of {todaysMeetings.length} completed)</h3>
      
      {filteredMeetings.length === 0 ? (
        <div className="no-results">
          {searchTerm ? `No meetings found matching "${searchTerm}"` : "No meetings scheduled for today"}
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
