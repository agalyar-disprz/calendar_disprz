import React, { useState, useEffect, useRef } from "react";
import DateHeader from "../components/Header/DateHeader";
import MiniCalendar from "../components/Sidebar/MiniCalendar";
import UpcomingList from "../components/Sidebar/UpcomingList";
import SearchBar from "../components/Sidebar/SearchBar";
import TimelineView from "../components/DayView/TimelineView";
import WeekView from "../components/Header/WeekView";
import MonthView from "../components/Header/MonthView";
import AppointmentModal from "../components/Modal/AppointmentModal";
import {
  fetchAppointments,
  fetchAppointmentsWithDateRange,
  deleteAppointment,
  deleteRecurringAppointment
} from "../services/api";
import { Appointment, APPOINTMENT_TYPES } from "../types/appointment";

const CalendarPage: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [view, setView] = useState<"day" | "week" | "month">("day");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | undefined>(undefined);
  const [isEditing, setIsEditing] = useState(false);
  // Add state for sidebar toggle
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
 
  // Initialize with all appointment types selected
  const [selectedTypes, setSelectedTypes] = useState<string[]>(
    APPOINTMENT_TYPES.map(type => type.id)
  );
 
  // Ref to track if auto-refresh is paused
  const autoRefreshPaused = useRef(false);
 
  // Fetch appointments when selected date changes or when modal closes
  useEffect(() => {
    const loadAppointments = async () => {
      // Skip loading if auto-refresh is paused (modal is open)
      if (autoRefreshPaused.current) return;
      
      setIsLoading(true);
      try {
        // Calculate a reasonable date range based on the current view
        let start: Date, end: Date;
        
        if (view === 'day') {
          // For day view, just get appointments for that day +/- 1 day
          start = new Date(selectedDate);
          start.setDate(start.getDate() - 1);
          end = new Date(selectedDate);
          end.setDate(end.getDate() + 1);
        } else if (view === 'week') {
          // For week view, get appointments for the week +/- 1 week
          start = new Date(selectedDate);
          start.setDate(start.getDate() - 7);
          end = new Date(selectedDate);
          end.setDate(end.getDate() + 7);
        } else {
          // For month view, get appointments for the month +/- 1 month
          start = new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1);
          end = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 2, 0);
        }
        
        console.log(`Loading appointments from ${start.toDateString()} to ${end.toDateString()}`);
        
        // Use the new function with date range
        const response = await fetchAppointmentsWithDateRange(start, end);
        
        console.log(`Loaded ${response.data.length} appointments, including recurring instances`);
        console.log(`Recurring appointments: ${response.data.filter(a => a.isRecurring).length}`);
        
        setAppointments(response.data);
      } catch (error) {
        console.error("Failed to fetch appointments:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    // Initial load
    loadAppointments();
    
    // Set up auto-refresh only if modal is not open
    let interval: NodeJS.Timeout | null = null;
    if (!showModal) {
      interval = setInterval(() => {
        // Only refresh if auto-refresh is not paused
        if (!autoRefreshPaused.current) {
          loadAppointments();
        }
      }, 60000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [selectedDate, showModal, view]);
 
  // Update autoRefreshPaused ref when modal state changes
  useEffect(() => {
    autoRefreshPaused.current = showModal;
  }, [showModal]);

  // Add toggle sidebar function
  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
    // Also toggle overlay class
    const overlay = document.querySelector('.sidebar-overlay');
    if (overlay) {
      if (!isSidebarOpen) {
        overlay.classList.add('visible');
      } else {
        overlay.classList.remove('visible');
      }
    }
  };

  // Filter appointments for the UpcomingList only
  const filteredUpcomingAppointments = appointments.filter(appointment => {
    // Filter by type
    const typeMatch = appointment.type && selectedTypes.includes(appointment.type);
    
    // Filter by search term
    if (!searchTerm) return typeMatch;
    
    const search = searchTerm.toLowerCase();
    return typeMatch && (
      appointment.title.toLowerCase().includes(search) ||
      (appointment.location && appointment.location.toLowerCase().includes(search)) ||
      (appointment.description && appointment.description.toLowerCase().includes(search)) ||
      (appointment.attendees && appointment.attendees.toLowerCase().includes(search))
    );
  });

  // Handle toggling appointment type filters
  const handleTypeToggle = (type: string) => {
    setSelectedTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type) // Fixed this line - was incorrectly filtering
        : [...prev, type]
    );
  };

  // Handle saving a new appointment or updating an existing one
  const handleSaveAppointment = (appointmentData: Appointment) => {
    if (isEditing && selectedAppointment) {
      // Update existing appointment in the state
      setAppointments(prev =>
        prev.map(app => app.id === appointmentData.id ? appointmentData : app)
      );
    } else {
      // Add new appointment to the state
      setAppointments(prev => [...prev, appointmentData]);
    }
    
    // Reset editing state
    setIsEditing(false);
    setSelectedAppointment(undefined);
    
    // Manual refresh after saving to ensure data consistency
    // We do this after modal is closed to avoid state conflicts
    setTimeout(() => {
      // Use the date range function instead of fetchAppointments
      const start = new Date(selectedDate);
      const end = new Date(selectedDate);
      
      // Adjust date range based on view
      if (view === 'day') {
        start.setDate(start.getDate() - 1);
        end.setDate(end.getDate() + 1);
      } else if (view === 'week') {
        start.setDate(start.getDate() - 7);
        end.setDate(end.getDate() + 7);
      } else {
        start.setMonth(start.getMonth() - 1);
        end.setMonth(end.getMonth() + 2);
      }
      
      fetchAppointmentsWithDateRange(start, end)
        .then(response => setAppointments(response.data))
        .catch(error => console.error("Failed to refresh appointments:", error));
    }, 500);
  };

  // Handle editing an appointment
  const handleEditAppointment = (appointment: Appointment) => {
    // Pause auto-refresh when opening modal
    autoRefreshPaused.current = true;
    setSelectedAppointment(appointment);
    setIsEditing(true);
    setShowModal(true);
  };

  // Handle deleting an appointment
  const handleDeleteAppointment = async (id: number) => {
    // Find the appointment to check if it's recurring
    const appointment = appointments.find(app => app.id === id);
    
    if (!appointment) {
      console.error("Appointment not found for deletion");
      return;
    }
    
    // If it's a recurring appointment, ask if they want to delete all future occurrences
    if (appointment.isRecurring) {
      const deleteAll = window.confirm(
        "This is a recurring appointment. Do you want to delete all future occurrences?\n\n" +
        "• Click 'OK' to delete all future occurrences\n" +
        "• Click 'Cancel' to delete only this occurrence"
      );
      
      if (window.confirm(`Are you sure you want to delete ${deleteAll ? 'all future occurrences of' : ''} this appointment?`)) {
        try {
          // Use the recurring delete function with the appropriate flag
          await deleteRecurringAppointment(id, deleteAll);
          
          // Remove the deleted appointment(s) from the state
          if (deleteAll) {
            // If deleting all future occurrences, remove all with the same ID
            setAppointments(prev => prev.filter(app => app.id !== id));
          } else {
            // If deleting just this occurrence, only remove this specific one
            // For recurring appointments, we'd need to handle this differently
            // This is a simplified approach
            setAppointments(prev => prev.filter(app => app.id !== id));
          }
        } catch (error) {
          console.error("Failed to delete appointment:", error);
        }
      }
    } else {
      // For non-recurring appointments, use the regular delete
      if (window.confirm("Are you sure you want to delete this appointment?")) {
        try {
          await deleteAppointment(id);
          // Remove the deleted appointment from the state
          setAppointments(prev => prev.filter(app => app.id !== id));
        } catch (error) {
          console.error("Failed to delete appointment:", error);
        }
      }
    }
  };

  // Date navigation functions
  const handlePrevDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    setSelectedDate(newDate);
  };

  const handleNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    setSelectedDate(newDate);
  };

  const handlePrevWeek = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 7);
    setSelectedDate(newDate);
  };

  const handleNextWeek = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 7);
    setSelectedDate(newDate);
  };

  const handlePrevMonth = () => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() - 1);
    setSelectedDate(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + 1);
    setSelectedDate(newDate);
  };

  const handleToday = () => {
    setSelectedDate(new Date());
  };

  // Handle opening the new appointment modal
  const handleNewAppointment = () => {
    // Pause auto-refresh when opening modal
    autoRefreshPaused.current = true;
    setIsEditing(false);
    setSelectedAppointment(undefined);
    setShowModal(true);
  };

  // Handle closing the modal
  const handleCloseModal = () => {
    setShowModal(false);
    setIsEditing(false);
    setSelectedAppointment(undefined);
    // Resume auto-refresh after modal closes
    autoRefreshPaused.current = false;
    
    // Refresh appointments immediately after modal closes
    // Use the date range function instead of fetchAppointments
    const start = new Date(selectedDate);
    const end = new Date(selectedDate);
    
    // Adjust date range based on view
    if (view === 'day') {
      start.setDate(start.getDate() - 1);
      end.setDate(end.getDate() + 2);
    } else if (view === 'week') {
      start.setDate(start.getDate() - 7);
      end.setDate(end.getDate() + 8);
    } else {
      start.setMonth(start.getMonth() - 1);
      end.setMonth(end.getMonth() + 2);
    }
    
    fetchAppointmentsWithDateRange(start, end)
      .then(response => setAppointments(response.data))
      .catch(error => console.error("Failed to refresh appointments:", error));
  };

  // Render the appropriate view based on the current selection
  const renderCalendarView = () => {
    if (isLoading) {
      return <div className="loading-container">Loading...</div>;
    }
    
    // Use unfiltered appointments for the calendar views
    switch (view) {
      case "day":
        return (
          <TimelineView
            selectedDate={selectedDate}
            appointments={appointments} // Use unfiltered appointments
            isLoading={isLoading}
            onEdit={handleEditAppointment}
            onDelete={handleDeleteAppointment}
          />
        );
      case "week":
        return (
          <WeekView
            selectedDate={selectedDate}
            appointments={appointments} // Use unfiltered appointments
            onEdit={handleEditAppointment}
            onDelete={handleDeleteAppointment}
          />
        );
      case "month":
        return (
          <MonthView
            selectedDate={selectedDate}
            appointments={appointments} // Use unfiltered appointments
            onEdit={handleEditAppointment}
            onDelete={handleDeleteAppointment}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="calendar-app">
      {/* Sidebar - add conditional class based on isSidebarOpen */}
      <aside className={`sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
        <MiniCalendar
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
        />
        
        {/* SearchBar with type filtering - only affects UpcomingList */}
        <SearchBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          placeholder="Search upcoming appointments..."
          selectedTypes={selectedTypes}
          onTypeToggle={handleTypeToggle}
        />
        
        {/* Pass filtered appointments and selectedDate to UpcomingList */}
        <UpcomingList
          searchTerm={searchTerm}
          appointments={filteredUpcomingAppointments} // Use filtered appointments
          onEdit={handleEditAppointment}
          onDelete={handleDeleteAppointment}
          selectedDate={selectedDate} // Pass the selected date to UpcomingList
        />
      </aside>
      {/* Add this overlay for mobile */}
      <div className="sidebar-overlay" onClick={toggleSidebar}></div>
      
      {/* Main content */}
      <main className="main-content">
        <DateHeader
          selectedDate={selectedDate}
          onPrevDay={handlePrevDay}
          onNextDay={handleNextDay}
          onPrevWeek={handlePrevWeek}
          onNextWeek={handleNextWeek}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
          onNewAppointment={handleNewAppointment}
          onToday={handleToday}
          view={view}
          onViewChange={setView}
          appointments={appointments} // Use unfiltered appointments
          toggleSidebar={toggleSidebar} // Add this prop
          isSidebarOpen={isSidebarOpen} // Add this prop
        />
        
        {renderCalendarView()}
      </main>
      
      {showModal && (
        <AppointmentModal
          onClose={handleCloseModal}
          onSave={handleSaveAppointment}
          selectedDate={selectedDate}
          appointment={selectedAppointment}
          isEditing={isEditing}
        />
      )}
    </div>
  );
};

export default CalendarPage;
