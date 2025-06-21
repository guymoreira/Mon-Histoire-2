// js/adapters/core-profiles-adapter.js
// Adaptateur pour rediriger les appels de l'ancien namespace (MonHistoire.core.profiles)
// vers le nouveau namespace (MonHistoire.modules.user.profiles)

(function() {
  // S'assurer que les namespaces existent
  window.MonHistoire = window.MonHistoire || {};
  MonHistoire.core = MonHistoire.core || {};
  
  // Vérifier si le module de profils modularisé existe
  if (!MonHistoire.modules || !MonHistoire.modules.user || !MonHistoire.modules.user.profiles) {
    console.error("Module de profils modularisé non trouvé. L'adaptateur ne fonctionnera pas correctement.");
    return;
  }
  
  // Créer un proxy pour rediriger les appels
  MonHistoire.core.profiles = {
    // Méthodes de gestion des profils
    getProfiles: function() {
      console.log("[Adapter] Redirection de getProfiles vers modules.user.profiles.getProfiles");
      return MonHistoire.modules.user.profiles.getProfiles();
    },
    
    getCurrentProfile: function() {
      console.log("[Adapter] Redirection de getCurrentProfile vers modules.user.profiles.getCurrentProfile");
      return MonHistoire.modules.user.profiles.getCurrentProfile();
    },
    
    selectProfile: function(profileId) {
      console.log("[Adapter] Redirection de selectProfile vers modules.user.profiles.selectProfile");
      return MonHistoire.modules.user.profiles.selectProfile(profileId);
    },
    
    createProfile: function(profileData) {
      console.log("[Adapter] Redirection de createProfile vers modules.user.profiles.createProfile");
      return MonHistoire.modules.user.profiles.createProfile(profileData);
    },
    
    updateProfile: function(profileId, profileData) {
      console.log("[Adapter] Redirection de updateProfile vers modules.user.profiles.updateProfile");
      return MonHistoire.modules.user.profiles.updateProfile(profileId, profileData);
    },
    
    deleteProfile: function(profileId) {
      console.log("[Adapter] Redirection de deleteProfile vers modules.user.profiles.deleteProfile");
      return MonHistoire.modules.user.profiles.deleteProfile(profileId);
    },
    
    // Méthode d'initialisation (pour compatibilité)
    init: function() {
      console.log("[Adapter] Redirection de init vers modules.user.profiles.init");
      // Appeler la méthode d'initialisation du module modularisé
      if (typeof MonHistoire.modules.user.profiles.init === 'function') {
        return MonHistoire.modules.user.profiles.init();
      }
      return Promise.resolve();
    }
  };
  
  console.log("[Adapter] Adaptateur de profils (core) initialisé avec succès");
})();
