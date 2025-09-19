import React, { useState, useEffect } from "react";
import DateHeader from "../components/Header/DateHeader";
import MiniCalendar from "../components/Sidebar/MiniCalendar";
import UpcomingList from "../components/Sidebar/UpcomingList";
import SearchBar from "../components/Sidebar/SearchBar";
import TimelineView from "../components/DayView/TimelineView";
import WeekView from "../components/Header/WeekView";
import MonthView from "../components/Header/MonthView";
import AppointmentModal from "../components/Modal/AppointmentModal";
import { fetchAppointments, deleteAppointment } from "../services/api";
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
  
  // Fetch appointments when selected date changes
  useEffect(() => {
    const loadAppointments = async () => {
      setIsLoading(true);
      try {
        const response = await fetchAppointments();
        setAppointments(response.data);
      } catch (error) {
        console.error("Failed to fetch appointments:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadAppointments();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadAppointments, 60000);
    return () => clearInterval(interval);
  }, [selectedDate]);

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
        ? prev.filter(t => t === type)
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
    
    // Refresh the appointments list from backend
    fetchAppointments()
      .then(response => setAppointments(response.data))
      .catch(error => console.error("Failed to refresh appointments:", error));
    
    // Reset editing state
    setIsEditing(false);
    setSelectedAppointment(undefined);
  };

  // Handle editing an appointment
  const handleEditAppointment = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsEditing(true);
    setShowModal(true);
  };

  // Handle deleting an appointment
  const handleDeleteAppointment = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this appointment?")) {
      try {
        await deleteAppointment(id);
        // Remove the deleted appointment from the state
        setAppointments(prev => prev.filter(app => app.id !== id));
      } catch (error) {
        console.error("Failed to delete appointment:", error);
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
        
        {/* Pass filtered appointments to UpcomingList */}
        <UpcomingList
          searchTerm={searchTerm}
          appointments={filteredUpcomingAppointments} // Use filtered appointments
          onEdit={handleEditAppointment}
          onDelete={handleDeleteAppointment}
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
          onNewAppointment={() => {
            setIsEditing(false);
            setSelectedAppointment(undefined);
            setShowModal(true);
          }}
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
          onClose={() => {
            setShowModal(false);
            setIsEditing(false);
            setSelectedAppointment(undefined);
          }}
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
