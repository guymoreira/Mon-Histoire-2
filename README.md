# Mon Histoire - Documentation de la Structure Modulaire

## Présentation

"Mon Histoire" est une application web permettant aux utilisateurs de créer et partager des histoires personnalisées. Cette documentation présente la nouvelle architecture modulaire mise en place pour améliorer la maintenabilité et l'évolutivité du code.

## Architecture Modulaire

L'application a été restructurée selon une architecture modulaire où chaque module est responsable d'une fonctionnalité spécifique. Cette approche offre plusieurs avantages :

- **Séparation des préoccupations** : Chaque module gère une fonctionnalité spécifique
- **Maintenabilité améliorée** : Les modules peuvent être modifiés indépendamment
- **Testabilité accrue** : Les modules peuvent être testés de manière isolée
- **Évolutivité facilitée** : De nouveaux modules peuvent être ajoutés sans impacter les modules existants
La structure active repose principalement sur les dossiers `js/core` et `js/features`. Les anciens dossiers `js/modules` et `js/adapters` sont conservés mais **non utilisés**.

## Structure des Dossiers

```
js/
├── firebase-init.js          # Initialisation Firebase
├── index.js                  # Point d'entree apres Firebase
├── config.js                 # Constantes de l'application
├── common.js                 # Fonctions utilitaires
├── core/
│   ├── navigation.js         # Navigation entre les ecrans
│   ├── auth.js               # Authentification
│   ├── profiles.js           # Gestion des profils
│   └── storage.js            # Acces Firestore
├── features/
│   ├── stories/
│   │   ├── generator.js      # Generation d'histoires
│   │   ├── display.js        # Affichage
│   │   ├── management.js     # Sauvegarde et suppression
│   │   └── notation.js       # Notation
│   ├── sharing/
│   │   ├── index.js          # Init du partage
│   │   ├── notifications.js  # Notifications de partage
│   │   ├── storage.js        # Stockage des partages
│   │   ├── ui.js             # Interface de partage
│   │   └── realtime/
│   │       ├── index.js
│   │       ├── listeners.js
│   │       └── notifications.js
│   ├── export.js             # Export PDF
│   ├── audio.js              # Lecture audio
│   └── cookies.js            # Gestion des cookies
├── ui.js                     # Gestion de l'interface
├── app.js                    # Objet global et state
├── modules/ (non utilise)
└── adapters/ (non utilise)
css/
├── main.css                  # Point d'entree CSS
├── base/
├── components/
├── layout/
├── screens/
└── features/
```

## R\xc3\xb4le des Fichiers JavaScript Principaux

| Fichier | R\xc3\xb4le |
| --- | --- |
| js/firebase-init.js | Initialise Firebase et active la persistance |
| js/index.js | Lance l'application lorsque le DOM est pr\xc3\aat | 
| js/config.js | Contient les constantes et param\xc3\a8tres globaux |
| js/common.js | Fonctions utilitaires partag\xc3\xa9es |
| js/core/navigation.js | Gestion de la navigation entre les \xc3\xa9crans |
| js/core/auth.js | Authentification des utilisateurs |
| js/core/profiles.js | Gestion des profils enfants |
| js/core/storage.js | Acc\xc3\xa8s \xc3\xa0 Firestore |
| js/features/stories/generator.js | G\xc3\xa9n\xc3\xa8re une histoire depuis le formulaire |
| js/features/stories/display.js | Affiche les histoires g\xc3\xa9n\xc3\xa9r\xc3\xa9es ou stock\xc3\xa9es |
| js/features/stories/management.js | Sauvegarde et suppression d'histoires |
| js/features/stories/notation.js | Gestion de la notation des histoires |
| js/features/sharing.js | Module principal de partage |
| js/features/sharing/notifications.js | Notifications li\xc3\xa9es au partage |
| js/features/sharing/storage.js | Stockage des histoires partag\xc3\xa9es |
| js/features/sharing/ui.js | Interface utilisateur du partage |
| js/features/sharing/realtime/index.js | Initialisation du partage en temps r\xc3\xa9el |
| js/features/sharing/realtime/listeners.js | \xc3\x89coute les changements Firestore |
| js/features/sharing/realtime/notifications.js | Notifications temps r\xc3\xa9el |
| js/features/sharing/index.js | Active le module de partage |
| js/features/export.js | Export au format PDF |
| js/features/audio.js | Lecture audio des histoires |
| js/features/cookies.js | Gestion du consentement cookies |
| js/ui.js | Logique d'interface utilisateur |
| js/app.js | Cr\xc3\xa9e l'objet global et le state |
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
- **notation.js** : Gestion de la notation des histoires. Ce module affiche la note stockée dans Firebase, gère la sélection des étoiles et expose la méthode `reset()` pour masquer le bloc de notation lors de la génération d'une nouvelle histoire.

### Modules de Partage (sharing)

- **index.js** : Point d'entrée du module de partage
- **notifications.js** : Gestion des notifications de partage
- **storage.js** : Stockage des données de partage

### Système de notation des histoires

