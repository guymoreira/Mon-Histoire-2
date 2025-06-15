// js/features/stories/management.js
// Gestion des histoires sauvegardées (sauvegarde, suppression, liste)

// S'assurer que les objets nécessaires existent
window.MonHistoire = window.MonHistoire || {};
MonHistoire.features = MonHistoire.features || {};
MonHistoire.features.stories = MonHistoire.features.stories || {};

// Module de gestion des histoires
MonHistoire.features.stories.management = {
  // Initialisation du module
  init() {
    // Initialise les gestionnaires d'événements pour la suppression
    this.initGestionnairesEvenements();
    
    // Initialise le quota d'histoires
    this.initQuota();
  },
  
  // Initialise le quota d'histoires
  initQuota() {
    const compteurEl = document.getElementById("compteur-histoires");
    if (!compteurEl) return;
    
    // Réinitialiser le compteur
    compteurEl.textContent = "Chargement...";
    compteurEl.classList.remove("quota-alerte");
    
    // Récupérer le nombre d'histoires
    if (MonHistoire.core && MonHistoire.core.storage) {
      MonHistoire.core.storage.getHistoiresSauvegardees()
        .then(histoires => {
          const maxHistoires = MonHistoire.config && MonHistoire.config.MAX_HISTOIRES ? MonHistoire.config.MAX_HISTOIRES : 10;
          compteurEl.textContent = `${histoires.length} / ${maxHistoires}`;
          
          // Ajouter une classe d'alerte si on approche du quota
          if (histoires.length >= (maxHistoires * 0.8)) {
            compteurEl.classList.add("quota-alerte");
          } else {
            compteurEl.classList.remove("quota-alerte");
          }
        })
        .catch(error => {
          console.error("Erreur lors de l'initialisation du quota:", error);
          compteurEl.textContent = "Erreur";
        });
    }
  },
  
  // Initialise les gestionnaires d'événements
  initGestionnairesEvenements() {
    // Bouton Corbeille (suppression des histoires sélectionnées)
    const btnCorbeille = document.getElementById("btn-corbeille");
    if (btnCorbeille) {
      btnCorbeille.addEventListener("click", () => {
        this.confirmerSuppressionHistoiresSelectionnees();
      });
    }
    
    // Bouton Annuler sélection
    const btnAnnulerSelection = document.getElementById("btn-annuler-selection");
    if (btnAnnulerSelection) {
      btnAnnulerSelection.addEventListener("click", () => {
        this.annulerSelectionHistoires();
      });
    }
    
    // Bouton Confirmer suppression (dans la modale)
    const btnConfirmDelete = document.getElementById("btn-confirm-delete");
    if (btnConfirmDelete) {
      btnConfirmDelete.addEventListener("click", () => {
        this.supprimerHistoiresSelectionnees();
      });
    }
    
    // Bouton Annuler suppression (dans la modale)
    const btnCancelDelete = document.getElementById("btn-cancel-delete");
    if (btnCancelDelete) {
      btnCancelDelete.addEventListener("click", () => {
        document.getElementById("delete-modal").classList.remove("show");
      });
    }
  },
  
  // Sauvegarde l'histoire actuellement affichée
  sauvegarderHistoire() {
    const user = firebase.auth().currentUser;
    if (!user) {
      MonHistoire.showMessageModal("Tu dois être connecté pour sauvegarder une histoire.");
      return;
    }
    
    // Récupère l'histoire affichée
    const histoire = MonHistoire.features.stories.display.getHistoireAffichee();
    
    // Récupère les valeurs du formulaire si on vient du formulaire
    if (MonHistoire.state.resultatSource === "formulaire") {
      const valeurs = MonHistoire.features.stories.display.getValeursFormulaire();
      histoire.personnage = valeurs.personnage;
      histoire.lieu = valeurs.lieu;
    }
    
    // Sauvegarde l'histoire dans Firestore
    if (MonHistoire.core && MonHistoire.core.storage) {
      MonHistoire.core.storage.sauvegarderHistoire(histoire)
        .then(() => {
          MonHistoire.showMessageModal("Histoire sauvegardée avec succès !");
          
          // Cache le bouton Sauvegarder
          document.getElementById("btn-sauvegarde").style.display = "none";
          
          // Forcer une mise à jour complète du quota
          this.initQuota();
          
          // Met à jour la liste des histoires sauvegardées
          this.afficherHistoiresSauvegardees();
        })
        .catch(error => {
          console.error("Erreur lors de la sauvegarde de l'histoire:", error);
          MonHistoire.showMessageModal(error.message || "Erreur lors de la sauvegarde de l'histoire.");
        });
    }
  },
  
  // Supprime une histoire sauvegardée
  supprimerHistoire(id) {
    // Demande confirmation
    if (!confirm("Es-tu sûr de vouloir supprimer cette histoire ?")) {
      return;
    }
    
    // Supprime l'histoire de Firestore
    if (MonHistoire.core && MonHistoire.core.storage) {
      MonHistoire.core.storage.supprimerHistoire(id)
        .then(() => {
          // Forcer une mise à jour complète du quota
          this.initQuota();
          
          // Met à jour la liste des histoires sauvegardées
          this.afficherHistoiresSauvegardees();
          
          // Affiche un message de confirmation
          MonHistoire.showMessageModal("Histoire supprimée avec succès !");
        })
        .catch(error => {
          console.error("Erreur lors de la suppression de l'histoire:", error);
          MonHistoire.showMessageModal("Erreur lors de la suppression de l'histoire.");
        });
    }
  },
  
  // Affiche la liste des histoires sauvegardées
  afficherHistoiresSauvegardees() {
    console.log("[DEBUG] afficherHistoiresSauvegardees() - Début de la fonction");
    
    const container = document.getElementById("liste-histoires");
    console.log("[DEBUG] Conteneur liste-histoires trouvé:", !!container);
    
    if (!container) {
      console.error("[DEBUG] ERREUR: Conteneur liste-histoires non trouvé dans le DOM");
      return;
    }
    
    // Vide le conteneur
    console.log("[DEBUG] Vidage du conteneur, contenu précédent:", container.innerHTML.substring(0, 100) + (container.innerHTML.length > 100 ? "..." : ""));
    container.innerHTML = "";
    
    // Affiche un message de chargement
    const loadingEl = document.createElement("p");
    loadingEl.textContent = "Chargement des histoires...";
    loadingEl.className = "loading-message";
    container.appendChild(loadingEl);
    console.log("[DEBUG] Message de chargement ajouté");
    
    // Vérifie si le module de stockage est disponible
    console.log("[DEBUG] Module storage disponible:", !!(MonHistoire.core && MonHistoire.core.storage));
    
    // Récupère les histoires depuis Firestore
    if (MonHistoire.core && MonHistoire.core.storage) {
      console.log("[DEBUG] Appel à getHistoiresSauvegardees()");
      
      MonHistoire.core.storage.getHistoiresSauvegardees()
        .then(histoires => {
          console.log("[DEBUG] Réponse de getHistoiresSauvegardees() reçue");
          console.log("[DEBUG] Nombre d'histoires reçues:", histoires ? histoires.length : "undefined");
          
          // Supprime le message de chargement
          container.innerHTML = "";
          
          // Si aucune histoire, affiche un message
          if (!histoires || histoires.length === 0) {
            console.log("[DEBUG] Aucune histoire trouvée, affichage message");
            const emptyEl = document.createElement("p");
            emptyEl.textContent = "Aucune histoire sauvegardée.";
            emptyEl.className = "empty-message";
            container.appendChild(emptyEl);
            return;
          }
          
          // Met à jour le compteur d'histoires
          const compteurEl = document.getElementById("compteur-histoires");
          console.log("[DEBUG] Élément compteur trouvé:", !!compteurEl);
          
          if (compteurEl) {
            const maxHistoires = MonHistoire.config && MonHistoire.config.MAX_HISTOIRES ? MonHistoire.config.MAX_HISTOIRES : 10;
            compteurEl.textContent = `${histoires.length} / ${maxHistoires}`;
            console.log("[DEBUG] Compteur mis à jour:", compteurEl.textContent);
            
            // Ajoute une classe d'alerte si on approche du quota
            if (histoires.length >= (maxHistoires * 0.8)) {
              compteurEl.classList.add("quota-alerte");
            } else {
              compteurEl.classList.remove("quota-alerte");
            }
          }
          
          // Crée une carte pour chaque histoire
          console.log("[DEBUG] Création des cartes pour", histoires.length, "histoires");
          histoires.forEach((histoire, index) => {
            console.log(`[DEBUG] Création carte #${index+1}, ID: ${histoire.id}, Titre: ${histoire.titre}`);
            const card = this.creerCarteHistoire(histoire);
            container.appendChild(card);
          });
          
          console.log("[DEBUG] Affichage des histoires terminé avec succès");
        })
        .catch(error => {
          console.error("[DEBUG] ERREUR lors de la récupération des histoires:", error);
          console.error("[DEBUG] Stack trace:", error.stack);
          container.innerHTML = "";
          
          const errorEl = document.createElement("p");
          errorEl.textContent = "Erreur lors du chargement des histoires.";
          errorEl.className = "error-message";
          container.appendChild(errorEl);
        });
    } else {
      console.error("[DEBUG] ERREUR: Module de stockage non disponible");
      container.innerHTML = "";
      
      const errorEl = document.createElement("p");
      errorEl.textContent = "Erreur: module de stockage non disponible.";
      errorEl.className = "error-message";
      container.appendChild(errorEl);
    }
  },
  
  // Crée une carte pour afficher une histoire dans la liste
  creerCarteHistoire(histoire) {
    // Crée l'élément li qui contiendra le bouton
    const li = document.createElement("li");
    li.dataset.id = histoire.id;
    
    // Crée la carte (bouton stylisé)
    const card = document.createElement("button");
    card.className = "button button-blue histoire-card";
    card.dataset.id = histoire.id;
    
    // Ajoute le titre
    const titre = document.createElement("div");
    titre.textContent = histoire.titre || "Histoire sans titre";
    titre.style.fontWeight = "bold";
    card.appendChild(titre);

    if (typeof histoire.note === 'number') {
      const notationDiv = document.createElement('div');
      notationDiv.className = 'notation';
      for (let i = 1; i <= 5; i++) {
        const span = document.createElement('span');
        span.className = 'etoile';
        span.textContent = i <= histoire.note ? '★' : '☆';
        notationDiv.appendChild(span);
      }
      card.appendChild(notationDiv);
    }
    
    // Vérifie si l'histoire a été partagée (gère les différents formats possibles)
    const estHistoirePartagee = histoire.partageParPrenom || 
                               histoire.profil_enfant_prenom ||
                               (histoire.profil_enfant_id && histoire.profil_enfant_prenom);
    
    // Ajoute l'info de partage uniquement si c'est une histoire partagée
    if (estHistoirePartagee) {
      const infoEl = document.createElement("div");
      infoEl.style.fontSize = "0.85rem";
      infoEl.style.opacity = "0.9";
      infoEl.style.marginTop = "4px";
      
      // Utilise le nom du partageur selon le format disponible
      const nomPartageur = histoire.partageParPrenom || histoire.profil_enfant_prenom || "Quelqu'un";
      infoEl.textContent = `Partagée par ${nomPartageur}`;
      
      card.appendChild(infoEl);
    }
    
    // Ajoute un gestionnaire de clic sur toute la carte
    card.onclick = (event) => {
      // Vérifie si on est en mode sélection
      const isSelectionMode = document.querySelectorAll(".histoire-card.selected, .button.selected").length > 0 || 
                             document.getElementById("barre-suppression").style.display === "flex";
      
      if (isSelectionMode) {
        // En mode sélection, on sélectionne l'histoire au lieu de l'afficher
        event.preventDefault();
        event.stopPropagation();
        this.toggleSelectionHistoire(card);
      } else {
        // En mode normal, on affiche l'histoire
        console.log("[DEBUG] Clic sur histoire ID:", histoire.id);
        
        // Affiche l'histoire en utilisant le module display s'il est disponible
        if (MonHistoire.features &&
            MonHistoire.features.stories &&
            MonHistoire.features.stories.display &&
            typeof MonHistoire.features.stories.display.afficherHistoireSauvegardee === 'function') {
          MonHistoire.features.stories.display.afficherHistoireSauvegardee(histoire.id);
        } else {
          // Fallback en cas d'indisponibilité du module display
          this.afficherHistoireById(histoire.id);
        }
      }
    };
    
    // Ajoute le bouton au li
    li.appendChild(card);
    
    // Ajoute un gestionnaire pour le long press (pour la sélection)
    this.setupLongPress(card);
    
    return li;
  },
  
  // Tronque un texte à une longueur maximale
  tronquerTexte(texte, longueurMax) {
    if (texte.length <= longueurMax) {
      return texte;
    }
    
    return texte.substring(0, longueurMax) + "...";
  },
  
  // Méthode de fallback pour afficher une histoire par son ID
  afficherHistoireById(storyId) {
    console.log("[DEBUG] Utilisation de la méthode fallback afficherHistoireById:", storyId);
    const user = firebase.auth().currentUser;
    if (!user) return;
    
    try {
      // Détermine la référence en fonction du profil actif
      let profilActif = MonHistoire.state.profilActif;
      let storyDocRef;
      
      if (profilActif.type === "parent") {
        storyDocRef = firebase.firestore()
          .collection("users")
          .doc(user.uid)
          .collection("stories")
          .doc(storyId);
      } else {
        storyDocRef = firebase.firestore()
          .collection("users")
          .doc(user.uid)
          .collection("profils_enfant")
          .doc(profilActif.id)
          .collection("stories")
          .doc(storyId);
      }
      
      storyDocRef.get()
        .then(doc => {
          if (doc.exists) {
            const data = doc.data();
            const histoireElement = document.getElementById("histoire");
            
            // Génère le HTML complet pour l'histoire
            let html = '';
            
            // Affiche le contenu de l'histoire
            if (data.contenu) {
              // Si le contenu HTML est disponible, l'utiliser directement
              html = data.contenu;
            } else {
              // Sinon, générer le HTML à partir des chapitres individuels
              if (data.chapitre1) {
                html += `<h3>Chapitre 1</h3><p>${data.chapitre1}</p>`;
              }
              if (data.chapitre2) {
                html += `<h3>Chapitre 2</h3><p>${data.chapitre2}</p>`;
              }
              if (data.chapitre3) {
                html += `<h3>Chapitre 3</h3><p>${data.chapitre3}</p>`;
              }
              if (data.chapitre4) {
                html += `<h3>Chapitre 4</h3><p>${data.chapitre4}</p>`;
              }
              if (data.chapitre5) {
                html += `<h3>Chapitre 5</h3><p>${data.chapitre5}</p>`;
              }
              
              // Ajouter les images si elles existent
              if (data.images && data.images.length > 0) {
                data.images.forEach((imageUrl, index) => {
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
            if (histoireElement) {
              histoireElement.innerHTML = html;
            }
            
            // Affiche le titre
            const titreHistoireElement = document.getElementById("titre-histoire-resultat");
            
            if (titreHistoireElement) {
              titreHistoireElement.textContent = data.titre || "Histoire sans titre";
              titreHistoireElement.dataset.histoireId = storyId;
            }

            // Stocke l'ID de l'histoire pour le partage
            if (titreHistoireElement) titreHistoireElement.dataset.histoireId = storyId;

            // Affiche la note et active la notation si disponible
            if (MonHistoire.features &&
                MonHistoire.features.stories &&
                MonHistoire.features.stories.notation) {
              MonHistoire.features.stories.notation.afficherNote(storyId);
              MonHistoire.features.stories.notation.bindNotation(storyId);
              const blocNotation = document.getElementById("bloc-notation");
              if (blocNotation) {
                blocNotation.classList.remove("hidden");
              }
            }
            
            // Indique qu'on vient de "mes-histoires" (pour le bouton Sauvegarder)
            MonHistoire.state.resultatSource = "mes-histoires";
            
            // Affiche l'écran de résultat
            if (MonHistoire.core && MonHistoire.core.navigation) {
              MonHistoire.core.navigation.showScreen("resultat");
            } else {
              // Fallback si le module navigation n'est pas disponible
              const activeScreens = document.querySelectorAll('.screen.active');
              activeScreens.forEach(el => el.classList.remove('active'));
              document.getElementById("resultat").classList.add('active');
            }
            
            // Log l'activité
            if (MonHistoire.core && MonHistoire.core.auth && firebase.auth().currentUser) {
              MonHistoire.core.auth.logActivite("lecture_histoire", { histoire_id: storyId });
            }
          } else {
            console.error("[DEBUG] Histoire non trouvée:", storyId);
            MonHistoire.showMessageModal("Histoire non trouvée.");
          }
        })
        .catch(error => {
          console.error("[DEBUG] Erreur lors de la récupération de l'histoire:", error);
          MonHistoire.showMessageModal("Erreur lors de la récupération de l'histoire.");
        });
    } catch (error) {
      console.error("[DEBUG] Erreur dans afficherHistoireById:", error);
      MonHistoire.showMessageModal("Erreur : " + error.message);
    }
  },
  
  // Configure le long press pour la sélection d'histoires
  setupLongPress(element) {
    let pressTimer;
    let longPressTriggered = false;
    let startX, startY;
    const longPressDuration = 500; // Durée en ms pour considérer un appui long
    const moveThreshold = 10; // Seuil de mouvement en pixels pour annuler le long press
    
    // Vérifie si on est en mode sélection
    const isSelectionMode = () => {
      return document.querySelectorAll(".histoire-card.selected, .button.selected").length > 0 || 
             document.getElementById("barre-suppression").style.display === "flex";
    };
    
    // Gestionnaire pour le début du toucher (tactile)
    const startTouch = (e) => {
      // Si on est déjà en mode sélection, on sélectionne directement l'élément
      if (isSelectionMode()) {
        // Empêche la navigation vers l'histoire
        const originalClick = element.onclick;
        element.onclick = (clickEvent) => {
          clickEvent.preventDefault();
          clickEvent.stopPropagation();
          
          // Sélectionne l'histoire
          this.toggleSelectionHistoire(element);
          
          // Restaure le gestionnaire de clic original après un court délai
          setTimeout(() => {
            element.onclick = originalClick;
          }, 300);
        };
        
        // Pas besoin de preventDefault ici pour éviter l'erreur
        // "Unable to preventDefault inside passive event listener"
        return;
      }
      
      // Enregistre la position initiale du toucher
      if (e.touches && e.touches[0]) {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
      } else if (e.type === "mousedown") {
        startX = e.clientX;
        startY = e.clientY;
      }
      
      longPressTriggered = false;
      
      // Démarre le timer
      pressTimer = setTimeout(() => {
        longPressTriggered = true;
        
        // Feedback haptique si disponible
        if (navigator.vibrate) {
          navigator.vibrate(50);
        }
        
        this.toggleSelectionHistoire(element);
        
        // Empêche le clic normal après un long press
        const originalClick = element.onclick;
        element.onclick = (clickEvent) => {
          clickEvent.preventDefault();
          clickEvent.stopPropagation();
          
          // Restaure le gestionnaire de clic original après un court délai
          setTimeout(() => {
            element.onclick = originalClick;
          }, 300);
        };
      }, longPressDuration);
    };
    
    // Gestionnaire pour la fin du toucher
    const endTouch = (e) => {
      // Annule le timer
      clearTimeout(pressTimer);
      
      // Si c'était un appui court, le clic normal sera déclenché automatiquement
      // Pas besoin de faire quoi que ce soit ici
    };
    
    // Gestionnaire pour l'annulation du toucher
    const cancelTouch = () => {
      clearTimeout(pressTimer);
      longPressTriggered = false;
    };
    
    // Gestionnaire pour le mouvement du toucher
    const moveTouch = (e) => {
      let moveX = 0;
      let moveY = 0;
      
      if (e.touches && e.touches[0]) {
        moveX = Math.abs(e.touches[0].clientX - startX);
        moveY = Math.abs(e.touches[0].clientY - startY);
      } else if (e.type === "mousemove") {
        moveX = Math.abs(e.clientX - startX);
        moveY = Math.abs(e.clientY - startY);
      }
      
      // Si le mouvement dépasse le seuil, annule le long press
      if (moveX > moveThreshold || moveY > moveThreshold) {
        cancelTouch();
      }
    };
    
      // Attache les gestionnaires d'événements pour tactile
      // Utilise passive: true pour éviter l'erreur "Unable to preventDefault inside passive event listener"
      element.addEventListener("touchstart", startTouch, { passive: true });
    element.addEventListener("touchend", endTouch);
    element.addEventListener("touchcancel", cancelTouch);
    element.addEventListener("touchmove", moveTouch);
    
    // Attache les gestionnaires d'événements pour souris
    element.addEventListener("mousedown", startTouch);
    element.addEventListener("mouseup", endTouch);
    element.addEventListener("mouseleave", cancelTouch);
    element.addEventListener("mousemove", moveTouch);
  },
  
  // Bascule la sélection d'une histoire
  toggleSelectionHistoire(element) {
    // Affiche la barre de suppression si elle n'est pas déjà visible
    const barreSuppr = document.getElementById("barre-suppression");
    if (barreSuppr) {
      barreSuppr.style.display = "flex";
    }
    
    // Ajoute/supprime la classe selected
    element.classList.toggle("selected");
    
    // Ajoute/supprime la coche
    if (element.classList.contains("selected")) {
      // Ajoute une coche à droite
      const coche = document.createElement("span");
      coche.textContent = "✓";
      coche.style.color = "red";
      coche.style.position = "absolute";
      coche.style.right = "10px";
      coche.style.top = "50%";
      coche.style.transform = "translateY(-50%)";
      coche.style.fontSize = "1.5rem";
      coche.style.pointerEvents = "none"; // Évite que la coche interfère avec les clics
      element.style.position = "relative"; // Assure que le positionnement absolu fonctionne
      element.appendChild(coche);
    } else {
      // Supprime la coche
      const coche = element.querySelector("span");
      if (coche) {
        element.removeChild(coche);
      }
    }
    
    // Cache la barre de suppression si aucune histoire n'est sélectionnée
    const histoiresSelectionnees = document.querySelectorAll(".histoire-card.selected, .button.selected");
    if (histoiresSelectionnees.length === 0 && barreSuppr) {
      barreSuppr.style.display = "none";
    }
  },
  
  // Annule la sélection de toutes les histoires
  annulerSelectionHistoires() {
    const histoiresSelectionnees = document.querySelectorAll(".histoire-card.selected, .button.selected");
    histoiresSelectionnees.forEach(histoire => {
      // Supprime la classe selected
      histoire.classList.remove("selected");
      
      // Supprime la coche
      const coche = histoire.querySelector("span");
      if (coche) {
        histoire.removeChild(coche);
      }
    });
    
    // Cache la barre de suppression
    const barreSuppr = document.getElementById("barre-suppression");
    if (barreSuppr) {
      barreSuppr.style.display = "none";
    }
  },
  
  // Affiche la modale de confirmation pour supprimer les histoires sélectionnées
  confirmerSuppressionHistoiresSelectionnees() {
    const histoiresSelectionnees = document.querySelectorAll(".histoire-card.selected, .button.selected");
    if (histoiresSelectionnees.length === 0) return;
    
    // Affiche la modale de confirmation
    const modal = document.getElementById("delete-modal");
    if (modal) {
      modal.classList.add("show");
    }
  },
  
  // Supprime les histoires sélectionnées
  supprimerHistoiresSelectionnees() {
    const histoiresSelectionnees = document.querySelectorAll(".histoire-card.selected, .button.selected");
    if (histoiresSelectionnees.length === 0) return;
    
    // Récupère les IDs des histoires sélectionnées
    const ids = Array.from(histoiresSelectionnees).map(histoire => histoire.dataset.id);
    
    // Supprime les histoires une par une
    Promise.all(ids.map(id => {
      if (MonHistoire.core && MonHistoire.core.storage) {
        return MonHistoire.core.storage.supprimerHistoire(id);
      }
      return Promise.resolve();
    }))
    .then(() => {
      // Cache la modale de confirmation
      const modal = document.getElementById("delete-modal");
      if (modal) {
        modal.classList.remove("show");
      }
      
      // Cache la barre de suppression
      const barreSuppr = document.getElementById("barre-suppression");
      if (barreSuppr) {
        barreSuppr.style.display = "none";
      }
      
      // Forcer une mise à jour complète du quota
      this.initQuota();
      
      // Met à jour la liste des histoires
      this.afficherHistoiresSauvegardees();
      
      // Affiche un message de confirmation
      MonHistoire.showMessageModal("Histoires supprimées avec succès !");
    })
    .catch(error => {
      console.error("Erreur lors de la suppression des histoires:", error);
      MonHistoire.showMessageModal("Erreur lors de la suppression des histoires.");
    });
  }
};

// Exporter pour utilisation dans d'autres modules
window.MonHistoire = MonHistoire;
