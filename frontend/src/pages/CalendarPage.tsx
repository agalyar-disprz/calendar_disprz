import React, { useState, useEffect } from "react";
import DateHeader from "../components/Header/DateHeader";
import MiniCalendar from "../components/Sidebar/MiniCalendar";
import UpcomingList from "../components/Sidebar/UpcomingList";
import TimelineView from "../components/DayView/TimelineView";
import AppointmentModal from "../components/Modal/AppointmentModal";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import SearchIcon from "@mui/icons-material/Search";
import { fetchAppointments } from "../services/api";
import { Appointment } from "../types/appointment";

const CalendarPage: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [view, setView] = useState<"day" | "week" | "month">("day");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(false);

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

  // ✅ Handle saving a new appointment
  const handleSaveAppointment = (newAppointment: Appointment) => {
    setAppointments((prev) => [...prev, newAppointment]);
    // Refresh the appointments list from backend
    fetchAppointments()
      .then((response) => setAppointments(response.data))
      .catch((error) =>
        console.error("Failed to refresh appointments:", error)
      );
  };

  return (
    <div className="calendar-app">
      {/* Sidebar */}
      <aside className="sidebar">
        <MiniCalendar
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
        />
        {/* MUI Search Box */}
        <div style={{ margin: "16px 0" }}>
          <TextField
            fullWidth
            size="small"
            variant="outlined"
            placeholder="Search appointments"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
          />
        </div>
        {/* ✅ Pass appointments into UpcomingList */}
        <UpcomingList searchTerm={searchTerm} appointments={appointments} />
      </aside>

      {/* Main content */}
      <main className="main-content">
        <DateHeader
          selectedDate={selectedDate}
          onPrevDay={() => {
            const newDate = new Date(selectedDate);
            newDate.setDate(newDate.getDate() - 1);
            setSelectedDate(newDate);
          }}
          onNextDay={() => {
            const newDate = new Date(selectedDate);
            newDate.setDate(newDate.getDate() + 1);
            setSelectedDate(newDate);
          }}
          onNewAppointment={() => setShowModal(true)}
          onToday={() => setSelectedDate(new Date())}
          view={view}
          onViewChange={setView}
        />
        <TimelineView
          selectedDate={selectedDate}
          appointments={appointments}
          isLoading={isLoading}
        />
      </main>

      {showModal && (
        <AppointmentModal
          onClose={() => setShowModal(false)}
          onSave={handleSaveAppointment}
          selectedDate={selectedDate}
        />
      )}
    </div>
  );
};

export default CalendarPage;
