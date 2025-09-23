import axios, { AxiosError } from 'axios';
import { Appointment, NewAppointment } from '../types/appointment';
import { User, RegisterFormData, LoginFormData } from '../types/auth';

const API_URL = 'http://localhost:5169/api';

// Configure axios defaults
axios.interceptors.request.use(
  config => {
    // Use sessionStorage instead of localStorage
    const token = sessionStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// Add response interceptor to handle token expiration
axios.interceptors.response.use(
  response => response,
  error => {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<any>;
      
      // Check if error is due to token expiration (401 Unauthorized)
      if (axiosError.response?.status === 401) {
        console.log('Token expired or invalid. Redirecting to login...');
        
        // Clear auth data
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        
        // Redirect to login page
        window.location.href = '/login?expired=true';
        
        // Return a clearer error message
        return Promise.reject(new Error('Your session has expired. Please log in again.'));
      }
    }
    return Promise.reject(error);
  }
);

// Auth API calls
export const register = async (userData: RegisterFormData) => {
  return axios.post<User>(`${API_URL}/auth/register`, userData);
};

export const login = async (userData: LoginFormData) => {
  const response = await axios.post<User>(`${API_URL}/auth/login`, userData);
  if (response.data && response.data.token) {
    // Use sessionStorage instead of localStorage
    sessionStorage.setItem('token', response.data.token);
    // Also store user data in sessionStorage
    sessionStorage.setItem('user', JSON.stringify(response.data));
  }
  return response;
};

export const getCurrentUser = async () => {
  return axios.get<User>(`${API_URL}/auth/current`);
};

export const logout = () => {
  // Clear from sessionStorage instead of localStorage
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('user');
};

// Appointment API calls
export const fetchAppointments = async () => {
  return axios.get<Appointment[]>(`${API_URL}/appointments`);
};

// Add this function to fetch appointments with date range parameters
export const fetchAppointmentsWithDateRange = async (start?: Date, end?: Date) => {
  // Format dates as ISO strings if provided
  const startParam = start ? start.toISOString() : undefined;
    let endDate = end;
  if (endDate) {
    endDate = new Date(endDate);
    endDate.setDate(endDate.getDate() + 1);
  }
  const endParam = end ? end.toISOString() : undefined;
  
  // Build URL with query parameters
  let url = `${API_URL}/appointments`;
  const params = [];
  
  if (startParam) {
    params.push(`start=${startParam}`);
  }
  
  if (endParam) {
    params.push(`end=${endParam}`);
  }
  
  if (params.length > 0) {
    url += `?${params.join('&')}`;
  }
  
  console.log(`Fetching appointments with date range: ${url}`);
  return axios.get<Appointment[]>(url);
};

// Fetch appointments for a specific day
export const fetchAppointmentsByDay = async (date: Date) => {
  const formattedDate = date.toISOString().split('T')[0];
  return axios.get<Appointment[]>(`${API_URL}/appointments/day?date=${formattedDate}`);
};

// Add appointment with proper error handling
export const addAppointment = async (appointment: NewAppointment): Promise<{ data: Appointment; conflict?: boolean }> => {
  try {
    // Send dates as local datetime strings without timezone conversion
    const appointmentData = {
      title: appointment.title || '',
      startTime: appointment.startTime, // Send as-is without toISOString()
      endTime: appointment.endTime,     // Send as-is without toISOString()
      description: appointment.description || '',
      location: appointment.location || '',
      attendees: appointment.attendees || '',
      type: appointment.type || 'other', // Default to 'other' if not provided
      
      // Add recurrence properties
      isRecurring: appointment.isRecurring || false,
      recurrenceInterval: appointment.recurrenceInterval,
      recurrenceEndDate: appointment.recurrenceEndDate
    };
    
    console.log('Sending appointment data with recurrence:', appointmentData);
    
    const response = await axios.post<Appointment>(`${API_URL}/appointments`, appointmentData);
    return { data: response.data };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<any>;
      
      // Log full error for debugging
      console.error('Appointment creation error:', {
        status: axiosError.response?.status,
        data: axiosError.response?.data,
        headers: axiosError.response?.headers
      });
      
      // Handle validation errors (400)
      if (axiosError.response?.status === 400) {
        const errorData = axiosError.response.data;
        
        // Check for validation errors in different formats
        if (errorData?.errors) {
          // Handle ASP.NET Core validation error format
          const errors = errorData.errors;
          const errorMessages = Object.entries(errors)
            .map(([field, messages]) => {
              const msgs = Array.isArray(messages) ? messages : [messages];
              return `${field}: ${msgs.join(', ')}`;
            })
            .join('; ');
            
          throw new Error(`Validation failed: ${errorMessages}`);
        }
        
        // Handle other error formats
        throw new Error(
          errorData?.error ||
          errorData?.message ||
          errorData?.title ||
          'Validation error occurred'
        );
      }
      
      // Handle conflicts (409)
      if (axiosError.response?.status === 409) {
        return {
          data: appointment as Appointment,
          conflict: true
        };
      }
      
      // Handle unauthorized (401)
      if (axiosError.response?.status === 401) {
        throw new Error('Unauthorized. Please log in again.');
      }
    }
    throw error;
  }
};

