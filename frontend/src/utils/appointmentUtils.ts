import { Appointment } from "../types/appointment";

/**
 * Checks if two appointments overlap in time
 */
export const doAppointmentsOverlap = (appt1: Appointment, appt2: Appointment): boolean => {
  const start1 = new Date(appt1.startTime).getTime();
  const end1 = new Date(appt1.endTime).getTime();
  const start2 = new Date(appt2.startTime).getTime();
  const end2 = new Date(appt2.endTime).getTime();

  // Check if one appointment starts during the other appointment
  return (start1 < end2 && start2 < end1);
};

/**
 * Finds all appointments that overlap with the given appointment
 */
export const findOverlappingAppointments = (
  appointment: Appointment,
  allAppointments: Appointment[]
): Appointment[] => {
  return allAppointments.filter(
    (existingAppt) => 
      existingAppt.id !== appointment.id && 
      doAppointmentsOverlap(appointment, existingAppt)
  );
};

/**
 * Checks if an appointment conflicts with any existing appointments
 */
export const hasConflict = (
  appointment: Appointment,
  allAppointments: Appointment[]
): boolean => {
  return findOverlappingAppointments(appointment, allAppointments).length > 0;
};
