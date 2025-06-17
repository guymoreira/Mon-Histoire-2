# Guide d'intégration du système UI

Ce guide explique comment utiliser le système UI standardisé de l'application "Mon Histoire" dans le code futur. Il est destiné aux développeurs qui travaillent sur le projet et qui souhaitent maintenir la cohérence visuelle et fonctionnelle de l'interface utilisateur.

## Table des matières

1. [Principes généraux](#principes-généraux)
2. [Utilisation des composants](#utilisation-des-composants)
   - [Boutons](#boutons)
   - [Cartes](#cartes)
   - [Modales](#modales)
   - [Formulaires](#formulaires)
   - [Notifications](#notifications)
   - [Messagerie](#messagerie)
3. [Manipulation via JavaScript](#manipulation-via-javascript)
4. [Extension du système](#extension-du-système)
5. [Bonnes pratiques](#bonnes-pratiques)

## Principes généraux

Le système UI de "Mon Histoire" suit une convention de nommage BEM simplifiée :

- `.ui-component` : Classe de base pour un composant
- `.ui-component--variant` : Variante d'un composant
- `.ui-component__element` : Élément à l'intérieur d'un composant
- `.ui-utility-class` : Classe utilitaire pour des styles spécifiques

Tous les composants UI commencent par le préfixe `ui-` pour les distinguer des autres classes.

## Utilisation des composants

### Boutons

Les boutons sont disponibles en plusieurs variantes :

```html
<!-- Bouton primaire (bleu) -->
<button class="ui-button ui-button--primary">Action principale</button>

<!-- Bouton secondaire (violet) -->
<button class="ui-button ui-button--secondary">Action secondaire</button>

<!-- Bouton icône -->
<button class="ui-button-icon" title="Description de l'action">
  <i class="fas fa-icon"></i>
</button>

<!-- Groupe de boutons -->
<div class="ui-button-group">
  <button class="ui-button ui-button--primary">Sauvegarder</button>
  <button class="ui-button ui-button--secondary">Annuler</button>
</div>

<!-- Groupe de boutons avec largeur égale -->
<div class="ui-button-group ui-button-group--equal">
  <button class="ui-button ui-button--primary">Oui</button>
  <button class="ui-button ui-button--secondary">Non</button>
</div>

<!-- Groupe de boutons centrés -->
<div class="ui-button-group ui-button-group--center">
  <button class="ui-button ui-button--primary">Confirmer</button>
  <button class="ui-button ui-button--secondary">Annuler</button>
</div>
```

### Cartes

Les cartes remplacent les anciens "blocs centre" et sont disponibles en plusieurs variantes :

```html
<!-- Carte standard (crème) -->
<div class="ui-card ui-card--cream">
  <h2>Titre de la carte</h2>
  <p>Contenu de la carte</p>
</div>

<!-- Carte blanche -->
<div class="ui-card ui-card--white">
  <h2>Titre de la carte</h2>
  <p>Contenu de la carte</p>
</div>

<!-- Carte avec taille spécifique -->
<div class="ui-card ui-card--cream ui-card--medium">
  <h2>Titre de la carte</h2>
  <p>Contenu de la carte</p>
</div>

<!-- Carte avec padding spécifique -->
<div class="ui-card ui-card--cream ui-card--padding-lg">
  <h2>Titre de la carte</h2>
  <p>Contenu de la carte</p>
</div>
```

### Modales

Les modales sont standardisées avec une structure cohérente :

```html
<!-- Modale standard -->
<div class="ui-modal" id="modal-exemple">
  <div class="ui-modal-content">
    <button class="ui-modal-close" onclick="document.getElementById('modal-exemple').classList.remove('show')">×</button>
    <h3>Titre de la modale</h3>
    <p>Contenu de la modale</p>
    <div class="ui-button-group ui-button-group--center">
      <button class="ui-button ui-button--primary">Confirmer</button>
      <button class="ui-button ui-button--secondary">Annuler</button>
    </div>
  </div>
</div>

<!-- Modale avec taille spécifique -->
<div class="ui-modal" id="modal-exemple-small">
  <div class="ui-modal-content ui-modal-content--small">
    <button class="ui-modal-close" onclick="document.getElementById('modal-exemple-small').classList.remove('show')">×</button>
    <h3>Titre de la modale</h3>
    <p>Contenu de la modale</p>
    <div class="ui-button-group ui-button-group--center">
      <button class="ui-button ui-button--primary">OK</button>
    </div>
  </div>
</div>
```

Pour afficher une modale :

```javascript
document.getElementById('modal-exemple').classList.add('show');
```

Pour masquer une modale :

```javascript
document.getElementById('modal-exemple').classList.remove('show');
```

### Formulaires

Les éléments de formulaire sont standardisés :

```html
<!-- Champ de texte -->
<input type="text" class="ui-input" placeholder="Entrez votre texte">

<!-- Champ de texte avec icône -->
<div class="ui-input-container">
  <input type="text" class="ui-input" placeholder="Rechercher">
  <button class="ui-input-icon" type="button">
    <i class="fas fa-search"></i>
  </button>
</div>

<!-- Champ de mot de passe avec toggle -->
<div class="ui-input-container">
  <input type="password" id="password" class="ui-input" placeholder="Mot de passe">
  <button class="ui-input-icon" data-input="password" type="button">
    <i class="fas fa-eye"></i>
  </button>
</div>

<!-- Zone de texte -->
<textarea class="ui-textarea" placeholder="Entrez votre message"></textarea>

<!-- Case à cocher -->
<div class="ui-checkbox-container">
  <input type="checkbox" id="check1" class="ui-checkbox">
  <label for="check1" class="ui-checkbox-label">Option 1</label>
</div>

<!-- Bouton radio -->
<div class="ui-radio-container">
  <input type="radio" id="radio1" name="radiogroup" class="ui-radio">
  <label for="radio1" class="ui-radio-label">Option 1</label>
</div>

<!-- Sélecteur -->
<select class="ui-select">
  <option value="">Sélectionnez une option</option>
  <option value="1">Option 1</option>
  <option value="2">Option 2</option>
</select>
```

### Notifications

Les notifications utilisent une structure standardisée :

```html
<!-- Notification standard -->
<div class="ui-notification">
  <div class="ui-notification__icon">
    <i class="fas fa-info-circle"></i>
  </div>
  <div class="ui-notification__content">
    <div class="ui-notification__title">Titre de la notification</div>
    <div class="ui-notification__message">Message de la notification</div>
  </div>
  <button class="ui-notification__close">×</button>
</div>

<!-- Notification de succès -->
<div class="ui-notification ui-notification--success">
  <div class="ui-notification__icon">
    <i class="fas fa-check-circle"></i>
  </div>
  <div class="ui-notification__content">
    <div class="ui-notification__title">Succès</div>
    <div class="ui-notification__message">L'opération a réussi</div>
  </div>
  <button class="ui-notification__close">×</button>
</div>

<!-- Notification d'erreur -->
<div class="ui-notification ui-notification--error">
  <div class="ui-notification__icon">
    <i class="fas fa-exclamation-circle"></i>
  </div>
  <div class="ui-notification__content">
    <div class="ui-notification__title">Erreur</div>
    <div class="ui-notification__message">Une erreur est survenue</div>
  </div>
  <button class="ui-notification__close">×</button>
</div>
```

### Notation

Le système de notation permet à l'utilisateur d'attribuer une note de 1 à 5 étoiles à une histoire. Le bloc de notation est masqué par défaut et peut être ajouté comme suit :

```html
<div id="bloc-notation" class="notation-container hidden">
  <p><strong>Tu as aimé cette histoire ?</strong></p>
  <div class="notation">
    <span class="etoile" data-note="1">☆</span>
    <span class="etoile" data-note="2">☆</span>
    <span class="etoile" data-note="3">☆</span>
    <span class="etoile" data-note="4">☆</span>
    <span class="etoile" data-note="5">☆</span>
  </div>
</div>
```

Le module JavaScript `features/stories/notation.js` expose les fonctions suivantes :

- `afficherNote(id)` pour lire la note depuis Firestore et mettre à jour l'affichage.
- `bindNotation(id)` pour enregistrer la note lors du clic sur une étoile.
- `reset()` pour masquer le bloc et désélectionner les étoiles lors de la génération d'une nouvelle histoire.

### Messagerie

La messagerie fournit des classes pour l'affichage des conversations et des messages.

- `conversation-item` : élément d'une liste de conversations.
- `conversation-item.unread` : conversation avec messages non lus.
- `message-bubble.sent` et `message-bubble.received` : bulles de messages envoyés ou reçus.

Exemple minimal pour déclencher l'ouverture des conversations :

```html
<button id="my-messages-button" class="ui-button ui-button--primary">Mes messages</button>
<script>
  // Après chargement des modules messaging
  MonHistoire.features.messaging.ui.init();
</script>
```

Bloc de saisie pour envoyer un message :

```html
<div id="zone-saisie-message">
  <input id="input-message" class="ui-input" type="text" placeholder="Ton message...">
  <button id="btn-envoyer-message" class="ui-button ui-button--primary">Envoyer</button>
</div>
```

## Manipulation via JavaScript

Pour manipuler les composants UI via JavaScript, utilisez les classes standardisées :

```javascript
// Exemple : Créer un bouton dynamiquement
function createButton(text, isPrimary = true) {
  const button = document.createElement('button');
  button.className = isPrimary ? 'ui-button ui-button--primary' : 'ui-button ui-button--secondary';
  button.textContent = text;
  return button;
}

// Exemple : Créer une carte dynamiquement
function createCard(title, content, variant = 'cream', size = 'medium') {
  const card = document.createElement('div');
  card.className = `ui-card ui-card--${variant} ui-card--${size}`;
  
  const titleElement = document.createElement('h3');
  titleElement.textContent = title;
  
  const contentElement = document.createElement('p');
  contentElement.textContent = content;
  
  card.appendChild(titleElement);
  card.appendChild(contentElement);
  
  return card;
}

// Exemple : Afficher une notification
function showNotification(title, message, type = 'info', duration = 5000) {
  const notification = document.createElement('div');
  notification.className = type === 'info' 
    ? 'ui-notification' 
    : `ui-notification ui-notification--${type}`;
  
  notification.innerHTML = `
    <div class="ui-notification__icon">
      <i class="fas fa-${type === 'success' ? 'check' : type === 'error' ? 'exclamation' : 'info'}-circle"></i>
    </div>
    <div class="ui-notification__content">
      <div class="ui-notification__title">${title}</div>
      <div class="ui-notification__message">${message}</div>
    </div>
    <button class="ui-notification__close">×</button>
  `;
  
  document.body.appendChild(notification);
  
  // Ajouter la classe show après un court délai pour permettre l'animation
  setTimeout(() => {
    notification.classList.add('show');
  }, 10);
  
  // Ajouter un gestionnaire pour le bouton de fermeture
  notification.querySelector('.ui-notification__close').addEventListener('click', () => {
    notification.classList.remove('show');
    setTimeout(() => {
      notification.remove();
    }, 300); // Attendre la fin de l'animation
  });
  
  // Masquer automatiquement après la durée spécifiée
  if (duration > 0) {
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => {
        notification.remove();
      }, 300); // Attendre la fin de l'animation
    }, duration);
  }
  
  return notification;
}
```

## Extension du système

Pour étendre le système UI avec de nouveaux composants, suivez ces étapes :

1. Créez un nouveau fichier CSS dans le dossier `css/components/` pour votre composant
2. Utilisez le préfixe `ui-` pour toutes les classes
3. Suivez la convention de nommage BEM simplifiée
4. Importez votre fichier dans `css/components/index.css`

Exemple de structure pour un nouveau composant "tooltip" :

```css
/* css/components/tooltip.css */
.ui-tooltip {
  position: relative;
  display: inline-block;
}

.ui-tooltip__content {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  background-color: #333;
  color: white;
  padding: 0.5em 1em;
  border-radius: 4px;
  white-space: nowrap;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.3s, visibility 0.3s;
}

.ui-tooltip:hover .ui-tooltip__content {
  opacity: 1;
  visibility: visible;
}

.ui-tooltip--top .ui-tooltip__content {
  bottom: 100%;
  top: auto;
}

.ui-tooltip--bottom .ui-tooltip__content {
  top: 100%;
  bottom: auto;
}
```

Puis importez-le dans `css/components/index.css` :

```css
/* css/components/index.css */
@import 'buttons.css';
@import 'cards.css';
@import 'modals.css';
@import 'forms.css';
@import 'notifications.css';
@import 'tooltip.css'; /* Nouveau composant */
```

## Bonnes pratiques

1. **Évitez les styles inline** : Utilisez toujours les classes standardisées plutôt que des styles inline.

2. **Utilisez les classes utilitaires** pour les ajustements mineurs :
   ```html
   <button class="ui-button ui-button--primary ui-mt-3 ui-mb-3">Bouton avec marges</button>
   ```

3. **Respectez la hiérarchie des composants** : Ne modifiez pas la structure des composants existants.

4. **Testez sur différentes tailles d'écran** : Assurez-vous que vos composants sont responsives.

5. **Documentez les nouveaux composants** : Ajoutez des exemples d'utilisation dans ce guide.

6. **Utilisez les variables CSS** définies dans `css/base/variables.css` pour maintenir la cohérence visuelle.

7. **Évitez de surcharger les styles** des composants existants. Si vous avez besoin d'une variante, créez une nouvelle classe.

8. **Consultez le guide de style** (`ui-guide-style.md`) pour voir tous les composants disponibles avant d'en créer de nouveaux.
