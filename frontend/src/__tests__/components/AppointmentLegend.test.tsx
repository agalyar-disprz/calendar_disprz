import React from 'react';
import { render, screen } from '@testing-library/react';
import AppointmentLegend from '../../components/AppointmentLegend';
import { APPOINTMENT_TYPES } from '../../types/appointment';

describe('AppointmentLegend', () => {
  it('renders the legend title', () => {
    render(<AppointmentLegend />);
    expect(screen.getByText('Appointment Types')).toBeInTheDocument();
  });
  
  it('renders all appointment types', () => {
    render(<AppointmentLegend />);
    
    APPOINTMENT_TYPES.forEach(type => {
      expect(screen.getByText(type.label)).toBeInTheDocument();
    });
  });
  
  it('renders the correct number of legend items', () => {
    const { container } = render(<AppointmentLegend />);
    
    // Use querySelector with the container to find elements by class name
    const legendItems = container.querySelectorAll('.legend-item');
    expect(legendItems.length).toBe(APPOINTMENT_TYPES.length);
  });
});
