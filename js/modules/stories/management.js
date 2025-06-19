// js/modules/stories/management.js
// Module de gestion des histoires
// Responsable de la sauvegarde, suppression et liste des histoires

// S'assurer que les namespaces existent
window.MonHistoire = window.MonHistoire || {};
MonHistoire.modules = MonHistoire.modules || {};
MonHistoire.modules.stories = MonHistoire.modules.stories || {};

// Module de gestion des histoires
(function() {
  // Variables privées
  let currentUser = null;
  let stories = [];
  let isInitialized = false;
  
  /**
   * Initialise le module de gestion des histoires
   */
  function init() {
    if (isInitialized) {
      console.warn("Module Management déjà initialisé");
      return;
    }
    
    // Écouter les changements d'authentification
    if (MonHistoire.events) {
      MonHistoire.events.on('authStateChange', handleAuthStateChange);
      MonHistoire.events.on('profileSelected', handleProfileChange);
      MonHistoire.events.on('storyGenerated', handleStoryGenerated);
    }

    // Récupère l'utilisateur courant si disponible
    if (!currentUser && firebase.auth && firebase.auth().currentUser) {
      currentUser = firebase.auth().currentUser;
    }
    
    // Configurer les écouteurs d'événements pour les boutons
    setupListeners();
    
    isInitialized = true;
    console.log("Module Management initialisé");
  }
  
  /**
   * Gère les changements d'état d'authentification
   * @param {Object} user - Utilisateur authentifié ou null
   */
  function handleAuthStateChange(user) {
    currentUser = user;
    
    if (user) {
      // Utilisateur connecté, charger les histoires si un profil est sélectionné
      if (MonHistoire.state.profilActif) {
        loadStories();
      }
    } else {
      // Utilisateur déconnecté, réinitialiser les histoires
      stories = [];
      
      // Mettre à jour l'interface utilisateur
      updateUI();
    }
  }
  
  /**
   * Gère les changements de profil
   * @param {Object} profile - Profil sélectionné
   */
  function handleProfileChange(profile) {
    MonHistoire.state.profilActif = profile;

    if (currentUser && profile) {
      // Charger les histoires du profil
      loadStories();
    } else {
      // Réinitialiser les histoires
      stories = [];
      
      // Mettre à jour l'interface utilisateur
      updateUI();
    }
  }
  
  /**
   * Gère la génération d'une histoire
   * @param {Object} story - Histoire générée
   */
  function handleStoryGenerated(story) {
    // Ajouter l'histoire à la liste temporaire (non sauvegardée)
    const tempStory = { ...story, temporary: true };
    stories.unshift(tempStory);
    
    // Mettre à jour l'interface utilisateur
    updateUI();
  }
  
  /**
   * Configure les écouteurs d'événements
   */
  function setupListeners() {
    // Bouton de rafraîchissement des histoires
    const refreshButton = document.getElementById('refresh-stories-button');
    if (refreshButton) {
      refreshButton.addEventListener('click', loadStories);
    }
    
    // Bouton de suppression d'histoire
    document.addEventListener('click', function(event) {
      if (event.target.classList.contains('delete-story-button')) {
        const storyId = event.target.dataset.storyId;
        if (storyId) {
          showDeleteConfirmation(storyId);
        }
      }
    });
    
    // Bouton de confirmation de suppression
    const confirmDeleteButton = document.getElementById('confirm-delete-story');
    if (confirmDeleteButton) {
      confirmDeleteButton.addEventListener('click', handleDeleteStory);
    }
    
    // Bouton d'annulation de suppression
    const cancelDeleteButton = document.getElementById('cancel-delete-story');
    if (cancelDeleteButton) {
      cancelDeleteButton.addEventListener('click', hideDeleteConfirmation);
    }
    
    // Bouton de renommage d'histoire
    document.addEventListener('click', function(event) {
      if (event.target.classList.contains('rename-story-button')) {
        const storyId = event.target.dataset.storyId;
        if (storyId) {
          showRenameModal(storyId);
        }
      }
    });
    
    // Bouton de confirmation de renommage
    const confirmRenameButton = document.getElementById('confirm-rename-story');
    if (confirmRenameButton) {
      confirmRenameButton.addEventListener('click', handleRenameStory);
    }
    
    console.log("Écouteurs configurés");
  }
  
  /**
   * Charge les histoires du profil actuel
   */
  function loadStories() {
    if (!currentUser || !MonHistoire.state.profilActif) {
      return;
    }
    
    // Afficher le chargement
    if (MonHistoire.modules.app && MonHistoire.modules.app.showLoading) {
      MonHistoire.modules.app.showLoading(true, "Chargement des histoires...");
    }
    
    // Utiliser le module de stockage pour récupérer les histoires
    if (MonHistoire.modules.core && MonHistoire.modules.core.storage) {
      MonHistoire.modules.core.storage.getStories(MonHistoire.state.profilActif.id)
        .then(loadedStories => {
          stories = loadedStories;
          
          // Mettre à jour l'interface utilisateur
          updateUI();
          
          // Masquer le chargement
          if (MonHistoire.modules.app && MonHistoire.modules.app.showLoading) {
            MonHistoire.modules.app.showLoading(false);
          }
          
          console.log(`${stories.length} histoires chargées`);
        })
        .catch(error => {
          console.error("Erreur lors du chargement des histoires:", error);
          
          // Masquer le chargement
          if (MonHistoire.modules.app && MonHistoire.modules.app.showLoading) {
            MonHistoire.modules.app.showLoading(false);
          }
          
          // Afficher un message d'erreur
          if (MonHistoire.showMessageModal) {
            MonHistoire.showMessageModal("Erreur lors du chargement des histoires. Veuillez réessayer.");
          }
        });
    } else {
      console.error("Module de stockage non disponible");
      
      // Masquer le chargement
      if (MonHistoire.modules.app && MonHistoire.modules.app.showLoading) {
        MonHistoire.modules.app.showLoading(false);
      }
    }
  }
  
  /**
   * Met à jour l'interface utilisateur
   */
  function updateUI() {
    const storiesContainer = document.getElementById('stories-container');
    if (!storiesContainer) {
      return;
    }
    
    // Vider le conteneur
    storiesContainer.innerHTML = '';
    
    if (stories.length === 0) {
      // Afficher un message si aucune histoire
      const emptyMessage = document.createElement('div');
      emptyMessage.className = 'empty-message';
      emptyMessage.textContent = 'Aucune histoire trouvée. Créez votre première histoire !';
      storiesContainer.appendChild(emptyMessage);
      return;
    }
    
    // Ajouter chaque histoire
    stories.forEach(story => {
      const storyItem = document.createElement('div');
      storyItem.className = 'story-item';
      if (story.temporary) {
        storyItem.classList.add('temporary');
      }
      
      // Ajouter le titre
      const title = document.createElement('div');
      title.className = 'story-title';
      title.textContent = story.title || 'Histoire sans titre';
      
      // Ajouter la date
      const date = document.createElement('div');
      date.className = 'story-date';
      if (story.createdAt) {
        const storyDate = new Date(story.createdAt);
        date.textContent = storyDate.toLocaleDateString();
      } else {
        date.textContent = 'Date inconnue';
      }
      
      // Ajouter les boutons d'action
      const actions = document.createElement('div');
      actions.className = 'story-actions';
      
      // Bouton de lecture
      const viewButton = document.createElement('button');
      viewButton.className = 'view-story-button';
      viewButton.innerHTML = '<i class="fas fa-book-open"></i>';
      viewButton.title = 'Lire l\'histoire';
      viewButton.addEventListener('click', () => {
        viewStory(story);
      });
      
      // Bouton de renommage
      const renameButton = document.createElement('button');
      renameButton.className = 'rename-story-button';
      renameButton.innerHTML = '<i class="fas fa-edit"></i>';
      renameButton.title = 'Renommer l\'histoire';
      renameButton.dataset.storyId = story.id;
      
      // Bouton de suppression
      const deleteButton = document.createElement('button');
      deleteButton.className = 'delete-story-button';
      deleteButton.innerHTML = '<i class="fas fa-trash"></i>';
      deleteButton.title = 'Supprimer l\'histoire';
      deleteButton.dataset.storyId = story.id;
      
      // Ajouter les boutons aux actions
      actions.appendChild(viewButton);
      actions.appendChild(renameButton);
      actions.appendChild(deleteButton);
      
      // Ajouter les éléments à l'histoire
      storyItem.appendChild(title);
      storyItem.appendChild(date);
      storyItem.appendChild(actions);
      
      // Ajouter l'histoire au conteneur
      storiesContainer.appendChild(storyItem);
    });
  }
  
  /**
   * Affiche une histoire
   * @param {Object} story - Histoire à afficher
   */
  function viewStory(story) {
    // Utiliser le module d'affichage pour afficher l'histoire
    if (MonHistoire.modules.stories && MonHistoire.modules.stories.display) {
      MonHistoire.modules.stories.display.showStory(story);
      
      // Émettre un événement pour informer les autres modules
      if (MonHistoire.events) {
        MonHistoire.events.emit('storyViewed', story);
      }
    } else {
      console.error("Module d'affichage non disponible");
    }
  }
  
  /**
   * Affiche la confirmation de suppression
   * @param {string} storyId - ID de l'histoire à supprimer
   */
  function showDeleteConfirmation(storyId) {
    const deleteModal = document.getElementById('delete-story-modal');
    if (deleteModal) {
      // Stocker l'ID de l'histoire dans le modal
      deleteModal.dataset.storyId = storyId;
      
      // Afficher le modal
      deleteModal.classList.add('show');
    }
  }
  
  /**
   * Masque la confirmation de suppression
   */
  function hideDeleteConfirmation() {
    const deleteModal = document.getElementById('delete-story-modal');
    if (deleteModal) {
      deleteModal.classList.remove('show');
    }
  }
  
  /**
   * Gère la suppression d'une histoire
   */
  function handleDeleteStory() {
    const deleteModal = document.getElementById('delete-story-modal');
    if (!deleteModal) {
      return;
    }
    
    const storyId = deleteModal.dataset.storyId;
    if (!storyId) {
      return;
    }
    
    // Masquer le modal
    hideDeleteConfirmation();
    
    // Afficher le chargement
    if (MonHistoire.modules.app && MonHistoire.modules.app.showLoading) {
      MonHistoire.modules.app.showLoading(true, "Suppression de l'histoire...");
    }
    
    // Vérifier si c'est une histoire temporaire
    const storyIndex = stories.findIndex(s => s.id === storyId);
    if (storyIndex !== -1 && stories[storyIndex].temporary) {
      // Supprimer l'histoire de la liste locale
      stories.splice(storyIndex, 1);
      
      // Mettre à jour l'interface utilisateur
      updateUI();
      
      // Masquer le chargement
      if (MonHistoire.modules.app && MonHistoire.modules.app.showLoading) {
        MonHistoire.modules.app.showLoading(false);
      }
      
      return;
    }
    
    // Utiliser le module de stockage pour supprimer l'histoire
    if (MonHistoire.modules.core && MonHistoire.modules.core.storage) {
      MonHistoire.modules.core.storage.deleteStory(storyId)
        .then(() => {
          // Supprimer l'histoire de la liste locale
          const index = stories.findIndex(s => s.id === storyId);
          if (index !== -1) {
            stories.splice(index, 1);
          }
          
          // Mettre à jour l'interface utilisateur
          updateUI();
          
          // Masquer le chargement
          if (MonHistoire.modules.app && MonHistoire.modules.app.showLoading) {
            MonHistoire.modules.app.showLoading(false);
          }
          
          // Émettre un événement pour informer les autres modules
          if (MonHistoire.events) {
            MonHistoire.events.emit('storyDeleted', storyId);
          }
          
          console.log(`Histoire ${storyId} supprimée`);
        })
        .catch(error => {
          console.error("Erreur lors de la suppression de l'histoire:", error);
          
          // Masquer le chargement
          if (MonHistoire.modules.app && MonHistoire.modules.app.showLoading) {
            MonHistoire.modules.app.showLoading(false);
          }
          
          // Afficher un message d'erreur
          if (MonHistoire.showMessageModal) {
            MonHistoire.showMessageModal("Erreur lors de la suppression de l'histoire. Veuillez réessayer.");
          }
        });
    } else {
      console.error("Module de stockage non disponible");
      
      // Masquer le chargement
      if (MonHistoire.modules.app && MonHistoire.modules.app.showLoading) {
        MonHistoire.modules.app.showLoading(false);
      }
    }
  }
  
  /**
   * Affiche le modal de renommage
   * @param {string} storyId - ID de l'histoire à renommer
   */
  function showRenameModal(storyId) {
    const renameModal = document.getElementById('rename-story-modal');
    if (!renameModal) {
      return;
    }
    
    // Trouver l'histoire
    const story = stories.find(s => s.id === storyId);
    if (!story) {
      return;
    }
    
    // Stocker l'ID de l'histoire dans le modal
    renameModal.dataset.storyId = storyId;
    
    // Mettre à jour le champ de titre
    const titleInput = document.getElementById('story-new-title');
    if (titleInput) {
      titleInput.value = story.title || '';
    }
    
    // Afficher le modal
    renameModal.classList.add('show');
  }
  
  /**
   * Gère le renommage d'une histoire
   */
  function handleRenameStory() {
    const renameModal = document.getElementById('rename-story-modal');
    if (!renameModal) {
      return;
    }
    
    const storyId = renameModal.dataset.storyId;
    if (!storyId) {
      return;
    }
    
    // Récupérer le nouveau titre
    const titleInput = document.getElementById('story-new-title');
    if (!titleInput || !titleInput.value.trim()) {
      if (MonHistoire.showMessageModal) {
        MonHistoire.showMessageModal("Veuillez saisir un titre.");
      }
      return;
    }
    
    const newTitle = titleInput.value.trim();
    
    // Masquer le modal
    renameModal.classList.remove('show');
    
    // Afficher le chargement
    if (MonHistoire.modules.app && MonHistoire.modules.app.showLoading) {
      MonHistoire.modules.app.showLoading(true, "Renommage de l'histoire...");
    }
    
    // Vérifier si c'est une histoire temporaire
    const storyIndex = stories.findIndex(s => s.id === storyId);
    if (storyIndex !== -1 && stories[storyIndex].temporary) {
      // Mettre à jour le titre dans la liste locale
      stories[storyIndex].title = newTitle;
      
      // Mettre à jour l'interface utilisateur
      updateUI();
      
      // Masquer le chargement
      if (MonHistoire.modules.app && MonHistoire.modules.app.showLoading) {
        MonHistoire.modules.app.showLoading(false);
      }
      
      return;
    }
    
    // Utiliser le module de stockage pour renommer l'histoire
    if (MonHistoire.modules.core && MonHistoire.modules.core.storage) {
      MonHistoire.modules.core.storage.updateStoryTitle(storyId, newTitle)
        .then(() => {
          // Mettre à jour le titre dans la liste locale
          const index = stories.findIndex(s => s.id === storyId);
          if (index !== -1) {
            stories[index].title = newTitle;
          }
          
          // Mettre à jour l'interface utilisateur
          updateUI();
          
          // Masquer le chargement
          if (MonHistoire.modules.app && MonHistoire.modules.app.showLoading) {
            MonHistoire.modules.app.showLoading(false);
          }
          
          console.log(`Histoire ${storyId} renommée en "${newTitle}"`);
        })
        .catch(error => {
          console.error("Erreur lors du renommage de l'histoire:", error);
          
          // Masquer le chargement
          if (MonHistoire.modules.app && MonHistoire.modules.app.showLoading) {
            MonHistoire.modules.app.showLoading(false);
          }
          
          // Afficher un message d'erreur
          if (MonHistoire.showMessageModal) {
            MonHistoire.showMessageModal("Erreur lors du renommage de l'histoire. Veuillez réessayer.");
          }
        });
    } else {
      console.error("Module de stockage non disponible");
      
      // Masquer le chargement
      if (MonHistoire.modules.app && MonHistoire.modules.app.showLoading) {
        MonHistoire.modules.app.showLoading(false);
      }
    }
  }
  
  /**
   * Sauvegarde une histoire
   * @param {Object} story - Histoire à sauvegarder
   * @returns {Promise} Promesse résolue avec l'ID de l'histoire sauvegardée
   */
  function saveStory(story) {
    return new Promise((resolve, reject) => {
      const user = currentUser || (firebase.auth && firebase.auth().currentUser);
      if (!user || !MonHistoire.state.profilActif) {
        reject(new Error("Utilisateur ou profil non défini"));
        return;
      }
      
      // Préparer les données de l'histoire
      const storyData = {
        ...story,
        userId: user.uid,
        profileId: MonHistoire.state.profilActif.id,
        createdAt: story.createdAt || new Date().toISOString()
      };
      
      // Utiliser le module de stockage pour sauvegarder l'histoire
      if (MonHistoire.modules.core && MonHistoire.modules.core.storage) {
        MonHistoire.modules.core.storage.saveStory(storyData)
          .then(storyId => {
            // Mettre à jour l'ID de l'histoire
            storyData.id = storyId;
            
            // Supprimer l'histoire temporaire si elle existe
            const tempIndex = stories.findIndex(s => s.temporary && s.id === story.id);
            if (tempIndex !== -1) {
              stories.splice(tempIndex, 1);
            }
            
            // Ajouter l'histoire à la liste
            stories.unshift(storyData);
            
            // Mettre à jour l'interface utilisateur
            updateUI();
            
            // Émettre un événement pour informer les autres modules
            if (MonHistoire.events) {
              MonHistoire.events.emit('storySaved', storyData);
            }
            
            resolve(storyId);
          })
          .catch(reject);
      } else {
        reject(new Error("Module de stockage non disponible"));
      }
    });
  }
  
  /**
   * Obtient toutes les histoires du profil actuel
   * @returns {Array} Liste des histoires
   */
  function getStories() {
    return [...stories];
  }
  
  /**
   * Obtient une histoire par son ID
   * @param {string} storyId - ID de l'histoire
   * @returns {Object} Histoire ou null si non trouvée
   */
  function getStoryById(storyId) {
    return stories.find(s => s.id === storyId) || null;
  }

  /**
   * Wrapper public pour supprimer une histoire avec confirmation
   * @param {string} id - ID de l'histoire à supprimer
   */
  function supprimerHistoire(id) {
    if (!id) {
      return;
    }

    // Réutilise la logique existante de confirmation/suppression
    showDeleteConfirmation(id);
    // L'utilisateur devra confirmer via le modal qui déclenchera handleDeleteStory
  }
  
  // API publique
  MonHistoire.modules.stories.management = {
    init: init,
    loadStories: loadStories,
    saveStory: saveStory,
    getStories: getStories,
    getStoryById: getStoryById,
    supprimerHistoire: supprimerHistoire
  };
})();
