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

    // Vérifie l'existence du profil actif
    verifierExistenceProfil: async function() {
      console.log("[Adapter] Execution de verifierExistenceProfil");

      const user = firebase.auth().currentUser;
      if (!user) return;

      // Si le profil actif est un profil enfant
      if (MonHistoire.state && MonHistoire.state.profilActif && MonHistoire.state.profilActif.type === "enfant") {
        const profilId = MonHistoire.state.profilActif.id;
        try {
          const profilDoc = await firebase.firestore()
            .collection("users")
            .doc(user.uid)
            .collection("profils_enfant")
            .doc(profilId)
            .get();

          if (!profilDoc.exists) {
            console.log("[Adapter] Profil enfant supprimé détecté");
            if (typeof MonHistoire.showMessageModal === 'function') {
              MonHistoire.showMessageModal(
                "Ce profil a été supprimé par le compte parent. Vous allez être redirigé vers le profil parent.",
                {
                  callback: () => {
                    if (MonHistoire.core && MonHistoire.core.profiles && typeof MonHistoire.core.profiles.forcerRetourProfilParent === 'function') {
                      MonHistoire.core.profiles.forcerRetourProfilParent();
                    } else if (MonHistoire.modules && MonHistoire.modules.user && MonHistoire.modules.user.profiles && typeof MonHistoire.modules.user.profiles.passerAuProfilParent === 'function') {
                      MonHistoire.modules.user.profiles.passerAuProfilParent();
                    }
                  }
                }
              );
            }
          } else if (MonHistoire.core && MonHistoire.core.profiles && typeof MonHistoire.core.profiles.updateLastActiveTimestamp === 'function') {
            // Mettre à jour le timestamp de dernière activité si disponible
            MonHistoire.core.profiles.updateLastActiveTimestamp(MonHistoire.state.profilActif);
          }
        } catch (error) {
          if (MonHistoire.logger && MonHistoire.logger.error) {
            MonHistoire.logger.error("Erreur lors de la vérification du profil:", error);
          } else {
            console.error("Erreur lors de la vérification du profil:", error);
          }
        }
      } else if (MonHistoire.state && MonHistoire.state.profilActif && MonHistoire.state.profilActif.type === "parent") {
        if (MonHistoire.core && MonHistoire.core.profiles && typeof MonHistoire.core.profiles.updateLastActiveTimestamp === 'function') {
          MonHistoire.core.profiles.updateLastActiveTimestamp(MonHistoire.state.profilActif);
        }
      }
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
