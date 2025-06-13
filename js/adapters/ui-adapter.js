// js/adapters/ui-adapter.js
// Adaptateur pour les fonctions d'interface utilisateur

(function() {
  console.log("Initialisation de l'adaptateur UI");
  
  // Vérifier que les namespaces nécessaires existent
  window.MonHistoire = window.MonHistoire || {};
  MonHistoire.modules = MonHistoire.modules || {};
  MonHistoire.modules.app = MonHistoire.modules.app || {};
  
  // Implémentation de la fonction closeMessageModal
  function closeMessageModalImpl() {
    const modal = document.getElementById('message-modal');
    if (modal) {
      modal.classList.remove('show');
      
      // S'assurer que le modal est bien caché
      setTimeout(() => {
        if (modal.classList.contains('show')) {
          modal.classList.remove('show');
        }
      }, 100);
    }
  }
  
  // Implémentation de la fonction showMessageModal
  function showMessageModalImpl(message, type = 'info', options = {}) {
    // Vérifier si le modal existe déjà
    let modal = document.getElementById('message-modal');
    
    // Créer le modal s'il n'existe pas
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'message-modal';
      modal.className = 'modal message-modal';
      
      // Ajouter le contenu du modal
      modal.innerHTML = `
        <div class="message-card">
          <p id="message-modal-text"></p>
          <button class="button button-blue" id="close-message-modal">OK</button>
        </div>
      `;
      
      // Ajouter le modal au document
      document.body.appendChild(modal);
    }
    
    // Mettre à jour le contenu du modal
    const modalText = modal.querySelector('#message-modal-text');
    if (modalText) {
      modalText.textContent = message;
    }
    
    // Ajouter les écouteurs d'événements
    const closeButton = modal.querySelector('#close-message-modal');
    if (closeButton) {
      // Supprimer les écouteurs existants pour éviter les doublons
      const newCloseButton = closeButton.cloneNode(true);
      if (closeButton.parentNode) {
        closeButton.parentNode.replaceChild(newCloseButton, closeButton);
      }
      
      // Ajouter le nouvel écouteur
      newCloseButton.addEventListener('click', closeMessageModalImpl);
    }
    
    // Afficher le modal
    modal.classList.add('show');
    
    // Fermer automatiquement le modal après un délai si demandé
    if (options.autoClose) {
      setTimeout(() => {
        closeMessageModalImpl();
      }, options.autoCloseDelay || 3000);
    }
  }
  
  // Adapter la fonction closeMessageModal
  MonHistoire.closeMessageModal = closeMessageModalImpl;
  MonHistoire.modules.app.closeMessageModal = closeMessageModalImpl;
  console.log("Fonction closeMessageModal implémentée dans les deux namespaces");
  
  // Adapter la fonction showMessageModal
  if (typeof MonHistoire.showMessageModal === 'function' && 
      typeof MonHistoire.modules.app.showMessageModal !== 'function') {
    // Si la fonction existe dans l'ancien namespace mais pas dans le nouveau
    MonHistoire.modules.app.showMessageModal = function(message, options) {
      return MonHistoire.showMessageModal(message, options);
    };
    console.log("Fonction showMessageModal adaptée de MonHistoire vers MonHistoire.modules.app");
  } else if (typeof MonHistoire.modules.app.showMessageModal === 'function' && 
             typeof MonHistoire.showMessageModal !== 'function') {
    // Si la fonction existe dans le nouveau namespace mais pas dans l'ancien
    MonHistoire.showMessageModal = function(message, options) {
      return MonHistoire.modules.app.showMessageModal(message, options);
    };
    console.log("Fonction showMessageModal adaptée de MonHistoire.modules.app vers MonHistoire");
  } else if (typeof MonHistoire.showMessageModal !== 'function' && 
             typeof MonHistoire.modules.app.showMessageModal !== 'function') {
    // Si la fonction n'existe dans aucun namespace
    MonHistoire.showMessageModal = showMessageModalImpl;
    MonHistoire.modules.app.showMessageModal = showMessageModalImpl;
    console.log("Fonction showMessageModal implémentée dans les deux namespaces");
  }
  
  console.log("Adaptateur UI initialisé");
})();
