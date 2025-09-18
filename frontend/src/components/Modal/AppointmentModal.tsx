import React, { useState, useEffect } from "react";
import CloseIcon from "@mui/icons-material/Close";
import { addAppointment, updateAppointment } from "../../services/api";
import { Appointment, APPOINTMENT_TYPES, getAppointmentColor } from "../../types/appointment";
import { CircularProgress, Alert } from "@mui/material";

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
  isEditing = false
}) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    startTime: "",
    endTime: "",
    location: "",
    attendees: "", // Add attendees field
    type: APPOINTMENT_TYPES[0].id // Default type
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
  
  // If editing, populate form with appointment data
  useEffect(() => {
    if (isEditing && appointment) {
      // Convert ISO date strings to 24-hour time format
      const startDate = new Date(appointment.startTime);
      const endDate = new Date(appointment.endTime);
      
      setFormData({
        title: appointment.title,
        description: appointment.description || "",
        startTime: `${String(startDate.getHours()).padStart(2, "0")}:${String(startDate.getMinutes()).padStart(2, "0")}`,
        endTime: `${String(endDate.getHours()).padStart(2, "0")}:${String(endDate.getMinutes()).padStart(2, "0")}`,
        location: appointment.location || "",
        attendees: appointment.attendees || "", // Include attendees
        type: appointment.type || APPOINTMENT_TYPES[0].id // Include type with default
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
        startTime: `${String(startHour).padStart(2, "0")}:${String(startMinute).padStart(2, "0")}`,
        endTime: `${String(endHour).padStart(2, "0")}:${String(startMinute).padStart(2, "0")}`,
        location: "",
        attendees: "", // Initialize attendees
        type: APPOINTMENT_TYPES[0].id // Default type
      });
    }
  }, [isEditing, appointment, currentHour, currentMinute]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Clear time error when user changes time inputs
    if (name === "startTime" || name === "endTime") {
      setTimeError("");
    }
    
    // Clear error when user makes any changes
    setError("");
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
    const startDateTime = new Date(formatLocalDateTime(selectedDate, formData.startTime));
    const endDateTime = new Date(formatLocalDateTime(selectedDate, formData.endTime));
    
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
    
    const attendees = attendeesString.split(',').map(a => a.trim()).filter(a => a);
    
    // Check for duplicate attendees
    const uniqueAttendees = new Set(attendees);
    if (uniqueAttendees.size !== attendees.length) {
      setError("Duplicate attendees found");
      return false;
    }
    
    // Validate email format if needed
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = attendees.filter(a => a.includes('@') && !emailRegex.test(a));
    if (invalidEmails.length > 0) {
      setError(`Invalid email format: ${invalidEmails.join(', ')}`);
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
      // Build appointment object with local time strings
      const appointmentData: NewAppointment = {
        title: formData.title,
        description: formData.description || "",
        startTime: formatLocalDateTime(selectedDate, formData.startTime),
        endTime: formatLocalDateTime(selectedDate, formData.endTime),
        location: formData.location || "",
        attendees: formData.attendees || "", // Include attendees
        type: formData.type // Include type
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
          setError("Cannot create appointment. There is already an appointment scheduled at this time.");
          setIsSubmitting(false);
          return;
        }
      }
      
      if (onSave && response.data) {
        onSave(response.data);
      }
      
      onClose();
    } catch (err: any) {
      console.error(`Failed to ${isEditing ? 'update' : 'save'} appointment:`, err);
      
      // Handle different error types
      if (err.message) {
        // Error from our API error handling
        setError(err.message);
      } else if (err.response?.data) {
        // Raw error from server
        const errorData = err.response.data;
        if (typeof errorData === 'string') {
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
        setError(`Failed to ${isEditing ? 'update' : 'save'} appointment. Please try again.`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal">
        <div className="modal-header">
          <h2>{isEditing ? 'Edit Appointment' : 'New Appointment'}</h2>
          <button className="close-btn" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>
        
        {isToday && !isEditing && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Current time: {String(currentHour).padStart(2, "0")}:{String(currentMinute).padStart(2, "0")}
            <br />
            You cannot schedule appointments in the past.
          </Alert>
        )}
        
        {/* Display error with appropriate styling */}
        {error && (
          <div
            className="error-message"
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: '#ffebee',
              border: '1px solid #ffcdd2',
              padding: '10px',
              marginBottom: '15px',
              borderRadius: '4px'
            }}
          >
            <span style={{ marginRight: '8px', fontSize: '1.2rem' }}>❌</span>
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="title">Title *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter title"
              required
              autoFocus
            />
          </div>
          
          {/* Add appointment type selector */}
          <div className="form-group">
            <label htmlFor="type">Appointment Type *</label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '4px',
                borderLeft: `4px solid ${getAppointmentColor(formData.type)}`,
                borderTop: '1px solid #ccc',
                borderRight: '1px solid #ccc',
                borderBottom: '1px solid #ccc'
              }}
              required
            >
              {APPOINTMENT_TYPES.map(type => (
                <option key={type.id} value={type.id}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
          
          {/* Color indicator */}
          <div className="form-group" style={{ marginTop: '-5px', marginBottom: '15px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              fontSize: '12px',
              color: '#666'
            }}>
              <div style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: getAppointmentColor(formData.type),
                marginRight: '8px'
              }}></div>
              <span>Color: {APPOINTMENT_TYPES.find(t => t.id === formData.type)?.label}</span>
            </div>
          </div>
          
          <div className="form-group time-inputs">
            <div className="time-input">
              <label htmlFor="startTime">Start Time *</label>
              <input
                type="time"
                id="startTime"
                name="startTime"
                value={formData.startTime}
                onChange={handleChange}
                required
                step="60"
                min={isToday && !isEditing
                  ? `${String(currentHour).padStart(2, "0")}:${String(currentMinute).padStart(2, "0")}`
                  : undefined}
              />
            </div>
            <div className="time-input">
              <label htmlFor="endTime">End Time *</label>
              <input
                type="time"
                id="endTime"
                name="endTime"
                value={formData.endTime}
                onChange={handleChange}
                required
                step="60"
                min={formData.startTime}
              />
            </div>
          </div>
          
          {timeError && (
            <div className="error-message" style={{ marginTop: '-10px', marginBottom: '10px' }}>
              {timeError}
            </div>
          )}
          
          <div className="form-group">
            <label htmlFor="location">Location</label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="Enter location"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="attendees">Attendees</label>
            <input
              type="text"
              id="attendees"
              name="attendees"
              value={formData.attendees}
              onChange={handleChange}
              placeholder="Enter attendee names separated by commas"
              style={{ width: '100%' }}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Enter description"
              rows={3}
            />
          </div>
          
          <div className="modal-actions">
            <button
              type="button"
              className="cancel-btn"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="save-btn"
              disabled={isSubmitting}
              style={{
                backgroundColor: getAppointmentColor(formData.type),
                borderColor: getAppointmentColor(formData.type)
              }}
            >
              {isSubmitting ? (
                <>
                  <CircularProgress size={16} color="inherit" sx={{ mr: 1 }} />
                  {isEditing ? "Updating..." : "Saving..."}
                </>
              ) : (
                isEditing ? "Update" : "Save"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AppointmentModal;
