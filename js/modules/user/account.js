// js/modules/user/account.js
// Module de gestion du compte utilisateur
// Responsable de la modification des informations du compte, changement de mot de passe, etc.

// S'assurer que les namespaces existent
window.MonHistoire = window.MonHistoire || {};
MonHistoire.modules = MonHistoire.modules || {};
MonHistoire.modules.user = MonHistoire.modules.user || {};

// Module de gestion du compte utilisateur
(function() {
  // Variables privées
  let currentUser = null;
  let userInfo = {};
  let isInitialized = false;
  
  /**
   * Initialise le module de gestion du compte utilisateur
   */
  function init() {
    if (isInitialized) {
      console.warn("Module Account déjà initialisé");
      return;
    }
    
    // Écouter les changements d'authentification
    if (MonHistoire.events) {
      MonHistoire.events.on('authStateChange', handleAuthStateChange);
    }
    
    // Configurer les écouteurs d'événements pour les boutons de compte
    setupAccountListeners();
    
    isInitialized = true;
    console.log("Module Account initialisé");
  }
  
  /**
   * Gère les changements d'état d'authentification
   * @param {Object} user - Utilisateur authentifié ou null
   */
  function handleAuthStateChange(user) {
    currentUser = user;
    
    if (user) {
      // Utilisateur connecté, charger les informations du compte
      loadUserInfo();
    } else {
      // Utilisateur déconnecté, réinitialiser les informations
      userInfo = {};
      
      // Mettre à jour l'interface utilisateur
      updateUI();
    }
  }
  
  /**
   * Configure les écouteurs d'événements pour les boutons de compte
   */
  function setupAccountListeners() {
    // Bouton d'ouverture du modal de compte
    const accountButton = document.getElementById('account-button');
    if (accountButton) {
      accountButton.addEventListener('click', showAccountModal);
    }
    
    // Bouton de sauvegarde des informations du compte
    const saveAccountButton = document.getElementById('save-account-button');
    if (saveAccountButton) {
      saveAccountButton.addEventListener('click', handleUpdateAccount);
    }
    
    // Bouton d'ouverture du modal de changement de mot de passe
    const changePasswordButton = document.getElementById('change-password-button');
    if (changePasswordButton) {
      changePasswordButton.addEventListener('click', showChangePasswordModal);
    }
    
    // Bouton de sauvegarde du nouveau mot de passe
    const savePasswordButton = document.getElementById('save-password-button');
    if (savePasswordButton) {
      savePasswordButton.addEventListener('click', handleChangePassword);
    }
    
    // Bouton d'ouverture du modal de suppression de compte
    const deleteAccountButton = document.getElementById('delete-account-button');
    if (deleteAccountButton) {
      deleteAccountButton.addEventListener('click', showDeleteAccountConfirmation);
    }
    
    // Bouton de confirmation de suppression de compte
    const confirmDeleteAccountButton = document.getElementById('confirm-delete-account');
    if (confirmDeleteAccountButton) {
      confirmDeleteAccountButton.addEventListener('click', handleDeleteAccount);
    }
    
    console.log("Écouteurs de compte configurés");
  }
  
  /**
   * Charge les informations du compte utilisateur
   */
  function loadUserInfo() {
    if (!currentUser) {
      return;
    }
    
    // Afficher le chargement
    if (MonHistoire.modules.app && MonHistoire.modules.app.showLoading) {
      MonHistoire.modules.app.showLoading(true, "Chargement des informations du compte...");
    }
    
    // Utiliser le module de stockage pour récupérer les informations du compte
    if (MonHistoire.modules.core && MonHistoire.modules.core.storage) {
      MonHistoire.modules.core.storage.getUserInfo(currentUser.uid)
        .then(info => {
          userInfo = info || {};
          
          // Mettre à jour l'interface utilisateur
          updateUI();
          
          // Masquer le chargement
          if (MonHistoire.modules.app && MonHistoire.modules.app.showLoading) {
            MonHistoire.modules.app.showLoading(false);
          }
          
          console.log("Informations du compte chargées");
        })
        .catch(error => {
          console.error("Erreur lors du chargement des informations du compte:", error);
          
          // Masquer le chargement
          if (MonHistoire.modules.app && MonHistoire.modules.app.showLoading) {
            MonHistoire.modules.app.showLoading(false);
          }
          
          // Afficher un message d'erreur
          if (MonHistoire.showMessageModal) {
            MonHistoire.showMessageModal("Erreur lors du chargement des informations du compte. Veuillez réessayer.");
          }
        });
    } else {
      console.error("Module de stockage non disponible");
      
      // Masquer le chargement
      if (MonHistoire.modules.app && MonHistoire.modules.app.showLoading) {
        MonHistoire.modules.app.showLoading(false);
      }
    }
  }
  
  /**
   * Met à jour l'interface utilisateur avec les informations du compte
   */
  function updateUI() {
    // Mettre à jour le nom d'utilisateur dans l'en-tête
    const usernameElement = document.getElementById('username');
    if (usernameElement && currentUser) {
      usernameElement.textContent = userInfo.displayName || currentUser.email || 'Utilisateur';
    }
    
    // Mettre à jour les champs du formulaire de compte
    const displayNameInput = document.getElementById('account-display-name');
    if (displayNameInput) {
      displayNameInput.value = userInfo.displayName || '';
    }
    
    const emailInput = document.getElementById('account-email');
    if (emailInput && currentUser) {
      emailInput.value = currentUser.email || '';
    }
    
    // Mettre à jour l'état global
    if (MonHistoire.state) {
      MonHistoire.state.userInfo = userInfo;
    }
  }
  
  /**
   * Affiche le modal de compte
   */
  function showAccountModal() {
    const accountModal = document.getElementById('account-modal');
    if (accountModal) {
      // Mettre à jour les champs du formulaire
      updateUI();
      
      // Afficher le modal
      accountModal.classList.add('show');
    }
  }
  
  /**
   * Gère la mise à jour des informations du compte
   */
  function handleUpdateAccount() {
    if (!currentUser) {
      return;
    }
    
    // Récupérer les valeurs du formulaire
    const displayName = document.getElementById('account-display-name').value;
    
    // Créer l'objet d'informations
    const updatedInfo = {
      ...userInfo,
      displayName: displayName
    };
    
    // Afficher le chargement
    if (MonHistoire.modules.app && MonHistoire.modules.app.showLoading) {
      MonHistoire.modules.app.showLoading(true, "Mise à jour des informations du compte...");
    }
    
    // Utiliser le module de stockage pour mettre à jour les informations
    if (MonHistoire.modules.core && MonHistoire.modules.core.storage) {
      MonHistoire.modules.core.storage.updateUserInfo(currentUser.uid, updatedInfo)
        .then(() => {
          // Mettre à jour les informations locales
          userInfo = updatedInfo;
          
          // Mettre à jour l'interface utilisateur
          updateUI();
          
          // Masquer le modal
          const accountModal = document.getElementById('account-modal');
          if (accountModal) {
            accountModal.classList.remove('show');
          }
          
          // Masquer le chargement
          if (MonHistoire.modules.app && MonHistoire.modules.app.showLoading) {
            MonHistoire.modules.app.showLoading(false);
          }
          
          // Afficher un message de succès
          if (MonHistoire.showMessageModal) {
            MonHistoire.showMessageModal("Informations du compte mises à jour avec succès.");
          }
          
          // Émettre un événement pour informer les autres modules
          if (MonHistoire.events) {
            MonHistoire.events.emit('accountUpdated', updatedInfo);
          }
          
          console.log("Informations du compte mises à jour");
        })
        .catch(error => {
          console.error("Erreur lors de la mise à jour des informations du compte:", error);
          
          // Masquer le chargement
          if (MonHistoire.modules.app && MonHistoire.modules.app.showLoading) {
            MonHistoire.modules.app.showLoading(false);
          }
          
          // Afficher un message d'erreur
          if (MonHistoire.showMessageModal) {
            MonHistoire.showMessageModal("Erreur lors de la mise à jour des informations du compte. Veuillez réessayer.");
          }
        });
    } else {
      console.error("Module de stockage non disponible");
      
      // Masquer le chargement
      if (MonHistoire.modules.app && MonHistoire.modules.app.showLoading) {
        MonHistoire.modules.app.showLoading(false);
      }
    }
  }
  
  /**
   * Affiche le modal de changement de mot de passe
   */
  function showChangePasswordModal() {
    const changePasswordModal = document.getElementById('change-password-modal');
    if (changePasswordModal) {
      // Réinitialiser le formulaire
      const form = changePasswordModal.querySelector('form');
      if (form) {
        form.reset();
      }
      
      // Afficher le modal
      changePasswordModal.classList.add('show');
    }
  }
  
  /**
   * Gère le changement de mot de passe
   */
  function handleChangePassword() {
    if (!currentUser) {
      return;
    }
    
    // Récupérer les valeurs du formulaire
    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    
    // Valider les champs
    if (!currentPassword || !newPassword || !confirmPassword) {
      if (MonHistoire.showMessageModal) {
        MonHistoire.showMessageModal("Veuillez remplir tous les champs.");
      }
      return;
    }
    
    if (newPassword !== confirmPassword) {
      if (MonHistoire.showMessageModal) {
        MonHistoire.showMessageModal("Les nouveaux mots de passe ne correspondent pas.");
      }
      return;
    }
    
    // Afficher le chargement
    if (MonHistoire.modules.app && MonHistoire.modules.app.showLoading) {
      MonHistoire.modules.app.showLoading(true, "Changement du mot de passe...");
    }
    
    // Utiliser le module d'authentification pour changer le mot de passe
    if (MonHistoire.modules.user && MonHistoire.modules.user.auth) {
      MonHistoire.modules.user.auth.changePassword(currentPassword, newPassword)
        .then(() => {
          // Masquer le modal
          const changePasswordModal = document.getElementById('change-password-modal');
          if (changePasswordModal) {
            changePasswordModal.classList.remove('show');
          }
          
          // Masquer le chargement
          if (MonHistoire.modules.app && MonHistoire.modules.app.showLoading) {
            MonHistoire.modules.app.showLoading(false);
          }
          
          // Afficher un message de succès
          if (MonHistoire.showMessageModal) {
            MonHistoire.showMessageModal("Mot de passe changé avec succès.");
          }
          
          console.log("Mot de passe changé");
        })
        .catch(error => {
          console.error("Erreur lors du changement de mot de passe:", error);
          
          // Masquer le chargement
          if (MonHistoire.modules.app && MonHistoire.modules.app.showLoading) {
            MonHistoire.modules.app.showLoading(false);
          }
          
          // Afficher un message d'erreur
          let errorMessage = "Erreur lors du changement de mot de passe. Veuillez réessayer.";
          
          if (error.code === 'auth/wrong-password') {
            errorMessage = "Le mot de passe actuel est incorrect.";
          } else if (error.code === 'auth/weak-password') {
            errorMessage = "Le nouveau mot de passe est trop faible. Il doit contenir au moins 6 caractères.";
          }
          
          if (MonHistoire.showMessageModal) {
            MonHistoire.showMessageModal(errorMessage);
          }
        });
    } else {
      console.error("Module d'authentification non disponible");
      
      // Masquer le chargement
      if (MonHistoire.modules.app && MonHistoire.modules.app.showLoading) {
        MonHistoire.modules.app.showLoading(false);
      }
    }
  }
  
  /**
   * Affiche la confirmation de suppression de compte
   */
  function showDeleteAccountConfirmation() {
    const deleteAccountModal = document.getElementById('delete-account-modal');
    if (deleteAccountModal) {
      // Réinitialiser le formulaire
      const form = deleteAccountModal.querySelector('form');
      if (form) {
        form.reset();
      }
      
      // Afficher le modal
      deleteAccountModal.classList.add('show');
    }
  }
  
  /**
   * Gère la suppression du compte
   */
  function handleDeleteAccount() {
    if (!currentUser) {
      return;
    }
    
    // Récupérer les valeurs du formulaire
    const password = document.getElementById('delete-account-password').value;
    const confirmation = document.getElementById('delete-account-confirmation').value;
    
    // Valider les champs
    if (!password) {
      if (MonHistoire.showMessageModal) {
        MonHistoire.showMessageModal("Veuillez saisir votre mot de passe.");
      }
      return;
    }
    
    if (confirmation !== 'SUPPRIMER') {
      if (MonHistoire.showMessageModal) {
        MonHistoire.showMessageModal("Veuillez saisir SUPPRIMER pour confirmer.");
      }
      return;
    }
    
    // Afficher le chargement
    if (MonHistoire.modules.app && MonHistoire.modules.app.showLoading) {
      MonHistoire.modules.app.showLoading(true, "Suppression du compte...");
    }
    
    // Utiliser le module d'authentification pour supprimer le compte
    if (MonHistoire.modules.user && MonHistoire.modules.user.auth) {
      MonHistoire.modules.user.auth.deleteAccount(password)
        .then(() => {
          // Masquer le modal
          const deleteAccountModal = document.getElementById('delete-account-modal');
          if (deleteAccountModal) {
            deleteAccountModal.classList.remove('show');
          }
          
          // Masquer le chargement
          if (MonHistoire.modules.app && MonHistoire.modules.app.showLoading) {
            MonHistoire.modules.app.showLoading(false);
          }
          
          // Afficher un message de succès
          if (MonHistoire.showMessageModal) {
            MonHistoire.showMessageModal("Votre compte a été supprimé avec succès.");
          }
          
          console.log("Compte supprimé");
        })
        .catch(error => {
          console.error("Erreur lors de la suppression du compte:", error);
          
          // Masquer le chargement
          if (MonHistoire.modules.app && MonHistoire.modules.app.showLoading) {
            MonHistoire.modules.app.showLoading(false);
          }
          
          // Afficher un message d'erreur
          let errorMessage = "Erreur lors de la suppression du compte. Veuillez réessayer.";
          
          if (error.code === 'auth/wrong-password') {
            errorMessage = "Le mot de passe est incorrect.";
          }
          
          if (MonHistoire.showMessageModal) {
            MonHistoire.showMessageModal(errorMessage);
          }
        });
    } else {
      console.error("Module d'authentification non disponible");
      
      // Masquer le chargement
      if (MonHistoire.modules.app && MonHistoire.modules.app.showLoading) {
        MonHistoire.modules.app.showLoading(false);
      }
    }
  }
  
  /**
   * Met à jour les informations du compte utilisateur
   * @param {Object} info - Nouvelles informations du compte
   * @returns {Promise} Promesse résolue lorsque la mise à jour est terminée
   */
  function updateUserInfo(info) {
    return new Promise((resolve, reject) => {
      if (!currentUser) {
        reject(new Error("Utilisateur non connecté"));
        return;
      }
      
      // Utiliser le module de stockage pour mettre à jour les informations
      if (MonHistoire.modules.core && MonHistoire.modules.core.storage) {
        MonHistoire.modules.core.storage.updateUserInfo(currentUser.uid, info)
          .then(() => {
            // Mettre à jour les informations locales
            userInfo = { ...userInfo, ...info };
            
            // Mettre à jour l'interface utilisateur
            updateUI();
            
            // Émettre un événement pour informer les autres modules
            if (MonHistoire.events) {
              MonHistoire.events.emit('accountUpdated', userInfo);
            }
            
            resolve();
          })
          .catch(reject);
      } else {
        reject(new Error("Module de stockage non disponible"));
      }
    });
  }
  
  /**
   * Change le mot de passe de l'utilisateur
   * @param {string} currentPassword - Mot de passe actuel
   * @param {string} newPassword - Nouveau mot de passe
   * @returns {Promise} Promesse résolue lorsque le changement est terminé
   */
  function changePassword(currentPassword, newPassword) {
    return new Promise((resolve, reject) => {
      if (!currentUser) {
        reject(new Error("Utilisateur non connecté"));
        return;
      }
      
      // Utiliser le module d'authentification pour changer le mot de passe
      if (MonHistoire.modules.user && MonHistoire.modules.user.auth) {
        MonHistoire.modules.user.auth.changePassword(currentPassword, newPassword)
          .then(resolve)
          .catch(reject);
      } else {
        reject(new Error("Module d'authentification non disponible"));
      }
    });
  }
  
  /**
   * Supprime le compte de l'utilisateur
   * @param {string} password - Mot de passe de l'utilisateur
   * @returns {Promise} Promesse résolue lorsque la suppression est terminée
   */
  function deleteAccount(password) {
    return new Promise((resolve, reject) => {
      if (!currentUser) {
        reject(new Error("Utilisateur non connecté"));
        return;
      }
      
      // Utiliser le module d'authentification pour supprimer le compte
      if (MonHistoire.modules.user && MonHistoire.modules.user.auth) {
        MonHistoire.modules.user.auth.deleteAccount(password)
          .then(resolve)
          .catch(reject);
      } else {
        reject(new Error("Module d'authentification non disponible"));
      }
    });
  }
  
  /**
   * Obtient les informations du compte utilisateur
   * @returns {Object} Informations du compte
   */
  function getUserInfo() {
    return { ...userInfo };
  }
  
  // API publique
  MonHistoire.modules.user.account = {
    init: init,
    getUserInfo: getUserInfo,
    updateUserInfo: updateUserInfo,
    changePassword: changePassword,
    deleteAccount: deleteAccount
  };
})();
