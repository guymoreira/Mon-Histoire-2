// js/adapters/stories-adapter.js
// Adaptateur pour rediriger les appels de l'ancien namespace (MonHistoire.features.stories)
// vers le nouveau namespace (MonHistoire.modules.stories)

(function() {
  // S'assurer que les namespaces existent
  window.MonHistoire = window.MonHistoire || {};
  MonHistoire.features = MonHistoire.features || {};
  MonHistoire.features.stories = MonHistoire.features.stories || {};
  
  // Vérifier si les modules d'histoires modularisés existent
  if (!MonHistoire.modules || !MonHistoire.modules.stories) {
    console.error("Modules d'histoires modularisés non trouvés. L'adaptateur ne fonctionnera pas correctement.");
    return;
  }
  
  // Adapter pour le module d'affichage
  if (MonHistoire.modules.stories.display) {
    MonHistoire.features.stories.display = {
      init: function() {
        console.log("[Adapter] Redirection de display.init vers modules.stories.display.init");
        return MonHistoire.modules.stories.display.init();
      },
      
      afficherHistoireSauvegardee: function(id) {
        console.log("[Adapter] Redirection de afficherHistoireSauvegardee");
        // Indique qu'on vient de "mes-histoires" (pour le bouton Sauvegarder)
        MonHistoire.state = MonHistoire.state || {};
        MonHistoire.state.resultatSource = "mes-histoires";
        
        // Récupère l'histoire depuis le stockage
        if (MonHistoire.modules.core && MonHistoire.modules.core.storage) {
          return MonHistoire.modules.core.storage.getStory(id)
            .then(histoire => {
              // Affiche l'histoire
              MonHistoire.modules.stories.display.showStory(histoire);
              
              // Affiche l'écran de résultat
              if (MonHistoire.modules.core && MonHistoire.modules.core.navigation) {
                MonHistoire.modules.core.navigation.showScreen("resultat");
              }
              
              // Log l'activité
              if (MonHistoire.modules.user && MonHistoire.modules.user.auth && firebase.auth().currentUser) {
                MonHistoire.modules.user.auth.logActivity("lecture_histoire", { histoire_id: id });
              }
            })
            .catch(error => {
              console.error("Erreur lors de la récupération de l'histoire:", error);
              if (MonHistoire.showMessageModal) {
                MonHistoire.showMessageModal("Erreur lors de la récupération de l'histoire.");
              }
            });
        }
      },
      
      afficherHistoirePartagee: function(id) {
        console.log("[Adapter] Redirection de afficherHistoirePartagee");
        // Indique qu'on vient de "partage" (pour le bouton Sauvegarder)
        MonHistoire.state = MonHistoire.state || {};
        MonHistoire.state.resultatSource = "partage";
        
        // Récupère l'histoire depuis le stockage
        if (MonHistoire.modules.core && MonHistoire.modules.core.storage) {
          return MonHistoire.modules.core.storage.accessSharedStory(id)
            .then(histoire => {
              // Affiche l'histoire
              MonHistoire.modules.stories.display.showStory(histoire);
              
              // Affiche l'écran de résultat
              if (MonHistoire.modules.core && MonHistoire.modules.core.navigation) {
                MonHistoire.modules.core.navigation.showScreen("resultat");
              }
              
              // Affiche un message indiquant l'auteur
              setTimeout(() => {
                const auteur = histoire.profil_enfant_prenom || histoire.auteur_prenom || "Anonyme";
                if (MonHistoire.showMessageModal) {
                  MonHistoire.showMessageModal(`Cette histoire a été créée par ${auteur}.`);
                }
              }, 500);
              
              // Log l'activité
              if (MonHistoire.modules.user && MonHistoire.modules.user.auth && firebase.auth().currentUser) {
                MonHistoire.modules.user.auth.logActivity("lecture_histoire_partagee", { partage_id: id });
              }
            })
            .catch(error => {
              console.error("Erreur lors de la récupération de l'histoire partagée:", error);
              if (MonHistoire.showMessageModal) {
                MonHistoire.showMessageModal("Erreur lors de la récupération de l'histoire partagée.");
              }
            });
        }
      },
      
      afficherHistoire: function(histoire) {
        console.log("[Adapter] Redirection de afficherHistoire vers modules.stories.display.showStory");
        return MonHistoire.modules.stories.display.showStory(histoire);
      },
      
      getHistoireAffichee: function() {
        console.log("[Adapter] Redirection de getHistoireAffichee vers modules.stories.display.getCurrentStory");
        return MonHistoire.modules.stories.display.getCurrentStory();
      },
      
      getValeursFormulaire: function() {
        console.log("[Adapter] Redirection de getValeursFormulaire");
        // Cette fonction n'a pas d'équivalent direct dans le nouveau module
        // On peut implémenter une version simplifiée ici
        const personnage = document.getElementById("personnage") ? document.getElementById("personnage").value : "";
        const lieu = document.getElementById("lieu") ? document.getElementById("lieu").value : "";
        
        return {
          personnage: personnage,
          lieu: lieu
        };
      },
      
      afficherIllustrations: function(personnage, lieu) {
        console.log("[Adapter] Redirection de afficherIllustrations");
        // Cette fonction n'a pas d'équivalent direct dans le nouveau module
        // On peut simplement retourner une promesse résolue
        return Promise.resolve();
      }
    };
    
    console.log("[Adapter] Adaptateur d'affichage d'histoires initialisé avec succès");
  }
  
  // Adapter pour le module de gestion
  if (MonHistoire.modules.stories.management) {
    MonHistoire.features.stories.management = {
      init: function() {
        console.log("[Adapter] Redirection de management.init vers modules.stories.management.init");
        return MonHistoire.modules.stories.management.init();
      },
      
      sauvegarderHistoire: function(histoire) {
        console.log("[Adapter] Redirection de sauvegarderHistoire vers modules.stories.management.saveStory");
        return MonHistoire.modules.stories.management.saveStory(histoire)
          .then((storyId) => {
            // Affiche un message de confirmation
            if (MonHistoire.showMessageModal) {
              MonHistoire.showMessageModal("Histoire sauvegardée avec succès !");
            }
            
            // Cache le bouton Sauvegarder
            const btnSauvegarde = document.getElementById("btn-sauvegarde");
            if (btnSauvegarde) {
              btnSauvegarde.style.display = "none";
            }
            
            return storyId;
          });
      },
      
      supprimerHistoire: function(id) {
        console.log("[Adapter] Redirection de supprimerHistoire vers modules.stories.management.deleteStory");
        // Demande confirmation
        if (!confirm("Es-tu sûr de vouloir supprimer cette histoire ?")) {
          return Promise.resolve();
        }
        
        return MonHistoire.modules.stories.management.deleteStory(id)
          .then(() => {
            // Affiche un message de confirmation
            if (MonHistoire.showMessageModal) {
              MonHistoire.showMessageModal("Histoire supprimée avec succès !");
            }
          });
      },
      
      afficherHistoiresSauvegardees: function() {
        console.log("[Adapter] Redirection de afficherHistoiresSauvegardees vers modules.stories.management.loadStories");
        return MonHistoire.modules.stories.management.loadStories();
      }
    };
    
    console.log("[Adapter] Adaptateur de gestion d'histoires initialisé avec succès");
  }
  
  // Adapter pour le module de génération
  if (MonHistoire.modules.stories.generator) {
    MonHistoire.features.stories.generator = {
      init: function() {
        console.log("[Adapter] Redirection de generator.init vers modules.stories.generator.init");
        return MonHistoire.modules.stories.generator.init();
      },
      
      genererHistoire: function(params) {
        console.log("[Adapter] Redirection de genererHistoire vers modules.stories.generator.generateStory");
        // Si des paramètres sont fournis, les utiliser, sinon laisser le module récupérer les valeurs du formulaire
        if (params) {
          return MonHistoire.modules.stories.generator.generateStory(params);
        } else {
          return MonHistoire.modules.stories.generator.generateStory();
        }
      }
    };
    
    console.log("[Adapter] Adaptateur de génération d'histoires initialisé avec succès");
  }
  
  console.log("[Adapter] Adaptateur d'histoires initialisé avec succès");
})();
