// js/adapters/storage-adapter.js
// Adaptateur pour rediriger les appels de l'ancien namespace (MonHistoire.core.storage)
// vers le nouveau namespace (MonHistoire.modules.core.storage)

(function() {
  // S'assurer que les namespaces existent
  window.MonHistoire = window.MonHistoire || {};
  MonHistoire.core = MonHistoire.core || {};
  
  // Vérifier si le module de stockage modularisé existe
  if (!MonHistoire.modules || !MonHistoire.modules.core || !MonHistoire.modules.core.storage) {
    console.error("Module de stockage modularisé non trouvé. L'adaptateur ne fonctionnera pas correctement.");
    return;
  }
  
  // Créer un proxy pour rediriger les appels
  MonHistoire.core.storage = {
    // Méthodes de récupération des histoires
    getHistoiresSauvegardees: function() {
      console.log("[Adapter] Redirection de getHistoiresSauvegardees vers modules.core.storage.getStories");
      // Utiliser le module modularisé pour récupérer les histoires
      return MonHistoire.modules.core.storage.getStories();
    },
    
    getHistoireById: function(id) {
      console.log("[Adapter] Redirection de getHistoireById vers modules.core.storage.getStory");
      return MonHistoire.modules.core.storage.getStory(id);
    },
    
    getHistoirePartagee: function(id) {
      console.log("[Adapter] Redirection de getHistoirePartagee vers modules.core.storage.accessSharedStory");
      return MonHistoire.modules.core.storage.accessSharedStory(id);
    },
    
    // Méthodes de sauvegarde et suppression
    sauvegarderHistoire: function(histoire) {
      console.log("[Adapter] Redirection de sauvegarderHistoire vers modules.core.storage.saveStory");
      return MonHistoire.modules.core.storage.saveStory(histoire);
    },
    
    supprimerHistoire: function(id) {
      console.log("[Adapter] Redirection de supprimerHistoire vers modules.core.storage.deleteStory");
      return MonHistoire.modules.core.storage.deleteStory(id);
    },
    
    // Méthodes de vérification du quota
    verifierQuotaHistoires: function() {
      console.log("[Adapter] Redirection de verifierQuotaHistoires");
      // Vérifier si le nombre d'histoires est inférieur au maximum autorisé
      return MonHistoire.modules.core.storage.getStories()
        .then(stories => {
          const maxHistoires = MonHistoire.config && MonHistoire.config.MAX_HISTOIRES ? MonHistoire.config.MAX_HISTOIRES : 10;
          return stories.length < maxHistoires;
        });
    },
    
    verifierSeuilAlerteHistoires: function() {
      console.log("[Adapter] Redirection de verifierSeuilAlerteHistoires");
      // Vérifier si le nombre d'histoires approche du maximum autorisé
      return MonHistoire.modules.core.storage.getStories()
        .then(stories => {
          const maxHistoires = MonHistoire.config && MonHistoire.config.MAX_HISTOIRES ? MonHistoire.config.MAX_HISTOIRES : 10;
          const seuilAlerte = MonHistoire.config && MonHistoire.config.SEUIL_ALERTE_HISTOIRES ? MonHistoire.config.SEUIL_ALERTE_HISTOIRES : Math.floor(maxHistoires * 0.8);
          return stories.length >= seuilAlerte && stories.length < maxHistoires;
        });
    },
    
    // Méthode de recalcul du nombre d'histoires
    recalculerNbHistoires: function() {
      console.log("[Adapter] Redirection de recalculerNbHistoires");
      // Cette fonctionnalité n'a pas d'équivalent direct dans le nouveau module
      // On peut simplement retourner une promesse résolue
      return Promise.resolve();
    },
    
    // Méthode d'initialisation (pour compatibilité)
    init: function() {
      console.log("[Adapter] Redirection de init vers modules.core.storage.init");
      // Appeler la méthode d'initialisation du module modularisé
      if (typeof MonHistoire.modules.core.storage.init === 'function') {
        return MonHistoire.modules.core.storage.init();
      }
      return Promise.resolve();
    }
  };
  
  console.log("[Adapter] Adaptateur de stockage initialisé avec succès");
})();
