import axios from 'axios';
import { fetchAppointments, addAppointment, updateAppointment, deleteAppointment } from '../../services/api';
import { NewAppointment } from '../../types/appointment';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('API Services', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  describe('fetchAppointments', () => {
    it('should fetch appointments successfully', async () => {
      // Mock data
      const appointments = [
        {
          id: 1,
          title: 'Test Appointment',
          startTime: '2023-05-10T10:00:00',
          endTime: '2023-05-10T11:00:00',
          type: 'meeting',
          description: '',
          location: '',
          attendees: ''
        }
      ];
      
      // Setup mock response
      mockedAxios.get.mockResolvedValueOnce({ data: appointments });
      
      // Call the function
      const result = await fetchAppointments();
      
      // Assertions
      expect(mockedAxios.get).toHaveBeenCalledWith('http://localhost:5169/api/appointments');
      expect(result.data).toEqual(appointments);
    });
    
    it('should handle errors when fetching appointments', async () => {
      // Setup mock error
      const errorMessage = 'Network Error';
      mockedAxios.get.mockRejectedValueOnce(new Error(errorMessage));
      
      // Call and expect error
      await expect(fetchAppointments()).rejects.toThrow(errorMessage);
    });
  });
  
  describe('addAppointment', () => {
    it('should add an appointment successfully', async () => {
      // Mock data
      const newAppointment: NewAppointment = {
        title: 'New Appointment',
        startTime: '2023-05-10T10:00:00',
        endTime: '2023-05-10T11:00:00',
        type: 'meeting',
        description: 'Test description',
        location: 'Test location',
        attendees: 'Test attendees'
      };
      
      const createdAppointment = {
        id: 1,
        ...newAppointment
      };
      
      // Setup mock response
      mockedAxios.post.mockResolvedValueOnce({ data: createdAppointment });
      
      // Call the function
      const result = await addAppointment(newAppointment);
      
      // Assertions
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://localhost:5169/api/appointments',
        expect.objectContaining({
          title: 'New Appointment',
          type: 'meeting'
        })
      );
      expect(result.data).toEqual(createdAppointment);
    });
  });
  
  describe('deleteAppointment', () => {
    it('should delete an appointment successfully', async () => {
      // Setup mock response
      mockedAxios.delete.mockResolvedValueOnce({ data: {} });
      
      // Call the function
      await deleteAppointment(1);
      
      // Assertions
      expect(mockedAxios.delete).toHaveBeenCalledWith('http://localhost:5169/api/appointments/1');
    });
    
    it('should handle 404 error when deleting appointment', async () => {
      // Setup mock error
      const error = {
        response: {
          status: 404,
          data: 'Appointment not found'
        }
      };
      mockedAxios.delete.mockRejectedValueOnce(error);
      
      // Call and expect error
      await expect(deleteAppointment(999)).rejects.toThrow('Appointment not found');
    });
  });
});
