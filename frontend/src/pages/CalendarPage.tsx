import React, { useState, useEffect } from "react";
import DateHeader from "../components/Header/DateHeader";
import MiniCalendar from "../components/Sidebar/MiniCalendar";
import UpcomingList from "../components/Sidebar/UpcomingList";
import SearchBar from "../components/Sidebar/SearchBar"; // Add this import
import TimelineView from "../components/DayView/TimelineView";
import WeekView from "../components/Header/WeekView";
import MonthView from "../components/Header/MonthView";
import AppointmentModal from "../components/Modal/AppointmentModal";

import { fetchAppointments, deleteAppointment } from "../services/api";
import { Appointment } from "../types/appointment";

const CalendarPage: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [view, setView] = useState<"day" | "week" | "month">("day");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | undefined>(undefined);
  const [isEditing, setIsEditing] = useState(false);

  // ✅ Fetch appointments when selected date changes
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

    // ✅ Auto-refresh every 30 seconds
    const interval = setInterval(loadAppointments, 30000);
    return () => clearInterval(interval);
  }, [selectedDate]);

  // ✅ Handle saving a new appointment or updating an existing one
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

  // ✅ Handle editing an appointment
  const handleEditAppointment = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsEditing(true);
    setShowModal(true);
  };

  // ✅ Handle deleting an appointment
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

    switch (view) {
      case "day":
        return (
          <TimelineView
            selectedDate={selectedDate}
            appointments={appointments}
            isLoading={isLoading}
            onEdit={handleEditAppointment}
            onDelete={handleDeleteAppointment}
          />
        );
      case "week":
        return (
          <WeekView
            selectedDate={selectedDate}
            appointments={appointments}
            onEdit={handleEditAppointment}
            onDelete={handleDeleteAppointment}
          />
        );
      case "month":
        return (
          <MonthView
            selectedDate={selectedDate}
            appointments={appointments}
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
      {/* Sidebar */}
      <aside className="sidebar">
        <MiniCalendar
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
        />
        
        {/* Replace the existing search box with SearchBar component */}
        <SearchBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          placeholder="Search by title, attendee, location..."
        />
        
        {/* ✅ Pass appointments and handlers into UpcomingList */}
        <UpcomingList
          searchTerm={searchTerm}
          appointments={appointments}
          onEdit={handleEditAppointment}
          onDelete={handleDeleteAppointment}
        />
      </aside>

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
