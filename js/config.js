// js/config.js
// Configuration de l'application

// S'assurer que l'objet global existe
window.MonHistoire = window.MonHistoire || {};

// Module de configuration
MonHistoire.config = {
  // Constantes de l'application
  MAX_HISTOIRES: 10,
  SEUIL_ALERTE_HISTOIRES: 8,
  MAX_PROFILS_ENFANTS: 5,
  
  // Messages d'erreur Firebase
  firebaseErrorMessages: {
    "auth/invalid-credential": "Email ou mot de passe incorrect.",
    "auth/user-not-found": "Aucun compte ne correspond à cet email.",
    "auth/wrong-password": "Mot de passe incorrect.",
    "auth/email-already-in-use": "Cet email est déjà utilisé par un autre compte.",
    "auth/weak-password": "Le mot de passe doit contenir au moins 6 caractères.",
    "auth/invalid-email": "L'adresse email n'est pas valide.",
    "auth/requires-recent-login": "Pour des raisons de sécurité, veuillez vous reconnecter avant de modifier votre adresse email.",
    "auth/too-many-requests": "Trop de tentatives. Veuillez réessayer plus tard.",
    "auth/operation-not-allowed": "Veuillez vérifier votre nouvelle adresse email avant de la modifier. Une vérification est nécessaire."
  },
  
  // Configuration Firebase
  initFirebase() {
    // Firebase est déjà initialisé dans index.html
    // Cette fonction est conservée pour d'éventuelles configurations supplémentaires
    
    // Nous ne configurons pas Firestore ici car c'est déjà fait dans index.html
    console.log("Vérification de la configuration Firebase");
    
    // Configuration de Firebase Realtime Database
    try {
      if (firebase.database) {
        // Vérifier si l'URL de la base de données est correcte
        const dbURL = firebase.database().ref().toString();
        console.log("URL Firebase Realtime Database:", dbURL);
        
        // Configurer les écouteurs de connectivité Firebase
        const connectedRef = firebase.database().ref(".info/connected");
        connectedRef.on("value", (snap) => {
          if (snap.val() === true) {
            console.log("Connecté à Firebase Realtime Database");
            // Émettre un événement pour informer les autres modules
            if (MonHistoire.events) {
              MonHistoire.events.emit("realtimeDbConnected", true);
            }
          } else {
            console.log("Déconnecté de Firebase Realtime Database");
            // Émettre un événement pour informer les autres modules
            if (MonHistoire.events) {
              MonHistoire.events.emit("realtimeDbConnected", false);
            }
          }
        });
        
        // Note: La méthode setPersistenceEnabled n'est pas disponible dans cette version de Firebase
        // Utiliser plutôt les paramètres de connexion par défaut qui incluent déjà la persistance
        console.log("Firebase Realtime Database configurée avec les paramètres par défaut");
      } else {
        console.warn("Firebase Realtime Database n'est pas disponible");
        // Émettre un événement pour informer les autres modules
        if (MonHistoire.events) {
          MonHistoire.events.emit("realtimeDbAvailable", false);
        }
      }
    } catch (error) {
      console.warn("Erreur lors de la configuration de Firebase Realtime Database:", error);
      // Émettre un événement pour informer les autres modules
      if (MonHistoire.events) {
        MonHistoire.events.emit("realtimeDbAvailable", false);
      }
    }
  },
  
  // Règles de validation
  validation: {
    // Validation du mot de passe
    password: {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumber: true,
      requireSpecial: false
    },
    
    // Validation du prénom
    prenom: {
      minLength: 2,
      maxLength: 30
    },
    
    // Validation du titre d'histoire
    titreHistoire: {
      minLength: 3,
      maxLength: 50
    }
  },
  
  // Textes par défaut
  textes: {
    titreHistoireDefaut: "Mon Histoire Magique",
    messageErreurConnexion: "Erreur de connexion. Vérifie ton email et ton mot de passe.",
    messageErreurInscription: "Erreur lors de l'inscription. Cet email est peut-être déjà utilisé.",
    messageConfirmationInscription: "Ton compte a été créé avec succès !",
    messageConfirmationDeconnexion: "Tu as été déconnecté avec succès.",
    messageConfirmationSauvegarde: "Ton histoire a été sauvegardée avec succès !",
    messageConfirmationSuppression: "L'histoire a été supprimée avec succès !",
    messageConfirmationPartage: "Ton histoire a été partagée avec succès !",
    messageErreurGeneration: "Désolé, une erreur est survenue lors de la génération de l'histoire. Merci de réessayer."
  },
  
  // Configuration des illustrations
  illustrations: {
    // Correspondance entre les types de personnages et les noms de fichiers
    personnages: {
      princesse: "princesse",
      prince: "prince",
      chevalier: "chevalier",
      sorcier: "sorcier",
      sorciere: "sorciere",
      fee: "fee",
      pirate: "pirate",
      dragon: "dragon",
      licorne: "licorne",
      villageois: "villageois"
    },
    
    // Correspondance entre les types de lieux et les noms de fichiers
    lieux: {
      chateau: "chateau",
      foret: "foret",
      montagne: "montagne",
      plage: "plage",
      grotte: "grotte",
      lac: "lac",
      marais: "marais",
      tour: "tour",
      caverne: "caverne"
    }
  }
};

// Exporter pour utilisation dans d'autres modules
window.MonHistoire = MonHistoire;
