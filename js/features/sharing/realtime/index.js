// js/features/sharing/realtime/index.js
// Point d'entrée pour le module de gestion des écouteurs en temps réel

// S'assurer que les objets nécessaires existent
window.MonHistoire = window.MonHistoire || {};
MonHistoire.features = MonHistoire.features || {};
MonHistoire.features.sharing = MonHistoire.features.sharing || {};

// Importer les sous-modules (ils seront chargés après ce fichier)
// Les références seront disponibles via MonHistoire.features.sharing.realtime.*

/**
 * Module de gestion des écouteurs en temps réel
 * Responsable de la configuration et de la gestion des écouteurs Firebase
 */
MonHistoire.features.sharing.realtime = {
  /**
   * Initialisation du module
   */
  init() {
    console.log("Module d'écouteurs en temps réel pour le partage initialisé");
    
    // Initialiser les sous-modules
    if (this.listeners) {
      this.listeners.init();
    }
    
    if (this.notifications) {
      this.notifications.init();
    }
    
    // Configurer l'écouteur de notifications en temps réel via Firebase Realtime Database
    this.configurerEcouteurNotificationsRealtime();
  },
  
  /**
   * Configure un écouteur en temps réel pour les nouvelles histoires partagées
   * Cette fonction est appelée au démarrage et après un changement de profil
   */
  configurerEcouteurHistoiresPartagees() {
    if (this.listeners) {
      this.listeners.configurerEcouteurHistoiresPartagees();
    }
  },
  
  /**
   * Détache tous les écouteurs d'histoires partagées
   */
  detacherEcouteursHistoiresPartagees() {
    if (this.listeners) {
      this.listeners.detacherEcouteursHistoiresPartagees();
    }
  },
  
  /**
   * Configure l'écouteur de notifications en temps réel via Firebase Realtime Database
   */
  configurerEcouteurNotificationsRealtime() {
    if (this.notifications) {
      this.notifications.configurerEcouteurNotificationsRealtime();
    }
  },
  
  /**
   * Détache tous les écouteurs Realtime
   */
  detacherEcouteursRealtime() {
    if (this.notifications) {
      this.notifications.detacherEcouteursRealtime();
    }
  },
  
  /**
   * Vérifie l'état de la connexion
   * @returns {boolean} - true si l'appareil est connecté
   */
  isConnected() {
    const isNetworkConnected = navigator.onLine;
    const isFirebaseConnected = MonHistoire.state.realtimeDbConnected !== false;
    return isNetworkConnected && isFirebaseConnected && MonHistoire.state.isConnected;
  }
};
