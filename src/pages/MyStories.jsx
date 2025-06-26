import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStory } from '../contexts/StoryContext';
import { motion, AnimatePresence } from 'framer-motion';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import StoryCard from '../components/story/StoryCard';
import LoadingSpinner from '../components/ui/LoadingSpinner';

function MyStories() {
  const { stories, loading, loadStories, deleteStory } = useStory();
  const [selectedStories, setSelectedStories] = useState([]);
  const [selectionMode, setSelectionMode] = useState(false);
  const navigate = useNavigate();
  
  useEffect(() => {
    loadStories();
  }, [loadStories]);

  const toggleStorySelection = (storyId) => {
    setSelectedStories(prev => {
      if (prev.includes(storyId)) {
        return prev.filter(id => id !== storyId);
      } else {
        return [...prev, storyId];
      }
    });
  };

  const handleDeleteSelected = async () => {
    if (selectedStories.length === 0) return;
    
    if (confirm(`Supprimer les histoires sélectionnées ?`)) {
      try {
        // Delete each selected story
        for (const storyId of selectedStories) {
          await deleteStory(storyId);
        }
        
        // Clear selection
        setSelectedStories([]);
        setSelectionMode(false);
        
        window.showMessageModal("Histoires supprimées avec succès !");
      } catch (error) {
        console.error("Error deleting stories:", error);
        window.showMessageModal("Erreur lors de la suppression des histoires.");
      }
    }
  };

  const cancelSelection = () => {
    setSelectedStories([]);
    setSelectionMode(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="flex justify-center"
    >
      <Card className="bg-white/90 backdrop-blur-sm border-4 border-primary-light rounded-3xl shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <motion.h2 
            className="text-3xl font-bold text-primary-dark"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            Mes Histoires
          </motion.h2>
          <motion.span 
            id="compteur-histoires" 
            className={`text-2xl font-bold ${stories.length >= 8 ? 'text-red-600 animate-pulse' : 'text-primary'}`}
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {stories.length} / 10
          </motion.span>
        </div>
        
        {loading ? (
          <div className="text-center py-8">
            <LoadingSpinner size="large" />
          </div>
        ) : stories.length === 0 ? (
          <motion.div 
            className="text-center py-8 text-gray-500 italic"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Aucune histoire sauvegardée.
          </motion.div>
        ) : (
          <motion.ul 
            id="liste-histoires" 
            className="mb-8 space-y-3"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.1
                }
              }
            }}
          >
            <AnimatePresence>
              {stories.map(story => (
                <motion.li 
                  key={story.id} 
                  className={story.nouvelleHistoire ? 'nouvelle-histoire' : ''}
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: { opacity: 1, y: 0 }
                  }}
                  exit={{ opacity: 0, x: -100 }}
                >
                  <StoryCard 
                    story={story} 
                    selected={selectedStories.includes(story.id)}
                    onSelect={selectionMode ? toggleStorySelection : undefined}
                  />
                </motion.li>
              ))}
            </AnimatePresence>
          </motion.ul>
        )}
        
        {/* Selection mode actions */}
        {selectionMode && (
          <motion.div 
            className="flex justify-center items-center gap-8 mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <motion.img
              src="/corbeille-cartoon.png"
              alt="Corbeille"
              className="w-16 h-16 cursor-pointer"
              onClick={handleDeleteSelected}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            />
            
            <motion.img
              src="/croix-cartoon.png"
              alt="Annuler sélection"
              className="w-16 h-16 cursor-pointer"
              onClick={cancelSelection}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            />
          </motion.div>
        )}
        
        <div className="flex justify-between gap-4">
          <Button 
            variant="secondary" 
            onClick={() => navigate(-1)}
            className="bg-gradient-to-r from-gray-300 to-gray-400 hover:from-gray-400 hover:to-gray-500"
          >
            Retour
          </Button>
          
          {!selectionMode && (
            <Button 
              variant="secondary" 
              onClick={() => setSelectionMode(true)}
              className="bg-gradient-to-r from-secondary-light to-purple-400 hover:from-purple-400 hover:to-secondary-light"
            >
              Sélectionner
            </Button>
          )}
        </div>
      </Card>
    </motion.div>
  );
}

export default MyStories;