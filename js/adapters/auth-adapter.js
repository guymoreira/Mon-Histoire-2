// js/adapters/auth-adapter.js
// Adaptateur pour rediriger les appels de l'ancien namespace (MonHistoire.core.auth)
// vers le nouveau namespace (MonHistoire.modules.user.auth)

(function() {
  // S'assurer que les namespaces existent
  window.MonHistoire = window.MonHistoire || {};
  MonHistoire.core = MonHistoire.core || {};
  
  // Vérifier si le module d'authentification modularisé existe
  if (!MonHistoire.modules || !MonHistoire.modules.user || !MonHistoire.modules.user.auth) {
    console.error("Module d'authentification modularisé non trouvé. L'adaptateur ne fonctionnera pas correctement.");
    return;
  }
  
  // Créer un proxy pour rediriger les appels
  MonHistoire.core.auth = {
    // Méthodes d'authentification
    loginUser: function() {
      console.log("[Adapter] Redirection de loginUser vers modules.user.auth");
      
      // Vérifier si une fonction loginUser existe dans le module modularisé
      if (typeof MonHistoire.modules.user.auth.loginUser === 'function') {
        console.log("[Adapter] Utilisation de modules.user.auth.loginUser");
        MonHistoire.modules.user.auth.loginUser();
        return;
      }
      
      console.log("[Adapter] Implémentation de secours pour loginUser");
      
      // Récupérer les valeurs du formulaire
      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value.trim();
      
      if (!email || !password) {
        if (MonHistoire.showMessageModal) {
          MonHistoire.showMessageModal("Merci de remplir tous les champs.");
        }
        return;
      }
      
      console.log("[Adapter] Tentative de connexion avec email:", email);
      
      // Appeler la fonction login du module modularisé
      MonHistoire.modules.user.auth.login(email, password)
        .then((user) => {
          console.log("[Adapter] Connexion réussie pour:", user.email);
          
          // Mettre à jour l'interface utilisateur
          MonHistoire.modules.user.auth.afficherUtilisateurConnecté();
          
          // Log de l'activité
          if (MonHistoire.modules.user.auth.logActivity) {
            MonHistoire.modules.user.auth.logActivity("connexion");
          }
          
          // Rediriger vers l'accueil
          if (MonHistoire.modules.core && MonHistoire.modules.core.navigation) {
            MonHistoire.modules.core.navigation.showScreen("accueil");
          }
          
          // Initialiser le quota d'histoires
          if (MonHistoire.modules.stories && MonHistoire.modules.stories.management) {
            MonHistoire.modules.stories.management.initQuota && MonHistoire.modules.stories.management.initQuota();
          }
          
          // Vérifier les histoires partagées
          if (MonHistoire.modules.sharing) {
            MonHistoire.modules.sharing.verifierHistoiresPartagees && MonHistoire.modules.sharing.verifierHistoiresPartagees();
          }
          
          // Synchronisation des préférences de cookies
          if (MonHistoire.modules.core && MonHistoire.modules.core.cookies) {
            MonHistoire.modules.core.cookies.syncPreferences && MonHistoire.modules.core.cookies.syncPreferences();
          }
        })
        .catch((error) => {
          console.error("[Adapter] Erreur de connexion:", error);
          const msg = MonHistoire.config.firebaseErrorMessages && MonHistoire.config.firebaseErrorMessages[error.code] || error.message;
          if (MonHistoire.showMessageModal) {
            MonHistoire.showMessageModal(msg);
          }
        });
    },
    
    login: function(email, password) {
      console.log("[Adapter] Redirection de login vers modules.user.auth.login");
      return MonHistoire.modules.user.auth.login(email, password);
    },
    
    logout: function() {
      console.log("[Adapter] Redirection de logout vers modules.user.auth.logout");
      return MonHistoire.modules.user.auth.logout();
    },
    
    logoutUser: function() {
      console.log("[Adapter] Redirection de logoutUser vers modules.user.auth.logout");
      
      // Vérifier si une fonction logoutUser existe dans le module modularisé
      if (typeof MonHistoire.modules.user.auth.logoutUser === 'function') {
        console.log("[Adapter] Utilisation de modules.user.auth.logoutUser");
        MonHistoire.modules.user.auth.logoutUser();
        return;
      }
      
      console.log("[Adapter] Implémentation de secours pour logoutUser");
      
      // Arrête l'écouteur d'histoires partagées avant la déconnexion
      if (MonHistoire.state && MonHistoire.state.histoiresPartageesListener) {
        MonHistoire.state.histoiresPartageesListener();
        MonHistoire.state.histoiresPartageesListener = null;
      }
      
      console.log("[Adapter] Tentative de déconnexion");
      
      // Appeler la fonction logout du module modularisé
      MonHistoire.modules.user.auth.logout()
        .then(() => {
          console.log("[Adapter] Déconnexion réussie");
          
          // Log de l'activité
          if (MonHistoire.modules.user.auth.logActivity) {
            MonHistoire.modules.user.auth.logActivity("deconnexion");
          }
          
          // Mettre à jour l'interface utilisateur
          MonHistoire.modules.user.auth.afficherUtilisateurDéconnecté();
          
          // Fermer la modale de déconnexion
          this.fermerLogoutModal();
          
          // Réinitialiser le profil actif
          if (MonHistoire.modules.user && MonHistoire.modules.user.profiles) {
            MonHistoire.modules.user.profiles.passerAuProfilParent && MonHistoire.modules.user.profiles.passerAuProfilParent();
          } else {
            // Fallback si le module profiles n'est pas disponible
            MonHistoire.state = MonHistoire.state || {};
            MonHistoire.state.profilActif = { type: "parent" };
            localStorage.removeItem("profilActif");
          }
          
          // Réinitialiser le quota d'histoires
          if (MonHistoire.modules.stories && MonHistoire.modules.stories.management) {
            MonHistoire.modules.stories.management.initQuota && MonHistoire.modules.stories.management.initQuota();
          }
          
          // Rediriger vers l'accueil
          if (MonHistoire.modules.core && MonHistoire.modules.core.navigation) {
            MonHistoire.modules.core.navigation.showScreen("accueil");
          }
        })
        .catch((error) => {
          console.error("[Adapter] Erreur de déconnexion:", error);
          if (MonHistoire.showMessageModal) {
            MonHistoire.showMessageModal("Erreur lors de la déconnexion. Veuillez réessayer.");
          }
        });
    },
    
    registerUser: function() {
      console.log("[Adapter] Redirection de registerUser vers modules.user.auth");
      
      // Vérifier si une fonction registerUser existe dans le module modularisé
      if (typeof MonHistoire.modules.user.auth.registerUser === 'function') {
        console.log("[Adapter] Utilisation de modules.user.auth.registerUser");
        MonHistoire.modules.user.auth.registerUser();
        return;
      }
      
      console.log("[Adapter] Implémentation de secours pour registerUser");
      
      const prenom = document.getElementById("prenom").value.trim();
      const email = document.getElementById("signup-email").value.trim();
      const password = document.getElementById("signup-password").value;
      const confirm = document.getElementById("signup-confirm").value;

      // Vérification consentement parental
      const consentCheckbox = document.getElementById("checkbox-consent");
      const consent = consentCheckbox ? consentCheckbox.checked : false;
      
      if (!consent) {
        if (MonHistoire.showMessageModal) {
          MonHistoire.showMessageModal(
            'Merci de cocher la case de consentement parental.<br>Tu peux consulter les <a href="#" onclick="document.getElementById(\'modal-rgpd\').classList.add(\'show\');return false;">règles de vie privée</a> ici.'
          );
        }
        return;
      }

      if (!prenom || !email || !password || !confirm) {
        if (MonHistoire.showMessageModal) {
          MonHistoire.showMessageModal("Merci de remplir tous les champs.");
        }
        return;
      }
      
      if (password !== confirm) {
        if (MonHistoire.showMessageModal) {
          MonHistoire.showMessageModal("Les mots de passe ne correspondent pas.");
        }
        return;
      }

      console.log("[Adapter] Tentative d'inscription avec email:", email);

      // Utiliser la fonction register du module modularisé
      if (MonHistoire.modules.user.auth.register) {
        MonHistoire.modules.user.auth.register(email, password)
          .then((user) => {
            console.log("[Adapter] Inscription réussie pour:", email);
            
            // Stocker le prénom et le consentement parental dans Firestore
            if (window.firebase && firebase.firestore) {
              return firebase.firestore().collection("users").doc(user.uid).set({
                prenom: prenom,
                email: email,
                createdAt: new Date().toISOString(),
                consentement_parental: true
              });
            }
            return Promise.resolve();
          })
          .then(() => {
            // Log de l'activité
            if (MonHistoire.modules.user.auth.logActivity) {
              MonHistoire.modules.user.auth.logActivity("creation_compte");
            }
            
            // Fermer le formulaire d'inscription
            if (MonHistoire.modules.user.auth.toggleSignup) {
              MonHistoire.modules.user.auth.toggleSignup(false);
            } else {
              this.toggleSignup(false);
            }
            
            // Afficher un message de confirmation
            if (MonHistoire.showMessageModal) {
              MonHistoire.showMessageModal("Ton compte a bien été créé ! Tu peux maintenant te connecter.");
            }
          })
          .catch((error) => {
            console.error("[Adapter] Erreur d'inscription:", error);
            const msg = MonHistoire.config.firebaseErrorMessages && MonHistoire.config.firebaseErrorMessages[error.code] || error.message;
            if (MonHistoire.showMessageModal) {
              MonHistoire.showMessageModal(msg);
            }
          });
      }
    },
    
    signup: function(email, password, userData) {
      console.log("[Adapter] Redirection de signup vers modules.user.auth.signup");
      return MonHistoire.modules.user.auth.signup(email, password, userData);
    },
    
    resetPassword: function(email) {
      console.log("[Adapter] Redirection de resetPassword vers modules.user.auth.resetPassword");
      return MonHistoire.modules.user.auth.resetPassword(email);
    },
    
    updateEmail: function(newEmail) {
      console.log("[Adapter] Redirection de updateEmail vers modules.user.auth.updateEmail");
      return MonHistoire.modules.user.auth.updateEmail(newEmail);
    },
    
    updatePassword: function(newPassword) {
      console.log("[Adapter] Redirection de updatePassword vers modules.user.auth.updatePassword");
      return MonHistoire.modules.user.auth.updatePassword(newPassword);
    },
    
    deleteAccount: function() {
      console.log("[Adapter] Redirection de deleteAccount vers modules.user.auth.deleteAccount");
      return MonHistoire.modules.user.auth.deleteAccount();
    },
    
    // Méthodes de gestion de l'utilisateur
    getCurrentUser: function() {
      console.log("[Adapter] Redirection de getCurrentUser vers modules.user.auth.getCurrentUser");
      return MonHistoire.modules.user.auth.getCurrentUser();
    },
    
    isLoggedIn: function() {
      console.log("[Adapter] Redirection de isLoggedIn vers modules.user.auth.isLoggedIn");
      return MonHistoire.modules.user.auth.isLoggedIn();
    },
    
    // Méthode pour journaliser l'activité
    logActivite: function(type, data) {
      console.log("[Adapter] Redirection de logActivite vers modules.user.auth.logActivity");
      return MonHistoire.modules.user.auth.logActivity(type, data);
    },
    
    // Méthode d'initialisation (pour compatibilité)
    init: function() {
      console.log("[Adapter] Redirection de init vers modules.user.auth.init");
      // Appeler la méthode d'initialisation du module modularisé
      if (typeof MonHistoire.modules.user.auth.init === 'function') {
        return MonHistoire.modules.user.auth.init();
      }
      return Promise.resolve();
    },
    
    // Fonctions pour la gestion des formulaires d'inscription et de réinitialisation
    toggleSignup: function(show) {
      console.log("[Adapter] Redirection de toggleSignup vers modules.user.auth.toggleSignup");
      // Appeler la fonction correspondante dans le nouveau module
      if (typeof MonHistoire.modules.user.auth.toggleSignup === 'function') {
        return MonHistoire.modules.user.auth.toggleSignup(show);
      }
      // Implémentation de secours si la fonction n'existe pas dans le nouveau module
      const signupForm = document.getElementById("signup-form");
      const resetForm = document.getElementById("reset-form");
      const loginForm = document.getElementById("login-form");
      
      if (signupForm) signupForm.style.display = show ? "block" : "none";
      if (resetForm) resetForm.style.display = "none";
      if (loginForm) loginForm.style.display = show ? "none" : "block";
      
      console.log(`Formulaire d'inscription ${show ? 'affiché' : 'masqué'}`);
    },
    
    toggleReset: function(show) {
      console.log("[Adapter] Redirection de toggleReset vers modules.user.auth.toggleReset");
      // Appeler la fonction correspondante dans le nouveau module
      if (typeof MonHistoire.modules.user.auth.toggleReset === 'function') {
        return MonHistoire.modules.user.auth.toggleReset(show);
      }
      // Implémentation de secours si la fonction n'existe pas dans le nouveau module
      const resetForm = document.getElementById("reset-form");
      const signupForm = document.getElementById("signup-form");
      const loginForm = document.getElementById("login-form");
      
      if (resetForm) resetForm.style.display = show ? "block" : "none";
      if (signupForm) signupForm.style.display = "none";
      if (loginForm) loginForm.style.display = show ? "none" : "block";
      
      console.log(`Formulaire de réinitialisation ${show ? 'affiché' : 'masqué'}`);
    },
    
    sendReset: function() {
      console.log("[Adapter] Redirection de sendReset");
      // Appeler la fonction correspondante dans le nouveau module
      if (typeof MonHistoire.modules.user.auth.sendReset === 'function') {
        MonHistoire.modules.user.auth.sendReset();
        return;
      }
      
      // Implémentation de secours si la fonction n'existe pas dans le nouveau module
      const email = document.getElementById("reset-email").value.trim();
      if (!email) {
        MonHistoire.showMessageModal("Veuillez saisir votre adresse email.");
        return;
      }

      console.log("[Adapter] Tentative d'envoi de réinitialisation pour:", email);

      MonHistoire.modules.user.auth.resetPassword(email)
        .then(() => {
          console.log("[Adapter] Lien de réinitialisation envoyé pour:", email);
          MonHistoire.showMessageModal("Lien de réinitialisation envoyé !");
          this.toggleReset(false);
        })
        .catch((error) => {
          console.error("[Adapter] Erreur lors de l'envoi du lien de réinitialisation:", error);
          const msg = error.message || "Erreur lors de l'envoi du lien de réinitialisation.";
          MonHistoire.showMessageModal(msg);
        });
    },
    
    // Fonctions pour la gestion des modales
    ouvrirLogoutModal: function() {
      console.log("[Adapter] Redirection de ouvrirLogoutModal");
      
      // Récupérer l'élément qui contiendra le prénom et la liste
      const nameEl = document.getElementById('logout-profile-name');
      const listEl = document.getElementById('logout-profiles-list');

      // Vider tout contenu précédent
      if (nameEl) nameEl.textContent = "";
      if (listEl) listEl.innerHTML = "";

      // Vérifier si l'utilisateur est connecté
      const user = firebase.auth().currentUser;
      if (!user) {
        // Si pas d'utilisateur connecté, on ne fait rien et on ferme
        const modal = document.getElementById('logout-modal');
        if (modal) modal.classList.remove('show');
        return;
      }

      // Afficher la modale
      const modal = document.getElementById('logout-modal');
      if (modal) modal.classList.add('show');
      
      // Déléguer au module modularisé si disponible
      if (MonHistoire.modules.user.profiles && 
          typeof MonHistoire.modules.user.profiles.afficherProfilsUtilisateur === 'function') {
        return MonHistoire.modules.user.profiles.afficherProfilsUtilisateur();
      }
    },
    
    fermerLogoutModal: function() {
      console.log("[Adapter] Redirection de fermerLogoutModal");
      const modal = document.getElementById('logout-modal');
      if (modal) modal.classList.remove('show');
    },
    
    ouvrirMonCompte: function() {
      console.log("[Adapter] Redirection de ouvrirMonCompte");
      
      // Déléguer au module modularisé si disponible
      if (MonHistoire.modules.user.account && 
          typeof MonHistoire.modules.user.account.ouvrirMonCompte === 'function') {
        return MonHistoire.modules.user.account.ouvrirMonCompte();
      }
      
      // Implémentation de secours
      const user = firebase.auth().currentUser;
      if (!user) return;
      
      // Récupérer les données utilisateur
      firebase.firestore().collection("users").doc(user.uid).get()
        .then(doc => {
          // Remplir les champs du formulaire
          const prenomInput = document.getElementById('compte-prenom');
          const emailInput = document.getElementById('compte-email');
          
          if (prenomInput) prenomInput.value = doc.exists && doc.data().prenom ? doc.data().prenom : '';
          if (emailInput) emailInput.value = user.email || '';
          
          // Afficher la modale
          const modal = document.getElementById('modal-moncompte');
          if (modal) modal.classList.add('show');
          
          // Fermer la modale de déconnexion
          this.fermerLogoutModal();
        });
    },
    
    fermerMonCompte: function() {
      console.log("[Adapter] Redirection de fermerMonCompte");
      
      // Déléguer au module modularisé si disponible
      if (MonHistoire.modules.user.account && 
          typeof MonHistoire.modules.user.account.fermerMonCompte === 'function') {
        return MonHistoire.modules.user.account.fermerMonCompte();
      }
      
      // Implémentation de secours
      const modal = document.getElementById("modal-moncompte");
      if (modal) {
        modal.classList.add("fade-out");

        setTimeout(() => {
          modal.classList.remove("fade-out");
          modal.classList.remove("show");
        }, 300); // correspond à la durée de l'animation CSS
      }
    }
  };
  
  console.log("[Adapter] Adaptateur d'authentification initialisé avec succès");
})();
