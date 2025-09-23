import React, { useState, useRef, useEffect } from "react";
import AddIcon from "@mui/icons-material/Add";
import { Button, Select, MenuItem, IconButton, Tooltip } from "@mui/material";
import TodayRoundedIcon from "@mui/icons-material/TodayRounded";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import ThemeToggle from "../ThemeToggle";
import PrintIcon from "@mui/icons-material/Print";
import MenuIcon from "@mui/icons-material/Menu";
import PrintView from "../PrintView";
import { createRoot } from "react-dom/client";

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
  appointments?: any[];
  toggleSidebar: () => void;
  isSidebarOpen: boolean;
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
  appointments = [],
  toggleSidebar,
  isSidebarOpen,
}) => {
  const [isPrinting, setIsPrinting] = useState(false);

  // Format the date header based on the current view
  const getFormattedDateHeader = () => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    };
    if (view === "day") {
      return selectedDate.toLocaleDateString(undefined, options);
    } else if (view === "week") {
      const weekStart = new Date(selectedDate);
      const day = selectedDate.getDay();
      const diff = selectedDate.getDate() - day + (day === 0 ? -6 : 1);
      weekStart.setDate(diff);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      if (weekStart.getMonth() === weekEnd.getMonth()) {
        return `${weekStart.toLocaleDateString(undefined, {
          month: "long",
        })} ${weekStart.getDate()} - ${weekEnd.getDate()}, ${weekStart.getFullYear()}`;
      } else if (weekStart.getFullYear() === weekEnd.getFullYear()) {
        return `${weekStart.toLocaleDateString(undefined, {
          month: "short",
        })} ${weekStart.getDate()} - ${weekEnd.toLocaleDateString(undefined, {
          month: "short",
        })} ${weekEnd.getDate()}, ${weekStart.getFullYear()}`;
      } else {
        return `${weekStart.toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric",
        })} - ${weekEnd.toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric",
        })}`;
      }
    } else {
      return selectedDate.toLocaleDateString(undefined, {
        month: "long",
        year: "numeric",
      });
    }
  };

  // Navigation functions
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

  // Tooltip text
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

  // Handle print functionality
  const handlePrintClick = () => {
    console.log("Print button clicked");
    setIsPrinting(true);
  };

  useEffect(() => {
    if (isPrinting) {
      console.log(
        "Preparing to print with",
        appointments.length,
        "appointments"
      );
      // Create a new window for printing
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        // Get appointments for the current view and sort them by start time
        let filteredAppointments = [];
        let dateRangeText = "";
        
        if (view === "day") {
          // Filter appointments for the selected day
          filteredAppointments = appointments.filter(
            (app) =>
              new Date(app.startTime).toDateString() ===
              selectedDate.toDateString()
          );
          dateRangeText = `Schedule for ${selectedDate.toLocaleDateString(undefined, {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}`;
        } else if (view === "week") {
          // Calculate week start and end
          const weekStart = new Date(selectedDate);
          const day = selectedDate.getDay();
          const diff = selectedDate.getDate() - day + (day === 0 ? -6 : 1);
          weekStart.setDate(diff);
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6);
          
          // Filter appointments for the selected week
          filteredAppointments = appointments.filter((app) => {
            const appDate = new Date(app.startTime);
            return appDate >= weekStart && appDate <= weekEnd;
          });
          
          dateRangeText = `Week of ${weekStart.toLocaleDateString(undefined, {
            month: "long",
            day: "numeric",
          })} - ${weekEnd.toLocaleDateString(undefined, {
            month: "long",
            day: "numeric",
            year: "numeric",
          })}`;
        } else if (view === "month") {
          // For month view, include all appointments in the current month
          const monthStart = new Date(
            selectedDate.getFullYear(),
            selectedDate.getMonth(),
            1
          );
          const monthEnd = new Date(
            selectedDate.getFullYear(),
            selectedDate.getMonth() + 1,
            0
          );
          filteredAppointments = appointments.filter((app) => {
            const appDate = new Date(app.startTime);
            return appDate >= monthStart && appDate <= monthEnd;
          });
          
          dateRangeText = selectedDate.toLocaleDateString(undefined, {
            month: "long",
            year: "numeric",
          });
        }
        
        // Sort appointments by start time
        filteredAppointments.sort((a, b) => {
          return (
            new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
          );
        });
        
        // Check if there are any appointments to print
        const hasAppointments = filteredAppointments.length > 0;
        
        // Set up the document with enhanced styles
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Calendar Print - ${dateRangeText}</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link rel="preconnect" href="https://fonts.googleapis.com">
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
            <link href="https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Source+Sans+Pro:wght@300;400;600&display=swap" rel="stylesheet">
            <style>
              @page {
                size: ${
                  view === "month" || view === "week" ? "landscape" : "portrait"
                };
                margin: ${
                  view === "month"
                    ? "0.5cm"
                    : view === "week"
                    ? "0.7cm"
                    : "1.5cm"
                };
              }
              
              * {
                box-sizing: border-box;
              }
              
              html, body {
                width: 100%;
                height: 100%;
                margin: 0;
                padding: 0;
              }
              
              body {
                font-family: 'Source Sans Pro', sans-serif;
                color: #333;
                line-height: 1.4;
                background-color: white;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              
              .print-view {
                width: 100%;
                max-width: 100%;
                padding: 0;
                margin: 0 auto;
              }
              
              h2 {
                font-family: 'Playfair Display', serif;
                font-size: ${view === "week" ? "1.4rem" : "1.8rem"};
                margin-bottom: ${view === "week" ? "10px" : "20px"};
                text-align: center;
                color: #1a1a1a;
                font-weight: 600;
                border-bottom: 1px solid #ddd;
                padding-bottom: ${view === "week" ? "5px" : "10px"};
              }
              
              /* No appointments message */
              .print-no-appointments {
                text-align: center;
                padding: 50px 20px;
                font-family: 'Source Sans Pro', sans-serif;
              }
              
              .print-no-appointments h2 {
                font-family: 'Playfair Display', serif;
                font-size: 24px;
                margin-bottom: 20px;
                color: #333;
                border-bottom: none;
              }
              
              .empty-print-message {
                font-size: 16px;
                color: #666;
                font-style: italic;
              }
              
              .monthly-view {  width: 100%;}  .month-dates-list {  display: flex;  flex-direction: column;  gap: 20px;}.month-date-section {  page-break-inside: avoid;  break-inside: avoid;}.month-date-header {  font-family: 'Playfair Display', serif;  font-size: 1.2rem;  margin-bottom: 10px;  padding-bottom: 5px;  border-bottom: 1px solid #ddd;  color: #2c3e50;}.month-date-appointments {  display: flex;  flex-direction: column;  gap: 10px;}.empty-month-message {  color: #999;  font-style: italic;  text-align: center;  margin-top: 30px;  font-size: 1rem;}
              
              .daily-view h2, .weekly-view h2, .monthly-view h2 {
                margin-top: 0;
              }
              
              .appointment-item {
                border: 1px solid #e0e0e0;
                border-radius: 4px;
                padding: ${view === "week" ? "6px 8px" : "12px 15px"};
                margin-bottom: ${view === "week" ? "6px" : "12px"};
                box-shadow: 0 1px 2px rgba(0,0,0,0.05);
                page-break-inside: avoid;
                background-color: #fff;
              }
              
              .appointment-time {
                font-family: 'Lora', serif;
                font-weight: 600;
                margin-bottom: ${view === "week" ? "2px" : "6px"};
                color: #2c3e50;
                font-size: ${view === "week" ? "0.8rem" : "0.95rem"};
              }
              
              .appointment-title {
                font-family: 'Lora', serif;
                font-weight: 600;
                font-size: ${view === "week" ? "0.9rem" : "1.1rem"};
                margin-bottom: ${view === "week" ? "2px" : "6px"};
                color: #1a1a1a;
              }
              
              .appointment-location,
              .appointment-description,
              .appointment-attendees {
                margin-bottom: ${view === "week" ? "2px" : "5px"};
                font-size: ${view === "week" ? "0.75rem" : "0.9rem"};
                color: #555;
              }
              
              .appointment-location {
                font-style: italic;
              }
              
              .appointment-completed {
                font-style: italic;
                color: #4caf50;
                margin-left: 4px;
                font-size: ${view === "week" ? "0.75rem" : "0.9rem"};
              }
              
              .week-grid {
                display: grid;
                gap: ${view === "week" ? "3px" : "8px"};
                margin-top: ${view === "week" ? "8px" : "20px"};
              }
              
              .day-column {
                border: 1px solid #e0e0e0;
                padding: ${view === "week" ? "3px" : "8px"};
                min-height: ${view === "week" ? "100px" : "150px"};
                border-radius: 4px;
                background-color: #fff;
                page-break-inside: avoid;
                overflow: hidden;
              }
              
              .day-header {
                font-family: 'Playfair Display', serif;
                text-align: center;
                font-weight: 600;
                padding-bottom: ${view === "week" ? "3px" : "8px"};
                margin-bottom: ${view === "week" ? "3px" : "8px"};
                border-bottom: 1px solid #eee;
                color: #2c3e50;
                font-size: ${view === "week" ? "0.75rem" : "0.9rem"};
              }
              
              .today-column {
                background-color: #f8f9fa;
                border-color: #c5d1e0;
              }
              
              .empty-day-message {
                color: #999;
                font-style: italic;
                text-align: center;
                margin-top: ${view === "week" ? "5px" : "20px"};
                font-size: ${view === "week" ? "0.7rem" : "0.9rem"};
              }
              
              .empty-week-message {
                color: #999;
                font-style: italic;
                text-align: center;
                margin-top: 30px;
                font-size: 1rem;
              }
              
              .appointments-list {
                width: 100%;
              }
              
              .day-appointments {
                margin-top: ${view === "week" ? "4px" : "10px"};
              }
              
              /* Month view styles */
              .month-grid {
                width: 100%;
              }
              
              .month-weekdays {
                display: grid;
                grid-template-columns: repeat(7, 1fr);
                gap: 4px;
                margin-bottom: 4px;
              }
              
              .month-weekday {
                text-align: center;
                font-weight: bold;
                padding: 6px 0;
                background-color: #f5f5f5;
                border-radius: 4px;
                font-size: 0.85rem;
              }
              
              .month-days {
                display: flex;
                flex-direction: column;
                gap: 4px;
              }
              
              .month-week {
                display: grid;
                grid-template-columns: repeat(7, 1fr);
                gap: 4px;
                margin-bottom: 4px;
              }
              
              .month-day {
                border: 1px solid #e0e0e0;
                min-height: 70px;
                padding: 3px;
                background-color: #fff;
                position: relative;
              }
              
              .month-day-header {
                text-align: right;
                font-weight: bold;
                margin-bottom: 3px;
                padding: 1px 3px;
                font-size: 0.8rem;
              }
              
              .month-day-appointments {
                font-size: 0.7rem;
              }
              
              .month-appointment {
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                padding: 1px 3px;
                margin-bottom: 2px;
                background-color: #e6f7ff;
                border-radius: 2px;
                font-size: 0.7rem;
              }
              
              .month-more-appointments {
                text-align: center;
                color: #666;
                font-size: 0.7rem;
                margin-top: 1px;
              }
              
              .other-month {
                background-color: #f9f9f9;
                opacity: 0.7;
              }
              
              .today {
                background-color: #e3f2fd;
                border-color: #1976d2;
              }
              
              /* Responsive adjustments for print */
              @media print {
                body {
                  padding: 0;
                  font-size: ${
                    view === "week" ? "8pt" : view === "month" ? "9pt" : "11pt"
                  };
                }
                
                .print-view {
                  padding: 0;
                  width: 100%;
                  max-width: 100%;
                }
                
                h2 {
                  font-size: ${
                    view === "week"
                      ? "12pt"
                      : view === "month"
                      ? "14pt"
                      : "16pt"
                  };
                  margin-bottom: ${
                    view === "week" ? "8pt" : view === "month" ? "10pt" : "15pt"
                  };
                  padding-bottom: ${
                    view === "week" ? "4pt" : view === "month" ? "6pt" : "8pt"
                  };
                }
                
                .appointment-item, .day-column, .month-day {
                  page-break-inside: avoid;
                  break-inside: avoid;
                }
                
                .appointment-title {
                  font-size: ${
                    view === "week" ? "9pt" : view === "month" ? "10pt" : "12pt"
                  };
                }
                
                .appointment-time {
                  font-size: ${
                    view === "week" ? "8pt" : view === "month" ? "9pt" : "10pt"
                  };
                }
                
                .appointment-location,
                .appointment-description,
                .appointment-attendees {
                  font-size: ${
                    view === "week" ? "7pt" : view === "month" ? "8pt" : "9pt"
                  };
                }
                
                .day-header {
                  font-size: ${
                    view === "week" ? "8pt" : view === "month" ? "9pt" : "11pt"
                  };
                  padding-bottom: ${view === "week" ? "2pt" : "4pt"};
                  margin-bottom: ${view === "week" ? "2pt" : "6pt"};
                }
                
                .week-grid, .month-grid {
                  page-break-before: auto;
                  width: 100%;
                }
                
                .weekly-view .day-column {
                  min-height: 90px;
                  padding: 3px;
                }
                
                .empty-day-message {
                  font-size: ${view === "week" ? "7pt" : "8pt"};
                  margin-top: ${view === "week" ? "4pt" : "8pt"};
                }
                
                .month-day {
                  min-height: 60px;
                }
                
                .month-appointment {
                  font-size: 7pt;
                  padding: 1px 2px;
                  margin-bottom: 1px;
                }
                
                .month-date-header {
                  font-size: 14pt;
                  margin-bottom: 8pt;
                  padding-bottom: 4pt;
                }
                
                .month-dates-list {
                  gap: 15pt;
                }
                
                .empty-month-message, .empty-week-message, .empty-print-message {
                  font-size: 12pt;
                  margin-top: 20pt;
                }
                
                .print-no-appointments h2 {
                  font-size: 18pt;
                  margin-bottom: 12pt;
                }
              }
            </style>
          </head>
          <body>
            <div id="print-root"></div>
          </body>
          </html>
        `);
        
        // Convert view type for PrintView component
        const printViewType =
          view === "day" ? "daily" : view === "week" ? "weekly" : "monthly";
          
        // Render the PrintView component into the new window
        const printRoot = printWindow.document.getElementById("print-root");
        if (printRoot) {
          try {
            const root = createRoot(printRoot);
            root.render(
              <PrintView
                selectedDate={selectedDate}
                appointments={filteredAppointments}
                viewType={printViewType}
              />
            );
            
            // Print after a short delay to ensure rendering is complete
            setTimeout(() => {
              printWindow.print();
              // Close the window after printing (or after a timeout)
              setTimeout(() => {
                printWindow.close();
                setIsPrinting(false);
              }, 1000);
            }, 1000); // Increased delay to ensure fonts are loaded
          } catch (error) {
            console.error("Error rendering PrintView:", error);
            // Fallback to simple HTML if React rendering fails
            printWindow.document.body.innerHTML = `
              <div style="font-family: 'Playfair Display', serif; max-width: 800px; margin: 0 auto; padding: 20px;">
                <h1 style="text-align: center; font-size: 24px; margin-bottom: 20px;">${dateRangeText}</h1>
                ${hasAppointments 
                  ? `<p style="text-align: center; font-style: italic; color: #666;">Unable to render detailed view. Please try again.</p>`
                  : `<p style="text-align: center; font-style: italic; color: #666;">No appointments scheduled for this ${
                      view === "day" ? "day" : view === "week" ? "week" : "month"
                    }.</p>`
                }
              </div>
            `;
            setTimeout(() => {
              printWindow.print();
              printWindow.close();
              setIsPrinting(false);
            }, 500);
          }
        }
      } else {
        console.error("Could not open print window");
        setIsPrinting(false);
      }
    }
  }, [isPrinting, appointments, selectedDate, view, getFormattedDateHeader]);

  return (
    <div className="date-header">
      <div className="header-left">
        {/* Add hamburger menu button */}
        <Tooltip title={isSidebarOpen ? "Hide sidebar" : "Show sidebar"}>
          <IconButton
            onClick={toggleSidebar}
            className="hamburger-menu"
            aria-label={isSidebarOpen ? "Hide sidebar" : "Show sidebar"}
            size="small"
          >
            <MenuIcon />
          </IconButton>
        </Tooltip>
        <div className="date-navigation">
          <Tooltip title={getPrevTooltip()}>
            <IconButton onClick={handlePrev} size="small" className="nav-btn">
              <ArrowBackIosNewIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <div className="date-title-container">
            <h2>{getFormattedDateHeader()}</h2>
          </div>
          <Tooltip title={getNextTooltip()}>
            <IconButton onClick={handleNext} size="small" className="nav-btn">
              <ArrowForwardIosIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </div>
      </div>

      <div className="header-center">
        <Button
          variant="outlined"
          color="primary"
          size="medium"
          onClick={onToday}
          className="today-button"
          sx={{
            textTransform: "none",
            borderRadius: "8px",
            display: "flex",
            gap: "6px",
          }}
        >
          <TodayRoundedIcon fontSize="small" />
          Today
        </Button>
      </div>

      <div className="header-right">
        <div className="view-controls">
          {/* View dropdown with MUI */}
          <Select
            size="small"
            value={view}
            onChange={(e) =>
              onViewChange(e.target.value as "day" | "week" | "month")
            }
            sx={{
              borderRadius: "8px",
              "& .MuiSelect-select": { padding: "6px 12px" },
            }}
            MenuProps={{
              PaperProps: {
                sx: { maxHeight: 200 },
              },
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

        <div className="header-actions">
          <ThemeToggle />
          <Tooltip title="Print Calendar">
            <IconButton
              onClick={handlePrintClick}
              className="header-print-button"
              aria-label="Print calendar"
              size="small"
              disabled={isPrinting}
            >
              <PrintIcon />
            </IconButton>
          </Tooltip>
        </div>
      </div>
    </div>
  );
};

export default DateHeader;
