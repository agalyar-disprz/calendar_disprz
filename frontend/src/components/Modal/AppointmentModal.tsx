import React from "react";

interface Props {
  onClose: () => void;
}

const AppointmentModal: React.FC<Props> = ({ onClose }) => {
  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>New Appointment</h2>
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
            <button type="submit">Save</button>
            <button type="button" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AppointmentModal;
