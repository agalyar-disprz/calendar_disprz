import React from "react";
import CloseIcon from "@mui/icons-material/Close";

interface Props {
  onClose: () => void;
}

const AppointmentModal: React.FC<Props> = ({ onClose }) => {
  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2>New Appointment</h2>
          <button className="close-btn" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>
        <form>
          <label>Title</label>
          <input type="text" placeholder="Enter title" />

          <label>Start Time</label>
          <input type="time" />

          <label>End Time</label>
          <input type="time" />

          <label>Description</label>
          <textarea placeholder="Enter description" />

          <div className="modal-actions">
            <button type="submit" className="save-btn">Save</button>
            <button type="button" className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AppointmentModal;
