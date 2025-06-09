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
    
    // Configuration de Firestore avec la nouvelle méthode de cache
    const db = firebase.firestore();
    
    try {
      // Utilisation de la nouvelle méthode de cache recommandée
      db.settings({
        cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED,
        merge: true, // Évite l'avertissement "You are overriding the original host"
        cache: {
          synchronizeTabs: true
        }
      });
      
      console.log("Configuration Firestore avec cache multi-onglets activée");
    } catch (err) {
      console.warn("Erreur lors de la configuration du cache Firestore:", err);
      
      // Fallback à la configuration de base si la nouvelle méthode échoue
      db.settings({
        cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED,
        merge: true
      });
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
