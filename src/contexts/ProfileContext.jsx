import { createContext, useContext, useState, useEffect } from 'react';
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
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
      
      // For demo purposes, create mock profiles
      const mockProfiles = [
        {
          id: 'child1',
          prenom: 'Emma',
          nb_histoires: 3,
          createdAt: new Date().toISOString()
        },
        {
          id: 'child2',
          prenom: 'Lucas',
          nb_histoires: 2,
          createdAt: new Date().toISOString()
        }
      ];
      
      setChildProfiles(mockProfiles);
      
      // Set parent profile as default
      setCurrentProfile({ type: 'parent' });
      localStorage.setItem('profilActif', JSON.stringify({ type: 'parent' }));
      
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
      // For demo purposes, create a mock profile
      const newProfile = {
        id: `child${childProfiles.length + 1}`,
        prenom: profileData.prenom,
        nb_histoires: 0,
        createdAt: new Date().toISOString()
      };
      
      setChildProfiles(prev => [...prev, newProfile]);
      
      return newProfile.id;
    } catch (error) {
      console.error("Error creating child profile:", error);
      throw error;
    }
  }

  // Update a child profile
  async function updateChildProfile(profileId, profileData) {
    if (!currentUser) throw new Error("User not authenticated");
    
    try {
      // Update in local state
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

  const value = {
    childProfiles,
    currentProfile,
    loading,
    loadProfiles,
    createChildProfile,
    updateChildProfile,
    deleteChildProfile,
    switchToChildProfile,
    switchToParentProfile
  };

  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  );
}