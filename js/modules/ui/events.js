// js/modules/ui/events.js
// Gestion des événements de l'interface utilisateur

window.MonHistoire = window.MonHistoire || {};
MonHistoire.modules = MonHistoire.modules || {};
MonHistoire.modules.ui = MonHistoire.modules.ui || {};

(function() {
  function init() {
    bindEvents();
    bindLongPress();
    initNotificationListeners();
  }

  function initNotificationListeners() {
    if (!MonHistoire.events) return;

    MonHistoire.events.on("profilChange", () => {
      if (MonHistoire.modules.sharing && MonHistoire.modules.sharing.mettreAJourIndicateurNotification) {
        setTimeout(() => MonHistoire.modules.sharing.mettreAJourIndicateurNotification(), 500);
      }
    });

    MonHistoire.events.on("nouvelleNotification", () => {
      if (MonHistoire.modules.sharing && MonHistoire.modules.sharing.mettreAJourIndicateurNotification) {
        MonHistoire.modules.sharing.mettreAJourIndicateurNotification();
      }
    });
  }

  function protegerBouton(id, callback) {
    const bouton = document.getElementById(id);
    if (!bouton) return;

    bouton.removeEventListener("click", bouton._clickHandler);
    bouton._clickHandler = async (event) => {
      if (bouton.dataset.processing === "true") return;
      bouton.dataset.processing = "true";
      try {
        await callback(event);
      } finally {
        setTimeout(() => { bouton.dataset.processing = "false"; }, 500);
      }
    };
    bouton.addEventListener("click", bouton._clickHandler);
  }

  function bindEvents() {
    document.querySelectorAll('[data-screen]').forEach(btn => {
      btn.addEventListener('click', () => {
        const screen = btn.getAttribute('data-screen');
        if (MonHistoire.modules.core && MonHistoire.modules.core.navigation) {
          MonHistoire.modules.core.navigation.showScreen(screen);
        }
      });
    });

    bindProfilsEnfantsEvents();

    document.getElementById('form-generer-histoire')?.addEventListener('submit', (e) => {
      e.preventDefault();
      if (MonHistoire.modules.stories && MonHistoire.modules.stories.generator) {
        MonHistoire.modules.stories.generator.genererHistoire();
      }
    });

    // --- Authentification ---
    document.getElementById('btn-signup')?.addEventListener('click', () => {
      MonHistoire.modules.user?.auth?.toggleSignup(true);
    });

    document.getElementById('btn-back-to-login')?.addEventListener('click', () => {
      MonHistoire.modules.user?.auth?.toggleSignup(false);
    });

    const btnForgot = document.getElementById('btn-forgot');
    btnForgot?.addEventListener('click', (e) => {
      e.preventDefault();
      MonHistoire.modules.user?.auth?.toggleReset(true);
    });

    document.getElementById('btn-back-to-login-reset')?.addEventListener('click', () => {
      MonHistoire.modules.user?.auth?.toggleReset(false);
    });

    document.getElementById('login-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      MonHistoire.modules.user?.auth?.loginUser();
    });

    document.getElementById('btn-register')?.addEventListener('click', (e) => {
      e.preventDefault();
      MonHistoire.modules.user?.auth?.registerUser();
    });

    document.getElementById('btn-send-reset')?.addEventListener('click', (e) => {
      e.preventDefault();
      MonHistoire.modules.user?.auth?.sendReset();
    });

    document.querySelectorAll('.btn-back').forEach(button => {
      button.addEventListener('click', () => {
        if (MonHistoire.modules.core && MonHistoire.modules.core.navigation) {
          MonHistoire.modules.core.navigation.goBack();
        }
      });
    });

    document.getElementById('btn-retour-resultat')?.addEventListener('click', () => {
      if (MonHistoire.modules.core && MonHistoire.modules.core.navigation) {
        MonHistoire.modules.core.navigation.retourDepuisResultat();
      }
    });

    protegerBouton('btn-sauvegarde', () => {
      if (MonHistoire.modules.stories && MonHistoire.modules.stories.management) {
        const storyGetter =
          MonHistoire.modules.stories.display &&
          MonHistoire.modules.stories.display.getCurrentStory;
        const story = typeof storyGetter === 'function' ? storyGetter() : null;
        MonHistoire.modules.stories.management.saveStory(story);
      }
    });

    protegerBouton('btn-audio', () => {
      if (MonHistoire.modules.features && MonHistoire.modules.features.audio) {
        MonHistoire.modules.features.audio.gererClicBoutonAudio();
      }
    });

    protegerBouton('btn-export-pdf', () => {
      if (MonHistoire.modules.features && MonHistoire.modules.features.export) {
        MonHistoire.modules.features.export.exporterHistoirePDF();
      }
    });

    protegerBouton('btn-partage', () => {
      if (MonHistoire.modules.sharing && MonHistoire.modules.sharing.ouvrirModalePartage) {
        MonHistoire.modules.sharing.ouvrirModalePartage();
      }
    });

    // --- Partage et limites ---
    document.getElementById('btn-fermer-partage')?.addEventListener('click', () => {
      MonHistoire.modules.sharing?.fermerModalePartage?.();
    });

    document.getElementById('btn-fermer-limite')?.addEventListener('click', () => {
      document.getElementById('modal-limite')?.classList.remove('show');
    });

    document.getElementById('btn-valider-limite')?.addEventListener('click', () => {
      if (MonHistoire.modules.core && MonHistoire.modules.core.navigation) {
        MonHistoire.modules.core.navigation.showScreen('mes-histoires');
      }
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
        await MonHistoire.modules.core?.storage?.updateStoryTitle(id, newTitle);
        if (MonHistoire.modules.stories?.management?.loadStories) {
          MonHistoire.modules.stories.management.loadStories();
        }
      } catch (error) {
        console.error('Erreur lors du renommage:', error);
        MonHistoire.showMessageModal?.("Erreur lors du renommage de l'histoire.");
      } finally {
        if (MonHistoire.state) MonHistoire.state.histoireARenommer = null;
      }
    });
  }

  function bindProfilsEnfantsEvents() {
    const modals = MonHistoire.modules.ui.modals;
    if (!modals) return;

    document.getElementById('btn-ajouter-enfant')?.addEventListener('click', modals.ouvrirFormAjoutEnfant);
    document.getElementById('btn-valider-ajout-enfant')?.addEventListener('click', modals.validerAjoutEnfant);
    document.getElementById('btn-annuler-ajout-enfant')?.addEventListener('click', modals.annulerAjoutEnfant);
    document.getElementById('btn-annuler-renommer-profil')?.addEventListener('click', modals.fermerModaleRenommerProfil);
    document.getElementById('btn-confirmer-renommer-profil')?.addEventListener('click', modals.confirmerRenommerProfil);
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
        if (MonHistoire.modules.stories && MonHistoire.modules.stories.display) {
          MonHistoire.modules.stories.display.afficherHistoireSauvegardee(histoireId);
        }
        break;
      case 'supprimer':
        if (MonHistoire.modules.stories && MonHistoire.modules.stories.management) {
          MonHistoire.modules.stories.management.supprimerHistoire(histoireId);
        }
        break;
    }
  }

  MonHistoire.modules.ui.events = {
    init,
    bindLongPress,
    protegerBouton,
    bindEvents
  };
})();