// Update appointment with proper error handling
export const updateAppointment = async (id: number, appointment: Partial<Appointment>): Promise<{ data: Appointment; conflict?: boolean }> => {
  try {
    // Remove id from the payload - IMPORTANT: Backend doesn't expect ID in body for PUT requests
    const { id: _, ...appointmentData } = appointment;
    
    // Build clean update payload
    const updatePayload: Record<string, any> = {};
    
    // Only include fields that are defined
    if (appointmentData.title !== undefined) updatePayload.title = appointmentData.title;
    if (appointmentData.description !== undefined) updatePayload.description = appointmentData.description;
    if (appointmentData.location !== undefined) updatePayload.location = appointmentData.location;
    if (appointmentData.attendees !== undefined) updatePayload.attendees = appointmentData.attendees;
    if (appointmentData.type !== undefined) updatePayload.type = appointmentData.type;
    
    // Add recurrence properties
    if (appointmentData.isRecurring !== undefined) updatePayload.isRecurring = appointmentData.isRecurring;
    if (appointmentData.recurrenceInterval !== undefined) updatePayload.recurrenceInterval = appointmentData.recurrenceInterval;
    if (appointmentData.recurrenceEndDate !== undefined) updatePayload.recurrenceEndDate = appointmentData.recurrenceEndDate;
    
    // Add update all future events flag if editing a recurring appointment
    updatePayload.updateAllFutureEvents = appointment.isRecurring && true;
    
    // Send dates as-is without timezone conversion
    if (appointmentData.startTime !== undefined) {
      updatePayload.startTime = appointmentData.startTime;
    }
    if (appointmentData.endTime !== undefined) {
      updatePayload.endTime = appointmentData.endTime;
    }
    
    console.log(`Updating appointment ${id} with data (including recurrence):`, updatePayload);
    
    const response = await axios.put<Appointment>(`${API_URL}/appointments/${id}`, updatePayload);
    
    // Return the updated appointment data from server
    return { data: response.data };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<any>;
      
      console.error('Update appointment error:', {
        status: axiosError.response?.status,
        data: axiosError.response?.data
      });
      
      // Handle validation errors (400)
      if (axiosError.response?.status === 400) {
        const errorData = axiosError.response.data;
        
        // Handle specific "ID mismatch" error
        if (typeof errorData === 'string' && errorData.toLowerCase().includes('id mismatch')) {
          throw new Error('ID mismatch error. Please ensure you are not sending ID in the request body.');
        }
        
        // Handle validation errors
        if (errorData?.errors) {
          const errors = errorData.errors;
          const errorMessages = Object.entries(errors)
            .map(([field, messages]) => {
              const msgs = Array.isArray(messages) ? messages : [messages];
              return `${field}: ${msgs.join(', ')}`;
            })
            .join('; ');
            
          throw new Error(`Validation failed: ${errorMessages}`);
        }
        
        // Handle other error formats
        throw new Error(
          errorData?.error ||
          errorData?.message ||
          errorData?.title ||
          errorData || // Include raw error data if it's a string
          'Validation error occurred'
        );
      }
      
      // Handle conflicts (409)
      if (axiosError.response?.status === 409) {
        // For conflicts, we should probably fetch the conflicting appointment
        // or return a meaningful response, not the incomplete appointment data
        throw new Error('This appointment conflicts with an existing appointment. Please choose a different time.');
      }
      
      // Handle unauthorized (401)
      if (axiosError.response?.status === 401) {
        throw new Error('Unauthorized. Please log in again.');
      }
      
      // Handle not found (404)
      if (axiosError.response?.status === 404) {
        throw new Error('Appointment not found. It may have been deleted.');
      }
    }
    throw error;
  }
};

