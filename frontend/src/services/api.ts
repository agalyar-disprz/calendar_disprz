import axios from 'axios';
import { Appointment, NewAppointment } from '../types/appointment';
import { User, RegisterFormData, LoginFormData } from '../types/auth';

const API_URL = 'http://localhost:5169/api';

// Configure axios defaults
axios.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// Auth API calls
export const register = async (userData: RegisterFormData) => {
  return axios.post<User>(`${API_URL}/auth/register`, userData);
};

export const login = async (userData: LoginFormData) => {
  const response = await axios.post<User>(`${API_URL}/auth/login`, userData);
  if (response.data && response.data.token) {
    localStorage.setItem('token', response.data.token);
  }
  return response;
};

export const getCurrentUser = async () => {
  return axios.get<User>(`${API_URL}/auth/current`);
};

export const logout = () => {
  localStorage.removeItem('token');
};

// Appointment API calls
export const fetchAppointments = async () => {
  return axios.get<Appointment[]>(`${API_URL}/appointments`);
};

export const addAppointment = async (appointment: NewAppointment) => {
  return axios.post<Appointment>(`${API_URL}/appointments`, appointment);
};

export const updateAppointment = async (id: number, appointment: Partial<Appointment>) => {
  return axios.put<Appointment>(`${API_URL}/appointments/${id}`, appointment);
};

export const deleteAppointment = async (id: number) => {
  return axios.delete(`${API_URL}/appointments/${id}`);
};

// Helper function to set auth token
export const setAuthToken = (token: string | null) => {
  if (token) {
    localStorage.setItem('token', token);
  } else {
    localStorage.removeItem('token');
  }
};
