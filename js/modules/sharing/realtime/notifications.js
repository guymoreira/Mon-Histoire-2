// js/modules/sharing/realtime/notifications.js
// Wrapper delegating to js/features/sharing/realtime/notifications.js

window.MonHistoire = window.MonHistoire || {};
MonHistoire.modules = MonHistoire.modules || {};
MonHistoire.modules.sharing = MonHistoire.modules.sharing || {};
MonHistoire.modules.sharing.realtime = MonHistoire.modules.sharing.realtime || {};

(function() {
  const feature = () => MonHistoire.features && MonHistoire.features.sharing && MonHistoire.features.sharing.realtime && MonHistoire.features.sharing.realtime.notifications;
  const apiMethods = [
    'init',
    'configurerEcouteurNotificationsRealtime'
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
  MonHistoire.modules.sharing.realtime.notifications = api;
})();
