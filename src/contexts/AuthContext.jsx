import { createContext, useContext, useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  sendPasswordResetEmail,
  updatePassword,
  updateEmail,
  reauthenticateWithCredential,
  EmailAuthProvider,
  deleteUser
} from 'firebase/auth';
import { doc, setDoc, getDoc, deleteDoc, collection } from 'firebase/firestore';
import { auth, firestore } from '../firebase/config';
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
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Create user profile in Firestore
      await setDoc(doc(firestore, "users", user.uid), {
        prenom: prenom,
        email: email,
        createdAt: new Date().toISOString(),
        consentement_parental: true
      });
      
      return user;
    } catch (error) {
      console.error("Error registering user:", error);
      throw error;
    }
  }

  // Login user
  async function login(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error) {
      console.error("Error logging in:", error);
      throw error;
    }
  }

  // Logout user
  async function logout() {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error("Error logging out:", error);
      throw error;
    }
  }

  // Reset password
  async function resetPassword(email) {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error("Error resetting password:", error);
      throw error;
    }
  }

  // Update password
  async function changePassword(currentPassword, newPassword) {
    try {
      const user = auth.currentUser;
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
    } catch (error) {
      console.error("Error updating password:", error);
      throw error;
    }
  }

  // Update email
  async function changeEmail(currentPassword, newEmail) {
    try {
      const user = auth.currentUser;
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      
      await reauthenticateWithCredential(user, credential);
      await updateEmail(user, newEmail);
      
      // Update email in Firestore
      await setDoc(doc(firestore, "users", user.uid), {
        email: newEmail,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (error) {
      console.error("Error updating email:", error);
      throw error;
    }
  }

  // Delete account
  async function deleteAccount(password) {
    try {
      const user = auth.currentUser;
      const credential = EmailAuthProvider.credential(user.email, password);
      
      await reauthenticateWithCredential(user, credential);
      
      // Delete user data from Firestore
      await deleteDoc(doc(firestore, "users", user.uid));
      
      // Delete user account
      await deleteUser(user);
      
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
      const activityRef = collection(firestore, "users", currentUser.uid, "logs");
      await setDoc(doc(activityRef), {
        type,
        timestamp: new Date().toISOString(),
        details,
        deviceInfo: {
          userAgent: navigator.userAgent,
          deviceId: localStorage.getItem('deviceId') || 'unknown'
        }
      });
    } catch (error) {
      console.error("Error logging activity:", error);
    }
  }

  // Load user info
  async function loadUserInfo() {
    if (!currentUser) return null;
    
    try {
      const userDoc = await getDoc(doc(firestore, "users", currentUser.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setUserInfo(userData);
        return userData;
      }
      return null;
    } catch (error) {
      console.error("Error loading user info:", error);
      return null;
    }
  }

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await loadUserInfo();
      } else {
        setUserInfo(null);
      }
      setLoading(false);
    });

    return unsubscribe;
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
    changePassword,
    changeEmail,
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