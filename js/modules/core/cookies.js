// js/modules/core/cookies.js
// Module de gestion des cookies
// Responsable de la gestion du consentement aux cookies et des préférences utilisateur

// S'assurer que les namespaces existent
window.MonHistoire = window.MonHistoire || {};
MonHistoire.modules = MonHistoire.modules || {};
MonHistoire.modules.core = MonHistoire.modules.core || {};

// Module de gestion des cookies
(function() {
  // Variables privées
  let isInitialized = false;
  let cookiesAccepted = false;
  let preferences = {
    necessary: true, // Toujours activé
    functional: false,
    analytics: false,
    marketing: false
  };
  
  // Constantes
  const COOKIE_CONSENT_NAME = 'mon-histoire-cookie-consent';
  const COOKIE_PREFERENCES_NAME = 'mon-histoire-cookie-preferences';
  const COOKIE_EXPIRATION_DAYS = 365;
  
  /**
   * Initialise le module de gestion des cookies
   */
  function init() {
    if (isInitialized) {
      console.warn("Module Cookies déjà initialisé");
      return;
    }
    
    // Charger les préférences de cookies
    loadCookiePreferences();
    
    // Configurer les écouteurs d'événements
    setupListeners();
    
    // Afficher la bannière de cookies si nécessaire
    if (!cookiesAccepted) {
      showCookieBanner();
    }
    
    isInitialized = true;
    console.log("Module Cookies initialisé");
  }
  
  /**
   * Charge les préférences de cookies depuis les cookies
   */
  function loadCookiePreferences() {
    // Vérifier si le consentement aux cookies existe
    const consentCookie = getCookie(COOKIE_CONSENT_NAME);
    cookiesAccepted = consentCookie === 'true';
    
    // Charger les préférences si le consentement existe
    if (cookiesAccepted) {
      const preferencesCookie = getCookie(COOKIE_PREFERENCES_NAME);
      
      if (preferencesCookie) {
        try {
          const savedPreferences = JSON.parse(preferencesCookie);
          
          // Mettre à jour les préférences
          preferences = {
            ...preferences,
            ...savedPreferences
          };
          
          console.log("Préférences de cookies chargées:", preferences);
        } catch (error) {
          console.error("Erreur lors du chargement des préférences de cookies:", error);
        }
      }
    }
  }
  
  /**
   * Configure les écouteurs d'événements
   */
  function setupListeners() {
    // Bouton d'acceptation de tous les cookies
    document.addEventListener('click', function(event) {
      if (event.target.classList.contains('accept-all-cookies')) {
        acceptAllCookies();
      }
    });
    
    // Bouton d'acceptation des cookies nécessaires uniquement
    document.addEventListener('click', function(event) {
      if (event.target.classList.contains('accept-necessary-cookies')) {
        acceptNecessaryCookies();
      }
    });
    
    // Bouton de personnalisation des cookies
    document.addEventListener('click', function(event) {
      if (event.target.classList.contains('customize-cookies')) {
        showCookiePreferences();
      }
    });
    
    // Bouton de sauvegarde des préférences
    document.addEventListener('click', function(event) {
      if (event.target.classList.contains('save-cookie-preferences')) {
        saveCookiePreferences();
      }
    });
    
    console.log("Écouteurs configurés");
  }
  
  /**
   * Affiche la bannière de cookies
   */
  function showCookieBanner() {
    const cookieBanner = document.getElementById('cookie-banner');
    if (cookieBanner) {
      cookieBanner.classList.remove('hidden');
    } else {
      // Créer la bannière si elle n'existe pas
      createCookieBanner();
    }
  }
  
  /**
   * Crée la bannière de cookies
   */
  function createCookieBanner() {
    // Créer l'élément de bannière
    const cookieBanner = document.createElement('div');
    cookieBanner.id = 'cookie-banner';
    cookieBanner.className = 'cookie-banner';
    
    // Ajouter le contenu
    cookieBanner.innerHTML = `
      <div class="cookie-banner-content">
        <h3>Utilisation des cookies</h3>
        <p>Nous utilisons des cookies pour améliorer votre expérience sur notre site. Vous pouvez personnaliser vos préférences ou accepter tous les cookies.</p>
        <div class="cookie-banner-buttons">
          <button class="customize-cookies secondary-button">Personnaliser</button>
          <button class="accept-necessary-cookies secondary-button">Cookies nécessaires uniquement</button>
          <button class="accept-all-cookies primary-button">Accepter tous les cookies</button>
        </div>
      </div>
    `;
    
    // Ajouter la bannière au document
    document.body.appendChild(cookieBanner);
  }
  
  /**
   * Masque la bannière de cookies
   */
  function hideCookieBanner() {
    const cookieBanner = document.getElementById('cookie-banner');
    if (cookieBanner) {
      cookieBanner.classList.add('hidden');
    }
  }
  
  /**
   * Affiche le modal de préférences de cookies
   */
  function showCookiePreferences() {
    // Masquer la bannière
    hideCookieBanner();
    
    const preferencesModal = document.getElementById('cookie-preferences-modal');
    if (preferencesModal) {
      // Mettre à jour les cases à cocher
      updatePreferencesCheckboxes();
      
      // Afficher le modal
      preferencesModal.classList.add('show');
    } else {
      // Créer le modal si il n'existe pas
      createCookiePreferencesModal();
    }
  }
  
  /**
   * Crée le modal de préférences de cookies
   */
  function createCookiePreferencesModal() {
    // Créer l'élément de modal
    const preferencesModal = document.createElement('div');
    preferencesModal.id = 'cookie-preferences-modal';
    preferencesModal.className = 'modal';
    
    // Ajouter le contenu
    preferencesModal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>Préférences de cookies</h3>
          <button class="close-modal">&times;</button>
        </div>
        <div class="modal-body">
          <div class="cookie-preference-item">
            <div class="cookie-preference-header">
              <label>
                <input type="checkbox" id="necessary-cookies" checked disabled>
                <span>Cookies nécessaires</span>
              </label>
            </div>
            <div class="cookie-preference-description">
              <p>Ces cookies sont nécessaires au fonctionnement du site et ne peuvent pas être désactivés.</p>
            </div>
          </div>
          
          <div class="cookie-preference-item">
            <div class="cookie-preference-header">
              <label>
                <input type="checkbox" id="functional-cookies" ${preferences.functional ? 'checked' : ''}>
                <span>Cookies fonctionnels</span>
              </label>
            </div>
            <div class="cookie-preference-description">
              <p>Ces cookies permettent d'améliorer les fonctionnalités et la personnalisation de votre expérience.</p>
            </div>
          </div>
          
          <div class="cookie-preference-item">
            <div class="cookie-preference-header">
              <label>
                <input type="checkbox" id="analytics-cookies" ${preferences.analytics ? 'checked' : ''}>
                <span>Cookies analytiques</span>
              </label>
            </div>
            <div class="cookie-preference-description">
              <p>Ces cookies nous aident à comprendre comment les visiteurs interagissent avec le site.</p>
            </div>
          </div>
          
          <div class="cookie-preference-item">
            <div class="cookie-preference-header">
              <label>
                <input type="checkbox" id="marketing-cookies" ${preferences.marketing ? 'checked' : ''}>
                <span>Cookies marketing</span>
              </label>
            </div>
            <div class="cookie-preference-description">
              <p>Ces cookies sont utilisés pour suivre les visiteurs sur les sites web afin d'afficher des publicités pertinentes.</p>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="save-cookie-preferences primary-button">Enregistrer les préférences</button>
        </div>
      </div>
    `;
    
    // Ajouter un écouteur pour fermer le modal
    preferencesModal.querySelector('.close-modal').addEventListener('click', () => {
      preferencesModal.classList.remove('show');
    });
    
    // Ajouter le modal au document
    document.body.appendChild(preferencesModal);
    
    // Afficher le modal
    preferencesModal.classList.add('show');
  }
  
  /**
   * Met à jour les cases à cocher des préférences
   */
  function updatePreferencesCheckboxes() {
    const functionalCheckbox = document.getElementById('functional-cookies');
    const analyticsCheckbox = document.getElementById('analytics-cookies');
    const marketingCheckbox = document.getElementById('marketing-cookies');
    
    if (functionalCheckbox) {
      functionalCheckbox.checked = preferences.functional;
    }
    
    if (analyticsCheckbox) {
      analyticsCheckbox.checked = preferences.analytics;
    }
    
    if (marketingCheckbox) {
      marketingCheckbox.checked = preferences.marketing;
    }
  }
  
  /**
   * Accepte tous les cookies
   */
  function acceptAllCookies() {
    // Mettre à jour les préférences
    preferences = {
      necessary: true,
      functional: true,
      analytics: true,
      marketing: true
    };
    
    // Sauvegarder les préférences
    savePreferences();
    
    // Masquer la bannière
    hideCookieBanner();
    
    // Émettre un événement pour informer les autres modules
    if (MonHistoire.events) {
      MonHistoire.events.emit('cookiesAccepted', preferences);
    }
    
    console.log("Tous les cookies acceptés");
  }
  
  /**
   * Accepte uniquement les cookies nécessaires
   */
  function acceptNecessaryCookies() {
    // Mettre à jour les préférences
    preferences = {
      necessary: true,
      functional: false,
      analytics: false,
      marketing: false
    };
    
    // Sauvegarder les préférences
    savePreferences();
    
    // Masquer la bannière
    hideCookieBanner();
    
    // Émettre un événement pour informer les autres modules
    if (MonHistoire.events) {
      MonHistoire.events.emit('cookiesAccepted', preferences);
    }
    
    console.log("Cookies nécessaires uniquement acceptés");
  }
  
  /**
   * Sauvegarde les préférences de cookies depuis le modal
   */
  function saveCookiePreferences() {
    // Récupérer les valeurs des cases à cocher
    const functionalCheckbox = document.getElementById('functional-cookies');
    const analyticsCheckbox = document.getElementById('analytics-cookies');
    const marketingCheckbox = document.getElementById('marketing-cookies');
    
    // Mettre à jour les préférences
    preferences = {
      necessary: true, // Toujours activé
      functional: functionalCheckbox ? functionalCheckbox.checked : false,
      analytics: analyticsCheckbox ? analyticsCheckbox.checked : false,
      marketing: marketingCheckbox ? marketingCheckbox.checked : false
    };
    
    // Sauvegarder les préférences
    savePreferences();
    
    // Masquer le modal
    const preferencesModal = document.getElementById('cookie-preferences-modal');
    if (preferencesModal) {
      preferencesModal.classList.remove('show');
    }
    
    // Émettre un événement pour informer les autres modules
    if (MonHistoire.events) {
      MonHistoire.events.emit('cookiesAccepted', preferences);
    }
    
    console.log("Préférences de cookies sauvegardées:", preferences);
  }
  
  /**
   * Sauvegarde les préférences dans les cookies
   */
  function savePreferences() {
    // Marquer les cookies comme acceptés
    cookiesAccepted = true;
    
    // Sauvegarder le consentement
    setCookie(COOKIE_CONSENT_NAME, 'true', COOKIE_EXPIRATION_DAYS);
    
    // Sauvegarder les préférences
    setCookie(COOKIE_PREFERENCES_NAME, JSON.stringify(preferences), COOKIE_EXPIRATION_DAYS);
  }
  
  /**
   * Récupère un cookie par son nom
   * @param {string} name - Nom du cookie
   * @returns {string} Valeur du cookie ou chaîne vide si non trouvé
   */
  function getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') {
        c = c.substring(1, c.length);
      }
      
      if (c.indexOf(nameEQ) === 0) {
        return c.substring(nameEQ.length, c.length);
      }
    }
    
    return '';
  }
  
  /**
   * Définit un cookie
   * @param {string} name - Nom du cookie
   * @param {string} value - Valeur du cookie
   * @param {number} days - Nombre de jours avant expiration
   */
  function setCookie(name, value, days) {
    let expires = '';
    
    if (days) {
      const date = new Date();
      date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
      expires = "; expires=" + date.toUTCString();
    }
    
    document.cookie = name + "=" + value + expires + "; path=/; SameSite=Strict";
  }
  
  /**
   * Supprime un cookie
   * @param {string} name - Nom du cookie
   */
  function deleteCookie(name) {
    setCookie(name, '', -1);
  }
  
  /**
   * Vérifie si les cookies sont acceptés
   * @returns {boolean} True si les cookies sont acceptés
   */
  function areCookiesAccepted() {
    return cookiesAccepted;
  }
  
  /**
   * Vérifie si un type de cookie est accepté
   * @param {string} type - Type de cookie (necessary, functional, analytics, marketing)
   * @returns {boolean} True si le type de cookie est accepté
   */
  function isCookieTypeAccepted(type) {
    if (!cookiesAccepted) {
      return type === 'necessary';
    }
    
    return preferences[type] || false;
  }
  
  /**
   * Obtient les préférences de cookies
   * @returns {Object} Préférences de cookies
   */
  function getPreferences() {
    return { ...preferences };
  }
  
  /**
   * Réinitialise les préférences de cookies
   */
  function resetPreferences() {
    // Supprimer les cookies
    deleteCookie(COOKIE_CONSENT_NAME);
    deleteCookie(COOKIE_PREFERENCES_NAME);
    
    // Réinitialiser les variables
    cookiesAccepted = false;
    preferences = {
      necessary: true,
      functional: false,
      analytics: false,
      marketing: false
    };
    
    // Afficher la bannière
    showCookieBanner();
    
    // Émettre un événement pour informer les autres modules
    if (MonHistoire.events) {
      MonHistoire.events.emit('cookiesReset');
    }
    
    console.log("Préférences de cookies réinitialisées");
  }
  
  // API publique
  MonHistoire.modules.core.cookies = {
    init: init,
    areCookiesAccepted: areCookiesAccepted,
    isCookieTypeAccepted: isCookieTypeAccepted,
    getPreferences: getPreferences,
    resetPreferences: resetPreferences,
    showCookiePreferences: showCookiePreferences
  };
})();
