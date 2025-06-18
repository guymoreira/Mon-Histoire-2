// js/modules/sharing/storage.js
// Wrapper delegating to js/features/sharing/storage.js

window.MonHistoire = window.MonHistoire || {};
MonHistoire.modules = MonHistoire.modules || {};
MonHistoire.modules.sharing = MonHistoire.modules.sharing || {};

(function() {
  const feature = () => MonHistoire.features && MonHistoire.features.sharing && MonHistoire.features.sharing.storage;
  const apiMethods = [
    'init',
    'partagerHistoire',
    'verifierHistoiresPartageesProfilActif',
    'processOfflinePartage'
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
  MonHistoire.modules.sharing.storage = api;
})();
