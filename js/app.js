// js/app.js
// Point d'entrée principal de l'application

// S'assurer que l'objet global existe
window.MonHistoire = window.MonHistoire || {};

// État global de l'application
MonHistoire.state = {
  // Navigation
  currentScreen: "accueil",
  previousScreen: null,
  
  // Gestion des histoires
  resultatSource: "formulaire",
  
  // Lecture audio
  lectureAudioEnCours: false,
  syntheseVocale: null,
  pauseAudio: false,
  
  // Profil actif (parent ou enfant)
  profilActif: localStorage.getItem("profilActif")
    ? JSON.parse(localStorage.getItem("profilActif"))
    : { type: "parent" },
    
  // Écouteur d'histoires partagées
  histoiresPartageesListener: null,
  
  // Gestion des profils enfants
  profilsEnfantModifies: [],
  idProfilEnfantActif: null
};

// Système d'événements pour la communication entre modules
MonHistoire.events = {
  listeners: {},
  
  // Ajouter un écouteur d'événement
  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  },
  
  // Déclencher un événement
  emit(event, data) {
    if (!this.listeners[event]) return;
    this.listeners[event].forEach(callback => callback(data));
  }
};

// Initialisation de l'application
MonHistoire.init = function() {
  console.log("[DEBUG] Initialisation de l'application MonHistoire");
  
  // Initialiser Firebase
  console.log("[DEBUG] Initialisation de Firebase");
  this.config.initFirebase();
  
// Initialiser les modules core
  console.log("[DEBUG] Initialisation des modules core");
  if (this.core && this.core.auth) {
    console.log("[DEBUG] Initialisation du module auth");
    this.core.auth.init();
  }
  if (this.core && this.core.navigation) {
    console.log("[DEBUG] Initialisation du module navigation");
    this.core.navigation.init();
  }
  if (this.core && this.core.profiles) {
    console.log("[DEBUG] Initialisation du module profiles");
    this.core.profiles.init();
  }
  if (this.core && this.core.storage) {
    console.log("[DEBUG] Initialisation du module storage");
    this.core.storage.init();
  }
  
  // Initialiser les modules features
  console.log("[DEBUG] Initialisation des modules features");
  if (this.features && this.features.stories && this.features.stories.generator) {
    console.log("[DEBUG] Initialisation du module stories.generator");
    this.features.stories.generator.init();
  }
  if (this.features && this.features.stories && this.features.stories.display) {
    console.log("[DEBUG] Initialisation du module stories.display");
    this.features.stories.display.init();
  }
  if (this.features && this.features.stories && this.features.stories.management) {
    console.log("[DEBUG] Initialisation du module stories.management");
    this.features.stories.management.init();
  }
  if (this.features && this.features.sharing) {
    console.log("[DEBUG] Initialisation du module sharing");
    this.features.sharing.init();
  }
  if (this.features && this.features.export) {
    console.log("[DEBUG] Initialisation du module export");
    this.features.export.init();
  }
  if (this.features && this.features.audio) {
    console.log("[DEBUG] Initialisation du module audio");
    this.features.audio.init();
  }
  if (this.features && this.features.cookies) {
    console.log("[DEBUG] Initialisation du module cookies");
    this.features.cookies.init();
  }
  
  // Initialiser l'interface utilisateur en dernier
  console.log("[DEBUG] Initialisation de l'interface utilisateur");
  if (this.ui) this.ui.init();
  
  // Écouteur d'authentification Firebase
  console.log("[DEBUG] Configuration de l'écouteur d'authentification Firebase");
  firebase.auth().onAuthStateChanged(function(user) {
    console.log("[DEBUG] Changement d'état d'authentification:", user ? "Connecté" : "Non connecté");
    if (user) {
      // Vérifier si une vérification d'email est en cours
      const emailVerificationPending = localStorage.getItem("emailVerificationPending");
      const newEmailAddress = localStorage.getItem("newEmailAddress");
      
      // Si l'utilisateur vient de vérifier son email
      if (emailVerificationPending === "true" && user.email === newEmailAddress) {
        // Nettoyer le localStorage
        localStorage.removeItem("emailVerificationPending");
        localStorage.removeItem("newEmailAddress");
        
        // Afficher un message de confirmation
        MonHistoire.showMessageModal(
          "Votre adresse email a été modifiée avec succès !",
          { forceTop: true }
        );
      }
      
      if (MonHistoire.core && MonHistoire.core.auth) {
        MonHistoire.core.auth.afficherUtilisateurConnecté();
      }
      if (MonHistoire.features && MonHistoire.features.stories) {
        console.log("[DEBUG] Appel à afficherHistoiresSauvegardees() après connexion");
        MonHistoire.features.stories.management.afficherHistoiresSauvegardees();
      } else {
        console.log("[DEBUG] ERREUR: Module stories non disponible pour afficher les histoires");
      }
      if (MonHistoire.ui) {
        MonHistoire.ui.bindLongPress();
      }
      // Vérifie s'il y a des histoires partagées
      if (MonHistoire.features && MonHistoire.features.sharing) {
        console.log("[DEBUG] Vérification des histoires partagées après connexion");
        MonHistoire.features.sharing.verifierHistoiresPartagees();
      }
    } else {
      if (MonHistoire.core && MonHistoire.core.auth) {
        MonHistoire.core.auth.afficherUtilisateurDéconnecté();
      }
      if (MonHistoire.features && MonHistoire.features.stories) {
        console.log("[DEBUG] Appel à afficherHistoiresSauvegardees() après déconnexion");
        MonHistoire.features.stories.management.afficherHistoiresSauvegardees();
      } else {
        console.log("[DEBUG] ERREUR: Module stories non disponible pour afficher les histoires");
      }
      if (MonHistoire.ui) {
        MonHistoire.ui.bindLongPress();
      }
    }
  });
};

