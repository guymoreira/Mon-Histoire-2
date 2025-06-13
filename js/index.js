// Point d'entrée principal de l'application
// Ce fichier est chargé après firebase-init.js et avant les autres scripts

// Initialisation de l'application
document.addEventListener('DOMContentLoaded', () => {
  console.log('Application Mon Histoire initialisée');
  
  // Vérification que Firebase est correctement initialisé
  if (typeof firebase !== 'undefined' && firebase.app) {
    console.log('Firebase est correctement initialisé');
  } else {
    console.error('Firebase n\'est pas correctement initialisé');
  }
});
