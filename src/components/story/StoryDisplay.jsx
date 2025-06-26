import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStory } from '../../contexts/StoryContext';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../ui/Button';
import Rating from '../ui/Rating';
import ShareModal from './ShareModal';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

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

  const handleExportPDF = async () => {
    if (!currentStory) return;
    
    try {
      setIsExporting(true);
      
      // Create a temporary div for rendering
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = `
        <div style="padding: 20px; font-family: Arial, sans-serif;">
          <h1 style="text-align: center; color: #395872;">${currentStory.titre}</h1>
          ${currentStory.displayHtml || currentStory.contenu}
        </div>
      `;
      document.body.appendChild(tempDiv);
      
      // Convert to canvas
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        allowTaint: true
      });
      
      // Remove the temporary div
      document.body.removeChild(tempDiv);
      
      // Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 295; // A4 height in mm
      const imgHeight = canvas.height * imgWidth / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;
      
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      // Save the PDF
      pdf.save(`${currentStory.titre || 'histoire'}.pdf`);
      
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
      <div className="flex items-center justify-center mb-6">
        <h3 className="text-xl font-bold text-primary m-0">{currentStory.titre}</h3>
        
        <div className="flex ml-2">
          <button 
            className="ui-button-icon ml-2"
            onClick={handleAudioToggle}
            title={isPlaying ? (isPaused ? "Reprendre la lecture" : "Mettre en pause") : "Écouter l'histoire"}
          >
            <span className={isPlaying ? "playing" : ""}>
              {isPlaying ? (isPaused ? "▶️" : "⏸️") : "🔊"}
            </span>
          </button>
          
          <button 
            className="ui-button-icon ml-2"
            onClick={handleExportPDF}
            title="Télécharger en PDF"
            disabled={isExporting}
          >
            {isExporting ? "⏳" : "⬇️"}
          </button>
          
          <button 
            className="ui-button-icon ml-2"
            onClick={() => setShowShareModal(true)}
            title="Partager l'histoire"
          >
            🔄
          </button>
        </div>
      </div>
      
      <div 
        id="histoire"
        className="mb-6"
        dangerouslySetInnerHTML={{ __html: currentStory.displayHtml || currentStory.contenu }}
      />
      
      <Rating storyId={currentStory.id} />
      
      <div className="mt-8">
        {currentStory.temporary && (
          <Button 
            onClick={handleSaveStory}
            disabled={isSaving}
            className="mb-4"
          >
            {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
          </Button>
        )}
        
        <div className="flex justify-between gap-4">
          <Button 
            variant="secondary" 
            onClick={() => navigate(-1)}
          >
            Retour
          </Button>
          <Button 
            variant="secondary" 
            onClick={() => navigate('/')}
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