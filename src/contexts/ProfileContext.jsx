import { createContext, useContext, useState, useEffect } from 'react';
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { firestore } from '../firebase/config';
import { useAuth } from './AuthContext';

const ProfileContext = createContext();

export function useProfile() {
  return useContext(ProfileContext);
}

export function ProfileProvider({ children }) {
  const { currentUser } = useAuth();
  const [childProfiles, setChildProfiles] = useState([]);
  const [currentProfile, setCurrentProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load profiles when user changes
  useEffect(() => {
    if (currentUser) {
      loadProfiles();
    } else {
      setChildProfiles([]);
      setCurrentProfile(null);
      setLoading(false);
    }
  }, [currentUser]);

  // Load profiles from Firestore
  async function loadProfiles() {
    if (!currentUser) return;
    
    try {
      setLoading(true);
      
      // Get child profiles
      const profilesRef = collection(firestore, "users", currentUser.uid, "profils_enfant");
      const profilesSnapshot = await getDocs(profilesRef);
      
      const profiles = [];
      profilesSnapshot.forEach(doc => {
        profiles.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      setChildProfiles(profiles);
      
      // Check if there's a stored active profile
      const storedProfile = localStorage.getItem('profilActif');
      if (storedProfile) {
        const parsedProfile = JSON.parse(storedProfile);
        
        if (parsedProfile.type === 'enfant') {
          // Find the profile in the loaded profiles
          const foundProfile = profiles.find(p => p.id === parsedProfile.id);
          if (foundProfile) {
            setCurrentProfile({
              type: 'enfant',
              ...foundProfile
            });
          } else {
            // Profile not found, reset to parent
            setCurrentProfile({ type: 'parent' });
            localStorage.setItem('profilActif', JSON.stringify({ type: 'parent' }));
          }
        } else {
          // Parent profile
          setCurrentProfile({ type: 'parent' });
        }
      } else {
        // No stored profile, default to parent
        setCurrentProfile({ type: 'parent' });
        localStorage.setItem('profilActif', JSON.stringify({ type: 'parent' }));
      }
    } catch (error) {
      console.error("Error loading profiles:", error);
    } finally {
      setLoading(false);
    }
  }

  // Create a new child profile
  async function createChildProfile(profileData) {
    if (!currentUser) throw new Error("User not authenticated");
    
    try {
      // Create a new document reference
      const profilesRef = collection(firestore, "users", currentUser.uid, "profils_enfant");
      const newProfileRef = doc(profilesRef);
      
      // Prepare profile data
      const newProfile = {
        prenom: profileData.prenom,
        createdAt: new Date().toISOString(),
        nb_histoires: 0
      };
      
      // Save to Firestore
      await setDoc(newProfileRef, newProfile);
      
      // Add to local state
      const profileWithId = {
        id: newProfileRef.id,
        ...newProfile
      };
      
      setChildProfiles(prev => [...prev, profileWithId]);
      
      return newProfileRef.id;
    } catch (error) {
      console.error("Error creating child profile:", error);
      throw error;
    }
  }

  // Update a child profile
  async function updateChildProfile(profileId, profileData) {
    if (!currentUser) throw new Error("User not authenticated");
    
    try {
      // Update in Firestore
      const profileRef = doc(firestore, "users", currentUser.uid, "profils_enfant", profileId);
      await updateDoc(profileRef, {
        prenom: profileData.prenom,
        updatedAt: new Date().toISOString()
      });
      
      // Update local state
      setChildProfiles(prev => 
        prev.map(profile => 
          profile.id === profileId 
            ? { ...profile, ...profileData } 
            : profile
        )
      );
      
      // Update current profile if it's the one being edited
      if (currentProfile && currentProfile.type === 'enfant' && currentProfile.id === profileId) {
        setCurrentProfile(prev => ({
          ...prev,
          ...profileData
        }));
        
        // Update localStorage
        localStorage.setItem('profilActif', JSON.stringify({
          type: 'enfant',
          id: profileId,
          prenom: profileData.prenom
        }));
      }
    } catch (error) {
      console.error("Error updating child profile:", error);
      throw error;
    }
  }

  // Delete a child profile
  async function deleteChildProfile(profileId) {
    if (!currentUser) throw new Error("User not authenticated");
    
    try {
      // Delete from Firestore
      const profileRef = doc(firestore, "users", currentUser.uid, "profils_enfant", profileId);
      await deleteDoc(profileRef);
      
      // Remove from local state
      setChildProfiles(prev => prev.filter(profile => profile.id !== profileId));
      
      // If it's the current profile, switch to parent
      if (currentProfile && currentProfile.type === 'enfant' && currentProfile.id === profileId) {
        setCurrentProfile({ type: 'parent' });
        localStorage.setItem('profilActif', JSON.stringify({ type: 'parent' }));
      }
    } catch (error) {
      console.error("Error deleting child profile:", error);
      throw error;
    }
  }

  // Switch to a child profile
  function switchToChildProfile(profileId) {
    const childProfile = childProfiles.find(profile => profile.id === profileId);
    
    if (childProfile) {
      const newProfile = {
        type: 'enfant',
        id: childProfile.id,
        prenom: childProfile.prenom
      };
      
      setCurrentProfile(newProfile);
      localStorage.setItem('profilActif', JSON.stringify(newProfile));
      
      return true;
    }
    
    return false;
  }

  // Switch to parent profile
  function switchToParentProfile() {
    const parentProfile = { type: 'parent' };
    setCurrentProfile(parentProfile);
    localStorage.setItem('profilActif', JSON.stringify(parentProfile));
  }

  // Check if a profile exists
  async function checkProfileExists(profileId) {
    if (!currentUser) return false;
    
    try {
      const profileRef = doc(firestore, "users", currentUser.uid, "profils_enfant", profileId);
      const profileDoc = await getDoc(profileRef);
      
      return profileDoc.exists();
    } catch (error) {
      console.error("Error checking profile existence:", error);
      return false;
    }
  }

  const value = {
    childProfiles,
    currentProfile,
    loading,
    loadProfiles,
    createChildProfile,
    updateChildProfile,
    deleteChildProfile,
    switchToChildProfile,
    switchToParentProfile,
    checkProfileExists
  };

  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  );
}