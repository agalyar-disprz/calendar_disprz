import React, { useRef, useEffect, useState } from "react";
import { Appointment, getAppointmentColor } from "../../types/appointment";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import PeopleIcon from "@mui/icons-material/People";
import { IconButton, Tooltip, Box } from "@mui/material";

interface Props {
  appointment: Appointment;
  onEdit?: (appointment: Appointment) => void;
  onDelete?: (id: number) => void;
  formatTime?: (date: Date) => string;
  isCompleted?: boolean;
}

const AppointmentCard: React.FC<Props> = ({
  appointment,
  onEdit,
  onDelete,
  formatTime = (date: Date) => {
    return `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
  },
  isCompleted = false
}) => {
  const startDate = new Date(appointment.startTime);
  const endDate = new Date(appointment.endTime);
  const cardRef = useRef<HTMLDivElement>(null);
  const [isCompact, setIsCompact] = useState(false);
  
  // Get the color based on appointment type
  const typeColor = getAppointmentColor(appointment.type);
  
  // Calculate duration in minutes
  const durationMinutes =
    (endDate.getTime() - startDate.getTime()) / (1000 * 60);
  
  // Check if the appointment is short (less than or equal to 30 minutes)
  useEffect(() => {
    if (cardRef.current) {
      // If duration is less than or equal to 30 minutes or card height is less than 50px
      setIsCompact(durationMinutes <= 30 || cardRef.current.clientHeight < 50);
    }
  }, [durationMinutes, appointment]);

  // Determine if appointment is completed if not explicitly provided
  const isComplete = isCompleted || (new Date(appointment.endTime) < new Date());
  
  // Styles for completed appointments
  const cardStyles = {
    borderLeftColor: isComplete ? '#8bc34a' : typeColor,
    opacity: isComplete ? 0.8 : 1
  };

  // Compact view for both short appointments and completed appointments
  const shouldUseCompactView = isCompact || (isComplete && durationMinutes < 60);

  return (
    <div
      ref={cardRef}
      className={`appointment-card ${shouldUseCompactView ? 'appointment-card-compact' : ''} ${isComplete ? 'completed-appointment' : ''}`}
      style={cardStyles}
    >
      {shouldUseCompactView ? (
        // Compact horizontal layout
        <Tooltip
          title={
            <div>
              <div><strong>{appointment.title}</strong></div>
              <div>{formatTime(startDate)} - {formatTime(endDate)}</div>
              {appointment.location && <div>Location: {appointment.location}</div>}
              {appointment.attendees && (
                <div>
                  <PeopleIcon fontSize="small" style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                  Attendees: {appointment.attendees}
                </div>
              )}
              {appointment.description && <div>{appointment.description}</div>}
              {isComplete && <div style={{ color: '#8bc34a', fontStyle: 'italic' }}>Completed</div>}
            </div>
          }
          arrow
          placement="top"
        >
          <div className="appointment-compact-content">
            <div className="appointment-compact-main">
              <div className="appointment-compact-header">
                {isComplete && <span className="appointment-compact-check">✓</span>}
                <span className="appointment-compact-title">{appointment.title}</span>
                <span className="appointment-compact-time">{formatTime(startDate)}</span>
              </div>
              
              {/* Always show location, attendees and/or description if available */}
              {(appointment.location || appointment.attendees || appointment.description) && (
                <div className="appointment-compact-details">
                  {appointment.location && (
                    <span className="appointment-compact-location">@ {appointment.location}</span>
                  )}
                  {appointment.attendees && (
                    <span className="appointment-compact-attendees">
                      {appointment.location ? " • " : ""}
                      <PeopleIcon fontSize="small" style={{ verticalAlign: 'middle', marginRight: '2px' }} />
                      {appointment.attendees.split(',').length} attendee{appointment.attendees.split(',').length > 1 ? 's' : ''}
                    </span>
                  )}
                  {appointment.description && (
                    <span className="appointment-compact-description">
                      {(appointment.location || appointment.attendees) ? " - " : ""}{appointment.description}
                    </span>
                  )}
                </div>
              )}
            </div>
            
            {/* Action buttons */}
            {!isComplete && onEdit && onDelete && (
              <div className="appointment-actions">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(appointment);
                  }}
                  aria-label="Edit appointment"
                  className="edit-button"
                >
                  <EditIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(appointment.id);
                  }}
                  aria-label="Delete appointment"
                  color="error"
                  className="delete-button"
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </div>
            )}
          </div>
        </Tooltip>
      ) : (
        // Regular vertical layout for normal appointments
        <>
          <div className="appointment-header">
            <h3 className="appointment-title">
              {isComplete && <span style={{ marginRight: '4px', color: '#8bc34a' }}>✓</span>}
              {appointment.title}
            </h3>
            {/* Only show action buttons if not completed */}
            {!isComplete && (
              <div className="appointment-actions">
                {onEdit && (
                  <IconButton
                    size="small"
                    onClick={() => onEdit(appointment)}
                    aria-label="Edit appointment"
                    className="edit-button"
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                )}
                {onDelete && (
                  <IconButton
                    size="small"
                    onClick={() => onDelete(appointment.id)}
                    aria-label="Delete appointment"
                    color="error"
                    className="delete-button"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                )}
              </div>
            )}
          </div>
          <div className="appointment-time">
            {formatTime(startDate)} - {formatTime(endDate)}
          </div>
          {appointment.location && (
            <div className="appointment-location">
              @ {appointment.location}
            </div>
          )}
          {appointment.attendees && (
            <div className="appointment-attendees">
              <PeopleIcon fontSize="small" style={{ verticalAlign: 'middle', marginRight: '4px' }} />
              {appointment.attendees}
            </div>
          )}
          {appointment.description && (
            <div className="appointment-description">{appointment.description}</div>
          )}
          {isComplete && (
            <div className="appointment-completed-status">
              Completed
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AppointmentCard;
