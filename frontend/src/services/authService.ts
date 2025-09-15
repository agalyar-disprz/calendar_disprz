import axios from 'axios';
import { User, RegisterFormData, LoginFormData } from '../types/auth';

const API_URL = 'http://localhost:5169/api/auth';

// Register user
export const register = async (userData: RegisterFormData) => {
  return axios.post<User>(`${API_URL}/register`, userData);
};

// Login user
export const login = async (userData: LoginFormData) => {
  return axios.post<User>(`${API_URL}/login`, userData);
};

// Get current user
export const getCurrentUser = async () => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    throw new Error('No token found');
  }
  
  return axios.get<User>(`${API_URL}/current`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
};

// Set auth token for future requests
export const setAuthToken = (token: string | null) => {
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    localStorage.setItem('token', token);
  } else {
    delete axios.defaults.headers.common['Authorization'];
    localStorage.removeItem('token');
  }
};
