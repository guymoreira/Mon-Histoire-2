// js/modules/user/auth.js
// Module d'authentification
// Responsable de la gestion de l'authentification des utilisateurs

// S'assurer que les namespaces existent
window.MonHistoire = window.MonHistoire || {};
MonHistoire.modules = MonHistoire.modules || {};
MonHistoire.modules.user = MonHistoire.modules.user || {};

// Module d'authentification
(function() {
  // Variables privées
  let isInitialized = false;
  let auth = null;
  let currentUser = null;
  
  /**
   * Initialise le module d'authentification
   */
  function init() {
    if (isInitialized) {
      console.warn("Module Auth déjà initialisé");
      return;
    }
    
    try {
      // Vérifier si Firebase est disponible
      if (!window.firebase) {
        console.warn("Firebase n'est pas disponible, utilisation du mode déconnecté");
        // Même si Firebase n'est pas disponible, on peut quand même initialiser l'interface
        afficherUtilisateurDéconnecté();
        isInitialized = true;
        console.log("Module Auth initialisé en mode déconnecté");
        return;
      }
      
      // Initialiser Firebase Auth
      auth = firebase.auth();
      
      // Configurer l'observateur d'état d'authentification
      auth.onAuthStateChanged(handleAuthStateChange);
      
      // Initialiser l'interface utilisateur en mode déconnecté par défaut
      // L'état sera mis à jour par handleAuthStateChange si l'utilisateur est connecté
      afficherUtilisateurDéconnecté();
      
      isInitialized = true;
      console.log("Module Auth initialisé");
    } catch (error) {
      console.error("Erreur lors de l'initialisation du module Auth:", error);
      // Même en cas d'erreur, on initialise l'interface en mode déconnecté
      afficherUtilisateurDéconnecté();
    }
  }
  
  /**
   * Gère les changements d'état d'authentification
   * @param {Object} user - Utilisateur authentifié ou null
   */
  function handleAuthStateChange(user) {
    currentUser = user;
    
    // Émettre un événement pour informer les autres modules
    if (MonHistoire.events) {
      MonHistoire.events.emit('authStateChange', user);
    }
    
    if (user) {
      console.log(`Utilisateur connecté: ${user.email}`);
      afficherUtilisateurConnecté();
    } else {
      console.log("Utilisateur déconnecté");
      afficherUtilisateurDéconnecté();
    }
  }
  
  /**
   * Inscrit un nouvel utilisateur
   * @param {string} email - Adresse e-mail
   * @param {string} password - Mot de passe
   * @returns {Promise} Promesse résolue avec l'utilisateur créé
   */
  function register(email, password) {
    return new Promise((resolve, reject) => {
      // Vérifier les paramètres
      if (!email || !password) {
        reject(new Error("E-mail et mot de passe requis"));
        return;
      }
      
      // Créer l'utilisateur
      auth.createUserWithEmailAndPassword(email, password)
        .then(userCredential => {
          // Envoyer un e-mail de vérification
          if (userCredential.user) {
            return userCredential.user.sendEmailVerification()
              .then(() => userCredential.user);
          }
          
          return userCredential.user;
        })
        .then(user => {
          // Créer le profil utilisateur dans Firestore
          if (MonHistoire.modules.core && MonHistoire.modules.core.storage) {
            return MonHistoire.modules.core.storage.createUserProfile(user.uid, {
              email: user.email,
              displayName: user.displayName || '',
              createdAt: new Date().toISOString()
            })
            .then(() => user);
          }
          
          return user;
        })
        .then(resolve)
        .catch(error => {
          console.error("Erreur lors de l'inscription:", error);
          reject(error);
        });
    });
  }
  
  /**
   * Connecte un utilisateur
   * @param {string} email - Adresse e-mail
   * @param {string} password - Mot de passe
   * @returns {Promise} Promesse résolue avec l'utilisateur connecté
   */
  function login(email, password) {
    return new Promise((resolve, reject) => {
      // Vérifier les paramètres
      if (!email || !password) {
        reject(new Error("E-mail et mot de passe requis"));
        return;
      }

      // S'assurer que Firebase Auth est disponible
      if (!auth) {
        init();
      }

      // Après tentative d'initialisation, si "auth" est toujours indisponible
      // on signale explicitement l'erreur à l'appelant
      if (!auth) {
        reject(new Error("Service d’authentification non disponible"));
        return;
      }

      // Connecter l'utilisateur
      auth.signInWithEmailAndPassword(email, password)
        .then(userCredential => {
          resolve(userCredential.user);
        })
        .catch(error => {
          console.error("Erreur lors de la connexion:", error);
          reject(error);
        });
    });
  }
  
  /**
   * Déconnecte l'utilisateur
   * @returns {Promise} Promesse résolue lorsque l'utilisateur est déconnecté
   */
  function logout() {
    return new Promise((resolve, reject) => {
      auth.signOut()
        .then(resolve)
        .catch(error => {
          console.error("Erreur lors de la déconnexion:", error);
          reject(error);
        });
    });
  }
  
  /**
   * Envoie un e-mail de réinitialisation de mot de passe
   * @param {string} email - Adresse e-mail
   * @returns {Promise} Promesse résolue lorsque l'e-mail est envoyé
   */
  function resetPassword(email) {
    return new Promise((resolve, reject) => {
      // Vérifier les paramètres
      if (!email) {
        reject(new Error("E-mail requis"));
        return;
      }
      
      // Vérifier si Firebase Auth est initialisé
      if (!auth) {
        console.error("Firebase Auth n'est pas initialisé");
        reject(new Error("Service d'authentification non disponible"));
        return;
      }
      
      // Envoyer l'e-mail de réinitialisation
      auth.sendPasswordResetEmail(email)
        .then(resolve)
        .catch(error => {
          console.error("Erreur lors de l'envoi de l'e-mail de réinitialisation:", error);
          reject(error);
        });
    });
  }
  
  /**
   * Met à jour le mot de passe de l'utilisateur
   * @param {string} currentPassword - Mot de passe actuel
   * @param {string} newPassword - Nouveau mot de passe
   * @returns {Promise} Promesse résolue lorsque le mot de passe est mis à jour
   */
  function updatePassword(currentPassword, newPassword) {
    return new Promise((resolve, reject) => {
      // Vérifier si l'utilisateur est connecté
      if (!currentUser) {
        reject(new Error("Utilisateur non connecté"));
        return;
      }
      
      // Vérifier les paramètres
      if (!currentPassword || !newPassword) {
        reject(new Error("Mot de passe actuel et nouveau mot de passe requis"));
        return;
      }
      
      // Récupérer les informations d'identification
      const credential = firebase.auth.EmailAuthProvider.credential(
        currentUser.email,
        currentPassword
      );
      
      // Réauthentifier l'utilisateur
      currentUser.reauthenticateWithCredential(credential)
        .then(() => {
          // Mettre à jour le mot de passe
          return currentUser.updatePassword(newPassword);
        })
        .then(resolve)
        .catch(error => {
          console.error("Erreur lors de la mise à jour du mot de passe:", error);
          reject(error);
        });
    });
  }
  
  /**
   * Met à jour l'adresse e-mail de l'utilisateur
   * @param {string} newEmail - Nouvelle adresse e-mail
   * @param {string} password - Mot de passe
   * @returns {Promise} Promesse résolue lorsque l'adresse e-mail est mise à jour
   */
  function updateEmail(newEmail, password) {
    return new Promise((resolve, reject) => {
      // Vérifier si l'utilisateur est connecté
      if (!currentUser) {
        reject(new Error("Utilisateur non connecté"));
        return;
      }
      
      // Vérifier les paramètres
      if (!newEmail || !password) {
        reject(new Error("Nouvelle adresse e-mail et mot de passe requis"));
        return;
      }
      
      // Récupérer les informations d'identification
      const credential = firebase.auth.EmailAuthProvider.credential(
        currentUser.email,
        password
      );
      
      // Réauthentifier l'utilisateur
      currentUser.reauthenticateWithCredential(credential)
        .then(() => {
          // Mettre à jour l'adresse e-mail
          return currentUser.updateEmail(newEmail);
        })
        .then(() => {
          // Envoyer un e-mail de vérification
          return currentUser.sendEmailVerification();
        })
        .then(resolve)
        .catch(error => {
          console.error("Erreur lors de la mise à jour de l'adresse e-mail:", error);
          reject(error);
        });
    });
  }
  
  /**
   * Supprime le compte de l'utilisateur
   * @param {string} password - Mot de passe
   * @returns {Promise} Promesse résolue lorsque le compte est supprimé
   */
  function deleteAccount(password) {
    return new Promise((resolve, reject) => {
      // Vérifier si l'utilisateur est connecté
      if (!currentUser) {
        reject(new Error("Utilisateur non connecté"));
        return;
      }
      
      // Vérifier les paramètres
      if (!password) {
        reject(new Error("Mot de passe requis"));
        return;
      }
      
      // Récupérer les informations d'identification
      const credential = firebase.auth.EmailAuthProvider.credential(
        currentUser.email,
        password
      );
      
      // Réauthentifier l'utilisateur
      currentUser.reauthenticateWithCredential(credential)
        .then(() => {
          // Supprimer les données de l'utilisateur dans Firestore
          if (MonHistoire.modules.core && MonHistoire.modules.core.storage) {
            return MonHistoire.modules.core.storage.deleteUserData(currentUser.uid)
              .then(() => currentUser);
          }
          
          return currentUser;
        })
        .then(user => {
          // Supprimer le compte
          return user.delete();
        })
        .then(resolve)
        .catch(error => {
          console.error("Erreur lors de la suppression du compte:", error);
          reject(error);
        });
    });
  }
  
  /**
   * Vérifie si l'utilisateur est connecté
   * @returns {boolean} True si l'utilisateur est connecté
   */
  function isLoggedIn() {
    return !!currentUser;
  }
  
  /**
   * Vérifie si l'adresse e-mail de l'utilisateur est vérifiée
   * @returns {boolean} True si l'adresse e-mail est vérifiée
   */
  function isEmailVerified() {
    return currentUser ? currentUser.emailVerified : false;
  }
  
  /**
   * Obtient l'utilisateur actuellement connecté
   * @returns {Object} Utilisateur connecté ou null
   */
  function getCurrentUser() {
    return currentUser;
  }
  
  /**
   * Obtient l'ID de l'utilisateur actuellement connecté
   * @returns {string} ID de l'utilisateur ou null
   */
  function getCurrentUserId() {
    return currentUser ? currentUser.uid : null;
  }
  
  /**
   * Obtient l'adresse e-mail de l'utilisateur actuellement connecté
   * @returns {string} Adresse e-mail de l'utilisateur ou null
   */
  function getCurrentUserEmail() {
    return currentUser ? currentUser.email : null;
  }
  
  /**
   * Affiche l'utilisateur connecté
   */
  function afficherUtilisateurConnecté() {
    document.getElementById("user-icon").classList.remove("ui-hidden");
    document.getElementById("login-button").classList.add("ui-hidden");
    document.getElementById("my-stories-button").classList.remove("ui-hidden");

    // → Si un profil enfant est actif, on court-circuite tout :
    if (MonHistoire.modules && MonHistoire.modules.user && 
        MonHistoire.modules.user.profiles && 
        MonHistoire.modules.user.profiles.getCurrentProfile) {
      
      const currentProfile = MonHistoire.modules.user.profiles.getCurrentProfile();
      if (currentProfile && currentProfile.prenom) {
        // On met directement l'initiale de l'enfant
        document.getElementById("user-icon").textContent = currentProfile.prenom
          .trim()
          .charAt(0)
          .toUpperCase();
        return; // on ne fait pas la requête Firestore parent
      }
    }

    // Sinon, c'est le parent → on récupère son prénom dans Firestore
    try {
      if (window.firebase && firebase.auth) {
        const user = firebase.auth().currentUser;
        if (user) {
          document.getElementById("user-icon").textContent = user.email.charAt(0).toUpperCase();
        } else {
          document.getElementById("user-icon").textContent = "U";
        }
      } else {
        document.getElementById("user-icon").textContent = "U";
      }
    } catch (error) {
      console.error("Erreur lors de la récupération de l'utilisateur:", error);
      document.getElementById("user-icon").textContent = "U";
    }
  }
  
  /**
   * Affiche l'utilisateur déconnecté
   */
  function afficherUtilisateurDéconnecté() {
    try {
      const userIcon = document.getElementById("user-icon");
      const loginButton = document.getElementById("login-button");
      const myStoriesButton = document.getElementById("my-stories-button");
      
      if (userIcon) userIcon.classList.add("ui-hidden");
      if (loginButton) loginButton.classList.remove("ui-hidden");
      if (myStoriesButton) myStoriesButton.classList.add("ui-hidden");
      
      console.log("Interface utilisateur mise à jour pour l'utilisateur déconnecté");
    } catch (error) {
      console.error("Erreur lors de la mise à jour de l'interface utilisateur:", error);
    }
  }

  /**
   * Bascule l'affichage du formulaire d'inscription
   * @param {boolean} show - True pour afficher, false pour masquer
   */
  function toggleSignup(show) {
    const signupForm = document.getElementById("signup-form");
    const resetForm = document.getElementById("reset-form");
    const loginForm = document.getElementById("login-form");
    
    if (signupForm) signupForm.style.display = show ? "block" : "none";
    if (resetForm) resetForm.style.display = "none";
    if (loginForm) loginForm.style.display = show ? "none" : "block";
    
    console.log(`Formulaire d'inscription ${show ? 'affiché' : 'masqué'}`);
  }
  
  /**
   * Bascule l'affichage du formulaire de réinitialisation de mot de passe
   * @param {boolean} show - True pour afficher, false pour masquer
   */
  function toggleReset(show) {
    const resetForm = document.getElementById("reset-form");
    const signupForm = document.getElementById("signup-form");
    const loginForm = document.getElementById("login-form");
    
    if (resetForm) resetForm.style.display = show ? "block" : "none";
    if (signupForm) signupForm.style.display = "none";
    if (loginForm) loginForm.style.display = show ? "none" : "block";
    
    console.log(`Formulaire de réinitialisation ${show ? 'affiché' : 'masqué'}`);
  }
  
  /**
   * Envoie une demande de réinitialisation de mot de passe
   */
  function sendReset() {
    const email = document.getElementById("reset-email").value.trim();
    
    if (!email) {
      if (MonHistoire.showMessageModal) {
        MonHistoire.showMessageModal("Veuillez saisir votre adresse email.");
      } else {
        alert("Veuillez saisir votre adresse email.");
      }
      return;
    }
    
    // Vérifier si Firebase Auth est initialisé
    if (!auth) {
      console.error("Firebase Auth n'est pas initialisé");
      if (MonHistoire.showMessageModal) {
        MonHistoire.showMessageModal("Service d'authentification non disponible. Veuillez réessayer plus tard.");
      } else {
        alert("Service d'authentification non disponible. Veuillez réessayer plus tard.");
      }
      return;
    }
    
    resetPassword(email)
      .then(() => {
        if (MonHistoire.showMessageModal) {
          // Utiliser l'option autoClose pour fermer automatiquement le message après 3 secondes
          MonHistoire.showMessageModal("Lien de réinitialisation envoyé !", "success", {
            autoClose: true,
            autoCloseDelay: 3000
          });
        } else {
          alert("Lien de réinitialisation envoyé !");
        }
        toggleReset(false);
      })
      .catch(error => {
        const msg = error.message || "Erreur lors de l'envoi du lien de réinitialisation.";
        if (MonHistoire.showMessageModal) {
          MonHistoire.showMessageModal(msg, "error");
        } else {
          alert(msg);
        }
      });
  }

  /**
   * Ferme la modale de déconnexion/changement de profil
   */
  function fermerLogoutModal() {
    const modal = document.getElementById('logout-modal');
    if (modal) {
      modal.classList.remove('show');
    }
  }

  /**
   * Fonction de connexion utilisateur qui récupère les valeurs du formulaire
   * et gère toutes les actions post-connexion
   */
  function loginUser() {
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    
    if (!email || !password) {
      if (MonHistoire.showMessageModal) {
        MonHistoire.showMessageModal("Merci de remplir tous les champs.");
      } else {
        alert("Merci de remplir tous les champs.");
      }
      return;
    }
    
    console.log("[Module] Tentative de connexion avec email:", email);
    
    login(email, password)
      .then((user) => {
        console.log("[Module] Connexion réussie pour:", user.email);
        
        // Mettre à jour l'interface utilisateur
        afficherUtilisateurConnecté();
        
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
        console.error("[Module] Erreur de connexion:", error);
        const msg = MonHistoire.config.firebaseErrorMessages && MonHistoire.config.firebaseErrorMessages[error.code] || error.message;
        if (MonHistoire.showMessageModal) {
          MonHistoire.showMessageModal(msg);
        } else {
          alert(msg);
        }
      });
  }
  
  /**
   * Fonction d'inscription utilisateur qui récupère les valeurs du formulaire
   * et gère toutes les actions post-inscription
   */
  function registerUser() {
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
      } else {
        alert("Merci de cocher la case de consentement parental.");
      }
      return;
    }

    if (!prenom || !email || !password || !confirm) {
      if (MonHistoire.showMessageModal) {
        MonHistoire.showMessageModal("Merci de remplir tous les champs.");
      } else {
        alert("Merci de remplir tous les champs.");
      }
      return;
    }
    
    if (password !== confirm) {
      if (MonHistoire.showMessageModal) {
        MonHistoire.showMessageModal("Les mots de passe ne correspondent pas.");
      } else {
        alert("Les mots de passe ne correspondent pas.");
      }
      return;
    }

    console.log("[Module] Tentative d'inscription avec email:", email);

    // Firebase Auth
    register(email, password)
      .then((user) => {
        console.log("[Module] Inscription réussie pour:", email);
        
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
        toggleSignup(false);
        
        // Afficher un message de confirmation
        if (MonHistoire.showMessageModal) {
          MonHistoire.showMessageModal("Ton compte a bien été créé ! Tu peux maintenant te connecter.");
        } else {
          alert("Ton compte a bien été créé ! Tu peux maintenant te connecter.");
        }
      })
      .catch((error) => {
        console.error("[Module] Erreur d'inscription:", error);
        const msg = MonHistoire.config.firebaseErrorMessages && MonHistoire.config.firebaseErrorMessages[error.code] || error.message;
        if (MonHistoire.showMessageModal) {
          MonHistoire.showMessageModal(msg);
        } else {
          alert(msg);
        }
      });
  }
  
  /**
   * Fonction de déconnexion utilisateur qui gère toutes les actions post-déconnexion
   */
  function logoutUser() {
    // Arrête l'écouteur d'histoires partagées avant la déconnexion
    if (MonHistoire.state && MonHistoire.state.histoiresPartageesListener) {
      MonHistoire.state.histoiresPartageesListener();
      MonHistoire.state.histoiresPartageesListener = null;
    }
    
    console.log("[Module] Tentative de déconnexion");
    
    return logout()
      .then(() => {
        console.log("[Module] Déconnexion réussie");
        
        // Log de l'activité
        if (MonHistoire.modules.user.auth.logActivity) {
          MonHistoire.modules.user.auth.logActivity("deconnexion");
        }
        
        // Mettre à jour l'interface utilisateur
        afficherUtilisateurDéconnecté();
        
        // Fermer la modale de déconnexion
        if (MonHistoire.modules.user &&
            MonHistoire.modules.user.auth &&
            typeof MonHistoire.modules.user.auth.fermerLogoutModal === 'function') {
          MonHistoire.modules.user.auth.fermerLogoutModal();
        }
        
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
        console.error("[Module] Erreur de déconnexion:", error);
        if (MonHistoire.showMessageModal) {
          MonHistoire.showMessageModal("Erreur lors de la déconnexion. Veuillez réessayer.");
        } else {
          alert("Erreur lors de la déconnexion. Veuillez réessayer.");
        }
      });
  }
  
  /**
   * Fonction pour journaliser l'activité de l'utilisateur
   * @param {string} type - Type d'activité
   * @param {Object} data - Données supplémentaires
   */
  function logActivity(type, data = {}) {
    const user = getCurrentUser();
    if (!user) return;
    
    const entry = {
      type: type,
      timestamp: new Date().toISOString(),
      ...data
    };
    
    if (window.firebase && firebase.firestore) {
      firebase.firestore()
        .collection("users")
        .doc(user.uid)
        .collection("logs")
        .add(entry)
        .catch(() => {}); // On ignore les erreurs pour ne jamais bloquer l'appli
    }
  }

  // API publique
  MonHistoire.modules.user.auth = {
    init: init,
    register: register,
    login: login,
    logout: logout,
    resetPassword: resetPassword,
    updatePassword: updatePassword,
    updateEmail: updateEmail,
    deleteAccount: deleteAccount,
    isLoggedIn: isLoggedIn,
    isEmailVerified: isEmailVerified,
    getCurrentUser: getCurrentUser,
    getCurrentUserId: getCurrentUserId,
    getCurrentUserEmail: getCurrentUserEmail,
    afficherUtilisateurConnecté: afficherUtilisateurConnecté,
    afficherUtilisateurDéconnecté: afficherUtilisateurDéconnecté,
    toggleSignup: toggleSignup,
    toggleReset: toggleReset,
    sendReset: sendReset,
    loginUser: loginUser,
    registerUser: registerUser,
    logoutUser: logoutUser,
    logActivity: logActivity,
    fermerLogoutModal: fermerLogoutModal
  };
})();
