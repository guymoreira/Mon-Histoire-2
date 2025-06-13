// js/modules/sharing/index.js
// Module principal de gestion du partage d'histoires
// Ce fichier délègue la plupart des fonctionnalités aux sous-modules spécialisés

// S'assurer que les namespaces existent
window.MonHistoire = window.MonHistoire || {};
MonHistoire.modules = MonHistoire.modules || {};
MonHistoire.modules.sharing = MonHistoire.modules.sharing || {};

// Module de partage d'histoires
(function() {
  // Variables privées pour la gestion des notifications et du partage
  let notificationTimeout = null;
  let histoireAPartager = null;
  let histoireNotifieeActuelle = null;
  let notificationsNonLues = {};
  let notificationsTraitees = new Set();
  
  /**
   * Initialisation du module
   */
  function init() {
    try {
      if (MonHistoire.logger) {
        MonHistoire.logger.sharingInfo("Module de partage d'histoires initialisé");
      } else {
        console.log("Module de partage d'histoires initialisé");
      }
      
      // Initialiser les variables
      notificationsNonLues = notificationsNonLues || {};
      notificationsTraitees = notificationsTraitees || new Set();
      
      // Initialiser les écouteurs d'événements pour les notifications
      initNotificationListeners();
      
      // Initialiser les sous-modules
      initSubmodules();
      
      // Attendre un court instant pour s'assurer que Firebase est prêt
      setTimeout(() => {
        try {
          // Configurer l'écouteur de notifications en temps réel
          if (MonHistoire.modules.sharing.realtime) {
            if (typeof MonHistoire.modules.sharing.realtime.configurerEcouteurNotificationsRealtime === 'function') {
              MonHistoire.modules.sharing.realtime.configurerEcouteurNotificationsRealtime();
            }
            
            if (typeof MonHistoire.modules.sharing.realtime.configurerEcouteurHistoiresPartagees === 'function') {
              MonHistoire.modules.sharing.realtime.configurerEcouteurHistoiresPartagees();
            }
          }
        } catch (error) {
          if (MonHistoire.logger) {
            MonHistoire.logger.sharingError("Erreur lors de la configuration des écouteurs de notifications", error);
          } else {
            console.error("Erreur lors de la configuration des écouteurs de notifications:", error);
          }
        }
      }, 1000);
      
      // Configurer l'écouteur d'événements pour les changements de profil
      registerProfilChangeListener();
    } catch (error) {
      if (MonHistoire.logger) {
        MonHistoire.logger.sharingError("Erreur lors de l'initialisation du module de partage", error);
      } else {
        console.error("Erreur lors de l'initialisation du module de partage:", error);
      }
    }
  }
  
  /**
   * Enregistre l'écouteur de changement de profil.
   * Réessaie toutes les 200 ms jusqu'à 5 tentatives si MonHistoire.events n'est pas disponible.
   */
  function registerProfilChangeListener(compteur = 0) {
    // Définir le gestionnaire d'événements
    const handler = (nouveauProfil) => {
      try {
        if (MonHistoire.logger) {
          MonHistoire.logger.sharingInfo("Changement de profil détecté dans le module principal", {
            profilType: nouveauProfil ? nouveauProfil.type : "inconnu"
          });
        } else {
          console.log(
            "Changement de profil détecté dans le module principal:",
            nouveauProfil ? nouveauProfil.type : "inconnu"
          );
        }
        
        // Reconfigurer les écouteurs après un changement de profil
        setTimeout(() => {
          try {
            if (MonHistoire.modules.sharing.realtime) {
              if (typeof MonHistoire.modules.sharing.realtime.configurerEcouteurNotificationsRealtime === 'function') {
                MonHistoire.modules.sharing.realtime.configurerEcouteurNotificationsRealtime();
              }
              
              if (typeof MonHistoire.modules.sharing.realtime.configurerEcouteurHistoiresPartagees === 'function') {
                MonHistoire.modules.sharing.realtime.configurerEcouteurHistoiresPartagees();
              }
            }
            
            // Mettre à jour les indicateurs de notification
            if (MonHistoire.modules.sharing.notifications) {
              MonHistoire.modules.sharing.notifications.mettreAJourIndicateurNotification();
              MonHistoire.modules.sharing.notifications.mettreAJourIndicateurNotificationProfilsListe();
            }
            
            // Vérifier s'il y a des histoires partagées pour ce profil
            verifierHistoiresPartagees();
          } catch (error) {
            if (MonHistoire.logger) {
              MonHistoire.logger.sharingError("Erreur lors de la reconfiguration des écouteurs après changement de profil", error);
            } else {
              console.error("Erreur lors de la reconfiguration des écouteurs après changement de profil:", error);
            }
          }
        }, 1000);
      } catch (error) {
        if (MonHistoire.logger) {
          MonHistoire.logger.sharingError("Erreur dans l'écouteur de changement de profil", error);
        } else {
          console.error("Erreur dans l'écouteur de changement de profil:", error);
        }
      }
    };
    
    // Vérifier la disponibilité du système d'événements
    if (!MonHistoire.events || typeof MonHistoire.events.on !== 'function') {
      if (MonHistoire.common && typeof MonHistoire.common.waitForEvents === 'function') {
        // Utiliser la fonction utilitaire pour attendre que MonHistoire.events soit disponible
        if (MonHistoire.logger) {
          MonHistoire.logger.sharingInfo("Attente du système d'événements pour l'écouteur de changement de profil", {
            waitMethod: "waitForEvents",
            maxAttempts: 10
          });
        }
        
        MonHistoire.common.waitForEvents(() => {
          MonHistoire.events.on("profilChange", handler);
          
          if (MonHistoire.logger) {
            MonHistoire.logger.sharingInfo("Écouteur de changement de profil initialisé avec succès après attente");
          }
        }, 10);
      } else {
        // Fallback si MonHistoire.common n'est pas disponible
        if (compteur < 5) {
          setTimeout(() => registerProfilChangeListener(compteur + 1), 200);
          
          if (MonHistoire.logger) {
            MonHistoire.logger.sharingInfo("Système d'événements non disponible, nouvelle tentative programmée", {
              attempt: compteur + 1,
              maxAttempts: 5,
              delay: 200
            });
          } else {
            console.warn("Système d'événements non disponible pour l'écouteur de changement de profil");
          }
        } else {
          if (MonHistoire.logger) {
            MonHistoire.logger.sharingError("Système d'événements non disponible pour l'écouteur de changement de profil après plusieurs tentatives", {
              attempts: compteur,
              maxAttempts: 5
            });
          } else {
            console.error(
              "Système d'événements non disponible pour l'écouteur de changement de profil"
            );
          }
        }
      }
      return;
    }
    
    // Si le système d'événements est disponible, enregistrer l'écouteur directement
    MonHistoire.events.on("profilChange", handler);
    
    if (MonHistoire.logger) {
      MonHistoire.logger.sharingInfo("Écouteur de changement de profil initialisé avec succès");
    }
  }
  
  /**
   * Initialise les sous-modules
   */
  function initSubmodules() {
    try {
      // Initialiser les sous-modules dans un ordre spécifique pour respecter les dépendances
      
      // 1. Storage (pas de dépendances)
      if (MonHistoire.modules.sharing.storage && typeof MonHistoire.modules.sharing.storage.init === 'function') {
        if (MonHistoire.logger) {
          MonHistoire.logger.sharingInfo("Initialisation du sous-module storage");
        } else {
          console.log("Initialisation du sous-module storage");
        }
        MonHistoire.modules.sharing.storage.init();
      }
      
      // 2. UI (dépend de storage)
      if (MonHistoire.modules.sharing.ui && typeof MonHistoire.modules.sharing.ui.init === 'function') {
        if (MonHistoire.logger) {
          MonHistoire.logger.sharingInfo("Initialisation du sous-module ui");
        } else {
          console.log("Initialisation du sous-module ui");
        }
        MonHistoire.modules.sharing.ui.init();
      }
      
      // 3. Notifications (dépend de ui)
      if (MonHistoire.modules.sharing.notifications && typeof MonHistoire.modules.sharing.notifications.init === 'function') {
        if (MonHistoire.logger) {
          MonHistoire.logger.sharingInfo("Initialisation du sous-module notifications");
        } else {
          console.log("Initialisation du sous-module notifications");
        }
        MonHistoire.modules.sharing.notifications.init();
      }
      
      // 4. Realtime (dépend de notifications)
      if (MonHistoire.modules.sharing.realtime && typeof MonHistoire.modules.sharing.realtime.init === 'function') {
        if (MonHistoire.logger) {
          MonHistoire.logger.sharingInfo("Initialisation du sous-module realtime");
        } else {
          console.log("Initialisation du sous-module realtime");
        }
        MonHistoire.modules.sharing.realtime.init();
      }
      
      if (MonHistoire.logger) {
        MonHistoire.logger.sharingInfo("Tous les sous-modules de partage ont été initialisés");
      } else {
        console.log("Tous les sous-modules de partage ont été initialisés");
      }
    } catch (error) {
      if (MonHistoire.logger) {
        MonHistoire.logger.sharingError("Erreur lors de l'initialisation des sous-modules", error);
      } else {
        console.error("Erreur lors de l'initialisation des sous-modules:", error);
      }
    }
  }
  
  /**
   * Initialise les écouteurs d'événements pour les notifications
   */
  function initNotificationListeners() {
    try {
      // Écouteur pour le clic sur la notification
      const notification = document.getElementById("notification-partage");
      if (notification) {
        // Supprimer les anciens écouteurs pour éviter les doublons
        notification.removeEventListener("click", clicNotificationPartage);
        // Ajouter le nouvel écouteur
        notification.addEventListener("click", clicNotificationPartage);
      }
      
      // Écouteur pour les changements de connexion
      window.addEventListener('online', () => {
        if (MonHistoire.logger) {
          MonHistoire.logger.sharingInfo("Connexion rétablie, vérification des histoires partagées");
        } else {
          console.log("Connexion rétablie, vérification des histoires partagées");
        }
        MonHistoire.state.isConnected = true;
        
        // Attendre un court instant pour s'assurer que Firebase est prêt
        setTimeout(() => {
          verifierHistoiresPartagees();
        }, 2000);
      });
      
      window.addEventListener('offline', () => {
        if (MonHistoire.logger) {
          MonHistoire.logger.sharingInfo("Connexion perdue");
        } else {
          console.log("Connexion perdue");
        }
        MonHistoire.state.isConnected = false;
      });
    } catch (error) {
      if (MonHistoire.logger) {
        MonHistoire.logger.sharingError("Erreur lors de l'initialisation des écouteurs de notifications", error);
      } else {
        console.error("Erreur lors de l'initialisation des écouteurs de notifications:", error);
      }
    }
  }
  
  /**
   * Gestion du clic sur la notification
   */
  function clicNotificationPartage(e) {
    try {
      // Empêche la propagation du clic
      e.preventDefault();
      e.stopPropagation();
      
      // Ferme la notification
      if (MonHistoire.modules.sharing.notifications && typeof MonHistoire.modules.sharing.notifications.fermerNotificationPartage === 'function') {
        MonHistoire.modules.sharing.notifications.fermerNotificationPartage();
      }
      
      // Redirige vers "Mes histoires"
      if (MonHistoire.modules.core && MonHistoire.modules.core.navigation && typeof MonHistoire.modules.core.navigation.showScreen === 'function') {
        MonHistoire.modules.core.navigation.showScreen("mes-histoires");
      }
    } catch (error) {
      if (MonHistoire.logger) {
        MonHistoire.logger.sharingError("Erreur lors du clic sur la notification", error);
      } else {
        console.error("Erreur lors du clic sur la notification:", error);
      }
    }
  }
  
  /**
   * Vérifie s'il y a des histoires partagées pour l'utilisateur connecté
   */
  function verifierHistoiresPartagees() {
    try {
      // Vérifier si Firebase est disponible
      if (!firebase || !firebase.auth) {
        if (MonHistoire.logger) {
          MonHistoire.logger.sharingWarning("Vérification des histoires partagées: Firebase non disponible");
        } else {
          console.warn("Vérification des histoires partagées: Firebase non disponible");
        }
        
        // Planifier une nouvelle tentative après un délai
        setTimeout(() => verifierHistoiresPartagees(), 5000);
        return;
      }
      
      const user = firebase.auth().currentUser;
      if (!user) {
        if (MonHistoire.logger) {
          MonHistoire.logger.sharingInfo("Vérification des histoires partagées: utilisateur non connecté");
        } else {
          console.log("Vérification des histoires partagées: utilisateur non connecté");
        }
        return;
      }

      // S'assure que le profilActif est correctement initialisé
      if (!MonHistoire.state || !MonHistoire.state.profilActif) {
        MonHistoire.state = MonHistoire.state || {};
        MonHistoire.state.profilActif = localStorage.getItem("profilActif")
          ? JSON.parse(localStorage.getItem("profilActif"))
          : { type: "parent" };
      }

      // Vérifier l'état de connexion
      if (!isConnected()) {
        if (MonHistoire.logger) {
          MonHistoire.logger.sharingInfo("Vérification des histoires partagées: appareil non connecté");
        } else {
          console.log("Vérification des histoires partagées: appareil non connecté");
        }
        
        // Planifier une nouvelle tentative après un délai
        setTimeout(() => verifierHistoiresPartagees(), 5000);
        return;
      }

      if (MonHistoire.logger) {
        MonHistoire.logger.sharingInfo("Vérification des histoires partagées", {
          profilType: MonHistoire.state.profilActif.type,
          profilId: MonHistoire.state.profilActif.type === "enfant" ? MonHistoire.state.profilActif.id : null
        });
      } else {
        console.log("Vérification des histoires partagées pour", MonHistoire.state.profilActif.type, 
                    MonHistoire.state.profilActif.type === "enfant" ? MonHistoire.state.profilActif.id : "");
      }
      
      // Initialise le compteur de notifications non lues pour le profil actif
      if (MonHistoire.modules.sharing.notifications && typeof MonHistoire.modules.sharing.notifications.initialiserCompteurNotifications === 'function') {
        MonHistoire.modules.sharing.notifications.initialiserCompteurNotifications(user)
          .then(() => {
            // Mettre à jour l'indicateur de notification
            if (typeof MonHistoire.modules.sharing.notifications.mettreAJourIndicateurNotification === 'function') {
              MonHistoire.modules.sharing.notifications.mettreAJourIndicateurNotification();
            }
            if (typeof MonHistoire.modules.sharing.notifications.mettreAJourIndicateurNotificationProfilsListe === 'function') {
              MonHistoire.modules.sharing.notifications.mettreAJourIndicateurNotificationProfilsListe();
            }
          })
          .catch(error => {
            console.error("Erreur lors de l'initialisation du compteur de notifications:", error);
          });
      } else if (typeof initialiserCompteurNotifications === 'function') {
        // Utiliser la fonction exposée au module principal si disponible
        initialiserCompteurNotifications(user)
          .then(() => {
            if (MonHistoire.modules.sharing.notifications) {
              if (typeof MonHistoire.modules.sharing.notifications.mettreAJourIndicateurNotification === 'function') {
                MonHistoire.modules.sharing.notifications.mettreAJourIndicateurNotification();
              }
              if (typeof MonHistoire.modules.sharing.notifications.mettreAJourIndicateurNotificationProfilsListe === 'function') {
                MonHistoire.modules.sharing.notifications.mettreAJourIndicateurNotificationProfilsListe();
              }
            }
          })
          .catch(error => {
            console.error("Erreur lors de l'initialisation du compteur de notifications:", error);
          });
      }
      
      // Configure l'écouteur en temps réel pour les futures histoires partagées
      if (MonHistoire.modules.sharing.realtime && typeof MonHistoire.modules.sharing.realtime.configurerEcouteurHistoiresPartagees === 'function') {
        MonHistoire.modules.sharing.realtime.configurerEcouteurHistoiresPartagees();
      }
    } catch (error) {
      console.error("Erreur lors de la vérification des histoires partagées:", error);
      
      // Planifier une nouvelle tentative après un délai
      setTimeout(() => verifierHistoiresPartagees(), 10000);
    }
  }
  
  /**
   * Ouvre la modale de partage et affiche la liste des profils disponibles
   */
  async function ouvrirModalePartage() {
    // Déléguer au sous-module UI si disponible
    if (MonHistoire.modules.sharing.ui && MonHistoire.modules.sharing.ui.ouvrirModalePartage) {
      return MonHistoire.modules.sharing.ui.ouvrirModalePartage();
    }
    
    // Sinon, utiliser l'implémentation par défaut
    const user = firebase.auth().currentUser;
    if (!user) {
      MonHistoire.showMessageModal("Tu dois être connecté pour partager une histoire.");
      return;
    }

    // Récupère l'histoire actuellement affichée
    if (MonHistoire.modules.stories && MonHistoire.modules.stories.display) {
      const histoire = MonHistoire.modules.stories.display.getHistoireAffichee();
      
      // Si aucune histoire n'est affichée, on ne fait rien
      if (!histoire || (!histoire.chapitre1 && !histoire.contenu)) {
        MonHistoire.showMessageModal("Aucune histoire à partager.");
        return;
      }

      // Stocke temporairement l'histoire à partager
      histoireAPartager = {
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
  }
  
  /**
   * Ferme la modale de partage
   */
  function fermerModalePartage() {
    // Déléguer au sous-module UI si disponible
    if (MonHistoire.modules.sharing.ui && MonHistoire.modules.sharing.ui.fermerModalePartage) {
      return MonHistoire.modules.sharing.ui.fermerModalePartage();
    }
    
    // Sinon, utiliser l'implémentation par défaut
    const modal = document.getElementById("modal-partage");
    if (modal) {
      modal.classList.remove("show");
    }
    histoireAPartager = null;
  }
  
  /**
   * Partage l'histoire avec le profil sélectionné
   */
  async function partagerHistoire(type, id, prenom) {
    // Déléguer au sous-module Storage si disponible
    if (MonHistoire.modules.sharing.storage && MonHistoire.modules.sharing.storage.partagerHistoire) {
      return MonHistoire.modules.sharing.storage.partagerHistoire(type, id, prenom, histoireAPartager);
    }
    
    // Sinon, afficher un message d'erreur
    fermerModalePartage();
    MonHistoire.showMessageModal("Fonctionnalité de partage non disponible.");
  }
  
  /**
   * Traite un partage d'histoire qui a été mis en file d'attente hors ligne
   */
  async function processOfflinePartage(data) {
    // Déléguer au sous-module Storage si disponible
    if (MonHistoire.modules.sharing.storage && MonHistoire.modules.sharing.storage.processOfflinePartage) {
      return MonHistoire.modules.sharing.storage.processOfflinePartage(data);
    }
    
    // Sinon, retourner false pour indiquer que le traitement a échoué
    if (MonHistoire.logger) {
      MonHistoire.logger.sharingError("Traitement du partage hors ligne non disponible");
    } else {
      console.error("Traitement du partage hors ligne non disponible");
    }
    return false;
  }
  
  /**
   * Vérifie l'état de la connexion
   */
  function isConnected() {
    try {
      // Déléguer au sous-module Realtime si disponible
      if (MonHistoire.modules.sharing.realtime && typeof MonHistoire.modules.sharing.realtime.isConnected === 'function') {
        return MonHistoire.modules.sharing.realtime.isConnected();
      }
      
      // Sinon, utiliser l'implémentation par défaut
      const isNetworkConnected = navigator.onLine;
      
      // Vérifier si MonHistoire.state existe
      if (!MonHistoire.state) {
        MonHistoire.state = {};
      }
      
      // Vérifier si les propriétés existent, sinon les initialiser
      if (typeof MonHistoire.state.realtimeDbConnected === 'undefined') {
        MonHistoire.state.realtimeDbConnected = true;
      }
      
      if (typeof MonHistoire.state.isConnected === 'undefined') {
        MonHistoire.state.isConnected = navigator.onLine;
      }
      
      const isFirebaseConnected = MonHistoire.state.realtimeDbConnected !== false;
      return isNetworkConnected && isFirebaseConnected && MonHistoire.state.isConnected;
    } catch (error) {
      if (MonHistoire.logger) {
        MonHistoire.logger.sharingError("Erreur lors de la vérification de l'état de connexion", error);
      } else {
        console.error("Erreur lors de la vérification de l'état de connexion:", error);
      }
      return false;
    }
  }
  
  /**
   * Initialise le compteur de notifications non lues
   * @param {Object} user - L'utilisateur Firebase actuel
   * @returns {Promise} - Promise résolue quand l'initialisation est terminée
   */
  async function initialiserCompteurNotifications(user) {
    try {
      // Si l'utilisateur n'est pas fourni, utiliser l'utilisateur actuel
      if (!user && firebase && firebase.auth) {
        user = firebase.auth().currentUser;
      }
      
      if (!user) {
        if (MonHistoire.logger) {
          MonHistoire.logger.sharingInfo("Impossible d'initialiser le compteur de notifications: utilisateur non connecté");
        } else {
          console.log("Impossible d'initialiser le compteur de notifications: utilisateur non connecté");
        }
        return;
      }
      
      // S'assurer que le profilActif est correctement initialisé
      if (!MonHistoire.state.profilActif) {
        MonHistoire.state.profilActif = localStorage.getItem("profilActif")
          ? JSON.parse(localStorage.getItem("profilActif"))
          : { type: "parent" };
      }
      
      // Détermine la collection à vérifier selon le profil actif
      let storiesRef;
      if (MonHistoire.state.profilActif.type === "parent") {
        storiesRef = firebase.firestore()
          .collection("users")
          .doc(user.uid)
          .collection("stories")
          .where("nouvelleHistoire", "==", true);
      } else {
        storiesRef = firebase.firestore()
          .collection("users")
          .doc(user.uid)
          .collection("profils_enfant")
          .doc(MonHistoire.state.profilActif.id)
          .collection("stories")
          .where("nouvelleHistoire", "==", true);
      }

      // Compte le nombre de notifications non lues
      const snapshot = await storiesRef.get();
      const profilId = MonHistoire.state.profilActif.type === "parent" ? "parent" : MonHistoire.state.profilActif.id;
      notificationsNonLues[profilId] = snapshot.size;
      
      // Si le profil actif est le parent, compte aussi les notifications non lues pour chaque profil enfant
      if (MonHistoire.state.profilActif.type === "parent") {
        const profilsEnfantsSnapshot = await firebase.firestore()
          .collection("users")
          .doc(user.uid)
          .collection("profils_enfant")
          .get();
          
        for (const profilDoc of profilsEnfantsSnapshot.docs) {
          const profilId = profilDoc.id;
          const storiesEnfantRef = firebase.firestore()
            .collection("users")
            .doc(user.uid)
            .collection("profils_enfant")
            .doc(profilId)
            .collection("stories")
            .where("nouvelleHistoire", "==", true);
            
          const storiesEnfantSnapshot = await storiesEnfantRef.get();
          notificationsNonLues[profilId] = storiesEnfantSnapshot.size;
        }
      }
      
      if (MonHistoire.logger) {
        MonHistoire.logger.sharingInfo("Compteur de notifications initialisé", {
          notificationsCount: notificationsNonLues
        });
      } else {
        console.log("Compteur de notifications initialisé:", notificationsNonLues);
      }
    } catch (error) {
      if (MonHistoire.logger) {
        MonHistoire.logger.sharingError("Erreur lors de l'initialisation du compteur de notifications", error);
      } else {
        console.error("Erreur lors de l'initialisation du compteur de notifications:", error);
      }
    }
  }

  /**
   * Met à jour l'indicateur de notification
   * Cette fonction est exposée pour être utilisée par d'autres modules
   */
  function mettreAJourIndicateurNotification() {
    if (MonHistoire.modules.sharing.notifications && typeof MonHistoire.modules.sharing.notifications.mettreAJourIndicateurNotification === 'function') {
      return MonHistoire.modules.sharing.notifications.mettreAJourIndicateurNotification();
    }
  }

  // API publique
  MonHistoire.modules.sharing = {
    init: init,
    ouvrirModalePartage: ouvrirModalePartage,
    fermerModalePartage: fermerModalePartage,
    partagerHistoire: partagerHistoire,
    processOfflinePartage: processOfflinePartage,
    isConnected: isConnected,
    initialiserCompteurNotifications: initialiserCompteurNotifications,
    mettreAJourIndicateurNotification: mettreAJourIndicateurNotification,
    verifierHistoiresPartagees: verifierHistoiresPartagees
  };
})();