// Delete appointment
export const deleteAppointment = async (id: number) => {
  try {
    return await axios.delete(`${API_URL}/appointments/${id}`);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<any>;
      
      if (axiosError.response?.status === 404) {
        throw new Error('Appointment not found. It may have already been deleted.');
      }
      
      if (axiosError.response?.status === 401) {
        throw new Error('Unauthorized. Please log in again.');
      }
    }
    throw error;
  }
};

// Add a function to delete recurring appointments with option to delete all future occurrences
export const deleteRecurringAppointment = async (id: number, deleteAllFuture: boolean = false) => {
  try {
    return await axios.delete(`${API_URL}/appointments/${id}?deleteAllFuture=${deleteAllFuture}`);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<any>;
      
      if (axiosError.response?.status === 404) {
        throw new Error('Appointment not found. It may have already been deleted.');
      }
      
      if (axiosError.response?.status === 401) {
        throw new Error('Unauthorized. Please log in again.');
      }
    }
    throw error;
  }
};

// Helper function to set auth token
export const setAuthToken = (token: string | null) => {
  if (token) {
    // Use sessionStorage instead of localStorage
    sessionStorage.setItem('token', token);
  } else {
    // Clear from sessionStorage instead of localStorage
    sessionStorage.removeItem('token');
  }
};

// Add this function to your api.ts file
// Fetch recurring appointments for a date range
export const fetchRecurringAppointments = async (startDate: Date, endDate: Date) => {
  const formattedStartDate = startDate.toISOString();
  const formattedEndDate = endDate.toISOString();
 
  return axios.get<Appointment[]>(
    `${API_URL}/appointments/recurring?startDate=${formattedStartDate}&endDate=${formattedEndDate}`
  );
};

// Enhanced error message helper
export const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<any>;
    
    if (axiosError.response) {
      const { status, data } = axiosError.response;
      
      // Handle validation errors with field-specific messages
      if (status === 400 && data?.errors) {
        const errors = data.errors;
        const errorMessages = Object.entries(errors)
          .map(([field, messages]) => {
            const msgs = Array.isArray(messages) ? messages : [messages];
            return `${field}: ${msgs.join(', ')}`;
          })
          .join('; ');
        return errorMessages;
      }
      
      // Handle other error formats
      if (data) {
        if (typeof data === 'string') return data;
        if (data.error) return data.error;
        if (data.message) return data.message;
        if (data.title) return data.title;
      }
      
      // Status-based messages
      switch (status) {
        case 401:
          return 'Unauthorized. Please log in again.';
        case 403:
          return 'You do not have permission to perform this action.';
        case 404:
          return 'Resource not found.';
        case 409:
          return 'This appointment conflicts with an existing appointment.';
        case 500:
          return 'Server error. Please try again later.';
        default:
          return `Server error: ${status}`;
      }
    } else if (axiosError.request) {
      return 'No response from server. Please check your connection.';
    } else {
      return axiosError.message || 'An unknown error occurred';
    }
  }
 
  return error instanceof Error ? error.message : 'An unknown error occurred';
};