La fonctionnalité de notation permet aux utilisateurs d'évaluer une histoire en sélectionnant de 1 à 5 étoiles. Le bloc de notation est affiché dans l'écran de résultat et la note est enregistrée dans Firestore. Le module `notation.js` fournit les méthodes :

- `afficherNote(id)` : lit la note depuis Firestore et met à jour l'affichage.
- `bindNotation(id)` : ajoute les événements de clic sur les étoiles pour sauvegarder la note.
- `reset()` : réinitialise l'affichage (étoiles non sélectionnées et bloc masqué).

## Schéma d'Architecture Détaillé

```
firebase-init.js -> index.js -> config.js -> common.js
                              |
                              v
                          js/core/*
                              |
                              v
                       js/features/*
                              |
                              v
                            ui.js
                              |
                              v
                            app.js

(non utilisés : js/modules/ , js/adapters/)
```

### Explications Complémentaires

#### Modèle d'Initialisation

L'application suit un modèle d'initialisation séquentiel où chaque module est initialisé dans un ordre précis pour garantir que les dépendances sont satisfaites :

1. **js/firebase-init.js**
2. **js/index.js**
3. **js/config.js**
4. **js/common.js**
5. **Modules core** (`js/core/*`)
6. **Modules features** (`js/features/*`)
7. **js/ui.js**
8. **js/app.js**

#### Système d'Événements

Le système d'événements (`MonHistoire.events`) est le mécanisme central de communication entre les modules :

- Les modules s'abonnent aux événements via `MonHistoire.events.on(event, callback)`
- Les modules déclenchent des événements via `MonHistoire.events.emit(event, data)`
- Ce système permet un couplage faible entre les modules

#### État Global

L'état global (`MonHistoire.state`) maintient les données partagées entre les modules :

- État de navigation (`currentScreen`, `previousScreen`)
- État utilisateur (`profilActif`)
- État des fonctionnalités (`lectureAudioEnCours`, `isConnected`)

#### Gestion Hors Ligne

L'application implémente une stratégie de résilience pour le mode hors ligne :

- Détection de l'état de connexion via `navigator.onLine` et Firebase Realtime Database
- File d'attente des opérations hors ligne dans `MonHistoire.state.offlineOperations`
- Synchronisation automatique lors de la reconnexion

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

* js/firebase-init.js
* js/index.js
* js/config.js
* js/common.js
* modules core (js/core/*)
* modules features (js/features/*)
* js/ui.js
* js/app.js

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

### Fichiers et dossiers non utilis\xc3\xa9s

- `js/modules/`
- `js/adapters/`
- `style.css` (utilis\xc3\xa9 uniquement pour `404.html`)
## Conclusion

Cette nouvelle architecture modulaire offre une base solide pour le développement futur de l'application "Mon Histoire". Elle facilite la maintenance, l'évolution et la collaboration entre développeurs.

## Déploiement des Règles Firestore

Un fichier `firestore.rules` est présent à la racine du projet. Il définit les règles de sécurité permettant aux utilisateurs authentifiés d'accéder à leurs propres données sous `users/{userId}` et dans toutes les sous-collections (par exemple `stories` ou `profils_enfant/{profilId}/stories`).

Pour déployer ces règles vers votre projet Firebase, utilisez la commande suivante après avoir installé les Firebase Tools :

```bash
firebase deploy --only firestore:rules
```

## Système de Journalisation

Le fichier `js/app.js` introduit un **logger** centralisé accessible via `MonHistoire.logger`. Ce système standardise l'affichage dans la console et l'enregistrement des erreurs importantes dans Firestore.

### Niveaux de log

Le logger gère plusieurs niveaux de gravité :

- `DEBUG`
- `INFO`
- `WARNING`
- `ERROR`
- `FIREBASE` : réservé aux messages provenant des services Firebase.

### Préfixes

Chaque message peut recevoir un préfixe pour identifier sa provenance (Firestore, Auth, profil, partage, etc.). Les principaux sont : `FIREBASE_REALTIME`, `FIREBASE_FIRESTORE`, `FIREBASE_AUTH`, `STORY`, `SHARING` …

### Format et affichage

La méthode principale `log()` ajoute un horodatage ISO et affiche `[niveau] [préfixe] message` suivi des données formatées dans la console. Les données sont passées à `_formatData()` qui tronque par exemple le contenu d’une histoire trop long ou extrait uniquement le code et le message d’une erreur Firebase.

### Sauvegarde dans Firestore

Seuls les messages de niveau `ERROR` ou `WARNING` sont persistantés. Lorsque l’utilisateur est authentifié, `_saveToFirestore()` crée un document sous `users/{uid}/error_logs/` contenant :

- `level`, `prefix` et `message`
- `data` : version formatée des données supplémentaires
- `timestamp` : horodatage serveur Firestore
- `deviceInfo` : informations sur le navigateur, l’identifiant d’appareil et l’état de connexion (en ligne, connexion à Realtime DB…)

Cette approche permet de conserver un historique succinct des incidents tout en évitant de stocker des données volumineuses ou sensibles.

