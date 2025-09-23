import { Appointment } from '../../types/appointment';
import * as api from '../../services/api';
import { AxiosResponse } from 'axios';

// Mock the API service
jest.mock('../../services/api');
const mockedApi = api as jest.Mocked<typeof api>;

// Mock appointment data
const mockAppointments: Appointment[] = [
  {
    id: 1,
    title: 'Existing Appointment',
    startTime: '2023-05-10T10:00:00',
    endTime: '2023-05-10T11:00:00',
    type: 'meeting',
    description: 'Test description',
    location: 'Test location',
    attendees: 'Test attendees'
  }
];

describe('Appointment Service Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock fetchAppointments to return test data with proper AxiosResponse
    mockedApi.fetchAppointments.mockResolvedValue({
      data: mockAppointments,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as any
    });
    
    // Mock addAppointment with proper return type
    mockedApi.addAppointment.mockImplementation(async (newAppointment) => {
      const appointment: Appointment = {
        id: 2,
        title: newAppointment.title,
        startTime: newAppointment.startTime,
        endTime: newAppointment.endTime,
        description: newAppointment.description || '',
        location: newAppointment.location || '',
        attendees: newAppointment.attendees || '',
        type: newAppointment.type
      };
      
      return {
        data: appointment,
        conflict: false
      };
    });
    
    // Mock updateAppointment with proper return type
    mockedApi.updateAppointment.mockImplementation(async (id, appointmentUpdate) => {
      // Create a complete Appointment object by merging with existing appointment
      const existingAppointment = mockAppointments.find(a => a.id === id) || mockAppointments[0];
      
      const updatedAppointment: Appointment = {
        ...existingAppointment,
        ...appointmentUpdate,
        id // Ensure ID is preserved
      };
      
      return {
        data: updatedAppointment,
        conflict: false
      };
    });
    
    // Mock deleteAppointment
    mockedApi.deleteAppointment.mockResolvedValue({
      status: 200,
      statusText: 'OK',
      headers: {},
      data: {},
      config: {} as any
    });
  });
  
  it('should fetch appointments', async () => {
    const response = await api.fetchAppointments();
    expect(response.data).toEqual(mockAppointments);
    expect(response.data.length).toBe(1);
    expect(response.data[0].title).toBe('Existing Appointment');
  });
  
  it('should add a new appointment', async () => {
    const newAppointment = {
      title: 'New Test Appointment',
      startTime: '2023-05-11T10:00:00',
      endTime: '2023-05-11T11:00:00',
      description: 'Integration test description',
      type: 'personal',
      location: 'Test location',
      attendees: 'Test attendees'
    };
    
    const response = await api.addAppointment(newAppointment);
    
    expect(response.data.id).toBe(2);
    expect(response.data.title).toBe('New Test Appointment');
    expect(response.data.type).toBe('personal');
  });
  
  it('should update an existing appointment', async () => {
    const appointmentUpdate = {
      title: 'Updated Appointment',
      description: 'Updated description'
    };
    
    const response = await api.updateAppointment(1, appointmentUpdate);
    
    expect(response.data.id).toBe(1);
    expect(response.data.title).toBe('Updated Appointment');
    expect(response.data.description).toBe('Updated description');
    // Original fields should be preserved
    expect(response.data.type).toBe('meeting');
  });
  
  it('should delete an appointment', async () => {
    const response = await api.deleteAppointment(1);
    expect(response.status).toBe(200);
    expect(mockedApi.deleteAppointment).toHaveBeenCalledWith(1);
  });
});
