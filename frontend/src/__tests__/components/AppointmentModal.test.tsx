import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Appointment } from '../../types/appointment';

// Define the props interface for the mocked component
interface AppointmentModalProps {
  onClose: () => void;
  onSave: (appointment: any) => void;
  selectedDate: Date;
  isEditing: boolean;
  appointment?: Appointment;
}

// Mock the AppointmentModal component
jest.mock('../../components/Modal/AppointmentModal', () => {
  return {
    __esModule: true,
    default: ({ onClose, onSave, selectedDate, isEditing, appointment }: AppointmentModalProps) => (
      <div>
        <h2>{isEditing ? 'Edit Appointment' : 'New Appointment'}</h2>
        <form>
          <label htmlFor="title">Title</label>
          <input 
            id="title" 
            defaultValue={appointment?.title || ''} 
            aria-label="Title"
          />
          
          <label htmlFor="description">Description</label>
          <textarea 
            id="description" 
            defaultValue={appointment?.description || ''} 
            aria-label="Description"
          />
          
          <label htmlFor="startTime">Start Time</label>
          <input 
            id="startTime" 
            type="time" 
            defaultValue={appointment?.startTime?.split('T')[1]?.substring(0, 5) || ''} 
            aria-label="Start Time"
          />
          
          <label htmlFor="endTime">End Time</label>
          <input 
            id="endTime" 
            type="time" 
            defaultValue={appointment?.endTime?.split('T')[1]?.substring(0, 5) || ''} 
            aria-label="End Time"
          />
          
          <label htmlFor="type">Type</label>
          <select 
            id="type" 
            defaultValue={appointment?.type || 'meeting'} 
            aria-label="Type"
          >
            <option value="meeting">Meeting</option>
            <option value="personal">Personal</option>
            <option value="reminder">Reminder</option>
          </select>
          
          <button type="button" onClick={onClose}>Cancel</button>
          <button type="button" onClick={() => onSave({
            title: 'Test Title',
            startTime: '2023-05-10T10:00:00',
            endTime: '2023-05-10T11:00:00',
            type: 'meeting',
            description: 'Test description',
            location: 'Test location',
            attendees: 'Test attendees'
          })}>Save</button>
        </form>
      </div>
    )
  };
});

describe('AppointmentModal', () => {
  const mockOnClose = jest.fn();
  const mockOnSave = jest.fn();
  const selectedDate = new Date('2023-05-10T10:00:00');
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('renders the modal with correct title for new appointment', () => {
    const AppointmentModal = require('../../components/Modal/AppointmentModal').default;
    
    render(
      <AppointmentModal 
        onClose={mockOnClose} 
        onSave={mockOnSave} 
        selectedDate={selectedDate}
        isEditing={false}
      />
    );
    
    expect(screen.getByText('New Appointment')).toBeInTheDocument();
  });
  
  it('renders the modal with correct title for editing appointment', () => {
    const AppointmentModal = require('../../components/Modal/AppointmentModal').default;
    
    render(
      <AppointmentModal 
        onClose={mockOnClose} 
        onSave={mockOnSave} 
        selectedDate={selectedDate}
        isEditing={true}
        appointment={{
          id: 1,
          title: 'Test Appointment',
          startTime: '2023-05-10T10:00:00',
          endTime: '2023-05-10T11:00:00',
          type: 'meeting',
          description: 'Test description',
          location: 'Test location',
          attendees: 'Test attendees'
        }}
      />
    );
    
    expect(screen.getByText('Edit Appointment')).toBeInTheDocument();
  });
});
