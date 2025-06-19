// js/adapters/profiles-adapter.js
// Adaptateur pour les fonctions liées aux profils et aux modales

(function() {
  console.log("Initialisation de l'adaptateur Profiles");
  
  // Vérifier que les namespaces nécessaires existent
  window.MonHistoire = window.MonHistoire || {};
  MonHistoire.modules = MonHistoire.modules || {};
  MonHistoire.modules.user = MonHistoire.modules.user || {};
  
  // Variables globales pour l'adaptateur
  window.profilsEnfantModifies = [];
  window.idProfilEnfantActif = null;
  
  // Ouvrir la modale de déconnexion/profil
  if (typeof MonHistoire.ouvrirLogoutModal !== 'function') {
    MonHistoire.ouvrirLogoutModal = async function() {
      console.log("[Adapter] Exécution de ouvrirLogoutModal");
      
      const nameEl = document.getElementById('logout-profile-name');
      const listEl = document.getElementById('logout-profiles-list');
      const modal = document.getElementById('logout-modal');

      // Vider tout contenu précédent
      if (nameEl) nameEl.textContent = "";
      if (listEl) listEl.innerHTML = "";

      const user = firebase.auth().currentUser;
      if (!user) {
        if (modal) modal.classList.remove('show');
        return;
      }

      // Récupérer le profil actif depuis le localStorage
      let profilActif = localStorage.getItem("profilActif")
        ? JSON.parse(localStorage.getItem("profilActif"))
        : { type: "parent" };

      try {
        // Récupérer les informations du parent
        const docParent = await firebase.firestore()
          .collection("users")
          .doc(user.uid)
          .get();
        
        const prenomParent = docParent.exists && docParent.data().prenom 
          ? docParent.data().prenom 
          : user.email.charAt(0).toUpperCase();
        
        // Si profil parent actif
        if (profilActif.type === "parent") {
          if (nameEl) nameEl.textContent = prenomParent;
          
          // Afficher les profils enfants
          const enfantsSnap = await firebase.firestore()
            .collection("users")
            .doc(user.uid)
            .collection("profils_enfant")
            .get();
          
          if (listEl) {
            enfantsSnap.forEach(docEnfant => {
              const data = docEnfant.data();
              const btn = document.createElement("button");
              btn.className = "ui-button ui-button--primary";
              btn.textContent = data.prenom;
              btn.style.marginBottom = "0.75em";
              btn.onclick = () => {
                // Changer de profil
                localStorage.setItem("profilActif", JSON.stringify({
                  type: "enfant",
                  id: docEnfant.id,
                  prenom: data.prenom
                }));
                
                MonHistoire.fermerLogoutModal();
                
                // Mettre à jour l'UI
                const userIcon = document.getElementById("user-icon");
                if (userIcon) userIcon.textContent = data.prenom.charAt(0).toUpperCase();
              };
              listEl.appendChild(btn);
            });
          }
          
          // Afficher les boutons "Mon Compte" et "Déconnecter"
          const btnMonCompte = document.querySelector("#logout-modal button#btn-mon-compte");
          const btnLogout = document.querySelector("#logout-modal button#btn-logout");
          
          if (btnMonCompte) btnMonCompte.style.display = "block";
          if (btnLogout) btnLogout.style.display = "block";
        } 
        // Si profil enfant actif
        else {
          if (nameEl) nameEl.textContent = profilActif.prenom;
          
          if (listEl) {
            // Bouton pour revenir au profil parent
            const btnParent = document.createElement("button");
            btnParent.className = "ui-button ui-button--primary";
            btnParent.textContent = prenomParent;
            btnParent.style.marginBottom = "0.75em";
            btnParent.onclick = () => {
              MonHistoire.fermerLogoutModal();
              MonHistoire.ouvrirModalMotDePasseParent();
            };
            listEl.appendChild(btnParent);
            
            // Afficher les autres profils enfants
            const enfantsSnap = await firebase.firestore()
              .collection("users")
              .doc(user.uid)
              .collection("profils_enfant")
              .get();
            
            enfantsSnap.forEach(docEnfant => {
              if (docEnfant.id === profilActif.id) return;
              
              const data = docEnfant.data();
              const btn = document.createElement("button");
              btn.className = "ui-button ui-button--primary";
              btn.textContent = data.prenom;
              btn.style.marginBottom = "0.75em";
              btn.onclick = () => {
                // Changer de profil
                localStorage.setItem("profilActif", JSON.stringify({
                  type: "enfant",
                  id: docEnfant.id,
                  prenom: data.prenom
                }));
                
                MonHistoire.fermerLogoutModal();
                
                // Mettre à jour l'UI
                const userIcon = document.getElementById("user-icon");
                if (userIcon) userIcon.textContent = data.prenom.charAt(0).toUpperCase();
              };
              listEl.appendChild(btn);
            });
          }
          
          // Masquer les boutons "Mon Compte" et "Déconnecter"
          const btnMonCompte = document.querySelector("#logout-modal button#btn-mon-compte");
          const btnLogout = document.querySelector("#logout-modal button#btn-logout");
          
          if (btnMonCompte) btnMonCompte.style.display = "none";
          if (btnLogout) btnLogout.style.display = "none";
        }
      } catch (error) {
        console.error("Erreur lors de l'ouverture de la modale de profil:", error);
      }
      
      // Afficher la modale
      if (modal) modal.classList.add('show');
    };
  }
  
  // Fermer la modale de déconnexion/profil
  if (typeof MonHistoire.fermerLogoutModal !== 'function') {
    MonHistoire.fermerLogoutModal = function() {
      console.log("[Adapter] Exécution de fermerLogoutModal");
      const modal = document.getElementById('logout-modal');
      if (modal) modal.classList.remove('show');
    };
  }
  
  // Ouvrir la modale de mot de passe parent
  if (typeof MonHistoire.ouvrirModalMotDePasseParent !== 'function') {
    MonHistoire.ouvrirModalMotDePasseParent = function() {
      console.log("[Adapter] Exécution de ouvrirModalMotDePasseParent");
      const modal = document.getElementById("modal-password-parent");
      if (!modal) return;
      
      // Réinitialiser l'état
      const errorEl = document.getElementById("password-parent-error");
      if (errorEl) errorEl.style.display = "none";
      
      const inputEl = document.getElementById("input-password-parent");
      if (inputEl) inputEl.value = "";
      
      // Afficher la modale
      modal.classList.add("show");
    };
  }
  
  // Fermer la modale de mot de passe parent
  if (typeof MonHistoire.fermerModalPasswordParent !== 'function') {
    MonHistoire.fermerModalPasswordParent = function() {
      console.log("[Adapter] Exécution de fermerModalPasswordParent");
      const modal = document.getElementById("modal-password-parent");
      if (modal) modal.classList.remove("show");
    };
  }
  
  // Vérifier le mot de passe parent
  if (typeof MonHistoire.verifierMotdepasseParent !== 'function') {
    MonHistoire.verifierMotdepasseParent = async function() {
      console.log("[Adapter] Exécution de verifierMotdepasseParent");
      const pwd = document.getElementById("input-password-parent").value.trim();
      const user = firebase.auth().currentUser;
      
      if (!pwd || !user) {
        const errEl = document.getElementById("password-parent-error");
        if (errEl) {
          errEl.textContent = "Veuillez saisir votre mot de passe.";
          errEl.style.display = "block";
        }
        return;
      }

      try {
        // Ré-authentifier l'utilisateur
        const credential = firebase.auth.EmailAuthProvider.credential(user.email, pwd);
        await user.reauthenticateWithCredential(credential);
        
        // Succès : passer au profil parent
        localStorage.setItem("profilActif", JSON.stringify({ type: "parent" }));
        
        // Mettre à jour l'UI
        const userIcon = document.getElementById("user-icon");
        if (userIcon) {
          const docParent = await firebase.firestore().collection("users").doc(user.uid).get();
          const prenomParent = docParent.exists && docParent.data().prenom
            ? docParent.data().prenom
            : user.email.charAt(0).toUpperCase();
          
          userIcon.textContent = prenomParent.charAt(0).toUpperCase();
        }
        
        MonHistoire.fermerModalPasswordParent();
      } catch (error) {
        // Mot de passe incorrect
        const errEl = document.getElementById("password-parent-error");
        if (errEl) {
          errEl.textContent = "Mot de passe incorrect !";
          errEl.style.display = "block";
        }
      }
    };
  }
  
  // Ouvrir la modale "Mon Compte"
  if (typeof MonHistoire.ouvrirMonCompte !== 'function') {
    MonHistoire.ouvrirMonCompte = function() {
      console.log("[Adapter] Exécution de ouvrirMonCompte");
      const user = firebase.auth().currentUser;
      if (!user) return;
      
      firebase.firestore().collection("users").doc(user.uid).get()
        .then(doc => {
          // Remplir les champs
          const prenomInput = document.getElementById('compte-prenom');
          const emailInput = document.getElementById('compte-email');
          
          if (prenomInput) prenomInput.value = doc.exists && doc.data().prenom ? doc.data().prenom : '';
          if (emailInput) emailInput.value = user.email || '';
          
          // Afficher la modale
          const modal = document.getElementById('modal-moncompte');
          if (modal) modal.classList.add('show');
          
          // Fermer la modale précédente
          MonHistoire.fermerLogoutModal();
          
          // Charger les profils enfants
          MonHistoire.afficherProfilsEnfants();
        })
        .catch(error => {
          console.error("Erreur lors de l'ouverture de la modale Mon Compte:", error);
        });
    };
  }
  
  // Fermer la modale "Mon Compte"
  if (typeof MonHistoire.fermerMonCompte !== 'function') {
    MonHistoire.fermerMonCompte = function() {
      console.log("[Adapter] Exécution de fermerMonCompte");
      
      // Réinitialiser les modifications
      window.profilsEnfantModifies = [];
      
      const modal = document.getElementById("modal-moncompte");
      if (modal) modal.classList.remove("show");
    };
  }
  
  // Afficher les profils enfants dans la modale "Mon Compte"
  if (typeof MonHistoire.afficherProfilsEnfants !== 'function') {
    MonHistoire.afficherProfilsEnfants = function() {
      console.log("[Adapter] Exécution de afficherProfilsEnfants");
      const user = firebase.auth().currentUser;
      if (!user) return;

      const liste = document.getElementById("liste-profils-enfants");
      if (!liste) return;
      
      liste.innerHTML = "";

      firebase.firestore()
        .collection("users").doc(user.uid)
        .collection("profils_enfant")
        .get()
        .then(snapshot => {
          let count = 0;
          snapshot.forEach(doc => {
            const data = doc.data();
            count++;
            const li = document.createElement("li");
            li.className = "ligne-profil";
            li.setAttribute("data-id", doc.id);
            li.innerHTML = `
              <span class="prenom">${data.prenom}</span>
              <span class="quota">${data.nb_histoires || 0}/5</span>
              <img src="corbeille-cartoon.png" alt="Supprimer" class="btn-corbeille" onclick="MonHistoire.retirerProfil('${doc.id}')">
              <button type="button" class="btn-edit" onclick="MonHistoire.modifierProfil('${doc.id}', '${data.prenom}')">✏️</button>
            `;
            liste.appendChild(li);
          });

          // Masquer bouton d'ajout si 2 profils
          const btnAjout = document.getElementById("btn-ajouter-enfant");
          if (btnAjout) {
            btnAjout.style.display = (count >= 2) ? "none" : "inline-block";
          }
        })
        .catch(error => {
          console.error("Erreur lors du chargement des profils enfants:", error);
        });
    };
  }
  
  // Retirer un profil enfant
  if (typeof MonHistoire.retirerProfil !== 'function') {
    MonHistoire.retirerProfil = function(id) {
      console.log("[Adapter] Exécution de retirerProfil pour ID:", id);
      
      window.profilsEnfantModifies.push({ action: "supprimer", id });
      
      const ligne = document.querySelector(`#liste-profils-enfants .ligne-profil[data-id="${id}"]`);
      if (ligne) ligne.remove();
    };
  }
  
  // Modifier un profil enfant
  if (typeof MonHistoire.modifierProfil !== 'function') {
    MonHistoire.modifierProfil = function(id, prenomActuel) {
      console.log("[Adapter] Exécution de modifierProfil pour ID:", id);
      
      window.idProfilEnfantActif = id;
      
      const input = document.getElementById("input-nouveau-prenom");
      if (input) input.value = prenomActuel;
      
      const modal = document.getElementById("modal-renommer-profil");
      if (modal) modal.classList.add("show");
    };
  }
  
  // Fermer la modale de renommage de profil
  if (typeof MonHistoire.fermerModaleRenommerProfil !== 'function') {
    MonHistoire.fermerModaleRenommerProfil = function() {
      console.log("[Adapter] Exécution de fermerModaleRenommerProfil");
      
      const modal = document.getElementById("modal-renommer-profil");
      if (modal) modal.classList.remove("show");
      
      window.idProfilEnfantActif = null;
    };
  }
  
  // Confirmer le renommage d'un profil
  if (typeof MonHistoire.confirmerRenommerProfil !== 'function') {
    MonHistoire.confirmerRenommerProfil = function() {
      console.log("[Adapter] Exécution de confirmerRenommerProfil");
      
      const nouveauPrenom = document.getElementById("input-nouveau-prenom").value.trim();
      if (!nouveauPrenom || !window.idProfilEnfantActif) {
        if (MonHistoire.showMessageModal) {
          MonHistoire.showMessageModal("Le prénom ne peut pas être vide.");
        }
        return;
      }
      
      // Stocker la modification
      window.profilsEnfantModifies.push({ 
        action: "modifier", 
        id: window.idProfilEnfantActif, 
        nouveauPrenom 
      });

      // Mise à jour visuelle immédiate
      const element = document.querySelector(`#liste-profils-enfants .ligne-profil[data-id="${window.idProfilEnfantActif}"] .prenom`);
      if (element) element.textContent = nouveauPrenom;

      MonHistoire.fermerModaleRenommerProfil();
    };
  }
  
  // Enregistrer les modifications des profils
  if (typeof MonHistoire.enregistrerModificationsProfils !== 'function') {
    MonHistoire.enregistrerModificationsProfils = function() {
      console.log("[Adapter] Exécution de enregistrerModificationsProfils");
      
      const user = firebase.auth().currentUser;
      if (!user || window.profilsEnfantModifies.length === 0) {
        return;
      }
      
      const batch = firebase.firestore().batch();
      const ref = firebase.firestore().collection("users").doc(user.uid).collection("profils_enfant");

      window.profilsEnfantModifies.forEach(modif => {
        if (modif.action === "supprimer") {
          batch.delete(ref.doc(modif.id));
        }
        if (modif.action === "modifier") {
          batch.update(ref.doc(modif.id), { prenom: modif.nouveauPrenom });
        }
      });

      batch.commit()
        .then(() => {
          window.profilsEnfantModifies = [];
          MonHistoire.fermerMonCompte();
          
          if (MonHistoire.showMessageModal) {
            MonHistoire.showMessageModal("Modifications enregistrées !");
          }
        })
        .catch(error => {
          console.error("Erreur lors de l'enregistrement des modifications:", error);
          
          if (MonHistoire.showMessageModal) {
            MonHistoire.showMessageModal("Erreur lors de l'enregistrement des modifications.");
          }
        });
    };
  }
  
  // Attacher les écouteurs d'événements
  function attachEventListeners() {
    // Bouton "Mon Compte" dans la modale de déconnexion
    const btnMonCompte = document.getElementById('btn-mon-compte');
    if (btnMonCompte) {
      btnMonCompte.addEventListener('click', MonHistoire.ouvrirMonCompte);
    }
    
    // Bouton "Fermer" dans la modale de déconnexion
    const btnFermerLogout = document.getElementById('btn-fermer-logout');
    if (btnFermerLogout) {
      btnFermerLogout.addEventListener('click', MonHistoire.fermerLogoutModal);
    }
    
    // Bouton "Déconnecter" dans la modale de déconnexion
    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
      btnLogout.addEventListener('click', function() {
        MonHistoire.fermerLogoutModal();
        if (MonHistoire.modules.user && MonHistoire.modules.user.auth) {
          const result = MonHistoire.modules.user.auth.logoutUser();
          if (result && typeof result.catch === 'function') {
            result.catch((error) => {
              console.error('Erreur lors de la déconnexion:', error);
            });
          }
        }
      });
    }
    
    // Bouton "Valider" dans la modale de mot de passe parent
    const btnConfirmPasswordParent = document.getElementById('btn-confirm-password-parent');
    if (btnConfirmPasswordParent) {
      btnConfirmPasswordParent.addEventListener('click', MonHistoire.verifierMotdepasseParent);
    }
    
    // Bouton "Annuler" dans la modale de mot de passe parent
    const btnCancelPasswordParent = document.getElementById('btn-cancel-password-parent');
    if (btnCancelPasswordParent) {
      btnCancelPasswordParent.addEventListener('click', MonHistoire.fermerModalPasswordParent);
    }
    
    // Bouton "Fermer" dans la modale "Mon Compte"
    const btnCloseAccount = document.getElementById('btn-close-account');
    if (btnCloseAccount) {
      btnCloseAccount.addEventListener('click', MonHistoire.fermerMonCompte);
    }
    
    // Bouton "Enregistrer" dans la modale "Mon Compte"
    const btnSaveAccount = document.getElementById('btn-save-account');
    if (btnSaveAccount) {
      btnSaveAccount.addEventListener('click', function(e) {
        e.preventDefault();
        MonHistoire.enregistrerModificationsProfils();
      });
    }
    
    // Bouton "Ajouter un profil" dans la modale "Mon Compte"
    const btnAjouterEnfant = document.getElementById('btn-ajouter-enfant');
    if (btnAjouterEnfant) {
      btnAjouterEnfant.addEventListener('click', function() {
        const form = document.getElementById('form-ajout-enfant');
        if (form) form.style.display = 'block';
      });
    }
    
    // Bouton "Annuler" dans le formulaire d'ajout d'enfant
    const btnAnnulerAjoutEnfant = document.getElementById('btn-annuler-ajout-enfant');
    if (btnAnnulerAjoutEnfant) {
      btnAnnulerAjoutEnfant.addEventListener('click', function() {
        const form = document.getElementById('form-ajout-enfant');
        if (form) form.style.display = 'none';
      });
    }
    
    // Bouton "Valider" dans le formulaire d'ajout d'enfant
    const btnValiderAjoutEnfant = document.getElementById('btn-valider-ajout-enfant');
    if (btnValiderAjoutEnfant) {
      btnValiderAjoutEnfant.addEventListener('click', function() {
        const prenom = document.getElementById('input-prenom-enfant').value.trim();
        if (!prenom) return;
        
        const user = firebase.auth().currentUser;
        if (!user) return;
        
        firebase.firestore()
          .collection("users").doc(user.uid)
          .collection("profils_enfant").add({
            prenom: prenom,
            createdAt: new Date().toISOString(),
            nb_histoires: 0
          })
          .then(() => {
            const form = document.getElementById('form-ajout-enfant');
            if (form) form.style.display = 'none';
            
            MonHistoire.afficherProfilsEnfants();
          })
          .catch(error => {
            console.error("Erreur lors de l'ajout d'un profil enfant:", error);
          });
      });
    }
    
    // Bouton "Annuler" dans la modale de renommage de profil
    const btnAnnulerRenommerProfil = document.getElementById('btn-annuler-renommer-profil');
    if (btnAnnulerRenommerProfil) {
      btnAnnulerRenommerProfil.addEventListener('click', MonHistoire.fermerModaleRenommerProfil);
    }
    
    // Bouton "Valider" dans la modale de renommage de profil
    const btnConfirmerRenommerProfil = document.getElementById('btn-confirmer-renommer-profil');
    if (btnConfirmerRenommerProfil) {
      btnConfirmerRenommerProfil.addEventListener('click', MonHistoire.confirmerRenommerProfil);
    }
    
    // Icône utilisateur pour ouvrir la modale de déconnexion
    const userIcon = document.getElementById('user-icon');
    if (userIcon) {
      userIcon.addEventListener('click', MonHistoire.ouvrirLogoutModal);
    }
  }
  
  // Initialiser l'adaptateur
  function init() {
    attachEventListeners();
    console.log("Adaptateur Profiles initialisé");
  }
  
  // Exécuter l'initialisation au chargement de la page
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
