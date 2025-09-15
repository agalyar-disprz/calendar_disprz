import React, { useState } from "react";
import CloseIcon from "@mui/icons-material/Close";
import { addAppointment } from "../../services/api";
import { Appointment } from "../../types/appointment";

interface Props {
  onClose: () => void;
  onSave?: (appointment: Appointment) => void;
  selectedDate: Date;
}

// Define a type for new appointments without requiring an ID
type NewAppointment = Omit<Appointment, "id">;

const AppointmentModal: React.FC<Props> = ({ onClose, onSave, selectedDate }) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    startTime: "",
    endTime: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ✅ Helper: Combine selected date + entered time into "YYYY-MM-DDTHH:mm"
  const formatLocalDateTime = (date: Date, time: string) => {
    const [hours, minutes] = time.split(":").map(Number);
    const localDate = new Date(date);
    localDate.setHours(hours, minutes, 0, 0);

    // Return in local time format (not UTC)
    const year = localDate.getFullYear();
    const month = String(localDate.getMonth() + 1).padStart(2, "0");
    const day = String(localDate.getDate()).padStart(2, "0");
    const hh = String(hours).padStart(2, "0");
    const mm = String(minutes).padStart(2, "0");

    return `${year}-${month}-${day}T${hh}:${mm}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      // Build appointment object with local time strings
      const newAppointment: NewAppointment = {
        title: formData.title,
        description: formData.description,
        startTime: formatLocalDateTime(selectedDate, formData.startTime),
        endTime: formatLocalDateTime(selectedDate, formData.endTime)
      };

      const response = await addAppointment(newAppointment);

      if (onSave && response.data) {
        onSave(response.data);
      }

      onClose();
    } catch (err) {
      console.error("Failed to save appointment:", err);
      setError("Failed to save appointment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2>New Appointment</h2>
          <button className="close-btn" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <label htmlFor="title">Title</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Enter title"
            required
          />

          <label htmlFor="startTime">Start Time</label>
          <input
            type="time"
            id="startTime"
            name="startTime"
            value={formData.startTime}
            onChange={handleChange}
            required
          />

          <label htmlFor="endTime">End Time</label>
          <input
            type="time"
            id="endTime"
            name="endTime"
            value={formData.endTime}
            onChange={handleChange}
            required
          />

          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Enter description"
          />

          {error && <div className="error-message">{error}</div>}

          <div className="modal-actions">
            <button
              type="submit"
              className="save-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Save"}
            </button>
            <button
              type="button"
              className="cancel-btn"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AppointmentModal;
