import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStory } from '../contexts/StoryContext';
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
    <div className="flex justify-center">
      <Card className="bg-white/90 backdrop-blur-sm border-4 border-primary-light rounded-3xl shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-primary-dark">
            Mes Histoires
          </h2>
          <span 
            id="compteur-histoires" 
            className={`text-2xl font-bold ${stories.length >= 8 ? 'text-red-600 animate-pulse' : 'text-primary'}`}
          >
            {stories.length} / 10
          </span>
        </div>
        
        {loading ? (
          <div className="text-center py-8">
            <LoadingSpinner size="large" />
          </div>
        ) : stories.length === 0 ? (
          <div className="text-center py-8 text-gray-500 italic">
            Aucune histoire sauvegardée.
          </div>
        ) : (
          <ul id="liste-histoires" className="mb-8 space-y-3">
            {stories.map(story => (
              <li 
                key={story.id} 
                className={story.nouvelleHistoire ? 'nouvelle-histoire' : ''}
              >
                <StoryCard 
                  story={story} 
                  selected={selectedStories.includes(story.id)}
                  onSelect={selectionMode ? toggleStorySelection : undefined}
                />
              </li>
            ))}
          </ul>
        )}
        
        {/* Selection mode actions */}
        {selectionMode && (
          <div className="flex justify-center items-center gap-8 mb-6">
            <img
              src="/corbeille-cartoon.png"
              alt="Corbeille"
              className="w-16 h-16 cursor-pointer hover:scale-110 transition-transform"
              onClick={handleDeleteSelected}
            />
            
            <img
              src="/croix-cartoon.png"
              alt="Annuler sélection"
              className="w-16 h-16 cursor-pointer hover:scale-110 transition-transform"
              onClick={cancelSelection}
            />
          </div>
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
    </div>
  );
}

export default MyStories;