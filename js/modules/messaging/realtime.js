// js/modules/messaging/realtime.js
// Wrapper delegating to js/features/messaging/realtime.js

window.MonHistoire = window.MonHistoire || {};
MonHistoire.modules = MonHistoire.modules || {};
MonHistoire.modules.messaging = MonHistoire.modules.messaging || {};

(function() {
  const feature = () => MonHistoire.features && MonHistoire.features.messaging && MonHistoire.features.messaging.realtime;
  const apiMethods = [
    'init',
    'listenToMessages',
    'listenToUnreadMessages'
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
  MonHistoire.modules.messaging.realtime = api;
})();
