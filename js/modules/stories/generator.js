// js/modules/stories/generator.js
// Module de génération d'histoires
// Responsable de la création d'histoires à partir des entrées utilisateur

// S'assurer que les namespaces existent
window.MonHistoire = window.MonHistoire || {};
MonHistoire.modules = MonHistoire.modules || {};
MonHistoire.modules.stories = MonHistoire.modules.stories || {};

// Module de génération d'histoires
(function() {
  // Variables privées
  let currentProfile = null;
  let currentTemplate = null;
  let templates = [];
  let formData = {};
  let generatedStory = null;
  let isInitialized = false;
  let isGenerating = false;
  
  /**
   * Initialise le module de génération d'histoires
   */
  function init() {
    if (isInitialized) {
      console.warn("Module Generator déjà initialisé");
      return;
    }
    
    // Charger les templates d'histoires
    loadTemplates();
    
    // Écouter les changements de profil
    if (MonHistoire.events) {
      MonHistoire.events.on('profileSelected', handleProfileChange);
    }
    
    // Configurer les écouteurs d'événements pour le formulaire
    setupFormListeners();
    
    isInitialized = true;
    console.log("Module Generator initialisé");
  }
  
  /**
   * Charge les templates d'histoires
   */
  function loadTemplates() {
    // Afficher le chargement
    if (MonHistoire.modules.app && MonHistoire.modules.app.showLoading) {
      MonHistoire.modules.app.showLoading(true, "Chargement des templates d'histoires...");
    }
    
    // Utiliser le module de stockage pour récupérer les templates
    if (MonHistoire.modules.core && MonHistoire.modules.core.storage) {
      MonHistoire.modules.core.storage.getStoryTemplates()
        .then(loadedTemplates => {
          templates = loadedTemplates;
          
          // Mettre à jour l'interface utilisateur
          updateTemplateUI();
          
          // Masquer le chargement
          if (MonHistoire.modules.app && MonHistoire.modules.app.showLoading) {
            MonHistoire.modules.app.showLoading(false);
          }
          
          console.log(`${templates.length} templates chargés`);
        })
        .catch(error => {
          console.error("Erreur lors du chargement des templates:", error);
          
          // Masquer le chargement
          if (MonHistoire.modules.app && MonHistoire.modules.app.showLoading) {
            MonHistoire.modules.app.showLoading(false);
          }
          
          // Afficher un message d'erreur
          if (MonHistoire.showMessageModal) {
            MonHistoire.showMessageModal("Erreur lors du chargement des templates d'histoires. Veuillez réessayer.");
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
   * Gère les changements de profil
   * @param {Object} profile - Profil sélectionné
   */
  function handleProfileChange(profile) {
    currentProfile = profile;
    
    // Mettre à jour l'interface utilisateur
    updateFormUI();
  }
  
  /**
   * Configure les écouteurs d'événements pour le formulaire
   */
  function setupFormListeners() {
    // Bouton de sélection de template
    const templateButtons = document.querySelectorAll('.template-item');
    templateButtons.forEach(button => {
      button.addEventListener('click', handleTemplateSelection);
    });
    
    // Bouton de génération d'histoire
    const generateButton = document.getElementById('generate-story-button');
    if (generateButton) {
      generateButton.addEventListener('click', handleGenerateStory);
    }
    
    // Bouton de sauvegarde d'histoire
    const saveStoryButton = document.getElementById('save-story-button');
    if (saveStoryButton) {
      saveStoryButton.addEventListener('click', handleSaveStory);
    }
    
    // Bouton de retour au formulaire
    const backToFormButton = document.getElementById('back-to-form-button');
    if (backToFormButton) {
      backToFormButton.addEventListener('click', handleBackToForm);
    }
    
    // Champs du formulaire
    const formInputs = document.querySelectorAll('#story-form input, #story-form select, #story-form textarea');
    formInputs.forEach(input => {
      input.addEventListener('change', handleFormInputChange);
    });
    
    console.log("Écouteurs de formulaire configurés");
  }
  
  /**
   * Met à jour l'interface utilisateur des templates
   */
  function updateTemplateUI() {
    const templateContainer = document.getElementById('templates-container');
    if (!templateContainer) {
      return;
    }
    
    // Vider le conteneur
    templateContainer.innerHTML = '';
    
    // Ajouter chaque template
    templates.forEach(template => {
      const templateItem = document.createElement('div');
      templateItem.className = 'template-item';
      if (currentTemplate && template.id === currentTemplate.id) {
        templateItem.classList.add('active');
      }
      
      // Ajouter l'image
      const image = document.createElement('div');
      image.className = 'template-image';
      if (template.imageUrl) {
        image.style.backgroundImage = `url(${template.imageUrl})`;
      }
      
      // Ajouter le titre
      const title = document.createElement('div');
      title.className = 'template-title';
      title.textContent = template.title || 'Sans titre';
      
      // Ajouter la description
      const description = document.createElement('div');
      description.className = 'template-description';
      description.textContent = template.description || '';
      
      // Ajouter les éléments au template
      templateItem.appendChild(image);
      templateItem.appendChild(title);
      templateItem.appendChild(description);
      
      // Ajouter un écouteur d'événement pour sélectionner le template
      templateItem.addEventListener('click', () => {
        selectTemplate(template);
      });
      
      // Ajouter le template au conteneur
      templateContainer.appendChild(templateItem);
    });
  }
  
  /**
   * Met à jour l'interface utilisateur du formulaire
   */
  function updateFormUI() {
    // Mettre à jour le titre du formulaire
    const formTitle = document.getElementById('form-title');
    if (formTitle && currentTemplate) {
      formTitle.textContent = `Créer une histoire : ${currentTemplate.title}`;
    }
    
    // Mettre à jour les champs du formulaire
    if (currentTemplate && currentTemplate.fields) {
      const formContainer = document.getElementById('form-fields-container');
      if (formContainer) {
        // Vider le conteneur
        formContainer.innerHTML = '';
        
        // Ajouter chaque champ
        currentTemplate.fields.forEach(field => {
          const fieldContainer = document.createElement('div');
          fieldContainer.className = 'form-field';
          
          // Ajouter le label
          const label = document.createElement('label');
          label.setAttribute('for', field.id);
          label.textContent = field.label;
          
          // Ajouter le champ
          let input;
          
          switch (field.type) {
            case 'text':
              input = document.createElement('input');
              input.type = 'text';
              input.id = field.id;
              input.name = field.id;
              if (field.placeholder) {
                input.placeholder = field.placeholder;
              }
              if (field.defaultValue) {
                input.value = field.defaultValue;
              }
              // Si le champ est lié au profil, pré-remplir avec les informations du profil
              if (field.profileField && currentProfile) {
                input.value = currentProfile[field.profileField] || '';
              }
              break;
              
            case 'textarea':
              input = document.createElement('textarea');
              input.id = field.id;
              input.name = field.id;
              if (field.placeholder) {
                input.placeholder = field.placeholder;
              }
              if (field.defaultValue) {
                input.value = field.defaultValue;
              }
              break;
              
            case 'select':
              input = document.createElement('select');
              input.id = field.id;
              input.name = field.id;
              
              // Ajouter les options
              if (field.options) {
                field.options.forEach(option => {
                  const optionElement = document.createElement('option');
                  optionElement.value = option.value;
                  optionElement.textContent = option.label;
                  input.appendChild(optionElement);
                });
              }
              
              // Si le champ est lié au profil, pré-sélectionner l'option correspondante
              if (field.profileField && currentProfile) {
                const profileValue = currentProfile[field.profileField];
                if (profileValue) {
                  input.value = profileValue;
                }
              }
              break;
              
            case 'radio':
              input = document.createElement('div');
              input.className = 'radio-group';
              
              // Ajouter les options
              if (field.options) {
                field.options.forEach(option => {
                  const radioContainer = document.createElement('div');
                  radioContainer.className = 'radio-option';
                  
                  const radioInput = document.createElement('input');
                  radioInput.type = 'radio';
                  radioInput.id = `${field.id}-${option.value}`;
                  radioInput.name = field.id;
                  radioInput.value = option.value;
                  
                  const radioLabel = document.createElement('label');
                  radioLabel.setAttribute('for', `${field.id}-${option.value}`);
                  radioLabel.textContent = option.label;
                  
                  // Si le champ est lié au profil, pré-sélectionner l'option correspondante
                  if (field.profileField && currentProfile) {
                    const profileValue = currentProfile[field.profileField];
                    if (profileValue === option.value) {
                      radioInput.checked = true;
                    }
                  } else if (option.default) {
                    radioInput.checked = true;
                  }
                  
                  radioContainer.appendChild(radioInput);
                  radioContainer.appendChild(radioLabel);
                  input.appendChild(radioContainer);
                });
              }
              break;
              
            default:
              input = document.createElement('input');
              input.type = 'text';
              input.id = field.id;
              input.name = field.id;
              break;
          }
          
          // Ajouter un écouteur d'événement pour les changements
          input.addEventListener('change', () => {
            handleFormInputChange({ target: input });
          });
          
          // Ajouter les éléments au conteneur
          fieldContainer.appendChild(label);
          fieldContainer.appendChild(input);
          
          // Ajouter le conteneur au formulaire
          formContainer.appendChild(fieldContainer);
        });
        
        // Ajouter le bouton de génération
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'form-buttons';
        
        const generateButton = document.createElement('button');
        generateButton.id = 'generate-story-button';
        generateButton.className = 'primary-button';
        generateButton.textContent = 'Générer l\'histoire';
        generateButton.addEventListener('click', handleGenerateStory);
        
        buttonContainer.appendChild(generateButton);
        formContainer.appendChild(buttonContainer);
      }
    }
    
    // Mettre à jour la visibilité des sections
    const templateSection = document.getElementById('template-selection-section');
    const formSection = document.getElementById('story-form-section');
    const resultSection = document.getElementById('story-result-section');
    
    if (templateSection && formSection && resultSection) {
      if (!currentTemplate) {
        // Afficher la sélection de template
        templateSection.classList.remove('hidden');
        formSection.classList.add('hidden');
        resultSection.classList.add('hidden');
      } else if (!generatedStory) {
        // Afficher le formulaire
        templateSection.classList.add('hidden');
        formSection.classList.remove('hidden');
        resultSection.classList.add('hidden');
      } else {
        // Afficher le résultat
        templateSection.classList.add('hidden');
        formSection.classList.add('hidden');
        resultSection.classList.remove('hidden');
      }
    }
  }
  
  /**
   * Sélectionne un template
   * @param {Object} template - Template à sélectionner
   */
  function selectTemplate(template) {
    currentTemplate = template;
    
    // Réinitialiser les données du formulaire
    formData = {};
    
    // Mettre à jour l'interface utilisateur
    updateFormUI();
    
    console.log(`Template sélectionné: ${template.title}`);
  }
  
  /**
   * Gère la sélection d'un template
   * @param {Event} event - Événement de clic
   */
  function handleTemplateSelection(event) {
    const templateId = event.currentTarget.dataset.templateId;
    const template = templates.find(t => t.id === templateId);
    
    if (template) {
      selectTemplate(template);
    }
  }
  
  /**
   * Gère les changements dans les champs du formulaire
   * @param {Event} event - Événement de changement
   */
  function handleFormInputChange(event) {
    const input = event.target;
    const fieldId = input.name;
    let value;
    
    // Récupérer la valeur en fonction du type de champ
    if (input.type === 'radio') {
      const checkedInput = document.querySelector(`input[name="${fieldId}"]:checked`);
      value = checkedInput ? checkedInput.value : null;
    } else {
      value = input.value;
    }
    
    // Mettre à jour les données du formulaire
    formData[fieldId] = value;
  }
  
  /**
   * Gère la génération d'une histoire
   */
  function handleGenerateStory() {
    if (!currentTemplate || !currentProfile) {
      if (MonHistoire.showMessageModal) {
        MonHistoire.showMessageModal("Veuillez sélectionner un template et un profil.");
      }
      return;
    }
    
    // Valider les champs obligatoires
    const requiredFields = currentTemplate.fields.filter(field => field.required);
    for (const field of requiredFields) {
      if (!formData[field.id]) {
        if (MonHistoire.showMessageModal) {
          MonHistoire.showMessageModal(`Le champ "${field.label}" est obligatoire.`);
        }
        return;
      }
    }

    // Indiquer la provenance du résultat
    MonHistoire.state = MonHistoire.state || {};
    MonHistoire.state.resultatSource = 'formulaire';

    // Éviter les générations multiples
    if (isGenerating) {
      return;
    }
    
    isGenerating = true;
    
    // Afficher le chargement
    if (MonHistoire.modules.app && MonHistoire.modules.app.showLoading) {
      MonHistoire.modules.app.showLoading(true, "Génération de l'histoire...");
    }
    
    // Préparer les données pour la génération
    const generationData = {
      templateId: currentTemplate.id,
      profileId: currentProfile.id,
      formData: formData
    };
    
    // Générer l'histoire
    generateStory(generationData)
      .then(story => {
        generatedStory = story;
        
        // Mettre à jour l'interface utilisateur
        updateResultUI();
        
        // Masquer le chargement
        if (MonHistoire.modules.app && MonHistoire.modules.app.showLoading) {
          MonHistoire.modules.app.showLoading(false);
        }
        
        // Émettre un événement pour informer les autres modules
        if (MonHistoire.events) {
          MonHistoire.events.emit('storyGenerated', story);
        }

        // Vérifier si l'utilisateur approche de son quota d'histoires
        if (firebase.auth && firebase.auth().currentUser &&
            MonHistoire.modules.core &&
            MonHistoire.modules.core.storage &&
            typeof MonHistoire.modules.core.storage.verifierSeuilAlerteHistoires === 'function') {
          MonHistoire.modules.core.storage.verifierSeuilAlerteHistoires()
            .then(seuilAtteint => {
              if (seuilAtteint) {
                setTimeout(() => {
                  MonHistoire.showMessageModal(`Attention : tu approches de la limite de ${MonHistoire.config.MAX_HISTOIRES} histoires sauvegardées.`);
                }, 1000);
              }
            });
        }

        isGenerating = false;
        console.log("Histoire générée");
      })
      .catch(error => {
        console.error("Erreur lors de la génération de l'histoire:", error);
        
        // Masquer le chargement
        if (MonHistoire.modules.app && MonHistoire.modules.app.showLoading) {
          MonHistoire.modules.app.showLoading(false);
        }
        
        // Afficher un message d'erreur
        if (MonHistoire.showMessageModal) {
          MonHistoire.showMessageModal("Erreur lors de la génération de l'histoire. Veuillez réessayer.");
        }
        
        isGenerating = false;
      });
  }
  
  /**
   * Met à jour l'interface utilisateur du résultat
   */
  function updateResultUI() {
    if (!generatedStory) {
      return;
    }
    
    // Mettre à jour le titre
    const storyTitle = document.getElementById('story-title');
    if (storyTitle) {
      storyTitle.textContent = generatedStory.title || 'Histoire sans titre';
    }
    
    // Mettre à jour le contenu
    const storyContent = document.getElementById('story-content');
    if (storyContent) {
      storyContent.innerHTML = formatStoryContent(generatedStory.content);
    }
    
    // Mettre à jour l'image
    const storyImage = document.getElementById('story-image');
    if (storyImage && generatedStory.imageUrl) {
      storyImage.style.backgroundImage = `url(${generatedStory.imageUrl})`;
      storyImage.classList.remove('hidden');
    } else if (storyImage) {
      storyImage.classList.add('hidden');
    }
    
    // Mettre à jour la visibilité des sections
    updateFormUI();
  }
  
  /**
   * Formate le contenu de l'histoire pour l'affichage
   * @param {string} content - Contenu brut de l'histoire
   * @returns {string} Contenu formaté
   */
  function formatStoryContent(content) {
    if (!content) {
      return '';
    }
    
    // Remplacer les sauts de ligne par des paragraphes
    let formatted = content.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>');
    
    // Entourer le contenu avec des balises de paragraphe
    formatted = `<p>${formatted}</p>`;
    
    return formatted;
  }
  
  /**
   * Gère la sauvegarde d'une histoire
   */
  function handleSaveStory() {
    if (!generatedStory) {
      return;
    }
    
    // Afficher le chargement
    if (MonHistoire.modules.app && MonHistoire.modules.app.showLoading) {
      MonHistoire.modules.app.showLoading(true, "Sauvegarde de l'histoire...");
    }
    
    // Utiliser le module de gestion des histoires pour sauvegarder l'histoire
    if (MonHistoire.modules.stories && MonHistoire.modules.stories.management) {
      MonHistoire.modules.stories.management.saveStory(generatedStory)
        .then(() => {
          // Masquer le chargement
          if (MonHistoire.modules.app && MonHistoire.modules.app.showLoading) {
            MonHistoire.modules.app.showLoading(false);
          }
          
          // Afficher un message de succès
          if (MonHistoire.showMessageModal) {
            MonHistoire.showMessageModal("Histoire sauvegardée avec succès.");
          }
          
          console.log("Histoire sauvegardée");
        })
        .catch(error => {
          console.error("Erreur lors de la sauvegarde de l'histoire:", error);
          
          // Masquer le chargement
          if (MonHistoire.modules.app && MonHistoire.modules.app.showLoading) {
            MonHistoire.modules.app.showLoading(false);
          }
          
          // Afficher un message d'erreur
          if (MonHistoire.showMessageModal) {
            MonHistoire.showMessageModal("Erreur lors de la sauvegarde de l'histoire. Veuillez réessayer.");
          }
        });
    } else {
      console.error("Module de gestion des histoires non disponible");
      
      // Masquer le chargement
      if (MonHistoire.modules.app && MonHistoire.modules.app.showLoading) {
        MonHistoire.modules.app.showLoading(false);
      }
    }
  }
  
  /**
   * Gère le retour au formulaire
   */
  function handleBackToForm() {
    generatedStory = null;
    
    // Mettre à jour l'interface utilisateur
    updateFormUI();
  }
  
  /**
   * Génère une histoire à partir des données fournies
   * @param {Object} data - Données pour la génération
   * @returns {Promise} Promesse résolue avec l'histoire générée
   */
  function generateStory(data) {
    return new Promise((resolve, reject) => {
      // Utiliser le module de stockage pour générer l'histoire
      if (MonHistoire.modules.core && MonHistoire.modules.core.storage) {
        MonHistoire.modules.core.storage.generateStory(data)
          .then(resolve)
          .catch(reject);
      } else {
        // Simulation de génération (à remplacer par l'appel à l'API)
        setTimeout(() => {
          const template = templates.find(t => t.id === data.templateId);
          
          if (!template) {
            reject(new Error("Template non trouvé"));
            return;
          }
          
          // Créer une histoire de test
          const story = {
            id: `story-${Date.now()}`,
            title: `Histoire de ${data.formData.heroName || currentProfile.prenom}`,
            content: generateStoryContent(template, data.formData),
            templateId: template.id,
            profileId: currentProfile.id,
            createdAt: new Date().toISOString(),
            formData: data.formData
          };
          
          resolve(story);
        }, 1500);
      }
    });
  }
  
  /**
   * Génère le contenu d'une histoire à partir d'un template et des données du formulaire
   * @param {Object} template - Template de l'histoire
   * @param {Object} formData - Données du formulaire
   * @returns {string} Contenu de l'histoire
   */
  function generateStoryContent(template, formData) {
    if (!template || !template.content) {
      return "Il était une fois...";
    }
    
    // Remplacer les variables dans le contenu
    let content = template.content;
    
    // Remplacer les variables du formulaire
    for (const [key, value] of Object.entries(formData)) {
      content = content.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
    }
    
    // Remplacer les variables du profil
    if (currentProfile) {
      for (const [key, value] of Object.entries(currentProfile)) {
        if (typeof value === 'string') {
          content = content.replace(new RegExp(`\\{profile\\.${key}\\}`, 'g'), value);
        }
      }
    }
    
    return content;
  }
  
  /**
   * Obtient tous les templates d'histoires
   * @returns {Array} Liste des templates
   */
  function getTemplates() {
    return [...templates];
  }
  
  /**
   * Obtient le template actuel
   * @returns {Object} Template actuel ou null si aucun template n'est sélectionné
   */
  function getCurrentTemplate() {
    return currentTemplate;
  }
  
  /**
   * Obtient l'histoire générée
   * @returns {Object} Histoire générée ou null si aucune histoire n'est générée
   */
  function getGeneratedStory() {
    return generatedStory;
  }
  
  // API publique
  MonHistoire.modules.stories.generator = {
    init: init,
    getTemplates: getTemplates,
    getCurrentTemplate: getCurrentTemplate,
    getGeneratedStory: getGeneratedStory,
    generateStory: generateStory,
    selectTemplate: selectTemplate,
    
    // Alias pour la compatibilité avec l'ancien code
    genererHistoire: function() {
      console.log("[Compatibility] Appel à genererHistoire");
      
      // Récupère les valeurs du formulaire
      const heroPrenom = document.getElementById("hero-prenom").value;
      const personnage = document.getElementById("personnage").value;
      const lieu = document.getElementById("lieu").value;
      const objet = document.getElementById("objet").value;
      const compagnon = document.getElementById("compagnon").value;
      const objectif = document.getElementById("objectif").value;
      
      // Vérifie que les champs sont remplis
      if (!heroPrenom || !personnage || !lieu) {
        MonHistoire.showMessageModal("Merci de remplir tous les champs obligatoires.");
        return;
      }
      
      // Récupère les éléments pour afficher le résultat
      const titreHistoireElement = document.getElementById("titre-histoire-resultat");
      const histoireElement = document.getElementById("histoire");
      
      // Vérifie si les éléments essentiels existent
      if (!histoireElement) {
        console.error("[DEBUG] Élément HTML essentiel #histoire manquant pour l'affichage de l'histoire");
        return;
      }
      
      // Affiche le titre dans l'élément approprié s'il existe
      if (titreHistoireElement) {
        titreHistoireElement.textContent = "Génération en cours...";
      }
      
      // Afficher le message de chargement dans le conteneur principal
      histoireElement.innerHTML = "<p>Merci de patienter pendant que l'histoire se crée...</p>";
      
      // Affiche l'écran de résultat
      if (MonHistoire.modules.core && MonHistoire.modules.core.navigation) {
        MonHistoire.modules.core.navigation.showScreen("resultat");
      } else if (MonHistoire.core && MonHistoire.core.navigation) {
        MonHistoire.core.navigation.showScreen("resultat");
      }
      
      // Prépare les données pour l'API
      const data = {
        personnage: personnage,
        lieu: lieu,
        objet: objet,
        compagnon: compagnon,
        objectif: objectif,
        heroPrenom: heroPrenom
      };
      
      // Appelle l'API pour générer l'histoire via l'ancien module
      if (MonHistoire.features && MonHistoire.features.stories && MonHistoire.features.stories.generator) {
        MonHistoire.features.stories.generator.appellerAPIHistoire(data)
          .then(histoire => {
            console.log("Histoire générée avec succès via l'ancien module");
          })
          .catch(error => {
            console.error("Erreur lors de la génération de l'histoire:", error);
            if (titreHistoireElement) {
              titreHistoireElement.textContent = "Erreur";
            }
            histoireElement.innerHTML = "<p>Désolé, une erreur est survenue lors de la génération de l'histoire. Merci de réessayer.</p>";
          });
      } else {
        console.error("Module de génération d'histoires (ancien namespace) non disponible");
        histoireElement.innerHTML = "<p>Désolé, une erreur est survenue lors de la génération de l'histoire. Merci de réessayer.</p>";
      }
    }
  };
})();
