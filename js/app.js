// js/app.js
// Point d'entrée principal de l'application

// S'assurer que l'objet global existe
window.MonHistoire = window.MonHistoire || {};

// État global de l'application
MonHistoire.state = {
  // Navigation
  currentScreen: "accueil",
  previousScreen: null,
  
  // Gestion des histoires
  resultatSource: "formulaire",
  
  // Lecture audio
  lectureAudioEnCours: false,
  syntheseVocale: null,
  pauseAudio: false,
  
  // Profil actif (parent ou enfant)
  profilActif: localStorage.getItem("profilActif")
    ? JSON.parse(localStorage.getItem("profilActif"))
    : { type: "parent" },
    
  // Écouteur d'histoires partagées
  histoiresPartageesListener: null,
  
  // Gestion des profils enfants
  profilsEnfantModifies: [],
  idProfilEnfantActif: null,
  
  // État de la connexion
  isConnected: navigator.onLine,
  realtimeDbConnected: null, // État de connexion à Firebase Realtime Database
  realtimeDbAvailable: null, // Disponibilité de Firebase Realtime Database
  
  // File d'attente des opérations hors ligne
  offlineOperations: []
};

// Système d'événements pour la communication entre modules
MonHistoire.events = {
  listeners: {},
  
  // Ajouter un écouteur d'événement
  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  },
  
  // Déclencher un événement
  emit(event, data) {
    if (!this.listeners[event]) return;
    this.listeners[event].forEach(callback => callback(data));
  }
};

// Fonction pour générer un ID unique pour l'appareil
MonHistoire.generateDeviceId = function() {
  // Vérifier si un ID existe déjà dans le localStorage
  let deviceId = localStorage.getItem("deviceId");
  
  // Si aucun ID n'existe, en générer un nouveau
  if (!deviceId) {
    deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15);
    localStorage.setItem("deviceId", deviceId);
  }
  
  return deviceId;
};

// Système de journalisation amélioré
MonHistoire.logger = {
  log(level, message, data = {}) {
    console.log(`[${level}] ${message}`, data);
    
    const user = firebase.auth().currentUser;
    if (!user) return;
    
    // Enregistrer dans Firestore uniquement les événements importants
    if (level === 'ERROR' || level === 'WARNING') {
      firebase.firestore().collection("users").doc(user.uid)
        .collection("error_logs").add({
          level,
          message,
          data,
          timestamp: firebase.firestore.FieldValue.serverTimestamp(),
          deviceInfo: {
            userAgent: navigator.userAgent,
            deviceId: MonHistoire.generateDeviceId(),
            profilActif: MonHistoire.state.profilActif
          }
        }).catch(err => console.error("Erreur lors de l'enregistrement du log:", err));
    }
  },
  
  error(message, data = {}) {
    this.log('ERROR', message, data);
  },
  
  warning(message, data = {}) {
    this.log('WARNING', message, data);
  },
  
  info(message, data = {}) {
    this.log('INFO', message, data);
  }
};

// Gestion de la reconnexion
MonHistoire.handleReconnection = function() {
  MonHistoire.logger.info("Connexion rétablie");
  
  // Mettre à jour l'état de connexion
  MonHistoire.state.isConnected = true;
  
  // Vérifier que le profil actif est toujours valide
  if (this.core && this.core.profiles) {
    this.core.profiles.verifierExistenceProfil();
  }
  
  // Réinitialiser les écouteurs de notifications avec un délai pour s'assurer que Firebase est prêt
  if (this.features && this.features.sharing) {
    setTimeout(() => {
      this.features.sharing.verifierHistoiresPartagees();
    }, 1000);
  }
  
  // Traiter la file d'attente des opérations hors ligne
  this.processOfflineQueue();
  
  // Émettre un événement pour informer les autres modules
  if (this.events) {
    this.events.emit("connectionStateChanged", true);
  }
};

// Gestion de la déconnexion
MonHistoire.handleDisconnection = function() {
  MonHistoire.logger.warning("Connexion perdue");
  MonHistoire.state.isConnected = false;
  
  // Émettre un événement pour informer les autres modules
  if (this.events) {
    this.events.emit("connectionStateChanged", false);
  }
};

