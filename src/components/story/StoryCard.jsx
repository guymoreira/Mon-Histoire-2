import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStory } from '../../contexts/StoryContext';
import Rating from '../ui/Rating';

function StoryCard({ story, selected = false, onSelect }) {
  const { deleteStory, updateStoryTitle, setCurrentStory } = useStory();
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [newTitle, setNewTitle] = useState(story.titre || 'Histoire sans titre');
  const navigate = useNavigate();
  
  const handleClick = () => {
    if (onSelect) {
      onSelect(story.id);
    } else {
      // View the story
      setCurrentStory(story);
      navigate('/story-result');
    }
  };
  
  const handleDelete = async (e) => {
    e.stopPropagation();
    
    if (confirm("Es-tu sûr de vouloir supprimer cette histoire ?")) {
      try {
        await deleteStory(story.id);
      } catch (error) {
        console.error("Error deleting story:", error);
        window.showMessageModal("Erreur lors de la suppression de l'histoire.");
      }
    }
  };
  
  const handleRename = (e) => {
    e.stopPropagation();
    setShowRenameModal(true);
  };
  
  const handleRenameSubmit = async (e) => {
    e.preventDefault();
    
    if (!newTitle.trim()) {
      window.showMessageModal("Le titre ne peut pas être vide.");
      return;
    }
    
    try {
      await updateStoryTitle(story.id, newTitle.trim());
      setShowRenameModal(false);
    } catch (error) {
      console.error("Error renaming story:", error);
      window.showMessageModal("Erreur lors du renommage de l'histoire.");
    }
  };

  return (
    <>
      <div 
        className={`
          relative w-full max-w-xs mx-auto mb-2 
          ${selected ? 'bg-primary-light' : 'bg-primary-light'} 
          text-primary rounded-full py-3 px-4 text-center font-bold cursor-pointer
          shadow-md hover:shadow-lg transition-shadow
        `}
        onClick={handleClick}
        data-id={story.id}
      >
        <div className="font-bold">{story.titre || 'Histoire sans titre'}</div>
        
        {story.note !== undefined && (
          <div className="mt-1">
            <Rating storyId={story.id} readOnly size="small" />
          </div>
        )}
        
        {story.partageParPrenom && (
          <div className="text-sm opacity-90 mt-1">
            Partagée par {story.partageParPrenom}
          </div>
        )}
        
        {selected && (
          <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-red-500 text-xl">✓</span>
        )}
      </div>
      
      {/* Rename Modal */}
      {showRenameModal && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowRenameModal(false);
            }
          }}
        >
          <div className="bg-cream rounded-xl p-6 w-80">
            <h3 className="text-xl font-bold mb-4 text-center">Renommer l'histoire</h3>
            
            <form onSubmit={handleRenameSubmit}>
              <input
                type="text"
                className="ui-input"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                maxLength={50}
              />
              
              <div className="flex justify-center gap-8 mt-6">
                <img 
                  src="/croix-cartoon.png" 
                  alt="Annuler" 
                  title="Annuler" 
                  className="h-12 cursor-pointer" 
                  onClick={() => setShowRenameModal(false)}
                />
                <img 
                  src="/coche-verte-cartoon.png" 
                  alt="Valider" 
                  title="Valider" 
                  className="h-12 cursor-pointer" 
                  onClick={handleRenameSubmit}
                />
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default StoryCard;