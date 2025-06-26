import { createContext, useContext, useState, useEffect } from 'react';
import { doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, where, orderBy, setDoc } from 'firebase/firestore';
import { firestore } from '../firebase/config';
import { useAuth } from './AuthContext';
import { useProfile } from './ProfileContext';

const StoryContext = createContext();

export function useStory() {
  return useContext(StoryContext);
}

export function StoryProvider({ children }) {
  const { currentUser } = useAuth();
  const { currentProfile } = useProfile();
  const [stories, setStories] = useState([]);
  const [currentStory, setCurrentStory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [storyFormData, setStoryFormData] = useState({
    heroPrenom: '',
    personnage: 'fille',
    lieu: 'foret_enchantee',
    objet: 'baguette_magique',
    compagnon: 'dragon',
    objectif: 'sauver_un_village'
  });

  // Load stories when user or profile changes
  useEffect(() => {
    if (currentUser && currentProfile) {
      loadStories();
    } else {
      setStories([]);
    }
  }, [currentUser, currentProfile]);

  // Load stories from Firestore
  async function loadStories() {
    if (!currentUser || !currentProfile) return;
    
    try {
      setLoading(true);
      
      let storiesRef;
      if (currentProfile.type === 'parent') {
        storiesRef = firestore.collection("users").doc(currentUser.uid).collection("stories");
      } else {
        storiesRef = firestore
          .collection("users")
          .doc(currentUser.uid)
          .collection("profils_enfant")
          .doc(currentProfile.id)
          .collection("stories");
      }
      
      const q = storiesRef.orderBy("createdAt", "desc");
      const snapshot = await q.get();
      
      const loadedStories = [];
      snapshot.forEach(doc => {
        loadedStories.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      setStories(loadedStories);
    } catch (error) {
      console.error("Error loading stories:", error);
    } finally {
      setLoading(false);
    }
  }

  // Generate a story
  async function generateStory(formData) {
    if (!currentUser || !currentProfile) throw new Error("User not authenticated or no profile selected");
    
    try {
      setLoading(true);
      
      // Save form data for future use
      setStoryFormData(formData);
      
      // For demo purposes, create a mock story
      const generatedStory = {
        id: `temp-${Date.now()}`,
        titre: `L'aventure de ${formData.heroPrenom || 'héros inconnu'}`,
        personnage: formData.personnage,
        lieu: formData.lieu,
        objet: formData.objet,
        compagnon: formData.compagnon,
        objectif: formData.objectif,
        heroPrenom: formData.heroPrenom,
        chapitre1: "Il était une fois, dans un royaume lointain, un jeune héros qui rêvait d'aventure.",
        chapitre2: "Un jour, une mystérieuse carte au trésor lui tomba entre les mains.",
        chapitre3: "Le héros décida de partir à l'aventure pour découvrir ce trésor légendaire.",
        chapitre4: "Après de nombreuses péripéties, il arriva enfin à destination.",
        chapitre5: "Ce qu'il découvrit changea sa vie à jamais.",
        contenu: `
          <h3>Chapitre 1</h3>
          <p>Il était une fois, dans un royaume lointain, un jeune héros qui rêvait d'aventure.</p>
          <h3>Chapitre 2</h3>
          <p>Un jour, une mystérieuse carte au trésor lui tomba entre les mains.</p>
          <h3>Chapitre 3</h3>
          <p>Le héros décida de partir à l'aventure pour découvrir ce trésor légendaire.</p>
          <h3>Chapitre 4</h3>
          <p>Après de nombreuses péripéties, il arriva enfin à destination.</p>
          <h3>Chapitre 5</h3>
          <p>Ce qu'il découvrit changea sa vie à jamais.</p>
        `,
        displayHtml: `
          <h3>Chapitre 1</h3>
          <p>Il était une fois, dans un royaume lointain, un jeune héros qui rêvait d'aventure.</p>
          <h3>Chapitre 2</h3>
          <p>Un jour, une mystérieuse carte au trésor lui tomba entre les mains.</p>
          <h3>Chapitre 3</h3>
          <p>Le héros décida de partir à l'aventure pour découvrir ce trésor légendaire.</p>
          <h3>Chapitre 4</h3>
          <p>Après de nombreuses péripéties, il arriva enfin à destination.</p>
          <h3>Chapitre 5</h3>
          <p>Ce qu'il découvrit changea sa vie à jamais.</p>
        `,
        images: [],
        sourceId: 'mock-story',
        temporary: true,
        createdAt: new Date().toISOString()
      };
      
      setCurrentStory(generatedStory);
      return generatedStory;
    } catch (error) {
      console.error("Error generating story:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  }

  // Save a story
  async function saveStory(story) {
    if (!currentUser || !currentProfile) throw new Error("User not authenticated or no profile selected");
    
    try {
      setLoading(true);
      
      // Check if we've reached the story limit
      if (stories.length >= 10) {
        throw new Error("Tu as atteint le maximum de 10 histoires sauvegardées. Supprime une histoire pour en créer une nouvelle.");
      }
      
      // Prepare story data
      const storyData = {
        titre: story.titre || "Histoire sans titre",
        personnage: story.personnage || "",
        lieu: story.lieu || "",
        objet: story.objet || "",
        compagnon: story.compagnon || "",
        objectif: story.objectif || "",
        heroPrenom: story.heroPrenom || "",
        chapitre1: story.chapitre1 || "",
        chapitre2: story.chapitre2 || "",
        chapitre3: story.chapitre3 || "",
        chapitre4: story.chapitre4 || "",
        chapitre5: story.chapitre5 || "",
        contenu: story.contenu || "",
        images: story.images || [],
        createdAt: new Date().toISOString()
      };
      
      // Add chapitres array if it exists
      if (story.chapitres && Array.isArray(story.chapitres)) {
        storyData.chapitres = story.chapitres;
      }
      
      // Save to Firestore
      let storiesRef;
      if (currentProfile.type === 'parent') {
        storiesRef = firestore.collection("users").doc(currentUser.uid).collection("stories");
      } else {
        storiesRef = firestore
          .collection("users")
          .doc(currentUser.uid)
          .collection("profils_enfant")
          .doc(currentProfile.id)
          .collection("stories");
      }
      
      const docRef = await storiesRef.add(storyData);
      
      // If it's a child profile, update the story count
      if (currentProfile.type === 'enfant') {
        const profileRef = firestore
          .collection("users")
          .doc(currentUser.uid)
          .collection("profils_enfant")
          .doc(currentProfile.id);
        
        await profileRef.update({
          nb_histoires: (currentProfile.nb_histoires || 0) + 1
        });
      }
      
      // Add to local state
      const savedStory = {
        id: docRef.id,
        ...storyData
      };
      
      setStories(prev => [savedStory, ...prev]);
      
      return docRef.id;
    } catch (error) {
      console.error("Error saving story:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  }

  // Delete a story
  async function deleteStory(storyId) {
    if (!currentUser || !currentProfile) throw new Error("User not authenticated or no profile selected");
    
    try {
      setLoading(true);
      
      // Delete from Firestore
      let storyRef;
      if (currentProfile.type === 'parent') {
        storyRef = firestore.collection("users").doc(currentUser.uid).collection("stories").doc(storyId);
      } else {
        storyRef = firestore
          .collection("users")
          .doc(currentUser.uid)
          .collection("profils_enfant")
          .doc(currentProfile.id)
          .collection("stories")
          .doc(storyId);
      }
      
      await storyRef.delete();
      
      // If it's a child profile, update the story count
      if (currentProfile.type === 'enfant') {
        const profileRef = firestore
          .collection("users")
          .doc(currentUser.uid)
          .collection("profils_enfant")
          .doc(currentProfile.id);
        
        await profileRef.update({
          nb_histoires: Math.max(0, (currentProfile.nb_histoires || 0) - 1)
        });
      }
      
      // Remove from local state
      setStories(prev => prev.filter(story => story.id !== storyId));
      
      // If it's the current story, clear it
      if (currentStory && currentStory.id === storyId) {
        setCurrentStory(null);
      }
    } catch (error) {
      console.error("Error deleting story:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  }

  // Update a story title
  async function updateStoryTitle(storyId, newTitle) {
    if (!currentUser || !currentProfile) throw new Error("User not authenticated or no profile selected");
    
    try {
      setLoading(true);
      
      // Update in Firestore
      let storyRef;
      if (currentProfile.type === 'parent') {
        storyRef = firestore.collection("users").doc(currentUser.uid).collection("stories").doc(storyId);
      } else {
        storyRef = firestore
          .collection("users")
          .doc(currentUser.uid)
          .collection("profils_enfant")
          .doc(currentProfile.id)
          .collection("stories")
          .doc(storyId);
      }
      
      await storyRef.update({
        titre: newTitle,
        updatedAt: new Date().toISOString()
      });
      
      // Update in local state
      setStories(prev => 
        prev.map(story => 
          story.id === storyId 
            ? { ...story, titre: newTitle } 
            : story
        )
      );
      
      // Update current story if it's the one being edited
      if (currentStory && currentStory.id === storyId) {
        setCurrentStory(prev => ({
          ...prev,
          titre: newTitle
        }));
      }
    } catch (error) {
      console.error("Error updating story title:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  }

  // Rate a story
  async function rateStory(storyId, rating) {
    if (!currentUser || !currentProfile) throw new Error("User not authenticated or no profile selected");
    
    try {
      // Update in Firestore
      let storyRef;
      if (currentProfile.type === 'parent') {
        storyRef = firestore.collection("users").doc(currentUser.uid).collection("stories").doc(storyId);
      } else {
        storyRef = firestore
          .collection("users")
          .doc(currentUser.uid)
          .collection("profils_enfant")
          .doc(currentProfile.id)
          .collection("stories")
          .doc(storyId);
      }
      
      await storyRef.update({
        note: rating
      });
      
      // Update in local state
      setStories(prev => 
        prev.map(story => 
          story.id === storyId 
            ? { ...story, note: rating } 
            : story
        )
      );
      
      // Update current story if it's the one being rated
      if (currentStory && currentStory.id === storyId) {
        setCurrentStory(prev => ({
          ...prev,
          note: rating
        }));
      }
    } catch (error) {
      console.error("Error rating story:", error);
      throw error;
    }
  }

  // Get a story by ID
  async function getStory(storyId) {
    if (!currentUser || !currentProfile) throw new Error("User not authenticated or no profile selected");
    
    // Check if it's already in local state
    const localStory = stories.find(story => story.id === storyId);
    if (localStory) {
      setCurrentStory(localStory);
      return localStory;
    }
    
    try {
      setLoading(true);
      
      // Get from Firestore
      let storyRef;
      if (currentProfile.type === 'parent') {
        storyRef = firestore.collection("users").doc(currentUser.uid).collection("stories").doc(storyId);
      } else {
        storyRef = firestore
          .collection("users")
          .doc(currentUser.uid)
          .collection("profils_enfant")
          .doc(currentProfile.id)
          .collection("stories")
          .doc(storyId);
      }
      
      const storyDoc = await storyRef.get();
      
      if (!storyDoc.exists) {
        throw new Error("Story not found");
      }
      
      const story = {
        id: storyDoc.id,
        ...storyDoc.data()
      };
      
      setCurrentStory(story);
      return story;
    } catch (error) {
      console.error("Error getting story:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  }

  const value = {
    stories,
    currentStory,
    storyFormData,
    loading,
    generateStory,
    saveStory,
    deleteStory,
    updateStoryTitle,
    rateStory,
    getStory,
    setCurrentStory,
    setStoryFormData,
    loadStories
  };

  return (
    <StoryContext.Provider value={value}>
      {children}
    </StoryContext.Provider>
  );
}