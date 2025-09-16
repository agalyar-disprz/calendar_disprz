import React from "react";
import AddIcon from "@mui/icons-material/Add";
import { Button, Select, MenuItem, IconButton, Tooltip } from "@mui/material";
import TodayRoundedIcon from '@mui/icons-material/TodayRounded';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';

interface Props {
  selectedDate: Date;
  onPrevDay: () => void;
  onNextDay: () => void;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onNewAppointment: () => void;
  onToday: () => void;
  view: "day" | "week" | "month";
  onViewChange: (view: "day" | "week" | "month") => void;
}

const DateHeader: React.FC<Props> = ({
  selectedDate,
  onPrevDay,
  onNextDay,
  onPrevWeek,
  onNextWeek,
  onPrevMonth,
  onNextMonth,
  onNewAppointment,
  onToday,
  view,
  onViewChange,
}) => {
  // Format the date header based on the current view
  const getFormattedDateHeader = () => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };

    if (view === "day") {
      // For day view: "Monday, September 18, 2023"
      return selectedDate.toLocaleDateString(undefined, options);
    } else if (view === "week") {
      // For week view: "September 18 - 24, 2023"
      const weekStart = new Date(selectedDate);
      const day = selectedDate.getDay();
      const diff = selectedDate.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
      weekStart.setDate(diff);
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      
      // If same month
      if (weekStart.getMonth() === weekEnd.getMonth()) {
        return `${weekStart.toLocaleDateString(undefined, { month: 'long' })} ${weekStart.getDate()} - ${weekEnd.getDate()}, ${weekStart.getFullYear()}`;
      }
      // If different months but same year
      else if (weekStart.getFullYear() === weekEnd.getFullYear()) {
        return `${weekStart.toLocaleDateString(undefined, { month: 'short' })} ${weekStart.getDate()} - ${weekEnd.toLocaleDateString(undefined, { month: 'short' })} ${weekEnd.getDate()}, ${weekStart.getFullYear()}`;
      }
      // If different years
      else {
        return `${weekStart.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} - ${weekEnd.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`;
      }
    } else {
      // For month view: "September 2023"
      return selectedDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    }
  };

  // Get the appropriate navigation functions based on the current view
  const handlePrev = () => {
    if (view === "day") onPrevDay();
    else if (view === "week") onPrevWeek();
    else onPrevMonth();
  };

  const handleNext = () => {
    if (view === "day") onNextDay();
    else if (view === "week") onNextWeek();
    else onNextMonth();
  };

  // Get navigation tooltip text based on current view
  const getPrevTooltip = () => {
    if (view === "day") return "Previous Day";
    if (view === "week") return "Previous Week";
    return "Previous Month";
  };

  const getNextTooltip = () => {
    if (view === "day") return "Next Day";
    if (view === "week") return "Next Week";
    return "Next Month";
  };

  return (
    <div className="date-header">
      <div className="date-nav-controls">
        <Button
          variant="outlined"
          color="primary"
          size="medium"
          onClick={onToday}
          sx={{ textTransform: "none", borderRadius: "8px", display: "flex", gap: "6px" }}
        >
          <TodayRoundedIcon fontSize="small" />
          Today
        </Button>
        
        <div className="date-navigation">
          <Tooltip title={getPrevTooltip()}>
            <IconButton onClick={handlePrev} size="small" className="nav-btn">
              <ArrowBackIosNewIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={getNextTooltip()}>
            <IconButton onClick={handleNext} size="small" className="nav-btn">
              <ArrowForwardIosIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </div>
      </div>

      <h2>{getFormattedDateHeader()}</h2>
      
      <div className="view-controls">
        {/* View dropdown with MUI */}
        <Select
          size="small"
          value={view}
          onChange={(e) => onViewChange(e.target.value as "day" | "week" | "month")}
          sx={{
            borderRadius: "8px",
            "& .MuiSelect-select": { padding: "6px 12px" },
          }}
          MenuProps={{
            PaperProps: {
              sx: { maxHeight: 200 }
            }
          }}
        >
          <MenuItem value="day">Day</MenuItem>
          <MenuItem value="week">Week</MenuItem>
          <MenuItem value="month">Month</MenuItem>
        </Select>
        
        {/* New Appointment */}
        <button className="new-btn" onClick={onNewAppointment}>
          <AddIcon /> New Appointment
        </button>
      </div>
    </div>
  );
};

export default DateHeader;
