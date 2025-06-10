// js/features/sharing/index.js
// Point d'entrée pour le module de partage d'histoires

// S'assurer que les objets nécessaires existent
window.MonHistoire = window.MonHistoire || {};
MonHistoire.features = MonHistoire.features || {};
MonHistoire.features.sharing = MonHistoire.features.sharing || {};

// Initialisation des variables globales pour le module de partage
MonHistoire.features.sharing.histoireAPartager = null;
MonHistoire.features.sharing.histoireNotifieeActuelle = null;
MonHistoire.features.sharing.notificationTimeout = null;
MonHistoire.features.sharing.notificationSwipeStartX = 0;
MonHistoire.features.sharing.notificationSwipeStartY = 0;
MonHistoire.features.sharing.notificationsNonLues = {};
MonHistoire.features.sharing.notificationsTraitees = new Set();
MonHistoire.features.sharing.histoiresPartageesListener = [];
MonHistoire.features.sharing.realtimeListeners = [];

// Module principal de partage
MonHistoire.features.sharing.init = function() {
  console.log("Module de partage initialisé");
  
  // Initialiser les sous-modules
  if (MonHistoire.features.sharing.notifications) {
    MonHistoire.features.sharing.notifications.init();
  }
  
  if (MonHistoire.features.sharing.realtime) {
    MonHistoire.features.sharing.realtime.init();
  }
  
  if (MonHistoire.features.sharing.storage) {
    MonHistoire.features.sharing.storage.init();
  }
  
  if (MonHistoire.features.sharing.ui) {
    MonHistoire.features.sharing.ui.init();
  }
  
  // Initialiser les écouteurs d'événements
  this.initEventListeners();
  
  // Initialiser le compteur de notifications non lues
  this.initNotificationsCounter();
};

// Initialise les écouteurs d'événements pour le partage
MonHistoire.features.sharing.initEventListeners = function() {
  // Écouteur pour le bouton de partage
  const btnPartage = document.getElementById("btn-partage");
  if (btnPartage) {
    btnPartage.addEventListener("click", () => {
      if (MonHistoire.features.sharing.ui) {
        MonHistoire.features.sharing.ui.ouvrirModalePartage();
      }
    });
  }
  
  // Écouteur pour le bouton de fermeture de la modale de partage
  const btnFermerPartage = document.getElementById("btn-fermer-partage");
  if (btnFermerPartage) {
    btnFermerPartage.addEventListener("click", () => {
      if (MonHistoire.features.sharing.ui) {
        MonHistoire.features.sharing.ui.fermerModalePartage();
      }
    });
  }
  
  // Écouteur pour le changement de profil
  MonHistoire.events.on("profileChanged", (profilActif) => {
    // Réinitialiser les écouteurs de notifications
    if (MonHistoire.features.sharing.realtime) {
      MonHistoire.features.sharing.realtime.configurerEcouteurNotificationsRealtime();
    }
    
    // Vérifier s'il y a des histoires partagées pour ce profil
    const user = firebase.auth().currentUser;
    if (user && MonHistoire.features.sharing.storage) {
      MonHistoire.features.sharing.storage.verifierHistoiresPartageesProfilActif(user)
        .then(() => {
          // Mettre à jour l'indicateur de notification
          if (MonHistoire.features.sharing.notifications) {
            MonHistoire.features.sharing.notifications.mettreAJourIndicateurNotification();
          }
        })
        .catch(error => {
          console.error("Erreur lors de la vérification des histoires partagées:", error);
        });
    }
  });
  
  // Écouteur pour le traitement des opérations hors ligne
  MonHistoire.events.on("processOfflineQueue", (operations) => {
    if (!operations || !operations.length) return;
    
    // Traiter les opérations de partage d'histoire
    const partageOperations = operations.filter(op => op.type === "partageHistoire");
    if (partageOperations.length > 0) {
      console.log(`Traitement de ${partageOperations.length} opérations de partage hors ligne`);
      
      // Traiter chaque opération de partage
      partageOperations.forEach(op => {
        if (MonHistoire.features.sharing.storage) {
          MonHistoire.features.sharing.storage.processOfflinePartage(op.data)
            .then(success => {
              if (success) {
                // Marquer l'opération comme traitée
                MonHistoire.markOfflineOperationProcessed(op.id);
              }
            })
            .catch(error => {
              console.error("Erreur lors du traitement du partage hors ligne:", error);
            });
        }
      });
    }
  });
  
  // Écouteur pour la connexion/déconnexion
  firebase.auth().onAuthStateChanged(user => {
    if (user) {
      // Initialiser le compteur de notifications
      this.initNotificationsCounter(user);
    } else {
      // Réinitialiser le compteur de notifications
      MonHistoire.features.sharing.notificationsNonLues = {};
    }
  });
};

