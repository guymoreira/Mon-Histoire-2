# Mon Histoire - Documentation de la Structure Modulaire

## Présentation

"Mon Histoire" est une application web permettant aux utilisateurs de créer et partager des histoires personnalisées. Cette documentation présente la nouvelle architecture modulaire mise en place pour améliorer la maintenabilité et l'évolutivité du code.

## Prérequis

- Node.js >= 14

## Installation et démarrage

```bash
npm install
npm start
```

Le serveur démarre sur http://localhost:3000.

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
+--------------------------------------------------------------------------------------------------------------+
|                                        INITIALISATION ET CHARGEMENT                                           |
+--------------------------------------------------------------------------------------------------------------+
|                                                                                                              |
|  +------------------+     +-------------------+     +------------------+     +------------------+            |
|  | firebase-init.js |---->| index.js          |---->| config.js        |---->| common.js        |            |
|  | (1)              |     | (2)               |     | (3)              |     | (4)              |            |
|  | - initFirebase   |     | - DOMContentLoaded|     | - firebaseConfig |     | - utilitaires    |            |
|  | - authDomain     |     | - vérif Firebase  |     | - constantes     |     | - fonctions      |            |
|  | - enablePersist. |     |                   |     | - quotas         |     | - helpers        |            |
|  +------------------+     +-------------------+     +------------------+     +------------------+            |
|                                                                                                              |
+--------------------------------------------------------------------------------------------------------------+
                                                      |
                                                      v
+--------------------------------------------------------------------------------------------------------------+
|                                           NOYAU DE L'APPLICATION                                              |
+--------------------------------------------------------------------------------------------------------------+
|                                                                                                              |
|  +----------------------------------------------------------+                                                |
|  |                         app.js (5)                        |                                                |
|  |                                                          |                                                |
|  |  +----------------+    +-------------------+             |                                                |
|  |  | MonHistoire.   |<-->| MonHistoire.      |             |                                                |
|  |  | state          |    | events            |             |                                                |
|  |  | - currentScreen|    | - on(event, cb)   |             |                                                |
|  |  | - profilActif  |    | - emit(event,data)|             |                                                |
|  |  | - isConnected  |    |                   |             |                                                |
|  |  +----------------+    +-------------------+             |                                                |
|  |                                                          |                                                |
|  |  +----------------+    +-------------------+             |                                                |
|  |  | MonHistoire.   |    | MonHistoire.      |             |                                                |
|  |  | logger         |    | init()            |             |                                                |
|  |  | - log()        |    | - initFirebase    |             |                                                |
|  |  | - error()      |    | - initCore        |             |                                                |
|  |  | - debug()      |    | - initFeatures    |             |                                                |
|  |  +----------------+    | - initUI          |             |                                                |
|  |                        +-------------------+             |                                                |
|  +----------------------------------------------------------+                                                |
|                                                                                                              |
+--------------------------------------------------------------------------------------------------------------+
                |                                                   ^
                |                                                   |
                v                                                   |
+--------------------------------------------------------------------------------------------------------------+
|                                           MODULES CORE (6)                                                    |
+--------------------------------------------------------------------------------------------------------------+
|                                                                                                              |
|  +------------------+     +-------------------+     +------------------+     +------------------+            |
|  | core/auth.js     |<--->| core/navigation.js|<--->| core/profiles.js |<--->| core/storage.js  |            |
|  | - init()         |     | - init()          |     | - init()         |     | - init()         |            |
|  | - loginUser()    |     | - showScreen()    |     | - profilActif    |     | - saveData()     |            |
|  | - logoutUser()   |     | - goBack()        |     | - passerAuProfil |     | - loadData()     |            |
|  | - registerUser() |     | - getScreen()     |     | - verifierProfil |     | - deleteData()   |            |
|  +------------------+     +-------------------+     +------------------+     +------------------+            |
|                                                                                                              |
+--------------------------------------------------------------------------------------------------------------+
                |                                                   ^
                |                                                   |
                v                                                   |
