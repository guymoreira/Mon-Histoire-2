# Guide de Style UI - Mon Histoire

Ce document présente le système UI standardisé pour l'application "Mon Histoire". Il sert de référence pour maintenir la cohérence visuelle et fonctionnelle à travers toute l'application.

## Table des matières

1. [Introduction](#introduction)
2. [Système de classes](#système-de-classes)
3. [Composants](#composants)
   - [Boutons](#boutons)
   - [Cartes et blocs](#cartes-et-blocs)
   - [Modales](#modales)
   - [Formulaires](#formulaires)
   - [Notifications](#notifications)
   - [Notation](#notation)
4. [Utilisation](#utilisation)
5. [Migration](#migration)

## Introduction

Le système UI de "Mon Histoire" est conçu pour offrir une expérience utilisateur cohérente, accessible et agréable. Il utilise une approche modulaire avec des classes préfixées par `ui-` pour faciliter la maintenance et l'évolution du code.

## Système de classes

Le système de classes suit une convention BEM (Block, Element, Modifier) simplifiée :

- **Block** : Composant principal (ex: `ui-button`)
- **Element** : Partie d'un composant (ex: `ui-button-icon`)
- **Modifier** : Variante d'un composant (ex: `ui-button--primary`)

## Composants

### Boutons

Les boutons sont utilisés pour les actions principales et secondaires dans l'application.

#### Classes de base

- `ui-button` : Style de base pour tous les boutons
- `ui-button--primary` : Bouton d'action principale (bleu)
- `ui-button--secondary` : Bouton d'action secondaire (violet)
- `ui-button-group` : Conteneur pour grouper des boutons
- `ui-button-icon` : Bouton circulaire avec icône

#### Modificateurs

- `ui-button--medium` : Taille moyenne
- `ui-button--large` : Grande taille
- `ui-button-group--equal` : Boutons de taille égale dans un groupe
- `ui-button-group--center` : Groupe de boutons centré

#### Exemple

```html
<div class="ui-button-group ui-button-group--equal">
  <button class="ui-button ui-button--primary">Valider</button>
  <button class="ui-button ui-button--secondary">Annuler</button>
</div>
```

### Cartes et blocs

Les cartes et blocs sont utilisés pour structurer le contenu et créer une hiérarchie visuelle.

#### Classes de base

- `ui-card` : Style de base pour toutes les cartes
- `ui-card--cream` : Carte avec fond crème
- `ui-card--white` : Carte avec fond blanc

#### Modificateurs

- `ui-card--small` : Petite carte
- `ui-card--medium` : Carte moyenne
- `ui-card--large` : Grande carte
- `ui-card--padding-sm` : Petit padding
- `ui-card--padding-md` : Padding moyen
- `ui-card--padding-lg` : Grand padding

#### Exemple

```html
<div class="ui-card ui-card--cream ui-card--medium ui-card--padding-md">
  <h2 class="ui-text-center">Titre de la carte</h2>
  <p>Contenu de la carte...</p>
</div>
```

### Modales

Les modales sont utilisées pour afficher du contenu qui nécessite l'attention de l'utilisateur.

#### Classes de base

- `ui-modal` : Conteneur de la modale
- `ui-modal-content` : Contenu de la modale
- `ui-modal-close` : Bouton de fermeture de la modale

#### Modificateurs

- `ui-modal-content--small` : Petite modale
- `ui-modal-content--medium` : Modale moyenne
- `ui-modal-content--large` : Grande modale

#### Exemple

```html
<div class="ui-modal" id="ma-modale">
  <div class="ui-modal-content ui-modal-content--medium ui-card--cream">
    <span class="ui-modal-close">×</span>
    <h3 class="ui-text-center">Titre de la modale</h3>
    <p>Contenu de la modale...</p>
    <button class="ui-button ui-button--primary">OK</button>
  </div>
</div>
```

### Formulaires

Les formulaires sont utilisés pour collecter des informations auprès de l'utilisateur.

#### Classes de base

- `ui-form-group` : Groupe d'éléments de formulaire
- `ui-input` : Champ de saisie
- `ui-input-group` : Groupe de champ avec icône
- `ui-input-icon` : Icône dans un champ
- `ui-label` : Étiquette de champ
- `ui-select` : Liste déroulante
- `ui-checkbox` : Case à cocher
- `ui-checkbox-group` : Groupe de cases à cocher

#### Exemple

```html
<div class="ui-form-group">
  <label class="ui-label" for="mon-champ">Libellé :</label>
  <div class="ui-input-group">
    <input class="ui-input" id="mon-champ" type="text" placeholder="Saisir...">
    <span class="ui-input-icon">👁️</span>
  </div>
</div>
```

### Notifications

Les notifications sont utilisées pour informer l'utilisateur d'événements ou d'actions.

#### Classes de base

- `ui-notification` : Conteneur de notification
- `ui-notification-icon` : Icône de la notification
- `ui-notification-content` : Contenu de la notification
- `ui-notification-title` : Titre de la notification
- `ui-notification-message` : Message de la notification
- `ui-notification-close` : Bouton de fermeture

#### Modificateurs

- `ui-notification--success` : Notification de succès
- `ui-notification--error` : Notification d'erreur
- `ui-notification--warning` : Notification d'avertissement
- `ui-notification--info` : Notification d'information

#### Exemple

```html
<div class="ui-notification ui-notification--success">
  <div class="ui-notification-icon">✓</div>
  <div class="ui-notification-content">
    <div class="ui-notification-title">Succès</div>
    <div class="ui-notification-message">Opération réussie !</div>
  </div>
  <button class="ui-notification-close">×</button>
</div>
```

### Notation

Le composant de notation permet aux utilisateurs d'évaluer une histoire en sélectionnant une étoile.

#### Structure HTML

```html
<div id="bloc-notation" class="notation-container">
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

La classe `selected` est appliquée à l'étoile correspondant à la note enregistrée et déclenche une animation d'agrandissement.

## Utilisation

Pour utiliser le système UI, importez le fichier CSS principal :

```html
<link href="css/main.css" rel="stylesheet"/>
```

Le fichier `main.css` importe tous les composants nécessaires, y compris le système UI.

## Migration

Pour migrer du système de classes existant vers le nouveau système UI, utilisez les mappings définis dans chaque fichier de composant. Par exemple :

- `.button` → `.ui-button`
- `.button-blue` → `.ui-button--primary`
- `.button-purple` → `.ui-button--secondary`
- `.bloc-centre` → `.ui-card ui-card--cream ui-card--large ui-card--padding-md`

Ces mappings permettent une transition progressive sans casser le code existant.
