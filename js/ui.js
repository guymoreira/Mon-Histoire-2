// js/ui.js
// Gestion de l'interface utilisateur et des interactions

// S'assurer que l'objet global existe
window.MonHistoire = window.MonHistoire || {};

// Module UI
MonHistoire.ui = {
  // Initialisation du module
  init() {
    // Initialise les gestionnaires d'événements
    this.bindEvents();
    
    // Initialise le long press pour les appareils mobiles
    this.bindLongPress();
  },
  
  // Attache les gestionnaires d'événements
  bindEvents() {
    // Boutons de navigation
    document.querySelectorAll("[data-screen]").forEach(button => {
      button.addEventListener("click", () => {
        const screen = button.getAttribute("data-screen");
        if (MonHistoire.core && MonHistoire.core.navigation) {
          MonHistoire.core.navigation.showScreen(screen);
        }
      });
    });
    
    // Gestionnaires pour les profils enfants
    this.bindProfilsEnfantsEvents();
    
    // Formulaire de création d'histoire
    document.getElementById("form-generer-histoire")?.addEventListener("submit", (e) => {
      e.preventDefault(); // Empêche la redirection vers l'accueil
      if (MonHistoire.features && 
          MonHistoire.features.stories && 
          MonHistoire.features.stories.generator) {
        MonHistoire.features.stories.generator.genererHistoire();
      }
    });
    
    // Bouton Retour
    document.querySelectorAll(".btn-back").forEach(button => {
      button.addEventListener("click", () => {
        if (MonHistoire.core && MonHistoire.core.navigation) {
          MonHistoire.core.navigation.goBack();
        }
      });
    });
    
    // Bouton Retour depuis l'écran résultat
    document.getElementById("btn-retour-resultat")?.addEventListener("click", () => {
      if (MonHistoire.core && MonHistoire.core.navigation) {
        MonHistoire.core.navigation.retourDepuisResultat();
      }
    });
    
    // Bouton Générer Histoire
    document.getElementById("btn-generer")?.addEventListener("click", () => {
      if (MonHistoire.features && 
          MonHistoire.features.stories && 
          MonHistoire.features.stories.generator) {
        MonHistoire.features.stories.generator.genererHistoire();
      }
    });
    
    // Bouton Sauvegarder Histoire
    document.getElementById("btn-sauvegarde")?.addEventListener("click", () => {
      if (MonHistoire.features && 
          MonHistoire.features.stories && 
          MonHistoire.features.stories.management) {
        MonHistoire.features.stories.management.sauvegarderHistoire();
      }
    });
    
    // Bouton Audio
    document.getElementById("btn-audio")?.addEventListener("click", () => {
      if (MonHistoire.features && MonHistoire.features.audio) {
        MonHistoire.features.audio.gererClicBoutonAudio();
      }
    });
    
    // Bouton Export PDF
    document.getElementById("btn-export-pdf")?.addEventListener("click", () => {
      if (MonHistoire.features && MonHistoire.features.export) {
        MonHistoire.features.export.exporterHistoirePDF();
      }
    });
    
    // Bouton Partage
    document.getElementById("btn-partage")?.addEventListener("click", () => {
      if (MonHistoire.features && MonHistoire.features.sharing) {
        MonHistoire.features.sharing.ouvrirModalePartage();
      }
    });
    
    // Bouton Fermer Modale Partage
    document.getElementById("btn-fermer-partage")?.addEventListener("click", () => {
      if (MonHistoire.features && MonHistoire.features.sharing) {
        MonHistoire.features.sharing.fermerModalePartage();
      }
    });
    
    
    // Bouton Connexion
    document.getElementById("login-button")?.addEventListener("click", () => {
      if (MonHistoire.core && MonHistoire.core.navigation) {
        MonHistoire.core.navigation.showScreen("connexion");
      }
    });
    
    // Bouton Utilisateur (profil)
    document.getElementById("user-icon")?.addEventListener("click", () => {
      if (MonHistoire.core && MonHistoire.core.auth) {
        MonHistoire.core.auth.ouvrirLogoutModal();
      }
    });
    
    // Bouton Mon Compte dans la modale de déconnexion
    document.getElementById("btn-mon-compte")?.addEventListener("click", () => {
      if (MonHistoire.core && MonHistoire.core.auth) {
        MonHistoire.core.auth.ouvrirMonCompte();
      }
    });
    
    // Bouton Annuler dans la modale de déconnexion
    document.getElementById("btn-fermer-logout")?.addEventListener("click", () => {
      if (MonHistoire.core && MonHistoire.core.auth) {
        MonHistoire.core.auth.fermerLogoutModal();
      }
    });
    
    // Bouton Déconnecter dans la modale de déconnexion
    document.getElementById("btn-logout")?.addEventListener("click", () => {
      if (MonHistoire.core && MonHistoire.core.auth) {
        MonHistoire.core.auth.logoutUser();
      }
    });
    
    // Formulaire de connexion
    document.getElementById("login-form")?.addEventListener("submit", (e) => {
      e.preventDefault();
      if (MonHistoire.core && MonHistoire.core.auth) {
        MonHistoire.core.auth.loginUser();
      }
    });
    
    // Bouton Inscription
    document.getElementById("btn-signup")?.addEventListener("click", () => {
      if (MonHistoire.core && MonHistoire.core.auth) {
        MonHistoire.core.auth.toggleSignup(true);
      }
    });
    
    // Formulaire d'inscription
    document.getElementById("signup-form")?.addEventListener("submit", (e) => {
      e.preventDefault();
      if (MonHistoire.core && MonHistoire.core.auth) {
        MonHistoire.core.auth.registerUser();
      }
    });
    
    // Bouton d'inscription (pour s'assurer qu'il fonctionne aussi)
    const btnRegister = document.getElementById("btn-register");
    if (btnRegister) {
      btnRegister.addEventListener("click", (e) => {
        e.preventDefault();
        console.log("[DEBUG] Clic sur le bouton d'inscription");
        if (MonHistoire.core && MonHistoire.core.auth) {
          MonHistoire.core.auth.registerUser();
        } else {
          console.error("[ERROR] Module auth non disponible pour l'inscription");
        }
      });
    } else {
      console.warn("[WARN] Bouton d'inscription non trouvé dans le DOM");
    }
    
    // Bouton Mot de passe oublié
    document.getElementById("btn-forgot")?.addEventListener("click", () => {
      if (MonHistoire.core && MonHistoire.core.auth) {
        MonHistoire.core.auth.toggleReset(true);
      }
    });
    
    // Formulaire de réinitialisation de mot de passe
    document.getElementById("reset-form")?.addEventListener("submit", (e) => {
      e.preventDefault();
      if (MonHistoire.core && MonHistoire.core.auth) {
        MonHistoire.core.auth.sendReset();
      }
    });
    
    // Bouton de réinitialisation (pour s'assurer qu'il fonctionne aussi)
    const btnSendReset = document.getElementById("btn-send-reset");
    if (btnSendReset) {
      btnSendReset.addEventListener("click", (e) => {
        e.preventDefault();
        console.log("[DEBUG] Clic sur le bouton de réinitialisation");
        if (MonHistoire.core && MonHistoire.core.auth) {
          MonHistoire.core.auth.sendReset();
        } else {
          console.error("[ERROR] Module auth non disponible pour la réinitialisation");
        }
      });
    } else {
      console.warn("[WARN] Bouton de réinitialisation non trouvé dans le DOM");
    }
    
    // Bouton Retour vers connexion depuis inscription
    document.getElementById("btn-back-to-login")?.addEventListener("click", () => {
      if (MonHistoire.core && MonHistoire.core.auth) {
        MonHistoire.core.auth.toggleSignup(false);
      }
    });
    
    // Bouton Retour vers connexion depuis réinitialisation
    document.getElementById("btn-back-to-login-reset")?.addEventListener("click", () => {
      if (MonHistoire.core && MonHistoire.core.auth) {
        MonHistoire.core.auth.toggleReset(false);
      }
    });
    
    // Bouton Fermer Message Modal
    document.getElementById("close-message-modal")?.addEventListener("click", () => {
      MonHistoire.closeMessageModal();
    });
    
    // Bouton Fermer RGPD Modal
    document.getElementById("close-rgpd-modal")?.addEventListener("click", () => {
      document.getElementById("modal-rgpd").classList.remove("show");
    });
    
    // Boutons de la bannière de cookies
    document.getElementById("cookie-accept-all")?.addEventListener("click", () => {
      if (MonHistoire.features && MonHistoire.features.cookies) {
        MonHistoire.features.cookies.accepterTousCookies();
      }
    });
    
    document.getElementById("cookie-customize")?.addEventListener("click", () => {
      if (MonHistoire.features && MonHistoire.features.cookies) {
        MonHistoire.features.cookies.ouvrirParametresCookies();
      }
    });
    
    // Lien des paramètres de cookies dans le footer
    document.getElementById("cookie-settings-link")?.addEventListener("click", (e) => {
      e.preventDefault();
      if (MonHistoire.features && MonHistoire.features.cookies) {
        MonHistoire.features.cookies.ouvrirParametresCookies();
      }
    });
    
    // Bouton de sauvegarde des préférences de cookies
    document.getElementById("cookie-save")?.addEventListener("click", () => {
      if (MonHistoire.features && MonHistoire.features.cookies) {
        MonHistoire.features.cookies.sauvegarderPreferences();
      }
    });
    
    
    // Bouton Sauvegarder Modifications Compte
    document.getElementById("btn-save-account")?.addEventListener("click", () => {
      if (MonHistoire.core && MonHistoire.core.auth) {
        MonHistoire.core.auth.modifierMonCompte();
      }
    });
    
    // Bouton Fermer Mon Compte
    document.getElementById("btn-close-account")?.addEventListener("click", () => {
      if (MonHistoire.core && MonHistoire.core.auth) {
        MonHistoire.core.auth.fermerMonCompte();
      }
    });
    
    // Bouton Supprimer Compte
    document.getElementById("btn-delete-account")?.addEventListener("click", () => {
      if (MonHistoire.core && MonHistoire.core.auth) {
        MonHistoire.core.auth.openDeleteAccountModal();
      }
    });
    
    // Bouton Confirmer Suppression Compte
    document.getElementById("btn-confirm-delete-account")?.addEventListener("click", () => {
      if (MonHistoire.core && MonHistoire.core.auth) {
        MonHistoire.core.auth.deleteAccount();
      }
    });
    
    // Bouton Annuler Suppression Compte
    document.getElementById("btn-cancel-delete-account")?.addEventListener("click", () => {
      if (MonHistoire.core && MonHistoire.core.auth) {
        MonHistoire.core.auth.closeDeleteAccountModal();
      }
    });
    
    
    // Boutons de la modale de ré-authentification
    document.getElementById("btn-cancel-reauthentication")?.addEventListener("click", () => {
      if (MonHistoire.core && MonHistoire.core.auth) {
        MonHistoire.core.auth.fermerReauthentication();
      }
    });
    
    document.getElementById("btn-confirm-reauthentication")?.addEventListener("click", () => {
      if (MonHistoire.core && MonHistoire.core.auth) {
        MonHistoire.core.auth.confirmerReauthentication();
      }
    });
    
    // Boutons de la modale de mot de passe parent
    document.getElementById("btn-cancel-password-parent")?.addEventListener("click", () => {
      if (MonHistoire.core && MonHistoire.core.auth) {
        MonHistoire.core.auth.fermerModalPasswordParent();
      }
    });
    
    document.getElementById("btn-confirm-password-parent")?.addEventListener("click", () => {
      if (MonHistoire.core && MonHistoire.core.auth) {
        MonHistoire.core.auth.verifierMotdepasseParent();
      }
    });
    
    // Boutons Toggle Password
    document.querySelectorAll(".toggle-password").forEach(button => {
      button.addEventListener("click", () => {
        const inputId = button.getAttribute("data-input");
        if (MonHistoire.core && MonHistoire.core.auth) {
          MonHistoire.core.auth.togglePassword(inputId, button);
        }
      });
    });
  },
  
  // Initialise le long press pour les appareils mobiles
  bindLongPress() {
    // Sélectionne tous les éléments qui peuvent avoir un long press
    const elements = document.querySelectorAll(".histoire-card, .button-blue");
    
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
            this.handleLongPress(element);
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
  },
  
  // Gère le long press sur un élément
  handleLongPress(element) {
    // Récupère l'ID de l'histoire
    const histoireId = element.dataset.id;
    if (!histoireId) return;
    
    // Affiche un menu contextuel pour l'histoire
    this.afficherMenuContextuelHistoire(element, histoireId);
  },
  
  // Affiche un menu contextuel pour une histoire
  afficherMenuContextuelHistoire(element, histoireId) {
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
          this.handleMenuAction(option.action, histoireId);
          this.fermerMenuContextuel();
        });
      });
      
      // Ajoute le menu au document
      document.body.appendChild(menu);
      
      // Ajoute un gestionnaire pour fermer le menu en cliquant ailleurs
      document.addEventListener("click", (e) => {
        if (!menu.contains(e.target) && e.target !== element) {
          this.fermerMenuContextuel();
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
  },
  
  // Ferme le menu contextuel
  fermerMenuContextuel() {
    const menu = document.getElementById("menu-contextuel-histoire");
    if (menu) {
      menu.classList.remove("show");
    }
  },
  
  // Gère les actions du menu contextuel
  handleMenuAction(action, histoireId) {
    switch (action) {
      case "lire":
        if (MonHistoire.features && 
            MonHistoire.features.stories && 
            MonHistoire.features.stories.display) {
          MonHistoire.features.stories.display.afficherHistoireSauvegardee(histoireId);
        }
        break;
      case "supprimer":
        if (MonHistoire.features && 
            MonHistoire.features.stories && 
            MonHistoire.features.stories.management) {
          MonHistoire.features.stories.management.supprimerHistoire(histoireId);
        }
        break;
    }
  },
  
  // Attache les gestionnaires d'événements pour les profils enfants
  bindProfilsEnfantsEvents() {
    // Bouton Ajouter un profil enfant
    document.getElementById("btn-ajouter-enfant")?.addEventListener("click", () => {
      this.ouvrirFormAjoutEnfant();
    });
    
    // Bouton Valider l'ajout d'un profil enfant
    document.getElementById("btn-valider-ajout-enfant")?.addEventListener("click", () => {
      this.validerAjoutEnfant();
    });
    
    // Bouton Annuler l'ajout d'un profil enfant
    document.getElementById("btn-annuler-ajout-enfant")?.addEventListener("click", () => {
      this.annulerAjoutEnfant();
    });
    
    // Boutons de la modale de renommage de profil
    document.getElementById("btn-annuler-renommer-profil")?.addEventListener("click", () => {
      this.fermerModaleRenommerProfil();
    });
    
    document.getElementById("btn-confirmer-renommer-profil")?.addEventListener("click", () => {
      this.confirmerRenommerProfil();
    });
  },
  
  // Ouvre le formulaire d'ajout d'un profil enfant
  ouvrirFormAjoutEnfant() {
    const form = document.getElementById("form-ajout-enfant");
    if (!form) return;
    
    form.classList.remove("fade-in"); // au cas où
    void form.offsetWidth; // forcer le redémarrage d'animation
    form.classList.add("fade-in");
    form.style.display = "block";
  },
  
  // Annule l'ajout d'un profil enfant
  annulerAjoutEnfant() {
    const form = document.getElementById("form-ajout-enfant");
    if (!form) return;
    
    form.classList.remove("fade-in");
    form.classList.add("fade-out");
    
    setTimeout(() => {
      form.style.display = "none";
      form.classList.remove("fade-out");
      
      // Réinitialiser le champ
      const input = document.getElementById("input-prenom-enfant");
      if (input) input.value = "";
    }, 250);
  },
  
  // Valide l'ajout d'un profil enfant
  validerAjoutEnfant() {
    const user = firebase.auth().currentUser;
    if (!user) return;
    
    const input = document.getElementById("input-prenom-enfant");
    if (!input) return;
    
    const prenom = input.value.trim();
    if (!prenom) {
      MonHistoire.showMessageModal("Le prénom ne peut pas être vide.");
      return;
    }
    
    // Créer un nouveau document dans la collection profils_enfant
    const ref = firebase.firestore()
      .collection("users").doc(user.uid)
      .collection("profils_enfant").doc();
    
    ref.set({
      prenom: prenom,
      createdAt: new Date().toISOString(),
      nb_histoires: 0
    }).then(() => {
      // Masquer le formulaire
      this.annulerAjoutEnfant();
      
      // Rafraîchir la liste des profils
      this.afficherProfilsEnfants();
      
      // Log de l'activité
      if (MonHistoire.core && MonHistoire.core.auth) {
        MonHistoire.core.auth.logActivite("creation_profil_enfant", { prenom: prenom });
      }
    }).catch(error => {
      console.error("Erreur lors de la création du profil enfant:", error);
      MonHistoire.showMessageModal("Erreur lors de la création du profil enfant.");
    });
  },
  
  // Affiche la liste des profils enfants dans la modale Mon Compte
  afficherProfilsEnfants() {
    const user = firebase.auth().currentUser;
    if (!user) return;
    
    const liste = document.getElementById("liste-profils-enfants");
    if (!liste) return;
    
    // Vider la liste
    liste.innerHTML = "";
    
    // Récupérer les profils enfants
    firebase.firestore()
      .collection("users").doc(user.uid)
      .collection("profils_enfant")
      .get()
      .then(snapshot => {
        let count = 0;
        const promises = [];
        
        snapshot.forEach(doc => {
          const data = doc.data();
          count++;
          
          // Récupérer le nombre réel d'histoires pour ce profil enfant
          const storiesRef = firebase.firestore()
            .collection("users")
            .doc(user.uid)
            .collection("profils_enfant")
            .doc(doc.id)
            .collection("stories");
          
          const promise = storiesRef.get()
            .then(storiesSnapshot => {
              const nbHistoires = storiesSnapshot.size;
              
              // Si le nombre d'histoires dans Firestore est différent de celui dans le profil,
              // mettre à jour le profil
              if (nbHistoires !== (data.nb_histoires || 0)) {
                const profilRef = firebase.firestore()
                  .collection("users")
                  .doc(user.uid)
                  .collection("profils_enfant")
                  .doc(doc.id);
                
                return profilRef.update({
                  nb_histoires: nbHistoires
                })
                .then(() => {
                  // Retourner le nombre réel d'histoires
                  return {
                    id: doc.id,
                    prenom: data.prenom,
                    nb_histoires: nbHistoires
                  };
                })
                .catch(error => {
                  console.error("Erreur lors de la mise à jour du compteur nb_histoires:", error);
                  // En cas d'erreur, retourner les données originales
                  return {
                    id: doc.id,
                    prenom: data.prenom,
                    nb_histoires: data.nb_histoires || 0
                  };
                });
              }
              
              // Si le nombre d'histoires est correct, retourner les données originales
              return {
                id: doc.id,
                prenom: data.prenom,
                nb_histoires: data.nb_histoires || 0
              };
            })
            .catch(error => {
              console.error("Erreur lors de la récupération des histoires:", error);
              // En cas d'erreur, retourner les données originales
              return {
                id: doc.id,
                prenom: data.prenom,
                nb_histoires: data.nb_histoires || 0
              };
            });
          
          promises.push(promise);
        });
        
        // Attendre que toutes les promesses soient résolues
        return Promise.all(promises)
          .then(results => {
            // Afficher les profils avec les nombres d'histoires mis à jour
            results.forEach(result => {
              const li = document.createElement("li");
              li.className = "ligne-profil";
              li.setAttribute("data-id", result.id);
              
              li.innerHTML = `
                <span class="prenom">${result.prenom}</span>
                <span class="quota">${result.nb_histoires}/${MonHistoire.config.MAX_HISTOIRES || 5}</span>
                <img src="corbeille-cartoon.png" alt="Supprimer" class="btn-corbeille" onclick="MonHistoire.ui.retirerProfil('${result.id}')">
                <button type="button" class="btn-edit" onclick="MonHistoire.ui.modifierProfil('${result.id}', '${result.prenom}')">✏️</button>
              `;
              
              liste.appendChild(li);
            });
            
            // Masquer bouton d'ajout si 2 profils ou plus
            const btnAjouter = document.getElementById("btn-ajouter-enfant");
            if (btnAjouter) {
              btnAjouter.style.display = (count >= 2) ? "none" : "inline-block";
            }
          });
      })
      .catch(error => {
        console.error("Erreur lors de la récupération des profils enfants:", error);
      });
  },
  
  // Retire un profil enfant (marque pour suppression)
  retirerProfil(id) {
    if (!id) return;
    
    // Marquer le profil pour suppression
    if (!MonHistoire.state.profilsEnfantModifies) {
      MonHistoire.state.profilsEnfantModifies = [];
    }
    
    MonHistoire.state.profilsEnfantModifies.push({ action: "supprimer", id });
    
    // Masquer visuellement la ligne
    const ligne = document.querySelector(`#liste-profils-enfants .ligne-profil[data-id="${id}"]`);
    if (ligne) {
      ligne.style.display = "none";
    }
  },
  
  // Ouvre la modale de modification d'un profil enfant
  modifierProfil(id, prenomActuel) {
    if (!id || !prenomActuel) return;
    
    // Stocker l'ID du profil à modifier
    MonHistoire.state.idProfilEnfantActif = id;
    
    // Remplir le champ avec le prénom actuel
    const input = document.getElementById("input-nouveau-prenom");
    if (input) {
      input.value = prenomActuel;
    }
    
    // Afficher la modale
    const modal = document.getElementById("modal-renommer-profil");
    if (modal) {
      modal.classList.add("show");
    }
  },
  
  // Ferme la modale de modification d'un profil enfant
  fermerModaleRenommerProfil() {
    const modal = document.getElementById("modal-renommer-profil");
    if (modal) {
      modal.classList.remove("show");
    }
    
    // Réinitialiser l'ID du profil actif
    MonHistoire.state.idProfilEnfantActif = null;
  },
  
  // Confirme la modification d'un profil enfant
  confirmerRenommerProfil() {
    const nouveauPrenom = document.getElementById("input-nouveau-prenom")?.value.trim();
    if (!nouveauPrenom) {
      MonHistoire.showMessageModal("Le prénom ne peut pas être vide.");
      return;
    }
    
    const id = MonHistoire.state.idProfilEnfantActif;
    if (!id) return;
    
    // Marquer le profil pour modification
    if (!MonHistoire.state.profilsEnfantModifies) {
      MonHistoire.state.profilsEnfantModifies = [];
    }
    
    MonHistoire.state.profilsEnfantModifies.push({ 
      action: "modifier", 
      id: id, 
      nouveauPrenom: nouveauPrenom 
    });
    
    // Mise à jour visuelle immédiate
    const element = document.querySelector(`#liste-profils-enfants .ligne-profil[data-id="${id}"] .prenom`);
    if (element) {
      element.textContent = nouveauPrenom;
    }
    
    // Fermer la modale
    this.fermerModaleRenommerProfil();
  },
  
  // Enregistre les modifications des profils enfants
  enregistrerModificationsProfils(continueWithParentProfile = false) {
    const user = firebase.auth().currentUser;
    if (!user) return;
    
    // Vérifier s'il y a des modifications à enregistrer
    if (!MonHistoire.state.profilsEnfantModifies || MonHistoire.state.profilsEnfantModifies.length === 0) {
      // Si aucune modification mais qu'on doit continuer avec le profil parent
      if (continueWithParentProfile && MonHistoire.core && MonHistoire.core.auth) {
        // Ne pas fermer la modale, laisser continuerModificationCompte s'en charger
        return;
      }
      
      // Sinon, fermer simplement la modale
      if (MonHistoire.core && MonHistoire.core.auth) {
        MonHistoire.core.auth.fermerMonCompte();
      }
      return;
    }
    
    // Créer un batch pour les opérations Firestore
    const batch = firebase.firestore().batch();
    const ref = firebase.firestore().collection("users").doc(user.uid).collection("profils_enfant");
    
    // Appliquer les modifications
    MonHistoire.state.profilsEnfantModifies.forEach(modif => {
      if (modif.action === "supprimer") {
        batch.delete(ref.doc(modif.id));
        
        // Log de l'activité
        if (MonHistoire.core && MonHistoire.core.auth) {
          MonHistoire.core.auth.logActivite("suppression_profil_enfant", { id_enfant: modif.id });
        }
      }
      
      if (modif.action === "modifier") {
        batch.update(ref.doc(modif.id), { prenom: modif.nouveauPrenom });
        
        // Log de l'activité
        if (MonHistoire.core && MonHistoire.core.auth) {
          MonHistoire.core.auth.logActivite("modification_prenom_profil", { id_enfant: modif.id });
        }
      }
    });
    
    // Exécuter le batch
    batch.commit().then(() => {
      // Réinitialiser les modifications
      MonHistoire.state.profilsEnfantModifies = [];
      
      // Rafraîchir la liste des profils
      this.afficherProfilsEnfants();
      
      // Si on doit continuer avec le profil parent, ne pas fermer la modale
      if (continueWithParentProfile) {
        return;
      }
      
      // Sinon, masquer le formulaire d'ajout s'il est visible
      const form = document.getElementById("form-ajout-enfant");
      if (form && form.style.display !== "none") {
        form.classList.remove("fade-in");
        form.classList.add("fade-out");
        
        // Attendre la fin du fondu avant de fermer la modale principale
        setTimeout(() => {
          form.style.display = "none";
          form.classList.remove("fade-out");
          
          // Fermer la modale Mon Compte
          if (MonHistoire.core && MonHistoire.core.auth) {
            MonHistoire.core.auth.fermerMonCompte();
          }
          
          // Afficher un message de confirmation
          setTimeout(() => {
            MonHistoire.showMessageModal("Modifications enregistrées !");
          }, 100);
        }, 250);
      } else {
        // Fermer directement la modale Mon Compte
        if (MonHistoire.core && MonHistoire.core.auth) {
          MonHistoire.core.auth.fermerMonCompte();
        }
        
        // Afficher un message de confirmation
        setTimeout(() => {
          MonHistoire.showMessageModal("Modifications enregistrées !");
        }, 100);
      }
    }).catch(error => {
      console.error("Erreur lors de l'enregistrement des modifications:", error);
      MonHistoire.showMessageModal("Erreur lors de l'enregistrement des modifications.");
    });
  }
};

// Exporter pour utilisation dans d'autres modules
window.MonHistoire = MonHistoire;
