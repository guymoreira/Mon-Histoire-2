import { createContext, useContext, useState, useEffect } from 'react';
import { collection, query, where, getDocs, updateDoc, doc, onSnapshot } from 'firebase/firestore';
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
      setupRealtimeListeners();
      
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
      
      // Query for new stories
      let storiesRef;
      if (currentProfile.type === 'parent') {
        storiesRef = collection(firestore, "users", currentUser.uid, "stories");
      } else {
        storiesRef = collection(
          firestore, 
          "users", 
          currentUser.uid, 
          "profils_enfant", 
          currentProfile.id, 
          "stories"
        );
      }
      
      const newStoriesQuery = query(storiesRef, where("nouvelleHistoire", "==", true));
      const snapshot = await getDocs(newStoriesQuery);
      
      // Update notifications count
      setNotifications(prev => ({
        ...prev,
        [profileId]: snapshot.size
      }));
      
      // If parent profile, also count notifications for all child profiles
      if (currentProfile.type === 'parent') {
        const childProfilesRef = collection(firestore, "users", currentUser.uid, "profils_enfant");
        const childProfilesSnapshot = await getDocs(childProfilesRef);
        
        const childNotifications = { ...notifications };
        
        for (const profileDoc of childProfilesSnapshot.docs) {
          const childProfileId = profileDoc.id;
          const childStoriesRef = collection(
            firestore, 
            "users", 
            currentUser.uid, 
            "profils_enfant", 
            childProfileId, 
            "stories"
          );
          
          const childNewStoriesQuery = query(childStoriesRef, where("nouvelleHistoire", "==", true));
          const childSnapshot = await getDocs(childNewStoriesQuery);
          
          childNotifications[childProfileId] = childSnapshot.size;
        }
        
        setNotifications(childNotifications);
      }
    } catch (error) {
      console.error("Error initializing notifications:", error);
    }
  }

  // Set up realtime listeners for notifications
  function setupRealtimeListeners() {
    if (!currentUser || !currentProfile) return;
    
    const profileId = currentProfile.type === 'parent' ? 'parent' : currentProfile.id;
    
    // Listen for realtime notifications
    const notificationsRef = ref(database, `users/${currentUser.uid}/notifications/${profileId}`);
    
    onValue(notificationsRef, (snapshot) => {
      if (snapshot.exists()) {
        snapshot.forEach((childSnapshot) => {
          const notificationId = childSnapshot.key;
          const notification = childSnapshot.val();
          
          // Check if notification has already been processed
          if (!processedNotifications.has(notificationId)) {
            // Add to processed set
            setProcessedNotifications(prev => {
              const newSet = new Set(prev);
              newSet.add(notificationId);
              
              // Save to localStorage
              try {
                localStorage.setItem('notificationsTraitees', JSON.stringify([...newSet]));
              } catch (error) {
                console.error("Error saving processed notifications:", error);
              }
              
              return newSet;
            });
            
            // Increment notification count
            setNotifications(prev => ({
              ...prev,
              [profileId]: (prev[profileId] || 0) + 1
            }));
            
            // Show notification
            showNotification(notification.partageParPrenom);
            
            // Remove notification from database
            set(ref(database, `users/${currentUser.uid}/notifications/${profileId}/${notificationId}`), null);
          }
        });
      }
    });
    
    // If parent profile, also listen for notifications for all child profiles
    if (currentProfile.type === 'parent') {
      // This would be implemented similarly to the above code
      // but for each child profile
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
      
      // Update the story in Firestore
      await updateDoc(storyRef, {
        nouvelleHistoire: false,
        vueLe: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  }

  // Share a story with another profile
  async function shareStory(story, targetProfileId, targetProfileName) {
    if (!currentUser || !currentProfile) return;
    
    try {
      // Determine sender info
      const senderName = currentProfile.type === 'parent' 
        ? (await getDoc(doc(firestore, "users", currentUser.uid))).data().prenom || 'Parent'
        : currentProfile.prenom;
      
      // Create notification in Realtime Database
      const notificationsRef = ref(database, `users/${currentUser.uid}/notifications/${targetProfileId}`);
      await push(notificationsRef, {
        partageParPrenom: senderName,
        partageParProfil: currentProfile.type === 'parent' ? 'parent' : currentProfile.id,
        timestamp: Date.now()
      });
      
      // Create shared story in Firestore
      let targetStoriesRef;
      if (targetProfileId === 'parent') {
        targetStoriesRef = collection(firestore, "users", currentUser.uid, "stories");
      } else {
        targetStoriesRef = collection(
          firestore, 
          "users", 
          currentUser.uid, 
          "profils_enfant", 
          targetProfileId, 
          "stories"
        );
      }
      
      // Add the story
      const storyData = {
        ...story,
        partageParProfil: currentProfile.type === 'parent' ? 'parent' : currentProfile.id,
        partageParPrenom: senderName,
        destinataireProfil: targetProfileId,
        destinatairePrenom: targetProfileName,
        nouvelleHistoire: true,
        createdAt: new Date().toISOString()
      };
      
      await addDoc(targetStoriesRef, storyData);
      
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