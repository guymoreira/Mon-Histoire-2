// js/modules/messaging/storage.js
// Wrapper delegating to js/features/messaging/storage.js

window.MonHistoire = window.MonHistoire || {};
MonHistoire.modules = MonHistoire.modules || {};
MonHistoire.modules.messaging = MonHistoire.modules.messaging || {};

(function() {
  const feature = () => MonHistoire.features && MonHistoire.features.messaging && MonHistoire.features.messaging.storage;
  const apiMethods = [
    'init',
    'getOrCreateConversation',
    'sendMessage',
    'processOfflineMessage',
    'markAsRead',
    'hasUnreadMessages'
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
  MonHistoire.modules.messaging.storage = api;
})();
