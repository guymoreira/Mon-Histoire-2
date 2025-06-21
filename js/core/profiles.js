// js/core/profiles.js
// Gestion des profils enfants

// S'assurer que les objets nécessaires existent
window.MonHistoire = window.MonHistoire || {};
MonHistoire.core = MonHistoire.core || {};

// Module de gestion des profils
MonHistoire.core.profiles = {
  // Variables pour les écouteurs et timers
  profilSuppressionListener: null,
  verificationProfilInterval: null,
  
  // Initialisation du module
  init() {
    console.log("Module de gestion des profils initialisé");
    
    // Récupérer le profil actif depuis localStorage
    this.chargerProfilActif();
    
    // Vérifier l'existence du profil actif
    this.verifierExistenceProfil();
    
    // Configurer l'écouteur de suppression si nécessaire
    this.configurerEcouteurSuppressionProfil();
    
    // Démarrer la vérification périodique
    this.demarrerVerificationPeriodiqueProfil();
  },
  
  // Charge le profil actif depuis localStorage
  chargerProfilActif() {
    const profilActifJSON = localStorage.getItem("profilActif");
    if (profilActifJSON) {
      try {
        const profilActif = JSON.parse(profilActifJSON);
        MonHistoire.state.profilActif = profilActif;
        console.log("Profil actif chargé:", profilActif);
      } catch (e) {
        console.error("Erreur lors du chargement du profil actif:", e);
        MonHistoire.state.profilActif = { type: "parent" };
      }
    } else {
      MonHistoire.state.profilActif = { type: "parent" };
    }
  },
  
  // Change le profil actif
  changerProfil(nouveauProfil) {
    // Sauvegarde l'ancien profil pour les logs
    const ancienProfil = MonHistoire.state.profilActif;
    
    // Arrête les écouteurs de notifications du profil actuel
    if (MonHistoire.features && MonHistoire.features.sharing && 
        MonHistoire.features.sharing.histoiresPartageesListener) {
      // Si c'est un tableau d'écouteurs
      if (Array.isArray(MonHistoire.features.sharing.histoiresPartageesListener)) {
        MonHistoire.features.sharing.histoiresPartageesListener.forEach(listener => {
          if (typeof listener === 'function') listener();
        });
      } 
      // Si c'est une fonction unique
      else if (typeof MonHistoire.features.sharing.histoiresPartageesListener === 'function') {
        MonHistoire.features.sharing.histoiresPartageesListener();
      }
      MonHistoire.features.sharing.histoiresPartageesListener = [];
    }
    
    // Met à jour le profil actif
    MonHistoire.state.profilActif = nouveauProfil;
    
    // Sauvegarde dans localStorage
    localStorage.setItem("profilActif", JSON.stringify(nouveauProfil));
    
    // Met à jour le timestamp de dernière activité du profil
    this.updateLastActiveTimestamp(nouveauProfil);
    
    // Log l'activité
    if (MonHistoire.core && MonHistoire.core.auth) {
      MonHistoire.core.auth.logActivite("changement_profil", {
        ancien: ancienProfil.type === "parent" ? "parent" : ancienProfil.prenom,
        nouveau: nouveauProfil.type === "parent" ? "parent" : nouveauProfil.prenom
      });
    }
    
    // Mettre à jour la visibilité du footer en fonction du type de profil
    if (typeof MonHistoire.updateFooterVisibility === 'function') {
      MonHistoire.updateFooterVisibility();
    }
    
    // Émet un événement pour informer les autres modules
    MonHistoire.events.emit("profilChange", nouveauProfil);
    
    // Vérifie les histoires partagées pour le nouveau profil
    if (MonHistoire.features && MonHistoire.features.sharing) {
      // Utilise setTimeout pour s'assurer que la vérification se fait après le changement de profil
      setTimeout(() => {
        MonHistoire.features.sharing.verifierHistoiresPartagees();
      }, 100);
    }
    
    // Met à jour le quota et l'affichage des histoires sauvegardées
    if (MonHistoire.features && MonHistoire.features.stories && MonHistoire.features.stories.management) {
      MonHistoire.features.stories.management.initQuota();
      MonHistoire.features.stories.management.afficherHistoiresSauvegardees();
    }
    
    return nouveauProfil;
  },
  
  // Passe au profil parent
  passerAuProfilParent() {
    return this.changerProfil({ type: "parent" });
  },
  
  // Passe à un profil enfant après vérification de son existence
  async passerAuProfilEnfant(id, prenom) {
    // Vérifier d'abord si le profil existe toujours
    const user = firebase.auth().currentUser;
    if (!user) return false;
    
    try {
      const profilDoc = await firebase.firestore()
        .collection("users")
        .doc(user.uid)
        .collection("profils_enfant")
        .doc(id)
        .get();
      
      // Si le profil n'existe plus
      if (!profilDoc.exists) {
        MonHistoire.showMessageModal("Ce profil enfant n'existe plus.");
        return false;
      }
      
      // Le profil existe, on peut continuer
      return this.changerProfil({
        type: "enfant",
        id: id,
        prenom: prenom
      });
    } catch (error) {
      console.error("Erreur lors du changement de profil:", error);
      MonHistoire.showMessageModal("Erreur lors du changement de profil.");
      return false;
    }
  },
  
  // Récupère tous les profils enfants
  getProfilsEnfants() {
    const user = firebase.auth().currentUser;
    if (!user) {
      return Promise.resolve([]);
    }
    
    return firebase.firestore()
      .collection("users")
      .doc(user.uid)
      .collection("profils_enfant")
      .get()
      .then(snapshot => {
        const profils = [];
        snapshot.forEach(doc => {
          profils.push({
            id: doc.id,
            ...doc.data()
          });
        });
        return profils;
      });
  },
  
  // Vérifie l'existence du profil actif
  async verifierExistenceProfil() {
    const user = firebase.auth().currentUser;
    if (!user) return;
    
    // Si le profil actif est un profil enfant
    if (MonHistoire.state.profilActif && MonHistoire.state.profilActif.type === "enfant") {
      const profilId = MonHistoire.state.profilActif.id;
      
      try {
        // Vérifier si le profil existe toujours
        const profilDoc = await firebase.firestore()
          .collection("users")
          .doc(user.uid)
          .collection("profils_enfant")
          .doc(profilId)
          .get();
        
        // Si le profil n'existe plus
        if (!profilDoc.exists) {
          console.log("Profil enfant supprimé détecté lors de la vérification");
          
          // Afficher un message à l'utilisateur
          MonHistoire.showMessageModal(
            "Ce profil a été supprimé par le compte parent. Vous allez être redirigé vers le profil parent.",
            {
              callback: () => {
                // Forcer le retour au profil parent
                this.forcerRetourProfilParent();
              }
            }
          );
        } else {
          // Le profil existe, mettre à jour le timestamp de dernière activité
          this.updateLastActiveTimestamp(MonHistoire.state.profilActif);
        }
      } catch (error) {
        MonHistoire.logger.error("Erreur lors de la vérification du profil:", error);
      }
    } else if (MonHistoire.state.profilActif && MonHistoire.state.profilActif.type === "parent") {
      // Mettre à jour le timestamp de dernière activité pour le profil parent
      this.updateLastActiveTimestamp(MonHistoire.state.profilActif);
    }
  },
  
  // Configure l'écouteur de suppression de profil
  configurerEcouteurSuppressionProfil() {
    const user = firebase.auth().currentUser;
    if (!user) return;
    
    // Si le profil actif est un profil enfant
    if (MonHistoire.state.profilActif && MonHistoire.state.profilActif.type === "enfant") {
      const profilId = MonHistoire.state.profilActif.id;
      
      // Référence au document du profil enfant
      const profilRef = firebase.firestore()
        .collection("users")
        .doc(user.uid)
        .collection("profils_enfant")
        .doc(profilId);
      
      // Arrêter l'écouteur précédent s'il existe
      if (this.profilSuppressionListener) {
        this.profilSuppressionListener();
        this.profilSuppressionListener = null;
      }
      
      // Configurer le nouvel écouteur
      this.profilSuppressionListener = profilRef.onSnapshot(
        (doc) => {
          // Si le document n'existe plus (a été supprimé)
          if (!doc.exists) {
            console.log("Profil enfant supprimé détecté en temps réel");
            
            // Afficher un message à l'utilisateur
            MonHistoire.showMessageModal(
              "Ce profil a été supprimé par le compte parent. Vous allez être redirigé vers le profil parent.",
              {
                callback: () => {
                  // Forcer le retour au profil parent
                  this.forcerRetourProfilParent();
                }
              }
            );
          }
        },
        (error) => {
          console.error("Erreur lors de l'écoute de la suppression du profil:", error);
        }
      );
    } else {
      // Si on est en profil parent, arrêter l'écouteur s'il existe
      if (this.profilSuppressionListener) {
        this.profilSuppressionListener();
        this.profilSuppressionListener = null;
      }
    }
  },
  
  // Démarre la vérification périodique de l'existence du profil
  demarrerVerificationPeriodiqueProfil() {
    // Vérifier toutes les 5 minutes
    const intervalleVerification = 5 * 60 * 1000;
    
    // Arrêter l'intervalle précédent s'il existe
    if (this.verificationProfilInterval) {
      clearInterval(this.verificationProfilInterval);
    }
    
    // Configurer le nouvel intervalle
    this.verificationProfilInterval = setInterval(() => {
      this.verifierExistenceProfil();
    }, intervalleVerification);
  },
  
  // Force le retour au profil parent
  forcerRetourProfilParent() {
    // Supprimer le profil du localStorage
    localStorage.removeItem("profilActif");
    
    // Mettre à jour l'état global
    const ancienProfil = MonHistoire.state.profilActif;
    MonHistoire.state.profilActif = { type: "parent" };
    
    // Log l'activité
    if (MonHistoire.core && MonHistoire.core.auth) {
      MonHistoire.core.auth.logActivite("changement_profil_force", {
        ancien: ancienProfil.type === "parent" ? "parent" : ancienProfil.prenom,
        nouveau: "parent",
        raison: "profil_supprime"
      });
    }
    
    // Mettre à jour l'interface
    if (MonHistoire.core && MonHistoire.core.auth) {
      MonHistoire.core.auth.afficherUtilisateurConnecté();
    }
    
    // Mettre à jour la visibilité du footer
    if (typeof MonHistoire.updateFooterVisibility === 'function') {
      MonHistoire.updateFooterVisibility();
    }
    
    // Rafraîchir le quota et la liste des histoires
    if (MonHistoire.features && MonHistoire.features.stories && MonHistoire.features.stories.management) {
      MonHistoire.features.stories.management.initQuota();
      MonHistoire.features.stories.management.afficherHistoiresSauvegardees();
    }
    
    // Émettre un événement de changement de profil forcé
    if (MonHistoire.events) {
      MonHistoire.events.emit("profilChangeForcé", {
        raison: "profil_supprimé"
      });
    }
    
    // Mettre à jour le timestamp de dernière activité pour le profil parent
    this.updateLastActiveTimestamp({ type: "parent" });
  },
  
  // Met à jour le timestamp de dernière activité du profil
  async updateLastActiveTimestamp(profil) {
    try {
      const user = firebase.auth().currentUser;
      if (!user || !profil) return;
      
      const profilId = profil.type === "parent" ? "parent" : profil.id;
      const deviceId = MonHistoire.generateDeviceId();
      
      // Référence au document de profil actif
      const profilActifRef = firebase.firestore()
        .collection("users")
        .doc(user.uid)
        .collection("profils_actifs")
        .doc(profilId);
      
      // Vérifier l'état de connexion
      const isNetworkConnected = navigator.onLine;
      const isFirebaseConnected = MonHistoire.state.realtimeDbConnected !== false;
      const isConnected = isNetworkConnected && isFirebaseConnected;
      
      // Mettre à jour le timestamp de dernière activité
      await profilActifRef.set({
        lastActive: firebase.firestore.FieldValue.serverTimestamp(),
        deviceId: deviceId,
        userAgent: navigator.userAgent,
        isConnected: isConnected,
        networkConnected: isNetworkConnected,
        firebaseConnected: isFirebaseConnected,
        lastUpdateTimestamp: Date.now()
      }, { merge: true });
      
      // Vérifier si firebase.database est disponible et si la connexion est active
      if (firebase.database && MonHistoire.state.realtimeDbAvailable !== false) {
        try {
          // Configurer la suppression automatique à la déconnexion
          const connectedRef = firebase.database().ref(".info/connected");
          connectedRef.on("value", (snap) => {
            if (snap.val() === true) {
              // Nous sommes connectés à Firebase Realtime Database
              const onlineStatusRef = firebase.database()
                .ref(`users/${user.uid}/online/${deviceId}`);
              
              // Quand nous nous déconnectons, mettre à jour le statut
              onlineStatusRef.onDisconnect().update({
                isConnected: false,
                lastDisconnect: firebase.database.ServerValue.TIMESTAMP,
                profilId: profilId
              });
              
              // Mettre à jour le statut en ligne
              onlineStatusRef.update({
                isConnected: true,
                lastConnect: firebase.database.ServerValue.TIMESTAMP,
                profilId: profilId,
                deviceId: deviceId,
                userAgent: navigator.userAgent,
                profilType: profil.type,
                profilPrenom: profil.type === "parent" ? "parent" : profil.prenom
              });
              
              // Mettre à jour le statut du profil actif
              const profilStatusRef = firebase.database()
                .ref(`users/${user.uid}/profils/${profilId}`);
              
              // Quand nous nous déconnectons, mettre à jour le statut du profil
              profilStatusRef.onDisconnect().update({
                isActive: false,
                lastDisconnect: firebase.database.ServerValue.TIMESTAMP,
                deviceId: deviceId
              });
              
              // Mettre à jour le statut du profil
              profilStatusRef.update({
                isActive: true,
                lastConnect: firebase.database.ServerValue.TIMESTAMP,
                deviceId: deviceId,
                profilType: profil.type,
                profilPrenom: profil.type === "parent" ? "parent" : profil.prenom
              });
              
              // Configurer l'écouteur de notifications en temps réel pour ce profil
              if (MonHistoire.features && MonHistoire.features.sharing && MonHistoire.features.sharing.realtime) {
                setTimeout(() => {
                  MonHistoire.features.sharing.realtime.configurerEcouteurNotificationsRealtime();
                }, 500);
              }
            }
          });
        } catch (dbError) {
          console.warn("Erreur lors de l'utilisation de Firebase Realtime Database:", dbError);
          // Émettre un événement pour informer les autres modules
          if (MonHistoire.events) {
            MonHistoire.events.emit("realtimeDbError", dbError);
          }
        }
      } else {
        console.warn("Firebase Realtime Database n'est pas disponible, le statut en ligne ne sera pas mis à jour");
        // Émettre un événement pour informer les autres modules
        if (MonHistoire.events) {
          MonHistoire.events.emit("realtimeDbAvailable", false);
        }
      }
      
    } catch (error) {
      MonHistoire.logger.error("Erreur lors de la mise à jour du timestamp de dernière activité:", error);
    }
  }
};

// Exporter pour utilisation dans d'autres modules
window.MonHistoire = MonHistoire;
