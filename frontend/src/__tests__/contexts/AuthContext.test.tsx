import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../../contexts/AuthContext';
import * as authService from '../../services/authService';
import { User } from '../../types/auth';
import { AxiosResponse } from 'axios';

// Mock the auth service
jest.mock('../../services/authService');
const mockedAuthService = authService as jest.Mocked<typeof authService>;

// Create a mock for localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    })
  };
})();

// Replace the global localStorage with our mock
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true
});

// Define the props interface for the mocked component
interface LoginCredentials {
  email: string;
  password: string;
}

// Test component that uses the auth context
const TestComponent = () => {
  const { isAuthenticated, currentUser, login, logout } = useAuth();
  
  // Create a function to handle login with proper types
  const handleLogin = () => {
    // Create a user object to pass to the login function
    const mockUser: User = {
      id: 1,
      email: 'test@example.com',
      username: 'testuser',
      firstName: 'Test',
      lastName: 'User',
      token: 'test-token'
    };
    
    // Call login with the user object
    login(mockUser);
  };
  
  return (
    <div>
      <div data-testid="auth-status">{isAuthenticated ? 'Authenticated' : 'Not Authenticated'}</div>
      {currentUser && <div data-testid="user-email">{currentUser.email}</div>}
      <button onClick={handleLogin}>Login</button>
      <button onClick={logout}>Logout</button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorageMock.clear();
    jest.clearAllMocks();
  });
  
  it('should provide authentication status and user data', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Initially not authenticated
    expect(screen.getByTestId('auth-status')).toHaveTextContent('Not Authenticated');
  });
  
  it('should handle login successfully', async () => {
    // Mock successful login
    const mockUser: User = {
      id: 1,
      email: 'test@example.com',
      username: 'testuser',
      firstName: 'Test',
      lastName: 'User',
      token: 'test-token'
    };
    
    // Create a proper AxiosResponse object
    const mockResponse: AxiosResponse<User> = {
      data: mockUser,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as any
    };
    
    mockedAuthService.login.mockResolvedValueOnce(mockResponse);
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Click login button
    act(() => {
      fireEvent.click(screen.getByText('Login'));
    });
    
    // Wait for auth state to update
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
      expect(screen.getByTestId('user-email')).toHaveTextContent('test@example.com');
    });
    
    // Check if token was stored in localStorage
    expect(localStorageMock.setItem).toHaveBeenCalledWith('token', 'test-token');
  });
  
  it('should handle logout', async () => {
    // Setup initial authenticated state
    localStorageMock.setItem('token', 'test-token');
    
    // Mock getCurrentUser to return a user
    const mockUser: User = {
      id: 1,
      email: 'test@example.com',
      username: 'testuser',
      firstName: 'Test',
      lastName: 'User',
      token: 'test-token'
    };
    
    // Create a proper AxiosResponse object
    const mockResponse: AxiosResponse<User> = {
      data: mockUser,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as any
    };
    
    mockedAuthService.getCurrentUser.mockResolvedValueOnce(mockResponse);
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Wait for auth state to load from localStorage
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
    });
    
    // Click logout button
    act(() => {
      fireEvent.click(screen.getByText('Logout'));
    });
    
    // Check if logged out
    expect(screen.getByTestId('auth-status')).toHaveTextContent('Not Authenticated');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('token');
  });
});