// Vérification de l'état de connexion
MonHistoire.checkConnectionState = function() {
  // Vérifier la connexion réseau
  const networkConnected = navigator.onLine;
  
  // Vérifier la connexion à Firebase
  const firebaseConnected = MonHistoire.state.realtimeDbConnected;
  
  // Mettre à jour l'état de connexion global
  const previousState = MonHistoire.state.isConnected;
  MonHistoire.state.isConnected = networkConnected && (firebaseConnected !== false);
  
  // Si l'état a changé, déclencher les actions appropriées
  if (MonHistoire.state.isConnected && !previousState) {
    MonHistoire.handleReconnection();
  } else if (!MonHistoire.state.isConnected && previousState) {
    MonHistoire.handleDisconnection();
  }
  
  return MonHistoire.state.isConnected;
};

// Traitement de la file d'attente des opérations hors ligne
MonHistoire.processOfflineQueue = function() {
  if (!navigator.onLine || !MonHistoire.state.isConnected) return;
  
  // Charger la file d'attente depuis le localStorage
  const savedQueue = localStorage.getItem('offlineOperationsQueue');
  if (savedQueue) {
    try {
      MonHistoire.state.offlineOperations = JSON.parse(savedQueue);
    } catch (e) {
      MonHistoire.logger.error("Erreur lors du chargement de la file d'attente hors ligne", e);
      MonHistoire.state.offlineOperations = [];
      localStorage.removeItem('offlineOperationsQueue');
      return;
    }
  }
  
  if (MonHistoire.state.offlineOperations.length === 0) return;
  
  MonHistoire.logger.info(`Traitement de ${MonHistoire.state.offlineOperations.length} opérations en attente`);
  
  // Traiter chaque opération
  const processNext = () => {
    if (MonHistoire.state.offlineOperations.length === 0) {
      localStorage.removeItem('offlineOperationsQueue');
      return;
    }
    
    const item = MonHistoire.state.offlineOperations.shift();
    localStorage.setItem('offlineOperationsQueue', JSON.stringify(MonHistoire.state.offlineOperations));
    
    // Exécuter l'opération selon son type
    switch(item.operation) {
      case 'partageHistoire':
        if (MonHistoire.features && MonHistoire.features.sharing) {
          MonHistoire.features.sharing.processOfflinePartage(item.data);
        }
        break;
      // Autres types d'opérations...
    }
    
    // Traiter l'opération suivante
    setTimeout(processNext, 1000);
  };
  
  processNext();
};

// Ajouter une opération à la file d'attente hors ligne
MonHistoire.addToOfflineQueue = function(operation, data) {
  MonHistoire.state.offlineOperations.push({ 
    operation, 
    data, 
    timestamp: Date.now(),
    deviceId: this.generateDeviceId()
  });
  
  localStorage.setItem('offlineOperationsQueue', JSON.stringify(MonHistoire.state.offlineOperations));
  MonHistoire.logger.info(`Opération ${operation} ajoutée à la file d'attente hors ligne`);
};

