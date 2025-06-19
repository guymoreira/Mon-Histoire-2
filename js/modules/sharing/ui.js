// js/features/sharing/ui.js
// Gestion de l'interface utilisateur pour le partage d'histoires

// S'assurer que les objets nécessaires existent
window.MonHistoire = window.MonHistoire || {};
MonHistoire.modules = MonHistoire.modules || {};
MonHistoire.modules.sharing = MonHistoire.modules.sharing || {};

// Module de gestion de l'interface utilisateur pour le partage
MonHistoire.modules.sharing.ui = {
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
    if (MonHistoire.modules && 
        MonHistoire.modules.stories && 
        MonHistoire.modules.stories.display) {
      let histoire = MonHistoire.modules.stories.display.getHistoireAffichee();

      // Fallback vers l'ancien namespace si aucune histoire n'est trouvée
      if (histoire === null &&
          MonHistoire.features &&
          MonHistoire.features.stories &&
          MonHistoire.features.stories.display &&
          typeof MonHistoire.features.stories.display.getHistoireAffichee === "function") {
        console.warn("[Partage] Utilisation du fallback getHistoireAffichee depuis MonHistoire.features");
        histoire = MonHistoire.features.stories.display.getHistoireAffichee();
      }
      
      // Si aucune histoire n'est affichée, on ne fait rien
      if (!histoire || (!histoire.chapitre1 && !histoire.contenu)) {
        MonHistoire.showMessageModal("Aucune histoire à partager.");
        return;
      }

      // Stocke temporairement l'histoire à partager
      MonHistoire.modules.sharing.histoireAPartager = {
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
          btnParent.className = "ui-button ui-button--primary";
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
          btn.className = "ui-button ui-button--primary";
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
    MonHistoire.modules.sharing.histoireAPartager = null;
  },
  
  // Partage l'histoire avec le profil sélectionné
  async partagerHistoire(type, id, prenom) {
    // Vérifier que l'histoire à partager existe
    if (!MonHistoire.modules.sharing.histoireAPartager) {
      this.fermerModalePartage();
      return;
    }
    
    // Déléguer au module de stockage
    if (MonHistoire.modules.sharing.storage && MonHistoire.modules.sharing.storage.partagerHistoire) {
      return MonHistoire.modules.sharing.storage.partagerHistoire(type, id, prenom, MonHistoire.modules.sharing.histoireAPartager);
    } else {
      console.error("Module de stockage non disponible pour le partage");
      this.fermerModalePartage();
      MonHistoire.showMessageModal("Erreur : module de stockage non disponible.");
      return false;
    }
  }
};
