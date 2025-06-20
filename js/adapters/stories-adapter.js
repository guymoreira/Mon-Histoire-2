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
      
      getCurrentStory: function() {
        console.log("[Adapter] Redirection de getCurrentStory vers modules.stories.display.getCurrentStory");
        return MonHistoire.modules.stories.display.getCurrentStory();
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
  } else {
    console.warn("[Adapter] Module stories.display manquant dans MonHistoire.modules.stories");
  }
  
  // Adapter pour le module de gestion
  if (MonHistoire.modules.stories.management) {
    MonHistoire.features.stories.management = {
      init: function() {
        console.log("[Adapter] Redirection de management.init vers modules.stories.management.init");
        return MonHistoire.modules.stories.management.init();
      },
      
      saveStory: function(histoire) {
        console.log("[Adapter] Redirection de saveStory vers modules.stories.management.saveStory");
        
        // Vérifier si l'histoire est valide
        if (!histoire) {
          console.error("[Adapter] Tentative de sauvegarde d'une histoire invalide");
          if (MonHistoire.showMessageModal) {
            MonHistoire.showMessageModal("Erreur: Impossible de sauvegarder l'histoire.");
          }
          return Promise.reject(new Error("Histoire invalide"));
        }
        
        // Vérifier si l'utilisateur est connecté
        if (!firebase.auth().currentUser) {
          console.error("[Adapter] Tentative de sauvegarde d'histoire sans être connecté");
          if (MonHistoire.showMessageModal) {
            MonHistoire.showMessageModal("Vous devez être connecté pour sauvegarder une histoire.");
          }
          return Promise.reject(new Error("Utilisateur non connecté"));
        }
        
        // Vérifier le quota d'histoires
        return MonHistoire.modules.core.storage.verifierQuotaHistoires()
          .then(quotaOk => {
            if (!quotaOk) {
              console.warn("[Adapter] Quota d'histoires atteint");
              // Afficher la modale de limite
              const modalLimite = document.getElementById("modal-limite");
              if (modalLimite) modalLimite.classList.add("show");
              return Promise.reject(new Error("Quota d'histoires atteint"));
            }
            
            // Vérifier si on approche du seuil d'alerte
            return MonHistoire.modules.core.storage.verifierSeuilAlerteHistoires();
          })
          .then(seuilAtteint => {
            if (seuilAtteint) {
              console.warn("[Adapter] Seuil d'alerte d'histoires atteint");
              // Afficher un message d'avertissement
              setTimeout(() => {
                if (MonHistoire.showMessageModal) {
                  MonHistoire.showMessageModal("Attention: Tu approches de la limite d'histoires sauvegardées.");
                }
              }, 1500);
            }
            
            // Sauvegarder l'histoire
            return MonHistoire.modules.core.storage.saveStory(histoire);
          })
          .then(storyId => {
            console.log("[Adapter] Histoire sauvegardée avec succès, ID:", storyId);
            
            // Afficher un message de confirmation
            if (MonHistoire.showMessageModal) {
              MonHistoire.showMessageModal("Histoire sauvegardée avec succès !");
            }
            
            // Cacher le bouton de sauvegarde
            const btnSauvegarde = document.getElementById("btn-sauvegarde");
            if (btnSauvegarde) {
              btnSauvegarde.style.display = "none";
            }
            
            // Mettre à jour le compteur d'histoires
            if (MonHistoire.modules.core && MonHistoire.modules.core.storage) {
              MonHistoire.modules.core.storage.recalculerNbHistoires && 
                MonHistoire.modules.core.storage.recalculerNbHistoires();
            }
            
            return storyId;
          })
          .catch(error => {
            if (error.message === "Quota d'histoires atteint") {
              // Cette erreur est déjà gérée plus haut
              return Promise.reject(error);
            }
            
            console.error("[Adapter] Erreur lors de la sauvegarde de l'histoire:", error);
            if (MonHistoire.showMessageModal) {
              MonHistoire.showMessageModal("Erreur lors de la sauvegarde de l'histoire.");
            }
            return Promise.reject(error);
          });
      },
      
      sauvegarderHistoire: function(histoire) {
        console.log("[Adapter] Redirection de sauvegarderHistoire vers saveStory");
        return this.saveStory(histoire);
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
            
            // Mettre à jour le compteur d'histoires
            if (MonHistoire.modules.core && MonHistoire.modules.core.storage) {
              MonHistoire.modules.core.storage.recalculerNbHistoires && 
                MonHistoire.modules.core.storage.recalculerNbHistoires();
            }
          });
      },
      
      deleteStory: function(id) {
        console.log("[Adapter] Redirection de deleteStory vers modules.stories.management.deleteStory");
        return MonHistoire.modules.stories.management.deleteStory(id);
      },
      
      afficherHistoiresSauvegardees: function() {
        console.log("[Adapter] Redirection de afficherHistoiresSauvegardees vers modules.stories.management.loadStories");
        return MonHistoire.modules.stories.management.loadStories();
      },
      
      loadStories: function() {
        console.log("[Adapter] Redirection de loadStories vers modules.stories.management.loadStories");
        return MonHistoire.modules.stories.management.loadStories();
      }
    };
    
    console.log("[Adapter] Adaptateur de gestion d'histoires initialisé avec succès");
  } else {
    console.warn("[Adapter] Module stories.management manquant dans MonHistoire.modules.stories");
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
        const promise = params ?
          MonHistoire.modules.stories.generator.generateStory(params) :
          MonHistoire.modules.stories.generator.generateStory();
        return promise.then(story => {
          if (story && MonHistoire.modules.stories && MonHistoire.modules.stories.display) {
            MonHistoire.modules.stories.display.showStory(story);
          }
          return story;
        });
      },
      
      generateStory: function(params) {
        console.log("[Adapter] Redirection de generateStory vers modules.stories.generator.generateStory");
        return MonHistoire.modules.stories.generator.generateStory(params);
      }
    };
    
    console.log("[Adapter] Adaptateur de génération d'histoires initialisé avec succès");
  } else {
    console.warn("[Adapter] Module stories.generator manquant dans MonHistoire.modules.stories");
  }
  
  console.log("[Adapter] Adaptateur d'histoires initialisé avec succès");
})();
