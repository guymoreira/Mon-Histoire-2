// js/modules/features/export.js
// Wrapper module delegating to js/features/export.js

window.MonHistoire = window.MonHistoire || {};
MonHistoire.modules = MonHistoire.modules || {};
MonHistoire.modules.features = MonHistoire.modules.features || {};

(function() {
  const getFeature = () => MonHistoire.features && MonHistoire.features.export;
  const apiMethods = [
    'init',
    'exporterHistoirePDF',
    'chargerJsPDF',
    'imgSrcToDataURL',
    'genererPDF',
    'genererNomFichier'
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

  MonHistoire.modules.features.export = moduleAPI;
})();
