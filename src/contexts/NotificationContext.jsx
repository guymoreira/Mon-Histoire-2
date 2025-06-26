import { createContext, useContext, useState, useEffect } from 'react';
import { collection, query, where, getDocs, updateDoc, doc, onSnapshot, getDoc, addDoc } from 'firebase/firestore';
import { ref, onValue, set, push } from 'firebase/database';
import { firestore, database } from '../firebase/config';
import { useAuth } from './AuthContext';
import { useProfile } from './ProfileContext';

const NotificationContext = createContext();

export function useNotification() {
  return useContext(NotificationContext);
}

export function NotificationProvider({ children }) {
  const { currentUser } = useAuth();
  const { currentProfile } = useProfile();
  const [notifications, setNotifications] = useState({});
  const [currentNotification, setCurrentNotification] = useState(null);
  const [notificationVisible, setNotificationVisible] = useState(false);
  const [processedNotifications, setProcessedNotifications] = useState(new Set());

  // Initialize notifications when user or profile changes
  useEffect(() => {
    if (currentUser && currentProfile) {
      initializeNotifications();
      
      // Load processed notifications from localStorage
      try {
        const savedProcessed = localStorage.getItem('notificationsTraitees');
        if (savedProcessed) {
          setProcessedNotifications(new Set(JSON.parse(savedProcessed)));
        }
      } catch (error) {
        console.error("Error loading processed notifications:", error);
      }
    }
    
    return () => {
      // Clean up listeners
      if (currentUser) {
        const profileId = currentProfile?.type === 'parent' ? 'parent' : currentProfile?.id;
        const notificationsRef = ref(database, `users/${currentUser.uid}/notifications/${profileId}`);
        onValue(notificationsRef, () => {});
      }
    };
  }, [currentUser, currentProfile]);

  // Initialize notifications count
  async function initializeNotifications() {
    if (!currentUser || !currentProfile) return;
    
    try {
      const profileId = currentProfile.type === 'parent' ? 'parent' : currentProfile.id;
      
      // Initialize with empty notifications
      setNotifications(prev => ({
        ...prev,
        [profileId]: 0
      }));
      
      // For demo purposes, we'll just set some mock notifications
      if (profileId === 'parent') {
        setNotifications({
          'parent': 0,
          'child1': 2,
          'child2': 1
        });
      } else {
        setNotifications({
          [profileId]: 0,
          'parent': 1
        });
      }
    } catch (error) {
      console.error("Error initializing notifications:", error);
    }
  }

  // Show a notification
  function showNotification(senderName, storyRef = null) {
    setCurrentNotification({
      senderName,
      storyRef
    });
    
    setNotificationVisible(true);
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      setNotificationVisible(false);
    }, 5000);
  }

  // Close the notification
  function closeNotification(markAsRead = true) {
    setNotificationVisible(false);
    
    if (markAsRead && currentNotification?.storyRef) {
      markNotificationAsRead(currentNotification.storyRef);
    }
  }

  // Mark a notification as read
  async function markNotificationAsRead(storyRef) {
    if (!storyRef) return;
    
    try {
      const profileId = currentProfile.type === 'parent' ? 'parent' : currentProfile.id;
      
      // Decrement notification count
      setNotifications(prev => ({
        ...prev,
        [profileId]: Math.max(0, (prev[profileId] || 0) - 1)
      }));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  }

  // Share a story with another profile
  async function shareStory(story, targetProfileId, targetProfileName) {
    if (!currentUser || !currentProfile) return false;
    
    try {
      // For demo purposes, we'll just update the notifications
      const senderName = currentProfile.type === 'parent' ? 'Parent' : currentProfile.prenom;
      
      // Increment notification count for target profile
      setNotifications(prev => ({
        ...prev,
        [targetProfileId]: (prev[targetProfileId] || 0) + 1
      }));
      
      // Show a notification
      showNotification(`Histoire partagée avec ${targetProfileName}`);
      
      return true;
    } catch (error) {
      console.error("Error sharing story:", error);
      return false;
    }
  }

  const value = {
    notifications,
    notificationVisible,
    currentNotification,
    showNotification,
    closeNotification,
    markNotificationAsRead,
    shareStory
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}