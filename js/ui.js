// js/ui.js
// Wrapper léger vers les modules UI modernes

window.MonHistoire = window.MonHistoire || {};

MonHistoire.ui = {
  init() {
    if (MonHistoire.modules && MonHistoire.modules.ui && MonHistoire.modules.ui.events) {
      MonHistoire.modules.ui.events.init();
    }
  },

  bindLongPress() {
    return MonHistoire.modules.ui.events.bindLongPress();
  },

  protegerBouton(id, cb) {
    return MonHistoire.modules.ui.events.protegerBouton(id, cb);
  },

  /* Fonctions liées aux profils enfants */
  ouvrirFormAjoutEnfant() {
    return MonHistoire.modules.ui.modals.ouvrirFormAjoutEnfant();
  },

  annulerAjoutEnfant() {
    return MonHistoire.modules.ui.modals.annulerAjoutEnfant();
  },

  validerAjoutEnfant() {
    return MonHistoire.modules.ui.modals.validerAjoutEnfant();
  },

  afficherProfilsEnfants() {
    return MonHistoire.modules.ui.modals.afficherProfilsEnfants();
  },

  retirerProfil(id) {
    return MonHistoire.modules.ui.modals.retirerProfil(id);
  },

  modifierProfil(id, prenom) {
    return MonHistoire.modules.ui.modals.modifierProfil(id, prenom);
  },

  fermerModaleRenommerProfil() {
    return MonHistoire.modules.ui.modals.fermerModaleRenommerProfil();
  },

  confirmerRenommerProfil() {
    return MonHistoire.modules.ui.modals.confirmerRenommerProfil();
  },

  enregistrerModificationsProfils(flag) {
    return MonHistoire.modules.ui.modals.enregistrerModificationsProfils(flag);
  }
};

window.MonHistoire = MonHistoire;
