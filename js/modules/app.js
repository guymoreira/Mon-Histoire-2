// js/modules/app.js
// Module principal de l'application
// Responsable de la coordination des différents modules et de la logique métier principale

// S'assurer que les namespaces existent
window.MonHistoire = window.MonHistoire || {};
MonHistoire.modules = MonHistoire.modules || {};

// Module principal
(function() {
  // Variables privées
  let isInitialized = false;
  let currentScreen = null;
  let currentProfile = null;
  
  /**
   * Initialise le module principal
   */
  function init() {
    if (isInitialized) {
      console.warn("Module App déjà initialisé");
      return;
    }
    
    // Configurer les écouteurs d'événements
    setupEventListeners();
    
    // Initialiser l'interface utilisateur
    initUI();
    
    isInitialized = true;
    console.log("Module App initialisé");
    
    // Émettre un événement pour informer que l'application est prête
    if (MonHistoire.events) {
      MonHistoire.events.emit('appModuleReady');
    }
  }
  
  /**
   * Configure les écouteurs d'événements
   */
  function setupEventListeners() {
    // Écouter les événements de l'application
    if (MonHistoire.events) {
      // Événements d'authentification
      MonHistoire.events.on('authStateChange', handleAuthStateChange);
      
      // Événements de profil
      MonHistoire.events.on('profileSelected', handleProfileSelected);
      MonHistoire.events.on('profileCreated', handleProfileCreated);
      MonHistoire.events.on('profileUpdated', handleProfileUpdated);
      MonHistoire.events.on('profileDeleted', handleProfileDeleted);
      
      // Événements d'histoire
      MonHistoire.events.on('storyCreated', handleStoryCreated);
      MonHistoire.events.on('storyUpdated', handleStoryUpdated);
      MonHistoire.events.on('storyDeleted', handleStoryDeleted);
      MonHistoire.events.on('storyViewed', handleStoryViewed);
      
      // Événements de navigation
      MonHistoire.events.on('screenChanged', handleScreenChanged);
      
      // Événements de configuration
      MonHistoire.events.on('configChanged', handleConfigChanged);
      
      // Événements de cookies
      MonHistoire.events.on('cookiesAccepted', handleCookiesAccepted);
      
      console.log("Écouteurs d'événements configurés");
    } else {
      console.error("Le système d'événements n'est pas disponible");
    }
  }
  
  /**
   * Initialise l'interface utilisateur
   */
  function initUI() {
    // Initialiser les composants d'interface utilisateur
    initHeader();
    initFooter();
    initModals();
    
    // Ajouter les écouteurs d'événements pour les éléments d'interface
    setupUIEventListeners();
    
    console.log("Interface utilisateur initialisée");
  }
  
  /**
   * Initialise l'en-tête de l'application
   */
  function initHeader() {
    const header = document.getElementById('app-header');
    if (!header) {
      console.warn("En-tête non trouvé");
      return;
    }
    
    // Mettre à jour l'en-tête en fonction de l'état d'authentification
    updateHeaderState();
    
    console.log("En-tête initialisé");
  }
  
  /**
   * Initialise le pied de page de l'application
   */
  function initFooter() {
    const footer = document.getElementById('app-footer');
    if (!footer) {
      console.warn("Pied de page non trouvé");
      return;
    }
    
    // Mettre à jour le pied de page
    updateFooterState();
    
    console.log("Pied de page initialisé");
  }
  
  /**
   * Initialise les modals de l'application
   */
  function initModals() {
    // Initialiser les modals communs
    initMessageModal();
    initConfirmModal();
    
    console.log("Modals initialisés");
  }
  
  /**
   * Initialise le modal de message
   */
  function initMessageModal() {
    // Vérifier si le modal existe déjà
    let modal = document.getElementById('message-modal');
    
    // Créer le modal s'il n'existe pas
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'message-modal';
      modal.className = 'modal message-modal';
      
      // Ajouter le contenu du modal
      modal.innerHTML = `
        <div class="modal-content">
          <div class="modal-header">
            <h3 id="message-modal-title">Information</h3>
            <button class="close-modal">&times;</button>
          </div>
          <div class="modal-body">
            <p id="message-modal-text"></p>
          </div>
          <div class="modal-footer">
            <button id="close-message-modal" class="primary-button">OK</button>
          </div>
        </div>
      `;
      
      // Ajouter le modal au document
      document.body.appendChild(modal);
      
      // Ajouter les écouteurs d'événements
      const closeButton = modal.querySelector('.close-modal');
      const okButton = modal.querySelector('#close-message-modal');
      
      closeButton.addEventListener('click', () => {
        modal.classList.remove('show');
      });
      
      okButton.addEventListener('click', () => {
        modal.classList.remove('show');
      });
    } else {
      // Si le modal existe déjà, s'assurer que l'écouteur d'événement est attaché au bouton OK
      const okButton = document.getElementById('close-message-modal');
      if (okButton) {
        // Supprimer les écouteurs existants pour éviter les doublons
        const newOkButton = okButton.cloneNode(true);
        if (okButton.parentNode) {
          okButton.parentNode.replaceChild(newOkButton, okButton);
        }
        
        // Ajouter le nouvel écouteur
        newOkButton.addEventListener('click', () => {
          modal.classList.remove('show');
        });
        
        console.log("Écouteur d'événement réinitialisé pour le bouton close-message-modal");
      }
    }
    
    console.log("Modal de message initialisé");
  }
  
  /**
   * Initialise le modal de confirmation
   */
  function initConfirmModal() {
    // Vérifier si le modal existe déjà
    let modal = document.getElementById('confirm-modal');
    
    // Créer le modal s'il n'existe pas
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'confirm-modal';
      modal.className = 'modal confirm-modal';
      
      // Ajouter le contenu du modal
      modal.innerHTML = `
        <div class="modal-content">
          <div class="modal-header">
            <h3 id="confirm-modal-title">Confirmation</h3>
            <button class="close-modal">&times;</button>
          </div>
          <div class="modal-body">
            <p id="confirm-modal-text"></p>
          </div>
          <div class="modal-footer">
            <button id="confirm-modal-cancel" class="secondary-button">Annuler</button>
            <button id="confirm-modal-confirm" class="primary-button">Confirmer</button>
          </div>
        </div>
      `;
      
      // Ajouter le modal au document
      document.body.appendChild(modal);
    }
    
    console.log("Modal de confirmation initialisé");
  }
  
  /**
   * Configure les écouteurs d'événements pour les éléments d'interface
   */
  function setupUIEventListeners() {
    // Écouteurs pour les boutons de navigation
    document.addEventListener('click', function(event) {
      // Boutons de navigation
      if (event.target.classList.contains('nav-link') || 
          event.target.closest('.nav-link')) {
        
        const navLink = event.target.classList.contains('nav-link') ? 
                        event.target : 
                        event.target.closest('.nav-link');
        
        const screen = navLink.dataset.screen;
        
        if (screen && MonHistoire.modules.core.navigation) {
          event.preventDefault();
          MonHistoire.modules.core.navigation.navigateTo(screen);
        }
      }
      
      // Bouton de déconnexion
      if (event.target.id === 'logout-button' || 
          event.target.closest('#logout-button')) {
        event.preventDefault();
        handleLogout();
      }
      
      // Bouton de création d'histoire
      if (event.target.id === 'create-story-button' || 
          event.target.closest('#create-story-button')) {
        event.preventDefault();
        handleCreateStory();
      }
      
      // Bouton de paramètres
      if (event.target.id === 'settings-button' || 
          event.target.closest('#settings-button')) {
        event.preventDefault();
        handleSettings();
      }
    });
    
    console.log("Écouteurs d'événements UI configurés");
  }
  
  /**
   * Met à jour l'état de l'en-tête
   */
  function updateHeaderState() {
    const header = document.getElementById('app-header');
    if (!header) {
      return;
    }
    
    // Vérifier si l'utilisateur est connecté
    const isLoggedIn = MonHistoire.modules.user && 
                      MonHistoire.modules.user.auth && 
                      MonHistoire.modules.user.auth.isLoggedIn();
    
    // Mettre à jour les éléments de l'en-tête
    const loginButton = header.querySelector('#login-button');
    const registerButton = header.querySelector('#register-button');
    const logoutButton = header.querySelector('#logout-button');
    const profileSelector = header.querySelector('#profile-selector');
    const createStoryButton = header.querySelector('#create-story-button');
    const settingsButton = header.querySelector('#settings-button');
    
    if (loginButton) {
      loginButton.classList.toggle('hidden', isLoggedIn);
    }
    
    if (registerButton) {
      registerButton.classList.toggle('hidden', isLoggedIn);
    }
    
    if (logoutButton) {
      logoutButton.classList.toggle('hidden', !isLoggedIn);
    }
    
    if (profileSelector) {
      profileSelector.classList.toggle('hidden', !isLoggedIn);
      
      // Mettre à jour le sélecteur de profil
      if (isLoggedIn && MonHistoire.modules.user && MonHistoire.modules.user.profiles) {
        updateProfileSelector();
      }
    }
    
    if (createStoryButton) {
      createStoryButton.classList.toggle('hidden', !isLoggedIn || !currentProfile);
    }
    
    if (settingsButton) {
      settingsButton.classList.toggle('hidden', !isLoggedIn);
    }
  }
  
  /**
   * Met à jour l'état du pied de page
   */
  function updateFooterState() {
    const footer = document.getElementById('app-footer');
    if (!footer) {
      return;
    }
    
    // Mettre à jour le pied de page
    const currentYear = new Date().getFullYear();
    const copyright = footer.querySelector('.copyright');
    
    if (copyright) {
      copyright.textContent = `© ${currentYear} Mon Histoire. Tous droits réservés.`;
    }
  }
  
  /**
   * Met à jour le sélecteur de profil
   */
  function updateProfileSelector() {
    const profileSelector = document.getElementById('profile-selector');
    if (!profileSelector) {
      return;
    }
    
    // Récupérer les profils
    MonHistoire.modules.user.profiles.getProfiles()
      .then(profiles => {
        // Vider le sélecteur
        profileSelector.innerHTML = '';
        
        // Ajouter l'option de création de profil
        const createOption = document.createElement('option');
        createOption.value = 'create';
        createOption.textContent = '+ Créer un profil';
        profileSelector.appendChild(createOption);
        
        // Ajouter les profils
        profiles.forEach(profile => {
          const option = document.createElement('option');
          option.value = profile.id;
          option.textContent = profile.name;
          
          if (currentProfile && profile.id === currentProfile.id) {
            option.selected = true;
          }
          
          profileSelector.appendChild(option);
        });
        
        // Ajouter l'écouteur d'événement
        profileSelector.addEventListener('change', handleProfileChange);
      })
      .catch(error => {
        console.error("Erreur lors de la récupération des profils:", error);
      });
  }
  
  /**
   * Gère les changements d'état d'authentification
   * @param {Object} user - Utilisateur authentifié ou null
   */
  function handleAuthStateChange(user) {
    // Mettre à jour l'interface utilisateur
    updateHeaderState();
    
    if (user) {
      console.log(`Utilisateur connecté: ${user.email}`);
      
      // Vérifier si un profil est sélectionné
      if (MonHistoire.modules.user && MonHistoire.modules.user.profiles) {
        MonHistoire.modules.user.profiles.getCurrentProfile()
          .then(profile => {
            if (profile) {
              currentProfile = profile;
              
              // Émettre un événement pour informer que le profil est sélectionné
              if (MonHistoire.events) {
                MonHistoire.events.emit('profileSelected', profile);
              }
            } else {
              // Naviguer vers la sélection de profil
              if (MonHistoire.modules.core && MonHistoire.modules.core.navigation) {
                const screens = MonHistoire.modules.core.navigation.getScreens();
                MonHistoire.modules.core.navigation.navigateTo(screens.PROFILE_SELECTION);
              }
            }
          })
          .catch(error => {
            console.error("Erreur lors de la récupération du profil:", error);
          });
      }
    } else {
      console.log("Utilisateur déconnecté");
      
      // Réinitialiser le profil courant
      currentProfile = null;
      
      // Naviguer vers l'écran de connexion
      if (MonHistoire.modules.core && MonHistoire.modules.core.navigation) {
        const screens = MonHistoire.modules.core.navigation.getScreens();
        MonHistoire.modules.core.navigation.navigateTo(screens.LOGIN);
      }
    }
  }
  
  /**
   * Gère la sélection d'un profil
   * @param {Object} profile - Profil sélectionné
   */
  function handleProfileSelected(profile) {
    currentProfile = profile;
    
    // Mettre à jour l'interface utilisateur
    updateHeaderState();
    
    console.log(`Profil sélectionné: ${profile.name}`);
  }
  
  /**
   * Gère la création d'un profil
   * @param {Object} profile - Profil créé
   */
  function handleProfileCreated(profile) {
    // Mettre à jour le sélecteur de profil
    updateProfileSelector();
    
    console.log(`Profil créé: ${profile.name}`);
  }
  
  /**
   * Gère la mise à jour d'un profil
   * @param {Object} profile - Profil mis à jour
   */
  function handleProfileUpdated(profile) {
    // Mettre à jour le profil courant si nécessaire
    if (currentProfile && profile.id === currentProfile.id) {
      currentProfile = profile;
    }
    
    // Mettre à jour le sélecteur de profil
    updateProfileSelector();
    
    console.log(`Profil mis à jour: ${profile.name}`);
  }
  
  /**
   * Gère la suppression d'un profil
   * @param {string} profileId - ID du profil supprimé
   */
  function handleProfileDeleted(profileId) {
    // Réinitialiser le profil courant si nécessaire
    if (currentProfile && profileId === currentProfile.id) {
      currentProfile = null;
    }
    
    // Mettre à jour le sélecteur de profil
    updateProfileSelector();
    
    console.log(`Profil supprimé: ${profileId}`);
  }
  
  /**
   * Gère le changement de profil
   * @param {Event} event - Événement de changement
   */
  function handleProfileChange(event) {
    const profileId = event.target.value;
    
    if (profileId === 'create') {
      // Naviguer vers la création de profil
      if (MonHistoire.modules.core && MonHistoire.modules.core.navigation) {
        const screens = MonHistoire.modules.core.navigation.getScreens();
        MonHistoire.modules.core.navigation.navigateTo(screens.PROFILE_CREATION);
      }
    } else {
      // Sélectionner le profil
      if (MonHistoire.modules.user && MonHistoire.modules.user.profiles) {
        MonHistoire.modules.user.profiles.selectProfile(profileId)
          .then(profile => {
            currentProfile = profile;
            
            // Émettre un événement pour informer que le profil est sélectionné
            if (MonHistoire.events) {
              MonHistoire.events.emit('profileSelected', profile);
            }
          })
          .catch(error => {
            console.error("Erreur lors de la sélection du profil:", error);
          });
      }
    }
  }
  
  /**
   * Gère la création d'une histoire
   * @param {Object} story - Histoire créée
   */
  function handleStoryCreated(story) {
    console.log(`Histoire créée: ${story.title}`);
    
    // Afficher un message de succès
    if (MonHistoire.showSuccess) {
      MonHistoire.showSuccess(`L'histoire "${story.title}" a été créée avec succès.`);
    }
  }
  
  /**
   * Gère la mise à jour d'une histoire
   * @param {Object} story - Histoire mise à jour
   */
  function handleStoryUpdated(story) {
    console.log(`Histoire mise à jour: ${story.title}`);
    
    // Afficher un message de succès
    if (MonHistoire.showSuccess) {
      MonHistoire.showSuccess(`L'histoire "${story.title}" a été mise à jour avec succès.`);
    }
  }
  
  /**
   * Gère la suppression d'une histoire
   * @param {string} storyId - ID de l'histoire supprimée
   */
  function handleStoryDeleted(storyId) {
    console.log(`Histoire supprimée: ${storyId}`);
    
    // Afficher un message de succès
    if (MonHistoire.showSuccess) {
      MonHistoire.showSuccess(`L'histoire a été supprimée avec succès.`);
    }
  }
  
  /**
   * Gère l'affichage d'une histoire
   * @param {Object} story - Histoire affichée
   */
  function handleStoryViewed(story) {
    console.log(`Histoire affichée: ${story.title}`);
  }
  
  /**
   * Gère le changement d'écran
   * @param {Object} data - Données de changement d'écran
   */
  function handleScreenChanged(data) {
    currentScreen = data.screen;
    
    console.log(`Écran changé: ${data.screen}`);
  }
  
  /**
   * Gère le changement de configuration
   * @param {Object} data - Données de changement de configuration
   */
  function handleConfigChanged(data) {
    console.log(`Configuration changée: ${data.section}.${data.key} = ${data.value}`);
    
    // Appliquer les changements de configuration
    if (data.section === 'ui' && data.key === 'theme') {
      applyTheme(data.value);
    }
  }
  
  /**
   * Gère l'acceptation des cookies
   * @param {Object} preferences - Préférences de cookies
   */
  function handleCookiesAccepted(preferences) {
    console.log("Cookies acceptés:", preferences);
    
    // Activer les fonctionnalités en fonction des préférences
    if (preferences.analytics && MonHistoire.modules.core && MonHistoire.modules.core.config) {
      MonHistoire.modules.core.config.setFeatureEnabled('analytics', true);
    }
  }
  
  /**
   * Gère la déconnexion
   */
  function handleLogout() {
    // Demander confirmation
    if (MonHistoire.showConfirmModal) {
      MonHistoire.showConfirmModal("Êtes-vous sûr de vouloir vous déconnecter ?")
        .then(confirmed => {
          if (confirmed && MonHistoire.modules.user && MonHistoire.modules.user.auth) {
            MonHistoire.modules.user.auth.logout()
              .then(() => {
                console.log("Déconnexion réussie");
              })
              .catch(error => {
                console.error("Erreur lors de la déconnexion:", error);
                
                if (MonHistoire.showError) {
                  MonHistoire.showError("Une erreur est survenue lors de la déconnexion.");
                }
              });
          }
        });
    } else if (confirm("Êtes-vous sûr de vouloir vous déconnecter ?")) {
      if (MonHistoire.modules.user && MonHistoire.modules.user.auth) {
        MonHistoire.modules.user.auth.logout()
          .then(() => {
            console.log("Déconnexion réussie");
          })
          .catch(error => {
            console.error("Erreur lors de la déconnexion:", error);
            alert("Une erreur est survenue lors de la déconnexion.");
          });
      }
    }
  }
  
  /**
   * Gère la création d'une histoire
   */
  function handleCreateStory() {
    // Vérifier si un profil est sélectionné
    if (!currentProfile) {
      if (MonHistoire.showWarning) {
        MonHistoire.showWarning("Veuillez sélectionner un profil pour créer une histoire.");
      }
      return;
    }
    
    // Naviguer vers la création d'histoire
    if (MonHistoire.modules.core && MonHistoire.modules.core.navigation) {
      const screens = MonHistoire.modules.core.navigation.getScreens();
      MonHistoire.modules.core.navigation.navigateTo(screens.STORY_CREATION);
    }
  }
  
  /**
   * Gère l'accès aux paramètres
   */
  function handleSettings() {
    // Naviguer vers les paramètres
    if (MonHistoire.modules.core && MonHistoire.modules.core.navigation) {
      const screens = MonHistoire.modules.core.navigation.getScreens();
      MonHistoire.modules.core.navigation.navigateTo(screens.SETTINGS);
    }
  }
  
  /**
   * Applique un thème
   * @param {string} theme - Thème à appliquer ('light', 'dark', 'auto')
   */
  function applyTheme(theme) {
    // Déterminer le thème à appliquer
    let appliedTheme = theme;
    
    if (theme === 'auto') {
      // Utiliser les préférences du système
      appliedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    
    // Appliquer le thème
    document.documentElement.setAttribute('data-theme', appliedTheme);
    
    console.log(`Thème appliqué: ${appliedTheme}`);
  }
  
  /**
   * Obtient le profil actuellement sélectionné
   * @returns {Object} Profil sélectionné ou null
   */
  function getCurrentProfile() {
    return currentProfile;
  }
  
  /**
   * Obtient l'écran actuellement affiché
   * @returns {string} Écran affiché ou null
   */
  function getCurrentScreen() {
    return currentScreen;
  }
  
  // API publique
  MonHistoire.modules.app = {
    init: init,
    getCurrentProfile: getCurrentProfile,
    getCurrentScreen: getCurrentScreen,
    
    // Fonction pour fermer le modal de message
    closeMessageModal: function() {
      const modal = document.getElementById('message-modal');
      if (modal) {
        modal.classList.remove('show');
      }
    }
  };
})();
