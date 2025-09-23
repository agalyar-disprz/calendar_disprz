import React, { useState, useEffect, useRef } from "react";
import CloseIcon from "@mui/icons-material/Close";
import { addAppointment, updateAppointment } from "../../services/api";
import {
  Appointment,
  APPOINTMENT_TYPES,
  getAppointmentColor,
  RecurrenceInterval,
} from "../../types/appointment";
import {
  CircularProgress,
  Alert,
  FormControlLabel,
  Checkbox,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
} from "@mui/material";
import { useAuth } from "../../contexts/AuthContext";

interface Props {
  onClose: () => void;
  onSave?: (appointment: Appointment) => void;
  selectedDate: Date;
  appointment?: Appointment; // Optional appointment for editing
  isEditing?: boolean;
}

// Define a type for new appointments without requiring an ID
type NewAppointment = Omit<Appointment, "id">;

const AppointmentModal: React.FC<Props> = ({
  onClose,
  onSave,
  selectedDate,
  appointment,
  isEditing = false,
}) => {
  // Add a ref to track if the component is mounted
  const isMounted = useRef(true);
  // Get current user for userId
  const { currentUser } = useAuth();
  // Track if form has been initialized
  const [formInitialized, setFormInitialized] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: selectedDate.toISOString().split("T")[0],
    startTime: "",
    endTime: "",
    location: "",
    attendees: "", // Add attendees field
    type: APPOINTMENT_TYPES[0].id, // Default type

    // Add recurrence properties
    isRecurring: false,
    recurrenceInterval: RecurrenceInterval.Daily,
    recurrenceEndDate: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [timeError, setTimeError] = useState("");

  // Get current time for validation
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  // Check if selected date is today
  const isToday = selectedDate.toDateString() === now.toDateString();

  // Set up cleanup when component unmounts
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Initialize form data only once when component mounts
  useEffect(() => {
    if (!formInitialized) {
      if (isEditing && appointment) {
        // Convert ISO date strings to 24-hour time format
        const startDate = new Date(appointment.startTime);
        const endDate = new Date(appointment.endTime);

        setFormData({
          title: appointment.title,
          description: appointment.description || "",
          date: appointment.date || selectedDate.toISOString().split("T")[0],
          startTime: `${String(startDate.getHours()).padStart(2, "0")}:${String(
            startDate.getMinutes()
          ).padStart(2, "0")}`,
          endTime: `${String(endDate.getHours()).padStart(2, "0")}:${String(
            endDate.getMinutes()
          ).padStart(2, "0")}`,
          location: appointment.location || "",
          attendees: appointment.attendees || "", // Include attendees
          type: appointment.type || APPOINTMENT_TYPES[0].id, // Include type with default

          // Add recurrence properties
          isRecurring: appointment.isRecurring || false,
          recurrenceInterval:
            appointment.recurrenceInterval || RecurrenceInterval.Daily,
          recurrenceEndDate: appointment.recurrenceEndDate || "",
        });
      } else {
        // For new appointments, set default times (current hour to next hour)
        let startHour = currentHour;
        let startMinute = currentMinute;

        // Round up to the nearest 15 minutes
        if (startMinute % 15 !== 0) {
          startMinute = Math.ceil(startMinute / 15) * 15;
          if (startMinute === 60) {
            startMinute = 0;
            startHour = (startHour + 1) % 24;
          }
        }

        const endHour = startHour + 1 > 23 ? 23 : startHour + 1;

        setFormData({
          title: "",
          description: "",
          date: selectedDate.toISOString().split("T")[0],
          startTime: `${String(startHour).padStart(2, "0")}:${String(
            startMinute
          ).padStart(2, "0")}`,
          endTime: `${String(endHour).padStart(2, "0")}:${String(
            startMinute
          ).padStart(2, "0")}`,
          location: "",
          attendees: "", // Initialize attendees
          type: APPOINTMENT_TYPES[0].id, // Default type

          // Initialize recurrence properties
          isRecurring: false,
          recurrenceInterval: RecurrenceInterval.Daily,
          recurrenceEndDate: "",
        });
      }
      setFormInitialized(true);
    }
  }, [isEditing, appointment, currentHour, currentMinute, formInitialized]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear time error when user changes time inputs
    if (name === "startTime" || name === "endTime") {
      setTimeError("");
    }

    // Clear error when user makes any changes
    setError("");
  };

  // Handler for recurrence checkbox
  const handleRecurrenceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      isRecurring: e.target.checked,
    });
  };

  // Handler for recurrence interval
  const handleRecurrenceIntervalChange = (e: any) => {
    setFormData({
      ...formData,
      recurrenceInterval: e.target.value as RecurrenceInterval,
    });
  };

  // Handler for recurrence end date
  const handleRecurrenceEndDateChange = (date: Date | null) => {
    setFormData({
      ...formData,
      recurrenceEndDate: date ? date.toISOString() : "",
    });
  };

  // ✅ Helper: Combine selected date + entered time into "YYYY-MM-DDTHH:mm:ss"
  const formatLocalDateTime = (date: Date, time: string) => {
    const [hours, minutes] = time.split(":").map(Number);
    const localDate = new Date(date);
    localDate.setHours(hours, minutes, 0, 0);

    // Return in local time format without timezone
    const year = localDate.getFullYear();
    const month = String(localDate.getMonth() + 1).padStart(2, "0");
    const day = String(localDate.getDate()).padStart(2, "0");
    const hh = String(hours).padStart(2, "0");
    const mm = String(minutes).padStart(2, "0");

    // Return with seconds for compatibility with backend
    return `${year}-${month}-${day}T${hh}:${mm}:00`;
  };

  // Validate time inputs
  const validateTimes = (): boolean => {
    const startDateTime = new Date(
      formatLocalDateTime(selectedDate, formData.startTime)
    );
    const endDateTime = new Date(
      formatLocalDateTime(selectedDate, formData.endTime)
    );

    // Check if end time is after start time
    if (endDateTime <= startDateTime) {
      setTimeError("End time must be after start time");
      return false;
    }

    // Check if appointment is in the past (only for new appointments)
    if (!isEditing && isToday && startDateTime < now) {
      setTimeError("Cannot create appointments in the past");
      return false;
    }

    return true;
  };

  // Validate attendees
  const validateAttendees = (attendeesString: string): boolean => {
    if (!attendeesString.trim()) return true; // Empty attendees is valid

    const attendees = attendeesString
      .split(",")
      .map((a) => a.trim())
      .filter((a) => a);

    // Check for duplicate attendees
    const uniqueAttendees = new Set(attendees);
    if (uniqueAttendees.size !== attendees.length) {
      setError("Duplicate attendees found");
      return false;
    }

    // Validate email format if needed
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = attendees.filter(
      (a) => a.includes("@") && !emailRegex.test(a)
    );
    if (invalidEmails.length > 0) {
      setError(`Invalid email format: ${invalidEmails.join(", ")}`);
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate times before submission
    if (!validateTimes()) {
      return;
    }

    // Validate attendees before submission
    if (!validateAttendees(formData.attendees)) {
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      if (!currentUser || !currentUser.id) {
        throw new Error("You must be logged in to create appointments");
      }

      // Build appointment object with local time strings
      const appointmentData: NewAppointment = {
        title: formData.title,
        description: formData.description || "",
        date: formData.date || selectedDate.toISOString().split("T")[0],
        startTime: formatLocalDateTime(selectedDate, formData.startTime),
        endTime: formatLocalDateTime(selectedDate, formData.endTime),
        location: formData.location || "",
        attendees: formData.attendees || "", // Include attendees
        type: formData.type, // Include type
        userId: currentUser.id, // Add userId from current user

        // Include recurrence properties
        isRecurring: formData.isRecurring,
        recurrenceInterval: formData.recurrenceInterval,
        recurrenceEndDate: formData.recurrenceEndDate || undefined,
      };

      let response;

      if (isEditing && appointment) {
        // Update existing appointment - DON'T include the ID in the data
        // The ID is passed separately as the first parameter
        response = await updateAppointment(appointment.id, appointmentData);
      } else {
        // Create new appointment
        response = await addAppointment(appointmentData);

        // Check for conflict in response (only for new appointments)
        if (response.conflict) {
          setError(
            "Cannot create appointment. There is already an appointment scheduled at this time."
          );
          return; // Don't close modal, just return early
        }
      }

      // Success! Call onSave callback first if provided
      if (onSave && response.data) {
        try {
          onSave(response.data);
        } catch (callbackError) {
          console.warn("onSave callback error:", callbackError);
          // Continue with closing even if callback fails
        }
      }

      // Always close the modal after successful save
      onClose();
    } catch (err: any) {
      // Only update state if component is still mounted
      if (isMounted.current) {
        console.error(
          `Failed to ${isEditing ? "update" : "save"} appointment:`,
          err
        );

        // Handle different error types
        if (err.message) {
          // Error from our API error handling
          setError(err.message);
        } else if (err.response?.data) {
          // Raw error from server
          const errorData = err.response.data;
          if (typeof errorData === "string") {
            setError(errorData);
          } else if (errorData.message) {
            setError(errorData.message);
          } else if (errorData.errors && errorData.errors.type) {
            // Handle the specific "Type field is required" error
            setError(`Type is required: ${errorData.errors.type[0]}`);
          } else {
            setError(JSON.stringify(errorData));
          }
        } else {
          // Fallback error message
          setError(
            `Failed to ${
              isEditing ? "update" : "save"
            } appointment. Please try again.`
          );
        }
      }
    } finally {
      // Always reset submitting state
      if (isMounted.current) {
        setIsSubmitting(false);
      }
    }
  };

  // Prevent modal from closing when clicking inside it
  const handleModalClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        className="modal"
        onClick={handleModalClick}
        style={{
          backgroundColor: "white",
          borderRadius: "8px",
          width: "90%",
          maxWidth: "600px",
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
        }}
      >
        <div
          className="modal-header"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "16px 20px",
            borderBottom: "1px solid #eee",
          }}
        >
          <h2 style={{ margin: 0, fontSize: "1.5rem" }}>
            {isEditing ? "Edit Appointment" : "New Appointment"}
          </h2>
          <button
            className="close-btn"
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "1.5rem",
            }}
          >
            <CloseIcon />
          </button>
        </div>

        <div style={{ padding: "20px" }}>
          {isToday && !isEditing && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Current time: {String(currentHour).padStart(2, "0")}:
              {String(currentMinute).padStart(2, "0")}
              <br />
              You cannot schedule appointments in the past.
            </Alert>
          )}

          {/* Display error with appropriate styling */}
          {error && (
            <div
              className="error-message"
              style={{
                display: "flex",
                alignItems: "center",
                backgroundColor: "#ffebee",
                border: "1px solid #ffcdd2",
                padding: "10px",
                marginBottom: "15px",
                borderRadius: "4px",
              }}
            >
              <span style={{ marginRight: "8px", fontSize: "1.2rem" }}>❌</span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom: "16px" }}>
              <label
                htmlFor="title"
                style={{
                  display: "block",
                  marginBottom: "6px",
                  fontWeight: 500,
                }}
              >
                Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Enter title"
                required
                autoFocus
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: "4px",
                  border: "1px solid #ccc",
                }}
              />
            </div>

            {/* Add appointment type selector */}
            <div className="form-group" style={{ marginBottom: "16px" }}>
              <label
                htmlFor="type"
                style={{
                  display: "block",
                  marginBottom: "6px",
                  fontWeight: 500,
                }}
              >
                Appointment Type *
              </label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleChange}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: "4px",
                  borderLeft: `4px solid ${getAppointmentColor(formData.type)}`,
                  borderTop: "1px solid #ccc",
                  borderRight: "1px solid #ccc",
                  borderBottom: "1px solid #ccc",
                }}
                required
              >
                {APPOINTMENT_TYPES.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Color indicator */}
            <div
              className="form-group"
              style={{ marginTop: "-5px", marginBottom: "15px" }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  fontSize: "12px",
                  color: "#666",
                }}
              >
                <div
                  style={{
                    width: "12px",
                    height: "12px",
                    borderRadius: "50%",
                    backgroundColor: getAppointmentColor(formData.type),
                    marginRight: "8px",
                  }}
                ></div>
                <span>
                  Color:{" "}
                  {APPOINTMENT_TYPES.find((t) => t.id === formData.type)?.label}
                </span>
              </div>
            </div>
            <TextField
              margin="normal"
              fullWidth
              id="date"
              label="Date"
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              InputLabelProps={{
                shrink: true,
              }}
            />

            <div
              className="form-group time-inputs"
              style={{ display: "flex", gap: "16px", marginBottom: "16px" }}
            >
              <div className="time-input" style={{ flex: 1 }}>
                <label
                  htmlFor="startTime"
                  style={{
                    display: "block",
                    marginBottom: "6px",
                    fontWeight: 500,
                  }}
                >
                  Start Time *
                </label>
                <input
                  type="time"
                  id="startTime"
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleChange}
                  required
                  step="60"
                  min={
                    isToday && !isEditing
                      ? `${String(currentHour).padStart(2, "0")}:${String(
                          currentMinute
                        ).padStart(2, "0")}`
                      : undefined
                  }
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "4px",
                    border: "1px solid #ccc",
                  }}
                />
              </div>
              <div className="time-input" style={{ flex: 1 }}>
                <label
                  htmlFor="endTime"
                  style={{
                    display: "block",
                    marginBottom: "6px",
                    fontWeight: 500,
                  }}
                >
                  End Time *
                </label>
                <input
                  type="time"
                  id="endTime"
                  name="endTime"
                  value={formData.endTime}
                  onChange={handleChange}
                  required
                  step="60"
                  min={formData.startTime}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "4px",
                    border: "1px solid #ccc",
                  }}
                />
              </div>
            </div>

            {timeError && (
              <div
                className="error-message"
                style={{
                  marginTop: "-10px",
                  marginBottom: "10px",
                  color: "#f44336",
                  fontSize: "0.875rem",
                }}
              >
                {timeError}
              </div>
            )}

            <div className="form-group" style={{ marginBottom: "16px" }}>
              <label
                htmlFor="location"
                style={{
                  display: "block",
                  marginBottom: "6px",
                  fontWeight: 500,
                }}
              >
                Location
              </label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="Enter location"
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: "4px",
                  border: "1px solid #ccc",
                }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: "16px" }}>
              <label
                htmlFor="attendees"
                style={{
                  display: "block",
                  marginBottom: "6px",
                  fontWeight: 500,
                }}
              >
                Attendees
              </label>
              <input
                type="text"
                id="attendees"
                name="attendees"
                value={formData.attendees}
                onChange={handleChange}
                placeholder="Enter attendee names separated by commas"
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: "4px",
                  border: "1px solid #ccc",
                }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: "16px" }}>
              <label
                htmlFor="description"
                style={{
                  display: "block",
                  marginBottom: "6px",
                  fontWeight: 500,
                }}
              >
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Enter description"
                rows={3}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: "4px",
                  border: "1px solid #ccc",
                  resize: "vertical",
                }}
              />
            </div>

            {/* Add recurrence options */}
            <div
              className="form-group"
              style={{
                marginTop: "20px",
                borderTop: "1px solid #eee",
                paddingTop: "15px",
              }}
            >
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.isRecurring}
                    onChange={handleRecurrenceChange}
                    name="isRecurring"
                  />
                }
                label="Repeat this appointment"
              />

              {formData.isRecurring && (
                <div style={{ marginTop: "10px" }}>
                  <FormControl fullWidth style={{ marginBottom: "15px" }}>
                    <InputLabel id="recurrence-interval-label">
                      Repeat every
                    </InputLabel>
                    <Select
                      labelId="recurrence-interval-label"
                      id="recurrenceInterval"
                      name="recurrenceInterval"
                      value={formData.recurrenceInterval}
                      label="Repeat every"
                      onChange={handleRecurrenceIntervalChange}
                    >
                      <MenuItem value={RecurrenceInterval.Daily}>Day</MenuItem>
                      <MenuItem value={RecurrenceInterval.Weekly}>
                        Week
                      </MenuItem>
                      <MenuItem value={RecurrenceInterval.Monthly}>
                        Month
                      </MenuItem>
                    </Select>
                  </FormControl>

                  <div style={{ marginBottom: "15px" }}>
                    <TextField
                      label="End date (optional)"
                      type="date"
                      fullWidth
                      InputLabelProps={{
                        shrink: true,
                      }}
                      value={
                        formData.recurrenceEndDate
                          ? formData.recurrenceEndDate.split("T")[0]
                          : ""
                      }
                      onChange={(e) => {
                        const date = e.target.value
                          ? new Date(e.target.value)
                          : null;
                        handleRecurrenceEndDateChange(date);
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div
              className="modal-actions"
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "12px",
                marginTop: "24px",
              }}
            >
              <button
                type="button"
                className="cancel-btn"
                onClick={onClose}
                disabled={isSubmitting}
                style={{
                  padding: "8px 16px",
                  borderRadius: "4px",
                  border: "1px solid #ccc",
                  backgroundColor: "#f5f5f5",
                  cursor: isSubmitting ? "not-allowed" : "pointer",
                  opacity: isSubmitting ? 0.7 : 1,
                }}
              >
                Close
              </button>
              <button
                type="submit"
                className="save-btn"
                disabled={isSubmitting}
                style={{
                  padding: "8px 16px",
                  borderRadius: "4px",
                  border: `1px solid ${getAppointmentColor(formData.type)}`,
                  backgroundColor: getAppointmentColor(formData.type),
                  color: "white",
                  cursor: isSubmitting ? "not-allowed" : "pointer",
                  opacity: isSubmitting ? 0.7 : 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {isSubmitting ? (
                  <>
                    <CircularProgress
                      size={16}
                      color="inherit"
                      sx={{ mr: 1 }}
                    />
                    {isEditing ? "Updating..." : "Saving..."}
                  </>
                ) : isEditing ? (
                  "Update"
                ) : (
                  "Save"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AppointmentModal;
