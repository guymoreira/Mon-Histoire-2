# Mon Histoire - Documentation de la Structure Modulaire

## Présentation

"Mon Histoire" est une application web permettant aux utilisateurs de créer et partager des histoires personnalisées. Cette documentation présente la nouvelle architecture modulaire mise en place pour améliorer la maintenabilité et l'évolutivité du code.

## Architecture Modulaire

L'application a été restructurée selon une architecture modulaire où chaque module est responsable d'une fonctionnalité spécifique. Cette approche offre plusieurs avantages :

- **Séparation des préoccupations** : Chaque module gère une fonctionnalité spécifique
- **Maintenabilité améliorée** : Les modules peuvent être modifiés indépendamment
- **Testabilité accrue** : Les modules peuvent être testés de manière isolée
- **Évolutivité facilitée** : De nouveaux modules peuvent être ajoutés sans impacter les modules existants

## Structure des Dossiers

```
js/
├── index.js                  # Point d'entrée principal
├── modules/                  # Modules de l'application
│   ├── core/                 # Modules de base
│   │   ├── config.js         # Configuration de l'application
│   │   ├── cookies.js        # Gestion des cookies
│   │   ├── navigation.js     # Navigation entre les écrans
│   │   └── storage.js        # Stockage des données (Firebase)
│   ├── user/                 # Modules liés aux utilisateurs
│   │   ├── auth.js           # Authentification
│   │   ├── profiles.js       # Gestion des profils
│   │   └── account.js        # Gestion du compte
│   ├── ui/                   # Modules d'interface utilisateur
│   │   └── common.js         # Composants UI communs
│   ├── stories/              # Modules liés aux histoires
│   │   ├── generator.js      # Génération d'histoires
│   │   ├── management.js     # Gestion des histoires
│   │   ├── display.js        # Affichage des histoires
│   │   └── export.js         # Exportation des histoires
│   ├── features/             # Modules de fonctionnalités
│   │   └── audio.js          # Lecture audio des histoires
│   └── sharing/              # Modules de partage
│       ├── index.js          # Point d'entrée du module de partage
│       ├── notifications.js  # Notifications de partage
│       └── storage.js        # Stockage des partages
css/
├── main.css                  # Point d'entrée CSS
├── base/                     # Styles de base
├── components/               # Styles des composants
├── layout/                   # Styles de mise en page
├── screens/                  # Styles des écrans
└── features/                 # Styles des fonctionnalités
```

## Organisation des Modules

### Modules de Base (core)

- **config.js** : Gestion de la configuration de l'application
- **cookies.js** : Gestion du consentement aux cookies et des préférences utilisateur
- **navigation.js** : Navigation entre les différentes sections de l'application
- **storage.js** : Interaction avec Firebase Firestore et Storage

### Modules Utilisateur (user)

- **auth.js** : Authentification des utilisateurs (inscription, connexion, déconnexion)
- **profiles.js** : Gestion des profils utilisateur
- **account.js** : Gestion du compte utilisateur (paramètres, suppression)

### Modules d'Interface Utilisateur (ui)

- **common.js** : Composants d'interface utilisateur communs (modals, notifications)

### Modules d'Histoires (stories)

- **generator.js** : Génération d'histoires à partir de templates et de données utilisateur
- **management.js** : Gestion des histoires (sauvegarde, suppression, liste)
- **display.js** : Affichage des histoires
- **export.js** : Exportation des histoires (PDF, image)

### Modules de Fonctionnalités (features)

- **audio.js** : Lecture audio des histoires (synthèse vocale)

### Modules de Partage (sharing)

- **index.js** : Point d'entrée du module de partage
- **notifications.js** : Gestion des notifications de partage
- **storage.js** : Stockage des données de partage

## Communication entre Modules

Les modules communiquent entre eux via un système d'événements centralisé. Ce système permet de découpler les modules tout en permettant une communication efficace.

```javascript
// Émission d'un événement
MonHistoire.events.emit('eventName', data);

// Écoute d'un événement
MonHistoire.events.on('eventName', function(data) {
  // Traitement de l'événement
});
```

## Initialisation de l'Application

L'initialisation de l'application est gérée par le fichier `js/index.js`. Les modules sont initialisés dans un ordre spécifique pour garantir que les dépendances sont respectées.

```javascript
// Ordre d'initialisation des modules
const moduleInitOrder = [
  // Modules de base
  { namespace: 'MonHistoire.modules.core.config', name: 'Config' },
  { namespace: 'MonHistoire.modules.core.cookies', name: 'Cookies' },
  { namespace: 'MonHistoire.modules.core.storage', name: 'Storage' },
  { namespace: 'MonHistoire.modules.user.auth', name: 'Auth' },
  // ...
];
```

## Bonnes Pratiques

### Structure des Modules

Chaque module suit une structure similaire :

1. **Namespace** : Déclaration du namespace pour éviter les conflits
2. **Variables privées** : Variables accessibles uniquement à l'intérieur du module
3. **Fonctions privées** : Fonctions utilisées en interne par le module
4. **API publique** : Interface exposée aux autres modules

```javascript
// Exemple de structure de module
(function() {
  // Variables privées
  let isInitialized = false;
  
  // Fonction d'initialisation
  function init() {
    if (isInitialized) {
      console.warn("Module déjà initialisé");
      return;
    }
    
    // Initialisation du module
    
    isInitialized = true;
    console.log("Module initialisé");
  }
  
  // Fonctions privées
  function privateFunction() {
    // ...
  }
  
  // API publique
  MonHistoire.modules.example = {
    init: init,
    publicFunction: function() {
      // ...
    }
  };
})();
```

### Gestion des Erreurs

Les erreurs sont gérées de manière centralisée via des fonctions utilitaires :

```javascript
// Affichage d'une erreur
MonHistoire.showError("Message d'erreur");

// Affichage d'un succès
MonHistoire.showSuccess("Message de succès");
```

### Débogage

Un système de débogage est disponible pour faciliter le développement :

```javascript
// Activer le mode débogage
MonHistoire.setDebug(true);

// Afficher un message de débogage
MonHistoire.debug("Message de débogage", data);
```

## Conclusion

Cette nouvelle architecture modulaire offre une base solide pour le développement futur de l'application "Mon Histoire". Elle facilite la maintenance, l'évolution et la collaboration entre développeurs.
