// js/modules/core/config.js
// Module de configuration
// Responsable de la gestion des paramètres de configuration de l'application

// S'assurer que les namespaces existent
window.MonHistoire = window.MonHistoire || {};
MonHistoire.modules = MonHistoire.modules || {};
MonHistoire.modules.core = MonHistoire.modules.core || {};

// Module de configuration
(function() {
  // Variables privées
  let isInitialized = false;
  let config = {
    // Paramètres généraux
    app: {
      name: 'Mon Histoire',
      version: '1.0.0',
      environment: 'production', // 'development', 'staging', 'production'
      debug: false,
      defaultLanguage: 'fr-FR'
    },
    
    // Paramètres d'API
    api: {
      baseUrl: 'https://api.monhistoire.fr',
      timeout: 30000, // 30 secondes
      retryAttempts: 3
    },
    
    // Paramètres Firebase
    firebase: {
      apiKey: 'YOUR_API_KEY',
      authDomain: 'your-app.firebaseapp.com',
      projectId: 'your-app',
      storageBucket: 'your-app.appspot.com',
      messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
      appId: 'YOUR_APP_ID',
      measurementId: 'YOUR_MEASUREMENT_ID'
    },
    
    // Paramètres d'authentification
    auth: {
      requireEmailVerification: true,
      passwordMinLength: 8,
      sessionTimeout: 3600000, // 1 heure en millisecondes
      maxProfiles: 5 // Nombre maximum de profils par utilisateur
    },
    
    // Paramètres de stockage
    storage: {
      maxStorySize: 50000, // Taille maximale d'une histoire en caractères
      maxStoriesPerProfile: 50, // Nombre maximum d'histoires par profil
      maxImageSize: 5242880, // 5 Mo en octets
      allowedImageTypes: ['image/jpeg', 'image/png', 'image/gif']
    },
    
    // Paramètres de partage
    sharing: {
      enabled: true,
      defaultExpiration: 7, // Jours
      maxExpiration: 30, // Jours
      allowSocialSharing: true
    },
    
    // Paramètres d'interface utilisateur
    ui: {
      theme: 'light', // 'light', 'dark', 'auto'
      animationsEnabled: true,
      notificationsEnabled: true,
      notificationsDuration: 5000, // 5 secondes
      modalTransitionDuration: 300 // 300 millisecondes
    },
    
    // Paramètres de fonctionnalités
    features: {
      audioEnabled: true,
      exportEnabled: true,
      sharingEnabled: true,
      analyticsEnabled: true
    }
  };

  // Exposer la configuration globalement pour compatibilité avec l'ancien code
  MonHistoire.config = config;
  
  /**
   * Initialise le module de configuration
   * @param {Object} customConfig - Configuration personnalisée (optionnel)
   */
  function init(customConfig = {}) {
    if (isInitialized) {
      console.warn("Module Config déjà initialisé");
      return;
    }
    
    // Fusionner la configuration personnalisée avec la configuration par défaut
    mergeConfig(customConfig);
    
    // Charger la configuration depuis le stockage local si disponible
    loadFromLocalStorage();
    
    // Appliquer les paramètres d'environnement
    applyEnvironmentSettings();
    
    isInitialized = true;
    console.log("Module Config initialisé");
    
    // Émettre un événement pour informer les autres modules
    if (MonHistoire.events) {
      MonHistoire.events.emit('configLoaded', config);
    }
  }
  
  /**
   * Fusionne la configuration personnalisée avec la configuration par défaut
   * @param {Object} customConfig - Configuration personnalisée
   */
  function mergeConfig(customConfig) {
    // Fonction récursive pour fusionner les objets
    function deepMerge(target, source) {
      for (const key in source) {
        if (source.hasOwnProperty(key)) {
          if (source[key] instanceof Object && key in target) {
            deepMerge(target[key], source[key]);
          } else {
            target[key] = source[key];
          }
        }
      }
      return target;
    }
    
    // Fusionner la configuration
    config = deepMerge(config, customConfig);
  }
  
  /**
   * Charge la configuration depuis le stockage local
   */
  function loadFromLocalStorage() {
    try {
      const storedConfig = localStorage.getItem('mon-histoire-config');
      
      if (storedConfig) {
        const parsedConfig = JSON.parse(storedConfig);
        
        // Ne charger que certains paramètres depuis le stockage local
        if (parsedConfig.ui) {
          config.ui = { ...config.ui, ...parsedConfig.ui };
        }
        
        if (parsedConfig.features) {
          config.features = { ...config.features, ...parsedConfig.features };
        }
        
        console.log("Configuration chargée depuis le stockage local");
      }
    } catch (error) {
      console.error("Erreur lors du chargement de la configuration depuis le stockage local:", error);
    }
  }
  
  /**
   * Applique les paramètres spécifiques à l'environnement
   */
  function applyEnvironmentSettings() {
    const env = config.app.environment;
    
    switch (env) {
      case 'development':
        // Activer le mode debug en développement
        config.app.debug = true;
        
        // Utiliser des API locales en développement
        config.api.baseUrl = 'http://localhost:3000';
        break;
        
      case 'staging':
        // Activer le mode debug en staging
        config.app.debug = true;
        
        // Utiliser des API de staging
        config.api.baseUrl = 'https://staging-api.monhistoire.fr';
        break;
        
      case 'production':
        // Désactiver le mode debug en production
        config.app.debug = false;
        
        // Utiliser des API de production
        config.api.baseUrl = 'https://api.monhistoire.fr';
        break;
        
      default:
        console.warn(`Environnement inconnu: ${env}, utilisation des paramètres par défaut`);
    }
    
    // Appliquer les paramètres de debug
    if (config.app.debug) {
      console.log("Mode debug activé");
      
      // Activer les logs détaillés
      window.MonHistoire.debug = true;
    } else {
      window.MonHistoire.debug = false;
    }
  }
  
  /**
   * Obtient la configuration complète
   * @returns {Object} Configuration complète
   */
  function getConfig() {
    return { ...config };
  }
  
  /**
   * Obtient une section spécifique de la configuration
   * @param {string} section - Nom de la section
   * @returns {Object} Section de configuration ou null si non trouvée
   */
  function getSection(section) {
    if (config[section]) {
      return { ...config[section] };
    }
    
    return null;
  }
  
  /**
   * Obtient un paramètre spécifique de la configuration
   * @param {string} section - Nom de la section
   * @param {string} key - Nom du paramètre
   * @returns {*} Valeur du paramètre ou null si non trouvé
   */
  function get(section, key) {
    if (config[section] && config[section][key] !== undefined) {
      return config[section][key];
    }
    
    return null;
  }
  
  /**
   * Définit un paramètre spécifique de la configuration
   * @param {string} section - Nom de la section
   * @param {string} key - Nom du paramètre
   * @param {*} value - Valeur du paramètre
   * @param {boolean} persist - Sauvegarder dans le stockage local (par défaut: false)
   * @returns {boolean} True si le paramètre a été défini
   */
  function set(section, key, value, persist = false) {
    if (!config[section]) {
      console.error(`Section de configuration inconnue: ${section}`);
      return false;
    }
    
    // Mettre à jour la configuration
    config[section][key] = value;
    
    // Sauvegarder dans le stockage local si demandé
    if (persist) {
      saveToLocalStorage();
    }
    
    // Émettre un événement pour informer les autres modules
    if (MonHistoire.events) {
      MonHistoire.events.emit('configChanged', { section, key, value });
    }
    
    return true;
  }
  
  /**
   * Sauvegarde la configuration dans le stockage local
   */
  function saveToLocalStorage() {
    try {
      // Ne sauvegarder que certains paramètres dans le stockage local
      const persistConfig = {
        ui: config.ui,
        features: config.features
      };
      
      localStorage.setItem('mon-histoire-config', JSON.stringify(persistConfig));
      console.log("Configuration sauvegardée dans le stockage local");
    } catch (error) {
      console.error("Erreur lors de la sauvegarde de la configuration dans le stockage local:", error);
    }
  }
  
  /**
   * Réinitialise la configuration aux valeurs par défaut
   * @param {boolean} removeFromStorage - Supprimer du stockage local (par défaut: true)
   */
  function resetConfig(removeFromStorage = true) {
    // Réinitialiser la configuration
    config = {
      // Paramètres généraux
      app: {
        name: 'Mon Histoire',
        version: '1.0.0',
        environment: 'production',
        debug: false,
        defaultLanguage: 'fr-FR'
      },
      
      // Paramètres d'API
      api: {
        baseUrl: 'https://api.monhistoire.fr',
        timeout: 30000,
        retryAttempts: 3
      },
      
      // Paramètres Firebase
      firebase: {
        apiKey: 'YOUR_API_KEY',
        authDomain: 'your-app.firebaseapp.com',
        projectId: 'your-app',
        storageBucket: 'your-app.appspot.com',
        messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
        appId: 'YOUR_APP_ID',
        measurementId: 'YOUR_MEASUREMENT_ID'
      },
      
      // Paramètres d'authentification
      auth: {
        requireEmailVerification: true,
        passwordMinLength: 8,
        sessionTimeout: 3600000,
        maxProfiles: 5
      },
      
      // Paramètres de stockage
      storage: {
        maxStorySize: 50000,
        maxStoriesPerProfile: 50,
        maxImageSize: 5242880,
        allowedImageTypes: ['image/jpeg', 'image/png', 'image/gif']
      },
      
      // Paramètres de partage
      sharing: {
        enabled: true,
        defaultExpiration: 7,
        maxExpiration: 30,
        allowSocialSharing: true
      },
      
      // Paramètres d'interface utilisateur
      ui: {
        theme: 'light',
        animationsEnabled: true,
        notificationsEnabled: true,
        notificationsDuration: 5000,
        modalTransitionDuration: 300
      },
      
      // Paramètres de fonctionnalités
      features: {
        audioEnabled: true,
        exportEnabled: true,
        sharingEnabled: true,
        analyticsEnabled: true
      }
    };
    
    // Appliquer les paramètres d'environnement
    applyEnvironmentSettings();
    
    // Supprimer du stockage local si demandé
    if (removeFromStorage) {
      try {
        localStorage.removeItem('mon-histoire-config');
        console.log("Configuration supprimée du stockage local");
      } catch (error) {
        console.error("Erreur lors de la suppression de la configuration du stockage local:", error);
      }
    }
    
    // Émettre un événement pour informer les autres modules
    if (MonHistoire.events) {
      MonHistoire.events.emit('configReset');
    }
    
    console.log("Configuration réinitialisée");
  }
  
  /**
   * Vérifie si une fonctionnalité est activée
   * @param {string} feature - Nom de la fonctionnalité
   * @returns {boolean} True si la fonctionnalité est activée
   */
  function isFeatureEnabled(feature) {
    return !!get('features', feature + 'Enabled');
  }
  
  /**
   * Active ou désactive une fonctionnalité
   * @param {string} feature - Nom de la fonctionnalité
   * @param {boolean} enabled - État de la fonctionnalité
   * @param {boolean} persist - Sauvegarder dans le stockage local (par défaut: true)
   * @returns {boolean} True si la fonctionnalité a été modifiée
   */
  function setFeatureEnabled(feature, enabled, persist = true) {
    return set('features', feature + 'Enabled', !!enabled, persist);
  }
  
  /**
   * Obtient le thème actuel
   * @returns {string} Thème actuel ('light', 'dark')
   */
  function getTheme() {
    const theme = get('ui', 'theme');
    
    // Si le thème est 'auto', déterminer en fonction des préférences du système
    if (theme === 'auto') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    
    return theme;
  }
  
  /**
   * Définit le thème
   * @param {string} theme - Thème ('light', 'dark', 'auto')
   * @param {boolean} persist - Sauvegarder dans le stockage local (par défaut: true)
   * @returns {boolean} True si le thème a été modifié
   */
  function setTheme(theme, persist = true) {
    if (['light', 'dark', 'auto'].includes(theme)) {
      return set('ui', 'theme', theme, persist);
    }
    
    return false;
  }
  
  // API publique
  MonHistoire.modules.core.config = {
    init: init,
    getConfig: getConfig,
    getSection: getSection,
    get: get,
    set: set,
    resetConfig: resetConfig,
    isFeatureEnabled: isFeatureEnabled,
    setFeatureEnabled: setFeatureEnabled,
    getTheme: getTheme,
    setTheme: setTheme
  };
})();