// Fonction utilitaire pour afficher un message modal
MonHistoire.showMessageModal = function(message, options = {}) {
  // Options par défaut
  const defaults = {
    delay: 0,           // Délai avant d'afficher la modale (ms)
    duration: 0,        // Durée d'affichage automatique (0 = pas de fermeture auto)
    forceTop: false     // Force la modale à s'afficher au-dessus des autres
  };
  
  // Fusionner les options par défaut avec celles fournies
  const settings = { ...defaults, ...options };
  
  // Mettre à jour le contenu du message
  document.getElementById("message-modal-text").innerHTML = message;
  
  // Référence à la modale
  const modal = document.getElementById("message-modal");
  
  // Si on force l'affichage au-dessus des autres modales
  if (settings.forceTop) {
    // Augmenter temporairement le z-index
    const originalZIndex = modal.style.zIndex || '';
    modal.style.zIndex = '3000'; // Valeur supérieure aux autres modales
    
    // Restaurer le z-index original après l'animation
    setTimeout(() => {
      modal.style.zIndex = originalZIndex;
    }, 1000);
  }
  
  // Afficher la modale après le délai spécifié
  setTimeout(() => {
    modal.classList.add("show");
    
    // Si une durée d'affichage est spécifiée, fermer automatiquement
    if (settings.duration > 0) {
      setTimeout(() => {
        this.closeMessageModal();
      }, settings.duration);
    }
  }, settings.delay);
};

// Fonction utilitaire pour fermer un message modal
MonHistoire.closeMessageModal = function() {
  const modal = document.getElementById("message-modal");
  modal.classList.remove("show");
};

// Initialiser l'application quand le DOM est chargé
document.addEventListener('DOMContentLoaded', function() {
  // Activer le lien RGPD dans le footer
  const rgpdLink = document.getElementById('link-rgpd');
  if (rgpdLink) {
    rgpdLink.onclick = function(e) {
      e.preventDefault();
      document.getElementById('modal-rgpd').classList.add('show');
    };
  }
  
  
  // Initialiser l'application
  MonHistoire.init();
});

// Exporter pour utilisation dans d'autres modules
window.MonHistoire = MonHistoire;