+--------------------------------------------------------------------------------------------------------------+
|                                         MODULES FEATURES (7)                                                  |
+--------------------------------------------------------------------------------------------------------------+
|                                                                                                              |
|  +------------------+     +-------------------+     +------------------+     +------------------+            |
|  | features/stories |<--->| features/sharing  |<--->| features/export  |<--->| features/audio   |            |
|  | - generator      |     | - init()          |     | - init()         |     | - init()         |            |
|  |   - init()       |     | - notifications   |     | - exporterPDF()  |     | - lireHistoire() |            |
|  |   - genererHist()|     |   - init()        |     | - preparerPDF()  |     | - pauserLecture()|            |
|  | - display        |     |   - verifierNotif |     |                  |     |                  |            |
|  |   - init()       |     | - storage         |     |                  |     |                  |            |
|  |   - afficherHist |     |   - init()        |     |                  |     |                  |            |
|  | - management     |     |   - sauvegarder   |     |                  |     |                  |            |
|  |   - init()       |     | - ui              |     |                  |     |                  |            |
|  |   - sauvegarder()|     |   - init()        |     |                  |     |                  |            |
|  |   - supprimer()  |     |   - afficherUI    |     |                  |     |                  |            |
|  +------------------+     +-------------------+     +------------------+     +------------------+            |
|                                                                                                              |
|  +------------------+                                                                                        |
|  | features/cookies |                                                                                        |
|  | - init()         |                                                                                        |
|  | - accepter()     |                                                                                        |
|  | - refuser()      |                                                                                        |
|  | - sauvegarder()  |                                                                                        |
|  +------------------+                                                                                        |
|                                                                                                              |
|  +-------------------+
|  | features/notation |
|  | - afficherNote    |
|  | - bindNotation    |
|  | - reset()         |
|  +-------------------+
|  
+--------------------------------------------------------------------------------------------------------------+
                |                                                   ^
                |                                                   |
                v                                                   |
+--------------------------------------------------------------------------------------------------------------+
|                                           MODULE UI (8)                                                       |
+--------------------------------------------------------------------------------------------------------------+
|                                                                                                              |
|  +----------------------------------------------------------+                                                |
|  |                         ui.js                             |                                                |
|  |                                                          |                                                |
|  |  +----------------+    +-------------------+             |                                                |
|  |  | MonHistoire.ui |    | MonHistoire.ui.   |             |                                                |
|  |  | - init()       |    | bindEvents()      |             |                                                |
|  |  | - bindEvents() |    | - data-screen     |             |                                                |
|  |  | - bindLongPress|    | - form-submit     |             |                                                |
|  |  | - protegerBtn()|    | - btn-click       |             |                                                |
|  |  +----------------+    +-------------------+             |                                                |
|  |                                                          |                                                |
|  +----------------------------------------------------------+                                                |
|                                                                                                              |
+--------------------------------------------------------------------------------------------------------------+

+--------------------------------------------------------------------------------------------------------------+
|                                           FLUX D'ÉVÉNEMENTS                                                   |
+--------------------------------------------------------------------------------------------------------------+
|                                                                                                              |
|  1. Événements DOM                                                                                           |
|     DOMContentLoaded → index.js → app.js:init() → initialisation séquentielle                                |
|                                                                                                              |
|  2. Événements d'authentification                                                                            |
|     firebase.auth().onAuthStateChanged → app.js → core/auth.js → features/stories/management.js              |
|                                                                                                              |
|  3. Événements de navigation                                                                                 |
|     UI (click) → ui.js → core/navigation.js:showScreen() → MonHistoire.state.currentScreen                   |
|                                                                                                              |
|  4. Événements de génération d'histoire                                                                      |
|     UI (submit) → ui.js → features/stories/generator.js → features/stories/display.js                        |
|                                                                                                              |
|  5. Événements de partage                                                                                    |
|     UI (click) → ui.js → features/sharing/ui.js → features/sharing/storage.js → features/sharing/notif.js    |
|                                                                                                              |
|  6. Événements de changement de profil                                                                       |
|     UI (click) → ui.js → core/profiles.js → MonHistoire.events.emit("profilChange") → features/sharing       |
|                                                                                                              |
|  7. Événements de connexion/déconnexion                                                                      |
|     Network → app.js:checkConnectionState() → MonHistoire.events.emit("connectionStateChanged")              |
|                                                                                                              |
+--------------------------------------------------------------------------------------------------------------+

