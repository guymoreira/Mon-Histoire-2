// js/modules/messaging/notifications.js
// Wrapper delegating to js/features/messaging/notifications.js

window.MonHistoire = window.MonHistoire || {};
MonHistoire.modules = MonHistoire.modules || {};
MonHistoire.modules.messaging = MonHistoire.modules.messaging || {};

(function() {
  const feature = () => MonHistoire.features && MonHistoire.features.messaging && MonHistoire.features.messaging.notifications;
  const apiMethods = [
    'init',
    'recalculerMessagesNonLus',
    'mettreAJourBadgeMessages',
    'mettreAJourBadgeConversations',
    'markConversationRead'
  ];
  const api = {};
  apiMethods.forEach(fn => {
    api[fn] = function(...args) {
      const f = feature();
      if (f && typeof f[fn] === 'function') {
        return f[fn](...args);
      }
    };
  });
  MonHistoire.modules.messaging.notifications = api;
})();
