// Point d'entrée principal de l'application
// Ce fichier est chargé après firebase-init.js et avant les autres scripts

// Initialisation de l'application
document.addEventListener('DOMContentLoaded', () => {
  console.log('Application Mon Histoire initialisée');
  
  // Vérification que Firebase est correctement initialisé
  if (typeof firebase !== 'undefined' && firebase.app) {
    console.log('Firebase est correctement initialisé');
  } else {
    console.error('Firebase n\'est pas correctement initialisé');
  }
  
  // Vérification du chargement des fichiers CSS
  console.log('[DEBUG CSS] Vérification du chargement des fichiers CSS');
  
  // Fonction pour vérifier si un fichier CSS est chargé
  function isCssLoaded(fileName) {
    const styleSheets = document.styleSheets;
    for (let i = 0; i < styleSheets.length; i++) {
      try {
        const href = styleSheets[i].href;
        if (href && href.includes(fileName)) {
          console.log(`[DEBUG CSS] Fichier CSS trouvé: ${fileName}`);
          return true;
        }
      } catch (e) {
        // Erreur CORS possible si la feuille de style est chargée depuis un autre domaine
        console.log(`[DEBUG CSS] Erreur lors de la vérification de la feuille de style ${i}:`, e);
      }
    }
    console.log(`[DEBUG CSS] Fichier CSS NON trouvé: ${fileName}`);
    return false;
  }
  
  // Vérifier les fichiers CSS importants
  isCssLoaded('features/notation.css');
  isCssLoaded('screens/resultat.css');
  isCssLoaded('main.css');
  
  // Vérifier si l'élément bloc-notation existe dans le DOM
  setTimeout(() => {
    const blocNotation = document.getElementById('bloc-notation');
    console.log('[DEBUG DOM] Élément bloc-notation trouvé:', !!blocNotation);
    if (blocNotation) {
      console.log('[DEBUG DOM] Classes du bloc-notation:', blocNotation.className);
      console.log('[DEBUG DOM] Style display du bloc-notation:', window.getComputedStyle(blocNotation).display);
      console.log('[DEBUG DOM] Contenu HTML du bloc-notation:', blocNotation.innerHTML);
    }
  }, 2000); // Délai pour s'assurer que le DOM est complètement chargé
});
