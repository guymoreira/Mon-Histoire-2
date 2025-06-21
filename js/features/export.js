// js/features/export.js
// Gestion de l'export des histoires au format PDF

// S'assurer que les objets nécessaires existent
window.MonHistoire = window.MonHistoire || {};
MonHistoire.features = MonHistoire.features || {};

// Module d'export d'histoires
MonHistoire.features.export = {
  // Initialisation du module
  init() {
    // Rien à initialiser pour l'instant
  },
  
  // Exporte l'histoire actuellement affichée au format PDF
  exporterHistoirePDF() {
    // Vérifie si jsPDF est disponible
    if (typeof jspdf === "undefined" || typeof jspdf.jsPDF === "undefined") {
      this.chargerJsPDF()
        .then(() => {
          this.genererPDF();
        })
        .catch(error => {
          console.error("Erreur lors du chargement de jsPDF:", error);
          MonHistoire.showMessageModal("Erreur lors du chargement de la bibliothèque d'export PDF.");
        });
    } else {
      this.genererPDF();
    }
  },
  
  // Charge dynamiquement la bibliothèque jsPDF
  chargerJsPDF() {
    return new Promise((resolve, reject) => {
      // Crée un élément script
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
      script.integrity = "sha512-qZvrmS2ekKPF2mSznTQsxqPgnpkI4DNTlrdUmTzrDgektczlKNRRhy5X5AAOnx5S09ydFYWWNSfcEqDTTHgtNA==";
      script.crossOrigin = "anonymous";
      script.referrerPolicy = "no-referrer";
      
      // Gestionnaire d'événement pour le chargement réussi
      script.onload = () => {
        resolve();
      };
      
      // Gestionnaire d'événement pour les erreurs
      script.onerror = () => {
        reject(new Error("Erreur lors du chargement de jsPDF"));
      };
      
      // Ajoute le script au document
      document.head.appendChild(script);
    });
  },
  
  // Convertit une URL d'image en dataURL
  async imgSrcToDataURL(src) {
    return new Promise((resolve, reject) => {
      const img = document.createElement("img");
      img.crossOrigin = "anonymous";
      img.src = src;
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL("image/png"));
        } catch (e) {
          reject(e);
        }
      };
      img.onerror = reject;
    });
  },
  
  // Génère le PDF avec l'histoire
  async genererPDF() {
    // Récupère l'histoire affichée
    const histoire = MonHistoire.features.stories.display.getHistoireAffichee();
    
    // Crée un nouveau document PDF
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });
    
    // Définit les marges et dimensions
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - 2 * margin;
    
    // Définit les styles
    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    
    // Ajoute le titre
    const titre = histoire.titre || "Histoire sans titre";
    doc.text(titre, pageWidth / 2, margin, { align: "center" });
    
    // Ajoute une ligne de séparation
    doc.setLineWidth(0.5);
    doc.line(margin, margin + 10, pageWidth - margin, margin + 10);
    
    // Réinitialise le style pour le contenu
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    
    // Position Y courante
    let yPos = margin + 20;
    
    // Si l'histoire a un contenu HTML, on l'utilise pour extraire le texte
    if (histoire.contenu) {
      // Crée un élément temporaire pour parser le contenu HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = histoire.contenu;
      
      // Récupère tous les titres, paragraphes et illustrations
      const elements = tempDiv.querySelectorAll('h3, p, div.illustration-chapitre');
      
      // Parcourt les éléments
      let chapitreActuel = 0;
      
      for (let i = 0; i < elements.length; i++) {
        const element = elements[i];
        
        // Si c'est un titre de chapitre
        if (element.tagName.toLowerCase() === 'h3') {
          chapitreActuel++;
          
          // Ajoute le titre du chapitre
          doc.setFont("helvetica", "bold");
          doc.setFontSize(16);
          
          // Vérifie s'il faut ajouter une nouvelle page
          if (yPos + 10 > pageHeight - margin) {
            doc.addPage();
            yPos = margin;
          }
          
          doc.text(element.textContent || `Chapitre ${chapitreActuel}`, margin, yPos);
          yPos += 10;
        }
        // Si c'est un paragraphe
        else if (element.tagName.toLowerCase() === 'p') {
          // Réinitialise le style pour le contenu
          doc.setFont("helvetica", "normal");
          doc.setFontSize(12);
          
          // Découpe le texte en lignes
          const texte = element.textContent || "";
          const lignes = doc.splitTextToSize(texte, contentWidth);
          
          // Vérifie s'il faut ajouter une nouvelle page
          if (yPos + lignes.length * 7 > pageHeight - margin) {
            doc.addPage();
            yPos = margin;
          }
          
          // Ajoute le texte
          doc.text(lignes, margin, yPos);
          yPos += lignes.length * 7 + 10;
        }
        // Si c'est une illustration
        else if (element.classList && element.classList.contains('illustration-chapitre')) {
          const img = element.querySelector("img");
          if (img && img.src) {
            try {
              // Convertit l'URL de l'image en dataURL
              const imgData = await this.imgSrcToDataURL(img.src);
              
              // Dimensions de l'image dans le PDF
              const imgWidth = 140;
              const imgHeight = 140;
              
              // Position X centrée
              const x = (pageWidth - imgWidth) / 2;
              
              // Vérifie s'il faut ajouter une nouvelle page pour l'image
              if (yPos + imgHeight > pageHeight - margin) {
                doc.addPage();
                yPos = margin;
              }
              
              // Ajoute l'image au PDF
              doc.addImage(imgData, "PNG", x, yPos, imgWidth, imgHeight);
              
              // Met à jour la position Y
              yPos += imgHeight + 10;
            } catch (error) {
              console.error("Erreur lors de la conversion de l'image:", error);
            }
          }
        }
      }
    } else {
      // Fonction pour ajouter un chapitre
      const ajouterChapitre = (numero, texte) => {
        if (!texte) return yPos;
        
        // Ajoute le titre du chapitre
        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.text(`Chapitre ${numero}`, margin, yPos);
        yPos += 10;
        
        // Réinitialise le style pour le contenu
        doc.setFont("helvetica", "normal");
        doc.setFontSize(12);
        
        // Découpe le texte en lignes
        const lignes = doc.splitTextToSize(texte, contentWidth);
        
        // Vérifie s'il faut ajouter une nouvelle page
        if (yPos + lignes.length * 7 > pageHeight - margin) {
          doc.addPage();
          yPos = margin;
        }
        
        // Ajoute le texte
        doc.text(lignes, margin, yPos);
        yPos += lignes.length * 7 + 15;
        
        return yPos;
      };
      
      // Ajoute chaque chapitre
      yPos = ajouterChapitre(1, histoire.chapitre1);
      yPos = ajouterChapitre(2, histoire.chapitre2);
      yPos = ajouterChapitre(3, histoire.chapitre3);
      yPos = ajouterChapitre(4, histoire.chapitre4);
      yPos = ajouterChapitre(5, histoire.chapitre5);
    }
    
    // Ajoute une note de bas de page
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text("Généré avec Mon Histoire - www.monhistoire.app", pageWidth / 2, pageHeight - 10, { align: "center" });
    
    // Génère le nom du fichier
    const nomFichier = this.genererNomFichier(titre);
    
    // Enregistre le PDF
    doc.save(nomFichier);
    
    // Log l'activité
    if (MonHistoire.core && MonHistoire.core.auth && firebase.auth().currentUser) {
      MonHistoire.core.auth.logActivite("export_pdf", { 
        histoire_id: histoire.id,
        titre: histoire.titre
      });
    }
  },
  
  // Génère un nom de fichier valide à partir du titre
  genererNomFichier(titre) {
    // Remplace les caractères non valides par des tirets
    const titreValide = titre
      .replace(/[^a-zA-Z0-9éèêëàâäôöùûüÿçÉÈÊËÀÂÄÔÖÙÛÜŸÇ\s]/g, "-")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
    
    // Ajoute la date et l'extension
    const date = new Date().toISOString().split("T")[0];
    return `histoire-${titreValide}-${date}.pdf`;
  }
};

// Exporter pour utilisation dans d'autres modules
window.MonHistoire = MonHistoire;
