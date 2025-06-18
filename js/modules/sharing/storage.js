// js/features/sharing/storage.js
// Gestion du stockage des histoires partagées

// S'assurer que les objets nécessaires existent
window.MonHistoire = window.MonHistoire || {};
MonHistoire.modules = MonHistoire.modules || {};
MonHistoire.modules.sharing = MonHistoire.modules.sharing || {};

// Module de gestion du stockage des histoires partagées
MonHistoire.modules.sharing.storage = {
  // Initialisation du module
  init() {
    console.log("Module de stockage des histoires partagées initialisé");
  },
  
  // Partage une histoire avec un profil
  async partagerHistoire(type, id, prenom, histoire) {
    try {
      const user = firebase.auth().currentUser;
      if (!user) {
        MonHistoire.showMessageModal("Tu dois être connecté pour partager une histoire.");
        return false;
      }
      
      // Vérifie si l'appareil est connecté
      if (!MonHistoire.modules.sharing.isConnected()) {
        // Ajoute l'opération à la file d'attente hors ligne
        if (typeof MonHistoire.addToOfflineQueue === 'function') {
          MonHistoire.addToOfflineQueue("partageHistoire", {
            type: type,
            id: id,
            prenom: prenom,
            histoire: histoire,
            profilActif: MonHistoire.state.profilActif
          });
        } else {
          console.error("La fonction addToOfflineQueue n'est pas disponible");
          MonHistoire.showMessageModal("Une erreur est survenue. Réessaie plus tard quand tu seras connecté à Internet.");
          return false;
        }
        
        // Ferme la modale de partage
        if (MonHistoire.modules.sharing.fermerModalePartage) {
          MonHistoire.modules.sharing.fermerModalePartage();
        }
        
        // Affiche un message de confirmation
        MonHistoire.showMessageModal("L'histoire sera partagée dès que tu seras connecté à Internet.");
        return true;
      }
      
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
        version: 1
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

      // Envoie une notification en temps réel
      if (firebase.database) {
        try {
          const notificationsRef = firebase.database()
            .ref(`users/${user.uid}/notifications/${destinataireProfil}`);
          
          await notificationsRef.push({
            partageParPrenom: partageParPrenom,
            partageParProfil: partageParProfil,
            timestamp: firebase.database.ServerValue.TIMESTAMP
          });
        } catch (error) {
          console.warn("Erreur lors de l'envoi de la notification en temps réel:", error);
        }
      }

      // Log de l'activité
      if (MonHistoire.core && MonHistoire.core.auth) {
        MonHistoire.core.auth.logActivite("partage_histoire", { 
          destinataire_type: type,
          destinataire_id: id,
          destinataire_prenom: prenom
        });
      }
      
      // Ferme la modale de partage
      if (MonHistoire.modules.sharing.fermerModalePartage) {
        MonHistoire.modules.sharing.fermerModalePartage();
      }
      
      // Affiche un message de confirmation
      MonHistoire.showMessageModal(`Histoire partagée avec ${prenom} !`);
      return true;
    } catch (error) {
      console.error("Erreur lors du partage de l'histoire:", error);
      
      // Ferme la modale de partage
      if (MonHistoire.modules.sharing.fermerModalePartage) {
        MonHistoire.modules.sharing.fermerModalePartage();
      }
      
      // Affiche un message d'erreur
      MonHistoire.showMessageModal("Une erreur est survenue lors du partage de l'histoire. Réessaie plus tard.");
      return false;
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
        if (!MonHistoire.modules.sharing.notificationsTraitees) {
          MonHistoire.modules.sharing.notificationsTraitees = new Set();
        }
        
        // Ne pas afficher automatiquement la notification lors du changement de profil
        // Juste mettre à jour le compteur pour l'interface
        if (data.partageParPrenom && !estPartageParProfilActif) {
          // Ajouter l'ID à la liste des notifications traitées
          MonHistoire.modules.sharing.notificationsTraitees.add(notificationId);
          
          // Mettre à jour le compteur de notifications
          const profilId = MonHistoire.state.profilActif.type === "parent" ? "parent" : MonHistoire.state.profilActif.id;
          MonHistoire.modules.sharing.notificationsNonLues[profilId] = (MonHistoire.modules.sharing.notificationsNonLues[profilId] || 0) + 1;
          
          // Log pour debug
          console.log(`Notification disponible pour ${profilId}: ${data.partageParPrenom} a partagé une histoire`);
        }
      }
    });
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
  }
};
