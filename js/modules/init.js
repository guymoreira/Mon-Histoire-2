// js/modules/init.js
// Script d'initialisation des modules
// Ce script est chargé après tous les autres scripts pour s'assurer que tous les modules sont correctement initialisés

(function() {
  console.log("Initialisation des modules...");
  
  // Fonction pour initialiser les modules
  function initModules() {
    console.log("Initialisation des modules core...");
    
    // Initialiser les modules core
    if (MonHistoire.modules && MonHistoire.modules.core) {
      if (MonHistoire.modules.core.config) {
        console.log("Initialisation du module core.config...");
        MonHistoire.modules.core.config.init && MonHistoire.modules.core.config.init();
      }
      
      if (MonHistoire.modules.core.cookies) {
        console.log("Initialisation du module core.cookies...");
        MonHistoire.modules.core.cookies.init && MonHistoire.modules.core.cookies.init();
      }
      
      if (MonHistoire.modules.core.navigation) {
        console.log("Initialisation du module core.navigation...");
        MonHistoire.modules.core.navigation.init && MonHistoire.modules.core.navigation.init();
      }
      
      if (MonHistoire.modules.core.storage) {
        console.log("Initialisation du module core.storage...");
        MonHistoire.modules.core.storage.init && MonHistoire.modules.core.storage.init();
      }
    }
    
    console.log("Initialisation des modules utilisateur...");
    
    // Initialiser les modules utilisateur
    if (MonHistoire.modules && MonHistoire.modules.user) {
      if (MonHistoire.modules.user.account) {
        console.log("Initialisation du module user.account...");
        MonHistoire.modules.user.account.init && MonHistoire.modules.user.account.init();
      }
      
      if (MonHistoire.modules.user.activity) {
        console.log("Initialisation du module user.activity...");
        MonHistoire.modules.user.activity.init && MonHistoire.modules.user.activity.init();
      }
      
      if (MonHistoire.modules.user.auth) {
        console.log("Initialisation du module user.auth...");
        MonHistoire.modules.user.auth.init && MonHistoire.modules.user.auth.init();
      }
      
      if (MonHistoire.modules.user.profiles) {
        console.log("Initialisation du module user.profiles...");
        MonHistoire.modules.user.profiles.init && MonHistoire.modules.user.profiles.init();
      }
    }
    
    console.log("Initialisation des modules d'histoires...");
    
    // Initialiser les modules d'histoires
    if (MonHistoire.modules && MonHistoire.modules.stories) {
      if (MonHistoire.modules.stories.generator) {
        console.log("Initialisation du module stories.generator...");
        MonHistoire.modules.stories.generator.init && MonHistoire.modules.stories.generator.init();
      }
      
      if (MonHistoire.modules.stories.display) {
        console.log("Initialisation du module stories.display...");
        MonHistoire.modules.stories.display.init && MonHistoire.modules.stories.display.init();
      }
      
      if (MonHistoire.modules.stories.management) {
        console.log("Initialisation du module stories.management...");
        MonHistoire.modules.stories.management.init && MonHistoire.modules.stories.management.init();
      }
      
      if (MonHistoire.modules.stories.export) {
        console.log("Initialisation du module stories.export...");
        MonHistoire.modules.stories.export.init && MonHistoire.modules.stories.export.init();
      }
    }
    
    console.log("Initialisation des modules de fonctionnalités...");
    
    // Initialiser les modules de fonctionnalités
    if (MonHistoire.modules && MonHistoire.modules.features) {
      if (MonHistoire.modules.features.audio) {
        console.log("Initialisation du module features.audio...");
        MonHistoire.modules.features.audio.init && MonHistoire.modules.features.audio.init();
      }
      
      if (MonHistoire.modules.features.cookies) {
        console.log("Initialisation du module features.cookies...");
        MonHistoire.modules.features.cookies.init && MonHistoire.modules.features.cookies.init();
      }
      
      if (MonHistoire.modules.features.export) {
        console.log("Initialisation du module features.export...");
        MonHistoire.modules.features.export.init && MonHistoire.modules.features.export.init();
      }
    }
    
    console.log("Initialisation des modules de partage...");
    
    // Initialiser les modules de partage
    if (MonHistoire.modules && MonHistoire.modules.sharing) {
      console.log("Initialisation du module sharing...");
      MonHistoire.modules.sharing.init && MonHistoire.modules.sharing.init();
    }
    
    console.log("Initialisation des modules de messagerie...");
    
    // Initialiser les modules de messagerie
    if (MonHistoire.modules && MonHistoire.modules.messaging) {
      console.log("Initialisation du module messaging...");
      MonHistoire.modules.messaging.init && MonHistoire.modules.messaging.init();
    }
    
    console.log("Initialisation des modules d'interface utilisateur...");
    
    // Initialiser les modules d'interface utilisateur
    if (MonHistoire.modules && MonHistoire.modules.ui) {
      if (MonHistoire.modules.ui.common) {
        console.log("Initialisation du module ui.common...");
        MonHistoire.modules.ui.common.init && MonHistoire.modules.ui.common.init();
      }
      
      if (MonHistoire.modules.ui.debug) {
        console.log("Initialisation du module ui.debug...");
        MonHistoire.modules.ui.debug.init && MonHistoire.modules.ui.debug.init();
      }
      
      if (MonHistoire.modules.ui.modals) {
        console.log("Initialisation du module ui.modals...");
        MonHistoire.modules.ui.modals.init && MonHistoire.modules.ui.modals.init();
      }
      
      if (MonHistoire.modules.ui.events) {
        console.log("Initialisation du module ui.events...");
        MonHistoire.modules.ui.events.init && MonHistoire.modules.ui.events.init();
      }
    }
    
    console.log("Tous les modules ont été initialisés avec succès");
    
    // Émettre un événement pour signaler que les modules sont prêts
    const event = new CustomEvent('modules-initialized');
    window.dispatchEvent(event);
  }
  
  // Attendre que les adaptateurs soient chargés avant d'initialiser les modules
  if (window.adaptersLoaded) {
    console.log("Les adaptateurs sont déjà chargés, initialisation des modules...");
    initModules();
  } else {
    console.log("En attente du chargement des adaptateurs...");
    window.addEventListener('adapters-loaded', function() {
      console.log("Les adaptateurs sont chargés, initialisation des modules...");
      initModules();
    });
    
    // Timeout de sécurité au cas où l'événement 'adapters-loaded' ne serait pas déclenché
    setTimeout(function() {
      if (!window.adaptersLoaded) {
        console.warn("Les adaptateurs n'ont pas été chargés après 5 secondes, initialisation des modules quand même...");
        window.adaptersLoaded = true;
        initModules();
      }
    }, 5000);
  }
})();
