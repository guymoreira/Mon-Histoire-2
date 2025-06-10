// js/features/sharing.js
// Module principal de gestion du partage d'histoires
// Ce fichier délègue la plupart des fonctionnalités aux sous-modules spécialisés

// S'assurer que les objets nécessaires existent
window.MonHistoire = window.MonHistoire || {};
MonHistoire.features = MonHistoire.features || {};

// Module de partage d'histoires
MonHistoire.features.sharing = {
  // Variables pour la gestion des notifications et du partage
  notificationTimeout: null,
  histoireAPartager: null,
  histoireNotifieeActuelle: null,
  notificationsNonLues: {},
  notificationsTraitees: new Set(),
  
  /**
   * Initialisation du module
   */
  init() {
    console.log("Module de partage d'histoires initialisé");
    
    // Initialiser les variables
    this.notificationsNonLues = {};
    this.notificationsTraitees = new Set();
    
    // Initialiser les écouteurs d'événements pour les notifications
    this.initNotificationListeners();
    
    // Initialiser les sous-modules
    this.initSubmodules();
    
    // Configurer l'écouteur de notifications en temps réel
    if (this.realtime) {
      this.realtime.configurerEcouteurNotificationsRealtime();
    }
    
    // Configurer l'écouteur d'événements pour les changements de profil
    MonHistoire.events.on("profilChange", (nouveauProfil) => {
      // Reconfigurer les écouteurs après un changement de profil
      setTimeout(() => {
        if (this.realtime) {
          this.realtime.configurerEcouteurNotificationsRealtime();
          this.realtime.configurerEcouteurHistoiresPartagees();
        }
      }, 500);
    });
  },
  
  /**
   * Initialise les sous-modules
   */
  initSubmodules() {
    // Initialiser les sous-modules s'ils existent
    if (this.realtime && this.realtime.init) {
      this.realtime.init();
    }
    
    if (this.notifications && this.notifications.init) {
      this.notifications.init();
    }
    
    if (this.storage && this.storage.init) {
      this.storage.init();
    }
    
    if (this.ui && this.ui.init) {
      this.ui.init();
    }
  },
  
  /**
   * Initialise les écouteurs d'événements pour les notifications
   */
  initNotificationListeners() {
    // Écouteur pour le clic sur la notification
    const notification = document.getElementById("notification-partage");
    if (notification) {
      notification.addEventListener("click", this.clicNotificationPartage.bind(this));
    }
  },
  
  /**
   * Gestion du clic sur la notification
   */
  clicNotificationPartage(e) {
    // Empêche la propagation du clic
    e.preventDefault();
    e.stopPropagation();
    
    // Ferme la notification
    if (this.notifications) {
      this.notifications.fermerNotificationPartage();
    }
    
    // Redirige vers "Mes histoires"
    if (MonHistoire.core && MonHistoire.core.navigation) {
      MonHistoire.core.navigation.showScreen("mes-histoires");
    }
  },
  
  /**
   * Vérifie s'il y a des histoires partagées pour l'utilisateur connecté
   */
  verifierHistoiresPartagees() {
    const user = firebase.auth().currentUser;
    if (!user) return;

    // S'assure que le profilActif est correctement initialisé
    if (!MonHistoire.state.profilActif) {
      MonHistoire.state.profilActif = localStorage.getItem("profilActif")
        ? JSON.parse(localStorage.getItem("profilActif"))
        : { type: "parent" };
    }

    try {
      // Initialise le compteur de notifications non lues pour le profil actif
      if (this.notifications) {
        this.notifications.initialiserCompteurNotifications(user);
      }
      
      // Configure l'écouteur en temps réel pour les futures histoires partagées
      if (this.realtime) {
        this.realtime.configurerEcouteurHistoiresPartagees();
      }
    } catch (error) {
      console.error("Erreur lors de la vérification des histoires partagées:", error);
    }
  },
  
  /**
   * Ouvre la modale de partage et affiche la liste des profils disponibles
   */
  async ouvrirModalePartage() {
    // Déléguer au sous-module UI si disponible
    if (this.ui && this.ui.ouvrirModalePartage) {
      return this.ui.ouvrirModalePartage();
    }
    
    // Sinon, utiliser l'implémentation par défaut
    const user = firebase.auth().currentUser;
    if (!user) {
      MonHistoire.showMessageModal("Tu dois être connecté pour partager une histoire.");
      return;
    }

    // Récupère l'histoire actuellement affichée
    if (MonHistoire.features && 
        MonHistoire.features.stories && 
        MonHistoire.features.stories.display) {
      const histoire = MonHistoire.features.stories.display.getHistoireAffichee();
      
      // Si aucune histoire n'est affichée, on ne fait rien
      if (!histoire || (!histoire.chapitre1 && !histoire.contenu)) {
        MonHistoire.showMessageModal("Aucune histoire à partager.");
        return;
      }

      // Stocke temporairement l'histoire à partager
      this.histoireAPartager = {
        ...histoire,
        partageParProfil: MonHistoire.state.profilActif.type === "parent" ? null : MonHistoire.state.profilActif.id,
        partageParPrenom: MonHistoire.state.profilActif.type === "parent" ? null : MonHistoire.state.profilActif.prenom
      };

      // Affiche la modale de partage
      const modal = document.getElementById("modal-partage");
      if (modal) {
        modal.classList.add("show");
      }
    }
  },
  
  /**
   * Ferme la modale de partage
   */
  fermerModalePartage() {
    // Déléguer au sous-module UI si disponible
    if (this.ui && this.ui.fermerModalePartage) {
      return this.ui.fermerModalePartage();
    }
    
    // Sinon, utiliser l'implémentation par défaut
    const modal = document.getElementById("modal-partage");
    if (modal) {
      modal.classList.remove("show");
    }
    this.histoireAPartager = null;
  },
  
  /**
   * Partage l'histoire avec le profil sélectionné
   */
  async partagerHistoire(type, id, prenom) {
    // Déléguer au sous-module Storage si disponible
    if (this.storage && this.storage.partagerHistoire) {
      return this.storage.partagerHistoire(type, id, prenom, this.histoireAPartager);
    }
    
    // Sinon, afficher un message d'erreur
    this.fermerModalePartage();
    MonHistoire.showMessageModal("Fonctionnalité de partage non disponible.");
  },
  
  /**
   * Traite un partage d'histoire qui a été mis en file d'attente hors ligne
   */
  async processOfflinePartage(data) {
    // Déléguer au sous-module Storage si disponible
    if (this.storage && this.storage.processOfflinePartage) {
      return this.storage.processOfflinePartage(data);
    }
    
    // Sinon, retourner false pour indiquer que le traitement a échoué
    console.error("Traitement du partage hors ligne non disponible");
    return false;
  },
  
  /**
   * Vérifie l'état de la connexion
   */
  isConnected() {
    // Déléguer au sous-module Realtime si disponible
    if (this.realtime && this.realtime.isConnected) {
      return this.realtime.isConnected();
    }
    
    // Sinon, utiliser l'implémentation par défaut
    const isNetworkConnected = navigator.onLine;
    const isFirebaseConnected = MonHistoire.state.realtimeDbConnected !== false;
    return isNetworkConnected && isFirebaseConnected && MonHistoire.state.isConnected;
  }
};

// Exporter pour utilisation dans d'autres modules
window.MonHistoire = MonHistoire;
