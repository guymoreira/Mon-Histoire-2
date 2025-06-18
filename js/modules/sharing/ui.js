// js/modules/sharing/ui.js
// Wrapper delegating to js/features/sharing/ui.js

window.MonHistoire = window.MonHistoire || {};
MonHistoire.modules = MonHistoire.modules || {};
MonHistoire.modules.sharing = MonHistoire.modules.sharing || {};

(function() {
  const feature = () => MonHistoire.features && MonHistoire.features.sharing && MonHistoire.features.sharing.ui;
  const apiMethods = [
    'init',
    'initPartageListeners',
    'ouvrirModalePartage',
    'fermerModalePartage',
    'partagerHistoire'
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
  MonHistoire.modules.sharing.ui = api;
})();
