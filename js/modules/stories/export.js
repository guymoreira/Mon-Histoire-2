// js/modules/stories/export.js
// Module d'export des histoires
// Responsable de l'export des histoires dans différents formats

// S'assurer que les namespaces existent
window.MonHistoire = window.MonHistoire || {};
MonHistoire.modules = MonHistoire.modules || {};
MonHistoire.modules.stories = MonHistoire.modules.stories || {};

// Module d'export des histoires
(function() {
  // Variables privées
  let isInitialized = false;
  
  // Constantes
  const EXPORT_FORMATS = {
    PDF: 'pdf',
    DOCX: 'docx',
    TXT: 'txt',
    HTML: 'html',
    IMAGE: 'image'
  };
  
  /**
   * Initialise le module d'export des histoires
   */
  function init() {
    if (isInitialized) {
      console.warn("Module Export déjà initialisé");
      return;
    }
    
    // Configurer les écouteurs d'événements
    setupListeners();
    
    isInitialized = true;
    console.log("Module Export initialisé");
  }
  
  /**
   * Configure les écouteurs d'événements
   */
  function setupListeners() {
    // Boutons d'export dans le modal
    document.addEventListener('click', function(event) {
      if (event.target.classList.contains('export-format-button')) {
        const format = event.target.dataset.format;
        const storyId = document.getElementById('export-modal')?.dataset.storyId;
        
        if (format && storyId) {
          handleExportFormat(storyId, format);
        }
      }
    });
    
    console.log("Écouteurs configurés");
  }
  
  /**
   * Exporte une histoire
   * @param {Object} story - Histoire à exporter
   */
  function exportStory(story) {
    if (!story) {
      return;
    }
    
    // Afficher le modal d'export
    const exportModal = document.getElementById('export-modal');
    if (exportModal) {
      // Stocker l'ID de l'histoire dans le modal
      exportModal.dataset.storyId = story.id;
      
      // Mettre à jour le titre
      const modalTitle = exportModal.querySelector('.modal-title');
      if (modalTitle) {
        modalTitle.textContent = `Exporter "${story.title || 'Histoire sans titre'}"`;
      }
      
      // Afficher le modal
      exportModal.classList.add('show');
    } else {
      // Si le modal n'existe pas, exporter directement au format PDF
      exportStoryToFormat(story, EXPORT_FORMATS.PDF);
    }
    
    // Émettre un événement pour informer les autres modules
    if (MonHistoire.events) {
      MonHistoire.events.emit('storyExportStarted', story);
    }
  }
  
  /**
   * Gère l'export dans un format spécifique
   * @param {string} storyId - ID de l'histoire à exporter
   * @param {string} format - Format d'export
   */
  function handleExportFormat(storyId, format) {
    // Masquer le modal d'export
    const exportModal = document.getElementById('export-modal');
    if (exportModal) {
      exportModal.classList.remove('show');
    }
    
    // Récupérer l'histoire
    if (MonHistoire.modules.stories && MonHistoire.modules.stories.management) {
      const story = MonHistoire.modules.stories.management.getStoryById(storyId);
      
      if (story) {
        // Exporter l'histoire dans le format demandé
        exportStoryToFormat(story, format);
      } else {
        console.error(`Histoire ${storyId} non trouvée`);
        
        // Afficher un message d'erreur
        if (MonHistoire.showMessageModal) {
          MonHistoire.showMessageModal("Histoire non trouvée. Veuillez réessayer.");
        }
      }
    } else {
      console.error("Module de gestion des histoires non disponible");
    }
  }
  
  /**
   * Exporte une histoire dans un format spécifique
   * @param {Object} story - Histoire à exporter
   * @param {string} format - Format d'export
   */
  function exportStoryToFormat(story, format) {
    // Afficher le chargement
    if (MonHistoire.modules.app && MonHistoire.modules.app.showLoading) {
      MonHistoire.modules.app.showLoading(true, `Export de l'histoire au format ${format.toUpperCase()}...`);
    }
    
    // Exporter l'histoire dans le format demandé
    switch (format) {
      case EXPORT_FORMATS.PDF:
        exportToPDF(story);
        break;
        
      case EXPORT_FORMATS.DOCX:
        exportToDOCX(story);
        break;
        
      case EXPORT_FORMATS.TXT:
        exportToTXT(story);
        break;
        
      case EXPORT_FORMATS.HTML:
        exportToHTML(story);
        break;
        
      case EXPORT_FORMATS.IMAGE:
        exportToImage(story);
        break;
        
      default:
        console.error(`Format d'export ${format} non supporté`);
        
        // Masquer le chargement
        if (MonHistoire.modules.app && MonHistoire.modules.app.showLoading) {
          MonHistoire.modules.app.showLoading(false);
        }
        
        // Afficher un message d'erreur
        if (MonHistoire.showMessageModal) {
          MonHistoire.showMessageModal(`Format d'export ${format} non supporté.`);
        }
        return;
    }
    
    // Émettre un événement pour informer les autres modules
    if (MonHistoire.events) {
      MonHistoire.events.emit('storyExported', { story, format });
    }
  }
  
  /**
   * Exporte une histoire au format PDF
   * @param {Object} story - Histoire à exporter
   */
  function exportToPDF(story) {
    // Utiliser une bibliothèque comme jsPDF pour générer le PDF
    if (window.jsPDF) {
      try {
        const doc = new window.jsPDF();
        
        // Ajouter le titre
        doc.setFontSize(18);
        doc.text(story.title || 'Histoire sans titre', 20, 20);
        
        // Ajouter la date
        if (story.createdAt) {
          const date = new Date(story.createdAt);
          doc.setFontSize(12);
          doc.text(`Créée le ${date.toLocaleDateString()}`, 20, 30);
        }
        
        // Ajouter le contenu
        doc.setFontSize(12);
        const content = story.content || '';
        const lines = doc.splitTextToSize(content, 170);
        doc.text(lines, 20, 40);
        
        // Générer le nom du fichier
        const fileName = `${story.title || 'histoire'}-${Date.now()}.pdf`;
        
        // Télécharger le PDF
        doc.save(fileName);
        
        // Masquer le chargement
        if (MonHistoire.modules.app && MonHistoire.modules.app.showLoading) {
          MonHistoire.modules.app.showLoading(false);
        }
        
        // Afficher un message de succès
        if (MonHistoire.showMessageModal) {
          MonHistoire.showMessageModal("Histoire exportée au format PDF avec succès.");
        }
        
        console.log(`Histoire exportée au format PDF: ${fileName}`);
      } catch (error) {
        console.error("Erreur lors de l'export au format PDF:", error);
        
        // Masquer le chargement
        if (MonHistoire.modules.app && MonHistoire.modules.app.showLoading) {
          MonHistoire.modules.app.showLoading(false);
        }
        
        // Afficher un message d'erreur
        if (MonHistoire.showMessageModal) {
          MonHistoire.showMessageModal("Erreur lors de l'export au format PDF. Veuillez réessayer.");
        }
      }
    } else {
      // Si jsPDF n'est pas disponible, utiliser l'export HTML
      console.warn("jsPDF non disponible, utilisation de l'export HTML");
      exportToHTML(story);
    }
  }
  
  /**
   * Exporte une histoire au format DOCX
   * @param {Object} story - Histoire à exporter
   */
  function exportToDOCX(story) {
    // Utiliser une bibliothèque comme docx pour générer le DOCX
    if (window.docx) {
      try {
        // Créer un nouveau document
        const doc = new window.docx.Document();
        
        // Ajouter le titre
        doc.addParagraph(new window.docx.Paragraph(story.title || 'Histoire sans titre').heading1());
        
        // Ajouter la date
        if (story.createdAt) {
          const date = new Date(story.createdAt);
          doc.addParagraph(new window.docx.Paragraph(`Créée le ${date.toLocaleDateString()}`).italic());
        }
        
        // Ajouter le contenu
        const content = story.content || '';
        const paragraphs = content.split('\n\n');
        
        paragraphs.forEach(paragraph => {
          doc.addParagraph(new window.docx.Paragraph(paragraph));
        });
        
        // Générer le nom du fichier
        const fileName = `${story.title || 'histoire'}-${Date.now()}.docx`;
        
        // Télécharger le DOCX
        window.docx.Packer.toBlob(doc).then(blob => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = fileName;
          a.click();
          window.URL.revokeObjectURL(url);
          
          // Masquer le chargement
          if (MonHistoire.modules.app && MonHistoire.modules.app.showLoading) {
            MonHistoire.modules.app.showLoading(false);
          }
          
          // Afficher un message de succès
          if (MonHistoire.showMessageModal) {
            MonHistoire.showMessageModal("Histoire exportée au format DOCX avec succès.");
          }
          
          console.log(`Histoire exportée au format DOCX: ${fileName}`);
        });
      } catch (error) {
        console.error("Erreur lors de l'export au format DOCX:", error);
        
        // Masquer le chargement
        if (MonHistoire.modules.app && MonHistoire.modules.app.showLoading) {
          MonHistoire.modules.app.showLoading(false);
        }
        
        // Afficher un message d'erreur
        if (MonHistoire.showMessageModal) {
          MonHistoire.showMessageModal("Erreur lors de l'export au format DOCX. Veuillez réessayer.");
        }
      }
    } else {
      // Si docx n'est pas disponible, utiliser l'export TXT
      console.warn("docx non disponible, utilisation de l'export TXT");
      exportToTXT(story);
    }
  }
  
  /**
   * Exporte une histoire au format TXT
   * @param {Object} story - Histoire à exporter
   */
  function exportToTXT(story) {
    try {
      // Créer le contenu du fichier texte
      let content = '';
      
      // Ajouter le titre
      content += `${story.title || 'Histoire sans titre'}\n\n`;
      
      // Ajouter la date
      if (story.createdAt) {
        const date = new Date(story.createdAt);
        content += `Créée le ${date.toLocaleDateString()}\n\n`;
      }
      
      // Ajouter le contenu
      content += story.content || '';
      
      // Générer le nom du fichier
      const fileName = `${story.title || 'histoire'}-${Date.now()}.txt`;
      
      // Créer un blob et le télécharger
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      window.URL.revokeObjectURL(url);
      
      // Masquer le chargement
      if (MonHistoire.modules.app && MonHistoire.modules.app.showLoading) {
        MonHistoire.modules.app.showLoading(false);
      }
      
      // Afficher un message de succès
      if (MonHistoire.showMessageModal) {
        MonHistoire.showMessageModal("Histoire exportée au format TXT avec succès.");
      }
      
      console.log(`Histoire exportée au format TXT: ${fileName}`);
    } catch (error) {
      console.error("Erreur lors de l'export au format TXT:", error);
      
      // Masquer le chargement
      if (MonHistoire.modules.app && MonHistoire.modules.app.showLoading) {
        MonHistoire.modules.app.showLoading(false);
      }
      
      // Afficher un message d'erreur
      if (MonHistoire.showMessageModal) {
        MonHistoire.showMessageModal("Erreur lors de l'export au format TXT. Veuillez réessayer.");
      }
    }
  }
  
  /**
   * Exporte une histoire au format HTML
   * @param {Object} story - Histoire à exporter
   */
  function exportToHTML(story) {
    try {
      // Créer le contenu HTML
      let content = `
        <!DOCTYPE html>
        <html lang="fr">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${story.title || 'Histoire sans titre'}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
            }
            h1 {
              color: #1161a5;
            }
            .date {
              color: #666;
              font-style: italic;
              margin-bottom: 20px;
            }
            .content {
              margin-top: 20px;
            }
            .footer {
              margin-top: 40px;
              border-top: 1px solid #ddd;
              padding-top: 10px;
              color: #666;
              font-size: 0.8em;
            }
          </style>
        </head>
        <body>
          <h1>${story.title || 'Histoire sans titre'}</h1>
      `;
      
      // Ajouter la date
      if (story.createdAt) {
        const date = new Date(story.createdAt);
        content += `<div class="date">Créée le ${date.toLocaleDateString()}</div>`;
      }
      
      // Ajouter le contenu
      content += `<div class="content">`;
      
      if (story.content) {
        // Formater le contenu
        const formattedContent = story.content.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>');
        content += `<p>${formattedContent}</p>`;
      }
      
      content += `</div>`;
      
      // Ajouter le pied de page
      content += `
          <div class="footer">
            Exporté depuis Mon Histoire le ${new Date().toLocaleDateString()} à ${new Date().toLocaleTimeString()}
          </div>
        </body>
        </html>
      `;
      
      // Générer le nom du fichier
      const fileName = `${story.title || 'histoire'}-${Date.now()}.html`;
      
      // Créer un blob et le télécharger
      const blob = new Blob([content], { type: 'text/html;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      window.URL.revokeObjectURL(url);
      
      // Masquer le chargement
      if (MonHistoire.modules.app && MonHistoire.modules.app.showLoading) {
        MonHistoire.modules.app.showLoading(false);
      }
      
      // Afficher un message de succès
      if (MonHistoire.showMessageModal) {
        MonHistoire.showMessageModal("Histoire exportée au format HTML avec succès.");
      }
      
      console.log(`Histoire exportée au format HTML: ${fileName}`);
    } catch (error) {
      console.error("Erreur lors de l'export au format HTML:", error);
      
      // Masquer le chargement
      if (MonHistoire.modules.app && MonHistoire.modules.app.showLoading) {
        MonHistoire.modules.app.showLoading(false);
      }
      
      // Afficher un message d'erreur
      if (MonHistoire.showMessageModal) {
        MonHistoire.showMessageModal("Erreur lors de l'export au format HTML. Veuillez réessayer.");
      }
    }
  }
  
  /**
   * Exporte une histoire au format image
   * @param {Object} story - Histoire à exporter
   */
  function exportToImage(story) {
    // Utiliser html2canvas pour générer une image
    if (window.html2canvas) {
      try {
        // Créer un élément temporaire pour le rendu
        const tempElement = document.createElement('div');
        tempElement.className = 'story-export-container';
        tempElement.style.width = '800px';
        tempElement.style.padding = '20px';
        tempElement.style.backgroundColor = 'white';
        tempElement.style.fontFamily = 'Arial, sans-serif';
        tempElement.style.position = 'absolute';
        tempElement.style.left = '-9999px';
        
        // Ajouter le titre
        const titleElement = document.createElement('h1');
        titleElement.textContent = story.title || 'Histoire sans titre';
        titleElement.style.color = '#1161a5';
        titleElement.style.marginBottom = '10px';
        tempElement.appendChild(titleElement);
        
        // Ajouter la date
        if (story.createdAt) {
          const dateElement = document.createElement('div');
          dateElement.textContent = `Créée le ${new Date(story.createdAt).toLocaleDateString()}`;
          dateElement.style.color = '#666';
          dateElement.style.fontStyle = 'italic';
          dateElement.style.marginBottom = '20px';
          tempElement.appendChild(dateElement);
        }
        
        // Ajouter le contenu
        const contentElement = document.createElement('div');
        contentElement.style.lineHeight = '1.6';
        
        if (story.content) {
          // Formater le contenu
          const paragraphs = story.content.split('\n\n');
          
          paragraphs.forEach(paragraph => {
            const p = document.createElement('p');
            p.textContent = paragraph;
            contentElement.appendChild(p);
          });
        }
        
        tempElement.appendChild(contentElement);
        
        // Ajouter l'élément au document
        document.body.appendChild(tempElement);
        
        // Générer l'image
        window.html2canvas(tempElement).then(canvas => {
          // Supprimer l'élément temporaire
          document.body.removeChild(tempElement);
          
          // Générer le nom du fichier
          const fileName = `${story.title || 'histoire'}-${Date.now()}.png`;
          
          // Télécharger l'image
          const url = canvas.toDataURL('image/png');
          const a = document.createElement('a');
          a.href = url;
          a.download = fileName;
          a.click();
          
          // Masquer le chargement
          if (MonHistoire.modules.app && MonHistoire.modules.app.showLoading) {
            MonHistoire.modules.app.showLoading(false);
          }
          
          // Afficher un message de succès
          if (MonHistoire.showMessageModal) {
            MonHistoire.showMessageModal("Histoire exportée au format image avec succès.");
          }
          
          console.log(`Histoire exportée au format image: ${fileName}`);
        });
      } catch (error) {
        console.error("Erreur lors de l'export au format image:", error);
        
        // Masquer le chargement
        if (MonHistoire.modules.app && MonHistoire.modules.app.showLoading) {
          MonHistoire.modules.app.showLoading(false);
        }
        
        // Afficher un message d'erreur
        if (MonHistoire.showMessageModal) {
          MonHistoire.showMessageModal("Erreur lors de l'export au format image. Veuillez réessayer.");
        }
      }
    } else {
      // Si html2canvas n'est pas disponible, utiliser l'export HTML
      console.warn("html2canvas non disponible, utilisation de l'export HTML");
      exportToHTML(story);
    }
  }
  
  /**
   * Obtient les formats d'export disponibles
   * @returns {Object} Formats d'export
   */
  function getExportFormats() {
    return { ...EXPORT_FORMATS };
  }
  
  // API publique
  MonHistoire.modules.stories.export = {
    init: init,
    exportStory: exportStory,
    getExportFormats: getExportFormats
  };
})();
