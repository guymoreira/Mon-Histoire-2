# Documentation synthétique de l'application "Mon Histoire"

Cette application web permet aux utilisateurs de générer, sauvegarder et partager des histoires personnalisées. Elle repose sur Firebase pour l'authentification, le stockage et la base de données temps réel. Ci-dessous se trouve un récapitulatif de l'architecture actuelle et des principales fonctionnalités.

## Architecture générale

- **HTML / CSS** : l'interface est définie dans `index.html` et organisée en composants CSS modulaires sous `css/`. Le style suit les conventions décrites dans `guide-integration-ui.md` et `ui-guide-style.md`.
- **JavaScript** : tous les scripts se trouvent dans `js/`.
  - `core/` regroupe les modules fondamentaux :
    - `auth.js` : gestion de l'authentification Firebase, inscription/connexion, changement de profil.
    - `navigation.js` : navigation entre les écrans et gestion du footer.
    - `profiles.js` : manipulation des profils enfants et parent.
    - `storage.js` : accès Firestore et fonctions utilitaires de stockage.
  - `features/` contient les fonctionnalités métier :
    - `stories/` : génération (`generator.js`), affichage (`display.js`), gestion des sauvegardes (`management.js`) et notation (`notation.js`).
    - `sharing/` : partage d'histoires (fichiers `index.js`, `ui.js`, `storage.js`, `notifications.js` et sous-dossier `realtime/`).
    - `export.js` : export au format PDF via jsPDF.
    - `audio.js` : lecture audio des histoires.
    - `cookies.js` : gestion du consentement.
  - `firebase-init.js` initialise Firebase avec la persistance Firestore.
  - `index.js` est le point d'entrée qui vérifie le chargement des ressources.
  - `app.js` crée l'objet global `MonHistoire`, gère l'état partagé, les événements internes et le logger.

## Fonctionnement principal

1. **Initialisation** : `firebase-init.js` configure Firebase puis `index.js` déclenche l'initialisation progressive des modules listés ci-dessus via `app.js`.
2. **État global et événements** : `app.js` maintient `MonHistoire.state` (écran courant, profil actif, opérations hors ligne…) et fournit `MonHistoire.events` pour la communication entre modules.
3. **Gestion hors ligne** : une file d'opérations (`offlineOperations`) permet de mettre en file les partages d'histoires en cas de coupure. Les actions sont rejouées lors de la reconnexion.
4. **Logger** : `MonHistoire.logger` centralise les logs avec plusieurs niveaux (DEBUG, INFO, WARNING, ERROR, FIREBASE). Les erreurs importantes peuvent être sauvegardées dans Firestore.
5. **Création et affichage d'histoires** :
   - L'utilisateur choisit des paramètres (personnage, lieu…) dans le formulaire.
   - `stories/generator.js` sélectionne une histoire dans la collection `stock_histoires` de Firestore, en évitant les histoires déjà lues par ce profil.
   - L'histoire est présentée à l'écran `resultat`, où l'utilisateur peut la noter (`stories/notation.js`), la sauvegarder ou la partager.
6. **Sauvegarde et quota** : `stories/management.js` sauvegarde l'histoire dans Firestore et gère un quota défini dans `config.js` (`MAX_HISTOIRES`).
7. **Partage et notifications** : le module `sharing` stocke les histoires partagées et utilise Realtime Database pour notifier les profils concernés. Les notifications non lues sont comptabilisées dans `notificationsNonLues`.
8. **Export PDF** : `features/export.js` permet de générer un PDF de l'histoire courante via jsPDF.

## Sécurité et règles Firebase

Les règles Firestore (`firestore.rules`) autorisent chaque utilisateur authentifié à lire et écrire seulement dans sa propre collection `users/{userId}/...`.

## Références supplémentaires

Le dépôt contient plusieurs documents d'analyse et de guides :
- `README.md` explique en détail l'architecture modulaire et le système de journalisation.
- `analyse-ui-components.md` et `analyse-ui-components-update.md` recensent les styles des boutons et modales.
- `guide-integration-ui.md` décrit l'utilisation du système UI standardisé.
- `plan-refactorisation-ui.md` et `ui-guide-style.md` précisent la stratégie de refonte des styles et les conventions BEM.

Cette synthèse sert de point d'entrée rapide pour comprendre le fonctionnement de l'application. Pour plus de détails, consulter les fichiers mentionnés ci-dessus ainsi que le code des modules.
