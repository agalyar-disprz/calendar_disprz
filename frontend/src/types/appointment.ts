export interface Appointment {
  id: number;
  title: string;
  startTime: string; // ISO string
  endTime: string;   // ISO string
  description?: string;
  location?: string;
  attendees?: string; 
}

export interface NewAppointment {
  title: string;
  startTime: string; // ISO string
  endTime: string;   // ISO string
  description?: string;
  location?: string;
  attendees?: string; 
}
