// js/features/stories/notation.js
// Gestion de la notation des histoires

window.MonHistoire = window.MonHistoire || {};
MonHistoire.features = MonHistoire.features || {};
MonHistoire.features.stories = MonHistoire.features.stories || {};

MonHistoire.features.stories.notation = {
  // Lit la note depuis Firestore et met à jour l'affichage des étoiles
  async afficherNote(storyId) {
    try {
      const user = firebase.auth().currentUser;
      if (!user) return;

      // Déterminer le profil actif
      let profilActif = MonHistoire.state && MonHistoire.state.profilActif;
      if (!profilActif) {
        profilActif = localStorage.getItem('profilActif')
          ? JSON.parse(localStorage.getItem('profilActif'))
          : { type: 'parent' };
      }

      // Référence du document de l'histoire
      let docRef;
      if (profilActif.type === 'parent') {
        docRef = firebase.firestore()
          .collection('users')
          .doc(user.uid)
          .collection('stories')
          .doc(storyId);
      } else {
        docRef = firebase.firestore()
          .collection('users')
          .doc(user.uid)
          .collection('profils_enfant')
          .doc(profilActif.id)
          .collection('stories')
          .doc(storyId);
      }

      const doc = await docRef.get();
      if (!doc.exists) return;

      const note = doc.data().note || 0;
      const etoiles = document.querySelectorAll('#bloc-notation .etoile');
      etoiles.forEach(el => {
        el.textContent = parseInt(el.dataset.note, 10) <= note ? '★' : '☆';
      });
    } catch (err) {
      console.error('Erreur afficherNote:', err);
    }
  },

  // Gère le clic sur les étoiles pour enregistrer la note
  bindNotation(storyId) {
    const etoiles = document.querySelectorAll('#bloc-notation .etoile');
    etoiles.forEach(el => {
      el.addEventListener('click', async () => {
        const note = parseInt(el.dataset.note, 10);
        try {
          const user = firebase.auth().currentUser;
          if (!user) return;

          let profilActif = MonHistoire.state && MonHistoire.state.profilActif;
          if (!profilActif) {
            profilActif = localStorage.getItem('profilActif')
              ? JSON.parse(localStorage.getItem('profilActif'))
              : { type: 'parent' };
          }

          let docRef;
          if (profilActif.type === 'parent') {
            docRef = firebase.firestore()
              .collection('users')
              .doc(user.uid)
              .collection('stories')
              .doc(storyId);
          } else {
            docRef = firebase.firestore()
              .collection('users')
              .doc(user.uid)
              .collection('profils_enfant')
              .doc(profilActif.id)
              .collection('stories')
              .doc(storyId);
          }

          await docRef.update({ note });

          etoiles.forEach(e2 => {
            e2.textContent = parseInt(e2.dataset.note, 10) <= note ? '★' : '☆';
          });

          if (MonHistoire.core && MonHistoire.core.auth && firebase.auth().currentUser) {
            MonHistoire.core.auth.logActivite('notation_histoire', { story_id: storyId, note });
          }
        } catch (err) {
          console.error('Erreur lors de la mise à jour de la note:', err);
        }
      });
    });
  }
};

window.MonHistoire = MonHistoire;
