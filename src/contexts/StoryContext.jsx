import { createContext, useContext, useState, useEffect } from 'react';
import { collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, where, orderBy } from 'firebase/firestore';
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
      
      const q = query(storiesRef, orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      
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
      
      // Get a story template from Firestore
      const filtresKey = `${formData.personnage}|${formData.lieu}|${formData.objet}|${formData.compagnon}|${formData.objectif}`;
      
      // Get previously read stories
      const histoiresLuesRef = doc(firestore, "users", currentUser.uid, "histoires_lues", filtresKey);
      const luesDoc = await getDoc(histoiresLuesRef);
      
      let lues = [];
      if (luesDoc.exists() && Array.isArray(luesDoc.data().ids)) {
        lues = luesDoc.data().ids;
      }
      
      // Query for stories matching the criteria
      const stockRef = collection(firestore, "stock_histoires");
      const q = query(
        stockRef,
        where("personnage", "==", formData.personnage),
        where("lieu", "==", formData.lieu),
        where("objet", "==", formData.objet),
        where("objectif", "==", formData.objectif)
      );
      
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        throw new Error("Aucune histoire trouvée avec ces critères. Essaie d'autres filtres !");
      }
      
      // Convert to array
      const stories = [];
      snapshot.forEach(doc => {
        stories.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      // Find an unread story, or reset if all are read
      let story = stories.find(st => !lues.includes(st.id));
      if (!story) {
        lues = [];
        story = stories[0];
      }
      
      // Mark as read
      if (!lues.includes(story.id)) {
        lues.push(story.id);
        await setDoc(histoiresLuesRef, { ids: lues }, { merge: true });
      }
      
      // Personalize the story with the hero's name
      let titre = story.titre || "Mon Histoire";
      if (formData.heroPrenom) {
        titre = titre.replace(/^fille/i, formData.heroPrenom);
      }
      
      // Process the story content
      let displayHtml = '';
      let storageHtml = '';
      
      if (story.chapitres && Array.isArray(story.chapitres)) {
        // Process chapters
        story.chapitres.forEach((chap, idx) => {
          if (idx < 5) {
            // Personalize text with hero's name
            let texte = chap.texte || "";
            if (formData.heroPrenom) {
              texte = personalizeText(texte, formData.heroPrenom, formData.personnage);
            }
            
            displayHtml += `<h3>${chap.titre || "Chapitre " + (idx + 1)}</h3>`;
            displayHtml += `<p>${texte}</p>`;
            
            if (chap.image) {
              displayHtml += `<div class="illustration-chapitre"><img src="${chap.image}" alt="Illustration du chapitre ${idx+1}"></div>`;
            }
            
            // Also build storage HTML
            storageHtml += `<h3>${chap.titre || "Chapitre " + (idx + 1)}</h3>`;
            storageHtml += `<p>${texte}</p>`;
            if (chap.image) {
              storageHtml += `<div class="illustration-chapitre"><img src="${chap.image}" alt="Illustration du chapitre ${idx+1}"></div>`;
            }
          }
        });
      } else {
        // Fallback to individual chapter fields
        const chapters = [
          story.chapitre1 || "",
          story.chapitre2 || "",
          story.chapitre3 || "",
          story.chapitre4 || "",
          story.chapitre5 || ""
        ];
        
        chapters.forEach((text, idx) => {
          if (text) {
            // Personalize text with hero's name
            if (formData.heroPrenom) {
              text = personalizeText(text, formData.heroPrenom, formData.personnage);
            }
            
            displayHtml += `<h3>Chapitre ${idx + 1}</h3>`;
            displayHtml += `<p>${text}</p>`;
            
            // Add image if available
            if (story.images && story.images[idx]) {
              displayHtml += `<div class="illustration-chapitre"><img src="${story.images[idx]}" alt="Illustration du chapitre ${idx+1}"></div>`;
            }
            
            // Also build storage HTML
            storageHtml += `<h3>Chapitre ${idx + 1}</h3>`;
            storageHtml += `<p>${text}</p>`;
            if (story.images && story.images[idx]) {
              storageHtml += `<div class="illustration-chapitre"><img src="${story.images[idx]}" alt="Illustration du chapitre ${idx+1}"></div>`;
            }
          }
        });
      }
      
      // Create the complete story object
      const generatedStory = {
        id: `temp-${Date.now()}`,
        titre: titre,
        personnage: formData.personnage,
        lieu: formData.lieu,
        objet: formData.objet,
        compagnon: formData.compagnon,
        objectif: formData.objectif,
        heroPrenom: formData.heroPrenom,
        chapitre1: story.chapitre1 || "",
        chapitre2: story.chapitre2 || "",
        chapitre3: story.chapitre3 || "",
        chapitre4: story.chapitre4 || "",
        chapitre5: story.chapitre5 || "",
        chapitres: story.chapitres || [],
        contenu: storageHtml,
        displayHtml: displayHtml,
        images: story.images || [],
        sourceId: story.id,
        temporary: true
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

  // Helper function to personalize text with hero's name
  function personalizeText(text, heroName, personnageType) {
    if (!heroName) return text;
    
    if (personnageType.toLowerCase().includes("fille") || 
        personnageType.toLowerCase().includes("princesse") || 
        personnageType.toLowerCase().includes("sorcière")) {
      // Female character replacements
      return text.replace(
        /\b(la fillette|la petite fille|l'héroïne|la jeune fille|la heroine|la fillette héroïne|la fillette heroïne|la jeune héroïne)\b/gi,
        heroName
      );
    } else {
      // Male character replacements
      return text.replace(
        /\b(le garçon|le petit garçon|le héros|le jeune garçon|l'héros|le garçon héros)\b/gi,
        heroName
      );
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
      
      const docRef = await addDoc(storiesRef, storyData);
      
      // If it's a child profile, update the story count
      if (currentProfile.type === 'enfant') {
        const profileRef = doc(
          firestore, 
          "users", 
          currentUser.uid, 
          "profils_enfant", 
          currentProfile.id
        );
        
        await updateDoc(profileRef, {
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
        storyRef = doc(firestore, "users", currentUser.uid, "stories", storyId);
      } else {
        storyRef = doc(
          firestore, 
          "users", 
          currentUser.uid, 
          "profils_enfant", 
          currentProfile.id, 
          "stories", 
          storyId
        );
      }
      
      await deleteDoc(storyRef);
      
      // If it's a child profile, update the story count
      if (currentProfile.type === 'enfant') {
        const profileRef = doc(
          firestore, 
          "users", 
          currentUser.uid, 
          "profils_enfant", 
          currentProfile.id
        );
        
        await updateDoc(profileRef, {
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
        storyRef = doc(firestore, "users", currentUser.uid, "stories", storyId);
      } else {
        storyRef = doc(
          firestore, 
          "users", 
          currentUser.uid, 
          "profils_enfant", 
          currentProfile.id, 
          "stories", 
          storyId
        );
      }
      
      await updateDoc(storyRef, {
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
        storyRef = doc(firestore, "users", currentUser.uid, "stories", storyId);
      } else {
        storyRef = doc(
          firestore, 
          "users", 
          currentUser.uid, 
          "profils_enfant", 
          currentProfile.id, 
          "stories", 
          storyId
        );
      }
      
      await updateDoc(storyRef, {
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
        storyRef = doc(firestore, "users", currentUser.uid, "stories", storyId);
      } else {
        storyRef = doc(
          firestore, 
          "users", 
          currentUser.uid, 
          "profils_enfant", 
          currentProfile.id, 
          "stories", 
          storyId
        );
      }
      
      const storyDoc = await getDoc(storyRef);
      
      if (!storyDoc.exists()) {
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