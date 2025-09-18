import React from 'react';
import { APPOINTMENT_TYPES } from '../types/appointment';

const AppointmentLegend: React.FC = () => {
  return (
    <div className="appointment-legend">
      <h4>Appointment Types</h4>
      <div className="legend-items">
        {APPOINTMENT_TYPES.map(type => (
          <div key={type.id} className="legend-item">
            <div 
              className="color-dot" 
              style={{ backgroundColor: type.color }}
            ></div>
            <span>{type.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AppointmentLegend;
