export interface Appointment {
  id: number;
  title: string;
  startTime: string; // ISO string
  endTime: string;   // ISO string
  description?: string;
  location?: string;
  attendees?: string;
  type: string;     // Add appointment type field
}

export interface NewAppointment {
  title: string;
  startTime: string; // ISO string
  endTime: string;   // ISO string
  description?: string;
  location?: string;
  attendees?: string;
  type: string;     // Add appointment type field
}

// Define appointment types and their colors
export const APPOINTMENT_TYPES = [
  { id: 'meeting', label: 'Meeting', color: '#4285F4' },       // Blue
  { id: 'personal', label: 'Personal', color: '#0F9D58' },     // Green
  { id: 'reminder', label: 'Reminder', color: '#F4B400' },     // Yellow
  { id: 'deadline', label: 'Deadline', color: '#DB4437' },     // Red
  { id: 'travel', label: 'Travel', color: '#9C27B0' },         // Purple
  { id: 'health', label: 'Health', color: '#00BCD4' },         // Cyan
  { id: 'social', label: 'Social', color: '#FF9800' },         // Orange
  { id: 'other', label: 'Other', color: '#757575' }            // Gray
];

// Helper function to get color for appointment type
export const getAppointmentColor = (type?: string): string => {
  if (!type) return '#757575'; // Default gray
  const appointmentType = APPOINTMENT_TYPES.find(t => t.id === type);
  return appointmentType?.color || '#757575';
};
