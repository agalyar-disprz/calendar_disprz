import React from "react";
import AddIcon from "@mui/icons-material/Add";
import { Button, Select, MenuItem } from "@mui/material";
import TodayRoundedIcon from '@mui/icons-material/TodayRounded';

interface Props {
  selectedDate: Date;
  onPrevDay: () => void;
  onNextDay: () => void;
  onNewAppointment: () => void;
  onToday: () => void; 
  view: "day" | "week" | "month"; 
  onViewChange: (view: "day" | "week" | "month") => void; 
}

const DateHeader: React.FC<Props> = ({
  selectedDate,
  onNewAppointment,
  onToday,
  view,
  onViewChange,
}) => {
  return (
    <div className="date-header">

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

      <h2>{selectedDate.toDateString()}</h2>


      {/* ✅ View dropdown with MUI */}
      <Select
        size="small"
        value={view}
        onChange={(e) => onViewChange(e.target.value as "day" | "week" | "month")}
        sx={{
          borderRadius: "8px",
          "& .MuiSelect-select": { padding: "6px 12px" },
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
  );
};

export default DateHeader;
