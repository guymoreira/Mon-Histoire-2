// js/modules/features/cookies.js
// Wrapper module delegating to js/features/cookies.js

window.MonHistoire = window.MonHistoire || {};
MonHistoire.modules = MonHistoire.modules || {};
MonHistoire.modules.features = MonHistoire.modules.features || {};

(function() {
  const getFeature = () => MonHistoire.features && MonHistoire.features.cookies;
  const apiMethods = [
    'init',
    'bindEvents',
    'afficherBanniereCookies',
    'masquerBanniereCookies',
    'accepterTousCookies',
    'ouvrirParametresCookies',
    'mettreAJourInterrupteurs',
    'sauvegarderPreferences',
    'appliquerPreferences'
  ];

  const moduleAPI = {};
  apiMethods.forEach(fn => {
    moduleAPI[fn] = function(...args) {
      const feature = getFeature();
      if (feature && typeof feature[fn] === 'function') {
        return feature[fn](...args);
      }
    };
  });

  Object.defineProperty(moduleAPI, 'preferences', {
    get() {
      const feature = getFeature();
      return feature ? feature.preferences : undefined;
    },
    set(value) {
      const feature = getFeature();
      if (feature) {
        feature.preferences = value;
      }
    }
  });

  MonHistoire.modules.features.cookies = moduleAPI;
})();
