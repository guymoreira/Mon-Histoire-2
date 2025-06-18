// js/modules/messaging/ui.js
// Wrapper delegating to js/features/messaging/ui.js

window.MonHistoire = window.MonHistoire || {};
MonHistoire.modules = MonHistoire.modules || {};
MonHistoire.modules.messaging = MonHistoire.modules.messaging || {};

(function() {
  const feature = () => MonHistoire.features && MonHistoire.features.messaging && MonHistoire.features.messaging.ui;
  const apiMethods = [
    'init',
    'openConversationsModal',
    'closeConversationsModal',
    'startNewConversation',
    'openConversation',
    'closeConversation',
    'sendCurrentMessage'
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
  MonHistoire.modules.messaging.ui = api;
})();
