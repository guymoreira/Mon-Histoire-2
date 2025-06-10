// js/features/sharing/realtime.js
// Gestion des écouteurs en temps réel pour les notifications de partage

// S'assurer que les objets nécessaires existent
window.MonHistoire = window.MonHistoire || {};
MonHistoire.features = MonHistoire.features || {};
MonHistoire.features.sharing = MonHistoire.features.sharing || {};

// Module de gestion des écouteurs en temps réel
MonHistoire.features.sharing.realtime = {
  // Initialisation du module
  init() {
    console.log("Module d'écouteurs en temps réel pour le partage initialisé");
    
    // Configurer l'écouteur de notifications en temps réel via Firebase Realtime Database
    this.configurerEcouteurNotificationsRealtime();
  },
  
  // Configure un écouteur en temps réel pour les nouvelles histoires partagées
  configurerEcouteurHistoiresPartagees() {
    try {
      // Arrête les écouteurs précédents s'ils existent
      if (MonHistoire.features.sharing.histoiresPartageesListener) {
        if (Array.isArray(MonHistoire.features.sharing.histoiresPartageesListener)) {
          MonHistoire.features.sharing.histoiresPartageesListener.forEach(listener => {
            if (typeof listener === 'function') {
              try {
                listener();
              } catch (e) {
                MonHistoire.logger.error("Erreur lors de l'arrêt d'un écouteur", e);
              }
            }
          });
        } else if (typeof MonHistoire.features.sharing.histoiresPartageesListener === 'function') {
          try {
            MonHistoire.features.sharing.histoiresPartageesListener();
          } catch (e) {
            MonHistoire.logger.error("Erreur lors de l'arrêt de l'écouteur", e);
          }
        }
        MonHistoire.features.sharing.histoiresPartageesListener = [];
      } else {
        MonHistoire.features.sharing.histoiresPartageesListener = [];
      }

      // Vérifier si l'utilisateur est connecté
      const user = firebase.auth().currentUser;
      if (!user) {
        MonHistoire.logger.warning("Impossible de configurer les écouteurs: utilisateur non connecté");
        // Configurer un écouteur pour réessayer quand l'utilisateur se connecte
        firebase.auth().onAuthStateChanged(newUser => {
          if (newUser && !MonHistoire.features.sharing.histoiresPartageesListener.length) {
            setTimeout(() => this.configurerEcouteurHistoiresPartagees(), 1000);
          }
        });
        return;
      }
      
      // Vérifier si la connexion est active
      if (!MonHistoire.state.isConnected) {
        MonHistoire.logger.warning("Impossible de configurer les écouteurs: connexion inactive");
        // Configurer un écouteur pour réessayer quand la connexion est rétablie
        MonHistoire.events.on("connectionStateChanged", isConnected => {
          if (isConnected && !MonHistoire.features.sharing.histoiresPartageesListener.length) {
            setTimeout(() => this.configurerEcouteurHistoiresPartagees(), 1000);
          }
        });
        return;
      }
      
      // Vérifier si Firebase Realtime Database est disponible
      if (MonHistoire.state.realtimeDbAvailable === false) {
        MonHistoire.logger.warning("Impossible de configurer les écouteurs: Firebase Realtime Database n'est pas disponible");
        return;
      }
      
      // 1. Configurer l'écouteur pour le profil actif
      this.configurerEcouteurProfilActif(user);
      
      // 2. Si on est sur le profil parent, configurer des écouteurs pour tous les profils enfants
      if (MonHistoire.state.profilActif.type === "parent") {
        this.configurerEcouteursProfilsEnfants(user);
      } 
      // 3. Si on est sur un profil enfant, configurer un écouteur pour le profil parent
      else {
        this.configurerEcouteurProfilParent(user);
      }
      
      MonHistoire.logger.info("Écouteurs de notifications configurés avec succès");
    } catch (error) {
      MonHistoire.logger.error("Erreur lors de la configuration des écouteurs de notifications", error);
      // Planifier une nouvelle tentative après un délai
      setTimeout(() => {
        if (!MonHistoire.features.sharing.histoiresPartageesListener || !MonHistoire.features.sharing.histoiresPartageesListener.length) {
          MonHistoire.logger.info("Nouvelle tentative de configuration des écouteurs de notifications");
          this.configurerEcouteurHistoiresPartagees();
        }
      }, 5000);
    }
  },
  
  // Configure l'écouteur pour le profil actif
  configurerEcouteurProfilActif(user) {
    // Détermine la collection à surveiller selon le profil actif
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

    // Configure l'écouteur en temps réel
    const listener = storiesRef.onSnapshot(snapshot => {
      // Vérifie s'il y a des changements
      const changesCount = snapshot.docChanges().length;
      if (changesCount === 0) return;

      // Parcourt les documents ajoutés ou modifiés
      snapshot.docChanges().forEach(change => {
        // Ne traite que les documents ajoutés ou modifiés
        if (change.type === "added" || change.type === "modified") {
          const data = change.doc.data();
          
          // Vérifie si l'histoire n'a pas été partagée par le profil actif lui-même
          // (sauf pour le profil parent qui doit voir toutes les notifications)
          const estPartageParProfilActif = 
            MonHistoire.state.profilActif.type !== "parent" && 
            data.partageParProfil === MonHistoire.state.profilActif.id;
          
          // Vérifier si cette notification a déjà été affichée récemment
          const notificationId = change.doc.id;
          if (!MonHistoire.features.sharing.notificationsTraitees) {
            MonHistoire.features.sharing.notificationsTraitees = new Set();
          }
          
          // Si la notification n'a pas déjà été traitée et n'est pas partagée par le profil actif
          if (data.partageParPrenom && !estPartageParProfilActif && !MonHistoire.features.sharing.notificationsTraitees.has(notificationId)) {
            // Ajouter l'ID à la liste des notifications traitées
            MonHistoire.features.sharing.notificationsTraitees.add(notificationId);
            
            // Incrémente le compteur de notifications non lues
            const profilId = MonHistoire.state.profilActif.type === "parent" ? "parent" : MonHistoire.state.profilActif.id;
            MonHistoire.features.sharing.notificationsNonLues[profilId] = (MonHistoire.features.sharing.notificationsNonLues[profilId] || 0) + 1;
            
            // Mettre à jour l'indicateur de notification dans l'interface utilisateur
            if (MonHistoire.features.sharing.notifications) {
              MonHistoire.features.sharing.notifications.mettreAJourIndicateurNotification();
            }
            
            // Affiche la notification sans marquer l'histoire comme vue immédiatement
            if (MonHistoire.features.sharing.notifications) {
              MonHistoire.features.sharing.notifications.afficherNotificationPartage(data.partageParPrenom, change.doc.ref);
            }
          }
        }
      });
    }, error => {
      console.error("Erreur lors de l'écoute des histoires partagées pour le profil actif:", error);
    });
    
    MonHistoire.features.sharing.histoiresPartageesListener.push(listener);
  },
  
  // Configure des écouteurs pour tous les profils enfants (quand on est sur le profil parent)
  configurerEcouteursProfilsEnfants(user) {
    // Récupère tous les profils enfants
    firebase.firestore()
      .collection("users")
      .doc(user.uid)
      .collection("profils_enfant")
      .get()
      .then(snapshot => {
        snapshot.forEach(doc => {
          const profilId = doc.id;
          const profilData = doc.data();
          
          // Configure un écouteur pour ce profil enfant
          const storiesRef = firebase.firestore()
            .collection("users")
            .doc(user.uid)
            .collection("profils_enfant")
            .doc(profilId)
            .collection("stories")
            .where("nouvelleHistoire", "==", true);
            
          const listener = storiesRef.onSnapshot(storiesSnapshot => {
            const changesCount = storiesSnapshot.docChanges().length;
            if (changesCount === 0) return;
            
            storiesSnapshot.docChanges().forEach(change => {
              if (change.type === "added") {
                const data = change.doc.data();
                
                if (data.partageParPrenom) {
                  // Affiche la notification avec le nom du profil enfant
                  const message = `${data.partageParPrenom} a partagé une histoire avec ${profilData.prenom}`;
                  if (MonHistoire.features.sharing.notifications) {
                    MonHistoire.features.sharing.notifications.afficherNotificationPartage(message, change.doc.ref);
                  }
                }
              }
            });
          }, error => {
            console.error(`Erreur lors de l'écoute des histoires partagées pour le profil enfant ${profilId}:`, error);
          });
          
          MonHistoire.features.sharing.histoiresPartageesListener.push(listener);
        });
      })
      .catch(error => {
        console.error("Erreur lors de la récupération des profils enfants:", error);
      });
  },
  
  // Configure un écouteur pour le profil parent (quand on est sur un profil enfant)
  configurerEcouteurProfilParent(user) {
    const storiesRef = firebase.firestore()
      .collection("users")
      .doc(user.uid)
      .collection("stories")
      .where("nouvelleHistoire", "==", true);
      
    const listener = storiesRef.onSnapshot(snapshot => {
      const changesCount = snapshot.docChanges().length;
      if (changesCount === 0) return;
      
      snapshot.docChanges().forEach(change => {
        if (change.type === "added" || change.type === "modified") {
          const data = change.doc.data();
          
          // Vérifier si cette histoire est destinée au profil actif
          const destinataireProfil = data.destinataireProfil;
          const profilActifId = MonHistoire.state.profilActif.id;
          
          // Si l'histoire est destinée au profil actif ou à tous les profils enfants
          if (data.partageParPrenom && 
              (destinataireProfil === profilActifId || destinataireProfil === "tous_enfants")) {
            
            // Vérifier si cette notification a déjà été affichée récemment
            const notificationId = change.doc.id;
            if (!MonHistoire.features.sharing.notificationsTraitees) {
              MonHistoire.features.sharing.notificationsTraitees = new Set();
            }
            
            // Si la notification n'a pas déjà été traitée
            if (!MonHistoire.features.sharing.notificationsTraitees.has(notificationId)) {
              // Ajouter l'ID à la liste des notifications traitées
              MonHistoire.features.sharing.notificationsTraitees.add(notificationId);
              
              // Incrémente le compteur de notifications non lues
              const profilId = MonHistoire.state.profilActif.id;
              MonHistoire.features.sharing.notificationsNonLues[profilId] = (MonHistoire.features.sharing.notificationsNonLues[profilId] || 0) + 1;
              
              // Mettre à jour l'indicateur de notification dans l'interface utilisateur
              if (MonHistoire.features.sharing.notifications) {
                MonHistoire.features.sharing.notifications.mettreAJourIndicateurNotification();
              }
              
              // Affiche la notification
              if (MonHistoire.features.sharing.notifications) {
                MonHistoire.features.sharing.notifications.afficherNotificationPartage(data.partageParPrenom, change.doc.ref);
              }
            }
          }
        }
      });
    }, error => {
      console.error("Erreur lors de l'écoute des histoires partagées pour le profil parent:", error);
    });
    
    MonHistoire.features.sharing.histoiresPartageesListener.push(listener);
  },
  
  // Configure l'écouteur de notifications en temps réel via Firebase Realtime Database
  configurerEcouteurNotificationsRealtime() {
    // Stocker les références aux écouteurs pour pouvoir les détacher plus tard
    if (!MonHistoire.features.sharing.realtimeListeners) {
      MonHistoire.features.sharing.realtimeListeners = [];
    } else {
      // Détacher les écouteurs précédents
      MonHistoire.features.sharing.realtimeListeners.forEach(listener => {
        if (listener && listener.ref && typeof listener.detach === 'function') {
          try {
            listener.detach();
          } catch (e) {
            console.warn("Erreur lors du détachement d'un écouteur Realtime:", e);
          }
        }
      });
      MonHistoire.features.sharing.realtimeListeners = [];
    }
    
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
        MonHistoire.logger.warning("Impossible de configurer l'écouteur de notifications Realtime: Firebase Realtime Database n'est pas disponible");
        MonHistoire.state.realtimeDbAvailable = false;
        return;
      }
      
      // Vérifier la connexion à Firebase Realtime Database
      const connectedRef = firebase.database().ref(".info/connected");
      const connectedListener = connectedRef.on("value", (snap) => {
        const isConnected = snap.val() === true;
        MonHistoire.state.realtimeDbConnected = isConnected;
        
        if (isConnected && !MonHistoire.features.sharing.realtimeListeners.length) {
          // Si on vient de se connecter et qu'aucun écouteur n'est actif, configurer les écouteurs
          setTimeout(() => this.configurerEcouteurNotificationsRealtime(), 500);
        }
      }, error => {
        console.error("Erreur lors de la vérification de la connexion à Firebase Realtime Database:", error);
        MonHistoire.state.realtimeDbConnected = false;
      });
      
      // Ajouter l'écouteur de connexion à la liste
      MonHistoire.features.sharing.realtimeListeners.push({
        ref: connectedRef,
        detach: () => connectedRef.off("value", connectedListener)
      });
      
      // Si la connexion n'est pas établie, ne pas continuer
      if (MonHistoire.state.realtimeDbConnected === false) {
        MonHistoire.logger.warning("Impossible de configurer l'écouteur de notifications Realtime: connexion inactive");
        return;
      }
      
      // Déterminer le chemin de l'écouteur selon le profil actif
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
      if (!MonHistoire.features.sharing.notificationsTraitees) {
        MonHistoire.features.sharing.notificationsTraitees = new Set();
      }
      
      // Configurer l'écouteur pour les nouvelles notifications
      const childAddedListener = notificationsRef.on('child_added', (snapshot) => {
        const notificationId = snapshot.key;
        const notification = snapshot.val();
        
        // Vérifier si la notification a déjà été traitée
        if (MonHistoire.features.sharing.notificationsTraitees.has(notificationId)) {
          return;
        }
        
        // Ajouter la notification au cache
        MonHistoire.features.sharing.notificationsTraitees.add(notificationId);
        
        // Limiter la taille du cache (garder les 50 dernières notifications)
        if (MonHistoire.features.sharing.notificationsTraitees.size > 50) {
          const iterator = MonHistoire.features.sharing.notificationsTraitees.values();
          MonHistoire.features.sharing.notificationsTraitees.delete(iterator.next().value);
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
        
        // Incrémenter le compteur de notifications non lues pour ce profil
        MonHistoire.features.sharing.notificationsNonLues[profilId] = (MonHistoire.features.sharing.notificationsNonLues[profilId] || 0) + 1;
        
        // Mettre à jour l'indicateur de notification
        if (MonHistoire.features.sharing.notifications) {
          MonHistoire.features.sharing.notifications.mettreAJourIndicateurNotification();
        }
        
        // Afficher la notification
        if (MonHistoire.features.sharing.notifications) {
          MonHistoire.features.sharing.notifications.afficherNotificationPartage(notification.partageParPrenom, null);
        }
        
        // Supprimer la notification après l'avoir affichée
        snapshot.ref.remove().catch(error => {
          console.warn("Erreur lors de la suppression de la notification:", error);
        });
        
        // Rafraîchir la liste des histoires si on est sur la page "Mes histoires"
        if (MonHistoire.state.currentScreen === "mes-histoires" && 
            MonHistoire.features && 
            MonHistoire.features.stories && 
            MonHistoire.features.stories.management) {
          MonHistoire.features.stories.management.afficherHistoiresSauvegardees();
        }
      }, error => {
        console.error("Erreur lors de l'écoute des nouvelles notifications:", error);
      });
      
      // Ajouter l'écouteur à la liste
      MonHistoire.features.sharing.realtimeListeners.push({
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
      
      MonHistoire.logger.info("Écouteur de notifications Realtime configuré avec succès");
    } catch (error) {
      MonHistoire.logger.error("Erreur lors de la configuration de l'écouteur de notifications Realtime", error);
      
      // Planifier une nouvelle tentative après un délai
      setTimeout(() => {
        if (!MonHistoire.features.sharing.realtimeListeners || MonHistoire.features.sharing.realtimeListeners.length === 0) {
          this.configurerEcouteurNotificationsRealtime();
        }
      }, 10000); // Réessayer après 10 secondes
    }
  },
  
  // Configure des écouteurs de notifications pour tous les profils enfants (quand on est sur le profil parent)
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
        const profilData = profilDoc.data();
        
        // Référence aux notifications pour ce profil enfant
        const notificationsEnfantRef = firebase.database()
          .ref(`users/${user.uid}/notifications/${profilId}`);
        
        // Configurer l'écouteur pour les nouvelles notifications
        const childAddedListener = notificationsEnfantRef.on('child_added', (snapshot) => {
          const notificationId = snapshot.key;
          const notification = snapshot.val();
          
          // Vérifier si la notification a déjà été traitée
          if (MonHistoire.features.sharing.notificationsTraitees.has(notificationId)) {
            return;
          }
          
          // Ajouter la notification au cache
          MonHistoire.features.sharing.notificationsTraitees.add(notificationId);
          
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
          
          // Incrémenter le compteur de notifications non lues pour ce profil enfant
          MonHistoire.features.sharing.notificationsNonLues[profilId] = (MonHistoire.features.sharing.notificationsNonLues[profilId] || 0) + 1;
          
          // Mettre à jour l'indicateur de notification dans la liste des profils
          if (MonHistoire.features.sharing.notifications) {
            MonHistoire.features.sharing.notifications.mettreAJourIndicateurNotificationProfilsListe();
          }
          
          // Supprimer la notification après l'avoir traitée
          snapshot.ref.remove().catch(error => {
            console.warn(`Erreur lors de la suppression de la notification pour le profil ${profilId}:`, error);
          });
          
        }, error => {
          console.error(`Erreur lors de l'écoute des notifications pour le profil enfant ${profilId}:`, error);
        });
        
        // Ajouter l'écouteur à la liste
        MonHistoire.features.sharing.realtimeListeners.push({
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
      
      MonHistoire.logger.info(`Écouteurs de notifications configurés pour ${profilsEnfantsSnapshot.size} profils enfants`);
    } catch (error) {
      MonHistoire.logger.error("Erreur lors de la configuration des écouteurs de notifications pour les profils enfants", error);
    }
  }
};
