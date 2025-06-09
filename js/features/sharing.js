// js/features/sharing.js
// Gestion du partage d'histoires

// S'assurer que les objets nécessaires existent
window.MonHistoire = window.MonHistoire || {};
MonHistoire.features = MonHistoire.features || {};

// Module de partage d'histoires
MonHistoire.features.sharing = {
  // Variables pour la notification de partage
  notificationSwipeStartX: 0,
  notificationSwipeStartY: 0,
  notificationTimeout: null,
  histoiresPartageesListener: null, // Pour stocker la référence à l'écouteur en temps réel
  histoireAPartager: null, // Pour stocker temporairement l'histoire à partager
  histoireNotifieeActuelle: null, // Pour stocker la référence à l'histoire en cours de notification
  notificationsNonLues: {}, // Pour stocker le nombre de notifications non lues par profil
  
  // Initialisation du module
  init() {
    console.log("Module de partage d'histoires initialisé");
    
    // Initialiser les écouteurs d'événements pour les notifications
    this.initNotificationListeners();
    
    // Initialiser les écouteurs d'événements pour le partage
    this.initPartageListeners();
    
    // Configurer l'écouteur de notifications en temps réel via Firebase Realtime Database
    this.configurerEcouteurNotificationsRealtime();
    
    // Configurer l'écouteur d'événements pour les changements de profil
    MonHistoire.events.on("profilChange", (nouveauProfil) => {
      // Reconfigurer l'écouteur de notifications en temps réel
      setTimeout(() => {
        this.configurerEcouteurNotificationsRealtime();
      }, 500);
    });
  },
  
  // Initialise les écouteurs d'événements pour les notifications
  initNotificationListeners() {
    // Écouteur pour le clic sur la notification
    const notification = document.getElementById("notification-partage");
    if (notification) {
      notification.addEventListener("click", this.clicNotificationPartage.bind(this));
    }
  },
  
  // Vérifie s'il y a des histoires partagées pour l'utilisateur connecté
  verifierHistoiresPartagees() {
    const user = firebase.auth().currentUser;
    if (!user) return;

    // S'assure que le profilActif est correctement initialisé
    if (!MonHistoire.state.profilActif) {
      MonHistoire.state.profilActif = localStorage.getItem("profilActif")
        ? JSON.parse(localStorage.getItem("profilActif"))
        : { type: "parent" };
    }

    try {
      // Initialise le compteur de notifications non lues pour le profil actif
      this.initialiserCompteurNotifications(user);
      
      // Vérifie d'abord les histoires partagées pour le profil actif
      this.verifierHistoiresPartageesProfilActif(user);
      
      // Configure l'écouteur en temps réel pour les futures histoires partagées
      this.configurerEcouteurHistoiresPartagees();
    } catch (error) {
      console.error("Erreur lors de la vérification des histoires partagées:", error);
    }
  },
  
  // Initialise le compteur de notifications non lues pour le profil actif
  async initialiserCompteurNotifications(user) {
    try {
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
      this.notificationsNonLues[MonHistoire.state.profilActif.type === "parent" ? "parent" : MonHistoire.state.profilActif.id] = snapshot.size;
      
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
      
      console.log("Compteur de notifications initialisé:", this.notificationsNonLues);
    } catch (error) {
      console.error("Erreur lors de l'initialisation du compteur de notifications:", error);
    }
  },
  
  // Vérifie les histoires partagées pour le profil actif
  verifierHistoiresPartageesProfilActif(user) {
    // Détermine la collection à vérifier selon le profil actif
    let storiesRef;
    if (MonHistoire.state.profilActif.type === "parent") {
      storiesRef = firebase.firestore()
        .collection("users")
        .doc(user.uid)
        .collection("stories")
        .where("nouvelleHistoire", "==", true)
        .limit(1);
    } else {
      storiesRef = firebase.firestore()
        .collection("users")
        .doc(user.uid)
        .collection("profils_enfant")
        .doc(MonHistoire.state.profilActif.id)
        .collection("stories")
        .where("nouvelleHistoire", "==", true)
        .limit(1);
    }

    // Vérifie s'il y a des histoires partagées
    return storiesRef.get().then(snapshot => {
      if (!snapshot.empty) {
        // Il y a au moins une histoire partagée
        const doc = snapshot.docs[0];
        const data = doc.data();
        
        // Vérifie si l'histoire n'a pas été partagée par le profil actif lui-même
        // (sauf pour le profil parent qui doit voir toutes les notifications)
        const estPartageParProfilActif = 
          MonHistoire.state.profilActif.type !== "parent" && 
          data.partageParProfil === MonHistoire.state.profilActif.id;
        
        // Vérifier si cette notification a déjà été affichée récemment
        const notificationId = doc.id;
        if (!this.notificationsTraitees) {
          this.notificationsTraitees = new Set();
        }
        
        // Ne pas afficher automatiquement la notification lors du changement de profil
        // Juste mettre à jour le compteur pour l'interface
        if (data.partageParPrenom && !estPartageParProfilActif) {
          // Ajouter l'ID à la liste des notifications traitées
          this.notificationsTraitees.add(notificationId);
          
          // Mettre à jour le compteur de notifications
          const profilId = MonHistoire.state.profilActif.type === "parent" ? "parent" : MonHistoire.state.profilActif.id;
          this.notificationsNonLues[profilId] = (this.notificationsNonLues[profilId] || 0) + 1;
          
          // Log pour debug
          console.log(`Notification disponible pour ${profilId}: ${data.partageParPrenom} a partagé une histoire`);
        }
      }
    });
  },
  
  // Configure un écouteur en temps réel pour les nouvelles histoires partagées
  configurerEcouteurHistoiresPartagees() {
    try {
      // Arrête les écouteurs précédents s'ils existent
      if (this.histoiresPartageesListener) {
        if (Array.isArray(this.histoiresPartageesListener)) {
          this.histoiresPartageesListener.forEach(listener => {
            if (typeof listener === 'function') {
              try {
                listener();
              } catch (e) {
                MonHistoire.logger.error("Erreur lors de l'arrêt d'un écouteur", e);
              }
            }
          });
        } else if (typeof this.histoiresPartageesListener === 'function') {
          try {
            this.histoiresPartageesListener();
          } catch (e) {
            MonHistoire.logger.error("Erreur lors de l'arrêt de l'écouteur", e);
          }
        }
        this.histoiresPartageesListener = [];
      } else {
        this.histoiresPartageesListener = [];
      }

      // Vérifier si l'utilisateur est connecté
      const user = firebase.auth().currentUser;
      if (!user) {
        MonHistoire.logger.warning("Impossible de configurer les écouteurs: utilisateur non connecté");
        // Configurer un écouteur pour réessayer quand l'utilisateur se connecte
        firebase.auth().onAuthStateChanged(newUser => {
          if (newUser && !this.histoiresPartageesListener.length) {
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
          if (isConnected && !this.histoiresPartageesListener.length) {
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
        if (!this.histoiresPartageesListener || !this.histoiresPartageesListener.length) {
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
          if (!this.notificationsTraitees) {
            this.notificationsTraitees = new Set();
          }
          
          // Si la notification n'a pas déjà été traitée et n'est pas partagée par le profil actif
          if (data.partageParPrenom && !estPartageParProfilActif && !this.notificationsTraitees.has(notificationId)) {
            // Ajouter l'ID à la liste des notifications traitées
            this.notificationsTraitees.add(notificationId);
            
            // Incrémente le compteur de notifications non lues
            const profilId = MonHistoire.state.profilActif.type === "parent" ? "parent" : MonHistoire.state.profilActif.id;
            this.notificationsNonLues[profilId] = (this.notificationsNonLues[profilId] || 0) + 1;
            
            // Mettre à jour l'indicateur de notification dans l'interface utilisateur
            this.mettreAJourIndicateurNotification();
            
            // Affiche la notification sans marquer l'histoire comme vue immédiatement
            this.afficherNotificationPartage(data.partageParPrenom, change.doc.ref);
          }
        }
      });
    }, error => {
      console.error("Erreur lors de l'écoute des histoires partagées pour le profil actif:", error);
    });
    
    this.histoiresPartageesListener.push(listener);
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
                  this.afficherNotificationPartage(message, change.doc.ref);
                }
              }
            });
          }, error => {
            console.error(`Erreur lors de l'écoute des histoires partagées pour le profil enfant ${profilId}:`, error);
          });
          
          this.histoiresPartageesListener.push(listener);
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
            if (!this.notificationsTraitees) {
              this.notificationsTraitees = new Set();
            }
            
            // Si la notification n'a pas déjà été traitée
            if (!this.notificationsTraitees.has(notificationId)) {
              // Ajouter l'ID à la liste des notifications traitées
              this.notificationsTraitees.add(notificationId);
              
              // Incrémente le compteur de notifications non lues
              const profilId = MonHistoire.state.profilActif.id;
              this.notificationsNonLues[profilId] = (this.notificationsNonLues[profilId] || 0) + 1;
              
              // Mettre à jour l'indicateur de notification dans l'interface utilisateur
              this.mettreAJourIndicateurNotification();
              
              // Affiche la notification
              this.afficherNotificationPartage(data.partageParPrenom, change.doc.ref);
            }
          }
        }
      });
    }, error => {
      console.error("Erreur lors de l'écoute des histoires partagées pour le profil parent:", error);
    });
    
    this.histoiresPartageesListener.push(listener);
  },
  
  // Affiche la notification de partage
  afficherNotificationPartage(prenomPartageur, histoireRef) {
    const notification = document.getElementById("notification-partage");
    const message = document.getElementById("notification-message");
    
    if (!notification || !message) return;
    
    // Stocke la référence à l'histoire pour pouvoir la marquer comme vue plus tard
    this.histoireNotifieeActuelle = histoireRef;
    
    // Définit le message
    message.textContent = `${prenomPartageur} t'a partagé une histoire`;
    
    // Ajoute les écouteurs d'événements pour le swipe
    notification.addEventListener("touchstart", this.demarrerSwipeNotification.bind(this), { passive: true });
    notification.addEventListener("touchmove", this.deplacerSwipeNotification.bind(this), { passive: true });
    notification.addEventListener("touchend", this.terminerSwipeNotification.bind(this), { passive: true });
    notification.addEventListener("mousedown", this.demarrerSwipeNotification.bind(this));
    notification.addEventListener("mousemove", this.deplacerSwipeNotification.bind(this));
    notification.addEventListener("mouseup", this.terminerSwipeNotification.bind(this));
    notification.addEventListener("mouseleave", this.terminerSwipeNotification.bind(this));
    
    // Affiche la notification avec animation
    notification.classList.add("animate-in");
    
    // Supprime la classe d'animation après qu'elle soit terminée
    setTimeout(() => {
      notification.classList.remove("animate-in");
      notification.classList.add("show");
    }, 500);
    
    // Ferme automatiquement la notification après 5 secondes
    this.notificationTimeout = setTimeout(() => {
      this.fermerNotificationPartage();
    }, 5000);
  },
  
  // Ferme la notification de partage
  fermerNotificationPartage(marquerCommeVue = true) {
    const notification = document.getElementById("notification-partage");
    if (!notification) return;
    
    // Annule le timeout si existant
    if (this.notificationTimeout) {
      clearTimeout(this.notificationTimeout);
      this.notificationTimeout = null;
    }
    
    // Marque l'histoire comme vue si demandé et si une histoire est en cours de notification
    if (marquerCommeVue && this.histoireNotifieeActuelle) {
      // Récupère l'ID du profil actif
      const profilId = MonHistoire.state.profilActif.type === "parent" ? "parent" : MonHistoire.state.profilActif.id;
      
      // Décrémente le compteur de notifications non lues
      if (this.notificationsNonLues[profilId] && this.notificationsNonLues[profilId] > 0) {
        this.notificationsNonLues[profilId]--;
      }
      
      // Met à jour le document Firestore
      this.histoireNotifieeActuelle.get().then(doc => {
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
          this.histoireNotifieeActuelle.update({ 
            nouvelleHistoire: nouvelleHistoire,
            vueParProfils: vueParProfils,
            vueLe: firebase.firestore.FieldValue.serverTimestamp()
          }).catch(error => console.error("Erreur lors du marquage de l'histoire comme vue:", error));
        }
      }).catch(error => console.error("Erreur lors de la récupération de l'histoire:", error));
      
      // Réinitialise la référence
      this.histoireNotifieeActuelle = null;
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
  
  // Gestion du swipe - Début
  demarrerSwipeNotification(e) {
    // Annule le timeout automatique
    if (this.notificationTimeout) {
      clearTimeout(this.notificationTimeout);
      this.notificationTimeout = null;
    }
    
    // Enregistre la position de départ
    if (e.type === "touchstart") {
      this.notificationSwipeStartX = e.touches[0].clientX;
      this.notificationSwipeStartY = e.touches[0].clientY;
    } else {
      this.notificationSwipeStartX = e.clientX;
      this.notificationSwipeStartY = e.clientY;
    }
  },
  
  // Gestion du swipe - Déplacement
  deplacerSwipeNotification(e) {
    // Ne fait rien si on n'a pas commencé un swipe
    if (this.notificationSwipeStartX === 0 && this.notificationSwipeStartY === 0) return;
    
    let currentX, currentY;
    
    if (e.type === "touchmove") {
      currentX = e.touches[0].clientX;
      currentY = e.touches[0].clientY;
    } else {
      currentX = e.clientX;
      currentY = e.clientY;
    }
    
    // Calcule la distance parcourue
    const distanceX = Math.abs(currentX - this.notificationSwipeStartX);
    const distanceY = Math.abs(currentY - this.notificationSwipeStartY);
    
    // Si la distance est suffisante, ferme la notification
    if (distanceX > 50 || distanceY > 50) {
      this.fermerNotificationPartage();
      
      // Réinitialise les positions
      this.notificationSwipeStartX = 0;
      this.notificationSwipeStartY = 0;
    }
  },
  
  // Gestion du swipe - Fin
  terminerSwipeNotification() {
    // Réinitialise les positions
    this.notificationSwipeStartX = 0;
    this.notificationSwipeStartY = 0;
  },
  
  // Gestion du clic sur la notification
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
  
  // Initialise les écouteurs d'événements pour le partage
  initPartageListeners() {
    // Les écouteurs pour les boutons de partage et de fermeture de modale
    // sont centralisés dans ui.js pour éviter les doublons
  },
  
  // Ouvre la modale de partage et affiche la liste des profils disponibles
  async ouvrirModalePartage() {
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

      // Vide la liste des profils
      const listeEl = document.getElementById("liste-partage-profils");
      if (!listeEl) {
        console.error("Élément liste-partage-profils non trouvé");
        return;
      }
      
      listeEl.innerHTML = "";

      try {
        // Récupère tous les profils enfants
        const enfantsSnap = await firebase.firestore()
          .collection("users")
          .doc(user.uid)
          .collection("profils_enfant")
          .get();

        // Si aucun profil enfant, affiche un message
        if (enfantsSnap.empty && MonHistoire.state.profilActif.type === "parent") {
          listeEl.innerHTML = "<p style='text-align:center;'>Aucun profil disponible pour le partage.</p>";
          document.getElementById("modal-partage").classList.add("show");
          return;
        }

        // Ajoute un bouton pour le parent (sauf si on est déjà le parent)
        if (MonHistoire.state.profilActif.type === "enfant") {
          // Récupère le prénom du parent
          const docParent = await firebase.firestore()
            .collection("users")
            .doc(user.uid)
            .get();
          
          let prenomParent = "";
          if (docParent.exists && docParent.data().prenom) {
            prenomParent = docParent.data().prenom;
          } else {
            prenomParent = "Parent";
          }

          const btnParent = document.createElement("button");
          btnParent.className = "button button-blue";
          btnParent.textContent = prenomParent;
          btnParent.style.marginBottom = "0.75em";
          btnParent.onclick = () => this.partagerHistoire("parent", null, prenomParent);
          listeEl.appendChild(btnParent);
        }

        // Ajoute un bouton pour chaque profil enfant (sauf celui actif)
        enfantsSnap.forEach(docEnfant => {
          const data = docEnfant.data();
          // Ne pas afficher le profil actif
          if (MonHistoire.state.profilActif.type === "enfant" && docEnfant.id === MonHistoire.state.profilActif.id) return;

          const btn = document.createElement("button");
          btn.className = "button button-blue";
          btn.textContent = data.prenom;
          btn.style.marginBottom = "0.75em";
          btn.onclick = () => this.partagerHistoire("enfant", docEnfant.id, data.prenom);
          listeEl.appendChild(btn);
        });

        // Affiche la modale
        document.getElementById("modal-partage").classList.add("show");
      } catch (error) {
        console.error("Erreur lors du chargement des profils :", error);
        MonHistoire.showMessageModal("Erreur lors du chargement des profils.");
      }
    } else {
      console.error("Module d'affichage des histoires non disponible");
      MonHistoire.showMessageModal("Erreur : module d'affichage des histoires non disponible.");
    }
  },
  
  // Ferme la modale de partage
  fermerModalePartage() {
    const modal = document.getElementById("modal-partage");
    if (modal) {
      modal.classList.remove("show");
    }
    this.histoireAPartager = null;
  },
  
  // Partage l'histoire avec le profil sélectionné
  async partagerHistoire(type, id, prenom) {
    // Fermer la modale après un délai pour éviter qu'elle reste bloquée
    const fermerModaleAvecDelai = () => {
      setTimeout(() => {
        this.fermerModalePartage();
      }, 300);
    };
    
    if (!this.histoireAPartager) {
      fermerModaleAvecDelai();
      return;
    }

    const user = firebase.auth().currentUser;
    if (!user) {
      MonHistoire.showMessageModal("Tu dois être connecté pour partager une histoire.");
      fermerModaleAvecDelai();
      return;
    }
    
    // Vérifier l'état de connexion
    const isNetworkConnected = navigator.onLine;
    const isFirebaseConnected = MonHistoire.state.realtimeDbConnected !== false;
    const isConnected = isNetworkConnected && isFirebaseConnected;
    
    // Si l'appareil n'est pas connecté, ajouter l'opération à la file d'attente hors ligne
    if (!isConnected) {
      // Ajouter l'opération à la file d'attente hors ligne
      if (typeof MonHistoire.addToOfflineQueue === 'function') {
        MonHistoire.addToOfflineQueue('partageHistoire', {
          type: type,
          id: id,
          prenom: prenom,
          histoire: this.histoireAPartager,
          profilActif: MonHistoire.state.profilActif
        });
      } else {
        console.warn("La fonction addToOfflineQueue n'est pas disponible");
      }
      
      fermerModaleAvecDelai();
      
      // Message différent selon le type de déconnexion
      if (!isNetworkConnected) {
        MonHistoire.showMessageModal(`L'histoire sera partagée avec ${prenom} dès que la connexion Internet sera rétablie.`);
      } else {
        MonHistoire.showMessageModal(`L'histoire sera partagée avec ${prenom} dès que la connexion au serveur sera rétablie.`);
      }
      return;
    }

    try {
      // Acquérir un verrou pour éviter les conflits
      const lockId = `partage_${Date.now()}_${MonHistoire.generateDeviceId()}`;
      const lockRef = firebase.firestore()
        .collection("users")
        .doc(user.uid)
        .collection("locks")
        .doc(lockId);
      
      await lockRef.set({
        operation: "partage",
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        deviceId: MonHistoire.generateDeviceId()
      });
      
      // Détermine la collection cible selon le type de profil
      let targetRef;
      if (type === "parent") {
        targetRef = firebase.firestore()
          .collection("users")
          .doc(user.uid)
          .collection("stories");
      } else {
        targetRef = firebase.firestore()
          .collection("users")
          .doc(user.uid)
          .collection("profils_enfant")
          .doc(id)
          .collection("stories");
      }

      // Récupère le prénom du profil qui partage
      let partageParPrenom = "";
      if (MonHistoire.state.profilActif.type === "parent") {
        // Si c'est le parent qui partage, récupère son prénom
        const userDoc = await firebase.firestore()
          .collection("users")
          .doc(user.uid)
          .get();
        
        if (userDoc.exists && userDoc.data().prenom) {
          partageParPrenom = userDoc.data().prenom;
        } else {
          partageParPrenom = "Parent";
        }
      } else {
        // Si c'est un enfant qui partage, utilise son prénom
        partageParPrenom = MonHistoire.state.profilActif.prenom;
      }

      // Détermine l'ID du profil qui partage
      const partageParProfil = MonHistoire.state.profilActif.type === "parent" 
        ? "parent" 
        : MonHistoire.state.profilActif.id;
      
      // Détermine l'ID du profil destinataire
      const destinataireProfil = type === "parent" ? "parent" : id;
      
      // Initialise vueParProfils avec le profil qui partage
      // (pour éviter qu'il ne reçoive une notification pour son propre partage)
      const vueParProfils = [partageParProfil];

      // Ajoute l'histoire partagée dans Firestore
      const histoireRef = await targetRef.add({
        titre: this.histoireAPartager.titre,
        chapitre1: this.histoireAPartager.chapitre1 || "",
        chapitre2: this.histoireAPartager.chapitre2 || "",
        chapitre3: this.histoireAPartager.chapitre3 || "",
        chapitre4: this.histoireAPartager.chapitre4 || "",
        chapitre5: this.histoireAPartager.chapitre5 || "",
        contenu: this.histoireAPartager.contenu || "",
        images: this.histoireAPartager.images || [],
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        partageParProfil: partageParProfil,
        partageParPrenom: partageParPrenom,
        destinataireProfil: destinataireProfil,
        destinatairePrenom: prenom,
        vueParProfils: vueParProfils,
        nouvelleHistoire: true, // Marque l'histoire comme nouvelle pour la notification
        deviceId: MonHistoire.generateDeviceId(), // Identifiant de l'appareil qui a partagé
        version: 1 // Version initiale du document
      });
      
      // Variable pour suivre si la notification en temps réel a été ajoutée
      let notificationRealtimeAjoutee = false;
      
      // Ajoute également une notification en temps réel dans Firebase Realtime Database
      try {
        if (firebase.database && MonHistoire.state.realtimeDbAvailable !== false) {
          // Référence à la notification en temps réel
          const notificationRef = firebase.database()
            .ref(`users/${user.uid}/notifications/${destinataireProfil}/${Date.now()}_${MonHistoire.generateDeviceId()}`);
          
          // Ajoute la notification
          await notificationRef.set({
            titre: this.histoireAPartager.titre,
            partageParProfil: partageParProfil,
            partageParPrenom: partageParPrenom,
            destinataireProfil: destinataireProfil,
            destinatairePrenom: prenom,
            histoireId: histoireRef.id,
            timestamp: firebase.database.ServerValue.TIMESTAMP,
            deviceId: MonHistoire.generateDeviceId()
          });
          
          notificationRealtimeAjoutee = true;
          MonHistoire.logger.info("Notification en temps réel ajoutée avec succès");
        }
      } catch (notifError) {
        MonHistoire.logger.error("Erreur lors de l'ajout de la notification en temps réel", notifError);
        // On continue même si l'ajout de la notification en temps réel échoue
        // car l'histoire a déjà été ajoutée dans Firestore
      }
      
      // Supprimer le verrou
      try {
        await lockRef.delete();
      } catch (lockError) {
        MonHistoire.logger.error("Erreur lors de la suppression du verrou", lockError);
        // On continue même si la suppression du verrou échoue
      }

      // Si on partage avec un profil enfant, incrémente son compteur d'histoires
      if (type === "enfant") {
        try {
          const profilDocRef = firebase.firestore()
            .collection("users")
            .doc(user.uid)
            .collection("profils_enfant")
            .doc(id);
          
          await profilDocRef.update({
            nb_histoires: firebase.firestore.FieldValue.increment(1)
          });
        } catch (updateError) {
          MonHistoire.logger.error("Erreur lors de la mise à jour du compteur d'histoires", updateError);
          // On continue même si la mise à jour du compteur échoue
        }
      }

      // Log de l'activité
      if (MonHistoire.core && MonHistoire.core.auth) {
        try {
          MonHistoire.core.auth.logActivite("partage_histoire", { 
            destinataire_type: type,
            destinataire_id: id,
            destinataire_prenom: prenom,
            notification_realtime: notificationRealtimeAjoutee
          });
        } catch (logError) {
          MonHistoire.logger.error("Erreur lors du log de l'activité", logError);
          // On continue même si le log de l'activité échoue
        }
      }

      // Fermer la modale et afficher le message de succès
      fermerModaleAvecDelai();
      MonHistoire.showMessageModal(`Histoire partagée avec ${prenom} !`);
    } catch (error) {
      console.error("Erreur lors du partage :", error);
      MonHistoire.showMessageModal("Erreur lors du partage : " + error.message);
      fermerModaleAvecDelai();
    }
  },
  
  // Traite un partage d'histoire qui a été mis en file d'attente hors ligne
  async processOfflinePartage(data) {
    try {
      const user = firebase.auth().currentUser;
      if (!user) {
        MonHistoire.logger.error("Impossible de traiter le partage hors ligne: utilisateur non connecté");
        return false;
      }
      
      const { type, id, prenom, histoire, profilActif } = data;
      
      // Détermine la collection cible selon le type de profil
      let targetRef;
      if (type === "parent") {
        targetRef = firebase.firestore()
          .collection("users")
          .doc(user.uid)
          .collection("stories");
      } else {
        targetRef = firebase.firestore()
          .collection("users")
          .doc(user.uid)
          .collection("profils_enfant")
          .doc(id)
          .collection("stories");
      }

      // Récupère le prénom du profil qui partage
      let partageParPrenom = "";
      if (profilActif.type === "parent") {
        // Si c'est le parent qui partage, récupère son prénom
        const userDoc = await firebase.firestore()
          .collection("users")
          .doc(user.uid)
          .get();
        
        if (userDoc.exists && userDoc.data().prenom) {
          partageParPrenom = userDoc.data().prenom;
        } else {
          partageParPrenom = "Parent";
        }
      } else {
        // Si c'est un enfant qui partage, utilise son prénom
        partageParPrenom = profilActif.prenom;
      }

      // Détermine l'ID du profil qui partage
      const partageParProfil = profilActif.type === "parent" 
        ? "parent" 
        : profilActif.id;
      
      // Détermine l'ID du profil destinataire
      const destinataireProfil = type === "parent" ? "parent" : id;
      
      // Initialise vueParProfils avec le profil qui partage
      const vueParProfils = [partageParProfil];

      // Ajoute l'histoire partagée
      await targetRef.add({
        titre: histoire.titre,
        chapitre1: histoire.chapitre1 || "",
        chapitre2: histoire.chapitre2 || "",
        chapitre3: histoire.chapitre3 || "",
        chapitre4: histoire.chapitre4 || "",
        chapitre5: histoire.chapitre5 || "",
        contenu: histoire.contenu || "",
        images: histoire.images || [],
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        partageParProfil: partageParProfil,
        partageParPrenom: partageParPrenom,
        destinataireProfil: destinataireProfil,
        destinatairePrenom: prenom,
        vueParProfils: vueParProfils,
        nouvelleHistoire: true,
        deviceId: MonHistoire.generateDeviceId(),
        version: 1,
        processedOffline: true
      });

      // Si on partage avec un profil enfant, incrémente son compteur d'histoires
      if (type === "enfant") {
        const profilDocRef = firebase.firestore()
          .collection("users")
          .doc(user.uid)
          .collection("profils_enfant")
          .doc(id);
        
        await profilDocRef.update({
          nb_histoires: firebase.firestore.FieldValue.increment(1)
        });
      }

      // Log de l'activité
      if (MonHistoire.core && MonHistoire.core.auth) {
        MonHistoire.core.auth.logActivite("partage_histoire_offline", { 
          destinataire_type: type,
          destinataire_id: id,
          destinataire_prenom: prenom
        });
      }
      
      MonHistoire.logger.info("Partage hors ligne traité avec succès");
      return true;
    } catch (error) {
      MonHistoire.logger.error("Erreur lors du traitement du partage hors ligne", error);
      return false;
    }
  },
  
  // Configure l'écouteur de notifications en temps réel via Firebase Realtime Database
  configurerEcouteurNotificationsRealtime() {
    // Stocker les références aux écouteurs pour pouvoir les détacher plus tard
    if (!this.realtimeListeners) {
      this.realtimeListeners = [];
    } else {
      // Détacher les écouteurs précédents
      this.realtimeListeners.forEach(listener => {
        if (listener && listener.ref && typeof listener.detach === 'function') {
          try {
            listener.detach();
          } catch (e) {
            console.warn("Erreur lors du détachement d'un écouteur Realtime:", e);
          }
        }
      });
      this.realtimeListeners = [];
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
        
        if (isConnected && !this.realtimeListeners.length) {
          // Si on vient de se connecter et qu'aucun écouteur n'est actif, configurer les écouteurs
          setTimeout(() => this.configurerEcouteurNotificationsRealtime(), 500);
        }
      }, error => {
        console.error("Erreur lors de la vérification de la connexion à Firebase Realtime Database:", error);
        MonHistoire.state.realtimeDbConnected = false;
      });
      
      // Ajouter l'écouteur de connexion à la liste
      this.realtimeListeners.push({
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
      if (!this.notificationsTraitees) {
        this.notificationsTraitees = new Set();
      }
      
      // Configurer l'écouteur pour les nouvelles notifications
      const childAddedListener = notificationsRef.on('child_added', (snapshot) => {
        const notificationId = snapshot.key;
        const notification = snapshot.val();
        
        // Vérifier si la notification a déjà été traitée
        if (this.notificationsTraitees.has(notificationId)) {
          return;
        }
        
        // Ajouter la notification au cache
        this.notificationsTraitees.add(notificationId);
        
        // Limiter la taille du cache (garder les 50 dernières notifications)
        if (this.notificationsTraitees.size > 50) {
          const iterator = this.notificationsTraitees.values();
          this.notificationsTraitees.delete(iterator.next().value);
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
        this.notificationsNonLues[profilId] = (this.notificationsNonLues[profilId] || 0) + 1;
        
        // Mettre à jour l'indicateur de notification
        this.mettreAJourIndicateurNotification();
        
        // Afficher la notification
        this.afficherNotificationPartage(notification.partageParPrenom, null);
        
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
      this.realtimeListeners.push({
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
        if (!this.realtimeListeners || this.realtimeListeners.length === 0) {
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
          if (this.notificationsTraitees.has(notificationId)) {
            return;
          }
          
          // Ajouter la notification au cache
          this.notificationsTraitees.add(notificationId);
          
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
          this.notificationsNonLues[profilId] = (this.notificationsNonLues[profilId] || 0) + 1;
          
          // Mettre à jour l'indicateur de notification dans la liste des profils
          this.mettreAJourIndicateurNotificationProfilsListe();
          
          // Supprimer la notification après l'avoir traitée
          snapshot.ref.remove().catch(error => {
            console.warn(`Erreur lors de la suppression de la notification pour le profil ${profilId}:`, error);
          });
          
        }, error => {
          console.error(`Erreur lors de l'écoute des notifications pour le profil enfant ${profilId}:`, error);
        });
        
        // Ajouter l'écouteur à la liste
        this.realtimeListeners.push({
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
  },
  
  // Vérifie l'état de la connexion
  isConnected() {
    const isNetworkConnected = navigator.onLine;
    const isFirebaseConnected = MonHistoire.state.realtimeDbConnected !== false;
    return isNetworkConnected && isFirebaseConnected && MonHistoire.state.isConnected;
  },
  
  // Met à jour l'indicateur de notification dans l'interface utilisateur
  mettreAJourIndicateurNotification() {
    // Récupère l'ID du profil actif
    const profilId = MonHistoire.state.profilActif.type === "parent" ? "parent" : MonHistoire.state.profilActif.id;
    
    // Récupère le nombre de notifications non lues pour ce profil
    const nbNotifs = this.notificationsNonLues[profilId] || 0;
    
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
    MonHistoire.events.emit("notificationUpdate", {
      profilId: profilId,
      count: nbNotifs
    });
  },
  
  // Met à jour les indicateurs de notification dans la liste des profils du modal de déconnexion
  mettreAJourIndicateurNotificationProfilsListe() {
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
      if (profilId && this.notificationsNonLues[profilId] && this.notificationsNonLues[profilId] > 0) {
        // Récupère ou crée l'indicateur de notification
        let indicateur = item.querySelector(".notification-indicator");
        
        if (!indicateur) {
          indicateur = document.createElement("span");
          indicateur.className = "notification-indicator";
          item.appendChild(indicateur);
        }
        
        // Met à jour le contenu de l'indicateur
        indicateur.textContent = this.notificationsNonLues[profilId] > 9 ? "9+" : this.notificationsNonLues[profilId].toString();
        indicateur.style.display = "flex";
      } else {
        // Si pas de notifications, masque l'indicateur s'il existe
        const indicateur = item.querySelector(".notification-indicator");
        if (indicateur) {
          indicateur.style.display = "none";
        }
      }
    });
  }
};

// Exporter pour utilisation dans d'autres modules
window.MonHistoire = MonHistoire;
