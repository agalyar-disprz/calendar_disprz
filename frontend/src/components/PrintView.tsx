import React, { useEffect } from 'react';
import { format, addDays, startOfWeek, isSameDay, startOfMonth, getDaysInMonth, isSameMonth } from 'date-fns';
import { Appointment } from '../types/appointment';
interface PrintViewProps {
  selectedDate: Date;
  appointments: any[];
  viewType: 'daily' | 'weekly' | 'monthly';
}

// Define an interface for date data with appointments
interface DateWithAppointments {
  date: Date;
  appointments: Appointment[];
}

const PrintView: React.FC<PrintViewProps> = ({
  selectedDate,
  appointments,
  viewType
}) => {
  // Log when component renders for debugging
  useEffect(() => {
    console.log("PrintView rendered with:", {
      selectedDate,
      appointmentsCount: appointments.length,
      viewType
    });
  }, [selectedDate, appointments, viewType]);

  // Format date for header
  const formatDateHeader = (date: Date) => {
    return format(date, 'MMMM d, yyyy');
  };
  
  // Get appointments for a specific date
  const getAppointmentsForDate = (date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    return appointments.filter(appointment => {
      const appointmentDate = format(new Date(appointment.startTime), 'yyyy-MM-dd');
      return appointmentDate === dateString;
    });
  };
  
  // Format time range
  const formatTimeRange = (start: Date, end: Date) => {
    return `${format(start, 'h:mm a')} - ${format(end, 'h:mm a')}`;
  };
  
  // Check if an appointment is completed
  const isAppointmentCompleted = (appointment: Appointment): boolean => {
    const now = new Date();
    const endTime = new Date(appointment.endTime);
    return endTime < now;
  };
  
  // Render daily view
  const renderDailyView = () => {
    const dayAppointments = getAppointmentsForDate(selectedDate);
    
    return (
      <div className="daily-view">
        <h2>Schedule for {formatDateHeader(selectedDate)}</h2>
        <div className="appointments-list">
          {dayAppointments.length > 0 ? (
            dayAppointments.map((appointment, index: number) => (
              <div key={index} className="appointment-item">
                <div className="appointment-time">
                  {formatTimeRange(
                    new Date(appointment.startTime),
                    new Date(appointment.endTime)
                  )}
                </div>
                <div className="appointment-title">
                  {appointment.title}
                  {isAppointmentCompleted(appointment) && <span className="appointment-completed"> (Completed)</span>}
                </div>
                {appointment.location && (
                  <div className="appointment-location">Location: {appointment.location}</div>
                )}
                {appointment.description && (
                  <div className="appointment-description">{appointment.description}</div>
                )}
                {appointment.attendees && (
                  <div className="appointment-attendees">Attendees: {appointment.attendees}</div>
                )}
              </div>
            ))
          ) : (
            <p className="empty-day-message">No appointments scheduled for this day.</p>
          )}
        </div>
      </div>
    );
  };
  
  // Render weekly view - MODIFIED to only show days with appointments
  const renderWeeklyView = () => {
    const weekStart = startOfWeek(selectedDate);
    const allWeekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    
    // Filter to only include days that have appointments
    const daysWithAppointments = allWeekDays.filter(day => 
      getAppointmentsForDate(day).length > 0
    );
    
    // If no days have appointments, show a message instead of empty grid
    if (daysWithAppointments.length === 0) {
      return (
        <div className="weekly-view">
          <h2>
            {format(weekStart, 'MMM d')} - {format(addDays(weekStart, 6), 'MMM d, yyyy')}
          </h2>
          <p className="empty-week-message">No appointments scheduled for this week.</p>
        </div>
      );
    }
    
    return (
      <div className="weekly-view">
        <h2>
          {format(weekStart, 'MMM d')} - {format(addDays(weekStart, 6), 'MMM d, yyyy')}
        </h2>
        
        <div className="week-grid" style={{ 
          gridTemplateColumns: `repeat(${daysWithAppointments.length}, 1fr)` 
        }}>
          {daysWithAppointments.map((day, index: number) => {
            const dayAppointments = getAppointmentsForDate(day);
            const isToday = isSameDay(day, new Date());
            
            return (
              <div key={index} className={`day-column ${isToday ? 'today-column' : ''}`}>
                <h3 className="day-header">{format(day, 'E, MMM d')}</h3>
                <div className="day-appointments">
                  {dayAppointments.map((appointment, appIndex: number) => {
                    const isCompleted = isAppointmentCompleted(appointment);
                    return (
                      <div key={appIndex} className="appointment-item">
                        <div className="appointment-time">
                          {format(new Date(appointment.startTime), 'h:mm a')}
                        </div>
                        <div className="appointment-title">
                          {appointment.title.length > 20 
                            ? `${appointment.title.substring(0, 18)}...` 
                            : appointment.title}
                          {isCompleted && <span className="appointment-completed">✓</span>}
                        </div>
                        {appointment.location && (
                          <div className="appointment-location">
                            {appointment.location.length > 25 
                              ? `${appointment.location.substring(0, 23)}...` 
                              : appointment.location}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };
  
  // Render monthly view - updated to only show dates with appointments
  const renderMonthlyView = () => {
    // Get the month start and end dates
    const monthStart = startOfMonth(selectedDate);
    const monthEnd = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
    
    // Filter appointments for the current month
    const monthAppointments = appointments.filter(appointment => {
      const appointmentDate = new Date(appointment.startTime);
      return isSameMonth(appointmentDate, selectedDate);
    });
    
    // Group appointments by date
    const appointmentsByDate = new Map<string, DateWithAppointments>();
    
    monthAppointments.forEach(appointment => {
      const appointmentDate = new Date(appointment.startTime);
      const dateKey = format(appointmentDate, 'yyyy-MM-dd');
      
      if (!appointmentsByDate.has(dateKey)) {
        appointmentsByDate.set(dateKey, {
          date: new Date(appointmentDate),
          appointments: []
        });
      }
      
      appointmentsByDate.get(dateKey)?.appointments.push(appointment);
    });
    
    // Convert map to array and sort by date
    const datesWithAppointments = Array.from(appointmentsByDate.values())
      .sort((a, b) => a.date.getTime() - b.date.getTime());
    
    return (
      <div className="monthly-view">
        <h2>{format(selectedDate, 'MMMM yyyy')} - Appointments</h2>
        
        {datesWithAppointments.length > 0 ? (
          <div className="month-dates-list">
            {datesWithAppointments.map((dateData: DateWithAppointments, dateIndex: number) => (
              <div key={dateIndex} className="month-date-section">
                <h3 className="month-date-header">
                  {format(dateData.date, 'EEEE, MMMM d, yyyy')}
                </h3>
                
                <div className="month-date-appointments">
                  {dateData.appointments.map((appointment: Appointment, appIndex: number) => {
                    const isCompleted = isAppointmentCompleted(appointment);
                    return (
                      <div key={appIndex} className="appointment-item">
                        <div className="appointment-time">
                          {formatTimeRange(
                            new Date(appointment.startTime),
                            new Date(appointment.endTime)
                          )}
                        </div>
                        <div className="appointment-title">
                          {appointment.title}
                          {isCompleted && <span className="appointment-completed"> (Completed)</span>}
                        </div>
                        {appointment.location && (
                          <div className="appointment-location">Location: {appointment.location}</div>
                        )}
                        {appointment.description && (
                          <div className="appointment-description">{appointment.description}</div>
                        )}
                        {appointment.attendees && (
                          <div className="appointment-attendees">Attendees: {appointment.attendees}</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="empty-month-message">No appointments scheduled for this month.</p>
        )}
      </div>
    );
  };
  
  // Check if there are any appointments to display based on the view type
  const hasAppointmentsToDisplay = () => {
    if (viewType === 'daily') {
      return getAppointmentsForDate(selectedDate).length > 0;
    } else if (viewType === 'weekly') {
      const weekStart = startOfWeek(selectedDate);
      const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
      return weekDays.some(day => getAppointmentsForDate(day).length > 0);
    } else { // monthly
      return appointments.some(appointment => {
        const appointmentDate = new Date(appointment.startTime);
        return isSameMonth(appointmentDate, selectedDate);
      });
    }
  };
  
  // If no appointments to display, show a message instead of empty content
  if (!hasAppointmentsToDisplay()) {
    return (
      <div className="print-view print-no-appointments">
        <h2>No Appointments to Display</h2>
        <p className="empty-print-message">
          There are no appointments scheduled for the selected {viewType === 'daily' ? 'day' : viewType === 'weekly' ? 'week' : 'month'}.
        </p>
      </div>
    );
  }
  
  return (
    <div className="print-view">
      {viewType === 'daily' ? renderDailyView() : 
       viewType === 'weekly' ? renderWeeklyView() : 
       renderMonthlyView()}
    </div>
  );
};

export default PrintView;
