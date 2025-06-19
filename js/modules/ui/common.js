// js/modules/ui/common.js
// Gestion de l'interface utilisateur et des interactions

// S'assurer que les namespaces existent
window.MonHistoire = window.MonHistoire || {};
MonHistoire.modules = MonHistoire.modules || {};
MonHistoire.modules.ui = MonHistoire.modules.ui || {};

// Module UI Common
(function() {
  // Variables privées
  let profilsEnfantModifies = [];
  let idProfilEnfantActif = null;

  // Méthodes privées
  function bindLongPress() {
    // Sélectionne tous les éléments qui peuvent avoir un long press
    const elements = document.querySelectorAll(".histoire-card, .ui-button--primary");
    
    elements.forEach(element => {
      let pressTimer;
      let longPressTriggered = false;
      let startX, startY;
      const longPressDuration = 500; // Durée en ms pour considérer un appui long
      const moveThreshold = 10; // Seuil de mouvement en pixels pour annuler le long press
      
      // Gestionnaire pour le début du toucher
      const startTouch = (e) => {
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
          
          // Sélectionne l'histoire
          if (element.closest('li') && element.closest('li').dataset.id) {
            const histoireId = element.closest('li').dataset.id;
            handleLongPress(element);
          }
        }, longPressDuration);
      };
      
      // Gestionnaire pour la fin du toucher
      const endTouch = () => {
        // Annule le timer
        clearTimeout(pressTimer);
        
        // Le clic normal est géré par l'événement click standard
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
      element.addEventListener("touchstart", startTouch, { passive: true });
      element.addEventListener("touchend", endTouch);
      element.addEventListener("touchcancel", cancelTouch);
      element.addEventListener("touchmove", moveTouch, { passive: true });
      
      // Attache les gestionnaires d'événements pour souris
      element.addEventListener("mousedown", startTouch);
      element.addEventListener("mouseup", endTouch);
      element.addEventListener("mouseleave", cancelTouch);
      element.addEventListener("mousemove", moveTouch);
    });
  }

  function handleLongPress(element) {
    // Récupère l'ID de l'histoire
    const histoireId = element.dataset.id;
    if (!histoireId) return;
    
    // Affiche un menu contextuel pour l'histoire
    afficherMenuContextuelHistoire(element, histoireId);
  }

  function afficherMenuContextuelHistoire(element, histoireId) {
    // Crée le menu contextuel s'il n'existe pas
    let menu = document.getElementById("menu-contextuel-histoire");
    if (!menu) {
      menu = document.createElement("div");
      menu.id = "menu-contextuel-histoire";
      menu.className = "menu-contextuel";
      
      // Ajoute les options du menu
      const options = [
        { text: "Lire", icon: "📖", action: "lire" },
        { text: "Supprimer", icon: "🗑️", action: "supprimer" }
      ];
      
      options.forEach(option => {
        const item = document.createElement("div");
        item.className = "menu-item";
        item.dataset.action = option.action;
        
        const icon = document.createElement("span");
        icon.className = "menu-icon";
        icon.textContent = option.icon;
        
        const text = document.createElement("span");
        text.className = "menu-text";
        text.textContent = option.text;
        
        item.appendChild(icon);
        item.appendChild(text);
        menu.appendChild(item);
        
        // Ajoute le gestionnaire de clic
        item.addEventListener("click", () => {
          handleMenuAction(option.action, histoireId);
          fermerMenuContextuel();
        });
      });
      
      // Ajoute le menu au document
      document.body.appendChild(menu);
      
      // Ajoute un gestionnaire pour fermer le menu en cliquant ailleurs
      document.addEventListener("click", (e) => {
        if (!menu.contains(e.target) && e.target !== element) {
          fermerMenuContextuel();
        }
      });
    }
    
    // Met à jour l'ID de l'histoire dans le menu
    menu.dataset.histoireId = histoireId;
    
    // Positionne le menu près de l'élément
    const rect = element.getBoundingClientRect();
    menu.style.top = `${rect.bottom + window.scrollY}px`;
    menu.style.left = `${rect.left + window.scrollX}px`;
    
    // Affiche le menu
    menu.classList.add("show");
  }

  function fermerMenuContextuel() {
    const menu = document.getElementById("menu-contextuel-histoire");
    if (menu) {
      menu.classList.remove("show");
    }
  }

  function handleMenuAction(action, histoireId) {
    switch (action) {
      case "lire":
        if (MonHistoire.modules.stories && MonHistoire.modules.stories.display) {
          MonHistoire.modules.stories.display.afficherHistoireSauvegardee(histoireId);
        }
        break;
      case "supprimer":
        if (MonHistoire.modules.stories && MonHistoire.modules.stories.management) {
          MonHistoire.modules.stories.management.supprimerHistoire(histoireId);
        }
        break;
    }
  }

  function initNotificationListeners() {
    // Écouteur pour les changements de profil
    MonHistoire.events.on("profilChange", (nouveauProfil) => {
      // Mettre à jour l'indicateur de notification
      if (MonHistoire.modules.sharing) {
        setTimeout(() => {
          MonHistoire.modules.sharing.mettreAJourIndicateurNotification();
        }, 500);
      }
    });
    
    // Écouteur pour les nouvelles notifications
    MonHistoire.events.on("nouvelleNotification", (data) => {
      // Mettre à jour l'indicateur de notification
      if (MonHistoire.modules.sharing) {
        MonHistoire.modules.sharing.mettreAJourIndicateurNotification();
      }
    });
  }

  function protegerBouton(id, callback) {
    const bouton = document.getElementById(id);
    if (!bouton) return;
    
    // Remplace l'écouteur existant par un écouteur protégé
    bouton.removeEventListener("click", bouton._clickHandler); // Supprime l'ancien écouteur si présent
    
    // Crée un nouvel écouteur protégé
    bouton._clickHandler = async (event) => {
      // Si le bouton est déjà en cours de traitement, ignore le clic
      if (bouton.dataset.processing === "true") {
        console.log(`Clic ignoré sur ${id} - traitement en cours`);
        return;
      }
      
      // Marque le bouton comme étant en cours de traitement
      bouton.dataset.processing = "true";
      
      try {
        // Exécute le callback (qui peut être asynchrone)
        await callback(event);
      } catch (error) {
        console.error(`Erreur lors du traitement du clic sur ${id}:`, error);
      } finally {
        // Réinitialise l'état du bouton après un court délai
        // Le délai empêche les clics accidentels trop rapprochés
        setTimeout(() => {
          bouton.dataset.processing = "false";
        }, 500); // 500ms de protection
      }
    };
    
    // Ajoute le nouvel écouteur protégé
    bouton.addEventListener("click", bouton._clickHandler);
  }

  function bindEvents() {
    // Boutons de navigation
    document.querySelectorAll("[data-screen]").forEach(button => {
      button.addEventListener("click", () => {
        const screen = button.getAttribute("data-screen");
        if (MonHistoire.modules.core && MonHistoire.modules.core.navigation) {
          MonHistoire.modules.core.navigation.showScreen(screen);
        }
      });
    });
    
    
    // Formulaire de création d'histoire
    document.getElementById("form-generer-histoire")?.addEventListener("submit", (e) => {
      e.preventDefault(); // Empêche la redirection vers l'accueil
      if (MonHistoire.modules.stories && MonHistoire.modules.stories.generator) {
        MonHistoire.modules.stories.generator.genererHistoire();
      }
    });
    
    // Bouton Retour
    document.querySelectorAll(".btn-back").forEach(button => {
      button.addEventListener("click", () => {
        if (MonHistoire.modules.core && MonHistoire.modules.core.navigation) {
          MonHistoire.modules.core.navigation.goBack();
        }
      });
    });
    
    // Bouton Retour depuis l'écran résultat
    document.getElementById("btn-retour-resultat")?.addEventListener("click", () => {
      if (MonHistoire.modules.core && MonHistoire.modules.core.navigation) {
        MonHistoire.modules.core.navigation.retourDepuisResultat();
      }
    });
    
    // Bouton Sauvegarder Histoire (protégé contre les clics multiples)
    protegerBouton("btn-sauvegarde", () => {
      if (MonHistoire.modules.stories && MonHistoire.modules.stories.management) {
        const storyGetter =
          MonHistoire.modules.stories.display &&
          MonHistoire.modules.stories.display.getCurrentStory;
        const story = typeof storyGetter === "function" ? storyGetter() : null;
        MonHistoire.modules.stories.management.saveStory(story);
      }
    });
    
    // Bouton Audio (protégé contre les clics multiples)
    protegerBouton("btn-audio", () => {
      if (MonHistoire.modules.features && MonHistoire.modules.features.audio) {
        MonHistoire.modules.features.audio.gererClicBoutonAudio();
      }
    });
    
    // Bouton Export PDF (protégé contre les clics multiples)
    protegerBouton("btn-export-pdf", () => {
      if (MonHistoire.modules.features && MonHistoire.modules.features.export) {
        MonHistoire.modules.features.export.exporterHistoirePDF();
      }
    });
    
    // Bouton Partage (protégé contre les clics multiples)
    protegerBouton("btn-partage", () => {
      if (MonHistoire.modules.sharing) {
        MonHistoire.modules.sharing.ouvrirModalePartage();
      }
    });
  }

  // Initialisation du module
  function init() {
    bindEvents();
    bindLongPress();
    initNotificationListeners();
  }

  // API publique
  MonHistoire.modules.ui.common = {
    init: init,
    protegerBouton: protegerBouton,
    retirerProfil: function(id) {
      // Implémentation simplifiée pour l'exemple
      console.log("Retirer profil:", id);
    },
    modifierProfil: function(id, prenom) {
      // Implémentation simplifiée pour l'exemple
      console.log("Modifier profil:", id, prenom);
    }
  };
})();