+--------------------------------------------------------------------------------------------------------------+
|                                      ORDRE D'INITIALISATION DÉTAILLÉ                                          |
+--------------------------------------------------------------------------------------------------------------+
|                                                                                                              |
|  1. firebase-init.js - Initialisation de Firebase                                                            |
|     - Configuration Firebase                                                                                 |
|     - Activation de la persistance Firestore                                                                 |
|                                                                                                              |
|  2. index.js - Point d'entrée                                                                                |
|     - Écouteur DOMContentLoaded                                                                              |
|     - Vérification de l'initialisation Firebase                                                              |
|                                                                                                              |
|  3. config.js - Configuration de l'application                                                               |
|     - Constantes                                                                                             |
|     - Quotas                                                                                                 |
|     - Messages d'erreur                                                                                      |
|                                                                                                              |
|  4. common.js - Utilitaires communs                                                                          |
|     - Fonctions helper                                                                                       |
|                                                                                                              |
|  5. app.js - Noyau de l'application                                                                          |
|     - Création de l'objet global MonHistoire                                                                 |
|     - Initialisation du state                                                                                |
|     - Initialisation du système d'événements                                                                 |
|     - Initialisation du logger                                                                               |
|                                                                                                              |
|  6. Modules Core - Fonctionnalités de base                                                                   |
|     a. core/auth.js - Authentification                                                                       |
|     b. core/navigation.js - Navigation entre écrans                                                          |
|     c. core/profiles.js - Gestion des profils                                                                |
|     d. core/storage.js - Stockage des données                                                                |
|                                                                                                              |
|  7. Modules Features - Fonctionnalités spécifiques                                                           |
|     a. features/stories/generator.js - Génération d'histoires                                                |
|     b. features/stories/display.js - Affichage des histoires                                                 |
|     c. features/stories/management.js - Gestion des histoires                                                |
|     d. features/sharing/* - Partage d'histoires                                                              |
|     e. features/export.js - Export des histoires                                                             |
|     f. features/audio.js - Lecture audio des histoires                                                       |
|     g. features/cookies.js - Gestion des cookies                                                             |
|     h. features/stories/notation.js - Notation des histoires
                               |
|  8. ui.js - Interface utilisateur                                                                            |
|     - Binding des événements UI                                                                              |
|     - Gestion des interactions utilisateur                                                                   |
|                                                                                                              |
+--------------------------------------------------------------------------------------------------------------+

+--------------------------------------------------------------------------------------------------------------+
|                                      STRUCTURES DE DONNÉES PARTAGÉES                                          |
+--------------------------------------------------------------------------------------------------------------+
|                                                                                                              |
|  1. MonHistoire.state                                                                                        |
|     - currentScreen: Écran actuel                                                                            |
|     - previousScreen: Écran précédent                                                                        |
|     - profilActif: Profil utilisateur actif                                                                  |
|     - lectureAudioEnCours: État de la lecture audio                                                          |
|     - isConnected: État de la connexion                                                                      |
|     - offlineOperations: File d'attente des opérations hors ligne                                            |
|                                                                                                              |
|  2. MonHistoire.events                                                                                       |
|     - listeners: Écouteurs d'événements                                                                      |
|     - on(event, callback): Ajouter un écouteur                                                               |
|     - emit(event, data): Déclencher un événement                                                             |
|                                                                                                              |
|  3. MonHistoire.logger                                                                                       |
|     - log(level, prefix, message, data): Logger un message                                                   |
|     - debug/info/warning/error: Raccourcis pour les niveaux de log                                           |
|                                                                                                              |
+--------------------------------------------------------------------------------------------------------------+
```

### Explications Complémentaires

#### Modèle d'Initialisation

L'application suit un modèle d'initialisation séquentiel où chaque module est initialisé dans un ordre précis pour garantir que les dépendances sont satisfaites :

1. **Firebase** est initialisé en premier pour fournir les services backend
2. **L'application principale** est ensuite initialisée, créant les structures de données globales
3. **Les modules core** sont initialisés pour fournir les fonctionnalités de base
4. **Les modules features** sont initialisés pour ajouter les fonctionnalités spécifiques
5. **L'UI** est initialisée en dernier pour lier les interactions utilisateur aux fonctionnalités

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

## Déploiement

Les règles de sécurité Firestore destinées à la messagerie se trouvent dans le fichier `firestore.messaging.rules` à la racine du projet. Veillez à inclure ce fichier lors du déploiement sur Firebase.

