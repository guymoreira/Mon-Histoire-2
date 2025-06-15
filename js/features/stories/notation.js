// js/features/stories/notation.js
// Gestion de la notation des histoires

window.MonHistoire = window.MonHistoire || {};
MonHistoire.features = MonHistoire.features || {};
MonHistoire.features.stories = MonHistoire.features.stories || {};

MonHistoire.features.stories.notation = {
  // Lit la note depuis Firestore et met à jour l'affichage des étoiles
  async afficherNote(storyId) {
    console.log("[DEBUG NOTATION] Début afficherNote pour storyId:", storyId);
    try {
      const user = firebase.auth().currentUser;
      if (!user) {
        console.log("[DEBUG NOTATION] Aucun utilisateur connecté, impossible d'afficher la note");
        return;
      }

      // Déterminer le profil actif
      let profilActif = MonHistoire.state && MonHistoire.state.profilActif;
      if (!profilActif) {
        profilActif = localStorage.getItem('profilActif')
          ? JSON.parse(localStorage.getItem('profilActif'))
          : { type: 'parent' };
      }
      console.log("[DEBUG NOTATION] Profil actif:", profilActif);

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

      console.log("[DEBUG NOTATION] Récupération du document depuis Firestore:", docRef.path);
      const doc = await docRef.get();
      if (!doc.exists) {
        console.log("[DEBUG NOTATION] Document non trouvé dans Firestore");
        return;
      }

      const note = doc.data().note || 0;
      console.log("[DEBUG NOTATION] Note récupérée:", note);
      
      const blocNotation = document.getElementById('bloc-notation');
      console.log("[DEBUG NOTATION] Élément bloc-notation trouvé:", !!blocNotation);
      if (blocNotation) {
        console.log("[DEBUG NOTATION] Classes du bloc-notation:", blocNotation.className);
      }
      
      const etoiles = document.querySelectorAll('#bloc-notation .etoile');
      console.log("[DEBUG NOTATION] Nombre d'étoiles trouvées:", etoiles.length);

      etoiles.forEach(el => {
        const val = parseInt(el.dataset.note, 10);
        el.textContent = val <= note ? '★' : '☆';
        if (val === note) {
          el.classList.add('selected');
        } else {
          el.classList.remove('selected');
        }
      });
      
      console.log("[DEBUG NOTATION] Affichage des étoiles terminé");
    } catch (err) {
      console.error('[DEBUG NOTATION] Erreur afficherNote:', err);
    }
    console.log("[DEBUG NOTATION] Fin afficherNote");
  },

  // Gère le clic sur les étoiles pour enregistrer la note
  bindNotation(storyId) {
    console.log("[DEBUG NOTATION] Début bindNotation pour storyId:", storyId);
    const blocNotation = document.getElementById('bloc-notation');
    console.log("[DEBUG NOTATION] Élément bloc-notation trouvé:", !!blocNotation);
    if (blocNotation) {
      console.log("[DEBUG NOTATION] Classes du bloc-notation:", blocNotation.className);
      console.log("[DEBUG NOTATION] Visibilité du bloc-notation:", blocNotation.style.display, "/ Classe hidden:", blocNotation.classList.contains('hidden'));
    }
    
    const etoiles = document.querySelectorAll('#bloc-notation .etoile');
    console.log("[DEBUG NOTATION] Nombre d'étoiles trouvées pour les événements:", etoiles.length);
    etoiles.forEach((el, index) => {
      console.log("[DEBUG NOTATION] Configuration de l'étoile", index + 1, "avec data-note:", el.dataset.note);
      el.addEventListener('click', async () => {
        console.log("[DEBUG NOTATION] Clic sur l'étoile avec note:", el.dataset.note);
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

          console.log("[DEBUG NOTATION] Mise à jour de la note dans Firestore:", note);
          await docRef.update({ note });
          console.log("[DEBUG NOTATION] Note mise à jour avec succès");

          etoiles.forEach(e2 => {
            const val2 = parseInt(e2.dataset.note, 10);
            e2.textContent = val2 <= note ? '★' : '☆';
            if (val2 === note) {
              e2.classList.add('selected');
            } else {
              e2.classList.remove('selected');
            }
          });

          if (MonHistoire.core && MonHistoire.core.auth && firebase.auth().currentUser) {
            MonHistoire.core.auth.logActivite('notation_histoire', { story_id: storyId, note });
          }
        } catch (err) {
          console.error('[DEBUG NOTATION] Erreur lors de la mise à jour de la note:', err);
        }
      });
    });
    console.log("[DEBUG NOTATION] Fin bindNotation");
  },

  // Réinitialise l'affichage de la notation
  reset() {
    console.log("[DEBUG NOTATION] Réinitialisation de la notation");
    const blocNotation = document.getElementById('bloc-notation');
    if (blocNotation) {
      blocNotation.classList.add('hidden');
    }

    const etoiles = document.querySelectorAll('#bloc-notation .etoile');
    etoiles.forEach(el => {
      el.textContent = '☆';
      el.classList.remove('selected');
    });
  }
};

window.MonHistoire = MonHistoire;
