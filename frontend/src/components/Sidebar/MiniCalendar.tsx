import React, { useState, useEffect, ReactNode } from "react";
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';

interface Props {
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
}

const MiniCalendar: React.FC<Props> = ({ selectedDate, setSelectedDate }) => {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date(selectedDate));
  
  // Update current month view when selected date changes
  useEffect(() => {
    setCurrentMonth(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
  }, [selectedDate]);

  // Get days in month
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // Get day of week for first day of month (0 = Sunday, 6 = Saturday)
  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  // Navigate to previous month
  const prevMonth = () => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() - 1);
    setCurrentMonth(newMonth);
  };

  // Navigate to next month
  const nextMonth = () => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + 1);
    setCurrentMonth(newMonth);
  };

  // Handle date selection
  const handleDateClick = (day: number) => {
    const newDate = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day
    );
    setSelectedDate(newDate);
  };

  // Render calendar grid
  const renderCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDayOfMonth = getFirstDayOfMonth(year, month);
    
    const today = new Date();
    const isToday = (day: number) => 
      today.getDate() === day && 
      today.getMonth() === month && 
      today.getFullYear() === year;
    
    const isSelectedDate = (day: number) => 
      selectedDate.getDate() === day && 
      selectedDate.getMonth() === month && 
      selectedDate.getFullYear() === year;

    // Day names header
    const dayNames = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
    
    // Create day names row
    const dayNamesRow = (
      <div key="daynames" className="calendar-row">
        {dayNames.map((day, index) => (
          <div key={`dayname-${index}`} className="calendar-day-name">
            {day}
          </div>
        ))}
      </div>
    );
    
    // Calculate total cells needed (days in month + empty cells for first row)
    const totalCells = firstDayOfMonth + daysInMonth;
    // Calculate how many rows we need (7 days per row, rounded up)
    const totalRows = Math.ceil(totalCells / 7);
    
    // Create calendar grid rows
    const rows: ReactNode[] = [dayNamesRow];
    
    let dayCounter = 1;
    
    // Create each row
    for (let row = 0; row < totalRows; row++) {
      const cells: ReactNode[] = [];
      
      // Create 7 cells for each row
      for (let col = 0; col < 7; col++) {
        // For the first row, we need to account for empty cells
        if (row === 0 && col < firstDayOfMonth) {
          cells.push(
            <div key={`empty-${row}-${col}`} className="calendar-day empty"></div>
          );
        } 
        // For days in the month
        else if (dayCounter <= daysInMonth) {
          const day = dayCounter;
          const dayClass = `calendar-day ${isToday(day) ? 'today' : ''} ${isSelectedDate(day) ? 'selected' : ''}`;
          
          cells.push(
            <div 
              key={`day-${day}`} 
              className={dayClass}
              onClick={() => handleDateClick(day)}
            >
              {day}
            </div>
          );
          
          dayCounter++;
        } 
        // Empty cells after the last day of the month
        else {
          cells.push(
            <div key={`empty-end-${row}-${col}`} className="calendar-day empty"></div>
          );
        }
      }
      
      rows.push(
        <div key={`row-${row}`} className="calendar-row">
          {cells}
        </div>
      );
    }
    
    return rows;
  };

  return (
    <div className="mini-calendar">
      <div className="calendar-header">
        <button className="calendar-nav-btn" onClick={prevMonth}>
          <ArrowBackIosNewIcon fontSize="small" />
        </button>
        <h3>{currentMonth.toLocaleString("default", { month: "long", year: "numeric" })}</h3>
        <button className="calendar-nav-btn" onClick={nextMonth}>
          <ArrowForwardIosIcon fontSize="small" />
        </button>
      </div>
      <div className="calendar-grid">
        {renderCalendarDays()}
      </div>
    </div>
  );
};

export default MiniCalendar;
