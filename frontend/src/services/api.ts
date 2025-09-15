import axios from 'axios';
import { Appointment, NewAppointment } from "../types/appointment";

// Get API URL from environment variables or use a default
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5169/api";

// Create axios instance
const API = axios.create({
  baseURL: API_URL,
});

// Fetch all appointments
export const fetchAppointments = () => {
  return API.get<Appointment[]>("/appointments");
};

// Add new appointment
export const addAppointment = (appointment: NewAppointment) => {
  return API.post<Appointment>("/appointments", appointment);
};

export default API;
