// js/adapters/test.js
// Script de test pour vérifier que les adaptateurs fonctionnent correctement

(function() {
  console.log("Initialisation du script de test des adaptateurs...");
  
  // Fonction pour vérifier si un objet existe
  function checkExists(path, description) {
    const parts = path.split('.');
    let obj = window;
    
    for (const part of parts) {
      if (!obj[part]) {
        console.error(`❌ ${description} (${path}) n'existe pas`);
        return false;
      }
      obj = obj[part];
    }
    
    console.log(`✅ ${description} (${path}) existe`);
    return true;
  }
  
  // Fonction pour exécuter les tests
  function runTests() {
    console.log("Exécution des tests des adaptateurs...");
    
    // Vérifier les namespaces originaux
    checkExists('MonHistoire.core.storage', 'Module de stockage (ancien namespace)');
    checkExists('MonHistoire.core.navigation', 'Module de navigation (ancien namespace)');
    checkExists('MonHistoire.core.auth', 'Module d\'authentification (ancien namespace)');
    checkExists('MonHistoire.core.profiles', 'Module de profils (ancien namespace)');
    checkExists('MonHistoire.features.stories.display', 'Module d\'affichage d\'histoires (ancien namespace)');
    checkExists('MonHistoire.features.stories.management', 'Module de gestion d\'histoires (ancien namespace)');
    checkExists('MonHistoire.features.stories.generator', 'Module de génération d\'histoires (ancien namespace)');
    checkExists('MonHistoire.features.export', 'Module d\'export (ancien namespace)');
    checkExists('MonHistoire.features.audio', 'Module audio (ancien namespace)');
    checkExists('MonHistoire.features.cookies', 'Module de cookies (ancien namespace)');
    
    // Vérifier les nouveaux namespaces
    checkExists('MonHistoire.modules.core.storage', 'Module de stockage (nouveau namespace)');
    checkExists('MonHistoire.modules.core.navigation', 'Module de navigation (nouveau namespace)');
    checkExists('MonHistoire.modules.user.auth', 'Module d\'authentification (nouveau namespace)');
    checkExists('MonHistoire.modules.user.profiles', 'Module de profils (nouveau namespace)');
    checkExists('MonHistoire.modules.stories.display', 'Module d\'affichage d\'histoires (nouveau namespace)');
    checkExists('MonHistoire.modules.stories.management', 'Module de gestion d\'histoires (nouveau namespace)');
    checkExists('MonHistoire.modules.stories.generator', 'Module de génération d\'histoires (nouveau namespace)');
    checkExists('MonHistoire.modules.stories.export', 'Module d\'export (nouveau namespace)');
    checkExists('MonHistoire.modules.features.audio', 'Module audio (nouveau namespace)');
    checkExists('MonHistoire.modules.core.cookies', 'Module de cookies (nouveau namespace)');
    
    console.log("Test des adaptateurs terminé");
  }
  
  // Attendre que les adaptateurs soient chargés avant d'exécuter les tests
  window.addEventListener('adapters-loaded', function() {
    console.log("Événement 'adapters-loaded' reçu, exécution des tests...");
    // Attendre un court instant pour s'assurer que tous les adaptateurs sont bien initialisés
    setTimeout(runTests, 100);
  });
  
  // Ajouter un écouteur d'événements pour tester les adaptateurs après le chargement complet
  window.addEventListener('load', function() {
    console.log("Page chargée, test des adaptateurs en action...");
    
    // S'assurer que les adaptateurs sont chargés avant de tester les fonctions
    if (window.adaptersLoaded) {
      testAdapterFunctions();
    } else {
      // Si les adaptateurs ne sont pas encore chargés, attendre l'événement
      window.addEventListener('adapters-loaded', function() {
        // Attendre un court instant pour s'assurer que tous les adaptateurs sont bien initialisés
        setTimeout(testAdapterFunctions, 100);
      });
    }
  });
  
  // Fonction pour tester les fonctions des adaptateurs
  function testAdapterFunctions() {
    try {
      // Tester le module de navigation
      if (typeof MonHistoire.core.navigation.getActiveScreen === 'function') {
        const activeScreen = MonHistoire.core.navigation.getActiveScreen();
        console.log(`✅ Écran actif: ${activeScreen}`);
      }
      
      // Tester le module d'authentification
      if (typeof MonHistoire.core.auth.isLoggedIn === 'function') {
        const isLoggedIn = MonHistoire.core.auth.isLoggedIn();
        console.log(`✅ Utilisateur connecté: ${isLoggedIn}`);
      }
      
      console.log("Test des adaptateurs en action terminé avec succès");
    } catch (error) {
      console.error("Erreur lors du test des adaptateurs en action:", error);
    }
  }
})();
