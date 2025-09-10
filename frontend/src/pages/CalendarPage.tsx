import React, { useState } from "react";
import DateHeader from "../components/Header/DateHeader";
import MiniCalendar from "../components/Sidebar/MiniCalendar";
import UpcomingList from "../components/Sidebar/UpcomingList";
import TimelineView from "../components/DayView/TimelineView";
import AppointmentModal from "../components/Modal/AppointmentModal";

const CalendarPage: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  return (
    <div className="calendar-app">
      {/* Sidebar */}
      <aside className="sidebar">
        <MiniCalendar selectedDate={selectedDate} setSelectedDate={setSelectedDate} />
        <UpcomingList />
      </aside>

      {/* Main content */}
      <main className="main-content">
        <DateHeader
          selectedDate={selectedDate}
          onPrevDay={() =>
            setSelectedDate(new Date(selectedDate.setDate(selectedDate.getDate() - 1)))
          }
          onNextDay={() =>
            setSelectedDate(new Date(selectedDate.setDate(selectedDate.getDate() + 1)))
          }
          onNewAppointment={() => setShowModal(true)}
        />

        <TimelineView selectedDate={selectedDate} />
      </main>

      {showModal && <AppointmentModal onClose={() => setShowModal(false)} />}
    </div>
  );
};

export default CalendarPage;
