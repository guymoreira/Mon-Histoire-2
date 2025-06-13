// js/modules/core/storage.js
// Module de stockage
// Responsable de la gestion du stockage des données (Firebase Firestore, Storage, etc.)

// S'assurer que les namespaces existent
window.MonHistoire = window.MonHistoire || {};
MonHistoire.modules = MonHistoire.modules || {};
MonHistoire.modules.core = MonHistoire.modules.core || {};

// Module de stockage
(function() {
  // Variables privées
  let isInitialized = false;
  let db = null;
  let storage = null;
  let currentUser = null;
  
  // Collections Firestore
  const COLLECTIONS = {
    USERS: 'users',
    PROFILES: 'profiles',
    STORIES: 'stories',
    TEMPLATES: 'templates',
    SHARES: 'shares',
    SETTINGS: 'settings'
  };
  
  // Dossiers Storage
  const STORAGE_FOLDERS = {
    PROFILE_IMAGES: 'profile-images',
    STORY_IMAGES: 'story-images',
    EXPORTS: 'exports'
  };
  
  /**
   * Initialise le module de stockage
   */
  function init() {
    if (isInitialized) {
      console.warn("Module Storage déjà initialisé");
      return;
    }
    
    // Vérifier si Firebase est disponible
    if (!window.firebase) {
      console.warn("Firebase n'est pas disponible, initialisation du module Storage en mode déconnecté");
      isInitialized = true;
      console.log("Module Storage initialisé en mode déconnecté");
      return;
    }
    
    try {
      // Initialiser Firestore
      db = firebase.firestore();
      
      // Initialiser Storage
      storage = firebase.storage();
      
      // Écouter les changements d'état d'authentification
      if (MonHistoire.events) {
        MonHistoire.events.on('authStateChange', handleAuthStateChange);
      }
      
      isInitialized = true;
      console.log("Module Storage initialisé");
    } catch (error) {
      console.error("Erreur lors de l'initialisation du module Storage:", error);
      console.warn("Initialisation du module Storage en mode déconnecté suite à une erreur");
      isInitialized = true;
    }
  }
  
  /**
   * Gère les changements d'état d'authentification
   * @param {Object} user - Utilisateur authentifié ou null
   */
  function handleAuthStateChange(user) {
    currentUser = user;
  }
  
  /**
   * Vérifie si l'utilisateur est authentifié
   * @returns {boolean} True si l'utilisateur est authentifié
   * @private
   */
  function _checkAuth() {
    if (!currentUser) {
      throw new Error("Utilisateur non authentifié");
    }
    
    return true;
  }
  
  /**
   * Génère un ID unique
   * @returns {string} ID unique
   * @private
   */
  function _generateId() {
    if (!db) {
      // Si Firestore n'est pas disponible, générer un ID aléatoire
      return 'local-' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }
    return db.collection(COLLECTIONS.USERS).doc().id;
  }
  
  /**
   * Convertit un document Firestore en objet
   * @param {Object} doc - Document Firestore
   * @returns {Object} Objet avec les données du document
   * @private
   */
  function _convertDoc(doc) {
    if (!doc.exists) {
      return null;
    }
    
    return {
      id: doc.id,
      ...doc.data()
    };
  }
  
  /**
   * Convertit un snapshot Firestore en tableau d'objets
   * @param {Object} snapshot - Snapshot Firestore
   * @returns {Array} Tableau d'objets
   * @private
   */
  function _convertSnapshot(snapshot) {
    const result = [];
    
    snapshot.forEach(doc => {
      result.push(_convertDoc(doc));
    });
    
    return result;
  }
  
  /**
   * Génère le contenu d'une histoire à partir d'un template et des données du formulaire
   * @param {Object} template - Template de l'histoire
   * @param {Object} formData - Données du formulaire
   * @returns {string} Contenu de l'histoire
   * @private
   */
  function _generateStoryContent(template, formData) {
    if (!template || !template.content) {
      return "Il était une fois...";
    }
    
    // Remplacer les variables dans le contenu
    let content = template.content;
    
    // Remplacer les variables du formulaire
    for (const [key, value] of Object.entries(formData)) {
      if (typeof value === 'string') {
        content = content.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
      }
    }
    
    return content;
  }
  
  // ===== PROFILS =====
  
  /**
   * Crée un profil
   * @param {Object} profileData - Données du profil
   * @returns {Promise} Promesse résolue avec l'ID du profil créé
   */
  function createProfile(profileData) {
    return new Promise((resolve, reject) => {
      try {
        _checkAuth();
        
        // Générer un ID pour le profil
        const profileId = _generateId();
        
        // Préparer les données du profil
        const profile = {
          ...profileData,
          id: profileId,
          userId: currentUser.uid,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        // Sauvegarder le profil dans Firestore
        db.collection(COLLECTIONS.PROFILES)
          .doc(profileId)
          .set(profile)
          .then(() => {
            resolve(profileId);
          })
          .catch(reject);
      } catch (error) {
        reject(error);
      }
    });
  }
  
  /**
   * Met à jour un profil
   * @param {string} profileId - ID du profil
   * @param {Object} profileData - Données du profil
   * @returns {Promise} Promesse résolue lorsque le profil est mis à jour
   */
  function updateProfile(profileId, profileData) {
    return new Promise((resolve, reject) => {
      try {
        _checkAuth();
        
        // Préparer les données du profil
        const profile = {
          ...profileData,
          updatedAt: new Date().toISOString()
        };
        
        // Supprimer les champs qui ne doivent pas être modifiés
        delete profile.id;
        delete profile.userId;
        delete profile.createdAt;
        
        // Mettre à jour le profil dans Firestore
        db.collection(COLLECTIONS.PROFILES)
          .doc(profileId)
          .update(profile)
          .then(resolve)
          .catch(reject);
      } catch (error) {
        reject(error);
      }
    });
  }
  
  /**
   * Supprime un profil
   * @param {string} profileId - ID du profil
   * @returns {Promise} Promesse résolue lorsque le profil est supprimé
   */
  function deleteProfile(profileId) {
    return new Promise((resolve, reject) => {
      try {
        _checkAuth();
        
        // Supprimer le profil de Firestore
        db.collection(COLLECTIONS.PROFILES)
          .doc(profileId)
          .delete()
          .then(resolve)
          .catch(reject);
      } catch (error) {
        reject(error);
      }
    });
  }
  
  /**
   * Récupère un profil
   * @param {string} profileId - ID du profil
   * @returns {Promise} Promesse résolue avec le profil
   */
  function getProfile(profileId) {
    return new Promise((resolve, reject) => {
      try {
        _checkAuth();
        
        // Récupérer le profil de Firestore
        db.collection(COLLECTIONS.PROFILES)
          .doc(profileId)
          .get()
          .then(doc => {
            resolve(_convertDoc(doc));
          })
          .catch(reject);
      } catch (error) {
        reject(error);
      }
    });
  }
  
  /**
   * Récupère tous les profils de l'utilisateur
   * @returns {Promise} Promesse résolue avec la liste des profils
   */
  function getProfiles() {
    return new Promise((resolve, reject) => {
      try {
        _checkAuth();
        
        // Récupérer les profils de Firestore
        db.collection(COLLECTIONS.PROFILES)
          .where('userId', '==', currentUser.uid)
          .orderBy('createdAt', 'desc')
          .get()
          .then(snapshot => {
            resolve(_convertSnapshot(snapshot));
          })
          .catch(reject);
      } catch (error) {
        reject(error);
      }
    });
  }
  
  /**
   * Télécharge une image de profil
   * @param {string} profileId - ID du profil
   * @param {File} file - Fichier image
   * @returns {Promise} Promesse résolue avec l'URL de l'image
   */
  function uploadProfileImage(profileId, file) {
    return new Promise((resolve, reject) => {
      try {
        _checkAuth();
        
        // Vérifier le type de fichier
        if (!file.type.startsWith('image/')) {
          reject(new Error("Le fichier doit être une image"));
          return;
        }
        
        // Créer une référence au fichier dans Storage
        const storageRef = storage.ref();
        const fileRef = storageRef.child(`${STORAGE_FOLDERS.PROFILE_IMAGES}/${currentUser.uid}/${profileId}`);
        
        // Télécharger le fichier
        fileRef.put(file)
          .then(snapshot => {
            // Récupérer l'URL du fichier
            return snapshot.ref.getDownloadURL();
          })
          .then(url => {
            // Mettre à jour le profil avec l'URL de l'image
            return updateProfile(profileId, { imageUrl: url })
              .then(() => url);
          })
          .then(resolve)
          .catch(reject);
      } catch (error) {
        reject(error);
      }
    });
  }
  
  // ===== HISTOIRES =====
  
  /**
   * Récupère les templates d'histoires
   * @returns {Promise} Promesse résolue avec la liste des templates
   */
  function getStoryTemplates() {
    return new Promise((resolve, reject) => {
      // Vérifier si Firestore est initialisé
      if (!db) {
        console.warn("Firestore n'est pas initialisé, utilisation des templates par défaut");
        // Retourner des templates par défaut
        resolve([
          {
            id: 'template-1',
            title: 'Aventure dans la forêt enchantée',
            description: 'Une aventure magique dans une forêt pleine de mystères',
            content: 'Il était une fois, dans un royaume lointain, un jeune héros nommé {heroName}. Un jour, {heroName} décida d\'explorer la forêt enchantée...',
            order: 1
          },
          {
            id: 'template-2',
            title: 'Le trésor caché',
            description: 'Partez à la recherche d\'un trésor légendaire',
            content: 'Dans un village paisible vivait {heroName}, connu pour sa curiosité et son courage. Un jour, {heroName} découvrit une vieille carte au trésor...',
            order: 2
          },
          {
            id: 'template-3',
            title: 'Le dragon amical',
            description: 'Rencontrez un dragon qui n\'est pas comme les autres',
            content: '{heroName} était en train de se promener dans la montagne quand soudain, un énorme dragon apparut devant lui. Mais contrairement à ce que {heroName} pensait, ce dragon était très gentil...',
            order: 3
          }
        ]);
        return;
      }
      
      // Récupérer les templates de Firestore
      db.collection(COLLECTIONS.TEMPLATES)
        .orderBy('order', 'asc')
        .get()
        .then(snapshot => {
          resolve(_convertSnapshot(snapshot));
        })
        .catch(error => {
          console.error("Erreur lors de la récupération des templates:", error);
          // En cas d'erreur, retourner des templates par défaut
          resolve([
            {
              id: 'template-1',
              title: 'Aventure dans la forêt enchantée',
              description: 'Une aventure magique dans une forêt pleine de mystères',
              content: 'Il était une fois, dans un royaume lointain, un jeune héros nommé {heroName}. Un jour, {heroName} décida d\'explorer la forêt enchantée...',
              order: 1
            },
            {
              id: 'template-2',
              title: 'Le trésor caché',
              description: 'Partez à la recherche d\'un trésor légendaire',
              content: 'Dans un village paisible vivait {heroName}, connu pour sa curiosité et son courage. Un jour, {heroName} découvrit une vieille carte au trésor...',
              order: 2
            },
            {
              id: 'template-3',
              title: 'Le dragon amical',
              description: 'Rencontrez un dragon qui n\'est pas comme les autres',
              content: '{heroName} était en train de se promener dans la montagne quand soudain, un énorme dragon apparut devant lui. Mais contrairement à ce que {heroName} pensait, ce dragon était très gentil...',
              order: 3
            }
          ]);
        });
    });
  }
  
  /**
   * Génère une histoire
   * @param {Object} data - Données pour la génération
   * @returns {Promise} Promesse résolue avec l'histoire générée
   */
  function generateStory(data) {
    return new Promise((resolve, reject) => {
      try {
        _checkAuth();
        
        // Récupérer le template
        db.collection(COLLECTIONS.TEMPLATES)
          .doc(data.templateId)
          .get()
          .then(doc => {
            const template = _convertDoc(doc);
            
            if (!template) {
              reject(new Error("Template non trouvé"));
              return;
            }
            
            // Générer l'histoire
            const story = {
              id: _generateId(),
              title: `Histoire de ${data.formData.heroName || 'héros inconnu'}`,
              content: _generateStoryContent(template, data.formData),
              templateId: template.id,
              profileId: data.profileId,
              userId: currentUser.uid,
              formData: data.formData,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
            
            resolve(story);
          })
          .catch(reject);
      } catch (error) {
        reject(error);
      }
    });
  }
  
  /**
   * Sauvegarde une histoire
   * @param {Object} storyData - Données de l'histoire
   * @returns {Promise} Promesse résolue avec l'ID de l'histoire
   */
  function saveStory(storyData) {
    return new Promise((resolve, reject) => {
      try {
        _checkAuth();
        
        // Générer un ID pour l'histoire si nécessaire
        const storyId = storyData.id || _generateId();
        
        // Préparer les données de l'histoire
        const story = {
          ...storyData,
          id: storyId,
          userId: currentUser.uid,
          updatedAt: new Date().toISOString()
        };
        
        // Sauvegarder l'histoire dans Firestore
        db.collection(COLLECTIONS.STORIES)
          .doc(storyId)
          .set(story)
          .then(() => {
            resolve(storyId);
          })
          .catch(reject);
      } catch (error) {
        reject(error);
      }
    });
  }
  
  /**
   * Met à jour le titre d'une histoire
   * @param {string} storyId - ID de l'histoire
   * @param {string} title - Nouveau titre
   * @returns {Promise} Promesse résolue lorsque le titre est mis à jour
   */
  function updateStoryTitle(storyId, title) {
    return new Promise((resolve, reject) => {
      try {
        _checkAuth();
        
        // Mettre à jour le titre dans Firestore
        db.collection(COLLECTIONS.STORIES)
          .doc(storyId)
          .update({
            title: title,
            updatedAt: new Date().toISOString()
          })
          .then(resolve)
          .catch(reject);
      } catch (error) {
        reject(error);
      }
    });
  }
  
  /**
   * Supprime une histoire
   * @param {string} storyId - ID de l'histoire
   * @returns {Promise} Promesse résolue lorsque l'histoire est supprimée
   */
  function deleteStory(storyId) {
    return new Promise((resolve, reject) => {
      try {
        _checkAuth();
        
        // Supprimer l'histoire de Firestore
        db.collection(COLLECTIONS.STORIES)
          .doc(storyId)
          .delete()
          .then(resolve)
          .catch(reject);
      } catch (error) {
        reject(error);
      }
    });
  }
  
  /**
   * Récupère une histoire
   * @param {string} storyId - ID de l'histoire
   * @returns {Promise} Promesse résolue avec l'histoire
   */
  function getStory(storyId) {
    return new Promise((resolve, reject) => {
      try {
        _checkAuth();
        
        // Récupérer l'histoire de Firestore
        db.collection(COLLECTIONS.STORIES)
          .doc(storyId)
          .get()
          .then(doc => {
            resolve(_convertDoc(doc));
          })
          .catch(reject);
      } catch (error) {
        reject(error);
      }
    });
  }
  
  /**
   * Récupère toutes les histoires d'un profil
   * @param {string} profileId - ID du profil
   * @returns {Promise} Promesse résolue avec la liste des histoires
   */
  function getStories(profileId) {
    return new Promise((resolve, reject) => {
      try {
        _checkAuth();
        
        // Récupérer les histoires de Firestore
        db.collection(COLLECTIONS.STORIES)
          .where('userId', '==', currentUser.uid)
          .where('profileId', '==', profileId)
          .orderBy('createdAt', 'desc')
          .get()
          .then(snapshot => {
            resolve(_convertSnapshot(snapshot));
          })
          .catch(reject);
      } catch (error) {
        reject(error);
      }
    });
  }
  
  /**
   * Télécharge une image pour une histoire
   * @param {string} storyId - ID de l'histoire
   * @param {File} file - Fichier image
   * @returns {Promise} Promesse résolue avec l'URL de l'image
   */
  function uploadStoryImage(storyId, file) {
    return new Promise((resolve, reject) => {
      try {
        _checkAuth();
        
        // Vérifier le type de fichier
        if (!file.type.startsWith('image/')) {
          reject(new Error("Le fichier doit être une image"));
          return;
        }
        
        // Créer une référence au fichier dans Storage
        const storageRef = storage.ref();
        const fileRef = storageRef.child(`${STORAGE_FOLDERS.STORY_IMAGES}/${currentUser.uid}/${storyId}`);
        
        // Télécharger le fichier
        fileRef.put(file)
          .then(snapshot => {
            // Récupérer l'URL du fichier
            return snapshot.ref.getDownloadURL();
          })
          .then(url => {
            // Mettre à jour l'histoire avec l'URL de l'image
            return db.collection(COLLECTIONS.STORIES)
              .doc(storyId)
              .update({
                imageUrl: url,
                updatedAt: new Date().toISOString()
              })
              .then(() => url);
          })
          .then(resolve)
          .catch(reject);
      } catch (error) {
        reject(error);
      }
    });
  }
  
  // ===== PARTAGE =====
  
  /**
   * Crée un lien de partage pour une histoire
   * @param {string} storyId - ID de l'histoire
   * @param {Object} options - Options de partage
   * @returns {Promise} Promesse résolue avec le lien de partage
   */
  function createShareLink(storyId, options = {}) {
    return new Promise((resolve, reject) => {
      try {
        _checkAuth();
        
        // Récupérer l'histoire
        getStory(storyId)
          .then(story => {
            if (!story) {
              reject(new Error("Histoire non trouvée"));
              return;
            }
            
            // Générer un ID pour le partage
            const shareId = _generateId();
            
            // Calculer la date d'expiration
            const expirationDays = options.expirationDays || 7;
            const expirationDate = new Date();
            expirationDate.setDate(expirationDate.getDate() + expirationDays);
            
            // Préparer les données de partage
            const shareData = {
              id: shareId,
              storyId: storyId,
              userId: currentUser.uid,
              createdAt: new Date().toISOString(),
              expiresAt: expirationDate.toISOString(),
              accessCount: 0,
              lastAccessedAt: null,
              password: options.password || null,
              allowComments: options.allowComments || false,
              allowDownload: options.allowDownload || true
            };
            
            // Sauvegarder les données de partage dans Firestore
            return db.collection(COLLECTIONS.SHARES)
              .doc(shareId)
              .set(shareData)
              .then(() => {
                // Générer le lien de partage
                const shareLink = `${window.location.origin}/share/${shareId}`;
                
                // Retourner le lien et les données de partage
                resolve({
                  link: shareLink,
                  data: shareData
                });
              });
          })
          .catch(reject);
      } catch (error) {
        reject(error);
      }
    });
  }
  
  /**
   * Supprime un lien de partage
   * @param {string} shareId - ID du partage
   * @returns {Promise} Promesse résolue lorsque le partage est supprimé
   */
  function deleteShareLink(shareId) {
    return new Promise((resolve, reject) => {
      try {
        _checkAuth();
        
        // Supprimer le partage de Firestore
        db.collection(COLLECTIONS.SHARES)
          .doc(shareId)
          .delete()
          .then(resolve)
          .catch(reject);
      } catch (error) {
        reject(error);
      }
    });
  }
  
  /**
   * Récupère les liens de partage d'une histoire
   * @param {string} storyId - ID de l'histoire
   * @returns {Promise} Promesse résolue avec la liste des liens de partage
   */
  function getShareLinks(storyId) {
    return new Promise((resolve, reject) => {
      try {
        _checkAuth();
        
        // Récupérer les partages de Firestore
        db.collection(COLLECTIONS.SHARES)
          .where('storyId', '==', storyId)
          .where('userId', '==', currentUser.uid)
          .orderBy('createdAt', 'desc')
          .get()
          .then(snapshot => {
            const shares = _convertSnapshot(snapshot);
            
            // Ajouter le lien à chaque partage
            shares.forEach(share => {
              share.link = `${window.location.origin}/share/${share.id}`;
            });
            
            resolve(shares);
          })
          .catch(reject);
      } catch (error) {
        reject(error);
      }
    });
  }
  
  /**
   * Accède à une histoire partagée
   * @param {string} shareId - ID du partage
   * @param {string} password - Mot de passe (optionnel)
   * @returns {Promise} Promesse résolue avec l'histoire partagée
   */
  function accessSharedStory(shareId, password = null) {
    return new Promise((resolve, reject) => {
      // Vérifier si Firestore est initialisé
      if (!db) {
        console.error("Firestore n'est pas initialisé, impossible d'accéder à l'histoire partagée");
        reject(new Error("Service de stockage non disponible. Veuillez réessayer plus tard."));
        return;
      }
      
      // Récupérer le partage de Firestore
      db.collection(COLLECTIONS.SHARES)
        .doc(shareId)
        .get()
        .then(doc => {
          const share = _convertDoc(doc);
          
          if (!share) {
            reject(new Error("Partage non trouvé"));
            return;
          }
          
          // Vérifier si le partage a expiré
          const expiresAt = new Date(share.expiresAt);
          if (expiresAt < new Date()) {
            reject(new Error("Ce lien de partage a expiré"));
            return;
          }
          
          // Vérifier le mot de passe si nécessaire
          if (share.password && share.password !== password) {
            reject(new Error("Mot de passe incorrect"));
            return;
          }
          
          // Mettre à jour les statistiques d'accès
          db.collection(COLLECTIONS.SHARES)
            .doc(shareId)
            .update({
              accessCount: firebase.firestore.FieldValue.increment(1),
              lastAccessedAt: new Date().toISOString()
            })
            .catch(error => {
              console.error("Erreur lors de la mise à jour des statistiques d'accès:", error);
            });
          
          // Récupérer l'histoire
          return db.collection(COLLECTIONS.STORIES)
            .doc(share.storyId)
            .get()
            .then(storyDoc => {
              const story = _convertDoc(storyDoc);
              
              if (!story) {
                reject(new Error("Histoire non trouvée"));
                return;
              }
              
              // Retourner l'histoire et les données de partage
              resolve({
                story: story,
                share: share
              });
            });
        })
        .catch(reject);
    });
  }
  
  // API publique
  MonHistoire.modules.core.storage = {
    init: init,
    
    // Profils
    createProfile: createProfile,
    updateProfile: updateProfile,
    deleteProfile: deleteProfile,
    getProfile: getProfile,
    getProfiles: getProfiles,
    uploadProfileImage: uploadProfileImage,
    
    // Histoires
    getStoryTemplates: getStoryTemplates,
    generateStory: generateStory,
    saveStory: saveStory,
    updateStoryTitle: updateStoryTitle,
    deleteStory: deleteStory,
    getStory: getStory,
    getStories: getStories,
    uploadStoryImage: uploadStoryImage,
    
    // Partage
    createShareLink: createShareLink,
    deleteShareLink: deleteShareLink,
    getShareLinks: getShareLinks,
    accessSharedStory: accessSharedStory
  };
})();
