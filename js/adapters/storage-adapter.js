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
    // Méthode d'initialisation
    init: function() {
      console.log("[Adapter] Redirection de storage.init vers modules.core.storage.init");
      return MonHistoire.modules.core.storage.init();
    },
    
    // Méthodes pour les profils
    createProfile: function(profileData) {
      console.log("[Adapter] Redirection de createProfile vers modules.core.storage.createProfile");
      return MonHistoire.modules.core.storage.createProfile(profileData);
    },
    
    updateProfile: function(profileId, profileData) {
      console.log("[Adapter] Redirection de updateProfile vers modules.core.storage.updateProfile");
      return MonHistoire.modules.core.storage.updateProfile(profileId, profileData);
    },
    
    deleteProfile: function(profileId) {
      console.log("[Adapter] Redirection de deleteProfile vers modules.core.storage.deleteProfile");
      return MonHistoire.modules.core.storage.deleteProfile(profileId);
    },
    
    getProfile: function(profileId) {
      console.log("[Adapter] Redirection de getProfile vers modules.core.storage.getProfile");
      return MonHistoire.modules.core.storage.getProfile(profileId);
    },
    
    getProfiles: function() {
      console.log("[Adapter] Redirection de getProfiles vers modules.core.storage.getProfiles");
      return MonHistoire.modules.core.storage.getProfiles();
    },
    
    uploadProfileImage: function(profileId, file) {
      console.log("[Adapter] Redirection de uploadProfileImage vers modules.core.storage.uploadProfileImage");
      return MonHistoire.modules.core.storage.uploadProfileImage(profileId, file);
    },
    
    // Méthodes pour les histoires
    getStoryTemplates: function() {
      console.log("[Adapter] Redirection de getStoryTemplates vers modules.core.storage.getStoryTemplates");
      return MonHistoire.modules.core.storage.getStoryTemplates();
    },
    
    generateStory: function(data) {
      console.log("[Adapter] Redirection de generateStory vers modules.core.storage.generateStory");
      return MonHistoire.modules.core.storage.generateStory(data);
    },
    
    saveStory: function(storyData) {
      console.log("[Adapter] Redirection de saveStory vers modules.core.storage.saveStory");
      
      // Vérifier si l'utilisateur est connecté
      if (!firebase.auth().currentUser) {
        console.error("[Adapter] Tentative de sauvegarde d'histoire sans être connecté");
        return Promise.reject(new Error("Utilisateur non connecté"));
      }
      
      // Vérifier si les données de l'histoire sont valides
      if (!storyData) {
        console.error("[Adapter] Données d'histoire invalides");
        return Promise.reject(new Error("Données d'histoire invalides"));
      }
      
      // Récupérer le profil actif
      const profilActif = (MonHistoire.state && MonHistoire.state.profilActif) ||
        (localStorage.getItem('profilActif') ? JSON.parse(localStorage.getItem('profilActif')) : { type: 'parent' });
      
      // Ajouter l'ID du profil actif si c'est un profil enfant
      if (profilActif.type === 'enfant' && profilActif.id) {
        storyData.profileId = profilActif.id;
      }
      
      // Ajouter la date de création si elle n'existe pas
      if (!storyData.createdAt) {
        storyData.createdAt = new Date().toISOString();
      }
      
      // Ajouter l'ID de l'utilisateur
      storyData.userId = firebase.auth().currentUser.uid;
      
      // Appeler la fonction saveStory du module modularisé
      return MonHistoire.modules.core.storage.saveStory(storyData)
        .then(storyId => {
          console.log("[Adapter] Histoire sauvegardée avec succès, ID:", storyId);
          
          // Mettre à jour le compteur d'histoires
          if (profilActif.type === 'enfant' && profilActif.id) {
            MonHistoire.modules.core.storage.recalculerNbHistoires && 
              MonHistoire.modules.core.storage.recalculerNbHistoires();
          }
          
          return storyId;
        })
        .catch(error => {
          console.error("[Adapter] Erreur lors de la sauvegarde de l'histoire:", error);
          throw error;
        });
    },
    
    updateStoryTitle: function(storyId, title) {
      console.log("[Adapter] Redirection de updateStoryTitle vers modules.core.storage.updateStoryTitle");
      return MonHistoire.modules.core.storage.updateStoryTitle(storyId, title);
    },
    
    deleteStory: function(storyId) {
      console.log("[Adapter] Redirection de deleteStory vers modules.core.storage.deleteStory");
      return MonHistoire.modules.core.storage.deleteStory(storyId);
    },
    
    getStory: function(storyId) {
      console.log("[Adapter] Redirection de getStory vers modules.core.storage.getStory");
      return MonHistoire.modules.core.storage.getStory(storyId);
    },
    
    getStories: function(profileId) {
      console.log("[Adapter] Redirection de getStories vers modules.core.storage.getStories");
      return MonHistoire.modules.core.storage.getStories(profileId);
    },
    
    uploadStoryImage: function(storyId, file) {
      console.log("[Adapter] Redirection de uploadStoryImage vers modules.core.storage.uploadStoryImage");
      return MonHistoire.modules.core.storage.uploadStoryImage(storyId, file);
    },
    
    // Méthodes pour le partage
    createShareLink: function(storyId, options) {
      console.log("[Adapter] Redirection de createShareLink vers modules.core.storage.createShareLink");
      return MonHistoire.modules.core.storage.createShareLink(storyId, options);
    },
    
    deleteShareLink: function(shareId) {
      console.log("[Adapter] Redirection de deleteShareLink vers modules.core.storage.deleteShareLink");
      return MonHistoire.modules.core.storage.deleteShareLink(shareId);
    },
    
    getShareLinks: function(storyId) {
      console.log("[Adapter] Redirection de getShareLinks vers modules.core.storage.getShareLinks");
      return MonHistoire.modules.core.storage.getShareLinks(storyId);
    },
    
    accessSharedStory: function(shareId, password) {
      console.log("[Adapter] Redirection de accessSharedStory vers modules.core.storage.accessSharedStory");
      return MonHistoire.modules.core.storage.accessSharedStory(shareId, password);
    },
    
    // Méthodes pour les quotas
    verifierQuotaHistoires: function() {
      console.log("[Adapter] Redirection de verifierQuotaHistoires vers modules.core.storage.verifierQuotaHistoires");
      return MonHistoire.modules.core.storage.verifierQuotaHistoires();
    },
    
    verifierSeuilAlerteHistoires: function() {
      console.log("[Adapter] Redirection de verifierSeuilAlerteHistoires vers modules.core.storage.verifierSeuilAlerteHistoires");
      return MonHistoire.modules.core.storage.verifierSeuilAlerteHistoires();
    },
    
    recalculerNbHistoires: function() {
      console.log("[Adapter] Redirection de recalculerNbHistoires vers modules.core.storage.recalculerNbHistoires");
      return MonHistoire.modules.core.storage.recalculerNbHistoires();
    }
  };
  
  console.log("[Adapter] Adaptateur de stockage initialisé avec succès");
})();
