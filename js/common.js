// js/common.js
// Fonctions utilitaires communes pour l'application

window.MonHistoire = window.MonHistoire || {};
MonHistoire.common = MonHistoire.common || {};

/**
 * Exécute un callback lorsque MonHistoire.events est disponible.
 * Réessaie plusieurs fois avant d'abandonner.
 * 
 * @param {Function} callback - Fonction de rappel des écouteurs.
 * @param {number} maxAttempts - Nombre maximal de tentatives.
 */
MonHistoire.common.waitForEvents = function(callback, maxAttempts = 10) {
  let attempts = 0;
  
  function tryRegister() {
    if (MonHistoire.events && typeof MonHistoire.events.on === 'function') {
      callback();
    } else if (attempts < maxAttempts) {
      attempts++;
      setTimeout(tryRegister, 200);
    } else {
      console.error("Système d'événements non disponible");
    }
  }
  
  tryRegister();
};
