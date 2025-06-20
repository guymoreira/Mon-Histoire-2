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
├── firebase-init.js          # Initialisation Firebase
├── modules/                  # Nouveau système modulaire
│   ├── app.js               # Noyau de l'application
│   ├── core/                # Fonctionnalités de base
│   ├── user/                # Gestion des utilisateurs
│   ├── ui/                  # Interface utilisateur
│   ├── stories/             # Histoires
│   ├── features/            # Modules complémentaires
│   ├── sharing/             # Partage d'histoires
│   └── messaging/           # Messagerie
├── core/ (legacy)           # Ancien emplacement des modules de base
└── features/ (legacy)       # Anciennes fonctionnalités
css/
├── main.css                  # Point d'entrée CSS
├── base/                     # Styles de base
├── components/               # Styles des composants
├── layout/                   # Styles de mise en page
├── screens/                  # Styles des écrans
└── features/                 # Styles des fonctionnalités
```

Les dossiers `js/core` et `js/features` sont conservés uniquement pour assurer
la compatibilité avec l'ancienne architecture. Ils sont désormais dépréciés et
seront retirés lors d'une future mise à jour.

## Ancienne structure (legacy)

Avant la refactorisation modulaire, la logique de l'application était répartie
dans quelques fichiers globaux :

- **js/app.js** : point d'entrée contenant l'état global et la logique
  principale de l'application.
- **js/index.js** : initialisation de l'application après le chargement de
  Firebase.
- **js/config.js** : paramètres et messages d'erreur communs.
- **js/common.js** : fonctions utilitaires et aide au chargement d'événements.
- **js/firebase-init.js** : configuration et connexion à Firebase.
- **js/ui.js** : accès simplifié aux composants de l'interface.
- **js/core/** : modules d'authentification, de navigation, de gestion des
  profils et du stockage.
- **js/features/** : fonctionnalités audio, export, cookies ainsi que les
  sous‑dossiers **messaging/** et **stories/** pour la messagerie et les
  histoires.

Ces fichiers restent présents pour compatibilité mais ne sont plus enrichis.

## Organisation des Modules

### Modules de Base (core)

- **modules/core/config.js** : Gestion de la configuration de l'application
- **modules/core/cookies.js** : Consentement aux cookies et préférences utilisateur
- **modules/core/navigation.js** : Navigation entre les différentes sections de l'application
- **modules/core/storage.js** : Accès à Firebase Firestore et Storage

### Modules Utilisateur (user)

- **modules/user/auth.js** : Authentification des utilisateurs
- **modules/user/profiles.js** : Gestion des profils utilisateur
- **modules/user/account.js** : Paramètres et suppression de compte

### Modules d'Interface Utilisateur (ui)

- **modules/ui/common.js** : Composants communs (modales, notifications)

### Modules d'Histoires (stories)

- **modules/stories/generator.js** : Création d'histoires à partir des données utilisateur
- **modules/stories/management.js** : Sauvegarde et suppression d'histoires
- **modules/stories/display.js** : Affichage des histoires
- **modules/stories/export.js** : Exportation (PDF ou image)

### Modules de Fonctionnalités (features)

- **modules/features/audio.js** : Lecture audio des histoires
- **modules/features/cookies.js** : Préférences de cookies
- **modules/features/export.js** : Export supplémentaire (PDF, image)
- **modules/features/messaging/** : Fonctions de messagerie
- **modules/features/sharing/** : Partage d'histoires
- **modules/features/stories/** : Génération et notation d'histoires

### Modules de Partage (sharing)

- **modules/sharing/index.js** : Point d'entrée du partage
- **modules/sharing/notifications.js** : Notifications liées au partage
- **modules/sharing/storage.js** : Stockage des données de partage
- **modules/sharing/ui.js** : Composants pour partager une histoire
- **modules/sharing/realtime/** : Notifications en temps réel

### Modules de Messagerie (messaging)

- **modules/messaging/index.js** : Point d'entrée de la messagerie
- **modules/messaging/storage.js** : Sauvegarde et lecture des messages
- **modules/messaging/realtime.js** : Écoute en temps réel des conversations
- **modules/messaging/notifications.js** : Notifications de nouveaux messages
- **modules/messaging/ui.js** : Interface des conversations

### Système de notation des histoires

La fonctionnalité de notation permet aux utilisateurs d'évaluer une histoire en sélectionnant de 1 à 5 étoiles. Le bloc de notation est affiché dans l'écran de résultat et la note est enregistrée dans Firestore. Le module `notation.js` fournit les méthodes :

- `afficherNote(id)` : lit la note depuis Firestore et met à jour l'affichage.
- `bindNotation(id)` : ajoute les événements de clic sur les étoiles pour sauvegarder la note.
- `reset()` : réinitialise l'affichage (étoiles non sélectionnées et bloc masqué).

## Messagerie

La messagerie permet aux utilisateurs parent et enfant de discuter en toute sécurité.
Elle s'appuie sur trois modules :

- **storage.js** : accès à Firestore pour créer ou récupérer une conversation et enregistrer les messages.
- **realtime.js** : mise en place des écouteurs en temps réel sur les messages.
- **ui.js** : affichage des conversations et des bulles de messages dans l'interface.

### API principale

```javascript
messaging.getOrCreateConversation(participants);
messaging.sendMessage(conversationId, contenu);
messaging.listenToMessages(conversationId, cb);
messaging.markAsRead(conversationId, messageId, userKey);
messaging.hasUnreadMessages(conversationId, userKey);
```
- `messaging.listenToUnreadMessages()` : écoute les conversations de l'utilisateur pour détecter les nouveaux messages non lus.
- `messaging.detachUnreadListeners()` : retire tous les écouteurs créés par `listenToUnreadMessages()`.

### Schéma Firestore

```
conversations
  └─ {conversationId}
       ├─ participants: [uid:type]
       ├─ participantsHash: string
       ├─ lastMessage: string
       ├─ createdAt / updatedAt
       └─ messages
            └─ {messageId}
                 ├─ senderId: uid:type
                 ├─ content: string
                 ├─ createdAt: timestamp
                 ├─ deviceId: string
                 ├─ version: number
                 ├─ processedOffline: boolean
                 └─ readBy: [profilKey]
