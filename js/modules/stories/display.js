// js/modules/stories/display.js
// Module d'affichage des histoires
// Responsable de l'affichage et du rendu des histoires

// S'assurer que les namespaces existent
window.MonHistoire = window.MonHistoire || {};
MonHistoire.modules = MonHistoire.modules || {};
MonHistoire.modules.stories = MonHistoire.modules.stories || {};

// Module d'affichage des histoires
(function() {
  // Variables privées
  let currentStory = null;
  let isInitialized = false;
  
  /**
   * Initialise le module d'affichage des histoires
   */
  function init() {
    if (isInitialized) {
      console.warn("Module Display déjà initialisé");
      return;
    }
    
    // Configurer les écouteurs d'événements
    setupListeners();
    
    isInitialized = true;
    console.log("Module Display initialisé");
  }
  
  /**
   * Configure les écouteurs d'événements
   */
  function setupListeners() {
    // Bouton de retour à la liste des histoires
    const backButton = document.getElementById('back-to-stories-button');
    if (backButton) {
      backButton.addEventListener('click', handleBackToStories);
    }
    
    // Bouton d'export
    const exportButton = document.getElementById('export-story-button');
    if (exportButton) {
      exportButton.addEventListener('click', handleExportStory);
    }
    
    // Bouton de lecture audio
    const audioButton = document.getElementById('audio-story-button');
    if (audioButton) {
      audioButton.addEventListener('click', handleAudioStory);
    }
    
    // Bouton de partage
    const shareButton = document.getElementById('share-story-button');
    if (shareButton) {
      shareButton.addEventListener('click', handleShareStory);
    }
    
    console.log("Écouteurs configurés");
  }
  
  /**
   * Affiche une histoire
   * @param {Object} story - Histoire à afficher
   */
  function showStory(story) {
    if (!story) {
      return;
    }
    
    currentStory = story;
    
    // Mettre à jour l'interface utilisateur
    updateUI();
    
    // Afficher la section d'affichage
    const storyListSection = document.getElementById('stories-list-section');
    const storyDisplaySection = document.getElementById('story-display-section');
    
    if (storyListSection && storyDisplaySection) {
      storyListSection.classList.add('hidden');
      storyDisplaySection.classList.remove('hidden');
    }
    
    // Faire défiler vers le haut
    window.scrollTo(0, 0);
    
    console.log(`Histoire affichée: ${story.title}`);
  }
  
  /**
   * Met à jour l'interface utilisateur
   */
  function updateUI() {
    if (!currentStory) {
      return;
    }
    
    // Mettre à jour le titre
    const storyTitle = document.getElementById('display-story-title');
    if (storyTitle) {
      storyTitle.textContent = currentStory.title || 'Histoire sans titre';
    }
    
    // Mettre à jour le contenu
    const storyContent = document.getElementById('display-story-content');
    if (storyContent) {
      storyContent.innerHTML = formatStoryContent(currentStory.content);
    }
    
    // Mettre à jour l'image
    const storyImage = document.getElementById('display-story-image');
    if (storyImage) {
      if (currentStory.imageUrl) {
        storyImage.style.backgroundImage = `url(${currentStory.imageUrl})`;
        storyImage.classList.remove('hidden');
      } else {
        storyImage.classList.add('hidden');
      }
    }
    
    // Mettre à jour la date
    const storyDate = document.getElementById('display-story-date');
    if (storyDate && currentStory.createdAt) {
      const date = new Date(currentStory.createdAt);
      storyDate.textContent = `Créée le ${date.toLocaleDateString()}`;
    }
  }
  
  /**
   * Formate le contenu de l'histoire pour l'affichage
   * @param {string} content - Contenu brut de l'histoire
   * @returns {string} Contenu formaté
   */
  function formatStoryContent(content) {
    if (!content) {
      return '';
    }
    
    // Remplacer les sauts de ligne par des paragraphes
    let formatted = content.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>');
    
    // Entourer le contenu avec des balises de paragraphe
    formatted = `<p>${formatted}</p>`;
    
    return formatted;
  }
  
  /**
   * Gère le retour à la liste des histoires
   */
  function handleBackToStories() {
    // Masquer la section d'affichage
    const storyListSection = document.getElementById('stories-list-section');
    const storyDisplaySection = document.getElementById('story-display-section');
    
    if (storyListSection && storyDisplaySection) {
      storyListSection.classList.remove('hidden');
      storyDisplaySection.classList.add('hidden');
    }
    
    // Réinitialiser l'histoire courante
    currentStory = null;
  }
  
  /**
   * Gère l'export de l'histoire
   */
  function handleExportStory() {
    if (!currentStory) {
      return;
    }
    
    // Utiliser le module d'export pour exporter l'histoire
    if (MonHistoire.modules.stories && MonHistoire.modules.stories.export) {
      MonHistoire.modules.stories.export.exportStory(currentStory);
    } else {
      console.error("Module d'export non disponible");
      
      // Afficher un message d'erreur
      if (MonHistoire.showMessageModal) {
        MonHistoire.showMessageModal("Fonctionnalité d'export non disponible.");
      }
    }
  }
  
  /**
   * Gère la lecture audio de l'histoire
   */
  function handleAudioStory() {
    if (!currentStory) {
      return;
    }
    
    // Utiliser le module audio pour lire l'histoire
    if (MonHistoire.modules.features && MonHistoire.modules.features.audio) {
      MonHistoire.modules.features.audio.playStory(currentStory);
    } else {
      console.error("Module audio non disponible");
      
      // Afficher un message d'erreur
      if (MonHistoire.showMessageModal) {
        MonHistoire.showMessageModal("Fonctionnalité de lecture audio non disponible.");
      }
    }
  }
  
  /**
   * Gère le partage de l'histoire
   */
  function handleShareStory() {
    if (!currentStory) {
      return;
    }
    
    // Utiliser le module de partage pour partager l'histoire
    if (MonHistoire.modules.sharing) {
      MonHistoire.modules.sharing.shareStory(currentStory);
    } else {
      console.error("Module de partage non disponible");
      
      // Afficher un message d'erreur
      if (MonHistoire.showMessageModal) {
        MonHistoire.showMessageModal("Fonctionnalité de partage non disponible.");
      }
    }
  }
  
  /**
   * Obtient l'histoire actuellement affichée
   * @returns {Object} Histoire actuellement affichée ou null
   */
  function getCurrentStory() {
    return currentStory;
  }
  
  /**
   * Formate une histoire pour l'affichage
   * @param {Object} story - Histoire à formater
   * @returns {Object} Histoire formatée
   */
  function formatStory(story) {
    if (!story) {
      return null;
    }
    
    return {
      ...story,
      formattedContent: formatStoryContent(story.content),
      formattedDate: story.createdAt ? new Date(story.createdAt).toLocaleDateString() : 'Date inconnue'
    };
  }
  
  // API publique
  MonHistoire.modules.stories.display = {
    init: init,
    showStory: showStory,
    getCurrentStory: getCurrentStory,
    formatStory: formatStory
  };
})();