// Initialise le compteur de notifications non lues
MonHistoire.features.sharing.initNotificationsCounter = function(user) {
  // Si l'utilisateur n'est pas fourni, utiliser l'utilisateur actuel
  user = user || firebase.auth().currentUser;
  
  if (!user) return;
  
  // Initialiser le compteur de notifications
  if (MonHistoire.features.sharing.notifications) {
    MonHistoire.features.sharing.notifications.initialiserCompteurNotifications(user)
      .then(() => {
        // Mettre à jour l'indicateur de notification
        MonHistoire.features.sharing.notifications.mettreAJourIndicateurNotification();
      })
      .catch(error => {
        console.error("Erreur lors de l'initialisation du compteur de notifications:", error);
      });
  }
};

// Fonction pour partager une histoire
MonHistoire.features.sharing.partagerHistoire = function(type, id, prenom) {
  if (MonHistoire.features.sharing.ui) {
    MonHistoire.features.sharing.ui.partagerHistoire(type, id, prenom);
  }
};

// Fonction pour afficher une notification de partage
MonHistoire.features.sharing.afficherNotificationPartage = function(prenomPartageur, histoireRef) {
  if (MonHistoire.features.sharing.notifications) {
    MonHistoire.features.sharing.notifications.afficherNotificationPartage(prenomPartageur, histoireRef);
  }
};

// Fonction pour fermer une notification de partage
MonHistoire.features.sharing.fermerNotificationPartage = function(marquerCommeVue = true) {
  if (MonHistoire.features.sharing.notifications) {
    MonHistoire.features.sharing.notifications.fermerNotificationPartage(marquerCommeVue);
  }
};

// Fonction pour mettre à jour l'indicateur de notification
MonHistoire.features.sharing.mettreAJourIndicateurNotification = function() {
  if (MonHistoire.features.sharing.notifications) {
    MonHistoire.features.sharing.notifications.mettreAJourIndicateurNotification();
  }
};

// Fonction pour configurer les écouteurs en temps réel
MonHistoire.features.sharing.configurerEcouteurNotificationsRealtime = function() {
  if (MonHistoire.features.sharing.realtime) {
    MonHistoire.features.sharing.realtime.configurerEcouteurNotificationsRealtime();
  }
};

// Fonction pour configurer les écouteurs d'histoires partagées
MonHistoire.features.sharing.configurerEcouteurHistoiresPartagees = function() {
  if (MonHistoire.features.sharing.realtime) {
    MonHistoire.features.sharing.realtime.configurerEcouteurHistoiresPartagees();
  }
};

// Fonction pour vérifier les histoires partagées pour le profil actif
MonHistoire.features.sharing.verifierHistoiresPartageesProfilActif = function(user) {
  if (MonHistoire.features.sharing.storage) {
    return MonHistoire.features.sharing.storage.verifierHistoiresPartageesProfilActif(user);
  }
  return Promise.resolve();
};

// Fonction pour traiter un partage d'histoire hors ligne
MonHistoire.features.sharing.processOfflinePartage = function(data) {
  if (MonHistoire.features.sharing.storage) {
    return MonHistoire.features.sharing.storage.processOfflinePartage(data);
  }
  return Promise.resolve(false);
};

// Fonction pour ouvrir la modale de partage
MonHistoire.features.sharing.ouvrirModalePartage = function() {
  if (MonHistoire.features.sharing.ui) {
    MonHistoire.features.sharing.ui.ouvrirModalePartage();
  }
};

// Fonction pour fermer la modale de partage
MonHistoire.features.sharing.fermerModalePartage = function() {
  if (MonHistoire.features.sharing.ui) {
    MonHistoire.features.sharing.ui.fermerModalePartage();
  }
};
