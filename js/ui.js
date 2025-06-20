// js/ui.js
// Gestion directe de l'interface utilisateur

window.MonHistoire = window.MonHistoire || {};

(function() {
  /* --- Événements généraux --- */
  function init() {
    bindEvents();
    bindLongPress();
    initNotificationListeners();
  }

  function initNotificationListeners() {
    if (!MonHistoire.events) return;

    MonHistoire.events.on('profilChange', () => {
      if (MonHistoire.features?.sharing?.mettreAJourIndicateurNotification) {
        setTimeout(() => MonHistoire.features.sharing.mettreAJourIndicateurNotification(), 500);
      }
    });

    MonHistoire.events.on('nouvelleNotification', () => {
      if (MonHistoire.features?.sharing?.mettreAJourIndicateurNotification) {
        MonHistoire.features.sharing.mettreAJourIndicateurNotification();
      }
    });
  }

  function protegerBouton(id, callback) {
    const bouton = document.getElementById(id);
    if (!bouton) return;

    bouton.removeEventListener('click', bouton._clickHandler);
    bouton._clickHandler = async (event) => {
      if (bouton.dataset.processing === 'true') return;
      bouton.dataset.processing = 'true';
      try {
        await callback(event);
      } finally {
        setTimeout(() => { bouton.dataset.processing = 'false'; }, 500);
      }
    };
    bouton.addEventListener('click', bouton._clickHandler);
  }

  function bindEvents() {
    document.querySelectorAll('[data-screen]').forEach(btn => {
      btn.addEventListener('click', () => {
        const screen = btn.getAttribute('data-screen');
        MonHistoire.core?.navigation?.showScreen?.(screen);
      });
    });

    bindProfilsEnfantsEvents();

    document.getElementById('form-generer-histoire')?.addEventListener('submit', (e) => {
      e.preventDefault();
        MonHistoire.features?.stories?.generator?.genererHistoire?.();
    });

    // --- Authentification ---
    document.getElementById('btn-signup')?.addEventListener('click', () => {
        MonHistoire.core?.auth?.toggleSignup?.(true);
    });

    document.getElementById('btn-back-to-login')?.addEventListener('click', () => {
        MonHistoire.core?.auth?.toggleSignup?.(false);
    });

    const btnForgot = document.getElementById('btn-forgot');
    btnForgot?.addEventListener('click', (e) => {
      e.preventDefault();
        MonHistoire.core?.auth?.toggleReset?.(true);
    });

    document.getElementById('btn-back-to-login-reset')?.addEventListener('click', () => {
        MonHistoire.core?.auth?.toggleReset?.(false);
    });

    document.getElementById('login-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
        MonHistoire.core?.auth?.loginUser?.();
    });

    protegerBouton('btn-register', (e) => {
      e.preventDefault();
      MonHistoire.core?.auth?.registerUser?.();
    });

    document.getElementById('btn-send-reset')?.addEventListener('click', (e) => {
      e.preventDefault();
        MonHistoire.core?.auth?.sendReset?.();
    });

    document.querySelectorAll('.btn-back').forEach(button => {
      button.addEventListener('click', () => {
          MonHistoire.core?.navigation?.goBack?.();
      });
    });

    document.getElementById('btn-retour-resultat')?.addEventListener('click', () => {
        MonHistoire.core?.navigation?.retourDepuisResultat?.();
    });

    protegerBouton('btn-sauvegarde', () => {
      const storyGetter = MonHistoire.features?.stories?.display?.getCurrentStory;
      const story = typeof storyGetter === 'function' ? storyGetter() : null;
      MonHistoire.features?.stories?.management?.saveStory?.(story);
    });

    protegerBouton('btn-audio', () => {
      MonHistoire.features?.audio?.gererClicBoutonAudio?.();
    });

    protegerBouton('btn-export-pdf', () => {
      MonHistoire.features?.export?.exporterHistoirePDF?.();
    });

    protegerBouton('btn-partage', () => {
      MonHistoire.features?.sharing?.ouvrirModalePartage?.();
    });

    // --- Partage et limites ---
    document.getElementById('btn-fermer-partage')?.addEventListener('click', () => {
      MonHistoire.features?.sharing?.fermerModalePartage?.();
    });

    document.getElementById('btn-fermer-limite')?.addEventListener('click', () => {
      document.getElementById('modal-limite')?.classList.remove('show');
    });

    document.getElementById('btn-valider-limite')?.addEventListener('click', () => {
      MonHistoire.core?.navigation?.showScreen?.('mes-histoires');
      document.getElementById('modal-limite')?.classList.remove('show');
    });

    // --- Renommage d'histoire ---
    document.getElementById('btn-renommer-histoire')?.addEventListener('click', () => {
      const selected = document.querySelector('.histoire-card.selected');
      if (!selected) return;
      MonHistoire.state = MonHistoire.state || {};
      MonHistoire.state.histoireARenommer = selected.dataset.id;
      const input = document.getElementById('input-nouveau-titre');
      const titreEl = selected.querySelector('div');
      if (input && titreEl) input.value = titreEl.textContent.trim();
      document.getElementById('modal-renommer')?.classList.add('show');
    });

    document.getElementById('btn-annuler-renommer')?.addEventListener('click', () => {
      document.getElementById('modal-renommer')?.classList.remove('show');
      if (MonHistoire.state) MonHistoire.state.histoireARenommer = null;
    });

    document.getElementById('btn-confirmer-renommer')?.addEventListener('click', async () => {
      const id = MonHistoire.state?.histoireARenommer;
      const input = document.getElementById('input-nouveau-titre');
      if (!id || !input || !input.value.trim()) {
        document.getElementById('modal-renommer')?.classList.remove('show');
        return;
      }
      document.getElementById('modal-renommer')?.classList.remove('show');
      const newTitle = input.value.trim();
      try {
        await MonHistoire.core?.storage?.updateStoryTitle?.(id, newTitle);
        MonHistoire.features?.stories?.management?.loadStories?.();
      } catch (error) {
        console.error('Erreur lors du renommage:', error);
        MonHistoire.showMessageModal?.("Erreur lors du renommage de l'histoire.");
      } finally {
        if (MonHistoire.state) MonHistoire.state.histoireARenommer = null;
      }
    });
  }

  function bindProfilsEnfantsEvents() {
    document.getElementById('btn-ajouter-enfant')?.addEventListener('click', ouvrirFormAjoutEnfant);
    document.getElementById('btn-valider-ajout-enfant')?.addEventListener('click', validerAjoutEnfant);
    document.getElementById('btn-annuler-ajout-enfant')?.addEventListener('click', annulerAjoutEnfant);
    document.getElementById('btn-annuler-renommer-profil')?.addEventListener('click', fermerModaleRenommerProfil);
    document.getElementById('btn-confirmer-renommer-profil')?.addEventListener('click', confirmerRenommerProfil);
  }

  function bindLongPress() {
    const elements = document.querySelectorAll('.histoire-card, .ui-button--primary');
    elements.forEach(element => {
      let pressTimer;
      let startX, startY;
      const longPressDuration = 500;
      const moveThreshold = 10;

      const startTouch = (e) => {
        if (e.touches && e.touches[0]) {
          startX = e.touches[0].clientX;
          startY = e.touches[0].clientY;
        } else if (e.type === 'mousedown') {
          startX = e.clientX;
          startY = e.clientY;
        }
        pressTimer = setTimeout(() => {
          if (element.closest('li') && element.closest('li').dataset.id) {
            handleLongPress(element);
          }
        }, longPressDuration);
      };
      const endTouch = () => clearTimeout(pressTimer);
      const cancelTouch = () => clearTimeout(pressTimer);
      const moveTouch = (e) => {
        let moveX = 0, moveY = 0;
        if (e.touches && e.touches[0]) {
          moveX = Math.abs(e.touches[0].clientX - startX);
          moveY = Math.abs(e.touches[0].clientY - startY);
        } else if (e.type === 'mousemove') {
          moveX = Math.abs(e.clientX - startX);
          moveY = Math.abs(e.clientY - startY);
        }
        if (moveX > moveThreshold || moveY > moveThreshold) cancelTouch();
      };

      element.addEventListener('touchstart', startTouch, { passive: true });
      element.addEventListener('touchend', endTouch);
      element.addEventListener('touchcancel', cancelTouch);
      element.addEventListener('touchmove', moveTouch, { passive: true });

      element.addEventListener('mousedown', startTouch);
      element.addEventListener('mouseup', endTouch);
      element.addEventListener('mouseleave', cancelTouch);
      element.addEventListener('mousemove', moveTouch);
    });
  }

  function handleLongPress(element) {
    const histoireId = element.dataset.id;
    if (!histoireId) return;
    afficherMenuContextuelHistoire(element, histoireId);
  }

  function afficherMenuContextuelHistoire(element, histoireId) {
    let menu = document.getElementById('menu-contextuel-histoire');
    if (!menu) {
      menu = document.createElement('div');
      menu.id = 'menu-contextuel-histoire';
      menu.className = 'menu-contextuel';

      const options = [
        { text: 'Lire', icon: '📖', action: 'lire' },
        { text: 'Supprimer', icon: '🗑️', action: 'supprimer' }
      ];
      options.forEach(option => {
        const item = document.createElement('div');
        item.className = 'menu-item';
        item.dataset.action = option.action;
        const icon = document.createElement('span');
        icon.className = 'menu-icon';
        icon.textContent = option.icon;
        const text = document.createElement('span');
        text.className = 'menu-text';
        text.textContent = option.text;
        item.appendChild(icon);
        item.appendChild(text);
        menu.appendChild(item);
        item.addEventListener('click', () => {
          handleMenuAction(option.action, histoireId);
          fermerMenuContextuel();
        });
      });
      document.body.appendChild(menu);
      document.addEventListener('click', (e) => {
        if (!menu.contains(e.target) && e.target !== element) {
          fermerMenuContextuel();
        }
      });
    }
    menu.dataset.histoireId = histoireId;
    const rect = element.getBoundingClientRect();
    menu.style.top = `${rect.bottom + window.scrollY}px`;
    menu.style.left = `${rect.left + window.scrollX}px`;
    menu.classList.add('show');
  }

  function fermerMenuContextuel() {
    const menu = document.getElementById('menu-contextuel-histoire');
    if (menu) menu.classList.remove('show');
  }

  function handleMenuAction(action, histoireId) {
    switch (action) {
      case 'lire':
        MonHistoire.features?.stories?.display?.afficherHistoireSauvegardee?.(histoireId);
        break;
      case 'supprimer':
        MonHistoire.features?.stories?.management?.supprimerHistoire?.(histoireId);
        break;
    }
  }

  /* --- Profils enfants --- */
  function ouvrirFormAjoutEnfant() {
    const form = document.getElementById('form-ajout-enfant');
    if (!form) return;
    form.classList.remove('fade-in');
    void form.offsetWidth;
    form.classList.add('fade-in');
    form.style.display = 'block';
  }

  function annulerAjoutEnfant() {
    const form = document.getElementById('form-ajout-enfant');
    if (!form) return;
    form.classList.remove('fade-in');
    form.classList.add('fade-out');
    setTimeout(() => {
      form.style.display = 'none';
      form.classList.remove('fade-out');
      const input = document.getElementById('input-prenom-enfant');
      if (input) input.value = '';
    }, 250);
  }

  function validerAjoutEnfant() {
    const user = firebase.auth().currentUser;
    if (!user) return;
    const input = document.getElementById('input-prenom-enfant');
    if (!input) return;
    const prenom = input.value.trim();
    if (!prenom) {
      MonHistoire.showMessageModal('Le prénom ne peut pas être vide.', { forceTop: true });
      return;
    }
    const ref = firebase.firestore().collection('users').doc(user.uid).collection('profils_enfant').doc();
    ref.set({ prenom, createdAt: new Date().toISOString(), nb_histoires: 0, acces_messagerie: false })
      .then(() => {
        annulerAjoutEnfant();
        afficherProfilsEnfants();
        MonHistoire.core?.auth?.logActivite?.('creation_profil_enfant', { prenom });
      })
      .catch(error => {
        console.error('Erreur lors de la création du profil enfant:', error);
        MonHistoire.showMessageModal('Erreur lors de la création du profil enfant.');
      });
  }

  function afficherProfilsEnfants() {
    const user = firebase.auth().currentUser;
    if (!user) return;
    const liste = document.getElementById('liste-profils-enfants');
    if (!liste) return;
    liste.innerHTML = '';
    firebase.firestore().collection('users').doc(user.uid).collection('profils_enfant').get()
      .then(snapshot => {
        let count = 0;
        const promises = [];
        snapshot.forEach(doc => {
          const data = doc.data();
          count++;
          const storiesRef = firebase.firestore().collection('users').doc(user.uid).collection('profils_enfant').doc(doc.id).collection('stories');
          const promise = storiesRef.get()
            .then(storiesSnapshot => {
              const nbHistoires = storiesSnapshot.size;
              if (nbHistoires !== (data.nb_histoires || 0)) {
                const profilRef = firebase.firestore().collection('users').doc(user.uid).collection('profils_enfant').doc(doc.id);
                return profilRef.update({ nb_histoires: nbHistoires })
                  .then(() => ({ id: doc.id, prenom: data.prenom, nb_histoires: nbHistoires, acces_messagerie: data.acces_messagerie === true }));
              }
              return { id: doc.id, prenom: data.prenom, nb_histoires: data.nb_histoires || 0, acces_messagerie: data.acces_messagerie === true };
            })
            .catch(error => {
              console.error('Erreur lors de la récupération du nombre dhistoires:', error);
              return { id: doc.id, prenom: data.prenom, nb_histoires: data.nb_histoires || 0, acces_messagerie: data.acces_messagerie === true };
            });
          promises.push(promise);
        });
        return Promise.all(promises).then(results => ({ count, profils: results }));
      })
      .then(data => {
        data.profils.forEach(result => {
          const ligne = document.createElement('div');
          ligne.className = 'ligne-profil';
          ligne.dataset.id = result.id;
          ligne.innerHTML = `
            <span class="prenom">${result.prenom}</span>
            <span class="nb-histoires">${result.nb_histoires}</span>
            <img src="corbeille-cartoon.png" alt="Supprimer" class="btn-corbeille" onclick="MonHistoire.retirerProfil('${result.id}')">
            <button type="button" class="btn-edit" onclick="MonHistoire.modifierProfil('${result.id}', '${result.prenom}')">✏️</button>
          `;
          liste.appendChild(ligne);
        });
        const btnAjouter = document.getElementById('btn-ajouter-enfant');
        if (btnAjouter) btnAjouter.style.display = (data.count >= 2) ? 'none' : 'inline-block';
      })
      .catch(error => { console.error('Erreur lors de la récupération des profils enfants:', error); });
  }

  function retirerProfil(id) {
    if (!id) return;
    if (!MonHistoire.state.profilsEnfantModifies) MonHistoire.state.profilsEnfantModifies = [];
    MonHistoire.state.profilsEnfantModifies.push({ action: 'supprimer', id });
    const ligne = document.querySelector(`#liste-profils-enfants .ligne-profil[data-id="${id}"]`);
    if (ligne) ligne.style.display = 'none';
  }

  function modifierProfil(id, prenomActuel) {
    if (!id || !prenomActuel) return;
    MonHistoire.state.idProfilEnfantActif = id;
    const input = document.getElementById('input-nouveau-prenom');
    if (input) input.value = prenomActuel;
    const modal = document.getElementById('modal-renommer-profil');
    if (modal) modal.classList.add('show');
  }

  function fermerModaleRenommerProfil() {
    const modal = document.getElementById('modal-renommer-profil');
    if (modal) modal.classList.remove('show');
    MonHistoire.state.idProfilEnfantActif = null;
  }

  function confirmerRenommerProfil() {
    const nouveauPrenom = document.getElementById('input-nouveau-prenom')?.value.trim();
    if (!nouveauPrenom) {
      MonHistoire.showMessageModal('Le prénom ne peut pas être vide.', { forceTop: true });
      return;
    }
    const id = MonHistoire.state.idProfilEnfantActif;
    if (!id) return;
    if (!MonHistoire.state.profilsEnfantModifies) MonHistoire.state.profilsEnfantModifies = [];
    MonHistoire.state.profilsEnfantModifies.push({ action: 'modifier', id, nouveauPrenom });
    const element = document.querySelector(`#liste-profils-enfants .ligne-profil[data-id="${id}"] .prenom`);
    if (element) element.textContent = nouveauPrenom;
    fermerModaleRenommerProfil();
  }

  async function enregistrerModificationsProfils(continueWithParentProfile = false) {
    const user = firebase.auth().currentUser;
    if (!user) return;
    if (!MonHistoire.state.profilsEnfantModifies || MonHistoire.state.profilsEnfantModifies.length === 0) {
      if (continueWithParentProfile &&
          MonHistoire.core?.auth?.fermerMonCompte) {
        return;
      }
      if (MonHistoire.core?.auth?.fermerMonCompte) {
        MonHistoire.core.auth.fermerMonCompte();
      }
      return;
    }
    const hasDeletion = MonHistoire.state.profilsEnfantModifies.some(m => m.action === 'supprimer');
    if (hasDeletion && !confirm('Supprimer ce profil effacera définitivement toutes les discussions associées. Continuer ?')) {
      return;
    }

    const batch = firebase.firestore().batch();
    const ref = firebase.firestore().collection('users').doc(user.uid).collection('profils_enfant');
    const convRef = firebase.firestore().collection('conversations');
    const convDeletionPromises = [];

    MonHistoire.state.profilsEnfantModifies.forEach(modif => {
      if (modif.action === 'supprimer') {
        batch.delete(ref.doc(modif.id));
        const participantKey = `${user.uid}:${modif.id}`;
        convDeletionPromises.push(
          Promise.all([
            convRef.where('participants', 'array-contains', participantKey).get(),
            convRef.where('participants', 'array-contains', user.uid).get()
          ]).then(([snapNew, snapOld]) => {
            const docs = {};
            snapNew.forEach(d => docs[d.id] = d.ref);
            snapOld.forEach(d => docs[d.id] = d.ref);
            const deletes = Object.values(docs).map(async dref => {
              const messagesSnap = await dref.collection('messages').get();
              if (!messagesSnap.empty) {
                const delBatch = firebase.firestore().batch();
                messagesSnap.forEach(m => delBatch.delete(m.ref));
                await delBatch.commit();
              }
              await dref.delete();
            });
            return Promise.all(deletes);
          })
        );
        MonHistoire.core?.auth?.logActivite?.('suppression_profil_enfant', { id_enfant: modif.id });
      }
      if (modif.action === 'modifier') {
        batch.update(ref.doc(modif.id), { prenom: modif.nouveauPrenom });
        MonHistoire.core?.auth?.logActivite?.('modification_prenom_profil', { id_enfant: modif.id });
      }
      if (modif.action === 'messagerie') {
        batch.update(ref.doc(modif.id), { acces_messagerie: modif.value });
      }
    });

    await Promise.all(convDeletionPromises);

    batch.commit().then(() => {
      MonHistoire.state.profilsEnfantModifies = [];
      afficherProfilsEnfants();
      if (continueWithParentProfile) {
        return;
      }
      const form = document.getElementById('form-ajout-enfant');
      if (form && form.style.display !== 'none') {
        form.classList.remove('fade-in');
        form.classList.add('fade-out');
        setTimeout(() => {
          form.style.display = 'none';
          form.classList.remove('fade-out');
          if (MonHistoire.core?.auth?.fermerMonCompte) {
            MonHistoire.core.auth.fermerMonCompte();
          }
          setTimeout(() => { MonHistoire.showMessageModal('Modifications enregistrées !'); }, 100);
        }, 250);
      } else {
        if (MonHistoire.core?.auth?.fermerMonCompte) {
          MonHistoire.core.auth.fermerMonCompte();
        }
        setTimeout(() => { MonHistoire.showMessageModal('Modifications enregistrées !'); }, 100);
      }
    }).catch(error => {
      console.error("Erreur lors de l'enregistrement des modifications:", error);
      MonHistoire.showMessageModal("Erreur lors de l'enregistrement des modifications.");
    });
  }

  // Exposer les fonctions dans l'objet MonHistoire et le namespace ui
  MonHistoire.initUI = init;
  MonHistoire.bindLongPress = bindLongPress;
  MonHistoire.protegerBouton = protegerBouton;
  MonHistoire.ouvrirFormAjoutEnfant = ouvrirFormAjoutEnfant;
  MonHistoire.annulerAjoutEnfant = annulerAjoutEnfant;
  MonHistoire.validerAjoutEnfant = validerAjoutEnfant;
  MonHistoire.afficherProfilsEnfants = afficherProfilsEnfants;
  MonHistoire.retirerProfil = retirerProfil;
  MonHistoire.modifierProfil = modifierProfil;
  MonHistoire.fermerModaleRenommerProfil = fermerModaleRenommerProfil;
  MonHistoire.confirmerRenommerProfil = confirmerRenommerProfil;
  MonHistoire.enregistrerModificationsProfils = enregistrerModificationsProfils;

  MonHistoire.ui = {
    init,
    bindLongPress,
    protegerBouton,
    bindEvents,
    ouvrirFormAjoutEnfant,
    annulerAjoutEnfant,
    validerAjoutEnfant,
    afficherProfilsEnfants,
    retirerProfil,
    modifierProfil,
    fermerModaleRenommerProfil,
    confirmerRenommerProfil,
    enregistrerModificationsProfils
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => init());
  } else {
    init();
  }
})();

// S'assurer que le bouton de fermeture du message modal fonctionne
// même si les adaptateurs ne sont pas encore initialisés.
document.addEventListener('DOMContentLoaded', () => {
  const closeBtn = document.getElementById('close-message-modal');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      if (typeof MonHistoire.closeMessageModal === 'function') {
        MonHistoire.closeMessageModal();
      }
    });
  }
});
