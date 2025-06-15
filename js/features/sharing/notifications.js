// js/features/sharing/notifications.js
// Gestion des notifications de partage d'histoires

// S'assurer que les objets nécessaires existent
window.MonHistoire = window.MonHistoire || {};
MonHistoire.features = MonHistoire.features || {};
MonHistoire.features.sharing = MonHistoire.features.sharing || {};

// Initialiser les variables de notification si elles n'existent pas
MonHistoire.features.sharing.notificationsNonLues = MonHistoire.features.sharing.notificationsNonLues || {};
MonHistoire.features.sharing.notificationsTraitees = MonHistoire.features.sharing.notificationsTraitees || new Set();
MonHistoire.features.sharing.notificationTimeout = null;
MonHistoire.features.sharing.notificationSwipeStartX = 0;
MonHistoire.features.sharing.notificationSwipeStartY = 0;

/**
 * Module de gestion des notifications
 * Responsable de l'affichage et de la gestion des notifications de partage
 */
MonHistoire.features.sharing.notifications = {
  // Compteur de tentatives d'initialisation des écouteurs
  initAttempts: 0,
  // Nombre maximal de tentatives
  maxInitAttempts: 10,
  /**
   * Initialisation du module
   */
  init() {
    if (MonHistoire.logger) {
      MonHistoire.logger.sharingInfo("Module de notifications de partage initialisé");
    } else {
      console.log("Module de notifications de partage initialisé");
    }
    
    // Charger le cache des notifications traitées depuis localStorage
    try {
      const cachedNotifications = localStorage.getItem('notificationsTraitees');
      if (cachedNotifications) {
        MonHistoire.features.sharing.notificationsTraitees = new Set(JSON.parse(cachedNotifications));
      }
    } catch (e) {
      console.error("Erreur lors du chargement du cache des notifications", e);
    }
    
    // Initialiser les écouteurs d'événements pour les notifications
    this.initNotificationListeners();
    
    // Exposer les fonctions importantes au module principal
    if (MonHistoire.features.sharing) {
      MonHistoire.features.sharing.mettreAJourIndicateurNotification = this.mettreAJourIndicateurNotification.bind(this);
      MonHistoire.features.sharing.mettreAJourIndicateurNotificationProfilsListe = this.mettreAJourIndicateurNotificationProfilsListe.bind(this);
    }
  },
  
  /**
   * Crée l'élément de notification s'il n'existe pas déjà
   * @returns {HTMLElement} - L'élément de notification
   */
  creerElementNotification() {
    // Vérifier si l'élément existe déjà
    let notification = document.getElementById("notification-partage");
    
    // Si l'élément n'existe pas, le créer
    if (!notification) {
      notification = document.createElement("div");
      notification.id = "notification-partage";
      notification.className = "ui-notification";
      
      // Créer l'icône de la notification
      const icon = document.createElement("div");
      icon.className = "ui-notification-icon";
      icon.textContent = "✓";
      
      // Créer le contenu de la notification
      const content = document.createElement("div");
      content.className = "ui-notification-content";
      
      // Créer le message de la notification (sans titre)
      const message = document.createElement("div");
      message.className = "ui-notification-message";
      message.id = "notification-message";
      
      // Créer le bouton de fermeture
      const closeButton = document.createElement("button");
      closeButton.className = "ui-notification-close";
      closeButton.textContent = "×";
      
      // Assembler les éléments (sans le titre)
      content.appendChild(message);
      
      notification.appendChild(icon);
      notification.appendChild(content);
      notification.appendChild(closeButton);
      
      // Ajouter la notification au body
      document.body.appendChild(notification);
      
      // Masquer la notification par défaut
      notification.style.display = "none";
    }
    
    return notification;
  },
  
  /**
   * Initialise les écouteurs d'événements pour les notifications
   */
  initNotificationListeners() {
    try {
      // Créer ou récupérer l'élément de notification
      const notification = this.creerElementNotification();
      
      // Écouteur pour le clic sur la notification
      if (notification) {
        // Supprimer les anciens écouteurs pour éviter les doublons
        notification.removeEventListener("click", this.clicNotificationPartage);
        // Ajouter le nouvel écouteur
        notification.addEventListener("click", this.clicNotificationPartage.bind(this));
      }
      
      // Vérifier la disponibilité du système d'événements
      if (!MonHistoire.events || typeof MonHistoire.events.on !== 'function') {
        if (MonHistoire.common && typeof MonHistoire.common.waitForEvents === 'function') {
          // Utiliser la fonction utilitaire pour attendre que MonHistoire.events soit disponible
          if (MonHistoire.logger) {
            MonHistoire.logger.sharingInfo("Attente du système d'événements pour les notifications", {
              waitMethod: "waitForEvents",
              maxAttempts: this.maxInitAttempts
            });
          }
          
          MonHistoire.common.waitForEvents(() => {
            // Écouteur pour les changements de profil
            MonHistoire.events.on("profilChange", () => {
              // Mettre à jour l'indicateur de notification après un court délai
              // pour laisser le temps aux données de se charger
              setTimeout(() => {
                this.mettreAJourIndicateurNotification();
                this.mettreAJourIndicateurNotificationProfilsListe();
              }, 1000);
            });
            
            // Réinitialiser le compteur de tentatives
            this.initAttempts = 0;
            
            if (MonHistoire.logger) {
              MonHistoire.logger.sharingInfo("Écouteurs d'événements de notifications initialisés avec succès après attente");
            }
          }, this.maxInitAttempts);
        } else {
          // Fallback si MonHistoire.common n'est pas disponible
          if (this.initAttempts < this.maxInitAttempts) {
            this.initAttempts++;
            
            if (MonHistoire.logger) {
              MonHistoire.logger.sharingInfo("Tentative d'initialisation des écouteurs de notifications", {
                attempt: this.initAttempts,
                maxAttempts: this.maxInitAttempts
              });
            }
            
            setTimeout(() => this.initNotificationListeners(), 200);
          } else {
            if (MonHistoire.logger) {
              MonHistoire.logger.sharingError("Système d'événements non disponible pour les notifications après plusieurs tentatives", {
                attempts: this.initAttempts,
                maxAttempts: this.maxInitAttempts
              });
            } else {
              console.warn("Système d'événements non disponible pour les notifications");
            }
          }
        }
        return;
      } else {
        // Écouteur pour les changements de profil
        MonHistoire.events.on("profilChange", () => {
          // Mettre à jour l'indicateur de notification après un court délai
          // pour laisser le temps aux données de se charger
          setTimeout(() => {
            this.mettreAJourIndicateurNotification();
            this.mettreAJourIndicateurNotificationProfilsListe();
          }, 1000);
        });
        
        // Réinitialiser le compteur de tentatives
        this.initAttempts = 0;
      }
    } catch (error) {
      if (MonHistoire.logger) {
        MonHistoire.logger.sharingError("Erreur lors de l'initialisation des écouteurs de notifications", error);
      } else {
        console.error("Erreur lors de l'initialisation des écouteurs de notifications:", error);
      }
    }
  },
  
  /**
   * Initialise le compteur de notifications non lues pour le profil actif
   * @param {Object} user - L'utilisateur Firebase actuel
   * @returns {Promise} - Promise résolue quand l'initialisation est terminée
   */
  async initialiserCompteurNotifications(user) {
    try {
      // S'assurer que le profilActif est correctement initialisé
      if (!MonHistoire.state.profilActif) {
        MonHistoire.state.profilActif = localStorage.getItem("profilActif")
          ? JSON.parse(localStorage.getItem("profilActif"))
          : { type: "parent" };
      }
      
      // Récupère l'ID du profil actif
      const profilId = MonHistoire.state.profilActif.type === "parent" ? "parent" : MonHistoire.state.profilActif.id;
      
      // Réinitialiser le compteur avant de compter les nouvelles notifications
      MonHistoire.features.sharing.notificationsNonLues[profilId] = 0;
      
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
      MonHistoire.features.sharing.notificationsNonLues[profilId] = snapshot.size;
      
      // Si le profil actif est le parent, compte aussi les notifications non lues pour chaque profil enfant
      if (MonHistoire.state.profilActif.type === "parent") {
        const profilsEnfantsSnapshot = await firebase.firestore()
          .collection("users")
          .doc(user.uid)
          .collection("profils_enfant")
          .get();
          
        for (const profilDoc of profilsEnfantsSnapshot.docs) {
          const enfantProfilId = profilDoc.id;
          // Réinitialiser le compteur pour ce profil enfant
          MonHistoire.features.sharing.notificationsNonLues[enfantProfilId] = 0;
          
          const storiesEnfantRef = firebase.firestore()
            .collection("users")
            .doc(user.uid)
            .collection("profils_enfant")
            .doc(enfantProfilId)
            .collection("stories")
            .where("nouvelleHistoire", "==", true);
            
          const storiesEnfantSnapshot = await storiesEnfantRef.get();
          MonHistoire.features.sharing.notificationsNonLues[enfantProfilId] = storiesEnfantSnapshot.size;
        }
      }
      
      if (MonHistoire.logger) {
        MonHistoire.logger.sharingInfo("Compteur de notifications initialisé", {
          notificationsCount: Object.keys(MonHistoire.features.sharing.notificationsNonLues).length,
          status: "OK"
        });
      } else {
        console.log("Compteur de notifications initialisé:", MonHistoire.features.sharing.notificationsNonLues);
      }
    } catch (error) {
      if (MonHistoire.logger) {
        MonHistoire.logger.sharingError("Erreur lors de l'initialisation du compteur de notifications", error);
      } else {
        console.error("Erreur lors de l'initialisation du compteur de notifications:", error);
      }
    }
  },
  
  /**
   * Affiche la notification de partage
   * @param {string} prenomPartageur - Prénom de la personne qui a partagé l'histoire
   * @param {Object} histoireRef - Référence Firestore à l'histoire partagée
   */
  afficherNotificationPartage(prenomPartageur, histoireRef) {
    // Créer ou récupérer l'élément de notification
    const notification = this.creerElementNotification();
    const message = document.getElementById("notification-message");
    const closeButton = notification ? notification.querySelector(".ui-notification-close") : null;
    
    if (!notification || !message) return;
    
    // Stocke la référence à l'histoire pour pouvoir la marquer comme vue plus tard
    MonHistoire.features.sharing.histoireNotifieeActuelle = histoireRef;
    
    // Définit le message
    message.textContent = `${prenomPartageur} t'a partagé une histoire`;
    
    // Supprime les anciens écouteurs d'événements pour éviter les doublons
    notification.removeEventListener("touchstart", this.demarrerSwipeNotification);
    notification.removeEventListener("touchmove", this.deplacerSwipeNotification);
    notification.removeEventListener("touchend", this.terminerSwipeNotification);
    notification.removeEventListener("mousedown", this.demarrerSwipeNotification);
    notification.removeEventListener("mousemove", this.deplacerSwipeNotification);
    notification.removeEventListener("mouseup", this.terminerSwipeNotification);
    notification.removeEventListener("mouseleave", this.terminerSwipeNotification);
    
    // Ajoute les écouteurs d'événements pour le swipe
    notification.addEventListener("touchstart", this.demarrerSwipeNotification.bind(this), { passive: true });
    notification.addEventListener("touchmove", this.deplacerSwipeNotification.bind(this), { passive: true });
    notification.addEventListener("touchend", this.terminerSwipeNotification.bind(this), { passive: true });
    notification.addEventListener("mousedown", this.demarrerSwipeNotification.bind(this));
    notification.addEventListener("mousemove", this.deplacerSwipeNotification.bind(this));
    notification.addEventListener("mouseup", this.terminerSwipeNotification.bind(this));
    notification.addEventListener("mouseleave", this.terminerSwipeNotification.bind(this));
    
    // Ajoute un écouteur d'événement pour le bouton de fermeture
    if (closeButton) {
      closeButton.removeEventListener("click", this.fermerNotificationPartage);
      closeButton.addEventListener("click", (e) => {
        e.stopPropagation(); // Empêche la propagation au conteneur de notification
        this.fermerNotificationPartage();
      });
    }
    
    // Annule le timeout précédent s'il existe
    if (MonHistoire.features.sharing.notificationTimeout) {
      clearTimeout(MonHistoire.features.sharing.notificationTimeout);
      MonHistoire.features.sharing.notificationTimeout = null;
    }
    
    // S'assurer que la notification est visible
    notification.style.display = "flex";
    
    // Réinitialiser les classes d'animation si nécessaire
    notification.classList.remove("ui-notification--closing");
    
    // Ferme automatiquement la notification après 5 secondes
    MonHistoire.features.sharing.notificationTimeout = setTimeout(() => {
      this.fermerNotificationPartage();
    }, 5000);
  },
  
  /**
   * Ferme la notification de partage
   * @param {boolean} marquerCommeVue - Si true, marque l'histoire comme vue
   */
  fermerNotificationPartage(marquerCommeVue = true) {
    const notification = document.getElementById("notification-partage");
    if (!notification) return;
    
    // Annule le timeout si existant
    if (MonHistoire.features.sharing.notificationTimeout) {
      clearTimeout(MonHistoire.features.sharing.notificationTimeout);
      MonHistoire.features.sharing.notificationTimeout = null;
    }
    
    // Marque l'histoire comme vue si demandé et si une histoire est en cours de notification
    if (marquerCommeVue && MonHistoire.features.sharing.histoireNotifieeActuelle) {
      // Récupère l'ID du profil actif
      const profilId = MonHistoire.state.profilActif.type === "parent" ? "parent" : MonHistoire.state.profilActif.id;
      
      // Décrémente le compteur de notifications non lues
      if (MonHistoire.features.sharing.notificationsNonLues[profilId] && MonHistoire.features.sharing.notificationsNonLues[profilId] > 0) {
        MonHistoire.features.sharing.notificationsNonLues[profilId]--;
      }
      
      try {
        // Vérifier que histoireNotifieeActuelle est valide avant d'appeler get()
        if (MonHistoire.features.sharing.histoireNotifieeActuelle && 
            typeof MonHistoire.features.sharing.histoireNotifieeActuelle.get === 'function') {
          
          // Met à jour le document Firestore
          MonHistoire.features.sharing.histoireNotifieeActuelle.get().then(doc => {
            if (doc.exists) {
              const data = doc.data();
              
              // Initialise vueParProfils s'il n'existe pas
              const vueParProfils = data.vueParProfils || [];
              
              // Ajoute le profil actif à la liste des profils ayant vu l'histoire
              if (!vueParProfils.includes(profilId)) {
                vueParProfils.push(profilId);
              }
              
              // Détermine si l'histoire doit être marquée comme vue
              // (si tous les destinataires l'ont vue)
              const nouvelleHistoire = vueParProfils.length < 2; // Simplifié pour l'instant
              
              // Vérifier que histoireNotifieeActuelle est toujours valide avant d'appeler update()
              if (MonHistoire.features.sharing.histoireNotifieeActuelle && 
                  typeof MonHistoire.features.sharing.histoireNotifieeActuelle.update === 'function') {
                
                // Met à jour le document
                MonHistoire.features.sharing.histoireNotifieeActuelle.update({ 
                  nouvelleHistoire: nouvelleHistoire,
                  vueParProfils: vueParProfils,
                  vueLe: firebase.firestore.FieldValue.serverTimestamp()
                }).catch(error => {
                  if (MonHistoire.logger) {
                    MonHistoire.logger.sharingError("Erreur lors du marquage de l'histoire comme vue", error);
                  } else {
                    console.error("Erreur lors du marquage de l'histoire comme vue:", error);
                  }
                });
              }
            }
          }).catch(error => {
            if (MonHistoire.logger) {
              MonHistoire.logger.sharingError("Erreur lors de la récupération de l'histoire", error);
            } else {
              console.error("Erreur lors de la récupération de l'histoire:", error);
            }
          });
        }
      } catch (error) {
        if (MonHistoire.logger) {
          MonHistoire.logger.sharingError("Erreur lors du traitement de l'histoire notifiée", error);
        } else {
          console.error("Erreur lors du traitement de l'histoire notifiée:", error);
        }
      }
      
      // Réinitialise la référence
      MonHistoire.features.sharing.histoireNotifieeActuelle = null;
      
      // Sauvegarder le cache des notifications traitées
      try {
        localStorage.setItem('notificationsTraitees', 
          JSON.stringify([...MonHistoire.features.sharing.notificationsTraitees]));
      } catch (e) {
        console.error("Erreur lors de la sauvegarde du cache des notifications", e);
      }
      
      // Met à jour l'indicateur de notification
      this.mettreAJourIndicateurNotification();
    }
    
    // Ajoute l'animation de sortie
    notification.classList.add("ui-notification--closing");
    
    // Supprime les classes et les écouteurs après l'animation
    setTimeout(() => {
      notification.classList.remove("ui-notification--closing");
      notification.style.display = "none";
      
      // Supprime les écouteurs d'événements
      notification.removeEventListener("touchstart", this.demarrerSwipeNotification);
      notification.removeEventListener("touchmove", this.deplacerSwipeNotification);
      notification.removeEventListener("touchend", this.terminerSwipeNotification);
      notification.removeEventListener("mousedown", this.demarrerSwipeNotification);
      notification.removeEventListener("mousemove", this.deplacerSwipeNotification);
      notification.removeEventListener("mouseup", this.terminerSwipeNotification);
      notification.removeEventListener("mouseleave", this.terminerSwipeNotification);
    }, 300);
  },
  
  /**
   * Gestion du swipe - Début
   * @param {Event} e - Événement de début de swipe
   */
  demarrerSwipeNotification(e) {
    // Annule le timeout automatique
    if (MonHistoire.features.sharing.notificationTimeout) {
      clearTimeout(MonHistoire.features.sharing.notificationTimeout);
      MonHistoire.features.sharing.notificationTimeout = null;
    }
    
    // Enregistre la position de départ
    if (e.type === "touchstart") {
      MonHistoire.features.sharing.notificationSwipeStartX = e.touches[0].clientX;
      MonHistoire.features.sharing.notificationSwipeStartY = e.touches[0].clientY;
    } else {
      MonHistoire.features.sharing.notificationSwipeStartX = e.clientX;
      MonHistoire.features.sharing.notificationSwipeStartY = e.clientY;
    }
  },
  
  /**
   * Gestion du swipe - Déplacement
   * @param {Event} e - Événement de déplacement
   */
  deplacerSwipeNotification(e) {
    // Ne fait rien si on n'a pas commencé un swipe
    if (MonHistoire.features.sharing.notificationSwipeStartX === 0 && MonHistoire.features.sharing.notificationSwipeStartY === 0) return;
    
    let currentX, currentY;
    
    if (e.type === "touchmove") {
      currentX = e.touches[0].clientX;
      currentY = e.touches[0].clientY;
    } else {
      currentX = e.clientX;
      currentY = e.clientY;
    }
    
    // Calcule la distance parcourue
    const distanceX = Math.abs(currentX - MonHistoire.features.sharing.notificationSwipeStartX);
    const distanceY = Math.abs(currentY - MonHistoire.features.sharing.notificationSwipeStartY);
    
    // Si la distance est suffisante, ferme la notification
    if (distanceX > 50 || distanceY > 50) {
      this.fermerNotificationPartage();
      
      // Réinitialise les positions
      MonHistoire.features.sharing.notificationSwipeStartX = 0;
      MonHistoire.features.sharing.notificationSwipeStartY = 0;
    }
  },
  
  /**
   * Gestion du swipe - Fin
   */
  terminerSwipeNotification() {
    // Réinitialise les positions
    MonHistoire.features.sharing.notificationSwipeStartX = 0;
    MonHistoire.features.sharing.notificationSwipeStartY = 0;
  },
  
  /**
   * Gestion du clic sur la notification
   * @param {Event} e - Événement de clic
   */
  clicNotificationPartage(e) {
    // Empêche la propagation du clic
    e.preventDefault();
    e.stopPropagation();
    
    // Ferme la notification
    this.fermerNotificationPartage();
    
    // Redirige vers "Mes histoires"
    if (MonHistoire.core && MonHistoire.core.navigation) {
      MonHistoire.core.navigation.showScreen("mes-histoires");
    }
  },
  
  /**
   * Met à jour l'indicateur de notification dans l'interface utilisateur
   */
  mettreAJourIndicateurNotification() {
    try {
      // S'assurer que l'état est correctement initialisé
      if (!MonHistoire.state || !MonHistoire.state.profilActif) {
        console.warn("État non initialisé pour la mise à jour des notifications");
        return;
      }
      
      // Récupère l'ID du profil actif
      const profilId = MonHistoire.state.profilActif.type === "parent" ? "parent" : MonHistoire.state.profilActif.id;
      
      // S'assurer que les notifications non lues sont initialisées
      if (!MonHistoire.features.sharing.notificationsNonLues) {
        MonHistoire.features.sharing.notificationsNonLues = {};
      }
      
      // Récupère le nombre de notifications non lues pour ce profil
      const nbNotifs = MonHistoire.features.sharing.notificationsNonLues[profilId] || 0;
      
      // Récupère le bouton "Mes Histoires" (où on affichera l'indicateur)
      const storiesButton = document.getElementById("my-stories-button");

      // Si le bouton existe et qu'il y a des notifications non lues
      if (storiesButton && nbNotifs > 0) {
        // Vérifie si l'indicateur existe déjà (chercher les deux classes possibles)
        let indicateur = storiesButton.querySelector(".notification-indicator") || storiesButton.querySelector(".ui-notification-badge");

        // Si l'indicateur n'existe pas, on le crée
        if (!indicateur) {
          indicateur = document.createElement("span");
          // Utiliser les deux classes pour assurer la compatibilité
          indicateur.className = "notification-indicator ui-notification-badge";
          storiesButton.appendChild(indicateur);
        }

        // Met à jour le contenu de l'indicateur
        indicateur.textContent = nbNotifs > 9 ? "9+" : nbNotifs.toString();
        indicateur.style.display = "flex";
      }
      // Si le bouton existe mais qu'il n'y a pas de notifications non lues
      else if (storiesButton) {
        // Récupère l'indicateur s'il existe (chercher les deux classes possibles)
        const indicateur = storiesButton.querySelector(".notification-indicator") || storiesButton.querySelector(".ui-notification-badge");
        
        // Si l'indicateur existe, on le masque
        if (indicateur) {
          indicateur.style.display = "none";
        }
      }
      
      // Mettre à jour également l'indicateur dans la liste des profils du modal de déconnexion
      this.mettreAJourIndicateurNotificationProfilsListe();
      
      // Émettre un événement pour informer les autres modules
      if (MonHistoire.events && typeof MonHistoire.events.emit === 'function') {
        MonHistoire.events.emit("notificationUpdate", {
          profilId: profilId,
          count: nbNotifs
        });
      }
    } catch (error) {
      if (MonHistoire.logger) {
        MonHistoire.logger.sharingError("Erreur lors de la mise à jour de l'indicateur de notification", error);
      } else {
        console.error("Erreur lors de la mise à jour de l'indicateur de notification:", error);
      }
    }
  },
  
  /**
   * Recalcule le nombre de notifications non lues pour un profil spécifique
   * @param {string} profilId - ID du profil pour lequel recalculer les notifications
   * @returns {Promise} - Promise résolue quand le recalcul est terminé
   */
  async recalculerNotificationsNonLues(profilId) {
    try {
      const user = firebase.auth().currentUser;
      if (!user) return 0;
      
      // Réinitialiser le compteur
      MonHistoire.features.sharing.notificationsNonLues[profilId] = 0;
      
      // Déterminer la collection à vérifier
      let storiesRef;
      if (profilId === "parent") {
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
          .doc(profilId)
          .collection("stories")
          .where("nouvelleHistoire", "==", true);
      }
      
      // Compter le nombre de notifications non lues
      const snapshot = await storiesRef.get();
      MonHistoire.features.sharing.notificationsNonLues[profilId] = snapshot.size;
      
      if (MonHistoire.logger) {
        MonHistoire.logger.sharingInfo("Notifications recalculées pour le profil", {
          profilId: profilId,
          count: MonHistoire.features.sharing.notificationsNonLues[profilId]
        });
      }
      
      // Mettre à jour l'indicateur
      this.mettreAJourIndicateurNotification();
      this.mettreAJourIndicateurNotificationProfilsListe();
      
      return MonHistoire.features.sharing.notificationsNonLues[profilId];
    } catch (error) {
      if (MonHistoire.logger) {
        MonHistoire.logger.sharingError("Erreur lors du recalcul des notifications non lues", error);
      } else {
        console.error("Erreur lors du recalcul des notifications non lues:", error);
      }
      return 0;
    }
  },
  
  /**
   * Met à jour les indicateurs de notification dans la liste des profils du modal de déconnexion
   */
  mettreAJourIndicateurNotificationProfilsListe() {
    try {
      // S'assurer que les notifications non lues sont initialisées
      if (!MonHistoire.features.sharing.notificationsNonLues) {
        MonHistoire.features.sharing.notificationsNonLues = {};
      }
      
      // Récupère la liste des profils dans le modal de déconnexion
      const profilsList = document.getElementById("logout-profiles-list");
      
      // Si la liste n'existe pas, on ne fait rien
      if (!profilsList) return;
      
      // Parcourt tous les profils de la liste
      const profilItems = profilsList.querySelectorAll(".profile-item");
      profilItems.forEach(item => {
        // Récupère l'ID du profil
        const profilId = item.dataset.profilId;
        
        // Si l'ID existe et qu'il y a des notifications non lues pour ce profil
        if (profilId && MonHistoire.features.sharing.notificationsNonLues[profilId] && MonHistoire.features.sharing.notificationsNonLues[profilId] > 0) {
          // Récupère ou crée l'indicateur de notification (chercher les deux classes possibles)
          let indicateur = item.querySelector(".notification-indicator") || item.querySelector(".ui-notification-badge");
          
          if (!indicateur) {
            indicateur = document.createElement("span");
            // Utiliser les deux classes pour assurer la compatibilité
            indicateur.className = "notification-indicator ui-notification-badge";
            item.appendChild(indicateur);
          }
          
          // Met à jour le contenu de l'indicateur
          indicateur.textContent = MonHistoire.features.sharing.notificationsNonLues[profilId] > 9 ? "9+" : MonHistoire.features.sharing.notificationsNonLues[profilId].toString();
          indicateur.style.display = "flex";
        } else {
          // Si pas de notifications, masque l'indicateur s'il existe (chercher les deux classes possibles)
          const indicateur = item.querySelector(".notification-indicator") || item.querySelector(".ui-notification-badge");
          if (indicateur) {
            indicateur.style.display = "none";
          }
        }
      });
    } catch (error) {
      if (MonHistoire.logger) {
        MonHistoire.logger.sharingError("Erreur lors de la mise à jour des indicateurs de notification dans la liste des profils", error);
      } else {
        console.error("Erreur lors de la mise à jour des indicateurs de notification dans la liste des profils:", error);
      }
    }
  }
};
