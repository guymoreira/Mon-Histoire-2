// js/modules/user/profiles.js
// Module de gestion des profils utilisateur
// Responsable de la création, modification et suppression des profils enfants

// S'assurer que les namespaces existent
window.MonHistoire = window.MonHistoire || {};
MonHistoire.modules = MonHistoire.modules || {};
MonHistoire.modules.user = MonHistoire.modules.user || {};

// Module de gestion des profils
(function() {
  // Variables privées
  let childProfiles = [];
  let currentProfile = null;
  let isInitialized = false;
  
  /**
   * Initialise le module de gestion des profils
   */
  function init() {
    if (isInitialized) {
      console.warn("Module Profiles déjà initialisé");
      return;
    }
    
    // Écouter les changements d'authentification
    if (MonHistoire.events) {
      MonHistoire.events.on('authStateChange', handleAuthStateChange);
    }
    
    // Configurer les écouteurs d'événements pour les boutons de profil
    setupProfileListeners();
    
    isInitialized = true;
    console.log("Module Profiles initialisé");
  }
  
  /**
   * Gère les changements d'état d'authentification
   * @param {Object} user - Utilisateur authentifié ou null
   */
  function handleAuthStateChange(user) {
    if (user) {
      // Utilisateur connecté, charger les profils
      loadProfiles();
    } else {
      // Utilisateur déconnecté, réinitialiser les profils
      childProfiles = [];
      currentProfile = null;
      
      // Mettre à jour l'interface utilisateur
      updateUI();
    }
  }
  
  /**
   * Configure les écouteurs d'événements pour les boutons de profil
   */
  function setupProfileListeners() {
    // Bouton d'ajout de profil
    const addProfileButton = document.getElementById('add-profile-button');
    if (addProfileButton) {
      addProfileButton.addEventListener('click', showAddProfileModal);
    }
    
    // Bouton de validation du formulaire d'ajout de profil
    const saveProfileButton = document.getElementById('save-profile-button');
    if (saveProfileButton) {
      saveProfileButton.addEventListener('click', handleAddProfile);
    }
    
    // Bouton de modification de profil
    const editProfileButton = document.getElementById('edit-profile-button');
    if (editProfileButton) {
      editProfileButton.addEventListener('click', showEditProfileModal);
    }
    
    // Bouton de validation du formulaire de modification de profil
    const updateProfileButton = document.getElementById('update-profile-button');
    if (updateProfileButton) {
      updateProfileButton.addEventListener('click', handleUpdateProfile);
    }
    
    // Bouton de suppression de profil
    const deleteProfileButton = document.getElementById('delete-profile-button');
    if (deleteProfileButton) {
      deleteProfileButton.addEventListener('click', showDeleteProfileConfirmation);
    }
    
    // Bouton de confirmation de suppression de profil
    const confirmDeleteButton = document.getElementById('confirm-delete-profile');
    if (confirmDeleteButton) {
      confirmDeleteButton.addEventListener('click', handleDeleteProfile);
    }
    
    console.log("Écouteurs de profil configurés");
  }
  
  /**
   * Charge les profils enfants de l'utilisateur
   */
  function loadProfiles() {
    // Afficher le chargement
    if (MonHistoire.modules.app && MonHistoire.modules.app.showLoading) {
      MonHistoire.modules.app.showLoading(true, "Chargement des profils...");
    }
    
    // Utiliser le module de stockage pour récupérer les profils
    if (MonHistoire.modules.core && MonHistoire.modules.core.storage) {
      MonHistoire.modules.core.storage.getChildProfiles()
        .then(profiles => {
          childProfiles = profiles;
          
          // Si aucun profil n'est sélectionné et qu'il y a des profils disponibles, sélectionner le premier
          if (!currentProfile && childProfiles.length > 0) {
            currentProfile = childProfiles[0];
          }
          
          // Mettre à jour l'interface utilisateur
          updateUI();
          
          // Masquer le chargement
          if (MonHistoire.modules.app && MonHistoire.modules.app.showLoading) {
            MonHistoire.modules.app.showLoading(false);
          }
          
          // Émettre un événement pour informer les autres modules
          if (MonHistoire.events) {
            MonHistoire.events.emit('profilesLoaded', childProfiles);
          }
          
          console.log(`${childProfiles.length} profils chargés`);
        })
        .catch(error => {
          console.error("Erreur lors du chargement des profils:", error);
          
          // Masquer le chargement
          if (MonHistoire.modules.app && MonHistoire.modules.app.showLoading) {
            MonHistoire.modules.app.showLoading(false);
          }
          
          // Afficher un message d'erreur
          if (MonHistoire.showMessageModal) {
            MonHistoire.showMessageModal("Erreur lors du chargement des profils. Veuillez réessayer.");
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
   * Met à jour l'interface utilisateur avec les profils
   */
  function updateUI() {
    // Mettre à jour la liste des profils
    const profilesList = document.getElementById('profiles-list');
    if (profilesList) {
      // Vider la liste
      profilesList.innerHTML = '';
      
      // Ajouter chaque profil à la liste
      childProfiles.forEach(profile => {
        const profileItem = document.createElement('div');
        profileItem.className = 'profile-item';
        if (currentProfile && profile.id === currentProfile.id) {
          profileItem.classList.add('active');
        }
        
        // Ajouter l'avatar
        const avatar = document.createElement('div');
        avatar.className = 'profile-avatar';
        avatar.style.backgroundColor = profile.color || '#1161a5';
        avatar.textContent = profile.prenom ? profile.prenom.charAt(0).toUpperCase() : '?';
        
        // Ajouter le nom
        const name = document.createElement('div');
        name.className = 'profile-name';
        name.textContent = profile.prenom || 'Sans nom';
        
        // Ajouter les éléments au profil
        profileItem.appendChild(avatar);
        profileItem.appendChild(name);
        
        // Ajouter un écouteur d'événement pour sélectionner le profil
        profileItem.addEventListener('click', () => {
          selectProfile(profile);
        });
        
        // Ajouter le profil à la liste
        profilesList.appendChild(profileItem);
      });
      
      // Ajouter un bouton pour ajouter un profil
      const addProfileItem = document.createElement('div');
      addProfileItem.className = 'profile-item add-profile';
      addProfileItem.innerHTML = '<div class="profile-avatar">+</div><div class="profile-name">Ajouter</div>';
      addProfileItem.addEventListener('click', showAddProfileModal);
      profilesList.appendChild(addProfileItem);
    }
    
    // Mettre à jour le profil actuel dans l'en-tête
    const currentProfileElement = document.getElementById('current-profile');
    if (currentProfileElement) {
      if (currentProfile) {
        currentProfileElement.textContent = currentProfile.prenom;
        currentProfileElement.classList.remove('hidden');
      } else {
        currentProfileElement.classList.add('hidden');
      }
    }
    
    // Mettre à jour l'état global
    if (MonHistoire.state) {
      MonHistoire.state.currentProfile = currentProfile;
    }
  }
  
  /**
   * Sélectionne un profil
   * @param {Object} profile - Profil à sélectionner
   */
  function selectProfile(profile) {
    currentProfile = profile;
    
    // Mettre à jour l'interface utilisateur
    updateUI();
    
    // Émettre un événement pour informer les autres modules
    if (MonHistoire.events) {
      MonHistoire.events.emit('profileSelected', profile);
    }
    
    console.log(`Profil sélectionné: ${profile.prenom}`);
  }
  
  /**
   * Affiche le modal d'ajout de profil
   */
  function showAddProfileModal() {
    const addProfileModal = document.getElementById('add-profile-modal');
    if (addProfileModal) {
      // Réinitialiser le formulaire
      const form = addProfileModal.querySelector('form');
      if (form) {
        form.reset();
      }
      
      // Afficher le modal
      addProfileModal.classList.add('show');
    }
  }
  
  /**
   * Gère l'ajout d'un profil
   */
  function handleAddProfile() {
    // Récupérer les valeurs du formulaire
    const prenom = document.getElementById('profile-prenom').value;
    const age = document.getElementById('profile-age').value;
    const genre = document.querySelector('input[name="profile-genre"]:checked').value;
    const color = document.getElementById('profile-color').value;
    
    // Valider les champs
    if (!prenom) {
      if (MonHistoire.showMessageModal) {
        MonHistoire.showMessageModal("Veuillez saisir un prénom");
      }
      return;
    }
    
    // Créer l'objet profil
    const profileData = {
      prenom: prenom,
      age: age,
      genre: genre,
      color: color
    };
    
    // Afficher le chargement
    if (MonHistoire.modules.app && MonHistoire.modules.app.showLoading) {
      MonHistoire.modules.app.showLoading(true, "Création du profil...");
    }
    
    // Utiliser le module de stockage pour créer le profil
    if (MonHistoire.modules.core && MonHistoire.modules.core.storage) {
      MonHistoire.modules.core.storage.createChildProfile(profileData)
        .then(profileId => {
          // Ajouter l'ID au profil
          profileData.id = profileId;
          
          // Ajouter le profil à la liste
          childProfiles.push(profileData);
          
          // Sélectionner le nouveau profil
          selectProfile(profileData);
          
          // Masquer le modal
          const addProfileModal = document.getElementById('add-profile-modal');
          if (addProfileModal) {
            addProfileModal.classList.remove('show');
          }
          
          // Masquer le chargement
          if (MonHistoire.modules.app && MonHistoire.modules.app.showLoading) {
            MonHistoire.modules.app.showLoading(false);
          }
          
          // Émettre un événement pour informer les autres modules
          if (MonHistoire.events) {
            MonHistoire.events.emit('profileCreated', profileData);
          }
          
          console.log(`Profil créé: ${profileData.prenom}`);
        })
        .catch(error => {
          console.error("Erreur lors de la création du profil:", error);
          
          // Masquer le chargement
          if (MonHistoire.modules.app && MonHistoire.modules.app.showLoading) {
            MonHistoire.modules.app.showLoading(false);
          }
          
          // Afficher un message d'erreur
          if (MonHistoire.showMessageModal) {
            MonHistoire.showMessageModal("Erreur lors de la création du profil. Veuillez réessayer.");
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
   * Affiche le modal de modification de profil
   */
  function showEditProfileModal() {
    if (!currentProfile) {
      if (MonHistoire.showMessageModal) {
        MonHistoire.showMessageModal("Veuillez sélectionner un profil à modifier");
      }
      return;
    }
    
    const editProfileModal = document.getElementById('edit-profile-modal');
    if (editProfileModal) {
      // Remplir le formulaire avec les valeurs du profil actuel
      const prenomInput = document.getElementById('edit-profile-prenom');
      const ageInput = document.getElementById('edit-profile-age');
      const genreInputs = document.querySelectorAll('input[name="edit-profile-genre"]');
      const colorInput = document.getElementById('edit-profile-color');
      
      if (prenomInput) prenomInput.value = currentProfile.prenom || '';
      if (ageInput) ageInput.value = currentProfile.age || '';
      if (genreInputs) {
        genreInputs.forEach(input => {
          if (input.value === currentProfile.genre) {
            input.checked = true;
          }
        });
      }
      if (colorInput) colorInput.value = currentProfile.color || '#1161a5';
      
      // Afficher le modal
      editProfileModal.classList.add('show');
    }
  }
  
  /**
   * Gère la modification d'un profil
   */
  function handleUpdateProfile() {
    if (!currentProfile) {
      return;
    }
    
    // Récupérer les valeurs du formulaire
    const prenom = document.getElementById('edit-profile-prenom').value;
    const age = document.getElementById('edit-profile-age').value;
    const genre = document.querySelector('input[name="edit-profile-genre"]:checked').value;
    const color = document.getElementById('edit-profile-color').value;
    
    // Valider les champs
    if (!prenom) {
      if (MonHistoire.showMessageModal) {
        MonHistoire.showMessageModal("Veuillez saisir un prénom");
      }
      return;
    }
    
    // Créer l'objet profil
    const profileData = {
      prenom: prenom,
      age: age,
      genre: genre,
      color: color
    };
    
    // Afficher le chargement
    if (MonHistoire.modules.app && MonHistoire.modules.app.showLoading) {
      MonHistoire.modules.app.showLoading(true, "Mise à jour du profil...");
    }
    
    // Utiliser le module de stockage pour mettre à jour le profil
    if (MonHistoire.modules.core && MonHistoire.modules.core.storage) {
      MonHistoire.modules.core.storage.updateChildProfile(currentProfile.id, profileData)
        .then(() => {
          // Mettre à jour le profil dans la liste
          const index = childProfiles.findIndex(p => p.id === currentProfile.id);
          if (index !== -1) {
            childProfiles[index] = { ...childProfiles[index], ...profileData };
            currentProfile = childProfiles[index];
          }
          
          // Mettre à jour l'interface utilisateur
          updateUI();
          
          // Masquer le modal
          const editProfileModal = document.getElementById('edit-profile-modal');
          if (editProfileModal) {
            editProfileModal.classList.remove('show');
          }
          
          // Masquer le chargement
          if (MonHistoire.modules.app && MonHistoire.modules.app.showLoading) {
            MonHistoire.modules.app.showLoading(false);
          }
          
          // Émettre un événement pour informer les autres modules
          if (MonHistoire.events) {
            MonHistoire.events.emit('profileUpdated', currentProfile);
          }
          
          console.log(`Profil mis à jour: ${currentProfile.prenom}`);
        })
        .catch(error => {
          console.error("Erreur lors de la mise à jour du profil:", error);
          
          // Masquer le chargement
          if (MonHistoire.modules.app && MonHistoire.modules.app.showLoading) {
            MonHistoire.modules.app.showLoading(false);
          }
          
          // Afficher un message d'erreur
          if (MonHistoire.showMessageModal) {
            MonHistoire.showMessageModal("Erreur lors de la mise à jour du profil. Veuillez réessayer.");
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
   * Affiche la confirmation de suppression de profil
   */
  function showDeleteProfileConfirmation() {
    if (!currentProfile) {
      if (MonHistoire.showMessageModal) {
        MonHistoire.showMessageModal("Veuillez sélectionner un profil à supprimer");
      }
      return;
    }
    
    const deleteProfileModal = document.getElementById('delete-profile-modal');
    if (deleteProfileModal) {
      // Mettre à jour le message de confirmation
      const confirmationMessage = deleteProfileModal.querySelector('.confirmation-message');
      if (confirmationMessage) {
        confirmationMessage.textContent = `Êtes-vous sûr de vouloir supprimer le profil de ${currentProfile.prenom} ? Cette action est irréversible.`;
      }
      
      // Afficher le modal
      deleteProfileModal.classList.add('show');
    }
  }
  
  /**
   * Gère la suppression d'un profil
   */
  function handleDeleteProfile() {
    if (!currentProfile) {
      return;
    }
    
    // Afficher le chargement
    if (MonHistoire.modules.app && MonHistoire.modules.app.showLoading) {
      MonHistoire.modules.app.showLoading(true, "Suppression du profil...");
    }
    
    // Utiliser le module de stockage pour supprimer le profil
    if (MonHistoire.modules.core && MonHistoire.modules.core.storage) {
      MonHistoire.modules.core.storage.deleteChildProfile(currentProfile.id)
        .then(() => {
          // Supprimer le profil de la liste
          const index = childProfiles.findIndex(p => p.id === currentProfile.id);
          if (index !== -1) {
            childProfiles.splice(index, 1);
          }
          
          // Sélectionner un autre profil si disponible
          if (childProfiles.length > 0) {
            currentProfile = childProfiles[0];
          } else {
            currentProfile = null;
          }
          
          // Mettre à jour l'interface utilisateur
          updateUI();
          
          // Masquer le modal
          const deleteProfileModal = document.getElementById('delete-profile-modal');
          if (deleteProfileModal) {
            deleteProfileModal.classList.remove('show');
          }
          
          // Masquer le chargement
          if (MonHistoire.modules.app && MonHistoire.modules.app.showLoading) {
            MonHistoire.modules.app.showLoading(false);
          }
          
          // Émettre un événement pour informer les autres modules
          if (MonHistoire.events) {
            MonHistoire.events.emit('profileDeleted', currentProfile);
          }
          
          console.log("Profil supprimé");
        })
        .catch(error => {
          console.error("Erreur lors de la suppression du profil:", error);
          
          // Masquer le chargement
          if (MonHistoire.modules.app && MonHistoire.modules.app.showLoading) {
            MonHistoire.modules.app.showLoading(false);
          }
          
          // Afficher un message d'erreur
          if (MonHistoire.showMessageModal) {
            MonHistoire.showMessageModal("Erreur lors de la suppression du profil. Veuillez réessayer.");
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
   * Obtient tous les profils enfants
   * @returns {Array} Liste des profils enfants
   */
  function getProfiles() {
    return [...childProfiles];
  }
  
  /**
   * Obtient le profil actuel
   * @returns {Object} Profil actuel ou null si aucun profil n'est sélectionné
   */
  function getCurrentProfile() {
    return currentProfile;
  }
  
  /**
   * Crée un nouveau profil enfant
   * @param {Object} profileData - Données du profil
   * @returns {Promise} Promesse résolue avec l'ID du profil créé
   */
  function createProfile(profileData) {
    return new Promise((resolve, reject) => {
      // Valider les données
      if (!profileData.prenom) {
        reject(new Error("Le prénom est requis"));
        return;
      }
      
      // Utiliser le module de stockage pour créer le profil
      if (MonHistoire.modules.core && MonHistoire.modules.core.storage) {
        MonHistoire.modules.core.storage.createChildProfile(profileData)
          .then(profileId => {
            // Ajouter l'ID au profil
            const newProfile = { ...profileData, id: profileId };
            
            // Ajouter le profil à la liste
            childProfiles.push(newProfile);
            
            // Mettre à jour l'interface utilisateur
            updateUI();
            
            // Émettre un événement pour informer les autres modules
            if (MonHistoire.events) {
              MonHistoire.events.emit('profileCreated', newProfile);
            }
            
            resolve(profileId);
          })
          .catch(reject);
      } else {
        reject(new Error("Module de stockage non disponible"));
      }
    });
  }
  
  /**
   * Met à jour un profil enfant
   * @param {string} profileId - ID du profil à mettre à jour
   * @param {Object} profileData - Nouvelles données du profil
   * @returns {Promise} Promesse résolue lorsque la mise à jour est terminée
   */
  function updateProfile(profileId, profileData) {
    return new Promise((resolve, reject) => {
      // Valider les données
      if (!profileData.prenom) {
        reject(new Error("Le prénom est requis"));
        return;
      }
      
      // Utiliser le module de stockage pour mettre à jour le profil
      if (MonHistoire.modules.core && MonHistoire.modules.core.storage) {
        MonHistoire.modules.core.storage.updateChildProfile(profileId, profileData)
          .then(() => {
            // Mettre à jour le profil dans la liste
            const index = childProfiles.findIndex(p => p.id === profileId);
            if (index !== -1) {
              childProfiles[index] = { ...childProfiles[index], ...profileData };
              
              // Si c'est le profil actuel, le mettre à jour
              if (currentProfile && currentProfile.id === profileId) {
                currentProfile = childProfiles[index];
              }
            }
            
            // Mettre à jour l'interface utilisateur
            updateUI();
            
            // Émettre un événement pour informer les autres modules
            if (MonHistoire.events) {
              MonHistoire.events.emit('profileUpdated', childProfiles[index]);
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
   * Supprime un profil enfant
   * @param {string} profileId - ID du profil à supprimer
   * @returns {Promise} Promesse résolue lorsque la suppression est terminée
   */
  function deleteProfile(profileId) {
    return new Promise((resolve, reject) => {
      // Utiliser le module de stockage pour supprimer le profil
      if (MonHistoire.modules.core && MonHistoire.modules.core.storage) {
        MonHistoire.modules.core.storage.deleteChildProfile(profileId)
          .then(() => {
            // Supprimer le profil de la liste
            const index = childProfiles.findIndex(p => p.id === profileId);
            if (index !== -1) {
              // Sauvegarder le profil pour l'événement
              const deletedProfile = childProfiles[index];
              
              // Supprimer le profil de la liste
              childProfiles.splice(index, 1);
              
              // Si c'est le profil actuel, sélectionner un autre profil
              if (currentProfile && currentProfile.id === profileId) {
                if (childProfiles.length > 0) {
                  currentProfile = childProfiles[0];
                } else {
                  currentProfile = null;
                }
              }
              
              // Mettre à jour l'interface utilisateur
              updateUI();
              
              // Émettre un événement pour informer les autres modules
              if (MonHistoire.events) {
                MonHistoire.events.emit('profileDeleted', deletedProfile);
              }
            }
            
            resolve();
          })
          .catch(reject);
      } else {
        reject(new Error("Module de stockage non disponible"));
      }
    });
  }
  
  // API publique
  MonHistoire.modules.user.profiles = {
    init: init,
    getProfiles: getProfiles,
    getCurrentProfile: getCurrentProfile,
    createProfile: createProfile,
    updateProfile: updateProfile,
    deleteProfile: deleteProfile,
    selectProfile: selectProfile
  };
})();
