import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types/auth';
import { getCurrentUser, setAuthToken } from '../services/api'; // Changed from authService to api
import axios from 'axios';

// Generate a unique tab ID
const TAB_ID = `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Function to get tab-specific storage keys
const getTabKey = (key: string) => `${TAB_ID}_${key}`;

interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  isAuthenticated: false,
  isLoading: true,
  login: () => {},
  logout: () => {}
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // First try to get user from tab-specific sessionStorage
    const userStr = sessionStorage.getItem(getTabKey('user'));
    const token = sessionStorage.getItem(getTabKey('token'));
    
    if (userStr && token) {
      try {
        // Parse user from sessionStorage
        const user = JSON.parse(userStr);
        setCurrentUser(user);
        setAuthToken(token);
        // Still load user from API to ensure data is fresh
        loadUser();
      } catch (error) {
        console.error('Error parsing user from sessionStorage:', error);
        setIsLoading(false);
      }
    } else {
      // Fall back to regular sessionStorage (for backward compatibility)
      const regularToken = sessionStorage.getItem('token');
      
      if (regularToken) {
        setAuthToken(regularToken);
        loadUser();
      } else {
        setIsLoading(false);
      }
    }
  }, []);

  const loadUser = async () => {
    try {
      const response = await getCurrentUser();
      setCurrentUser(response.data);
      
      // Store in tab-specific sessionStorage
      sessionStorage.setItem(getTabKey('user'), JSON.stringify(response.data));
    } catch (error) {
      console.error('Failed to load user:', error);
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  const login = (user: User) => {
    // Store token in tab-specific sessionStorage
    setAuthToken(user.token);
    sessionStorage.setItem(getTabKey('user'), JSON.stringify(user));
    setCurrentUser(user);
  };

  const logout = () => {
    // Clear from tab-specific sessionStorage
    sessionStorage.removeItem(getTabKey('token'));
    sessionStorage.removeItem(getTabKey('user'));
    
    // Also clear from regular sessionStorage for backward compatibility
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    
    setAuthToken(null);
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!currentUser,
        isLoading,
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
