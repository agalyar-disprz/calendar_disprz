export interface Appointment {
  id: number;
  title: string;
  startTime: string; // ISO string
  endTime: string;   // ISO string
  description?: string;
}
