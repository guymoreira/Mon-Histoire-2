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
        
        if (data.partageParPrenom && !estPartageParProfilActif) {
          // Affiche la notification sans marquer l'histoire comme vue immédiatement
          this.afficherNotificationPartage(data.partageParPrenom, doc.ref);
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

      // Vérifier si l'utilisateur est connecté et si la connexion est active
      const user = firebase.auth().currentUser;
      if (!user || !MonHistoire.state.isConnected) {
        MonHistoire.logger.warning("Impossible de configurer les écouteurs: utilisateur non connecté ou connexion inactive");
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
        // Ne traite que les documents ajoutés
        if (change.type === "added") {
          const data = change.doc.data();
          
          // Vérifie si l'histoire n'a pas été partagée par le profil actif lui-même
          // (sauf pour le profil parent qui doit voir toutes les notifications)
          const estPartageParProfilActif = 
            MonHistoire.state.profilActif.type !== "parent" && 
            data.partageParProfil === MonHistoire.state.profilActif.id;
          
          if (data.partageParPrenom && !estPartageParProfilActif) {
            // Incrémente le compteur de notifications non lues
            const profilId = MonHistoire.state.profilActif.type === "parent" ? "parent" : MonHistoire.state.profilActif.id;
            this.notificationsNonLues[profilId] = (this.notificationsNonLues[profilId] || 0) + 1;
            
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
        if (change.type === "added") {
          const data = change.doc.data();
          
          if (data.partageParPrenom) {
            // Affiche la notification
            this.afficherNotificationPartage(data.partageParPrenom, change.doc.ref);
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
    if (!this.histoireAPartager) {
      this.fermerModalePartage();
      return;
    }

    const user = firebase.auth().currentUser;
    if (!user) {
      MonHistoire.showMessageModal("Tu dois être connecté pour partager une histoire.");
      this.fermerModalePartage();
      return;
    }
    
    // Vérifier si l'appareil est connecté
    if (!navigator.onLine || !MonHistoire.state.isConnected) {
      // Ajouter l'opération à la file d'attente hors ligne
      MonHistoire.addToOfflineQueue('partageHistoire', {
        type: type,
        id: id,
        prenom: prenom,
        histoire: this.histoireAPartager,
        profilActif: MonHistoire.state.profilActif
      });
      
      this.fermerModalePartage();
      MonHistoire.showMessageModal(`L'histoire sera partagée avec ${prenom} dès que la connexion sera rétablie.`);
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

      // Ajoute l'histoire partagée
      await targetRef.add({
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
      
      // Supprimer le verrou
      await lockRef.delete();

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
        MonHistoire.core.auth.logActivite("partage_histoire", { 
          destinataire_type: type,
          destinataire_id: id,
          destinataire_prenom: prenom
        });
      }

      this.fermerModalePartage();
      MonHistoire.showMessageModal(`Histoire partagée avec ${prenom} !`);
    } catch (error) {
      console.error("Erreur lors du partage :", error);
      MonHistoire.showMessageModal("Erreur lors du partage : " + error.message);
      this.fermerModalePartage();
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
  
  // Vérifie l'état de la connexion
  isConnected() {
    return navigator.onLine && MonHistoire.state.isConnected;
  }
};

// Exporter pour utilisation dans d'autres modules
window.MonHistoire = MonHistoire;
