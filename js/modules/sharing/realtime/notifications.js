// js/features/sharing/realtime/notifications.js
// Gestion des écouteurs Firebase Realtime Database pour les notifications

// S'assurer que les objets nécessaires existent
window.MonHistoire = window.MonHistoire || {};
MonHistoire.modules = MonHistoire.modules || {};
MonHistoire.modules.sharing = MonHistoire.modules.sharing || {};
MonHistoire.modules.sharing.realtime = MonHistoire.modules.sharing.realtime || {};

/**
 * Module de gestion des notifications en temps réel
 * Responsable de la configuration et de la gestion des écouteurs Firebase Realtime Database
 */
MonHistoire.modules.sharing.realtime.notifications = {
  /**
   * Initialisation du module
   */
  init() {
    console.log("Module de notifications en temps réel initialisé");
    
    // Initialiser les variables si nécessaire
    if (!MonHistoire.modules.sharing.realtimeListeners) {
      MonHistoire.modules.sharing.realtimeListeners = [];
    }
    
    if (!MonHistoire.modules.sharing.notificationsTraitees) {
      MonHistoire.modules.sharing.notificationsTraitees = new Set();
    }
  },
  
  /**
   * Configure l'écouteur de notifications en temps réel via Firebase Realtime Database
   */
  configurerEcouteurNotificationsRealtime() {
    // Détacher les écouteurs précédents
    this.detacherEcouteursRealtime();
    
    try {
      // Vérifier si Firebase est disponible
      if (typeof firebase === 'undefined') {
        console.warn("Firebase n'est pas disponible, impossible de configurer l'écouteur de notifications");
        return;
      }
      
      const user = firebase.auth().currentUser;
      if (!user) {
        // Utiliser un log moins alarmant car c'est un cas normal au démarrage
        console.log("Écouteur de notifications en attente: utilisateur non connecté");
        
        // Configurer un écouteur pour réessayer quand l'utilisateur se connecte
        const authListener = firebase.auth().onAuthStateChanged(newUser => {
          if (newUser) {
            // Détacher cet écouteur pour éviter les appels multiples
            authListener();
            // Réessayer de configurer l'écouteur après un court délai
            setTimeout(() => this.configurerEcouteurNotificationsRealtime(), 1000);
          }
        });
        
        return;
      }
      
      // Vérifier si Firebase Realtime Database est disponible
      if (!firebase.database) {
        console.log("Impossible de configurer l'écouteur de notifications Realtime: Firebase Realtime Database n'est pas disponible");
        MonHistoire.state.realtimeDbAvailable = false;
        return;
      }
      
      // Vérifier la connexion à Firebase Realtime Database
      const connectedRef = firebase.database().ref(".info/connected");
      const connectedListener = connectedRef.on("value", (snap) => {
        const isConnected = snap.val() === true;
        MonHistoire.state.realtimeDbConnected = isConnected;
        
        if (isConnected && (!MonHistoire.modules.sharing.realtimeListeners || MonHistoire.modules.sharing.realtimeListeners.length === 0)) {
          // Si on vient de se connecter et qu'aucun écouteur n'est actif, configurer les écouteurs
          setTimeout(() => this.configurerEcouteurNotificationsRealtime(), 500);
        }
      }, error => {
        console.error("Erreur lors de la vérification de la connexion à Firebase Realtime Database:", error);
        MonHistoire.state.realtimeDbConnected = false;
      });
      
      // Ajouter l'écouteur de connexion à la liste
      MonHistoire.modules.sharing.realtimeListeners.push({
        ref: connectedRef,
        detach: () => connectedRef.off("value", connectedListener)
      });
      
      // Si la connexion n'est pas établie, ne pas continuer
      if (MonHistoire.state.realtimeDbConnected === false) {
        console.log("Impossible de configurer l'écouteur de notifications Realtime: connexion inactive");
        return;
      }
      
      // S'assurer que le profilActif est correctement initialisé
      if (!MonHistoire.state.profilActif) {
        MonHistoire.state.profilActif = localStorage.getItem("profilActif")
          ? JSON.parse(localStorage.getItem("profilActif"))
          : { type: "parent" };
      }
      
      const profilId = MonHistoire.state.profilActif.type === "parent" ? "parent" : MonHistoire.state.profilActif.id;
      
      // Référence à la notification en temps réel pour le profil actif
      const notificationsRef = firebase.database()
        .ref(`users/${user.uid}/notifications/${profilId}`);
      
      // Créer un cache local pour éviter d'afficher plusieurs fois la même notification
      if (!MonHistoire.modules.sharing.notificationsTraitees) {
        MonHistoire.modules.sharing.notificationsTraitees = new Set();
      }
      
      // Configurer l'écouteur pour les nouvelles notifications
      const childAddedListener = notificationsRef.on('child_added', (snapshot) => {
        const notificationId = snapshot.key;
        const notification = snapshot.val();
        
        // Créer un identifiant unique plus robuste pour la notification
        const notificationUniqueId = `${notification.partageParProfil || ''}_${notification.partageParPrenom || ''}_${notification.timestamp || Date.now()}`;
        
        // Vérifier si la notification a déjà été traitée
        if (MonHistoire.modules.sharing.notificationsTraitees.has(notificationId) || 
            MonHistoire.modules.sharing.notificationsTraitees.has(notificationUniqueId)) {
          return;
        }
        
        // Ajouter la notification au cache avec les deux identifiants
        MonHistoire.modules.sharing.notificationsTraitees.add(notificationId);
        MonHistoire.modules.sharing.notificationsTraitees.add(notificationUniqueId);
        
        // Sauvegarder le cache dans localStorage
        try {
          localStorage.setItem('notificationsTraitees', 
            JSON.stringify([...MonHistoire.modules.sharing.notificationsTraitees]));
        } catch (e) {
          console.warn("Erreur lors de la sauvegarde du cache des notifications", e);
        }
        
        // Limiter la taille du cache (garder les 50 dernières notifications)
        if (MonHistoire.modules.sharing.notificationsTraitees.size > 50) {
          const iterator = MonHistoire.modules.sharing.notificationsTraitees.values();
          MonHistoire.modules.sharing.notificationsTraitees.delete(iterator.next().value);
        }
        
        // Vérifier si la notification est valide
        if (!notification || !notification.partageParPrenom) {
          // Supprimer les notifications invalides
          snapshot.ref.remove();
          return;
        }
        
        // Vérifier si la notification n'est pas trop ancienne (moins de 5 minutes)
        const maintenant = Date.now();
        const tempsNotification = notification.timestamp || maintenant;
        const differenceTemps = maintenant - tempsNotification;
        const cinqMinutesEnMs = 5 * 60 * 1000;
        
        if (differenceTemps > cinqMinutesEnMs) {
          // Supprimer les notifications trop anciennes
          snapshot.ref.remove();
          return;
        }
        
        // Vérifier si la notification n'a pas été envoyée par le profil actif lui-même
        if (notification.partageParProfil === profilId) {
          // Supprimer les notifications envoyées par soi-même
          snapshot.ref.remove();
          return;
        }
        
        // Au lieu d'incrémenter directement le compteur, recalculer le nombre de notifications
        if (MonHistoire.modules.sharing.notifications && 
            typeof MonHistoire.modules.sharing.notifications.recalculerNotificationsNonLues === 'function') {
          MonHistoire.modules.sharing.notifications.recalculerNotificationsNonLues(profilId);
        } else {
          console.warn("Fonction de recalcul des notifications non disponible");
          // Fallback: incrémenter directement le compteur (ancien comportement)
          MonHistoire.modules.sharing.notificationsNonLues[profilId] = (MonHistoire.modules.sharing.notificationsNonLues[profilId] || 0) + 1;
          
          // Mettre à jour l'indicateur de notification
          if (MonHistoire.modules.sharing.notifications) {
            MonHistoire.modules.sharing.notifications.mettreAJourIndicateurNotification();
          }
        }
        
        // Afficher la notification
        if (MonHistoire.modules.sharing.notifications) {
          MonHistoire.modules.sharing.notifications.afficherNotificationPartage(notification.partageParPrenom, null);
        }
        
        // Supprimer la notification après l'avoir affichée
        snapshot.ref.remove().catch(error => {
          console.warn("Erreur lors de la suppression de la notification:", error);
        });
        
        // Rafraîchir la liste des histoires si on est sur la page "Mes histoires"
        if (MonHistoire.state.currentScreen === "mes-histoires" && 
            MonHistoire.modules && 
            MonHistoire.modules.stories && 
            MonHistoire.modules.stories.management) {
          MonHistoire.modules.stories.management.afficherHistoiresSauvegardees();
        }
      }, error => {
        console.error("Erreur lors de l'écoute des nouvelles notifications:", error);
      });
      
      // Ajouter l'écouteur à la liste
      MonHistoire.modules.sharing.realtimeListeners.push({
        ref: notificationsRef,
        detach: () => notificationsRef.off('child_added', childAddedListener)
      });
      
      // Si on est sur le profil parent, configurer également des écouteurs pour tous les profils enfants
      if (MonHistoire.state.profilActif.type === "parent") {
        this.configurerEcouteursNotificationsProfilsEnfants(user);
      }
      
      // Nettoyer les anciennes notifications au démarrage
      notificationsRef.once('value', snapshot => {
        if (snapshot.exists()) {
          snapshot.forEach(childSnapshot => {
            const notification = childSnapshot.val();
            const maintenant = Date.now();
            const tempsNotification = notification.timestamp || 0;
            const differenceTemps = maintenant - tempsNotification;
            const cinqMinutesEnMs = 5 * 60 * 1000;
            
            if (differenceTemps > cinqMinutesEnMs) {
              childSnapshot.ref.remove().catch(error => {
                console.warn("Erreur lors du nettoyage d'une ancienne notification:", error);
              });
            }
          });
        }
      }).catch(error => {
        console.warn("Erreur lors du nettoyage des anciennes notifications:", error);
      });
      
      console.log("Écouteur de notifications Realtime configuré avec succès");
    } catch (error) {
      console.error("Erreur lors de la configuration de l'écouteur de notifications Realtime", error);
      
      // Planifier une nouvelle tentative après un délai
      setTimeout(() => {
        if (!MonHistoire.modules.sharing.realtimeListeners || MonHistoire.modules.sharing.realtimeListeners.length === 0) {
          this.configurerEcouteurNotificationsRealtime();
        }
      }, 10000); // Réessayer après 10 secondes
    }
  },
  
  /**
   * Détache tous les écouteurs Realtime
   */
  detacherEcouteursRealtime() {
    if (MonHistoire.modules.sharing.realtimeListeners && MonHistoire.modules.sharing.realtimeListeners.length > 0) {
      // Détacher les écouteurs précédents
      MonHistoire.modules.sharing.realtimeListeners.forEach(listener => {
        if (listener && listener.ref && typeof listener.detach === 'function') {
          try {
            listener.detach();
          } catch (e) {
            console.warn("Erreur lors du détachement d'un écouteur Realtime:", e);
          }
        }
      });
      MonHistoire.modules.sharing.realtimeListeners = [];
    } else {
      MonHistoire.modules.sharing.realtimeListeners = [];
    }
  },
  
  /**
   * Configure des écouteurs de notifications pour tous les profils enfants (quand on est sur le profil parent)
   * @param {Object} user - L'utilisateur Firebase actuel
   */
  async configurerEcouteursNotificationsProfilsEnfants(user) {
    try {
      // Récupérer tous les profils enfants
      const profilsEnfantsSnapshot = await firebase.firestore()
        .collection("users")
        .doc(user.uid)
        .collection("profils_enfant")
        .get();
      
      // Pour chaque profil enfant, configurer un écouteur de notifications
      for (const profilDoc of profilsEnfantsSnapshot.docs) {
        const profilId = profilDoc.id;
        
        // Référence aux notifications pour ce profil enfant
        const notificationsEnfantRef = firebase.database()
          .ref(`users/${user.uid}/notifications/${profilId}`);
        
        // Configurer l'écouteur pour les nouvelles notifications
        const childAddedListener = notificationsEnfantRef.on('child_added', (snapshot) => {
          const notificationId = snapshot.key;
          const notification = snapshot.val();
          
          // Vérifier si la notification a déjà été traitée
          if (MonHistoire.modules.sharing.notificationsTraitees.has(notificationId)) {
            return;
          }
          
          // Ajouter la notification au cache
          MonHistoire.modules.sharing.notificationsTraitees.add(notificationId);
          
          // Vérifier si la notification est valide
          if (!notification || !notification.partageParPrenom) {
            // Supprimer les notifications invalides
            snapshot.ref.remove();
            return;
          }
          
          // Vérifier si la notification n'est pas trop ancienne
          const maintenant = Date.now();
          const tempsNotification = notification.timestamp || maintenant;
          const differenceTemps = maintenant - tempsNotification;
          const cinqMinutesEnMs = 5 * 60 * 1000;
          
          if (differenceTemps > cinqMinutesEnMs) {
            // Supprimer les notifications trop anciennes
            snapshot.ref.remove();
            return;
          }
          
          // Au lieu d'incrémenter directement le compteur, recalculer le nombre de notifications
          if (MonHistoire.modules.sharing.notifications && 
              typeof MonHistoire.modules.sharing.notifications.recalculerNotificationsNonLues === 'function') {
            MonHistoire.modules.sharing.notifications.recalculerNotificationsNonLues(profilId);
          } else {
            console.warn("Fonction de recalcul des notifications non disponible pour le profil enfant");
            // Fallback: incrémenter directement le compteur (ancien comportement)
            MonHistoire.modules.sharing.notificationsNonLues[profilId] = (MonHistoire.modules.sharing.notificationsNonLues[profilId] || 0) + 1;
            
            // Mettre à jour l'indicateur de notification dans la liste des profils
            if (MonHistoire.modules.sharing.notifications) {
              MonHistoire.modules.sharing.notifications.mettreAJourIndicateurNotificationProfilsListe();
            }
          }
          
          // Supprimer la notification après l'avoir traitée
          snapshot.ref.remove().catch(error => {
            console.warn(`Erreur lors de la suppression de la notification pour le profil ${profilId}:`, error);
          });
          
        }, error => {
          console.error(`Erreur lors de l'écoute des notifications pour le profil enfant ${profilId}:`, error);
        });
        
        // Ajouter l'écouteur à la liste
        MonHistoire.modules.sharing.realtimeListeners.push({
          ref: notificationsEnfantRef,
          detach: () => notificationsEnfantRef.off('child_added', childAddedListener)
        });
        
        // Nettoyer les anciennes notifications au démarrage
        notificationsEnfantRef.once('value', snapshot => {
          if (snapshot.exists()) {
            snapshot.forEach(childSnapshot => {
              const notification = childSnapshot.val();
              const maintenant = Date.now();
              const tempsNotification = notification.timestamp || 0;
              const differenceTemps = maintenant - tempsNotification;
              const cinqMinutesEnMs = 5 * 60 * 1000;
              
              if (differenceTemps > cinqMinutesEnMs) {
                childSnapshot.ref.remove().catch(error => {
                  console.warn(`Erreur lors du nettoyage d'une ancienne notification pour le profil ${profilId}:`, error);
                });
              }
            });
          }
        }).catch(error => {
          console.warn(`Erreur lors du nettoyage des anciennes notifications pour le profil ${profilId}:`, error);
        });
      }
      
      console.log(`Écouteurs de notifications configurés pour ${profilsEnfantsSnapshot.size} profils enfants`);
    } catch (error) {
      console.error("Erreur lors de la configuration des écouteurs de notifications pour les profils enfants:", error);
    }
  }
};
