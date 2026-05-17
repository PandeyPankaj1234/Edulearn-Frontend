import { createContext, useContext, useMemo, useState, useEffect } from 'react';
import { authApi } from '../api/services';

const AuthContext = createContext(null);

const storedUser = () => {
  const raw = localStorage.getItem('edulearn_user');
  return raw ? JSON.parse(raw) : null;
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(storedUser);

  // Helper properties to check user roles based on the API response structure
  // Expecting user.role to be 'Student', 'Instructor', or 'Admin'
  const isStudent = user?.role === 'Student';
  const isInstructor = user?.role === 'Instructor';
  const isAdmin = user?.role === 'Admin';
  const isAuthenticated = !!user;

  async function login(credentials) {
    const response = await authApi.login(credentials);
    // If backend doesn't provide a role, default to Student for testing
    const userData = { ...response, role: response.role || 'Student' };
    localStorage.setItem('edulearn_token', userData.token || '');
    localStorage.setItem('edulearn_user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  }

  async function register(data) {
    // Only create the account — do NOT auto-login
    const response = await authApi.register(data);
    return response;
  }

  function logout() {
    localStorage.removeItem('edulearn_token');
    localStorage.removeItem('edulearn_user');
    setUser(null);
  }

  // Developer utility to force login as a specific role for UI testing
  function mockLogin(role) {
    const mockUser = {
      id: 1,
      name: 'Test ' + role,
      email: 'test@edulearn.com',
      role: role,
      token: 'mock-' + role   // e.g. "mock-Admin" — JwtAuthFilter handles this
    };
    localStorage.setItem('edulearn_token', mockUser.token);
    localStorage.setItem('edulearn_user', JSON.stringify(mockUser));
    setUser(mockUser);
  }

  // Called after Google OAuth — receives the backend's auth response directly
  function loginWithToken(authResponse) {
    const userData = { ...authResponse, role: authResponse.role || 'Student' };
    localStorage.setItem('edulearn_token', userData.token || '');
    localStorage.setItem('edulearn_user', JSON.stringify(userData));
    setUser(userData);
  }

  const value = useMemo(() => ({ 
    user, login, register, logout, mockLogin, loginWithToken,
    isStudent, isInstructor, isAdmin, isAuthenticated 
  }), [user, isStudent, isInstructor, isAdmin, isAuthenticated]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
