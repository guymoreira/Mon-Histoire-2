import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState(null);
  const navigate = useNavigate();

  // Register a new user
  async function register(email, password, prenom) {
    try {
      // For demo purposes, create a mock user
      const mockUser = {
        uid: 'mock-user-id',
        email: email,
        emailVerified: false
      };
      
      setCurrentUser(mockUser);
      setUserInfo({
        prenom: prenom,
        email: email,
        createdAt: new Date().toISOString()
      });
      
      return mockUser;
    } catch (error) {
      console.error("Error registering user:", error);
      throw error;
    }
  }

  // Login user
  async function login(email, password) {
    try {
      // For demo purposes, create a mock user
      const mockUser = {
        uid: 'mock-user-id',
        email: email,
        emailVerified: false
      };
      
      setCurrentUser(mockUser);
      setUserInfo({
        prenom: 'Demo User',
        email: email,
        createdAt: new Date().toISOString()
      });
      
      return mockUser;
    } catch (error) {
      console.error("Error logging in:", error);
      throw error;
    }
  }

  // Logout user
  async function logout() {
    try {
      setCurrentUser(null);
      setUserInfo(null);
      navigate('/');
    } catch (error) {
      console.error("Error logging out:", error);
      throw error;
    }
  }

  // Reset password
  async function resetPassword(email) {
    try {
      // For demo purposes, just log the email
      console.log(`Password reset email sent to: ${email}`);
    } catch (error) {
      console.error("Error resetting password:", error);
      throw error;
    }
  }

  // Delete account
  async function deleteAccount(password) {
    try {
      setCurrentUser(null);
      setUserInfo(null);
      navigate('/');
    } catch (error) {
      console.error("Error deleting account:", error);
      throw error;
    }
  }

  // Log user activity
  async function logActivity(type, details = {}) {
    if (!currentUser) return;
    
    try {
      console.log(`Activity logged: ${type}`, details);
    } catch (error) {
      console.error("Error logging activity:", error);
    }
  }

  // Load user info
  async function loadUserInfo() {
    if (!currentUser) return null;
    
    try {
      // For demo purposes, return mock user info
      const mockUserInfo = {
        prenom: 'Demo User',
        email: currentUser.email,
        createdAt: new Date().toISOString()
      };
      
      setUserInfo(mockUserInfo);
      return mockUserInfo;
    } catch (error) {
      console.error("Error loading user info:", error);
      return null;
    }
  }

  // Initialize auth state
  useEffect(() => {
    // For demo purposes, simulate auth state initialization
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

  // Generate a device ID if not exists
  useEffect(() => {
    if (!localStorage.getItem('deviceId')) {
      const deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('deviceId', deviceId);
    }
  }, []);

  const value = {
    currentUser,
    userInfo,
    loading,
    register,
    login,
    logout,
    resetPassword,
    deleteAccount,
    logActivity,
    loadUserInfo
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}