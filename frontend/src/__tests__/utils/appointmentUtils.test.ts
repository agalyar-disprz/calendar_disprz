import { hasConflict } from '../../utils/appointmentUtils';
import { Appointment } from '../../types/appointment';

describe('appointmentUtils', () => {
  describe('hasConflict', () => {
    it('should return true when there is an overlapping appointment', () => {
      // Arrange
      const appointment: Appointment = {
        id: 1,
        title: 'Test Appointment',
        startTime: '2023-05-10T10:00:00',
        endTime: '2023-05-10T11:00:00',
        type: 'meeting',
        description: '',
        location: '',
        attendees: ''
      };
      
      const allAppointments: Appointment[] = [
        {
          id: 2,
          title: 'Existing Appointment',
          startTime: '2023-05-10T10:30:00',
          endTime: '2023-05-10T11:30:00',
          type: 'meeting',
          description: '',
          location: '',
          attendees: ''
        }
      ];
      
      // Act
      const result = hasConflict(appointment, allAppointments);
      
      // Assert
      expect(result).toBe(true);
    });
    
    it('should return false when there is no overlapping appointment', () => {
      // Arrange
      const appointment: Appointment = {
        id: 1,
        title: 'Test Appointment',
        startTime: '2023-05-10T10:00:00',
        endTime: '2023-05-10T11:00:00',
        type: 'meeting',
        description: '',
        location: '',
        attendees: ''
      };
      
      const allAppointments: Appointment[] = [
        {
          id: 2,
          title: 'Existing Appointment',
          startTime: '2023-05-10T11:00:00',
          endTime: '2023-05-10T12:00:00',
          type: 'meeting',
          description: '',
          location: '',
          attendees: ''
        }
      ];
      
      // Act
      const result = hasConflict(appointment, allAppointments);
      
      // Assert
      expect(result).toBe(false);
    });
  });
});
