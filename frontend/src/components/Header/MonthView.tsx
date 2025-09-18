import React, { useState, useCallback, useMemo } from "react";
import { Appointment, getAppointmentColor, APPOINTMENT_TYPES } from "../../types/appointment";
import { Paper, Typography, Box, Tooltip, Popover } from "@mui/material";

interface MonthViewProps {
  selectedDate: Date;
  appointments: Appointment[];
  onEdit?: (appointment: Appointment) => void;
  onDelete?: (id: number) => void;
}

const MonthView: React.FC<MonthViewProps> = ({
  selectedDate,
  appointments,
  onEdit,
  onDelete,
}) => {
  // State for popover
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [hoveredDay, setHoveredDay] = useState<Date | null>(null);
  
  // Helper function to check if an appointment is in the past
  const isAppointmentCompleted = useCallback((appointment: Appointment): boolean => {
    const now = new Date();
    const endTime = new Date(appointment.endTime);
    return endTime < now;
  }, []);

  // Get all days in the month - memoized to prevent recalculation on every render
  const days = useMemo(() => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    // Get the day of the week for the first day (0 = Sunday, 1 = Monday, etc.)
    const firstDayOfWeek = firstDay.getDay();
    // Calculate how many days from the previous month we need to show
    const daysFromPrevMonth = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
    // Create an array for all days we need to display
    const allDays = [];
    // Add days from previous month
    const prevMonth = new Date(year, month, 0);
    const prevMonthDays = prevMonth.getDate();
    for (
      let i = prevMonthDays - daysFromPrevMonth + 1;
      i <= prevMonthDays;
      i++
    ) {
      const date = new Date(year, month - 1, i);
      allDays.push({ date, isCurrentMonth: false });
    }
    // Add days from current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const date = new Date(year, month, i);
      allDays.push({ date, isCurrentMonth: true });
    }
    // Add days from next month to complete the grid (6 rows x 7 days = 42 cells)
    const remainingDays = 42 - allDays.length;
    for (let i = 1; i <= remainingDays; i++) {
      const date = new Date(year, month + 1, i);
      allDays.push({ date, isCurrentMonth: false });
    }
    return allDays;
  }, [selectedDate]);

  // Group appointments by day - memoized for performance
  const appointmentsByDay = useMemo(() => {
    const map = new Map<string, Appointment[]>();
    
    appointments.forEach(appointment => {
      const appointmentDate = new Date(appointment.startTime);
      const dateKey = `${appointmentDate.getFullYear()}-${appointmentDate.getMonth()}-${appointmentDate.getDate()}`;
      
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      
      map.get(dateKey)?.push(appointment);
    });
    
    // Sort appointments for each day
    map.forEach((dayAppointments) => {
      dayAppointments.sort((a: Appointment, b: Appointment) => 
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      );
    });
    
    return map;
  }, [appointments]);

  // Get appointments for a specific day - optimized with the map
  const getAppointmentsForDay = useCallback((date: Date): Appointment[] => {
    const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    return appointmentsByDay.get(dateKey) || [];
  }, [appointmentsByDay]);

  // Format appointment for display in month cell
  const formatAppointment = useCallback((appointment: Appointment): string => {
    const startTime = new Date(appointment.startTime);
    return `${startTime.getHours().toString().padStart(2, "0")}:${startTime
      .getMinutes()
      .toString()
      .padStart(2, "0")} - ${appointment.title}`;
  }, []);

  // Check if a date is today - memoized to avoid recalculation
  const today = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
  }, []);
  
  const isToday = useCallback((date: Date): boolean => {
    return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}` === today;
  }, [today]);

  // Calculate width for each day cell
  const cellWidth = 100 / 7;
  
  // Debounce timer for hover
  const [hoverTimer, setHoverTimer] = useState<NodeJS.Timeout | null>(null);
  
  // Handle mouse enter for day cell - with debounce to prevent flickering
  const handleDayMouseEnter = useCallback((event: React.MouseEvent<HTMLElement>, date: Date) => {
    // Clear any existing timer
    if (hoverTimer) {
      clearTimeout(hoverTimer);
    }
    
    // Set a new timer to delay showing the popover
    const timer = setTimeout(() => {
      const dayAppointments = getAppointmentsForDay(date);
      if (dayAppointments.length > 3) {
        setHoveredDay(date);
        setAnchorEl(event.currentTarget);
      }
    }, 300); // 300ms delay to prevent accidental triggers
    
    setHoverTimer(timer);
  }, [getAppointmentsForDay, hoverTimer]);
  
  // Handle mouse leave for day cell
  const handleDayMouseLeave = useCallback(() => {
    // Clear the timer if mouse leaves before popover is shown
    if (hoverTimer) {
      clearTimeout(hoverTimer);
      setHoverTimer(null);
    }
    
    // Don't immediately close the popover to allow mouse to move to it
    // The popover will close when mouse leaves it (handled by PaperProps.onMouseLeave)
  }, [hoverTimer]);
  
  // Handle popover close
  const handlePopoverClose = useCallback(() => {
    setHoveredDay(null);
    setAnchorEl(null);
  }, []);
  
  // Handle clicking on "more" text to show popover
  const handleMoreClick = useCallback((event: React.MouseEvent<HTMLElement>, date: Date) => {
    event.stopPropagation();
    setHoveredDay(date);
    setAnchorEl(event.currentTarget.parentElement?.parentElement || null);
  }, []);
  
  // Format date for popover header
  const formatDateHeader = useCallback((date: Date): string => {
    return date.toLocaleDateString(undefined, { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric' 
    });
  }, []);

  // Handle appointment click
  const handleAppointmentClick = useCallback((e: React.MouseEvent, appointment: Appointment) => {
    e.stopPropagation(); // Prevent event bubbling
    if (onEdit) {
      onEdit(appointment);
    }
    handlePopoverClose();
  }, [onEdit, handlePopoverClose]);

  return (
    <div className="month-view">
      <Box sx={{ display: "flex", flexWrap: "wrap", width: "100%" }}>
        {/* Weekday headers */}
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, index) => (
          <Box
            key={`header-${index}`}
            sx={{
              width: `${cellWidth}%`,
              textAlign: "center",
              py: 1,
              fontWeight: "bold",
            }}
          >
            {day}
          </Box>
        ))}
        
        {/* Calendar days */}
        {days.map((day, index) => {
          const dayAppointments = getAppointmentsForDay(day.date);
          const hasMoreAppointments = dayAppointments.length > 3;
          
          return (
            <Box
              key={`day-${index}`}
              sx={{ width: `${cellWidth}%`, padding: "2px" }}
            >
              <Paper
                elevation={0}
                sx={{
                  height: "120px",
                  p: 1,
                  bgcolor: isToday(day.date)
                    ? "#e3f2fd"
                    : day.isCurrentMonth
                    ? "white"
                    : "#f5f5f5",
                  opacity: day.isCurrentMonth ? 1 : 0.7,
                  border: isToday(day.date)
                    ? "1px solid #1976d2"
                    : "1px solid #e0e0e0",
                  overflow: "hidden",
                  position: "relative",
                  cursor: hasMoreAppointments ? "pointer" : "default",
                }}
                onMouseEnter={hasMoreAppointments ? (e) => handleDayMouseEnter(e, day.date) : undefined}
                onMouseLeave={hasMoreAppointments ? handleDayMouseLeave : undefined}
              >
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: isToday(day.date) ? "bold" : "normal",
                    color: isToday(day.date) ? "primary.main" : "inherit",
                  }}
                >
                  {day.date.getDate()}
                </Typography>
                <Box sx={{ mt: 1, fontSize: "0.75rem" }}>
                  {/* Display first 3 appointments */}
                  {dayAppointments.slice(0, 3).map((appointment: Appointment) => {
                    const isCompleted = isAppointmentCompleted(appointment);
                    // Get color based on appointment type
                    const appointmentColor = getAppointmentColor(appointment.type);
                    
                    return (
                      <Tooltip
                        key={appointment.id}
                        title={
                          <div>
                            <div><strong>{appointment.title}</strong></div>
                            <div>{formatAppointment(appointment)}</div>
                            {appointment.location && <div>Location: {appointment.location}</div>}
                            {appointment.type && (
                              <div style={{ 
                                marginTop: '4px', 
                                color: appointmentColor, 
                                fontWeight: 'bold' 
                              }}>
                                {APPOINTMENT_TYPES.find(t => t.id === appointment.type)?.label || appointment.type}
                              </div>
                            )}
                          </div>
                        }
                        arrow
                      >
                        <div
                          className={`month-appointment ${isCompleted ? 'completed-appointment' : ''}`}
                          onClick={(e) => handleAppointmentClick(e, appointment)}
                          style={{
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            marginBottom: "2px",
                            padding: "1px 4px",
                            borderRadius: "2px",
                            backgroundColor: isCompleted ? "#f0f0f0" : `${appointmentColor}20`, // Light version of the color
                            color: isCompleted ? "#888" : appointmentColor,
                            borderLeft: `3px solid ${appointmentColor}`
                          }}
                        >
                          {isCompleted && (
                            <span style={{ marginRight: '4px' }}>✓</span>
                          )}
                          {formatAppointment(appointment)}
                        </div>
                      </Tooltip>
                    );
                  })}
                  {hasMoreAppointments && (
                    <Box 
                      sx={{ 
                        textAlign: "center",
                        color: "text.secondary",
                        fontSize: "0.75rem",
                        mt: 0.5,
                        fontWeight: "medium",
                        cursor: "pointer",
                        padding: "2px",
                        borderRadius: "4px",
                        "&:hover": {
                          backgroundColor: "rgba(0, 0, 0, 0.04)",
                          color: "primary.main"
                        }
                      }}
                      onClick={(e) => handleMoreClick(e, day.date)}
                    >
                      +{dayAppointments.length - 3} more
                    </Box>
                  )}
                </Box>
              </Paper>
            </Box>
          );
        })}
      </Box>
      
      {/* Popover to show all appointments for a day */}
      <Popover
        open={Boolean(anchorEl) && Boolean(hoveredDay)}
        anchorEl={anchorEl}
        onClose={handlePopoverClose}
        disableRestoreFocus
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        PaperProps={{
          sx: { 
            width: 300, 
            maxHeight: 400,
            p: 2,
            overflowY: 'auto'
          },
          onMouseLeave: handlePopoverClose
        }}
        sx={{
          pointerEvents: 'auto'
        }}
      >
        {hoveredDay && (
          <>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
              {formatDateHeader(hoveredDay)}
            </Typography>
            
            <div className="appointments-list">
              {getAppointmentsForDay(hoveredDay).map((appointment: Appointment) => {
                const isCompleted = isAppointmentCompleted(appointment);
                const startTime = new Date(appointment.startTime);
                const endTime = new Date(appointment.endTime);
                // Get color based on appointment type
                const appointmentColor = getAppointmentColor(appointment.type);
                
                return (
                  <div 
                    key={appointment.id} 
                    className="appointment-item"
                    style={{ 
                      cursor: 'pointer',
                      marginBottom: '8px',
                      padding: '8px',
                      borderRadius: '4px',
                      border: '1px solid #e0e0e0',
                      borderLeft: `4px solid ${appointmentColor}`,
                      backgroundColor: isCompleted ? '#f9f9f9' : `${appointmentColor}05`, // Very light version of the color
                      transition: 'background-color 0.2s ease'
                    }}
                    onClick={(e) => handleAppointmentClick(e, appointment)}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = isCompleted ? '#f0f0f0' : `${appointmentColor}10`;
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = isCompleted ? '#f9f9f9' : `${appointmentColor}05`;
                    }}
                  >
                    <div className="appointment-time" style={{ fontWeight: 'bold', color: '#555' }}>
                      {startTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {' '}
                      {endTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </div>
                    
                    <div className="appointment-title" style={{ fontSize: '1rem', marginTop: '4px' }}>
                      {appointment.title}
                      {isCompleted && <span style={{ color: '#888', fontStyle: 'italic' }}> (Completed)</span>}
                    </div>
                    
                    {appointment.location && (
                      <div className="appointment-location" style={{ fontSize: '0.85rem', color: '#666', marginTop: '4px' }}>
                        Location: {appointment.location}
                      </div>
                    )}
                    
                    {appointment.type && (
                      <div className="appointment-type" style={{ 
                        fontSize: '0.85rem', 
                        color: appointmentColor, 
                        marginTop: '4px',
                        fontWeight: 'bold'
                      }}>
                        {APPOINTMENT_TYPES.find(t => t.id === appointment.type)?.label || appointment.type}
                      </div>
                    )}
                    
                    {appointment.description && (
                      <div className="appointment-description" style={{ 
                        fontSize: '0.85rem', 
                        color: '#666', 
                        marginTop: '4px',
                        maxHeight: '60px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {appointment.description}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </Popover>
    </div>
  );
};

export default MonthView;
