// js/adapters/navigation-adapter.js
// Adaptateur pour rediriger les appels de l'ancien namespace (MonHistoire.core.navigation)
// vers le nouveau namespace (MonHistoire.modules.core.navigation)

(function() {
  // S'assurer que les namespaces existent
  window.MonHistoire = window.MonHistoire || {};
  MonHistoire.core = MonHistoire.core || {};
  
  // Vérifier si le module de navigation modularisé existe
  if (!MonHistoire.modules || !MonHistoire.modules.core || !MonHistoire.modules.core.navigation) {
    console.error("Module de navigation modularisé non trouvé. L'adaptateur ne fonctionnera pas correctement.");
    return;
  }
  
  // Créer un proxy pour rediriger les appels
  MonHistoire.core.navigation = {
    // Méthode pour afficher un écran
    showScreen: function(screenId, options) {
      console.log("[Adapter] Redirection de showScreen vers modules.core.navigation.showScreen");
      return MonHistoire.modules.core.navigation.showScreen(screenId, options);
    },
    
    // Méthode pour obtenir l'écran actif
    getActiveScreen: function() {
      console.log("[Adapter] Redirection de getActiveScreen vers modules.core.navigation.getCurrentScreen");
      return MonHistoire.modules.core.navigation.getCurrentScreen();
    },
    
    // Méthode pour vérifier si un écran est actif
    isScreenActive: function(screenId) {
      console.log("[Adapter] Redirection de isScreenActive");
      // Implémentation basée sur getCurrentScreen
      return MonHistoire.modules.core.navigation.getCurrentScreen() === screenId;
    },
    
    // Méthode pour naviguer vers l'écran précédent
    goBack: function() {
      console.log("[Adapter] Redirection de goBack vers modules.core.navigation.goBack");
      return MonHistoire.modules.core.navigation.goBack();
    },
    
    // Méthode pour naviguer vers l'accueil
    goHome: function() {
      console.log("[Adapter] Redirection de goHome vers modules.core.navigation.navigateTo('accueil')");
      // Utiliser navigateTo avec l'écran d'accueil
      return MonHistoire.modules.core.navigation.navigateTo('accueil');
    },
    
    // Méthode d'initialisation (pour compatibilité)
    init: function() {
      console.log("[Adapter] Redirection de init vers modules.core.navigation.init");
      // Appeler la méthode d'initialisation du module modularisé
      if (typeof MonHistoire.modules.core.navigation.init === 'function') {
        return MonHistoire.modules.core.navigation.init();
      }
      return Promise.resolve();
    }
  };
  
  console.log("[Adapter] Adaptateur de navigation initialisé avec succès");
})();
