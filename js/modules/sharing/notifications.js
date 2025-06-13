// js/modules/sharing/notifications.js
// Gestion des notifications de partage d'histoires

// S'assurer que les namespaces existent
window.MonHistoire = window.MonHistoire || {};
MonHistoire.modules = MonHistoire.modules || {};
MonHistoire.modules.sharing = MonHistoire.modules.sharing || {};

// Module de gestion des notifications
(function() {
  // Variables privées
  let notificationsNonLues = {};
  let notificationsTraitees = new Set();
  let notificationTimeout = null;
  let notificationSwipeStartX = 0;
  let notificationSwipeStartY = 0;
  let histoireNotifieeActuelle = null;
  
  // Compteur de tentatives d'initialisation des écouteurs
  let initAttempts = 0;
  // Nombre maximal de tentatives
  const maxInitAttempts = 10;
  
  /**
   * Initialisation du module
   */
  function init() {
    if (MonHistoire.logger) {
      MonHistoire.logger.sharingInfo("Module de notifications de partage initialisé");
    } else {
      console.log("Module de notifications de partage initialisé");
    }
    
    // Charger le cache des notifications traitées depuis localStorage
    try {
      const cachedNotifications = localStorage.getItem('notificationsTraitees');
      if (cachedNotifications) {
        notificationsTraitees = new Set(JSON.parse(cachedNotifications));
      }
    } catch (e) {
      console.error("Erreur lors du chargement du cache des notifications", e);
    }
    
    // Initialiser les écouteurs d'événements pour les notifications
    initNotificationListeners();
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
      
      // Vérifier la disponibilité du système d'événements
      if (!MonHistoire.events || typeof MonHistoire.events.on !== 'function') {
        if (MonHistoire.common && typeof MonHistoire.common.waitForEvents === 'function') {
          // Utiliser la fonction utilitaire pour attendre que MonHistoire.events soit disponible
          if (MonHistoire.logger) {
            MonHistoire.logger.sharingInfo("Attente du système d'événements pour les notifications", {
              waitMethod: "waitForEvents",
              maxAttempts: maxInitAttempts
            });
          }
          
          MonHistoire.common.waitForEvents(() => {
            // Écouteur pour les changements de profil
            MonHistoire.events.on("profilChange", () => {
              // Mettre à jour l'indicateur de notification après un court délai
              // pour laisser le temps aux données de se charger
              setTimeout(() => {
                mettreAJourIndicateurNotification();
                mettreAJourIndicateurNotificationProfilsListe();
              }, 1000);
            });
            
            // Réinitialiser le compteur de tentatives
            initAttempts = 0;
            
            if (MonHistoire.logger) {
              MonHistoire.logger.sharingInfo("Écouteurs d'événements de notifications initialisés avec succès après attente");
            }
          }, maxInitAttempts);
        } else {
          // Fallback si MonHistoire.common n'est pas disponible
          if (initAttempts < maxInitAttempts) {
            initAttempts++;
            
            if (MonHistoire.logger) {
              MonHistoire.logger.sharingInfo("Tentative d'initialisation des écouteurs de notifications", {
                attempt: initAttempts,
                maxAttempts: maxInitAttempts
              });
            }
            
            setTimeout(() => initNotificationListeners(), 200);
          } else {
            if (MonHistoire.logger) {
              MonHistoire.logger.sharingError("Système d'événements non disponible pour les notifications après plusieurs tentatives", {
                attempts: initAttempts,
                maxAttempts: maxInitAttempts
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
            mettreAJourIndicateurNotification();
            mettreAJourIndicateurNotificationProfilsListe();
          }, 1000);
        });
        
        // Réinitialiser le compteur de tentatives
        initAttempts = 0;
      }
    } catch (error) {
      if (MonHistoire.logger) {
        MonHistoire.logger.sharingError("Erreur lors de l'initialisation des écouteurs de notifications", error);
      } else {
        console.error("Erreur lors de l'initialisation des écouteurs de notifications:", error);
      }
    }
  }
  
  /**
   * Initialise le compteur de notifications non lues pour le profil actif
   * @param {Object} user - L'utilisateur Firebase actuel
   * @returns {Promise} - Promise résolue quand l'initialisation est terminée
   */
  async function initialiserCompteurNotifications(user) {
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
      notificationsNonLues[profilId] = 0;
      
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
      notificationsNonLues[profilId] = snapshot.size;
      
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
          notificationsNonLues[enfantProfilId] = 0;
          
          const storiesEnfantRef = firebase.firestore()
            .collection("users")
            .doc(user.uid)
            .collection("profils_enfant")
            .doc(enfantProfilId)
            .collection("stories")
            .where("nouvelleHistoire", "==", true);
            
          const storiesEnfantSnapshot = await storiesEnfantRef.get();
          notificationsNonLues[enfantProfilId] = storiesEnfantSnapshot.size;
        }
      }
      
      if (MonHistoire.logger) {
        MonHistoire.logger.sharingInfo("Compteur de notifications initialisé", {
          notificationsCount: Object.keys(notificationsNonLues).length,
          status: "OK"
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
   * Affiche la notification de partage
   * @param {string} prenomPartageur - Prénom de la personne qui a partagé l'histoire
   * @param {Object} histoireRef - Référence Firestore à l'histoire partagée
   */
  function afficherNotificationPartage(prenomPartageur, histoireRef) {
    const notification = document.getElementById("notification-partage");
    const message = document.getElementById("notification-message");
    
    if (!notification || !message) return;
    
    // Stocke la référence à l'histoire pour pouvoir la marquer comme vue plus tard
    histoireNotifieeActuelle = histoireRef;
    
    // Définit le message
    message.textContent = `${prenomPartageur} t'a partagé une histoire`;
    
    // Supprime les anciens écouteurs d'événements pour éviter les doublons
    notification.removeEventListener("touchstart", demarrerSwipeNotification);
    notification.removeEventListener("touchmove", deplacerSwipeNotification);
    notification.removeEventListener("touchend", terminerSwipeNotification);
    notification.removeEventListener("mousedown", demarrerSwipeNotification);
    notification.removeEventListener("mousemove", deplacerSwipeNotification);
    notification.removeEventListener("mouseup", terminerSwipeNotification);
    notification.removeEventListener("mouseleave", terminerSwipeNotification);
    
    // Ajoute les écouteurs d'événements pour le swipe
    notification.addEventListener("touchstart", demarrerSwipeNotification, { passive: true });
    notification.addEventListener("touchmove", deplacerSwipeNotification, { passive: true });
    notification.addEventListener("touchend", terminerSwipeNotification, { passive: true });
    notification.addEventListener("mousedown", demarrerSwipeNotification);
    notification.addEventListener("mousemove", deplacerSwipeNotification);
    notification.addEventListener("mouseup", terminerSwipeNotification);
    notification.addEventListener("mouseleave", terminerSwipeNotification);
    
    // Annule le timeout précédent s'il existe
    if (notificationTimeout) {
      clearTimeout(notificationTimeout);
      notificationTimeout = null;
    }
    
    // Affiche la notification avec animation
    notification.classList.remove("show", "animate-out");
    notification.classList.add("animate-in");
    
    // Supprime la classe d'animation après qu'elle soit terminée
    setTimeout(() => {
      notification.classList.remove("animate-in");
      notification.classList.add("show");
    }, 500);
    
    // Ferme automatiquement la notification après 5 secondes
    notificationTimeout = setTimeout(() => {
      fermerNotificationPartage();
    }, 5000);
  }
  
  /**
   * Ferme la notification de partage
   * @param {boolean} marquerCommeVue - Si true, marque l'histoire comme vue
   */
  function fermerNotificationPartage(marquerCommeVue = true) {
    const notification = document.getElementById("notification-partage");
    if (!notification) return;
    
    // Annule le timeout si existant
    if (notificationTimeout) {
      clearTimeout(notificationTimeout);
      notificationTimeout = null;
    }
    
    // Marque l'histoire comme vue si demandé et si une histoire est en cours de notification
    if (marquerCommeVue && histoireNotifieeActuelle) {
      // Récupère l'ID du profil actif
      const profilId = MonHistoire.state.profilActif.type === "parent" ? "parent" : MonHistoire.state.profilActif.id;
      
      // Décrémente le compteur de notifications non lues
      if (notificationsNonLues[profilId] && notificationsNonLues[profilId] > 0) {
        notificationsNonLues[profilId]--;
      }
      
      try {
        // Vérifier que histoireNotifieeActuelle est valide avant d'appeler get()
        if (histoireNotifieeActuelle && 
            typeof histoireNotifieeActuelle.get === 'function') {
          
          // Met à jour le document Firestore
          histoireNotifieeActuelle.get().then(doc => {
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
              if (histoireNotifieeActuelle && 
                  typeof histoireNotifieeActuelle.update === 'function') {
                
                // Met à jour le document
                histoireNotifieeActuelle.update({ 
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
      histoireNotifieeActuelle = null;
      
      // Sauvegarder le cache des notifications traitées
      try {
        localStorage.setItem('notificationsTraitees', 
          JSON.stringify([...notificationsTraitees]));
      } catch (e) {
        console.error("Erreur lors de la sauvegarde du cache des notifications", e);
      }
      
      // Met à jour l'indicateur de notification
      mettreAJourIndicateurNotification();
    }
    
    // Ajoute l'animation de sortie
    notification.classList.remove("show");
    notification.classList.add("animate-out");
    
    // Supprime les classes et les écouteurs après l'animation
    setTimeout(() => {
      notification.classList.remove("animate-out");
      
      // Supprime les écouteurs d'événements
      notification.removeEventListener("touchstart", demarrerSwipeNotification);
      notification.removeEventListener("touchmove", deplacerSwipeNotification);
      notification.removeEventListener("touchend", terminerSwipeNotification);
      notification.removeEventListener("mousedown", demarrerSwipeNotification);
      notification.removeEventListener("mousemove", deplacerSwipeNotification);
      notification.removeEventListener("mouseup", terminerSwipeNotification);
      notification.removeEventListener("mouseleave", terminerSwipeNotification);
    }, 500);
  }
  
  /**
   * Gestion du swipe - Début
   * @param {Event} e - Événement de début de swipe
   */
  function demarrerSwipeNotification(e) {
    // Annule le timeout automatique
    if (notificationTimeout) {
      clearTimeout(notificationTimeout);
      notificationTimeout = null;
    }
    
    // Enregistre la position de départ
    if (e.type === "touchstart") {
      notificationSwipeStartX = e.touches[0].clientX;
      notificationSwipeStartY = e.touches[0].clientY;
    } else {
      notificationSwipeStartX = e.clientX;
      notificationSwipeStartY = e.clientY;
    }
  }
  
  /**
   * Gestion du swipe - Déplacement
   * @param {Event} e - Événement de déplacement
   */
  function deplacerSwipeNotification(e) {
    // Ne fait rien si on n'a pas commencé un swipe
    if (notificationSwipeStartX === 0 && notificationSwipeStartY === 0) return;
    
    let currentX, currentY;
    
    if (e.type === "touchmove") {
      currentX = e.touches[0].clientX;
      currentY = e.touches[0].clientY;
    } else {
      currentX = e.clientX;
      currentY = e.clientY;
    }
    
    // Calcule la distance parcourue
    const distanceX = Math.abs(currentX - notificationSwipeStartX);
    const distanceY = Math.abs(currentY - notificationSwipeStartY);
    
    // Si la distance est suffisante, ferme la notification
    if (distanceX > 50 || distanceY > 50) {
      fermerNotificationPartage();
      
      // Réinitialise les positions
      notificationSwipeStartX = 0;
      notificationSwipeStartY = 0;
    }
  }
  
  /**
   * Gestion du swipe - Fin
   */
  function terminerSwipeNotification() {
    // Réinitialise les positions
    notificationSwipeStartX = 0;
    notificationSwipeStartY = 0;
  }
  
  /**
   * Gestion du clic sur la notification
   * @param {Event} e - Événement de clic
   */
  function clicNotificationPartage(e) {
    // Empêche la propagation du clic
    e.preventDefault();
    e.stopPropagation();
    
    // Ferme la notification
    fermerNotificationPartage();
    
    // Redirige vers "Mes histoires"
    if (MonHistoire.modules.core && MonHistoire.modules.core.navigation) {
      MonHistoire.modules.core.navigation.showScreen("mes-histoires");
    }
  }
  
  /**
   * Met à jour l'indicateur de notification dans l'interface utilisateur
   */
  function mettreAJourIndicateurNotification() {
    try {
      // S'assurer que l'état est correctement initialisé
      if (!MonHistoire.state || !MonHistoire.state.profilActif) {
        console.warn("État non initialisé pour la mise à jour des notifications");
        return;
      }
      
      // Récupère l'ID du profil actif
      const profilId = MonHistoire.state.profilActif.type === "parent" ? "parent" : MonHistoire.state.profilActif.id;
      
      // S'assurer que les notifications non lues sont initialisées
      if (!notificationsNonLues) {
        notificationsNonLues = {};
      }
      
      // Récupère le nombre de notifications non lues pour ce profil
      const nbNotifs = notificationsNonLues[profilId] || 0;
      
      // Récupère l'élément d'icône utilisateur (où on affichera l'indicateur)
      const userIcon = document.getElementById("user-icon");
      
      // Si l'élément existe et qu'il y a des notifications non lues
      if (userIcon && nbNotifs > 0) {
        // Vérifie si l'indicateur existe déjà
        let indicateur = userIcon.querySelector(".notification-indicator");
        
        // Si l'indicateur n'existe pas, on le crée
        if (!indicateur) {
          indicateur = document.createElement("span");
          indicateur.className = "notification-indicator";
          userIcon.appendChild(indicateur);
        }
        
        // Met à jour le contenu de l'indicateur
        indicateur.textContent = nbNotifs > 9 ? "9+" : nbNotifs.toString();
        indicateur.style.display = "flex";
      } 
      // Si l'élément existe mais qu'il n'y a pas de notifications non lues
      else if (userIcon) {
        // Récupère l'indicateur s'il existe
        const indicateur = userIcon.querySelector(".notification-indicator");
        
        // Si l'indicateur existe, on le masque
        if (indicateur) {
          indicateur.style.display = "none";
        }
      }
      
      // Mettre à jour également l'indicateur dans la liste des profils du modal de déconnexion
      mettreAJourIndicateurNotificationProfilsListe();
      
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
  }
  
  /**
   * Recalcule le nombre de notifications non lues pour un profil spécifique
   * @param {string} profilId - ID du profil pour lequel recalculer les notifications
   * @returns {Promise} - Promise résolue quand le recalcul est terminé
   */
  async function recalculerNotificationsNonLues(profilId) {
    try {
      const user = firebase.auth().currentUser;
      if (!user) return 0;
      
      // Réinitialiser le compteur
      notificationsNonLues[profilId] = 0;
      
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
      notificationsNonLues[profilId] = snapshot.size;
      
      if (MonHistoire.logger) {
        MonHistoire.logger.sharingInfo("Notifications recalculées pour le profil", {
          profilId: profilId,
          count: notificationsNonLues[profilId]
        });
      }
      
      // Mettre à jour l'indicateur
      mettreAJourIndicateurNotification();
      mettreAJourIndicateurNotificationProfilsListe();
      
      return notificationsNonLues[profilId];
    } catch (error) {
      if (MonHistoire.logger) {
        MonHistoire.logger.sharingError("Erreur lors du recalcul des notifications non lues", error);
      } else {
        console.error("Erreur lors du recalcul des notifications non lues:", error);
      }
      return 0;
    }
  }
  
  /**
   * Met à jour les indicateurs de notification dans la liste des profils du modal de déconnexion
   */
  function mettreAJourIndicateurNotificationProfilsListe() {
    try {
      // S'assurer que les notifications non lues sont initialisées
      if (!notificationsNonLues) {
        notificationsNonLues = {};
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
        if (profilId && notificationsNonLues[profilId] && notificationsNonLues[profilId] > 0) {
          // Récupère ou crée l'indicateur de notification
          let indicateur = item.querySelector(".notification-indicator");
          
          if (!indicateur) {
            indicateur = document.createElement("span");
            indicateur.className = "notification-indicator";
            item.appendChild(indicateur);
          }
          
          // Met à jour le contenu de l'indicateur
          indicateur.textContent = notificationsNonLues[profilId] > 9 ? "9+" : notificationsNonLues[profilId].toString();
          indicateur.style.display = "flex";
        } else {
          // Si pas de notifications, masque l'indicateur s'il existe
          const indicateur = item.querySelector(".notification-indicator");
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

  // API publique
  MonHistoire.modules.sharing.notifications = {
    init: init,
    initialiserCompteurNotifications: initialiserCompteurNotifications,
    afficherNotificationPartage: afficherNotificationPartage,
    fermerNotificationPartage: fermerNotificationPartage,
    mettreAJourIndicateurNotification: mettreAJourIndicateurNotification,
    mettreAJourIndicateurNotificationProfilsListe: mettreAJourIndicateurNotificationProfilsListe,
    recalculerNotificationsNonLues: recalculerNotificationsNonLues
  };
})();
