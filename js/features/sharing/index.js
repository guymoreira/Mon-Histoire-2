// js/features/sharing/index.js
// Point d'entrée pour le module de partage d'histoires

// S'assurer que les objets nécessaires existent
window.MonHistoire = window.MonHistoire || {};
MonHistoire.features = MonHistoire.features || {};
MonHistoire.features.sharing = MonHistoire.features.sharing || {};

/**
 * Initialisation du module de partage
 * Ce fichier est responsable de charger tous les sous-modules et de les attacher au module principal
 */
(function() {
  // Référence au module principal
  const sharingModule = MonHistoire.features.sharing;
  
  // Attacher les sous-modules au module principal
  // Cela permet d'y accéder via MonHistoire.features.sharing.nomDuModule
  
  // 1. Module de notifications
  if (MonHistoire.features.sharing.notifications) {
    sharingModule.notifications = MonHistoire.features.sharing.notifications;
  }
  
  // 2. Module de stockage
  if (MonHistoire.features.sharing.storage) {
    sharingModule.storage = MonHistoire.features.sharing.storage;
  }
  
  // 3. Module d'interface utilisateur
  if (MonHistoire.features.sharing.ui) {
    sharingModule.ui = MonHistoire.features.sharing.ui;
  }
  
  // 4. Module de gestion des écouteurs en temps réel
  if (MonHistoire.features.sharing.realtime) {
    sharingModule.realtime = MonHistoire.features.sharing.realtime;
  }
  
  /**
   * Initialisation des écouteurs d'événements pour le partage
   */
  function initEventListeners() {
    // Écouteur pour le changement de profil
    MonHistoire.events.on("profilChange", (profilActif) => {
      // Réinitialiser les écouteurs de notifications
      if (sharingModule.realtime) {
        sharingModule.realtime.configurerEcouteurNotificationsRealtime();
        sharingModule.realtime.configurerEcouteurHistoiresPartagees();
      }
      
      // Vérifier s'il y a des histoires partagées pour ce profil
      const user = firebase.auth().currentUser;
      if (user && sharingModule.storage) {
        sharingModule.storage.verifierHistoiresPartageesProfilActif(user)
          .then(() => {
            // Mettre à jour l'indicateur de notification
            if (sharingModule.notifications) {
              sharingModule.notifications.mettreAJourIndicateurNotification();
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
          if (sharingModule.storage) {
            sharingModule.storage.processOfflinePartage(op.data)
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
        initNotificationsCounter(user);
      } else {
        // Réinitialiser le compteur de notifications
        sharingModule.notificationsNonLues = {};
      }
    });
  }
  
  /**
   * Initialise le compteur de notifications non lues
   * @param {Object} user - L'utilisateur Firebase actuel
   */
  function initNotificationsCounter(user) {
    // Si l'utilisateur n'est pas fourni, utiliser l'utilisateur actuel
    user = user || firebase.auth().currentUser;
    
    if (!user) return;
    
    // Initialiser le compteur de notifications
    if (sharingModule.notifications) {
      sharingModule.notifications.initialiserCompteurNotifications(user)
        .then(() => {
          // Mettre à jour l'indicateur de notification
          sharingModule.notifications.mettreAJourIndicateurNotification();
        })
        .catch(error => {
          console.error("Erreur lors de l'initialisation du compteur de notifications:", error);
        });
    }
  }
  
  // Initialiser les écouteurs d'événements
  initEventListeners();
  
  // Initialiser le compteur de notifications non lues
  initNotificationsCounter();
  
  // Initialiser le module principal
  if (typeof sharingModule.init === 'function') {
    // Attendre que le DOM soit chargé
    document.addEventListener('DOMContentLoaded', () => {
      sharingModule.init();
    });
  }
  
  console.log("Module de partage d'histoires chargé avec succès");
})();
