// js/features/sharing/ui.js
// Gestion de l'interface utilisateur pour le partage d'histoires

// S'assurer que les objets nécessaires existent
window.MonHistoire = window.MonHistoire || {};
MonHistoire.features = MonHistoire.features || {};
MonHistoire.features.sharing = MonHistoire.features.sharing || {};

// Module de gestion de l'interface utilisateur pour le partage
MonHistoire.features.sharing.ui = {
  // Initialisation du module
  init() {
    console.log("Module d'interface utilisateur pour le partage initialisé");
    
    // Initialiser les écouteurs d'événements pour le partage
    this.initPartageListeners();
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
      MonHistoire.features.sharing.histoireAPartager = {
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
    MonHistoire.features.sharing.histoireAPartager = null;
  },
  
  // Partage l'histoire avec le profil sélectionné
  async partagerHistoire(type, id, prenom) {
    // Fermer la modale après un délai pour éviter qu'elle reste bloquée
    const fermerModaleAvecDelai = () => {
      setTimeout(() => {
        this.fermerModalePartage();
      }, 300);
    };
    
    if (!MonHistoire.features.sharing.histoireAPartager) {
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
          histoire: MonHistoire.features.sharing.histoireAPartager,
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
        titre: MonHistoire.features.sharing.histoireAPartager.titre,
        chapitre1: MonHistoire.features.sharing.histoireAPartager.chapitre1 || "",
        chapitre2: MonHistoire.features.sharing.histoireAPartager.chapitre2 || "",
        chapitre3: MonHistoire.features.sharing.histoireAPartager.chapitre3 || "",
        chapitre4: MonHistoire.features.sharing.histoireAPartager.chapitre4 || "",
        chapitre5: MonHistoire.features.sharing.histoireAPartager.chapitre5 || "",
        contenu: MonHistoire.features.sharing.histoireAPartager.contenu || "",
        images: MonHistoire.features.sharing.histoireAPartager.images || [],
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
            titre: MonHistoire.features.sharing.histoireAPartager.titre,
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
  }
};
