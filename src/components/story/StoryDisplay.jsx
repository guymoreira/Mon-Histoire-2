import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStory } from '../../contexts/StoryContext';
import { useAuth } from '../../contexts/AuthContext';
import { motion } from 'framer-motion';
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
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-2xl mx-auto"
    >
      <motion.div 
        className="flex items-center justify-center mb-8"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <h3 className="text-2xl font-bold text-primary-dark m-0">{currentStory.titre}</h3>
        
        <div className="flex ml-3">
          <motion.button 
            className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md ml-2 text-xl"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleAudioToggle}
            title={isPlaying ? (isPaused ? "Reprendre la lecture" : "Mettre en pause") : "Écouter l'histoire"}
          >
            <span className={isPlaying ? "animate-pulse" : ""}>
              {isPlaying ? (isPaused ? "▶️" : "⏸️") : "🔊"}
            </span>
          </motion.button>
          
          <motion.button 
            className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md ml-2 text-xl"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleExportPDF}
            title="Télécharger en PDF"
            disabled={isExporting}
          >
            {isExporting ? "⏳" : "⬇️"}
          </motion.button>
          
          <motion.button 
            className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md ml-2 text-xl"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowShareModal(true)}
            title="Partager l'histoire"
          >
            🔄
          </motion.button>
        </div>
      </motion.div>
      
      <motion.div 
        id="histoire"
        className="mb-8 prose prose-lg max-w-none"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        dangerouslySetInnerHTML={{ __html: currentStory.displayHtml || currentStory.contenu }}
      />
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <Rating storyId={currentStory.id} />
      </motion.div>
      
      <motion.div 
        className="mt-10"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
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
      </motion.div>
      
      <ShareModal 
        show={showShareModal} 
        onClose={() => setShowShareModal(false)} 
        story={currentStory}
      />
    </motion.div>
  );
}

export default StoryDisplay;