// Initialisation de l'application
MonHistoire.init = function() {
  console.log("[DEBUG] Initialisation de l'application MonHistoire");
  
  // Initialiser Firebase
  console.log("[DEBUG] Initialisation de Firebase");
  this.config.initFirebase();
  
  // Configurer les écouteurs d'état de connexion
  window.addEventListener('online', () => {
    MonHistoire.checkConnectionState();
  });
  
  window.addEventListener('offline', () => {
    MonHistoire.state.isConnected = false;
    MonHistoire.handleDisconnection();
  });
  
  // Configurer les écouteurs d'événements pour Firebase Realtime Database
  this.events.on("realtimeDbConnected", (isConnected) => {
    MonHistoire.state.realtimeDbConnected = isConnected;
    MonHistoire.checkConnectionState();
  });
  
  this.events.on("realtimeDbAvailable", (isAvailable) => {
    MonHistoire.state.realtimeDbAvailable = isAvailable;
    MonHistoire.checkConnectionState();
  });
  
  // Configurer l'écouteur de connexion Firebase
  try {
    if (firebase.database) {
      firebase.database().ref('.info/connected').on('value', (snapshot) => {
        const isConnected = snapshot.val();
        const previousState = MonHistoire.state.isConnected;
        MonHistoire.state.isConnected = isConnected;
        
        if (isConnected && !previousState) {
          // Reconnexion
          MonHistoire.handleReconnection();
        } else if (!isConnected && previousState) {
          // Déconnexion
          MonHistoire.handleDisconnection();
        }
      });
    } else {
      console.warn("Firebase Realtime Database n'est pas disponible, utilisation du mode de détection de connexion basique");
      // Utiliser les événements online/offline du navigateur comme fallback
      window.addEventListener('online', () => {
        if (!MonHistoire.state.isConnected) {
          MonHistoire.state.isConnected = true;
          MonHistoire.handleReconnection();
        }
      });
      
      window.addEventListener('offline', () => {
        if (MonHistoire.state.isConnected) {
          MonHistoire.state.isConnected = false;
          MonHistoire.handleDisconnection();
        }
      });
    }
  } catch (error) {
    console.warn("Erreur lors de la configuration de l'écouteur de connexion Firebase:", error);
    // Utiliser les événements online/offline du navigateur comme fallback
    window.addEventListener('online', () => {
      if (!MonHistoire.state.isConnected) {
        MonHistoire.state.isConnected = true;
        MonHistoire.handleReconnection();
      }
    });
    
    window.addEventListener('offline', () => {
      if (MonHistoire.state.isConnected) {
        MonHistoire.state.isConnected = false;
        MonHistoire.handleDisconnection();
      }
    });
  }
  
// Initialiser les modules core
  console.log("[DEBUG] Initialisation des modules core");
  if (this.core && this.core.auth) {
    console.log("[DEBUG] Initialisation du module auth");
    this.core.auth.init();
  }
  if (this.core && this.core.navigation) {
    console.log("[DEBUG] Initialisation du module navigation");
    this.core.navigation.init();
  }
  if (this.core && this.core.profiles) {
    console.log("[DEBUG] Initialisation du module profiles");
    this.core.profiles.init();
  }
  if (this.core && this.core.storage) {
    console.log("[DEBUG] Initialisation du module storage");
    this.core.storage.init();
  }
  
  // Initialiser les modules features
  console.log("[DEBUG] Initialisation des modules features");
  if (this.features && this.features.stories && this.features.stories.generator) {
    console.log("[DEBUG] Initialisation du module stories.generator");
    this.features.stories.generator.init();
  }
  if (this.features && this.features.stories && this.features.stories.display) {
    console.log("[DEBUG] Initialisation du module stories.display");
    this.features.stories.display.init();
  }
  if (this.features && this.features.stories && this.features.stories.management) {
    console.log("[DEBUG] Initialisation du module stories.management");
    this.features.stories.management.init();
  }
  if (this.features && this.features.sharing) {
    console.log("[DEBUG] Initialisation du module sharing");
    this.features.sharing.init();
  }
  if (this.features && this.features.export) {
    console.log("[DEBUG] Initialisation du module export");
    this.features.export.init();
  }
  if (this.features && this.features.audio) {
    console.log("[DEBUG] Initialisation du module audio");
    this.features.audio.init();
  }
  if (this.features && this.features.cookies) {
    console.log("[DEBUG] Initialisation du module cookies");
    this.features.cookies.init();
  }
  
  // Initialiser l'interface utilisateur en dernier
  console.log("[DEBUG] Initialisation de l'interface utilisateur");
  if (this.ui) this.ui.init();
  
  // Écouteur d'authentification Firebase
  console.log("[DEBUG] Configuration de l'écouteur d'authentification Firebase");
  firebase.auth().onAuthStateChanged(function(user) {
    console.log("[DEBUG] Changement d'état d'authentification:", user ? "Connecté" : "Non connecté");
    if (user) {
      // Vérifier si une vérification d'email est en cours
      const emailVerificationPending = localStorage.getItem("emailVerificationPending");
      const newEmailAddress = localStorage.getItem("newEmailAddress");
      
      // Si l'utilisateur vient de vérifier son email
      if (emailVerificationPending === "true" && user.email === newEmailAddress) {
        // Nettoyer le localStorage
        localStorage.removeItem("emailVerificationPending");
        localStorage.removeItem("newEmailAddress");
        
        // Afficher un message de confirmation
        MonHistoire.showMessageModal(
          "Votre adresse email a été modifiée avec succès !",
          { forceTop: true }
        );
      }
      
      if (MonHistoire.core && MonHistoire.core.auth) {
        MonHistoire.core.auth.afficherUtilisateurConnecté();
      }
      if (MonHistoire.features && MonHistoire.features.stories) {
        console.log("[DEBUG] Appel à afficherHistoiresSauvegardees() après connexion");
        MonHistoire.features.stories.management.afficherHistoiresSauvegardees();
      } else {
        console.log("[DEBUG] ERREUR: Module stories non disponible pour afficher les histoires");
      }
      if (MonHistoire.ui) {
        MonHistoire.ui.bindLongPress();
      }
      // Vérifie s'il y a des histoires partagées
      if (MonHistoire.features && MonHistoire.features.sharing) {
        console.log("[DEBUG] Vérification des histoires partagées après connexion");
        // Utilise setTimeout pour s'assurer que la vérification se fait après l'initialisation complète
        setTimeout(() => {
          MonHistoire.features.sharing.verifierHistoiresPartagees();
        }, 500);
      }
    } else {
      if (MonHistoire.core && MonHistoire.core.auth) {
        MonHistoire.core.auth.afficherUtilisateurDéconnecté();
      }
      if (MonHistoire.features && MonHistoire.features.stories) {
        console.log("[DEBUG] Appel à afficherHistoiresSauvegardees() après déconnexion");
        MonHistoire.features.stories.management.afficherHistoiresSauvegardees();
      } else {
        console.log("[DEBUG] ERREUR: Module stories non disponible pour afficher les histoires");
      }
      if (MonHistoire.ui) {
        MonHistoire.ui.bindLongPress();
      }
    }
  });
};

