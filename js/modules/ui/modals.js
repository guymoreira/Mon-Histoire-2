// js/modules/ui/modals.js
// Fonctions de gestion des modales et formulaires associés

window.MonHistoire = window.MonHistoire || {};
MonHistoire.modules = MonHistoire.modules || {};
MonHistoire.modules.ui = MonHistoire.modules.ui || {};

(function() {
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
        if (MonHistoire.modules.user && MonHistoire.modules.user.auth) {
          MonHistoire.modules.user.auth.logActivity('creation_profil_enfant', { prenom });
        }
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
            <img src="corbeille-cartoon.png" alt="Supprimer" class="btn-corbeille" onclick="MonHistoire.modules.ui.modals.retirerProfil('${result.id}')">
            <button type="button" class="btn-edit" onclick="MonHistoire.modules.ui.modals.modifierProfil('${result.id}', '${result.prenom}')">✏️</button>
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
          MonHistoire.modules.user &&
          MonHistoire.modules.user.account &&
          typeof MonHistoire.modules.user.account.fermerMonCompte === 'function') {
        return;
      }
      if (MonHistoire.modules.user &&
          MonHistoire.modules.user.account &&
          typeof MonHistoire.modules.user.account.fermerMonCompte === 'function') {
        MonHistoire.modules.user.account.fermerMonCompte();
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
        if (MonHistoire.modules.user && MonHistoire.modules.user.auth) {
          MonHistoire.modules.user.auth.logActivity('suppression_profil_enfant', { id_enfant: modif.id });
        }
      }
      if (modif.action === 'modifier') {
        batch.update(ref.doc(modif.id), { prenom: modif.nouveauPrenom });
        if (MonHistoire.modules.user && MonHistoire.modules.user.auth) {
          MonHistoire.modules.user.auth.logActivity('modification_prenom_profil', { id_enfant: modif.id });
        }
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
          if (MonHistoire.modules.user &&
              MonHistoire.modules.user.account &&
              typeof MonHistoire.modules.user.account.fermerMonCompte === 'function') {
            MonHistoire.modules.user.account.fermerMonCompte();
          }
          setTimeout(() => { MonHistoire.showMessageModal('Modifications enregistrées !'); }, 100);
        }, 250);
      } else {
        if (MonHistoire.modules.user &&
            MonHistoire.modules.user.account &&
            typeof MonHistoire.modules.user.account.fermerMonCompte === 'function') {
          MonHistoire.modules.user.account.fermerMonCompte();
        }
        setTimeout(() => { MonHistoire.showMessageModal('Modifications enregistrées !'); }, 100);
      }
    }).catch(error => {
      console.error('Erreur lors de l\'enregistrement des modifications:', error);
      MonHistoire.showMessageModal('Erreur lors de l\'enregistrement des modifications.');
    });
  }

  MonHistoire.modules.ui.modals = {
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
})();