```

`readBy` stocke la clé de profil (`uid:profilId` ou `uid:parent`) pour chaque
utilisateur ayant lu le message. Pour les anciens messages ne contenant que
l'UID simple, celui-ci n'est pris en compte que si aucune clé de profil n'est
présente dans le tableau.

Les champs `deviceId` et `version` servent à identifier les messages mis en attente hors ligne. Lorsque l'utilisateur n'est pas connecté, l'envoi est enregistré dans une file locale avec ces informations. À la reconnexion, `MonHistoire.processOfflineQueue()` lit cette file et crée le message dans Firestore en ajoutant `processedOffline: true`.

Les règles de sécurité se trouvent dans `firestore.messaging.rules` et les index nécessaires dans `firestore.indexes.json`.

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
|  |                         js/modules/app.js (5)                        |                                                |
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
|  | modules/core/auth.js     |<--->| modules/core/navigation.js|<--->| modules/core/profiles.js |<--->| modules/core/storage.js  |            |
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
|  +------------------+     +-------------------+     +------------------+     +------------------+     +-------------------+            |
|  | modules/stories |<--->| modules/sharing  |<--->| modules/features  |<--->| modules/features   |<--->| modules/messaging |            |
|  | - generator      |     | - init()          |     | - init()         |     | - init()         |     | - storage         |            |
|  |   - init()       |     | - notifications   |     | - exporterPDF()  |     | - lireHistoire() |     |   - init()        |            |
|  |   - genererHist()|     |   - init()        |     | - preparerPDF()  |     | - pauserLecture()|     | - realtime        |            |
|  | - display        |     |   - verifierNotif |     |                  |     |                  |     |   - init()        |            |
|  |   - init()       |     | - storage         |     |                  |     |                  |     | - ui              |            |
|  |   - afficherHist |     |   - init()        |     |                  |     |                  |     |   - init()        |            |
|  | - management     |     |   - sauvegarder   |     |                  |     |                  |     | - notifications   |            |
|  |   - init()       |     | - ui              |     |                  |     |                  |     |   - init()        |            |
|  |   - sauvegarder()|     |   - init()        |     |                  |     |                  |     |                  |            |
|  |   - supprimer()  |     |   - afficherUI    |     |                  |     |                  |     |                  |            |
|  +------------------+     +-------------------+     +------------------+     +------------------+     +-------------------+            |
|                                                                                                              |
|  +------------------+                                                                                        |
|  | modules/features/cookies |                                                                                        |
|  | - init()         |                                                                                        |
|  | - accepter()     |                                                                                        |
|  | - refuser()      |                                                                                        |
|  | - sauvegarder()  |                                                                                        |
|  +------------------+                                                                                        |
|                                                                                                              |
|  +-------------------+
|  | modules/stories/notation |
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
|     DOMContentLoaded → index.js → js/modules/app.js:init() → initialisation séquentielle                                |
|                                                                                                              |
|  2. Événements d'authentification                                                                            |
|     firebase.auth().onAuthStateChanged → js/modules/app.js → modules/core/auth.js → modules/stories/management.js              |
|                                                                                                              |
|  3. Événements de navigation                                                                                 |
|     UI (click) → ui.js → modules/core/navigation.js:showScreen() → MonHistoire.state.currentScreen                   |
|                                                                                                              |
|  4. Événements de génération d'histoire                                                                      |
|     UI (submit) → ui.js → modules/stories/generator.js → modules/stories/display.js                        |
|                                                                                                              |
|  5. Événements de partage                                                                                    |
|     UI (click) → ui.js → modules/sharing/ui.js → modules/sharing/storage.js → modules/sharing/notif.js    |
|                                                                                                              |
|  6. Événements de changement de profil                                                                       |
|     UI (click) → ui.js → modules/core/profiles.js → MonHistoire.events.emit("profilChange") → modules/sharing       |
|                                                                                                              |
|  7. Événements de connexion/déconnexion                                                                      |
|     Network → js/modules/app.js:checkConnectionState() → MonHistoire.events.emit("connectionStateChanged")              |
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
|  5. js/modules/app.js - Noyau de l'application                                                                          |
|     - Création de l'objet global MonHistoire                                                                 |
|     - Initialisation du state                                                                                |
|     - Initialisation du système d'événements                                                                 |
|     - Initialisation du logger                                                                               |
|                                                                                                              |
|  6. Modules Core - Fonctionnalités de base                                                                   |
|     a. modules/core/auth.js - Authentification                                                                       |
|     b. modules/core/navigation.js - Navigation entre écrans                                                          |
|     c. modules/core/profiles.js - Gestion des profils                                                                |
|     d. modules/core/storage.js - Stockage des données                                                                |
|                                                                                                              |
|  7. Modules Features - Fonctionnalités spécifiques                                                           |
|     a. modules/stories/generator.js - Génération d'histoires                                                |
|     b. modules/stories/display.js - Affichage des histoires                                                 |
|     c. modules/stories/management.js - Gestion des histoires                                                |
|     d. modules/sharing/* - Partage d'histoires                                                              |
|     e. modules/features/export.js - Export des histoires                                                             |
|     f. modules/features/audio.js - Lecture audio des histoires                                                       |
|     g. modules/features/cookies.js - Gestion des cookies                                                             |
|     h. modules/stories/notation.js - Notation des histoires
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

L'initialisation de l'application est gérée par le fichier `js/index.js`. Ce fichier charge ensuite `js/modules/app.js`, qui définit l'objet global `MonHistoire` et coordonne les modules. Les modules sont initialisés dans un ordre spécifique pour garantir que les dépendances sont respectées.

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

## Tests

Avant d'exécuter `npm test`, installez d'abord les dépendances de développement avec `npm install`.

Si vous travaillez sans connexion Internet, copiez un dossier `node_modules` préalablement préparé ou un cache npm dans `./npm-cache` puis lancez `./offline-setup.sh` pour installer ces dépendances hors ligne.

```bash
npm test
```

## Conclusion

Cette nouvelle architecture modulaire offre une base solide pour le développement futur de l'application "Mon Histoire". Elle facilite la maintenance, l'évolution et la collaboration entre développeurs.

## Déploiement

Les règles de sécurité Firestore destinées à la messagerie se trouvent dans le fichier `firestore.messaging.rules` à la racine du projet. Veillez à inclure ce fichier lors du déploiement sur Firebase. Ce fichier vérifie que `request.auth.uid` est présent dans `resource.data.participants` (les identifiants sont séparés par `:` pour extraire l'UID).

Le fichier `firestore.indexes.json` contient la définition des index composites nécessaires à l'application. Déployez-le à l'aide de la commande :

```bash
firebase deploy --only firestore:indexes
```

## Vie privée & RGPD

Les messages que vous échangez et les métadonnées associées (participants, dates et identifiants de profil) sont stockés dans Firebase Firestore avec votre consentement afin de conserver l'historique des conversations. Vous pouvez en demander la suppression à tout moment ou effacer ces données en supprimant un profil.

Les préférences de cookies sont gérées par le module `modules/features/cookies.js`. Vous trouverez le texte complet de la politique de confidentialité et des cookies dans le fichier `index.html`.

## Licence

Ce projet est distribué sous la licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.