// Fonction utilitaire pour afficher un message modal
MonHistoire.showMessageModal = function(message, options = {}) {
  // Options par défaut
  const defaults = {
    delay: 0,           // Délai avant d'afficher la modale (ms)
    duration: 0,        // Durée d'affichage automatique (0 = pas de fermeture auto)
    forceTop: false     // Force la modale à s'afficher au-dessus des autres
  };
  
  // Fusionner les options par défaut avec celles fournies
  const settings = { ...defaults, ...options };
  
  // Mettre à jour le contenu du message
  document.getElementById("message-modal-text").innerHTML = message;
  
  // Référence à la modale
  const modal = document.getElementById("message-modal");
  
  // Si on force l'affichage au-dessus des autres modales
  if (settings.forceTop) {
    // Augmenter temporairement le z-index
    const originalZIndex = modal.style.zIndex || '';
    modal.style.zIndex = '3000'; // Valeur supérieure aux autres modales
    
    // Restaurer le z-index original après l'animation
    setTimeout(() => {
      modal.style.zIndex = originalZIndex;
    }, 1000);
  }
  
  // Afficher la modale après le délai spécifié
  setTimeout(() => {
    modal.classList.add("show");
    
    // Si une durée d'affichage est spécifiée, fermer automatiquement
    if (settings.duration > 0) {
      setTimeout(() => {
        this.closeMessageModal();
      }, settings.duration);
    }
  }, settings.delay);
};

// Fonction utilitaire pour fermer un message modal
MonHistoire.closeMessageModal = function() {
  const modal = document.getElementById("message-modal");
  modal.classList.remove("show");
};

// Initialiser l'application quand le DOM est chargé
document.addEventListener('DOMContentLoaded', function() {
  // Activer le lien RGPD dans le footer
  const rgpdLink = document.getElementById('link-rgpd');
  if (rgpdLink) {
    rgpdLink.onclick = function(e) {
      e.preventDefault();
      document.getElementById('modal-rgpd').classList.add('show');
    };
  }
  
  // Vérifier l'état de connexion initial
  MonHistoire.state.isConnected = navigator.onLine;
  
  // Initialiser l'application
  MonHistoire.init();
});

// Exporter pour utilisation dans d'autres modules
window.MonHistoire = MonHistoire;
