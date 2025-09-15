import React, { useState } from "react";
import DateHeader from "../components/Header/DateHeader";
import MiniCalendar from "../components/Sidebar/MiniCalendar";
import UpcomingList from "../components/Sidebar/UpcomingList";
import TimelineView from "../components/DayView/TimelineView";
import AppointmentModal from "../components/Modal/AppointmentModal";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import SearchIcon from "@mui/icons-material/Search";

const CalendarPage: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [view, setView] = useState<"day" | "week" | "month">("day"); // ✅ new state

  return (
    <div className="calendar-app">
      {/* Sidebar */}
      <aside className="sidebar">
        <MiniCalendar
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
        />

        {/* ✅ MUI Search Box */}
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

        <UpcomingList searchTerm={searchTerm} />
      </aside>

      {/* Main content */}
      <main className="main-content">
        <DateHeader
          selectedDate={selectedDate}
          onPrevDay={() =>
            setSelectedDate(
              new Date(selectedDate.setDate(selectedDate.getDate() - 1))
            )
          }
          onNextDay={() =>
            setSelectedDate(
              new Date(selectedDate.setDate(selectedDate.getDate() + 1))
            )
          }
          onNewAppointment={() => setShowModal(true)}
          onToday={() => setSelectedDate(new Date())} // ✅ jump to today
          view={view} // ✅ pass current view
          onViewChange={setView} // ✅ update view
        />

        <TimelineView selectedDate={selectedDate} />
      </main>

      {showModal && <AppointmentModal onClose={() => setShowModal(false)} />}
    </div>
  );
};

export default CalendarPage;
