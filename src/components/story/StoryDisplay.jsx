import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStory } from '../../contexts/StoryContext';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../ui/Button';
import Rating from '../ui/Rating';
import ShareModal from './ShareModal';

function StoryDisplay() {
  const { currentStory, saveStory } = useStory();
  const { currentUser, logActivity } = useAuth();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!currentStory) {
      navigate('/create-story');
    }
  }, [currentStory, navigate]);

  const handleSaveStory = async () => {
    if (!currentStory) return;
    
    try {
      setIsSaving(true);
      await saveStory(currentStory);
      window.showMessageModal("Histoire sauvegardée avec succès !");
      
      // Log activity
      if (logActivity) {
        logActivity('save_story', { story_id: currentStory.id });
      }
    } catch (error) {
      console.error("Error saving story:", error);
      window.showMessageModal(error.message || "Erreur lors de la sauvegarde de l'histoire.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAudioToggle = () => {
    if (!isPlaying) {
      // Start playing
      const utterance = new SpeechSynthesisUtterance();
      
      // Get text content from HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = currentStory.displayHtml || currentStory.contenu;
      const text = tempDiv.textContent;
      
      utterance.text = `${currentStory.titre}. ${text}`;
      utterance.lang = 'fr-FR';
      
      // Find a French voice if available
      const voices = window.speechSynthesis.getVoices();
      const frenchVoice = voices.find(voice => voice.lang.includes('fr'));
      if (frenchVoice) {
        utterance.voice = frenchVoice;
      }
      
      utterance.onend = () => {
        setIsPlaying(false);
        setIsPaused(false);
      };
      
      window.speechSynthesis.speak(utterance);
      setIsPlaying(true);
      setIsPaused(false);
      
      // Log activity
      if (logActivity) {
        logActivity('play_audio', { story_id: currentStory.id });
      }
    } else if (isPaused) {
      // Resume
      window.speechSynthesis.resume();
      setIsPaused(false);
    } else {
      // Pause
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  };

  const handleExportPDF = () => {
    if (!currentStory) return;
    
    try {
      setIsExporting(true);
      
      // Create a simple PDF export
      const content = `${currentStory.titre}\n\n${currentStory.chapitre1}\n\n${currentStory.chapitre2}\n\n${currentStory.chapitre3}\n\n${currentStory.chapitre4}\n\n${currentStory.chapitre5}`;
      
      // Create a blob and download it
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${currentStory.titre || 'histoire'}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      // Log activity
      if (logActivity) {
        logActivity('export_pdf', { story_id: currentStory.id });
      }
    } catch (error) {
      console.error("Error exporting PDF:", error);
      window.showMessageModal("Erreur lors de l'export en PDF.");
    } finally {
      setIsExporting(false);
    }
  };

  if (!currentStory) {
    return <div className="text-center">Chargement...</div>;
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="flex items-center justify-center mb-8">
        <h3 className="text-2xl font-bold text-primary-dark m-0">{currentStory.titre}</h3>
        
        <div className="flex ml-3">
          <button 
            className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md ml-2 text-xl hover:scale-110 active:scale-90 transition-transform"
            onClick={handleAudioToggle}
            title={isPlaying ? (isPaused ? "Reprendre la lecture" : "Mettre en pause") : "Écouter l'histoire"}
          >
            <span className={isPlaying ? "animate-pulse" : ""}>
              {isPlaying ? (isPaused ? "▶️" : "⏸️") : "🔊"}
            </span>
          </button>
          
          <button 
            className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md ml-2 text-xl hover:scale-110 active:scale-90 transition-transform"
            onClick={handleExportPDF}
            title="Télécharger en PDF"
            disabled={isExporting}
          >
            {isExporting ? "⏳" : "⬇️"}
          </button>
          
          <button 
            className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md ml-2 text-xl hover:scale-110 active:scale-90 transition-transform"
            onClick={() => setShowShareModal(true)}
            title="Partager l'histoire"
          >
            🔄
          </button>
        </div>
      </div>
      
      <div 
        id="histoire"
        className="mb-8 prose prose-lg max-w-none"
        dangerouslySetInnerHTML={{ __html: currentStory.displayHtml || currentStory.contenu }}
      />
      
      <div>
        <Rating storyId={currentStory.id} />
      </div>
      
      <div className="mt-10">
        {currentStory.temporary && (
          <Button 
            onClick={handleSaveStory}
            disabled={isSaving}
            className="mb-6 bg-gradient-to-r from-green-400 to-green-500 hover:from-green-500 hover:to-green-600 shadow-md"
          >
            {isSaving ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Sauvegarde...
              </span>
            ) : (
              "Sauvegarder ✨"
            )}
          </Button>
        )}
        
        <div className="flex justify-between gap-4">
          <Button 
            variant="secondary" 
            onClick={() => navigate(-1)}
            className="bg-gradient-to-r from-gray-300 to-gray-400 hover:from-gray-400 hover:to-gray-500 shadow-md"
          >
            Retour
          </Button>
          <Button 
            variant="secondary" 
            onClick={() => navigate('/')}
            className="bg-gradient-to-r from-secondary-light to-purple-400 hover:from-purple-400 hover:to-secondary-light shadow-md"
          >
            Accueil
          </Button>
        </div>
      </div>
      
      <ShareModal 
        show={showShareModal} 
        onClose={() => setShowShareModal(false)} 
        story={currentStory}
      />
    </div>
  );
}

export default StoryDisplay;