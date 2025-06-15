// js/features/stories/display.js
// Affichage des histoires générées ou sauvegardées

// S'assurer que les objets nécessaires existent
window.MonHistoire = window.MonHistoire || {};
MonHistoire.features = MonHistoire.features || {};
MonHistoire.features.stories = MonHistoire.features.stories || {};

// Module d'affichage des histoires
MonHistoire.features.stories.display = {
  // Initialisation du module
  init() {
    // Rien à initialiser pour l'instant
  },
  
  // Affiche une histoire sauvegardée dans l'écran de résultat
  afficherHistoireSauvegardee(id) {
    console.log("[DEBUG DISPLAY] Début afficherHistoireSauvegardee pour id:", id);
    // Indique qu'on vient de "mes-histoires" (pour le bouton Sauvegarder)
    MonHistoire.state.resultatSource = "mes-histoires";
    
    // Récupère l'histoire depuis Firestore
    if (MonHistoire.core && MonHistoire.core.storage) {
      console.log("[DEBUG DISPLAY] Appel à getHistoireById pour id:", id);
      MonHistoire.core.storage.getHistoireById(id)
        .then(histoire => {
          console.log("[DEBUG DISPLAY] Histoire récupérée:", histoire ? "OK" : "NULL");
          
          // Affiche l'histoire
          this.afficherHistoire(histoire);
          
          console.log("[DEBUG DISPLAY] Vérification du module de notation:", 
            MonHistoire.features && MonHistoire.features.stories && MonHistoire.features.stories.notation ? "OK" : "NON DISPONIBLE");
          
          if (MonHistoire.features && MonHistoire.features.stories && MonHistoire.features.stories.notation) {
            console.log("[DEBUG DISPLAY] Appel à afficherNote pour histoire.id:", histoire.id);
            MonHistoire.features.stories.notation.afficherNote(histoire.id);
            
            console.log("[DEBUG DISPLAY] Appel à bindNotation pour histoire.id:", histoire.id);
            MonHistoire.features.stories.notation.bindNotation(histoire.id);
            
            const blocNotation = document.getElementById("bloc-notation");
            console.log("[DEBUG DISPLAY] Élément bloc-notation trouvé:", !!blocNotation);
            
            if (blocNotation) {
              console.log("[DEBUG DISPLAY] Classes du bloc-notation avant:", blocNotation.className);
              blocNotation.classList.remove("hidden");
              console.log("[DEBUG DISPLAY] Classes du bloc-notation après:", blocNotation.className);
            } else {
              console.error("[DEBUG DISPLAY] Élément bloc-notation non trouvé dans le DOM");
            }
          } else {
            console.error("[DEBUG DISPLAY] Module de notation non disponible");
          }
          
          // Affiche l'écran de résultat
          MonHistoire.core.navigation.showScreen("resultat");
          
          // Log l'activité
          if (MonHistoire.core && MonHistoire.core.auth && firebase.auth().currentUser) {
            MonHistoire.core.auth.logActivite("lecture_histoire", { histoire_id: id });
          }
        })
        .catch(error => {
          console.error("Erreur lors de la récupération de l'histoire:", error);
          MonHistoire.showMessageModal("Erreur lors de la récupération de l'histoire.");
        });
    }
  },
  
  // Affiche une histoire partagée dans l'écran de résultat
  afficherHistoirePartagee(id) {
    console.log("[DEBUG DISPLAY] Début afficherHistoirePartagee pour id:", id);
    // Indique qu'on vient de "mes-histoires" (pour le bouton Sauvegarder)
    MonHistoire.state.resultatSource = "partage";
    
    // Récupère l'histoire depuis Firestore
    if (MonHistoire.core && MonHistoire.core.storage) {
      console.log("[DEBUG DISPLAY] Appel à getHistoirePartagee pour id:", id);
      MonHistoire.core.storage.getHistoirePartagee(id)
        .then(histoire => {
          console.log("[DEBUG DISPLAY] Histoire partagée récupérée:", histoire ? "OK" : "NULL");
          
          // Affiche l'histoire
          this.afficherHistoire(histoire);
          
          console.log("[DEBUG DISPLAY] Vérification du module de notation:", 
            MonHistoire.features && MonHistoire.features.stories && MonHistoire.features.stories.notation ? "OK" : "NON DISPONIBLE");
          
          if (MonHistoire.features && MonHistoire.features.stories && MonHistoire.features.stories.notation) {
            console.log("[DEBUG DISPLAY] Appel à afficherNote pour histoire.id:", histoire.id);
            MonHistoire.features.stories.notation.afficherNote(histoire.id);
            
            console.log("[DEBUG DISPLAY] Appel à bindNotation pour histoire.id:", histoire.id);
            MonHistoire.features.stories.notation.bindNotation(histoire.id);
            
            const blocNotation = document.getElementById("bloc-notation");
            console.log("[DEBUG DISPLAY] Élément bloc-notation trouvé:", !!blocNotation);
            
            if (blocNotation) {
              console.log("[DEBUG DISPLAY] Classes du bloc-notation avant:", blocNotation.className);
              blocNotation.classList.remove("hidden");
              console.log("[DEBUG DISPLAY] Classes du bloc-notation après:", blocNotation.className);
            } else {
              console.error("[DEBUG DISPLAY] Élément bloc-notation non trouvé dans le DOM");
            }
          } else {
            console.error("[DEBUG DISPLAY] Module de notation non disponible");
          }

          // Affiche l'écran de résultat
          MonHistoire.core.navigation.showScreen("resultat");
          
          // Affiche un message indiquant l'auteur
          setTimeout(() => {
            const auteur = histoire.profil_enfant_prenom || histoire.auteur_prenom || "Anonyme";
            MonHistoire.showMessageModal(`Cette histoire a été créée par ${auteur}.`);
          }, 500);
          
          // Log l'activité
          if (MonHistoire.core && MonHistoire.core.auth && firebase.auth().currentUser) {
            MonHistoire.core.auth.logActivite("lecture_histoire_partagee", { partage_id: id });
          }
        })
        .catch(error => {
          console.error("Erreur lors de la récupération de l'histoire partagée:", error);
          MonHistoire.showMessageModal("Erreur lors de la récupération de l'histoire partagée.");
        });
    }
  },
  
  // Affiche une histoire dans l'écran de résultat
  afficherHistoire(histoire) {
    console.log("[DEBUG DISPLAY] Début afficherHistoire:", histoire ? histoire.id : "NULL");
    
    // Récupère les éléments pour afficher le résultat
    const titreHistoireElement = document.getElementById("titre-histoire-resultat");
    const histoireElement = document.getElementById("histoire");
    
    // Vérifie si l'élément histoire existe
    if (!histoireElement) {
      console.error("[DEBUG] Élément HTML essentiel #histoire manquant pour l'affichage de l'histoire");
      return;
    }
    
    // Affiche le titre dans l'élément approprié s'il existe
    if (titreHistoireElement) {
      titreHistoireElement.textContent = histoire.titre || "Histoire sans titre";
      
      // Stocke l'ID de l'histoire pour le partage
      if (histoire.id) {
        titreHistoireElement.dataset.histoireId = histoire.id;
      }
    }
    
    // Désactive le bouton Sauvegarder pendant le chargement
    const btnSauvegarde = document.getElementById("btn-sauvegarde");
    if (btnSauvegarde) {
      btnSauvegarde.disabled = true;
      btnSauvegarde.style.opacity = "0.5";
      btnSauvegarde.style.cursor = "not-allowed";
    }
    
    // Génère le HTML complet pour l'histoire
    let html = '';
    
    // Gestion du format de l'histoire (ancien ou nouveau format)
    if (histoire.contenu) {
      console.log("[DEBUG] Utilisation du contenu HTML complet");
      // Utilise directement le contenu HTML complet
      html = histoire.contenu;
    } else if (histoire.chapitres && Array.isArray(histoire.chapitres)) {
      console.log("[DEBUG] Utilisation du tableau de chapitres");
      
      // Génère le HTML pour chaque chapitre
      histoire.chapitres.forEach((chapitre, index) => {
        if (index < 5) {
          html += `<h3>${chapitre.titre || "Chapitre " + (index + 1)}</h3>`;
          html += `<p>${chapitre.texte || ''}</p>`;
          
          // Ajoute l'image si elle existe
          if (chapitre.image) {
            html += `<div class="illustration-chapitre"><img src="${chapitre.image}" alt="Illustration du chapitre ${index+1}"></div>`;
          }
        }
      });
    } else {
      console.log("[DEBUG] Utilisation des champs de chapitres individuels");
      
      // Génère le HTML pour chaque chapitre individuel
      if (histoire.chapitre1) {
        html += `<h3>Chapitre 1</h3><p>${histoire.chapitre1}</p>`;
      }
      if (histoire.chapitre2) {
        html += `<h3>Chapitre 2</h3><p>${histoire.chapitre2}</p>`;
      }
      if (histoire.chapitre3) {
        html += `<h3>Chapitre 3</h3><p>${histoire.chapitre3}</p>`;
      }
      if (histoire.chapitre4) {
        html += `<h3>Chapitre 4</h3><p>${histoire.chapitre4}</p>`;
      }
      if (histoire.chapitre5) {
        html += `<h3>Chapitre 5</h3><p>${histoire.chapitre5}</p>`;
      }
      
      // Ajoute les images si elles existent
      if (histoire.images && histoire.images.length > 0) {
        histoire.images.forEach((imageUrl, index) => {
          if (imageUrl && index < 5) {
            // Trouve le chapitre correspondant
            const chapitreHTML = `<h3>Chapitre ${index+1}</h3>`;
            const position = html.indexOf(chapitreHTML) + chapitreHTML.length;
            
            // Trouve la fin du paragraphe
            const finParagraphe = html.indexOf('</p>', position) + 4;
            
            // Insère l'image après le paragraphe
            if (finParagraphe > 4) {
              const avant = html.substring(0, finParagraphe);
              const apres = html.substring(finParagraphe);
              html = avant + `<div class="illustration-chapitre"><img src="${imageUrl}" alt="Illustration du chapitre ${index+1}"></div>` + apres;
            }
          }
        });
      }
    }
    
    // Injecte le HTML complet dans le conteneur principal
    histoireElement.innerHTML = html;
    
    // Active le bouton Sauvegarder après un délai pour s'assurer que tout est affiché
    setTimeout(() => {
      if (btnSauvegarde) {
        btnSauvegarde.disabled = false;
        btnSauvegarde.style.opacity = "1";
        btnSauvegarde.style.cursor = "pointer";
      }
    }, 1500); // Délai de 1.5 secondes
  },
  
  // Récupère l'histoire actuellement affichée dans l'écran de résultat
  getHistoireAffichee() {
    const titreHistoireElement = document.getElementById("titre-histoire-resultat");
    const histoireElement = document.getElementById("histoire");
    
    // Récupère le titre et l'ID
    const titre = titreHistoireElement ? titreHistoireElement.textContent || "Histoire sans titre" : "Histoire sans titre";
    const id = titreHistoireElement && titreHistoireElement.dataset.histoireId ? titreHistoireElement.dataset.histoireId : null;
    
    // Crée l'objet histoire de base
    const histoire = {
      id: id,
      titre: titre,
      chapitre1: "",
      chapitre2: "",
      chapitre3: "",
      chapitre4: "",
      chapitre5: ""
    };
    
    // Récupère le contenu HTML complet
    histoire.contenu = histoireElement.innerHTML;
    
    // Récupère le contenu des chapitres individuels
    const chapitres = histoireElement.querySelectorAll('h3');
    const paragraphes = histoireElement.querySelectorAll('p');
    
    // Extrait le texte des chapitres
    for (let i = 0; i < paragraphes.length && i < 5; i++) {
      histoire[`chapitre${i+1}`] = paragraphes[i].textContent || "";
    }
    
    // Récupère les images si elles existent
    histoire.images = [];
    const images = histoireElement.querySelectorAll('.illustration-chapitre img');
    for (let i = 0; i < images.length && i < 5; i++) {
      histoire.images[i] = images[i].src;
    }
    
    return histoire;
  },
  
  // Récupère les valeurs du formulaire de création d'histoire
  getValeursFormulaire() {
    const personnage = document.getElementById("personnage").value;
    const lieu = document.getElementById("lieu").value;
    
    return {
      personnage: personnage,
      lieu: lieu
    };
  },
  
  // Affiche les illustrations correspondant à l'histoire
  afficherIllustrations(personnage, lieu) {
    // Vérifie si on est en mode Firebase ou local
    const isFirebaseMode = typeof firebase !== 'undefined' && firebase.auth && firebase.auth().currentUser;
    
    // Si on est en mode Firebase, on ne tente pas d'afficher des illustrations locales
    if (isFirebaseMode) {
      console.log("Mode Firebase détecté, pas d'illustrations locales disponibles");
      return;
    }
    
    // En mode local uniquement, on peut essayer d'afficher des illustrations si elles existent
    try {
      // Détermine le type de personnage et de lieu
      const typePersonnage = this.determinerTypePersonnageIllustration(personnage);
      const typeLieu = this.determinerTypeLieuIllustration(lieu);
      
      // Construit les chemins des images avec un chemin relatif correct
      const baseUrl = "images/illustrations/";
      const images = [];
      
      for (let i = 1; i <= 5; i++) {
        const imagePath = `${baseUrl}${typePersonnage}-${typeLieu}-chapitre-${i}.jpg`;
        images.push(imagePath);
      }
      
      // Récupère l'élément histoire
      const histoireElement = document.getElementById("histoire");
      if (!histoireElement) return;
      
      // Récupère tous les titres de chapitres (h3)
      const chapitres = histoireElement.querySelectorAll('h3');
      
      // Affiche les images après chaque titre de chapitre
      for (let i = 0; i < chapitres.length && i < images.length; i++) {
        // Crée un nouvel élément div pour l'illustration
        const illustrationDiv = document.createElement('div');
        illustrationDiv.className = 'illustration-chapitre';
        
        // Crée l'élément image
        const newImage = document.createElement("img");
        newImage.src = images[i];
        newImage.alt = `Illustration du chapitre ${i+1}`;
        
        // Gestion des erreurs de chargement d'image
        newImage.onerror = function() {
          illustrationDiv.style.display = 'none'; // Cache le div si l'image n'existe pas
        };
        
        // Ajoute l'image au div
        illustrationDiv.appendChild(newImage);
        
        // Insère le div après le titre du chapitre
        chapitres[i].after(illustrationDiv);
      }
    } catch (error) {
      console.error("Erreur lors de l'affichage des illustrations:", error);
      // En cas d'erreur, on continue sans illustrations
    }
  },
  
  // Détermine le type de personnage pour l'illustration
  determinerTypePersonnageIllustration(personnage) {
    const personnageLower = personnage.toLowerCase();
    
    if (personnageLower.includes("princesse")) {
      return "princesse";
    } else if (personnageLower.includes("prince")) {
      return "prince";
    } else if (personnageLower.includes("chevalier")) {
      return "chevalier";
    } else if (personnageLower.includes("sorcier")) {
      return "sorcier";
    } else if (personnageLower.includes("sorcière")) {
      return "sorciere";
    } else if (personnageLower.includes("fée")) {
      return "fee";
    } else if (personnageLower.includes("pirate")) {
      return "pirate";
    } else if (personnageLower.includes("dragon")) {
      return "dragon";
    } else if (personnageLower.includes("licorne")) {
      return "licorne";
    } else if (personnageLower.includes("villageois")) {
      return "villageois";
    } else {
      // Par défaut, on utilise princesse ou chevalier selon le genre
      return personnageLower.includes("e") ? "princesse" : "chevalier";
    }
  },
  
  // Détermine le type de lieu pour l'illustration
  determinerTypeLieuIllustration(lieu) {
    const lieuLower = lieu.toLowerCase();
    
    if (lieuLower.includes("château")) {
      return "chateau";
    } else if (lieuLower.includes("forêt")) {
      return "foret";
    } else if (lieuLower.includes("montagne")) {
      return "montagne";
    } else if (lieuLower.includes("plage") || lieuLower.includes("mer") || lieuLower.includes("océan")) {
      return "plage";
    } else if (lieuLower.includes("grotte") || lieuLower.includes("caverne")) {
      return "grotte";
    } else if (lieuLower.includes("lac")) {
      return "lac";
    } else if (lieuLower.includes("marais")) {
      return "marais";
    } else if (lieuLower.includes("tour")) {
      return "tour";
    } else if (lieuLower.includes("caverne")) {
      return "caverne";
    } else {
      // Par défaut, on utilise château
      return "chateau";
    }
  }
};

// Exporter pour utilisation dans d'autres modules
window.MonHistoire = MonHistoire;
