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
    try {
      if (MonHistoire.logger) {
        MonHistoire.logger.sharingInfo("Module de partage d'histoires initialisé");
      } else {
        console.log("Module de partage d'histoires initialisé");
      }
      
      // Initialiser les variables
      this.notificationsNonLues = this.notificationsNonLues || {};
      this.notificationsTraitees = this.notificationsTraitees || new Set();
      this.histoiresPartageesListener = this.histoiresPartageesListener || [];
      
      // S'assurer que les fonctions essentielles sont disponibles
      this.mettreAJourIndicateurNotification = this.mettreAJourIndicateurNotification || function() {
        if (MonHistoire.logger) {
          MonHistoire.logger.sharingWarning("Fonction mettreAJourIndicateurNotification non disponible");
        } else {
          console.warn("Fonction mettreAJourIndicateurNotification non disponible");
        }
        if (this.notifications && typeof this.notifications.mettreAJourIndicateurNotification === 'function') {
          return this.notifications.mettreAJourIndicateurNotification();
        }
      };
      
      this.mettreAJourIndicateurNotificationProfilsListe = this.mettreAJourIndicateurNotificationProfilsListe || function() {
        if (MonHistoire.logger) {
          MonHistoire.logger.sharingWarning("Fonction mettreAJourIndicateurNotificationProfilsListe non disponible");
        } else {
          console.warn("Fonction mettreAJourIndicateurNotificationProfilsListe non disponible");
        }
        if (this.notifications && typeof this.notifications.mettreAJourIndicateurNotificationProfilsListe === 'function') {
          return this.notifications.mettreAJourIndicateurNotificationProfilsListe();
        }
      };
      
      // Initialiser les écouteurs d'événements pour les notifications
      this.initNotificationListeners();
      
      // Initialiser les sous-modules
      this.initSubmodules();
      
      // Attendre un court instant pour s'assurer que Firebase est prêt
      setTimeout(() => {
        try {
          // Configurer l'écouteur de notifications en temps réel
          if (this.realtime) {
            if (typeof this.realtime.configurerEcouteurNotificationsRealtime === 'function') {
              this.realtime.configurerEcouteurNotificationsRealtime();
            }
            
            if (typeof this.realtime.configurerEcouteurHistoiresPartagees === 'function') {
              this.realtime.configurerEcouteurHistoiresPartagees();
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
      this.registerProfilChangeListener();
    } catch (error) {
      if (MonHistoire.logger) {
        MonHistoire.logger.sharingError("Erreur lors de l'initialisation du module de partage", error);
      } else {
        console.error("Erreur lors de l'initialisation du module de partage:", error);
      }
    }
  },
  
  /**
   * Enregistre l'écouteur de changement de profil.
   * Utilise MonHistoire.common.waitForEvents pour attendre que le système d'événements soit disponible.
   */
  registerProfilChangeListener(compteur = 0) {
    const handler = (nouveauProfil) => {
      try {
        if (MonHistoire.logger) {
          MonHistoire.logger.sharingInfo("Changement de profil détecté", {
            profilType: nouveauProfil ? nouveauProfil.type : "inconnu",
            profilId: nouveauProfil && nouveauProfil.id ? nouveauProfil.id : null
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
            if (this.realtime) {
              if (typeof this.realtime.configurerEcouteurNotificationsRealtime === 'function') {
                this.realtime.configurerEcouteurNotificationsRealtime();
              }
              if (typeof this.realtime.configurerEcouteurHistoiresPartagees === 'function') {
                this.realtime.configurerEcouteurHistoiresPartagees();
              }
            }
            
            // Mettre à jour les indicateurs de notification
            if (this.notifications) {
              if (typeof this.notifications.mettreAJourIndicateurNotification === 'function') {
                this.notifications.mettreAJourIndicateurNotification();
              }
              if (typeof this.notifications.mettreAJourIndicateurNotificationProfilsListe === 'function') {
                this.notifications.mettreAJourIndicateurNotificationProfilsListe();
              }
            } else {
              // Utiliser les fonctions exposées au module principal si disponibles
              if (typeof this.mettreAJourIndicateurNotification === 'function') {
                this.mettreAJourIndicateurNotification();
              }
              if (typeof this.mettreAJourIndicateurNotificationProfilsListe === 'function') {
                this.mettreAJourIndicateurNotificationProfilsListe();
              }
            }
            
            // Vérifier s'il y a des histoires partagées pour ce profil
            this.verifierHistoiresPartagees();
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
    
    if (MonHistoire.common && typeof MonHistoire.common.waitForEvents === 'function') {
      MonHistoire.common.waitForEvents(() => {
        MonHistoire.events.on("profilChange", handler);
      });
    } else if (MonHistoire.events && typeof MonHistoire.events.on === 'function') {
      // Fallback si MonHistoire.common n'est pas disponible
      MonHistoire.events.on("profilChange", handler);
    } else {
      // Mécanisme de réessai si le système d'événements n'est pas disponible
      if (compteur < 5) {
        if (MonHistoire.logger) {
          MonHistoire.logger.sharingInfo("Système d'événements non disponible, nouvelle tentative programmée", {
            attempt: compteur + 1,
            maxAttempts: 5,
            delay: 200
          });
        } else {
          console.warn("Système d'événements non disponible, nouvelle tentative programmée dans 200ms");
        }
        
        setTimeout(() => this.registerProfilChangeListener(compteur + 1), 200);
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
  },
  
  /**
   * Initialise les sous-modules
   */
  initSubmodules() {
    try {
      // Initialiser les sous-modules dans un ordre spécifique pour respecter les dépendances
      
      // 1. Storage (pas de dépendances)
      if (this.storage && typeof this.storage.init === 'function') {
        if (MonHistoire.logger) {
          MonHistoire.logger.sharingInfo("Initialisation du sous-module storage");
        } else {
          console.log("Initialisation du sous-module storage");
        }
        this.storage.init();
      }
      
      // 2. UI (dépend de storage)
      if (this.ui && typeof this.ui.init === 'function') {
        if (MonHistoire.logger) {
          MonHistoire.logger.sharingInfo("Initialisation du sous-module ui");
        } else {
          console.log("Initialisation du sous-module ui");
        }
        this.ui.init();
      }
      
      // 3. Notifications (dépend de ui)
      if (this.notifications && typeof this.notifications.init === 'function') {
        if (MonHistoire.logger) {
          MonHistoire.logger.sharingInfo("Initialisation du sous-module notifications");
        } else {
          console.log("Initialisation du sous-module notifications");
        }
        this.notifications.init();
        
        // Exposer les fonctions importantes au module principal
        if (typeof this.notifications.mettreAJourIndicateurNotification === 'function') {
          this.mettreAJourIndicateurNotification = this.notifications.mettreAJourIndicateurNotification.bind(this.notifications);
        }
        
        if (typeof this.notifications.mettreAJourIndicateurNotificationProfilsListe === 'function') {
          this.mettreAJourIndicateurNotificationProfilsListe = this.notifications.mettreAJourIndicateurNotificationProfilsListe.bind(this.notifications);
        }
      }
      
      // 4. Realtime (dépend de notifications)
      if (this.realtime && typeof this.realtime.init === 'function') {
        if (MonHistoire.logger) {
          MonHistoire.logger.sharingInfo("Initialisation du sous-module realtime");
        } else {
          console.log("Initialisation du sous-module realtime");
        }
        this.realtime.init();
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
  },
  
  /**
   * Initialise les écouteurs d'événements pour les notifications
   */
  initNotificationListeners() {
    try {
      // Écouteur pour le clic sur la notification
      const notification = document.getElementById("notification-partage");
      if (notification) {
        // Supprimer les anciens écouteurs pour éviter les doublons
        notification.removeEventListener("click", this.clicNotificationPartage);
        // Ajouter le nouvel écouteur
        notification.addEventListener("click", this.clicNotificationPartage.bind(this));
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
          this.verifierHistoiresPartagees();
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
  },
  
  /**
   * Gestion du clic sur la notification
   */
  clicNotificationPartage(e) {
    try {
      // Empêche la propagation du clic
      e.preventDefault();
      e.stopPropagation();
      
      // Ferme la notification
      if (this.notifications && typeof this.notifications.fermerNotificationPartage === 'function') {
        this.notifications.fermerNotificationPartage();
      }
      
      // Redirige vers "Mes histoires"
      if (MonHistoire.core && MonHistoire.core.navigation && typeof MonHistoire.core.navigation.showScreen === 'function') {
        MonHistoire.core.navigation.showScreen("mes-histoires");
      }
    } catch (error) {
      if (MonHistoire.logger) {
        MonHistoire.logger.sharingError("Erreur lors du clic sur la notification", error);
      } else {
        console.error("Erreur lors du clic sur la notification:", error);
      }
    }
  },
  
  /**
   * Vérifie s'il y a des histoires partagées pour l'utilisateur connecté
   */
  verifierHistoiresPartagees() {
    try {
      // Vérifier si Firebase est disponible
      if (!firebase || !firebase.auth) {
        if (MonHistoire.logger) {
          MonHistoire.logger.sharingWarning("Vérification des histoires partagées: Firebase non disponible");
        } else {
          console.warn("Vérification des histoires partagées: Firebase non disponible");
        }
        
        // Planifier une nouvelle tentative après un délai
        setTimeout(() => this.verifierHistoiresPartagees(), 5000);
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
      if (!this.isConnected()) {
        if (MonHistoire.logger) {
          MonHistoire.logger.sharingInfo("Vérification des histoires partagées: appareil non connecté");
        } else {
          console.log("Vérification des histoires partagées: appareil non connecté");
        }
        
        // Planifier une nouvelle tentative après un délai
        setTimeout(() => this.verifierHistoiresPartagees(), 5000);
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
      if (this.notifications && typeof this.notifications.initialiserCompteurNotifications === 'function') {
        this.notifications.initialiserCompteurNotifications(user)
          .then(() => {
            // Mettre à jour l'indicateur de notification
            if (typeof this.notifications.mettreAJourIndicateurNotification === 'function') {
              this.notifications.mettreAJourIndicateurNotification();
            }
            if (typeof this.notifications.mettreAJourIndicateurNotificationProfilsListe === 'function') {
              this.notifications.mettreAJourIndicateurNotificationProfilsListe();
            }
          })
          .catch(error => {
            console.error("Erreur lors de l'initialisation du compteur de notifications:", error);
          });
      } else if (typeof this.initialiserCompteurNotifications === 'function') {
        // Utiliser la fonction exposée au module principal si disponible
        this.initialiserCompteurNotifications(user)
          .then(() => {
            if (typeof this.mettreAJourIndicateurNotification === 'function') {
              this.mettreAJourIndicateurNotification();
            }
            if (typeof this.mettreAJourIndicateurNotificationProfilsListe === 'function') {
              this.mettreAJourIndicateurNotificationProfilsListe();
            }
          })
          .catch(error => {
            console.error("Erreur lors de l'initialisation du compteur de notifications:", error);
          });
      }
      
      // Configure l'écouteur en temps réel pour les futures histoires partagées
      if (this.realtime && typeof this.realtime.configurerEcouteurHistoiresPartagees === 'function') {
        this.realtime.configurerEcouteurHistoiresPartagees();
      }
    } catch (error) {
      console.error("Erreur lors de la vérification des histoires partagées:", error);
      
      // Planifier une nouvelle tentative après un délai
      setTimeout(() => this.verifierHistoiresPartagees(), 10000);
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
    if (MonHistoire.logger) {
      MonHistoire.logger.sharingError("Traitement du partage hors ligne non disponible");
    } else {
      console.error("Traitement du partage hors ligne non disponible");
    }
    return false;
  },
  
  /**
   * Vérifie l'état de la connexion
   */
  isConnected() {
    try {
      // Déléguer au sous-module Realtime si disponible
      if (this.realtime && typeof this.realtime.isConnected === 'function') {
        return this.realtime.isConnected();
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
  },
  
  /**
   * Initialise le compteur de notifications non lues
   * @param {Object} user - L'utilisateur Firebase actuel
   * @returns {Promise} - Promise résolue quand l'initialisation est terminée
   */
  async initialiserCompteurNotifications(user) {
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
      this.notificationsNonLues[profilId] = snapshot.size;
      
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
          this.notificationsNonLues[profilId] = storiesEnfantSnapshot.size;
        }
      }
      
      if (MonHistoire.logger) {
        MonHistoire.logger.sharingInfo("Compteur de notifications initialisé", {
          notificationsCount: this.notificationsNonLues
        });
      } else {
        console.log("Compteur de notifications initialisé:", this.notificationsNonLues);
      }
    } catch (error) {
      if (MonHistoire.logger) {
        MonHistoire.logger.sharingError("Erreur lors de l'initialisation du compteur de notifications", error);
      } else {
        console.error("Erreur lors de l'initialisation du compteur de notifications:", error);
      }
    }
  }
};

// Exporter pour utilisation dans d'autres modules
window.MonHistoire = MonHistoire;
