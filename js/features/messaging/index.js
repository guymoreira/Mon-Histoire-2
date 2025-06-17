// js/features/messaging/index.js
// Point d'entrée du module de messagerie

window.MonHistoire = window.MonHistoire || {};
MonHistoire.features = MonHistoire.features || {};
MonHistoire.features.messaging = MonHistoire.features.messaging || {};

(function() {
  const messaging = MonHistoire.features.messaging;

  messaging.init = function() {
    try {
      if (messaging.storage && typeof messaging.storage.init === 'function') {
        messaging.storage.init();
      }
      if (messaging.realtime && typeof messaging.realtime.init === 'function') {
        messaging.realtime.init();
      }
      if (messaging.ui && typeof messaging.ui.init === 'function') {
        messaging.ui.init();
      }
      if (messaging.notifications && typeof messaging.notifications.init === 'function') {
        messaging.notifications.init();
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
      if (!messaging.markConversationRead) {
        messaging.markConversationRead = (...args) =>
          messaging.notifications.markConversationRead(...args);
      }

      console.log('Module de messagerie initialisé');
    } catch (e) {
      console.error('Erreur lors de l\'initialisation de la messagerie', e);
    }
  };
})();
