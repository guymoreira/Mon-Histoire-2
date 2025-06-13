// js/modules/user/activity.js
// Module de suivi de l'activité utilisateur
// Responsable de la journalisation des actions et des statistiques d'utilisation

// S'assurer que les namespaces existent
window.MonHistoire = window.MonHistoire || {};
MonHistoire.modules = MonHistoire.modules || {};
MonHistoire.modules.user = MonHistoire.modules.user || {};

// Module de suivi d'activité
(function() {
  // Variables privées
  let currentUser = null;
  let activityLog = [];
  let isInitialized = false;
  let sessionStartTime = null;
  
  // Constantes
  const ACTIVITY_TYPES = {
    LOGIN: 'login',
    LOGOUT: 'logout',
    CREATE_STORY: 'create_story',
    VIEW_STORY: 'view_story',
    SHARE_STORY: 'share_story',
    DELETE_STORY: 'delete_story',
    CREATE_PROFILE: 'create_profile',
    UPDATE_PROFILE: 'update_profile',
    DELETE_PROFILE: 'delete_profile',
    EXPORT_STORY: 'export_story',
    AUDIO_PLAY: 'audio_play'
  };
  
  /**
   * Initialise le module de suivi d'activité
   */
  function init() {
    if (isInitialized) {
      console.warn("Module Activity déjà initialisé");
      return;
    }
    
    // Écouter les changements d'authentification
    if (MonHistoire.events) {
      MonHistoire.events.on('authStateChange', handleAuthStateChange);
      
      // Écouter les événements d'activité
      MonHistoire.events.on('storyCreated', () => logActivity(ACTIVITY_TYPES.CREATE_STORY));
      MonHistoire.events.on('storyViewed', () => logActivity(ACTIVITY_TYPES.VIEW_STORY));
      MonHistoire.events.on('storyShared', () => logActivity(ACTIVITY_TYPES.SHARE_STORY));
      MonHistoire.events.on('storyDeleted', () => logActivity(ACTIVITY_TYPES.DELETE_STORY));
      MonHistoire.events.on('profileCreated', () => logActivity(ACTIVITY_TYPES.CREATE_PROFILE));
      MonHistoire.events.on('profileUpdated', () => logActivity(ACTIVITY_TYPES.UPDATE_PROFILE));
      MonHistoire.events.on('profileDeleted', () => logActivity(ACTIVITY_TYPES.DELETE_PROFILE));
      MonHistoire.events.on('storyExported', () => logActivity(ACTIVITY_TYPES.EXPORT_STORY));
      MonHistoire.events.on('audioPlayed', () => logActivity(ACTIVITY_TYPES.AUDIO_PLAY));
    }
    
    // Démarrer la session
    sessionStartTime = new Date();
    
    // Ajouter un écouteur pour la fermeture de la page
    window.addEventListener('beforeunload', handlePageUnload);
    
    isInitialized = true;
    console.log("Module Activity initialisé");
  }
  
  /**
   * Gère les changements d'état d'authentification
   * @param {Object} user - Utilisateur authentifié ou null
   */
  function handleAuthStateChange(user) {
    if (user && !currentUser) {
      // Connexion
      currentUser = user;
      logActivity(ACTIVITY_TYPES.LOGIN);
    } else if (!user && currentUser) {
      // Déconnexion
      logActivity(ACTIVITY_TYPES.LOGOUT);
      currentUser = null;
    }
  }
  
  /**
   * Gère la fermeture de la page
   */
  function handlePageUnload() {
    // Enregistrer la durée de la session
    if (sessionStartTime) {
      const sessionDuration = Math.floor((new Date() - sessionStartTime) / 1000); // en secondes
      saveSessionDuration(sessionDuration);
    }
    
    // Si l'utilisateur est connecté, enregistrer la déconnexion
    if (currentUser) {
      logActivity(ACTIVITY_TYPES.LOGOUT, true);
    }
  }
  
  /**
   * Enregistre une activité
   * @param {string} type - Type d'activité
   * @param {boolean} sync - Si true, l'activité est enregistrée de manière synchrone
   * @param {Object} details - Détails supplémentaires de l'activité
   */
  function logActivity(type, sync = false, details = {}) {
    if (!currentUser) {
      return;
    }
    
    const activity = {
      type: type,
      timestamp: new Date().toISOString(),
      userId: currentUser.uid,
      details: details
    };
    
    // Ajouter l'activité au journal local
    activityLog.push(activity);
    
    // Limiter la taille du journal local
    if (activityLog.length > 100) {
      activityLog.shift();
    }
    
    // Enregistrer l'activité dans la base de données
    if (MonHistoire.modules.core && MonHistoire.modules.core.storage) {
      const savePromise = MonHistoire.modules.core.storage.logActivity(activity);
      
      if (sync) {
        // Attendre que l'activité soit enregistrée
        try {
          savePromise.then(() => {
            console.log(`Activité ${type} enregistrée (sync)`);
          });
        } catch (error) {
          console.error("Erreur lors de l'enregistrement de l'activité:", error);
        }
      } else {
        // Ne pas attendre
        savePromise.then(() => {
          console.log(`Activité ${type} enregistrée`);
        }).catch(error => {
          console.error("Erreur lors de l'enregistrement de l'activité:", error);
        });
      }
    }
  }
  
  /**
   * Enregistre la durée de la session
   * @param {number} duration - Durée de la session en secondes
   */
  function saveSessionDuration(duration) {
    if (!currentUser) {
      return;
    }
    
    // Enregistrer la durée de la session dans la base de données
    if (MonHistoire.modules.core && MonHistoire.modules.core.storage) {
      MonHistoire.modules.core.storage.saveSessionDuration(currentUser.uid, duration)
        .then(() => {
          console.log(`Session de ${duration} secondes enregistrée`);
        })
        .catch(error => {
          console.error("Erreur lors de l'enregistrement de la durée de session:", error);
        });
    }
  }
  
  /**
   * Obtient les statistiques d'activité de l'utilisateur
   * @returns {Promise} Promesse résolue avec les statistiques d'activité
   */
  function getActivityStats() {
    return new Promise((resolve, reject) => {
      if (!currentUser) {
        reject(new Error("Utilisateur non connecté"));
        return;
      }
      
      // Utiliser le module de stockage pour récupérer les statistiques
      if (MonHistoire.modules.core && MonHistoire.modules.core.storage) {
        MonHistoire.modules.core.storage.getActivityStats(currentUser.uid)
          .then(resolve)
          .catch(reject);
      } else {
        reject(new Error("Module de stockage non disponible"));
      }
    });
  }
  
  /**
   * Obtient l'historique d'activité de l'utilisateur
   * @param {number} limit - Nombre maximum d'activités à récupérer
   * @returns {Promise} Promesse résolue avec l'historique d'activité
   */
  function getActivityHistory(limit = 50) {
    return new Promise((resolve, reject) => {
      if (!currentUser) {
        reject(new Error("Utilisateur non connecté"));
        return;
      }
      
      // Utiliser le module de stockage pour récupérer l'historique
      if (MonHistoire.modules.core && MonHistoire.modules.core.storage) {
        MonHistoire.modules.core.storage.getActivityHistory(currentUser.uid, limit)
          .then(resolve)
          .catch(reject);
      } else {
        reject(new Error("Module de stockage non disponible"));
      }
    });
  }
  
  /**
   * Obtient la durée totale des sessions de l'utilisateur
   * @returns {Promise} Promesse résolue avec la durée totale en secondes
   */
  function getTotalSessionDuration() {
    return new Promise((resolve, reject) => {
      if (!currentUser) {
        reject(new Error("Utilisateur non connecté"));
        return;
      }
      
      // Utiliser le module de stockage pour récupérer la durée totale
      if (MonHistoire.modules.core && MonHistoire.modules.core.storage) {
        MonHistoire.modules.core.storage.getTotalSessionDuration(currentUser.uid)
          .then(resolve)
          .catch(reject);
      } else {
        reject(new Error("Module de stockage non disponible"));
      }
    });
  }
  
  /**
   * Obtient le nombre d'histoires créées par l'utilisateur
   * @returns {Promise} Promesse résolue avec le nombre d'histoires
   */
  function getStoryCount() {
    return new Promise((resolve, reject) => {
      if (!currentUser) {
        reject(new Error("Utilisateur non connecté"));
        return;
      }
      
      // Utiliser le module de stockage pour récupérer le nombre d'histoires
      if (MonHistoire.modules.core && MonHistoire.modules.core.storage) {
        MonHistoire.modules.core.storage.getStoryCount(currentUser.uid)
          .then(resolve)
          .catch(reject);
      } else {
        reject(new Error("Module de stockage non disponible"));
      }
    });
  }
  
  /**
   * Obtient le nombre de profils créés par l'utilisateur
   * @returns {Promise} Promesse résolue avec le nombre de profils
   */
  function getProfileCount() {
    return new Promise((resolve, reject) => {
      if (!currentUser) {
        reject(new Error("Utilisateur non connecté"));
        return;
      }
      
      // Utiliser le module de stockage pour récupérer le nombre de profils
      if (MonHistoire.modules.core && MonHistoire.modules.core.storage) {
        MonHistoire.modules.core.storage.getProfileCount(currentUser.uid)
          .then(resolve)
          .catch(reject);
      } else {
        reject(new Error("Module de stockage non disponible"));
      }
    });
  }
  
  /**
   * Obtient les types d'activité disponibles
   * @returns {Object} Types d'activité
   */
  function getActivityTypes() {
    return { ...ACTIVITY_TYPES };
  }
  
  // API publique
  MonHistoire.modules.user.activity = {
    init: init,
    logActivity: logActivity,
    getActivityStats: getActivityStats,
    getActivityHistory: getActivityHistory,
    getTotalSessionDuration: getTotalSessionDuration,
    getStoryCount: getStoryCount,
    getProfileCount: getProfileCount,
    getActivityTypes: getActivityTypes
  };
})();
