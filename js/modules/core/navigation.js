// js/modules/core/navigation.js
// Module de navigation
// Responsable de la gestion de la navigation entre les différentes sections de l'application

// S'assurer que les namespaces existent
window.MonHistoire = window.MonHistoire || {};
MonHistoire.modules = MonHistoire.modules || {};
MonHistoire.modules.core = MonHistoire.modules.core || {};

// Module de navigation
(function() {
  // Variables privées
  let isInitialized = false;
  let currentScreen = null;
  let previousScreen = null;
  let screenHistory = [];
  let maxHistoryLength = 10;
  
  // Constantes
  const SCREENS = {
    HOME: 'accueil',
    LOGIN: 'connexion',
    REGISTER: 'inscription',
    PROFILE_SELECTION: 'selection-profil',
    PROFILE_CREATION: 'creation-profil',
    STORY_CREATION: 'formulaire',
    STORY_LIST: 'mes-histoires',
    STORY_DISPLAY: 'resultat',
    SETTINGS: 'parametres',
    SHARING: 'partage',
    ABOUT: 'a-propos'
  };
  
  /**
   * Initialise le module de navigation
   */
  function init() {
    if (isInitialized) {
      console.warn("Module Navigation déjà initialisé");
      return;
    }
    
    // Configurer les écouteurs d'événements
    setupListeners();
    
    // Déterminer l'écran initial
    determineInitialScreen();
    
    isInitialized = true;
    console.log("Module Navigation initialisé");
  }
  
  /**
   * Configure les écouteurs d'événements
   */
  function setupListeners() {
    // Écouteurs pour les liens de navigation
    document.addEventListener('click', function(event) {
      // Vérifier si l'élément cliqué est un lien de navigation
      if (event.target.classList.contains('nav-link') || 
          event.target.closest('.nav-link')) {
        
        const navLink = event.target.classList.contains('nav-link') ? 
                        event.target : 
                        event.target.closest('.nav-link');
        
        const screen = navLink.dataset.screen;
        
        if (screen) {
          event.preventDefault();
          navigateTo(screen);
        }
      }
    });
    
    // Écouteur pour les changements d'état d'authentification
    if (MonHistoire.events) {
      MonHistoire.events.on('authStateChange', handleAuthStateChange);
      MonHistoire.events.on('profileSelected', handleProfileSelected);
      MonHistoire.events.on('storyViewed', handleStoryViewed);
    }
    
    // Écouteur pour les boutons de retour
    document.addEventListener('click', function(event) {
      if (event.target.classList.contains('back-button') || 
          event.target.closest('.back-button')) {
        event.preventDefault();
        goBack();
      }
    });
    
    // Écouteur pour l'événement popstate (navigation du navigateur)
    window.addEventListener('popstate', function(event) {
      if (event.state && event.state.screen) {
        showScreen(event.state.screen, false);
      }
    });
    
    console.log("Écouteurs configurés");
  }
  
  /**
   * Détermine l'écran initial à afficher
   */
  function determineInitialScreen() {
    // Vérifier si un écran est spécifié dans l'URL
    const urlParams = new URLSearchParams(window.location.search);
    const screenParam = urlParams.get('screen');
    
    if (screenParam && Object.values(SCREENS).includes(screenParam)) {
      navigateTo(screenParam, false);
      return;
    }
    
    // Par défaut, toujours afficher l'écran d'accueil en premier
    navigateTo(SCREENS.HOME, false);
    
    // Vérification de l'authentification en arrière-plan (ne change pas l'écran initial)
    if (MonHistoire.modules.user && MonHistoire.modules.user.auth) {
      try {
        const currentUser = MonHistoire.modules.user.auth.getCurrentUser();
        
        // Si l'utilisateur est connecté, vérifier le profil mais ne pas rediriger
        if (currentUser && MonHistoire.modules.user && MonHistoire.modules.user.profiles) {
          MonHistoire.modules.user.profiles.getCurrentProfile();
        }
      } catch (error) {
        console.warn("Erreur lors de la vérification de l'authentification:", error);
      }
    }
  }
  
  /**
   * Gère les changements d'état d'authentification
   * @param {Object} user - Utilisateur authentifié ou null
   */
  function handleAuthStateChange(user) {
    if (user) {
      // Utilisateur connecté
      if (currentScreen === SCREENS.LOGIN || currentScreen === SCREENS.REGISTER) {
        navigateTo(SCREENS.PROFILE_SELECTION);
      }
    } else {
      // Utilisateur déconnecté
      navigateTo(SCREENS.HOME);

      // Vider l'historique
      screenHistory = [];
    }
  }
  
  /**
   * Gère la sélection d'un profil
   * @param {Object} profile - Profil sélectionné
   */
  function handleProfileSelected(profile) {
    if (profile) {
      // Profil sélectionné
      if (currentScreen === SCREENS.PROFILE_SELECTION || currentScreen === SCREENS.PROFILE_CREATION) {
        navigateTo(SCREENS.HOME);
      }
    }
  }
  
  /**
   * Gère l'affichage d'une histoire
   * @param {Object} story - Histoire affichée
   */
  function handleStoryViewed(story) {
    if (story) {
      // Histoire affichée
      navigateTo(SCREENS.STORY_DISPLAY, true, { storyId: story.id });
    }
  }
  
  /**
   * Navigue vers un écran spécifique
   * @param {string} screen - Écran à afficher
   * @param {boolean} addToHistory - Ajouter à l'historique du navigateur (par défaut: true)
   * @param {Object} params - Paramètres supplémentaires (optionnel)
   */
  function navigateTo(screen, addToHistory = true, params = {}) {
    if (!Object.values(SCREENS).includes(screen)) {
      console.error(`Écran inconnu: ${screen}`);
      return;
    }
    
    // Vérifier si l'écran nécessite une authentification
    // Seulement si Firebase est correctement initialisé
    try {
      if (requiresAuth(screen) && !isUserAuthenticated()) {
        console.log(`L'écran ${screen} nécessite une authentification, redirection vers l'écran de connexion`);
        screen = SCREENS.LOGIN;
      }
      
      // Vérifier si l'écran nécessite un profil
      if (requiresProfile(screen) && !isProfileSelected()) {
        console.log(`L'écran ${screen} nécessite un profil, redirection vers l'écran de sélection de profil`);
        screen = SCREENS.PROFILE_SELECTION;
      }
    } catch (error) {
      console.warn("Erreur lors de la vérification des conditions de navigation:", error);
      // En cas d'erreur, ne pas rediriger
    }
    
    // Sauvegarder l'écran précédent
    if (currentScreen) {
      previousScreen = currentScreen;
      
      // Ajouter à l'historique
      screenHistory.push(previousScreen);
      
      // Limiter la taille de l'historique
      if (screenHistory.length > maxHistoryLength) {
        screenHistory.shift();
      }
    }
    
    // Mettre à jour l'URL si nécessaire
    if (addToHistory) {
      const url = new URL(window.location);
      url.searchParams.set('screen', screen);
      
      // Ajouter les paramètres supplémentaires à l'URL
      for (const [key, value] of Object.entries(params)) {
        url.searchParams.set(key, value);
      }
      
      window.history.pushState({ screen, params }, '', url);
    }
    
    // Afficher le nouvel écran
    showScreen(screen, true, params);
    
    // Émettre un événement pour informer les autres modules
    if (MonHistoire.events) {
      MonHistoire.events.emit('screenChanged', { screen, params });
    }
  }
  
  /**
   * Affiche un écran spécifique
   * @param {string} screen - Écran à afficher
   * @param {boolean} animate - Animer la transition (par défaut: true)
   * @param {Object} params - Paramètres supplémentaires (optionnel)
   */
  function showScreen(screen, animate = true, params = {}) {
    // Masquer tous les écrans
    const screens = document.querySelectorAll('.screen');
    screens.forEach(s => {
      s.classList.add('hidden');
      s.classList.remove('active');
    });
    
    // Afficher l'écran demandé
    const targetScreen = document.getElementById(screen);
    if (targetScreen) {
      targetScreen.classList.remove('hidden');
      
      // Animer la transition si demandé
      if (animate) {
        // Ajouter la classe d'animation
        targetScreen.classList.add('screen-transition');
        
        // Supprimer la classe d'animation après la fin de l'animation
        setTimeout(() => {
          targetScreen.classList.remove('screen-transition');
          targetScreen.classList.add('active');
        }, 300);
      } else {
        targetScreen.classList.add('active');
      }
      
      // Mettre à jour la navigation
      updateNavigation(screen);
      
      // Mettre à jour l'écran courant
      currentScreen = screen;
      
      console.log(`Écran affiché: ${screen}`);
      
      // Appeler la fonction d'initialisation de l'écran si elle existe
      if (MonHistoire.screens && MonHistoire.screens[screen] && typeof MonHistoire.screens[screen].init === 'function') {
        MonHistoire.screens[screen].init(params);
      }
    } else {
      console.error(`Écran non trouvé: ${screen}`);
    }
  }
  
  /**
   * Met à jour la navigation
   * @param {string} screen - Écran actif
   */
  function updateNavigation(screen) {
    // Mettre à jour les liens de navigation
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
      const linkScreen = link.dataset.screen;
      
      if (linkScreen === screen) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
    
    // Mettre à jour le titre de la page
    updatePageTitle(screen);
    
    // Mettre à jour la visibilité du bouton de retour
    updateBackButton();
  }
  
  /**
   * Met à jour le titre de la page
   * @param {string} screen - Écran actif
   */
  function updatePageTitle(screen) {
    let title = 'Mon Histoire';
    
    switch (screen) {
      case SCREENS.HOME:
        title = 'Mon Histoire - Accueil';
        break;
        
      case SCREENS.LOGIN:
        title = 'Mon Histoire - Connexion';
        break;
        
      case SCREENS.REGISTER:
        title = 'Mon Histoire - Inscription';
        break;
        
      case SCREENS.PROFILE_SELECTION:
        title = 'Mon Histoire - Sélection de profil';
        break;
        
      case SCREENS.PROFILE_CREATION:
        title = 'Mon Histoire - Création de profil';
        break;
        
      case SCREENS.STORY_CREATION:
        title = 'Mon Histoire - Création d\'histoire';
        break;
        
      case SCREENS.STORY_LIST:
        title = 'Mon Histoire - Mes histoires';
        break;
        
      case SCREENS.STORY_DISPLAY:
        title = 'Mon Histoire - Lecture';
        break;
        
      case SCREENS.SETTINGS:
        title = 'Mon Histoire - Paramètres';
        break;
        
      case SCREENS.SHARING:
        title = 'Mon Histoire - Partage';
        break;
        
      case SCREENS.ABOUT:
        title = 'Mon Histoire - À propos';
        break;
    }
    
    document.title = title;
  }
  
  /**
   * Met à jour la visibilité du bouton de retour
   */
  function updateBackButton() {
    const backButton = document.getElementById('back-button');
    if (backButton) {
      if (canGoBack()) {
        backButton.classList.remove('hidden');
      } else {
        backButton.classList.add('hidden');
      }
    }
  }
  
  /**
   * Vérifie si l'écran nécessite une authentification
   * @param {string} screen - Écran à vérifier
   * @returns {boolean} True si l'écran nécessite une authentification
   */
  function requiresAuth(screen) {
    return [
      SCREENS.PROFILE_SELECTION,
      SCREENS.PROFILE_CREATION,
      SCREENS.STORY_CREATION,
      SCREENS.STORY_LIST,
      SCREENS.SETTINGS,
      SCREENS.SHARING
    ].includes(screen);
  }
  
  /**
   * Vérifie si l'écran nécessite un profil
   * @param {string} screen - Écran à vérifier
   * @returns {boolean} True si l'écran nécessite un profil
   */
  function requiresProfile(screen) {
    return [
      SCREENS.STORY_CREATION,
      SCREENS.STORY_LIST
    ].includes(screen);
  }
  
  /**
   * Vérifie si l'utilisateur est authentifié
   * @returns {boolean} True si l'utilisateur est authentifié
   */
  function isUserAuthenticated() {
    try {
      if (MonHistoire.modules.user && MonHistoire.modules.user.auth) {
        return !!MonHistoire.modules.user.auth.getCurrentUser();
      }
    } catch (error) {
      console.warn("Erreur lors de la vérification de l'authentification:", error);
    }
    
    return false;
  }
  
  /**
   * Vérifie si un profil est sélectionné
   * @returns {boolean} True si un profil est sélectionné
   */
  function isProfileSelected() {
    try {
      if (MonHistoire.modules.user && MonHistoire.modules.user.profiles) {
        return !!MonHistoire.modules.user.profiles.getCurrentProfile();
      }
    } catch (error) {
      console.warn("Erreur lors de la vérification du profil:", error);
    }
    
    return false;
  }
  
  /**
   * Retourne à l'écran précédent
   */
  function goBack() {
    if (canGoBack()) {
      // Récupérer l'écran précédent
      const prevScreen = screenHistory.pop() || SCREENS.HOME;
      
      // Naviguer vers l'écran précédent
      window.history.back();
      
      // Mettre à jour l'écran courant
      currentScreen = prevScreen;
    }
  }
  
  /**
   * Vérifie s'il est possible de retourner à l'écran précédent
   * @returns {boolean} True s'il est possible de retourner à l'écran précédent
   */
  function canGoBack() {
    return screenHistory.length > 0;
  }
  
  /**
   * Obtient l'écran courant
   * @returns {string} Écran courant
   */
  function getCurrentScreen() {
    return currentScreen;
  }
  
  /**
   * Obtient l'écran précédent
   * @returns {string} Écran précédent
   */
  function getPreviousScreen() {
    return previousScreen;
  }
  
  /**
   * Obtient la liste des écrans disponibles
   * @returns {Object} Liste des écrans disponibles
   */
  function getScreens() {
    return { ...SCREENS };
  }
  
  // API publique
  MonHistoire.modules.core.navigation = {
    init: init,
    navigateTo: navigateTo,
    showScreen: showScreen,
    goBack: goBack,
    getCurrentScreen: getCurrentScreen,
    getPreviousScreen: getPreviousScreen,
    getScreens: getScreens,
    canGoBack: canGoBack
  };
})();
