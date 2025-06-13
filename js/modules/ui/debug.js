// js/modules/ui/debug.js
// Module de débogage UI pour identifier et résoudre les problèmes d'interface

// S'assurer que les namespaces existent
window.MonHistoire = window.MonHistoire || {};
MonHistoire.modules = MonHistoire.modules || {};
MonHistoire.modules.ui = MonHistoire.modules.ui || {};

// Module de débogage UI
(function() {
  // Variables privées
  let isInitialized = false;
  let isDebugActive = false;
  let highlightedElements = [];
  let debugPanel = null;
  
  /**
   * Initialise le module de débogage UI
   */
  function init() {
    if (isInitialized) {
      console.warn("Module UI Debug déjà initialisé");
      return;
    }
    
    // Configurer les écouteurs d'événements
    setupEventListeners();
    
    // Créer le panneau de débogage (caché par défaut)
    createDebugPanel();
    
    // Créer le bouton de débogage
    createDebugButton();
    
    isInitialized = true;
    console.log("Module UI Debug initialisé");
    
    // Émettre un événement pour informer que le module est prêt
    if (MonHistoire.events) {
      MonHistoire.events.emit('uiDebugReady');
    }
    
    return Promise.resolve();
  }
  
  /**
   * Crée le bouton de débogage
   */
  function createDebugButton() {
    // Vérifier si le bouton existe déjà
    if (document.getElementById('ui-debug-button')) {
      return;
    }
    
    // Créer le bouton
    const button = document.createElement('button');
    button.id = 'ui-debug-button';
    button.className = 'ui-debug-button';
    button.textContent = '🐞';
    button.title = 'Activer/désactiver le mode débogage';
    button.style.cssText = `
      position: fixed;
      bottom: 10px;
      left: 10px;
      width: 40px;
      height: 40px;
      background-color: rgba(0, 0, 0, 0.7);
      color: #00ff00;
      border: none;
      border-radius: 50%;
      font-size: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      z-index: 9998;
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
    `;
    
    // Ajouter l'écouteur d'événement
    button.addEventListener('click', toggleDebug);
    
    // Ajouter le bouton au document
    document.body.appendChild(button);
    
    console.log("UI Debug: Bouton de débogage créé");
  }
  
  /**
   * Configure les écouteurs d'événements
   */
  function setupEventListeners() {
    // Ajouter un raccourci clavier pour activer/désactiver le débogage (Ctrl+Shift+D)
    document.addEventListener('keydown', function(event) {
      if (event.ctrlKey && event.shiftKey && event.key === 'D') {
        event.preventDefault();
        toggleDebug();
      }
    });
    
    // Écouter les événements de l'application
    if (MonHistoire.events) {
      // Événement d'initialisation de l'application
      MonHistoire.events.on('appReady', function() {
        console.log("UI Debug: Application prête");
      });
      
      // Événement de changement d'écran
      MonHistoire.events.on('screenChanged', function(data) {
        if (isDebugActive) {
          console.log(`UI Debug: Écran changé pour ${data.screen}`);
          // Analyser la structure DOM après un court délai pour laisser le temps au DOM de se mettre à jour
          setTimeout(analyzeDOM, 500);
        }
      });
    }
    
    console.log("UI Debug: Écouteurs d'événements configurés");
  }
  
  /**
   * Crée le panneau de débogage
   */
  function createDebugPanel() {
    // Vérifier si le panneau existe déjà
    if (document.getElementById('ui-debug-panel')) {
      return;
    }
    
    // Créer le panneau
    debugPanel = document.createElement('div');
    debugPanel.id = 'ui-debug-panel';
    debugPanel.className = 'ui-debug-panel';
    debugPanel.style.cssText = `
      position: fixed;
      bottom: 0;
      right: 0;
      width: 300px;
      max-height: 400px;
      background-color: rgba(0, 0, 0, 0.8);
      color: white;
      font-family: monospace;
      font-size: 12px;
      padding: 10px;
      border-top-left-radius: 5px;
      z-index: 9999;
      overflow-y: auto;
      display: none;
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
    `;
    
    // Ajouter l'en-tête du panneau
    const header = document.createElement('div');
    header.className = 'ui-debug-header';
    header.innerHTML = `
      <h3 style="margin: 0 0 10px 0; color: #00ff00;">UI Debug</h3>
      <div class="ui-debug-controls" style="margin-bottom: 10px;">
        <button id="ui-debug-analyze" style="margin-right: 5px; padding: 3px 8px; background: #333; color: white; border: 1px solid #666; border-radius: 3px; cursor: pointer;">Analyser DOM</button>
        <button id="ui-debug-highlight" style="margin-right: 5px; padding: 3px 8px; background: #333; color: white; border: 1px solid #666; border-radius: 3px; cursor: pointer;">Highlight</button>
        <button id="ui-debug-close" style="padding: 3px 8px; background: #333; color: white; border: 1px solid #666; border-radius: 3px; cursor: pointer;">Fermer</button>
      </div>
    `;
    
    // Ajouter le contenu du panneau
    const content = document.createElement('div');
    content.id = 'ui-debug-content';
    content.className = 'ui-debug-content';
    content.style.cssText = `
      border-top: 1px solid #444;
      padding-top: 10px;
    `;
    
    // Assembler le panneau
    debugPanel.appendChild(header);
    debugPanel.appendChild(content);
    
    // Ajouter le panneau au document
    document.body.appendChild(debugPanel);
    
    // Ajouter les écouteurs d'événements
    document.getElementById('ui-debug-analyze').addEventListener('click', analyzeDOM);
    document.getElementById('ui-debug-highlight').addEventListener('click', toggleHighlight);
    document.getElementById('ui-debug-close').addEventListener('click', function() {
      debugPanel.style.display = 'none';
    });
    
    console.log("UI Debug: Panneau de débogage créé");
  }
  
  /**
   * Active ou désactive le mode débogage
   */
  function toggleDebug() {
    isDebugActive = !isDebugActive;
    
    // Activer/désactiver le débogage global
    if (typeof MonHistoire.setDebug === 'function') {
      MonHistoire.setDebug(isDebugActive);
    }
    
    // Afficher/masquer le panneau de débogage
    if (debugPanel) {
      debugPanel.style.display = isDebugActive ? 'block' : 'none';
    }
    
    // Si le débogage est activé, analyser le DOM
    if (isDebugActive) {
      analyzeDOM();
    } else {
      // Supprimer les surlignages
      removeHighlights();
    }
    
    console.log(`UI Debug: Mode débogage ${isDebugActive ? 'activé' : 'désactivé'}`);
  }
  
  /**
   * Analyse la structure DOM pour identifier les problèmes potentiels
   */
  function analyzeDOM() {
    if (!debugPanel) {
      return;
    }
    
    const content = document.getElementById('ui-debug-content');
    if (!content) {
      return;
    }
    
    // Vider le contenu
    content.innerHTML = '';
    
    // Analyser les éléments directs du body
    const bodyChildren = document.body.children;
    const suspiciousElements = [];
    
    // Ajouter un titre
    const title = document.createElement('h4');
    title.textContent = 'Éléments directs du body:';
    title.style.margin = '0 0 5px 0';
    title.style.color = '#00ff00';
    content.appendChild(title);
    
    // Créer une liste pour les éléments
    const list = document.createElement('ul');
    list.style.margin = '0 0 15px 0';
    list.style.padding = '0 0 0 20px';
    
    // Parcourir les éléments directs du body
    for (let i = 0; i < bodyChildren.length; i++) {
      const element = bodyChildren[i];
      const isSuspicious = isSuspiciousElement(element);
      
      // Créer un élément de liste
      const item = document.createElement('li');
      item.style.margin = '3px 0';
      item.style.cursor = 'pointer';
      
      // Ajouter les informations sur l'élément
      item.innerHTML = `
        <span style="color: ${isSuspicious ? '#ff6666' : 'white'};">
          &lt;${element.tagName.toLowerCase()}${element.id ? ' id="' + element.id + '"' : ''}${element.className ? ' class="' + element.className + '"' : ''}&gt;
          ${isSuspicious ? ' ⚠️' : ''}
        </span>
      `;
      
      // Ajouter un écouteur d'événement pour inspecter l'élément
      item.addEventListener('click', function() {
        inspectElement(element);
      });
      
      // Ajouter l'élément à la liste
      list.appendChild(item);
      
      // Si l'élément est suspect, l'ajouter à la liste des éléments suspects
      if (isSuspicious) {
        suspiciousElements.push(element);
      }
    }
    
    // Ajouter la liste au contenu
    content.appendChild(list);
    
    // Ajouter une section pour les éléments suspects
    if (suspiciousElements.length > 0) {
      const suspiciousTitle = document.createElement('h4');
      suspiciousTitle.textContent = 'Éléments suspects:';
      suspiciousTitle.style.margin = '0 0 5px 0';
      suspiciousTitle.style.color = '#ff6666';
      content.appendChild(suspiciousTitle);
      
      const suspiciousList = document.createElement('ul');
      suspiciousList.style.margin = '0';
      suspiciousList.style.padding = '0 0 0 20px';
      
      suspiciousElements.forEach(function(element) {
        const item = document.createElement('li');
        item.style.margin = '3px 0';
        item.style.cursor = 'pointer';
        
        item.innerHTML = `
          <span style="color: #ff6666;">
            &lt;${element.tagName.toLowerCase()}${element.id ? ' id="' + element.id + '"' : ''}${element.className ? ' class="' + element.className + '"' : ''}&gt;
            (${element.offsetWidth}x${element.offsetHeight})
          </span>
        `;
        
        item.addEventListener('click', function() {
          inspectElement(element);
        });
        
        suspiciousList.appendChild(item);
      });
      
      content.appendChild(suspiciousList);
      
      // Ajouter un bouton pour supprimer les éléments suspects
      const removeButton = document.createElement('button');
      removeButton.textContent = 'Supprimer les éléments suspects';
      removeButton.style.cssText = `
        margin-top: 10px;
        padding: 5px 10px;
        background: #ff3333;
        color: white;
        border: none;
        border-radius: 3px;
        cursor: pointer;
      `;
      
      removeButton.addEventListener('click', function() {
        removeSuspiciousElements(suspiciousElements);
      });
      
      content.appendChild(removeButton);
    }
    
    // Ajouter une section pour les éléments blancs en haut de l'écran
    const topElements = findTopElements();
    if (topElements.length > 0) {
      const topTitle = document.createElement('h4');
      topTitle.textContent = 'Éléments en haut de l\'écran:';
      topTitle.style.margin = '15px 0 5px 0';
      topTitle.style.color = '#ffcc00';
      content.appendChild(topTitle);
      
      const topList = document.createElement('ul');
      topList.style.margin = '0';
      topList.style.padding = '0 0 0 20px';
      
      topElements.forEach(function(element) {
        const item = document.createElement('li');
        item.style.margin = '3px 0';
        item.style.cursor = 'pointer';
        
        item.innerHTML = `
          <span style="color: #ffcc00;">
            &lt;${element.tagName.toLowerCase()}${element.id ? ' id="' + element.id + '"' : ''}${element.className ? ' class="' + element.className + '"' : ''}&gt;
            (${element.offsetWidth}x${element.offsetHeight}, top: ${element.getBoundingClientRect().top})
          </span>
        `;
        
        item.addEventListener('click', function() {
          inspectElement(element);
        });
        
        topList.appendChild(item);
      });
      
      content.appendChild(topList);
    }
    
    console.log("UI Debug: DOM analysé");
  }
  
  /**
   * Vérifie si un élément est suspect (potentiellement problématique)
   * @param {Element} element - Élément à vérifier
   * @returns {boolean} True si l'élément est suspect, false sinon
   */
  function isSuspiciousElement(element) {
    // Vérifier si l'élément est un div sans ID ni classe
    if (element.tagName === 'DIV' && !element.id && !element.className) {
      return true;
    }
    
    // Vérifier si l'élément a un fond blanc
    const style = window.getComputedStyle(element);
    if (style.backgroundColor === 'rgb(255, 255, 255)' || 
        style.backgroundColor === '#ffffff' || 
        style.backgroundColor === 'white') {
      return true;
    }
    
    // Vérifier si l'élément est positionné en haut de l'écran
    const rect = element.getBoundingClientRect();
    if (rect.top === 0 && rect.height > 0 && rect.width > 0) {
      return true;
    }
    
    // Vérifier si l'élément est vide mais prend de l'espace
    if (element.children.length === 0 && 
        element.textContent.trim() === '' && 
        (element.offsetWidth > 0 || element.offsetHeight > 0)) {
      return true;
    }
    
    return false;
  }
  
  /**
   * Trouve les éléments positionnés en haut de l'écran
   * @returns {Array} Liste des éléments en haut de l'écran
   */
  function findTopElements() {
    const elements = [];
    const allElements = document.querySelectorAll('*');
    
    for (let i = 0; i < allElements.length; i++) {
      const element = allElements[i];
      const rect = element.getBoundingClientRect();
      
      // Vérifier si l'élément est en haut de l'écran
      if (rect.top <= 10 && rect.height > 0 && rect.width > 0) {
        // Vérifier si l'élément a un fond blanc ou transparent
        const style = window.getComputedStyle(element);
        if (style.backgroundColor === 'rgb(255, 255, 255)' || 
            style.backgroundColor === '#ffffff' || 
            style.backgroundColor === 'white' ||
            style.backgroundColor === 'transparent') {
          elements.push(element);
        }
      }
    }
    
    return elements;
  }
  
  /**
   * Inspecte un élément
   * @param {Element} element - Élément à inspecter
   */
  function inspectElement(element) {
    // Afficher les informations sur l'élément dans la console
    console.log('Élément inspecté:', element);
    console.log('Tag:', element.tagName);
    console.log('ID:', element.id);
    console.log('Classes:', element.className);
    console.log('Dimensions:', element.offsetWidth + 'x' + element.offsetHeight);
    console.log('Position:', element.getBoundingClientRect());
    console.log('Style:', window.getComputedStyle(element));
    
    // Surligner l'élément
    highlightElement(element);
  }
  
  /**
   * Surligne un élément
   * @param {Element} element - Élément à surligner
   */
  function highlightElement(element) {
    // Supprimer les surlignages existants
    removeHighlights();
    
    // Créer un élément de surlignage
    const highlight = document.createElement('div');
    highlight.className = 'ui-debug-highlight';
    
    // Positionner le surlignage sur l'élément
    const rect = element.getBoundingClientRect();
    highlight.style.cssText = `
      position: absolute;
      top: ${rect.top + window.scrollY}px;
      left: ${rect.left + window.scrollX}px;
      width: ${rect.width}px;
      height: ${rect.height}px;
      border: 2px solid red;
      background-color: rgba(255, 0, 0, 0.2);
      z-index: 9998;
      pointer-events: none;
    `;
    
    // Ajouter le surlignage au document
    document.body.appendChild(highlight);
    
    // Ajouter le surlignage à la liste des surlignages
    highlightedElements.push(highlight);
    
    // Afficher les informations sur l'élément dans un tooltip
    const tooltip = document.createElement('div');
    tooltip.className = 'ui-debug-tooltip';
    tooltip.style.cssText = `
      position: absolute;
      top: ${rect.top + window.scrollY - 30}px;
      left: ${rect.left + window.scrollX}px;
      background-color: black;
      color: white;
      padding: 5px;
      border-radius: 3px;
      font-family: monospace;
      font-size: 12px;
      z-index: 9999;
      pointer-events: none;
    `;
    
    tooltip.textContent = `${element.tagName.toLowerCase()}${element.id ? '#' + element.id : ''}${element.className ? '.' + element.className.replace(/ /g, '.') : ''} (${rect.width}x${rect.height})`;
    
    // Ajouter le tooltip au document
    document.body.appendChild(tooltip);
    
    // Ajouter le tooltip à la liste des surlignages
    highlightedElements.push(tooltip);
  }
  
  /**
   * Supprime les surlignages
   */
  function removeHighlights() {
    highlightedElements.forEach(function(element) {
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
    });
    
    highlightedElements = [];
  }
  
  /**
   * Active ou désactive le surlignage des éléments suspects
   */
  function toggleHighlight() {
    // Supprimer les surlignages existants
    removeHighlights();
    
    // Si des éléments sont déjà surlignés, ne rien faire d'autre
    if (highlightedElements.length > 0) {
      return;
    }
    
    // Trouver les éléments suspects
    const suspiciousElements = [];
    const allElements = document.querySelectorAll('*');
    
    for (let i = 0; i < allElements.length; i++) {
      const element = allElements[i];
      if (isSuspiciousElement(element)) {
        suspiciousElements.push(element);
      }
    }
    
    // Surligner les éléments suspects
    suspiciousElements.forEach(function(element) {
      // Créer un élément de surlignage
      const highlight = document.createElement('div');
      highlight.className = 'ui-debug-highlight';
      
      // Positionner le surlignage sur l'élément
      const rect = element.getBoundingClientRect();
      highlight.style.cssText = `
        position: absolute;
        top: ${rect.top + window.scrollY}px;
        left: ${rect.left + window.scrollX}px;
        width: ${rect.width}px;
        height: ${rect.height}px;
        border: 2px solid red;
        background-color: rgba(255, 0, 0, 0.2);
        z-index: 9998;
        pointer-events: none;
      `;
      
      // Ajouter le surlignage au document
      document.body.appendChild(highlight);
      
      // Ajouter le surlignage à la liste des surlignages
      highlightedElements.push(highlight);
    });
  }
  
  /**
   * Supprime les éléments suspects
   * @param {Array} elements - Liste des éléments à supprimer
   */
  function removeSuspiciousElements(elements) {
    // Demander confirmation
    if (!confirm(`Êtes-vous sûr de vouloir supprimer ${elements.length} élément(s) suspect(s) ?`)) {
      return;
    }
    
    // Supprimer les éléments
    elements.forEach(function(element) {
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
    });
    
    // Mettre à jour l'analyse
    analyzeDOM();
    
    console.log(`UI Debug: ${elements.length} élément(s) suspect(s) supprimé(s)`);
  }
  
  
  /**
   * Ajoute un message au panneau de débogage
   * @param {string} message - Message à ajouter
   * @param {string} type - Type de message ('info', 'warning', 'error')
   */
  function addDebugMessage(message, type = 'info') {
    if (!debugPanel) {
      return;
    }
    
    const content = document.getElementById('ui-debug-content');
    if (!content) {
      return;
    }
    
    // Déterminer la couleur en fonction du type
    let color;
    switch (type) {
      case 'warning':
        color = '#ffcc00';
        break;
      case 'error':
        color = '#ff6666';
        break;
      default:
        color = 'white';
    }
    
    // Créer un élément de message
    const messageElement = document.createElement('div');
    messageElement.style.cssText = `
      margin: 5px 0;
      color: ${color};
    `;
    
    messageElement.textContent = message;
    
    // Ajouter le message au contenu
    content.appendChild(messageElement);
  }
  
  // API publique
  MonHistoire.modules.ui.debug = {
    init: init,
    toggleDebug: toggleDebug,
    analyzeDOM: analyzeDOM,
    addDebugMessage: addDebugMessage
  };
})();
