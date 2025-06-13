// js/adapters/index.js
// Fichier principal pour charger tous les adaptateurs

(function() {
  console.log("Initialisation des adaptateurs pour la compatibilité entre anciens et nouveaux modules");
  
  // Liste des adaptateurs à charger
  const adapters = [
    "storage-adapter.js",
    "navigation-adapter.js",
    "auth-adapter.js",
    "profiles-adapter.js",
    "core-profiles-adapter.js",
    "stories-adapter.js",
    "features-adapter.js",
    "ui-adapter.js"
  ];
  
  // Fonction pour charger un script dynamiquement
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Erreur de chargement du script: ${src}`));
      document.head.appendChild(script);
    });
  }
  
  // Charger tous les adaptateurs
  Promise.all(adapters.map(adapter => loadScript(`js/adapters/${adapter}`)))
    .then(() => {
      console.log("Tous les adaptateurs ont été chargés avec succès");
      
      // Définir une variable globale pour indiquer que les adaptateurs sont chargés
      window.adaptersLoaded = true;
      
      // Émettre un événement pour signaler que les adaptateurs sont prêts
      const event = new CustomEvent('adapters-loaded');
      window.dispatchEvent(event);
    })
    .catch(error => {
      console.error("Erreur lors du chargement des adaptateurs:", error);
    });
})();
