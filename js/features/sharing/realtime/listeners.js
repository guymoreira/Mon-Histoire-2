// js/features/sharing/realtime/listeners.js
// Gestion des écouteurs Firestore pour les histoires partagées

// S'assurer que les objets nécessaires existent
window.MonHistoire = window.MonHistoire || {};
MonHistoire.features = MonHistoire.features || {};
MonHistoire.features.sharing = MonHistoire.features.sharing || {};
MonHistoire.features.sharing.realtime = MonHistoire.features.sharing.realtime || {};

/**
 * Module de gestion des écouteurs Firestore
 * Responsable de la configuration et de la gestion des écouteurs pour les histoires partagées
 */
MonHistoire.features.sharing.realtime.listeners = {
  // Compteur de tentatives de configuration des écouteurs
  tentativesConfiguration: 0,
  
  // Délai maximum entre les tentatives (en ms)
  delaiMaxTentatives: 30000,
  
  /**
   * Initialisation du module
   */
  init() {
    console.log("Module d'écouteurs Firestore pour les histoires partagées initialisé");
    
    // Initialiser les variables si nécessaire
    if (!MonHistoire.features.sharing.histoiresPartageesListener) {
      MonHistoire.features.sharing.histoiresPartageesListener = [];
    }
    
    if (!MonHistoire.features.sharing.notificationsTraitees) {
      MonHistoire.features.sharing.notificationsTraitees = new Set();
    }
  },
  
  /**
   * Configure un écouteur en temps réel pour les nouvelles histoires partagées
   * Cette fonction est appelée au démarrage et après un changement de profil
   * @param {boolean} estRetentative - Indique s'il s'agit d'une retentative automatique
   */
  configurerEcouteurHistoiresPartagees(estRetentative = false) {
    try {
      // Si c'est une retentative, incrémenter le compteur
      if (estRetentative) {
        this.tentativesConfiguration++;
        console.log(`Tentative #${this.tentativesConfiguration} de configuration des écouteurs`);
      } else {
        // Réinitialiser le compteur si c'est un appel initial
        this.tentativesConfiguration = 0;
      }
      
      // Arrête les écouteurs précédents s'ils existent
      this.detacherEcouteursHistoiresPartagees();
      
      // Vérifier si l'utilisateur est connecté
      const user = firebase.auth().currentUser;
      if (!user) {
        console.log("Impossible de configurer les écouteurs: utilisateur non connecté");
        
        // Configurer un écouteur unique pour réessayer quand l'utilisateur se connecte
        const authListener = firebase.auth().onAuthStateChanged(newUser => {
          if (newUser && !MonHistoire.features.sharing.histoiresPartageesListener.length) {
            // Détacher cet écouteur pour éviter les doublons
            authListener();
            setTimeout(() => this.configurerEcouteurHistoiresPartagees(true), 1000);
          }
        });
        
        // Planifier une nouvelle tentative après un délai
        this.planifierNouvelleTentative();
        return;
      }
      
      // Vérifier si la connexion est active
      if (!MonHistoire.state.isConnected) {
        console.log("Impossible de configurer les écouteurs: connexion inactive");
        
        // Configurer un écouteur unique pour réessayer quand la connexion est rétablie
        const connectionListener = (isConnected) => {
          if (isConnected && !MonHistoire.features.sharing.histoiresPartageesListener.length) {
            // Détacher cet écouteur pour éviter les doublons
            if (MonHistoire.events.listeners && MonHistoire.events.listeners.connectionStateChanged) {
              MonHistoire.events.listeners.connectionStateChanged = 
                MonHistoire.events.listeners.connectionStateChanged.filter(l => l !== connectionListener);
            }
            
            setTimeout(() => this.configurerEcouteurHistoiresPartagees(true), 1000);
          }
        };
        
        MonHistoire.events.on("connectionStateChanged", connectionListener);
        
        // Planifier une nouvelle tentative après un délai
        this.planifierNouvelleTentative();
        return;
      }
      
      // Vérifier si Firebase Realtime Database est disponible
      if (MonHistoire.state.realtimeDbAvailable === false) {
        console.log("Impossible de configurer les écouteurs: Firebase Realtime Database n'est pas disponible");
        
        // Configurer un écouteur unique pour réessayer quand Firebase devient disponible
        const dbListener = (isAvailable) => {
          if (isAvailable && !MonHistoire.features.sharing.histoiresPartageesListener.length) {
            // Détacher cet écouteur pour éviter les doublons
            if (MonHistoire.events.listeners && MonHistoire.events.listeners.realtimeDbAvailable) {
              MonHistoire.events.listeners.realtimeDbAvailable = 
                MonHistoire.events.listeners.realtimeDbAvailable.filter(l => l !== dbListener);
            }
            
            setTimeout(() => this.configurerEcouteurHistoiresPartagees(true), 1000);
          }
        };
        
        // Ajouter l'écouteur si l'événement existe
        if (MonHistoire.events && typeof MonHistoire.events.on === 'function') {
          MonHistoire.events.on("realtimeDbAvailable", dbListener);
        }
        
        // Planifier une nouvelle tentative après un délai
        this.planifierNouvelleTentative();
        return;
      }
      
      // S'assurer que le profilActif est correctement initialisé
      if (!MonHistoire.state.profilActif) {
        MonHistoire.state.profilActif = localStorage.getItem("profilActif")
          ? JSON.parse(localStorage.getItem("profilActif"))
          : { type: "parent" };
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
      
      console.log("Écouteurs de notifications configurés avec succès");
      
      // Réinitialiser le compteur de tentatives
      this.tentativesConfiguration = 0;
    } catch (error) {
      console.error("Erreur lors de la configuration des écouteurs de notifications", error);
      
      // Planifier une nouvelle tentative après un délai
      this.planifierNouvelleTentative();
    }
  },
  
  /**
   * Planifie une nouvelle tentative de configuration des écouteurs
   * avec un délai exponentiel (backoff)
   */
  planifierNouvelleTentative() {
    // Calculer le délai avec backoff exponentiel (1s, 2s, 4s, 8s, 16s, etc.)
    // mais plafonné à delaiMaxTentatives
    const delai = Math.min(
      1000 * Math.pow(2, this.tentativesConfiguration),
      this.delaiMaxTentatives
    );
    
    console.log(`Planification d'une nouvelle tentative dans ${delai/1000} secondes`);
    
    setTimeout(() => {
      if (!MonHistoire.features.sharing.histoiresPartageesListener || 
          !MonHistoire.features.sharing.histoiresPartageesListener.length) {
        console.log("Nouvelle tentative de configuration des écouteurs de notifications");
        this.configurerEcouteurHistoiresPartagees(true);
      }
    }, delai);
  },
  
  /**
   * Détache tous les écouteurs d'histoires partagées
   */
  detacherEcouteursHistoiresPartagees() {
    if (MonHistoire.features.sharing.histoiresPartageesListener) {
      if (Array.isArray(MonHistoire.features.sharing.histoiresPartageesListener)) {
        MonHistoire.features.sharing.histoiresPartageesListener.forEach(listener => {
          if (typeof listener === 'function') {
            try {
              listener();
            } catch (e) {
              console.error("Erreur lors de l'arrêt d'un écouteur", e);
            }
          }
        });
      } else if (typeof MonHistoire.features.sharing.histoiresPartageesListener === 'function') {
        try {
          MonHistoire.features.sharing.histoiresPartageesListener();
        } catch (e) {
          console.error("Erreur lors de l'arrêt de l'écouteur", e);
        }
      }
      MonHistoire.features.sharing.histoiresPartageesListener = [];
    } else {
      MonHistoire.features.sharing.histoiresPartageesListener = [];
    }
  },
  
  /**
   * Configure l'écouteur pour le profil actif
   * @param {Object} user - L'utilisateur Firebase actuel
   */
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
  
  /**
   * Configure des écouteurs pour tous les profils enfants (quand on est sur le profil parent)
   * @param {Object} user - L'utilisateur Firebase actuel
   */
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
              if (change.type === "added" || change.type === "modified") {
                const data = change.doc.data();
                
                // Vérifier si cette notification a déjà été affichée récemment
                const notificationId = change.doc.id;
                if (!MonHistoire.features.sharing.notificationsTraitees) {
                  MonHistoire.features.sharing.notificationsTraitees = new Set();
                }
                
                // Si la notification n'a pas déjà été traitée
                if (data.partageParPrenom && !MonHistoire.features.sharing.notificationsTraitees.has(notificationId)) {
                  // Ajouter l'ID à la liste des notifications traitées
                  MonHistoire.features.sharing.notificationsTraitees.add(notificationId);
                  
                  // Incrémente le compteur de notifications non lues pour ce profil enfant
                  MonHistoire.features.sharing.notificationsNonLues[profilId] = (MonHistoire.features.sharing.notificationsNonLues[profilId] || 0) + 1;
                  
                  // Mettre à jour l'indicateur de notification dans l'interface utilisateur
                  if (MonHistoire.features.sharing.notifications) {
                    MonHistoire.features.sharing.notifications.mettreAJourIndicateurNotificationProfilsListe();
                  }
                  
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
  
  /**
   * Configure un écouteur pour le profil parent (quand on est sur un profil enfant)
   * @param {Object} user - L'utilisateur Firebase actuel
   */
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
  }
};
