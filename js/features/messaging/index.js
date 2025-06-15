// js/features/messaging/index.js
// Point d'entrée du module de messagerie

window.MonHistoire = window.MonHistoire || {};
MonHistoire.features = MonHistoire.features || {};
MonHistoire.features.messaging = MonHistoire.features.messaging || {};

(function() {
  const messaging = MonHistoire.features.messaging;

  try {
    if (messaging.storage) {
      messaging.storage.init && messaging.storage.init();
    }
    if (messaging.realtime) {
      messaging.realtime.init && messaging.realtime.init();
    }
    if (messaging.ui) {
      messaging.ui.init && messaging.ui.init();
    }

    // Exposer les fonctions principales si non présentes
    if (!messaging.getOrCreateConversation) {
      messaging.getOrCreateConversation = (...args) =>
        messaging.storage.getOrCreateConversation(...args);
    }
    if (!messaging.sendMessage) {
      messaging.sendMessage = (...args) =>
        messaging.storage.sendMessage(...args);
    }
    if (!messaging.listenToMessages) {
      messaging.listenToMessages = (...args) =>
        messaging.realtime.listenToMessages(...args);
    }
    if (!messaging.markAsRead) {
      messaging.markAsRead = (...args) =>
        messaging.storage.markAsRead(...args);
    }
    if (!messaging.hasUnreadMessages) {
      messaging.hasUnreadMessages = (...args) =>
        messaging.storage.hasUnreadMessages(...args);
    }

    console.log('Module de messagerie chargé');
  } catch (e) {
    console.error('Erreur lors de l\'initialisation de la messagerie', e);
  }
})();
