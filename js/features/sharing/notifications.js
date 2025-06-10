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
  /**
   * Initialisation du module
   */
  init() {
    console.log("Module de notifications de partage initialisé");
    
    // Initialiser les écouteurs d'événements pour les notifications
    this.initNotificationListeners();
    
    // Exposer les fonctions importantes au module principal
    if (MonHistoire.features.sharing) {
      MonHistoire.features.sharing.mettreAJourIndicateurNotification = this.mettreAJourIndicateurNotification.bind(this);
      MonHistoire.features.sharing.mettreAJourIndicateurNotificationProfilsListe = this.mettreAJourIndicateurNotificationProfilsListe.bind(this);
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
      
      // Écouteur pour les changements de profil
      if (MonHistoire.events && typeof MonHistoire.events.on === 'function') {
        MonHistoire.events.on("profilChange", () => {
          // Mettre à jour l'indicateur de notification après un court délai
          // pour laisser le temps aux données de se charger
          setTimeout(() => {
            this.mettreAJourIndicateurNotification();
            this.mettreAJourIndicateurNotificationProfilsListe();
          }, 1000);
        });
      } else {
        console.warn("Système d'événements non disponible pour les notifications");
      }
    } catch (error) {
      console.error("Erreur lors de l'initialisation des écouteurs de notifications:", error);
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
      MonHistoire.features.sharing.notificationsNonLues[profilId] = snapshot.size;
      
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
          MonHistoire.features.sharing.notificationsNonLues[profilId] = storiesEnfantSnapshot.size;
        }
      }
      
      console.log("Compteur de notifications initialisé:", MonHistoire.features.sharing.notificationsNonLues);
    } catch (error) {
      console.error("Erreur lors de l'initialisation du compteur de notifications:", error);
    }
  },
  
  /**
   * Affiche la notification de partage
   * @param {string} prenomPartageur - Prénom de la personne qui a partagé l'histoire
   * @param {Object} histoireRef - Référence Firestore à l'histoire partagée
   */
  afficherNotificationPartage(prenomPartageur, histoireRef) {
    const notification = document.getElementById("notification-partage");
    const message = document.getElementById("notification-message");
    
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
    
    // Annule le timeout précédent s'il existe
    if (MonHistoire.features.sharing.notificationTimeout) {
      clearTimeout(MonHistoire.features.sharing.notificationTimeout);
      MonHistoire.features.sharing.notificationTimeout = null;
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
          
          // Met à jour le document
          MonHistoire.features.sharing.histoireNotifieeActuelle.update({ 
            nouvelleHistoire: nouvelleHistoire,
            vueParProfils: vueParProfils,
            vueLe: firebase.firestore.FieldValue.serverTimestamp()
          }).catch(error => console.error("Erreur lors du marquage de l'histoire comme vue:", error));
        }
      }).catch(error => console.error("Erreur lors de la récupération de l'histoire:", error));
      
      // Réinitialise la référence
      MonHistoire.features.sharing.histoireNotifieeActuelle = null;
      
      // Met à jour l'indicateur de notification
      this.mettreAJourIndicateurNotification();
    }
    
    // Ajoute l'animation de sortie
    notification.classList.remove("show");
    notification.classList.add("animate-out");
    
    // Supprime les classes et les écouteurs après l'animation
    setTimeout(() => {
      notification.classList.remove("animate-out");
      
      // Supprime les écouteurs d'événements
      notification.removeEventListener("touchstart", this.demarrerSwipeNotification);
      notification.removeEventListener("touchmove", this.deplacerSwipeNotification);
      notification.removeEventListener("touchend", this.terminerSwipeNotification);
      notification.removeEventListener("mousedown", this.demarrerSwipeNotification);
      notification.removeEventListener("mousemove", this.deplacerSwipeNotification);
      notification.removeEventListener("mouseup", this.terminerSwipeNotification);
      notification.removeEventListener("mouseleave", this.terminerSwipeNotification);
    }, 500);
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
      this.mettreAJourIndicateurNotificationProfilsListe();
      
      // Émettre un événement pour informer les autres modules
      if (MonHistoire.events && typeof MonHistoire.events.emit === 'function') {
        MonHistoire.events.emit("notificationUpdate", {
          profilId: profilId,
          count: nbNotifs
        });
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour de l'indicateur de notification:", error);
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
          // Récupère ou crée l'indicateur de notification
          let indicateur = item.querySelector(".notification-indicator");
          
          if (!indicateur) {
            indicateur = document.createElement("span");
            indicateur.className = "notification-indicator";
            item.appendChild(indicateur);
          }
          
          // Met à jour le contenu de l'indicateur
          indicateur.textContent = MonHistoire.features.sharing.notificationsNonLues[profilId] > 9 ? "9+" : MonHistoire.features.sharing.notificationsNonLues[profilId].toString();
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
      console.error("Erreur lors de la mise à jour des indicateurs de notification dans la liste des profils:", error);
    }
  }
};
