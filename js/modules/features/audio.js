// js/modules/features/audio.js
// Module de lecture audio
// Responsable de la synthèse vocale pour la lecture des histoires

// S'assurer que les namespaces existent
window.MonHistoire = window.MonHistoire || {};
MonHistoire.modules = MonHistoire.modules || {};
MonHistoire.modules.features = MonHistoire.modules.features || {};

// Module de lecture audio
(function() {
  // Variables privées
  let isInitialized = false;
  let isPlaying = false;
  let isPaused = false;
  let currentStory = null;
  let speechSynthesis = window.speechSynthesis;
  let speechUtterance = null;
  let selectedVoice = null;
  let voiceOptions = [];
  let playbackRate = 1.0;
  let volume = 1.0;
  
  /**
   * Initialise le module de lecture audio
   */
  function init() {
    if (isInitialized) {
      console.warn("Module Audio déjà initialisé");
      return;
    }
    
    // Vérifier si la synthèse vocale est disponible
    if (!speechSynthesis) {
      console.error("La synthèse vocale n'est pas disponible dans ce navigateur");
      return;
    }
    
    // Charger les voix disponibles
    loadVoices();
    
    // Configurer les écouteurs d'événements
    setupListeners();
    
    isInitialized = true;
    console.log("Module Audio initialisé");
  }
  
  /**
   * Charge les voix disponibles
   */
  function loadVoices() {
    // Récupérer les voix disponibles
    voiceOptions = speechSynthesis.getVoices();
    
    // Si aucune voix n'est disponible immédiatement, attendre qu'elles soient chargées
    if (voiceOptions.length === 0) {
      speechSynthesis.addEventListener('voiceschanged', () => {
        voiceOptions = speechSynthesis.getVoices();
        selectDefaultVoice();
        updateVoiceSelector();
      });
    } else {
      selectDefaultVoice();
      updateVoiceSelector();
    }
  }
  
  /**
   * Sélectionne la voix par défaut
   */
  function selectDefaultVoice() {
    // Chercher une voix française
    selectedVoice = voiceOptions.find(voice => voice.lang.startsWith('fr')) || 
                   voiceOptions.find(voice => voice.default) || 
                   (voiceOptions.length > 0 ? voiceOptions[0] : null);
    
    if (selectedVoice) {
      console.log(`Voix sélectionnée: ${selectedVoice.name} (${selectedVoice.lang})`);
    } else {
      console.warn("Aucune voix disponible");
    }
  }
  
  /**
   * Met à jour le sélecteur de voix dans l'interface
   */
  function updateVoiceSelector() {
    const voiceSelector = document.getElementById('voice-selector');
    if (!voiceSelector) {
      return;
    }
    
    // Vider le sélecteur
    voiceSelector.innerHTML = '';
    
    // Ajouter chaque voix comme option
    voiceOptions.forEach(voice => {
      const option = document.createElement('option');
      option.value = voice.name;
      option.textContent = `${voice.name} (${voice.lang})`;
      
      if (selectedVoice && voice.name === selectedVoice.name) {
        option.selected = true;
      }
      
      voiceSelector.appendChild(option);
    });
  }
  
  /**
   * Configure les écouteurs d'événements
   */
  function setupListeners() {
    // Bouton de lecture/pause
    const playPauseButton = document.getElementById('audio-play-pause');
    if (playPauseButton) {
      playPauseButton.addEventListener('click', togglePlayPause);
    }
    
    // Bouton d'arrêt
    const stopButton = document.getElementById('audio-stop');
    if (stopButton) {
      stopButton.addEventListener('click', stopPlayback);
    }
    
    // Sélecteur de voix
    const voiceSelector = document.getElementById('voice-selector');
    if (voiceSelector) {
      voiceSelector.addEventListener('change', handleVoiceChange);
    }
    
    // Contrôle de vitesse
    const speedControl = document.getElementById('audio-speed');
    if (speedControl) {
      speedControl.addEventListener('change', handleSpeedChange);
    }
    
    // Contrôle de volume
    const volumeControl = document.getElementById('audio-volume');
    if (volumeControl) {
      volumeControl.addEventListener('change', handleVolumeChange);
    }
    
    // Gérer les événements de la synthèse vocale
    if (speechSynthesis) {
      // Gérer la fin de la lecture
      document.addEventListener('end', handlePlaybackEnd);
      
      // Gérer la pause
      document.addEventListener('pause', () => {
        isPaused = true;
        updatePlaybackUI();
      });
      
      // Gérer la reprise
      document.addEventListener('resume', () => {
        isPaused = false;
        updatePlaybackUI();
      });
    }
    
    console.log("Écouteurs configurés");
  }
  
  /**
   * Lit une histoire à voix haute
   * @param {Object} story - Histoire à lire
   */
  function playStory(story) {
    if (!speechSynthesis || !story) {
      return;
    }
    
    // Si une lecture est en cours, l'arrêter
    if (isPlaying) {
      stopPlayback();
    }
    
    currentStory = story;
    
    // Créer un nouvel utterance
    speechUtterance = new SpeechSynthesisUtterance();
    
    // Définir le texte à lire
    speechUtterance.text = prepareTextForSpeech(story);
    
    // Définir la voix
    if (selectedVoice) {
      speechUtterance.voice = selectedVoice;
    }
    
    // Définir la langue
    speechUtterance.lang = selectedVoice ? selectedVoice.lang : 'fr-FR';
    
    // Définir la vitesse
    speechUtterance.rate = playbackRate;
    
    // Définir le volume
    speechUtterance.volume = volume;
    
    // Ajouter les écouteurs d'événements
    speechUtterance.addEventListener('end', handlePlaybackEnd);
    speechUtterance.addEventListener('error', handlePlaybackError);
    
    // Démarrer la lecture
    speechSynthesis.speak(speechUtterance);
    
    isPlaying = true;
    isPaused = false;
    
    // Mettre à jour l'interface utilisateur
    updatePlaybackUI();
    
    // Afficher le contrôleur audio
    showAudioController();
    
    // Émettre un événement pour informer les autres modules
    if (MonHistoire.events) {
      MonHistoire.events.emit('audioPlayed', story);
    }
    
    console.log(`Lecture de l'histoire: ${story.title}`);
  }
  
  /**
   * Prépare le texte pour la synthèse vocale
   * @param {Object} story - Histoire à lire
   * @returns {string} Texte préparé
   */
  function prepareTextForSpeech(story) {
    if (!story) {
      return '';
    }
    
    let text = '';
    
    // Ajouter le titre
    text += `${story.title || 'Histoire sans titre'}. `;
    
    // Ajouter le contenu
    if (story.content) {
      // Nettoyer le contenu
      const cleanContent = story.content
        .replace(/<[^>]*>/g, '') // Supprimer les balises HTML
        .replace(/\n+/g, ' ') // Remplacer les sauts de ligne par des espaces
        .replace(/\s+/g, ' ') // Normaliser les espaces
        .trim();
      
      text += cleanContent;
    }
    
    return text;
  }
  
  /**
   * Bascule entre lecture et pause
   */
  function togglePlayPause() {
    if (!speechSynthesis || !isPlaying) {
      return;
    }
    
    if (isPaused) {
      // Reprendre la lecture
      speechSynthesis.resume();
      isPaused = false;
    } else {
      // Mettre en pause
      speechSynthesis.pause();
      isPaused = true;
    }
    
    // Mettre à jour l'interface utilisateur
    updatePlaybackUI();
  }
  
  /**
   * Arrête la lecture
   */
  function stopPlayback() {
    if (!speechSynthesis || !isPlaying) {
      return;
    }
    
    // Arrêter la synthèse vocale
    speechSynthesis.cancel();
    
    isPlaying = false;
    isPaused = false;
    
    // Mettre à jour l'interface utilisateur
    updatePlaybackUI();
    
    // Masquer le contrôleur audio
    hideAudioController();
  }
  
  /**
   * Gère le changement de voix
   * @param {Event} event - Événement de changement
   */
  function handleVoiceChange(event) {
    const voiceName = event.target.value;
    selectedVoice = voiceOptions.find(voice => voice.name === voiceName);
    
    if (selectedVoice) {
      console.log(`Voix changée: ${selectedVoice.name} (${selectedVoice.lang})`);
      
      // Si une lecture est en cours, mettre à jour la voix
      if (isPlaying && speechUtterance) {
        // Mémoriser la position actuelle
        const currentPosition = speechSynthesis.speaking ? speechSynthesis.currentPosition : 0;
        
        // Arrêter la lecture actuelle
        speechSynthesis.cancel();
        
        // Créer un nouvel utterance avec la nouvelle voix
        speechUtterance = new SpeechSynthesisUtterance();
        speechUtterance.text = prepareTextForSpeech(currentStory);
        speechUtterance.voice = selectedVoice;
        speechUtterance.lang = selectedVoice.lang;
        speechUtterance.rate = playbackRate;
        speechUtterance.volume = volume;
        
        // Ajouter les écouteurs d'événements
        speechUtterance.addEventListener('end', handlePlaybackEnd);
        speechUtterance.addEventListener('error', handlePlaybackError);
        
        // Reprendre la lecture à la position actuelle (si possible)
        if (currentPosition > 0) {
          // Note: La reprise à une position spécifique n'est pas bien supportée par l'API,
          // donc on reprend simplement du début
          speechSynthesis.speak(speechUtterance);
        } else {
          speechSynthesis.speak(speechUtterance);
        }
      }
    }
  }
  
  /**
   * Gère le changement de vitesse
   * @param {Event} event - Événement de changement
   */
  function handleSpeedChange(event) {
    playbackRate = parseFloat(event.target.value);
    
    // Si une lecture est en cours, mettre à jour la vitesse
    if (isPlaying && speechUtterance) {
      speechUtterance.rate = playbackRate;
      
      // Note: La modification de la vitesse en cours de lecture n'est pas bien supportée par l'API,
      // donc on arrête et on reprend la lecture
      if (!isPaused) {
        speechSynthesis.cancel();
        speechSynthesis.speak(speechUtterance);
      }
    }
    
    console.log(`Vitesse changée: ${playbackRate}`);
  }
  
  /**
   * Gère le changement de volume
   * @param {Event} event - Événement de changement
   */
  function handleVolumeChange(event) {
    volume = parseFloat(event.target.value);
    
    // Si une lecture est en cours, mettre à jour le volume
    if (isPlaying && speechUtterance) {
      speechUtterance.volume = volume;
    }
    
    console.log(`Volume changé: ${volume}`);
  }
  
  /**
   * Gère la fin de la lecture
   */
  function handlePlaybackEnd() {
    isPlaying = false;
    isPaused = false;
    
    // Mettre à jour l'interface utilisateur
    updatePlaybackUI();
    
    // Masquer le contrôleur audio
    hideAudioController();
    
    console.log("Lecture terminée");
  }
  
  /**
   * Gère les erreurs de lecture
   * @param {Event} event - Événement d'erreur
   */
  function handlePlaybackError(event) {
    console.error("Erreur lors de la lecture audio:", event);
    
    isPlaying = false;
    isPaused = false;
    
    // Mettre à jour l'interface utilisateur
    updatePlaybackUI();
    
    // Masquer le contrôleur audio
    hideAudioController();
    
    // Afficher un message d'erreur
    if (MonHistoire.showMessageModal) {
      MonHistoire.showMessageModal("Erreur lors de la lecture audio. Veuillez réessayer.");
    }
  }
  
  /**
   * Met à jour l'interface utilisateur de lecture
   */
  function updatePlaybackUI() {
    // Mettre à jour le bouton de lecture/pause
    const playPauseButton = document.getElementById('audio-play-pause');
    if (playPauseButton) {
      if (isPlaying) {
        if (isPaused) {
          playPauseButton.innerHTML = '<i class="fas fa-play"></i>';
          playPauseButton.title = 'Reprendre';
        } else {
          playPauseButton.innerHTML = '<i class="fas fa-pause"></i>';
          playPauseButton.title = 'Pause';
        }
      } else {
        playPauseButton.innerHTML = '<i class="fas fa-play"></i>';
        playPauseButton.title = 'Lecture';
      }
    }
    
    // Mettre à jour le bouton d'arrêt
    const stopButton = document.getElementById('audio-stop');
    if (stopButton) {
      stopButton.disabled = !isPlaying;
    }
  }
  
  /**
   * Affiche le contrôleur audio
   */
  function showAudioController() {
    const audioController = document.getElementById('audio-controller');
    if (audioController) {
      audioController.classList.remove('hidden');
    }
  }
  
  /**
   * Masque le contrôleur audio
   */
  function hideAudioController() {
    const audioController = document.getElementById('audio-controller');
    if (audioController) {
      audioController.classList.add('hidden');
    }
  }
  
  /**
   * Vérifie si la synthèse vocale est disponible
   * @returns {boolean} True si la synthèse vocale est disponible
   */
  function isSpeechSynthesisAvailable() {
    return !!speechSynthesis;
  }
  
  /**
   * Obtient les voix disponibles
   * @returns {Array} Liste des voix disponibles
   */
  function getAvailableVoices() {
    return [...voiceOptions];
  }
  
  /**
   * Obtient la voix sélectionnée
   * @returns {Object} Voix sélectionnée
   */
  function getSelectedVoice() {
    return selectedVoice;
  }
  
  /**
   * Définit la voix à utiliser
   * @param {string} voiceName - Nom de la voix
   * @returns {boolean} True si la voix a été trouvée et définie
   */
  function setVoice(voiceName) {
    const voice = voiceOptions.find(v => v.name === voiceName);
    
    if (voice) {
      selectedVoice = voice;
      return true;
    }
    
    return false;
  }
  
  /**
   * Définit la vitesse de lecture
   * @param {number} rate - Vitesse de lecture (0.1 à 10)
   */
  function setPlaybackRate(rate) {
    playbackRate = Math.max(0.1, Math.min(10, rate));
  }
  
  /**
   * Définit le volume
   * @param {number} vol - Volume (0 à 1)
   */
  function setVolume(vol) {
    volume = Math.max(0, Math.min(1, vol));
  }
  
  // API publique
  MonHistoire.modules.features.audio = {
    init: init,
    playStory: playStory,
    togglePlayPause: togglePlayPause,
    stopPlayback: stopPlayback,
    isSpeechSynthesisAvailable: isSpeechSynthesisAvailable,
    getAvailableVoices: getAvailableVoices,
    getSelectedVoice: getSelectedVoice,
    setVoice: setVoice,
    setPlaybackRate: setPlaybackRate,
    setVolume: setVolume
  };
})();
