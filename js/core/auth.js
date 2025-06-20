// js/core/auth.js
// Gestion de l'authentification et des profils utilisateurs

// S'assurer que les objets nécessaires existent
window.MonHistoire = window.MonHistoire || {};
MonHistoire.core = MonHistoire.core || {};

// Module d'authentification
MonHistoire.core.auth = {
  // Initialisation du module
  init() {
    console.log("[DEBUG] Initialisation du module auth");
    
    // Vérifier si l'application est exécutée en mode local (file://)
    this.isLocalMode = window.location.protocol === 'file:';
    console.log("[DEBUG] Mode local détecté:", this.isLocalMode);
    
    // Avertir l'utilisateur si l'application est exécutée en mode local
    if (this.isLocalMode) {
      console.warn("[DEBUG] Application exécutée en mode local (file://). Certaines fonctionnalités Firebase Auth peuvent ne pas fonctionner correctement.");
    }
    
    // Vérifier l'état d'authentification actuel
    const user = firebase.auth().currentUser;
    console.log("[DEBUG] État d'authentification initial:", user ? "Connecté" : "Non connecté");
    if (user) {
      console.log("[DEBUG] Utilisateur connecté:", user.uid, user.email);
    }
    
    // Ajouter un écouteur pour les changements d'état d'authentification
    firebase.auth().onAuthStateChanged(user => {
      console.log("[DEBUG] Changement d'état d'authentification:", user ? "Connecté" : "Déconnecté");
      if (user) {
        console.log("[DEBUG] Nouvel utilisateur connecté:", user.uid, user.email);
      }
    });
  },
  
  // Vérifie si l'application est exécutée en mode local
  isRunningLocally() {
    return window.location.protocol === 'file:';
  },
  
  // Connexion utilisateur
  loginUser() {
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    
    if (!email || !password) {
      MonHistoire.showMessageModal("Merci de remplir tous les champs.");
      return;
    }

    // Firebase Auth
    firebase.auth().signInWithEmailAndPassword(email, password)
      .then((userCredential) => {
        this.afficherUtilisateurConnecté();
        this.logActivite("connexion"); // LOG : Connexion réussie
        MonHistoire.core.navigation.showScreen("accueil");
        
        // Initialiser le quota d'histoires
        if (MonHistoire.features && 
            MonHistoire.features.stories && 
            MonHistoire.features.stories.management) {
          MonHistoire.features.stories.management.initQuota();
        }
        
        if (MonHistoire.features && 
            MonHistoire.features.sharing) {
          MonHistoire.features.sharing.verifierHistoiresPartagees();
        }
        
        // Synchronisation des préférences de cookies
        if (MonHistoire.cookies) {
          MonHistoire.cookies.syncPreferences();
        }
      })
      .catch((error) => {
        const msg = MonHistoire.config.firebaseErrorMessages[error.code] || error.message;
        MonHistoire.showMessageModal(msg);
      });
  },
  
  // Déconnexion utilisateur
  logoutUser() {
    // Arrête l'écouteur d'histoires partagées avant la déconnexion
    if (MonHistoire.state.histoiresPartageesListener) {
      MonHistoire.state.histoiresPartageesListener();
      MonHistoire.state.histoiresPartageesListener = null;
    }

    return firebase.auth().signOut().then(() => {
      this.logActivite("deconnexion"); // LOG : Déconnexion
      this.afficherUtilisateurDéconnecté();
      this.fermerLogoutModal();
      
      // Utiliser le module profiles pour réinitialiser le profil actif
      if (MonHistoire.core && MonHistoire.core.profiles) {
        MonHistoire.core.profiles.passerAuProfilParent();
      } else {
        // Fallback si le module profiles n'est pas disponible
        MonHistoire.state.profilActif = { type: "parent" };
        localStorage.removeItem("profilActif");
      }
      
      // Réinitialiser le quota d'histoires
      if (MonHistoire.features && 
          MonHistoire.features.stories && 
          MonHistoire.features.stories.management) {
        MonHistoire.features.stories.management.initQuota();
      }
      
      MonHistoire.core.navigation.showScreen("accueil");
    }).catch(error => {
      console.error("Erreur lors de la déconnexion:", error);
      if (MonHistoire.showMessageModal) {
        MonHistoire.showMessageModal("Erreur lors de la déconnexion. Veuillez réessayer.");
      }
      throw error;
    });
  },
  
  // Inscription utilisateur
  registerUser() {
    const prenom = document.getElementById("prenom").value.trim();
    const email = document.getElementById("signup-email").value.trim();
    const password = document.getElementById("signup-password").value;
    const confirm = document.getElementById("signup-confirm").value;

    // Vérification consentement parental
    const consentCheckbox = document.getElementById("checkbox-consent");
    const consent = consentCheckbox ? consentCheckbox.checked : false;
    
    if (!consent) {
      MonHistoire.showMessageModal(
        'Merci de cocher la case de consentement parental.<br>Tu peux consulter les <a href="#" onclick="document.getElementById(\'modal-rgpd\').classList.add(\'show\');return false;">règles de vie privée</a> ici.'
      );
      return;
    }

    if (!prenom || !email || !password || !confirm) {
      MonHistoire.showMessageModal("Merci de remplir tous les champs.");
      return;
    }
    
    if (password !== confirm) {
      MonHistoire.showMessageModal("Les mots de passe ne correspondent pas.");
      return;
    }

    // Firebase Auth
    firebase.auth().createUserWithEmailAndPassword(email, password)
      .then((userCredential) => {
        const user = userCredential.user;
        // Stocke le consentement parental dans Firestore
        return firebase.firestore().collection("users").doc(user.uid).set({
          prenom: prenom,
          email: email,
          createdAt: new Date().toISOString(),
          consentement_parental: true
        });
      })
      .then(() => {
        this.logActivite("creation_compte");  // LOG : création de compte
        this.toggleSignup(false); // Ferme le formulaire d'inscription avant d'afficher le message
        MonHistoire.showMessageModal("Ton compte a bien été créé ! Tu peux maintenant te connecter.");
      })
      .catch((error) => {
        const msg = MonHistoire.config.firebaseErrorMessages[error.code] || error.message;
        MonHistoire.showMessageModal(msg);
      });
  },
  
  // Affiche l'utilisateur connecté
  afficherUtilisateurConnecté() {
    document.getElementById("user-icon").classList.remove("ui-hidden");
    document.getElementById("login-button").classList.add("ui-hidden");
    document.getElementById("my-stories-button").classList.remove("ui-hidden");
    if (MonHistoire.state.profilActif.type === "enfant" && MonHistoire.state.profilActif.acces_messagerie === false) {
      document.getElementById("my-messages-button").classList.add("ui-hidden");
    } else {
      document.getElementById("my-messages-button").classList.remove("ui-hidden");
    }

    // → Si un profil enfant est actif, on court-circuite tout :
    if (MonHistoire.state.profilActif.type === "enfant") {
      // On met directement l'initiale de l'enfant
      document.getElementById("user-icon").textContent = MonHistoire.state.profilActif.prenom
        .trim()
        .charAt(0)
        .toUpperCase();
      return; // on ne fait pas la requête Firestore parent
    }

    // Sinon, c'est le parent → on récupère son prénom dans Firestore
    const user = firebase.auth().currentUser;
    if (user) {
      firebase.firestore().collection("users").doc(user.uid).get()
        .then((doc) => {
          let initiale = "U"; // Valeur par défaut
          if (doc.exists && doc.data().prenom) {
            initiale = doc.data().prenom.trim().charAt(0).toUpperCase();
          } else if (user.email) {
            initiale = user.email.charAt(0).toUpperCase();
          }
          document.getElementById("user-icon").textContent = initiale;
        })
        .catch(() => {
          if (user.email) {
            document.getElementById("user-icon").textContent = user.email.charAt(0).toUpperCase();
          } else {
            document.getElementById("user-icon").textContent = "U";
          }
        });
    }
  },
  
  // Affiche l'utilisateur déconnecté
  afficherUtilisateurDéconnecté() {
    document.getElementById("user-icon").classList.add("ui-hidden");
    document.getElementById("login-button").classList.remove("ui-hidden");
    document.getElementById("my-stories-button").classList.add("ui-hidden");
    document.getElementById("my-messages-button").classList.add("ui-hidden");
  },
  
  // Ouvre la modale de déconnexion
  async ouvrirLogoutModal() {
    // Récupérer l'élément qui contiendra le prénom et la liste
    const nameEl = document.getElementById('logout-profile-name');
    const listEl = document.getElementById('logout-profiles-list');

    // Vider tout contenu précédent
    nameEl.textContent = "";
    listEl.innerHTML = "";

    const user = firebase.auth().currentUser;
    if (!user) {
      // Si pas d'utilisateur connecté, on ne fait rien et on ferme
      document.getElementById('logout-modal').classList.remove('show');
      return;
    }

    // Si le profil actif est "parent"
    if (MonHistoire.state.profilActif.type === "parent") {
      // Récupérer le prénom du parent dans Firestore (ou initiale si absent)
      let prenomParent = "";
      try {
        const docParent = await firebase.firestore()
          .collection("users")
          .doc(user.uid)
          .get();
        if (docParent.exists && docParent.data().prenom) {
          prenomParent = docParent.data().prenom;
        } else {
          prenomParent = user.email.charAt(0).toUpperCase();
        }
      } catch (e) {
        prenomParent = user.email ? user.email.charAt(0).toUpperCase() : "U";
      }
      
      // Afficher le prénom du parent en en-tête
      nameEl.textContent = prenomParent;

      // Lister chaque enfant avec un bouton bleu
      try {
        const enfantsSnap = await firebase.firestore()
          .collection("users")
          .doc(user.uid)
          .collection("profils_enfant")
          .get();
        
        enfantsSnap.forEach(docEnfant => {
          const data = docEnfant.data();
          const btn = document.createElement("button");
          btn.className = "ui-button ui-button--primary ui-button--full profile-item";
          btn.textContent = data.prenom;
          btn.style.marginBottom = "0.75em";
          btn.style.position = "relative"; // Pour positionner l'indicateur de notification
          btn.dataset.profilId = docEnfant.id; // Ajouter l'ID du profil comme attribut data
          btn.onclick = () => {
            // Utiliser le module profiles pour changer de profil
            if (MonHistoire.core && MonHistoire.core.profiles) {
              MonHistoire.core.profiles.passerAuProfilEnfant(docEnfant.id, data.prenom);
            }
            
            // Fermer la modale
            this.fermerLogoutModal();
            
            // Mettre à jour l'icône utilisateur
            document.getElementById("user-icon").textContent = data.prenom.charAt(0).toUpperCase();
            
            // Vérifier les histoires partagées
            if (MonHistoire.features && MonHistoire.features.sharing) {
              MonHistoire.features.sharing.verifierHistoiresPartagees();
            }
          };
          listEl.appendChild(btn);
        });
      } catch (e) {
        console.error("Erreur lecture profils enfants :", e);
      }
      
      // Mettre à jour les indicateurs de notification
      if (MonHistoire.features && MonHistoire.features.sharing) {
        setTimeout(() => {
          MonHistoire.features.sharing.mettreAJourIndicateurNotificationProfilsListe();
        }, 100);
      }

      // Afficher les boutons "Mon Compte" et "Déconnecter"
      document.getElementById("btn-mon-compte").style.display = "block";
      document.getElementById("btn-logout").style.display = "block";
    } 
    // Sinon, si le profil actif est "enfant"
    else {
      // Afficher le prénom de l'enfant en tête
      nameEl.textContent = MonHistoire.state.profilActif.prenom;

      // Afficher un bouton bleu "Parent" (pour repasser au parent)
      let prenomParent = "";
      try {
        const docParent = await firebase.firestore()
          .collection("users")
          .doc(user.uid)
          .get();
        if (docParent.exists && docParent.data().prenom) {
          prenomParent = docParent.data().prenom;
        } else {
          prenomParent = user.email.charAt(0).toUpperCase();
        }
      } catch (e) {
        prenomParent = user.email ? user.email.charAt(0).toUpperCase() : "U";
      }
      
      const btnParent = document.createElement("button");
      btnParent.className = "ui-button ui-button--primary ui-button--full profile-item";
      btnParent.textContent = prenomParent;
      btnParent.style.marginBottom = "0.75em";
      btnParent.style.position = "relative"; // Pour positionner l'indicateur de notification
      btnParent.dataset.profilId = "parent"; // Ajouter l'ID du profil comme attribut data
      btnParent.onclick = () => {
        // Fermer d'abord la modale de sélection de profil
        this.fermerLogoutModal();
        // Puis ouvrir la modale de saisie du mot de passe parent
        this.ouvrirModalMotDePasseParent();
      };
      listEl.appendChild(btnParent);

      // Afficher les autres enfants (sauf celui en cours)
      try {
        const enfantsSnap = await firebase.firestore()
          .collection("users")
          .doc(user.uid)
          .collection("profils_enfant")
          .get();
        
        enfantsSnap.forEach(docEnfant => {
          const data = docEnfant.data();
          // Ne pas afficher le profil actif
          if (docEnfant.id === MonHistoire.state.profilActif.id) return;
          
          const btn = document.createElement("button");
          btn.className = "ui-button ui-button--primary ui-button--full profile-item";
          btn.textContent = data.prenom;
          btn.style.marginBottom = "0.75em";
          btn.style.position = "relative"; // Pour positionner l'indicateur de notification
          btn.dataset.profilId = docEnfant.id; // Ajouter l'ID du profil comme attribut data
          btn.onclick = () => {
            // Utiliser le module profiles pour changer de profil
            if (MonHistoire.core && MonHistoire.core.profiles) {
              MonHistoire.core.profiles.passerAuProfilEnfant(docEnfant.id, data.prenom);
            }
            
            // Fermer la modale
            this.fermerLogoutModal();
            
            // Mettre à jour l'icône utilisateur
            document.getElementById("user-icon").textContent = data.prenom.charAt(0).toUpperCase();
            
            // Vérifier les histoires partagées
            if (MonHistoire.features && MonHistoire.features.sharing) {
              MonHistoire.features.sharing.verifierHistoiresPartagees();
            }
          };
          listEl.appendChild(btn);
        });
      } catch (e) {
        console.error("Erreur lecture autres profils enfants :", e);
      }
      
      // Mettre à jour les indicateurs de notification
      if (MonHistoire.features && MonHistoire.features.sharing) {
        setTimeout(() => {
          MonHistoire.features.sharing.mettreAJourIndicateurNotificationProfilsListe();
        }, 100);
      }

      // Masquer "Mon Compte" et "Déconnecter" quand un enfant est actif
      document.getElementById("btn-mon-compte").style.display = "none";
      document.getElementById("btn-logout").style.display = "none";
    }

    // Afficher la modale
    document.getElementById('logout-modal').classList.add('show');
  },
  
  // Ferme la modale de déconnexion/changement de profil
  fermerLogoutModal() {
    document.getElementById('logout-modal').classList.remove('show');
  },
  
  
  // Bascule l'affichage du formulaire d'inscription
  toggleSignup(show) {
    const signupForm = document.getElementById("signup-form");
    const resetForm = document.getElementById("reset-form");
    
    if (signupForm) signupForm.style.display = show ? "block" : "none";
    if (resetForm) resetForm.style.display = "none";
    
    console.log(`Formulaire d'inscription ${show ? 'affiché' : 'masqué'}`);
  },
  
  // Bascule l'affichage du formulaire de réinitialisation
  toggleReset(show) {
    const resetForm = document.getElementById("reset-form");
    const signupForm = document.getElementById("signup-form");
    
    if (resetForm) resetForm.style.display = show ? "block" : "none";
    if (signupForm) signupForm.style.display = "none";
    
    console.log(`Formulaire de réinitialisation ${show ? 'affiché' : 'masqué'}`);
  },
  
  // Envoie un email de réinitialisation de mot de passe
  sendReset() {
    const email = document.getElementById("reset-email").value.trim();
    if (!email) {
      MonHistoire.showMessageModal("Veuillez saisir votre adresse email.");
      return;
    }

    firebase.auth().sendPasswordResetEmail(email)
      .then(() => {
        MonHistoire.showMessageModal("Lien de réinitialisation envoyé !");
        this.toggleReset(false);
      })
      .catch((error) => {
        const msg = MonHistoire.config.firebaseErrorMessages[error.code] || error.message;
        MonHistoire.showMessageModal(msg);
      });
  },
  
  // Ouvre la modale "Mon Compte"
  ouvrirMonCompte() {
    const user = firebase.auth().currentUser;
    if (!user) return;
    
    firebase.firestore().collection("users").doc(user.uid).get()
      .then(doc => {
        document.getElementById('compte-prenom').value = doc.exists && doc.data().prenom ? doc.data().prenom : '';
        document.getElementById('compte-email').value = user.email || '';
        document.getElementById('modal-moncompte').classList.add('show');
        this.fermerLogoutModal();

        // Affiche le stock d'histoires dans la modale
        const quota = typeof MonHistoire.config.MAX_HISTOIRES !== 'undefined' ? MonHistoire.config.MAX_HISTOIRES : 5; // valeur par défaut
        firebase.firestore().collection("users").doc(user.uid).collection("stories").get()
          .then(snap => {
            document.getElementById("compte-stock-histoires").innerHTML =
              `Stock d'histoires : <b>${snap.size}</b> / ${quota}`;
          })
          .catch(() => {
            document.getElementById("compte-stock-histoires").innerHTML =
              `Stock d'histoires : <i>erreur de lecture</i>`;
          });
        
        // Initialiser les variables pour les profils enfants
        if (!MonHistoire.state.profilsEnfantModifies) {
          MonHistoire.state.profilsEnfantModifies = [];
        }
        
        // Afficher les profils enfants
        if (typeof MonHistoire.afficherProfilsEnfants === 'function') {
          MonHistoire.afficherProfilsEnfants();
        }
      });
  },
  
  // Ferme la modale "Mon Compte"
  fermerMonCompte() {
    const modal = document.getElementById("modal-moncompte");
    modal.classList.add("fade-out");

    setTimeout(() => {
      modal.classList.remove("fade-out");
      modal.classList.remove("show");
    }, 300); // correspond à la durée de l'animation CSS
  },
  
  // Modifie le prénom et l'adresse email dans Firebase
  modifierMonCompte() {
    const user = firebase.auth().currentUser;
    if (!user) return;
    
    const prenom = document.getElementById('compte-prenom').value.trim();
    const email = document.getElementById('compte-email').value.trim();
    
    if (!prenom || !email) {
      MonHistoire.showMessageModal("Merci de remplir tous les champs.");
      return;
    }
    
    // Vérifier s'il y a des modifications de profils enfants à enregistrer
    const hasChildProfileChanges = MonHistoire.state.profilsEnfantModifies && 
                                  MonHistoire.state.profilsEnfantModifies.length > 0;
    
    // Référence à la modale
    const modal = document.getElementById("modal-moncompte");
    
    // Si nous avons des modifications de profils enfants, les enregistrer d'abord
    // puis continuer avec les modifications du profil parent
    if (hasChildProfileChanges && typeof MonHistoire.enregistrerModificationsProfils === 'function') {
      // Nous allons gérer les modifications du profil parent après avoir enregistré les profils enfants
      // Cette fonction sera appelée par enregistrerModificationsProfils une fois terminée
      this.continuerModificationCompte(prenom, email, modal);

      // Enregistrer les modifications des profils enfants
      // Note: cette fonction va appeler continuerModificationCompte après avoir terminé
      MonHistoire.enregistrerModificationsProfils(true);
      return;
    }
    
    // Si pas de modifications de profils enfants, continuer directement avec les modifications du profil parent
    this.continuerModificationCompte(prenom, email, modal);
  },
  
  // Fonction pour continuer la modification du compte après avoir géré les profils enfants
  continuerModificationCompte(prenom, email, modal) {
    const user = firebase.auth().currentUser;
    if (!user) return;
    
    // Vérifier si l'application est exécutée en mode local (file://)
    if (this.isRunningLocally() && user.email !== email) {
      MonHistoire.showMessageModal(
        "Vous utilisez l'application en mode local (file://).<br><br>" +
        "La modification d'adresse email nécessite un serveur web.<br><br>" +
        "Veuillez utiliser un serveur local ou déployer l'application pour cette fonctionnalité.",
        { forceTop: true }
      );
      return;
    }
    
    // Si l'email est modifié, demander une ré-authentification
    if (user.email !== email) {
      this.ouvrirReauthentication(() => {
        this.effectuerModificationCompte(prenom, email, modal);
      });
      return;
    }
    
    // Sinon, procéder directement à la modification du prénom
    this.effectuerModificationCompte(prenom, email, modal);
  },
  
  // Effectue la modification du compte après ré-authentification si nécessaire
  effectuerModificationCompte(prenom, email, modal) {
    const user = firebase.auth().currentUser;
    if (!user) return;
    
    // Afficher un indicateur de chargement
    const loadingIndicator = document.createElement("div");
    loadingIndicator.id = "compte-loading";
    loadingIndicator.innerHTML = `
      <div class="loading-spinner"></div>
      <div class="loading-text">Enregistrement en cours...</div>
    `;
    loadingIndicator.style.position = "absolute";
    loadingIndicator.style.top = "50%";
    loadingIndicator.style.left = "50%";
    loadingIndicator.style.transform = "translate(-50%, -50%)";
    loadingIndicator.style.backgroundColor = "rgba(255, 255, 255, 0.9)";
    loadingIndicator.style.padding = "20px";
    loadingIndicator.style.borderRadius = "10px";
    loadingIndicator.style.zIndex = "1000";
    loadingIndicator.style.textAlign = "center";
    
    // Ajouter l'indicateur à la modale
    modal.appendChild(loadingIndicator);
    
    // Désactiver les boutons pendant le traitement
    const btnSave = document.getElementById("btn-save-account");
    const btnClose = document.getElementById("btn-close-account");
    if (btnSave) btnSave.disabled = true;
    if (btnClose) btnClose.disabled = true;
    
    // Précharger les données utilisateur pour éviter le temps de chargement visible plus tard
    let userDataPromise = firebase.firestore().collection("users").doc(user.uid).get();
    
    // Mettre à jour Firestore (prénom)
    firebase.firestore().collection("users").doc(user.uid).set(
      { prenom: prenom },
      { merge: true }
    )
    .then(() => {
      // Mettre à jour Firebase Auth (email) si changé
      if (user.email !== email) {
        // Au lieu d'updateEmail, utiliser verifyBeforeUpdateEmail
        // qui envoie un email de vérification à la nouvelle adresse
        return user.verifyBeforeUpdateEmail(email)
          .then(() => {
            // Stocker l'information qu'une vérification d'email est en cours
            localStorage.setItem("emailVerificationPending", "true");
            localStorage.setItem("newEmailAddress", email);
            
            // Fermer la modale avec animation
            modal.classList.add("fade-out");
            
            // Attendre la fin de l'animation avant de cacher complètement la modale
            setTimeout(() => {
              modal.classList.remove("fade-out");
              modal.classList.remove("show");
              
              // Afficher un message informant l'utilisateur qu'un email a été envoyé
              MonHistoire.showMessageModal(
                `Un email de vérification a été envoyé à <strong>${email}</strong>.<br><br>` +
                `Veuillez cliquer sur le lien dans cet email pour confirmer votre nouvelle adresse email.<br><br>` +
                `Votre adresse actuelle reste active jusqu'à la vérification.<br><br>` +
                `<strong>Important :</strong> Vous serez déconnecté après avoir cliqué sur le lien de vérification.`,
                {
                  delay: 100,
                  forceTop: true
                }
              );
            }, 300);
            
            // Retourner une promesse rejetée pour interrompre la chaîne normale
            // et éviter d'afficher le message "Modifications enregistrées"
            return Promise.reject({ skipErrorDisplay: true });
          });
      }
      return Promise.resolve();
    })
    .then(() => {
      this.logActivite("modification_prenom");
      
      // Attendre que les données utilisateur soient préchargées
      return userDataPromise;
    })
    .then((userDoc) => {
      // Supprimer l'indicateur de chargement
      if (loadingIndicator.parentNode) {
        loadingIndicator.parentNode.removeChild(loadingIndicator);
      }
      
      // Réactiver les boutons
      if (btnSave) btnSave.disabled = false;
      if (btnClose) btnClose.disabled = false;
      
      // Mettre à jour l'icône utilisateur avec les données préchargées
      let initiale = "U"; // Valeur par défaut
      if (userDoc.exists && userDoc.data().prenom) {
        initiale = userDoc.data().prenom.trim().charAt(0).toUpperCase();
      } else if (user.email) {
        initiale = user.email.charAt(0).toUpperCase();
      }
      document.getElementById("user-icon").textContent = initiale;
      
      // Fermer la modale avec animation
      modal.classList.add("fade-out");
      
      // Attendre la fin de l'animation avant de cacher complètement la modale
      setTimeout(() => {
        modal.classList.remove("fade-out");
        modal.classList.remove("show");
        
        // Afficher le message de confirmation après que la modale soit fermée
        // avec un léger délai et en forçant l'affichage au-dessus des autres modales
        MonHistoire.showMessageModal("Modifications enregistrées !", {
          delay: 100,
          forceTop: true
        });
      }, 300);
    })
    .catch(error => {
      // Supprimer l'indicateur de chargement
      if (loadingIndicator.parentNode) {
        loadingIndicator.parentNode.removeChild(loadingIndicator);
      }
      
      // Réactiver les boutons
      if (btnSave) btnSave.disabled = false;
      if (btnClose) btnClose.disabled = false;
      
      console.error("Erreur lors de la modification du compte:", error);
      
      // Récupérer le message d'erreur traduit si disponible
      let errorMessage = "Erreur : ";
      if (error.code && MonHistoire.config.firebaseErrorMessages[error.code]) {
        errorMessage += MonHistoire.config.firebaseErrorMessages[error.code];
      } else {
        errorMessage += error.message || error;
      }
      
      // Fermer d'abord la modale "Mon compte" avec animation
      modal.classList.add("fade-out");
      
      // Attendre la fin de l'animation avant de cacher complètement la modale
      // et d'afficher le message d'erreur
      setTimeout(() => {
        modal.classList.remove("fade-out");
        modal.classList.remove("show");
        
        // Afficher le message d'erreur après que la modale soit fermée
        // avec un léger délai et en forçant l'affichage au-dessus des autres modales
        MonHistoire.showMessageModal(errorMessage, {
          delay: 100,
          forceTop: true
        });
      }, 300);
    });
  },
  
  // Ouvre la modale de suppression de compte
  openDeleteAccountModal() {
    this.fermerMonCompte();
    this.fermerLogoutModal();
    document.getElementById('delete-account-modal').classList.add('show');
  },
  
  // Ferme la modale de suppression de compte
  closeDeleteAccountModal() {
    document.getElementById('delete-account-modal').classList.remove('show');
  },
  
  // Supprime le compte utilisateur
  deleteAccount() {
    const user = firebase.auth().currentUser;
    if (!user) {
      MonHistoire.showMessageModal("Aucun utilisateur connecté.");
      this.closeDeleteAccountModal();
      return;
    }
    
    this.logActivite("suppression_compte"); // LOG : suppression compte
    
    // Supprime les données Firestore associées (ex: profil)
    firebase.firestore().collection("users").doc(user.uid).delete()
      .catch(() => {}) // Ignore si déjà supprimé ou inexistant
      .finally(() => {
        // Supprime le compte Auth
        user.delete()
          .then(() => {
            this.closeDeleteAccountModal();
            MonHistoire.showMessageModal("Compte supprimé. Au revoir !");
            this.afficherUtilisateurDéconnecté();
            MonHistoire.core.navigation.showScreen("accueil");
          })
          .catch((error) => {
            if (error.code === "auth/requires-recent-login") {
              MonHistoire.showMessageModal("Pour des raisons de sécurité, veuillez vous reconnecter puis réessayer la suppression.");
            } else {
              MonHistoire.showMessageModal("Erreur lors de la suppression : " + error.message);
            }
            this.closeDeleteAccountModal();
          });
      });
  },
  
  // Log d'activité utilisateur
  logActivite(type, data = {}) {
    const user = firebase.auth().currentUser;
    if (!user) return;
    
    const entry = {
      type: type,
      timestamp: new Date().toISOString(),
      ...data
    };
    
    firebase.firestore()
      .collection("users")
      .doc(user.uid)
      .collection("logs")
      .add(entry)
      .catch(() => {}); // On ignore les erreurs pour ne jamais bloquer l'appli
  },
  
  // Bascule l'affichage du mot de passe
  togglePassword(inputId, eyeSpan) {
    const input = document.getElementById(inputId);
    if (!input) return;
    
    if (input.type === "password") {
      input.type = "text";
      eyeSpan.textContent = "🙈";
    } else {
      input.type = "password";
      eyeSpan.textContent = "👁️";
    }
  },
  
  // Ouvre la modale de ré-authentification
  ouvrirReauthentication(callback) {
    const modal = document.getElementById("modal-reauthentication");
    
    // Réinitialiser l'état
    document.getElementById("input-reauthentication-password").value = "";
    document.getElementById("reauthentication-error").style.display = "none";
    
    // Stocker le callback à appeler après ré-authentification réussie
    this.reauthenticationCallback = callback;
    
    // Ajouter les écouteurs d'événements
    document.getElementById("btn-cancel-reauthentication").onclick = () => this.fermerReauthentication();
    document.getElementById("btn-confirm-reauthentication").onclick = () => this.confirmerReauthentication();
    
    // Afficher la modale
    modal.classList.add("show");
  },
  
  // Ferme la modale de ré-authentification
  fermerReauthentication() {
    const modal = document.getElementById("modal-reauthentication");
    modal.classList.remove("show");
    this.reauthenticationCallback = null;
  },
  
  // Confirme la ré-authentification
  confirmerReauthentication() {
    const password = document.getElementById("input-reauthentication-password").value.trim();
    const user = firebase.auth().currentUser;
    
    if (!password) {
      document.getElementById("reauthentication-error").textContent = "Veuillez saisir votre mot de passe.";
      document.getElementById("reauthentication-error").style.display = "block";
      return;
    }
    
    // Créer les informations d'identification
    const credential = firebase.auth.EmailAuthProvider.credential(user.email, password);
    
    // Ré-authentifier l'utilisateur
    user.reauthenticateWithCredential(credential)
      .then(() => {
        // Fermer la modale
        this.fermerReauthentication();
        
        // Appeler le callback si défini
        if (this.reauthenticationCallback) {
          this.reauthenticationCallback();
        }
      })
      .catch((error) => {
        console.error("Erreur de ré-authentification:", error);
        
        // Afficher le message d'erreur
        let errorMessage = "Mot de passe incorrect.";
        if (error.code && MonHistoire.config.firebaseErrorMessages[error.code]) {
          errorMessage = MonHistoire.config.firebaseErrorMessages[error.code];
        }
        
        document.getElementById("reauthentication-error").textContent = errorMessage;
        document.getElementById("reauthentication-error").style.display = "block";
      });
  },
  
  // Ouvre la modale de saisie du mot de passe parent
  ouvrirModalMotDePasseParent() {
    const modal = document.getElementById("modal-password-parent");
    if (!modal) {
      console.error("Modale de mot de passe parent non trouvée");
      return;
    }
    
    // On remet l'état d'erreur à zéro
    const errorEl = document.getElementById("password-parent-error");
    if (errorEl) {
      errorEl.style.display = "none";
    }
    
    const inputEl = document.getElementById("input-password-parent");
    if (inputEl) {
      inputEl.value = "";
    }
    
    // Ajouter les écouteurs d'événements
    const btnCancel = document.getElementById("btn-cancel-password-parent");
    if (btnCancel) {
      btnCancel.onclick = () => this.fermerModalPasswordParent();
    }
    
    const btnConfirm = document.getElementById("btn-confirm-password-parent");
    if (btnConfirm) {
      btnConfirm.onclick = () => this.verifierMotdepasseParent();
    }

    // Ajoute la classe "show" pour afficher la modale
    modal.classList.add("show");
  },
  
  // Ferme la modale de saisie du mot de passe parent
  fermerModalPasswordParent() {
    const modal = document.getElementById("modal-password-parent");
    if (modal) {
      modal.classList.remove("show");
    }
  },
  
  // Vérifie le mot de passe parent et bascule vers le profil parent si correct
  async verifierMotdepasseParent() {
    const pwd = document.getElementById("input-password-parent").value.trim();
    const user = firebase.auth().currentUser;
    if (!user) return;
    
    if (!pwd) {
      // Champ vide → message d'erreur
      const errEl = document.getElementById("password-parent-error");
      if (errEl) {
        errEl.textContent = "Veuillez saisir votre mot de passe.";
        errEl.style.display = "block";
      }
      return;
    }

    // On ré-authentifie l'utilisateur pour vérifier le mot de passe
    const credential = firebase.auth.EmailAuthProvider.credential(user.email, pwd);
    try {
      await user.reauthenticateWithCredential(credential);
      
      // Succès : on repasse en mode parent
      const ancien = MonHistoire.state.profilActif.prenom;
      
      // Utiliser le module profiles pour passer au profil parent
      if (MonHistoire.core && MonHistoire.core.profiles) {
        MonHistoire.core.profiles.passerAuProfilParent();
      }
      
      // Log de l'activité
      this.logActivite("changement_profil", { 
        ancien: ancien || "enfant", 
        nouveau: "parent" 
      });
      
      // Mettre à jour l'icône utilisateur avec initiale parent
      firebase.firestore().collection("users").doc(user.uid).get()
        .then(doc => {
          const prenomParent = doc.exists && doc.data().prenom
            ? doc.data().prenom
            : user.email.charAt(0).toUpperCase();
          document.getElementById("user-icon").textContent = prenomParent.charAt(0).toUpperCase();
          
          // Vérifier les histoires partagées
          if (MonHistoire.features && MonHistoire.features.sharing) {
            MonHistoire.features.sharing.verifierHistoiresPartagees();
          }
        });
      
      // Fermer la modale
      this.fermerModalPasswordParent();
    } catch (error) {
      // Mot de passe incorrect : message d'erreur
      const errEl = document.getElementById("password-parent-error");
      if (errEl) {
        errEl.textContent = "Mot de passe incorrect !";
        errEl.style.display = "block";
      }
      
      // Log de la tentative
      this.logActivite("tentative_acces_parent");
    }
  }
};

// Exporter pour utilisation dans d'autres modules
window.MonHistoire = MonHistoire;
