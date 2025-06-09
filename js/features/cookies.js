// js/features/cookies.js
// Gestion des cookies et des préférences de confidentialité

// S'assurer que l'objet global existe
window.MonHistoire = window.MonHistoire || {};

// Module Cookies
MonHistoire.features = MonHistoire.features || {};
MonHistoire.features.cookies = {
  // Préférences par défaut
  preferences: {
    essential: true,    // Toujours activé, ne peut pas être désactivé
    functional: true,   // Stockage local, préférences utilisateur
    analytics: true,    // Firebase Analytics
    thirdParty: true    // CDN externes, etc.
  },

  // Initialisation du module
  init() {
    // Vérifie si les préférences de cookies sont déjà définies
    const cookieConsent = localStorage.getItem('cookieConsent');
    
    if (!cookieConsent) {
      // Si aucune préférence n'est définie, affiche la bannière
      this.afficherBanniereCookies();
    } else {
      // Sinon, charge les préférences sauvegardées
      try {
        this.preferences = JSON.parse(cookieConsent);
        // S'assure que les cookies essentiels sont toujours activés
        this.preferences.essential = true;
      } catch (e) {
        console.error("Erreur lors du chargement des préférences de cookies:", e);
        // En cas d'erreur, réinitialise les préférences
        this.afficherBanniereCookies();
      }
    }

    // Initialise les gestionnaires d'événements
    this.bindEvents();
  },

  // Attache les gestionnaires d'événements
  bindEvents() {
    // Bouton "Tout accepter" dans la bannière
    document.getElementById('cookie-accept-all')?.addEventListener('click', () => {
      this.accepterTousCookies();
    });

    // Bouton "Personnaliser" dans la bannière
    document.getElementById('cookie-customize')?.addEventListener('click', () => {
      this.ouvrirParametresCookies();
    });

    // Lien "Paramètres des cookies" dans le footer
    document.getElementById('cookie-settings-link')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.ouvrirParametresCookies();
    });

    // Bouton "Enregistrer mes préférences" dans les paramètres
    document.getElementById('cookie-save')?.addEventListener('click', () => {
      this.sauvegarderPreferences();
    });

    // Fonction pour changer d'onglet dans la modale RGPD
    window.switchRgpdTab = function(event, tabId) {
      // Masque tous les onglets
      const tabPanes = document.getElementsByClassName('rgpd-tab-pane');
      for (let i = 0; i < tabPanes.length; i++) {
        tabPanes[i].classList.remove('active');
      }

      // Désactive tous les boutons d'onglet
      const tabButtons = document.getElementsByClassName('rgpd-tab-button');
      for (let i = 0; i < tabButtons.length; i++) {
        tabButtons[i].classList.remove('active');
      }

      // Affiche l'onglet sélectionné
      document.getElementById(tabId).classList.add('active');

      // Active le bouton d'onglet sélectionné
      event.currentTarget.classList.add('active');
    };
  },

  // Affiche la bannière de cookies
  afficherBanniereCookies() {
    const banner = document.getElementById('cookie-banner');
    if (banner) {
      banner.style.display = 'block';
    }
  },

  // Masque la bannière de cookies
  masquerBanniereCookies() {
    const banner = document.getElementById('cookie-banner');
    if (banner) {
      banner.style.display = 'none';
    }
  },

  // Accepte tous les cookies
  accepterTousCookies() {
    // Définit toutes les préférences à true
    this.preferences = {
      essential: true,
      functional: true,
      analytics: true,
      thirdParty: true
    };

    // Sauvegarde les préférences
    localStorage.setItem('cookieConsent', JSON.stringify(this.preferences));

    // Masque la bannière
    this.masquerBanniereCookies();

    // Active les fonctionnalités correspondantes
    this.appliquerPreferences();
  },

  // Ouvre la modale des paramètres de cookies
  ouvrirParametresCookies() {
    // Vérifie si le profil actif est un profil enfant
    if (MonHistoire.state && MonHistoire.state.profilActif && MonHistoire.state.profilActif.type === "enfant") {
      // Si c'est un enfant, ne pas ouvrir les paramètres et afficher un message
      MonHistoire.showMessageModal("Seul un profil parent peut modifier les paramètres de cookies.");
      return;
    }
    
    // Masque la bannière
    this.masquerBanniereCookies();

    // Ouvre la modale RGPD sur l'onglet des paramètres
    const modal = document.getElementById('modal-rgpd');
    if (modal) {
      modal.classList.add('show');

      // Sélectionne l'onglet des paramètres
      const tabButtons = document.getElementsByClassName('rgpd-tab-button');
      for (let i = 0; i < tabButtons.length; i++) {
        if (tabButtons[i].getAttribute('onclick').includes('tab-settings')) {
          tabButtons[i].click();
          break;
        }
      }

      // Met à jour l'état des interrupteurs selon les préférences actuelles
      this.mettreAJourInterrupteurs();
    }
  },

  // Met à jour l'état des interrupteurs selon les préférences actuelles
  mettreAJourInterrupteurs() {
    document.getElementById('functional-cookies').checked = this.preferences.functional;
    document.getElementById('analytics-cookies').checked = this.preferences.analytics;
    document.getElementById('third-party-cookies').checked = this.preferences.thirdParty;
  },

  // Sauvegarde les préférences de cookies
  sauvegarderPreferences() {
    // Récupère l'état des interrupteurs
    this.preferences.functional = document.getElementById('functional-cookies').checked;
    this.preferences.analytics = document.getElementById('analytics-cookies').checked;
    this.preferences.thirdParty = document.getElementById('third-party-cookies').checked;

    // Sauvegarde les préférences
    localStorage.setItem('cookieConsent', JSON.stringify(this.preferences));

    // Ferme la modale
    document.getElementById('modal-rgpd').classList.remove('show');

    // Applique les préférences
    this.appliquerPreferences();

    // Affiche un message de confirmation
    MonHistoire.showMessageModal("Vos préférences de cookies ont été enregistrées.");
  },

  // Applique les préférences de cookies
  appliquerPreferences() {
    // Cookies fonctionnels (localStorage)
    if (!this.preferences.functional) {
      // Si désactivé, supprime les données non essentielles du localStorage
      // Mais conserve les données essentielles comme l'authentification
      const keysToKeep = ['cookieConsent', 'firebase:authUser'];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!keysToKeep.some(k => key.startsWith(k))) {
          localStorage.removeItem(key);
        }
      }
    }

    // Cookies analytiques (Firebase Analytics)
    if (this.preferences.analytics) {
      // Active Firebase Analytics
      if (firebase.analytics && typeof firebase.analytics === 'function') {
        firebase.analytics().setAnalyticsCollectionEnabled(true);
      }
    } else {
      // Désactive Firebase Analytics
      if (firebase.analytics && typeof firebase.analytics === 'function') {
        firebase.analytics().setAnalyticsCollectionEnabled(false);
      }
    }

    // Cookies tiers (rien à faire pour le moment, car les CDN sont chargés au démarrage)
    // Dans une implémentation plus avancée, on pourrait charger dynamiquement les scripts tiers
  }
};

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
  MonHistoire.features.cookies.init();
});

// Exporter pour utilisation dans d'autres modules
window.MonHistoire = MonHistoire;
