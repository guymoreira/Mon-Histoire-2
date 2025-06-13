# Analyse des composants UI de Mon Histoire

Ce document recense toutes les caractéristiques des boutons, modales et blocs centrés de l'application, et analyse les différences de disposition selon les contextes.

## 1. Boutons

### 1.1 Styles de base des boutons

```css
.button {
  display: block;
  width: 100%;
  margin: 0.38em 0 0.28em 0;    /* ESPACEMENT réduit */
  padding: 0.85em 0;             /* HAUTEUR augmentée */
  border: none;
  border-radius: 28px;           /* ARRONDI réduit pour un aspect plus "carte" que "pilule" */
  font-size: 1.22em;
  font-family: 'Fredoka', Arial, sans-serif;
  font-weight: 700;
  letter-spacing: 0.01em;
  text-align: center;
  cursor: pointer;
  box-shadow: 0 5px 18px 0 rgba(211,174,114,0.17);
  transition: transform 0.09s, box-shadow 0.11s;
}
```

### 1.2 Variantes de couleur

```css
.button-blue {
  background: #79d4e7;
  color: #395872;
  box-shadow: 0 7px 18px 0 rgba(211,174,114,0.22);
}

.button-purple {
  background: #d5b8f6;
  color: #5c4683;
  box-shadow: 0 7px 18px 0 rgba(211,174,114,0.22);
}
```

### 1.3 Boutons d'action (icônes)

```css
.icon-action {
  background: #fff;
  color: #1161a5;
  border-radius: 50%;
  border: 2px solid #dde7f3;
  width: 2.3em;
  height: 2.3em;
  min-width: 2.3em;
  min-height: 2.3em;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4em;
  margin-left: 0.7em;
  cursor: pointer;
  box-shadow: 0 0 6px rgba(50,100,150,0.10);
  transition: box-shadow 0.2s, background 0.2s;
  padding: 0;
}
```

### 1.4 Groupes de boutons

```css
.button-group {
  display: flex;
  justify-content: space-between; /* espace max entre les deux boutons */
  gap: 1rem;                       /* espace intermédiaire conservé */
}
```

### 1.5 Boutons dans les formulaires

```css
.form-buttons {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  gap: 1rem;
  margin-top: 1.5rem;
  margin-bottom: 2rem;
  max-width: 400px;
  margin-left: auto;
  margin-right: auto;
}

.form-buttons .button {
  margin: 0;
  flex: 1;
}

.form-buttons .button:only-child {
  flex: 0 0 48%;
  max-width: 200px;
  margin-left: auto;
  margin-right: auto;
}
```

## 2. Blocs centrés

### 2.1 Style de base des blocs centrés

```css
.bloc-centre,
.modal .bloc-centre,
.bloc-compte,
.modal-content,
.message-card {
  background: #fff8e1 !important;   /* crème pastel, effet carte douce */
  border-radius: 36px !important;   /* très arrondi */
  padding: 1rem;
  width: 90%;
  max-width: 600px;
  margin: 2vh auto;
  box-shadow: 0 6px 28px rgba(76,195,247,0.09), 0 2px 7px rgba(180,150,240,0.08);
}
```

### 2.2 Variantes selon les écrans

#### Écran Accueil

```css
#accueil-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  text-align: center;
  background: var(--color-background-cream) !important;
  border-radius: var(--border-radius-xl) !important;
  padding: 1rem;
  width: 90%;
  max-width: 600px;
  margin: 0;
  box-shadow: var(--shadow-card);
}

#accueil-content .button {
  max-width: 300px;
  margin: 0.38em auto;
}
```

#### Écran Formulaire

```css
#formulaire.screen {
  padding-left: 1rem;
  padding-right: 1rem;
  padding-bottom: 2rem; /* Réduit l'espace en bas */
  max-height: 100vh;  /* Limite la hauteur à la hauteur de la fenêtre */
  overflow-y: auto;   /* Permet le défilement vertical */
}

#formulaire .bloc-centre {
  width: 100%;
  max-width: 500px;    /* ajustez à votre convenance */
  margin: 2vh auto;    /* uniquement marge verticale */
  padding-bottom: 1rem; /* Réduit l'espace en bas */
}
```

#### Écran Connexion

```css
#connexion .bloc-centre {
  /* on prend plus de place horizontalement : 95 % au lieu de 90 % */
  width: 100%;
  /* si besoin, on peut aussi ajuster le plafond : */
  max-width: 360px;
}
```

#### Écran Résultat

```css
#resultat.screen {
  padding-left: 1rem;
  padding-right: 1rem;
}

#resultat .bloc-centre {
  width: 100%;
  max-width: 500px;    /* même valeur que pour formulaire ou différente */
  margin: 2vh 0;
}
```

#### Écran Mes Histoires

```css
#mes-histoires .bloc-centre {
  width: 100%;
  max-width: 600px; /* ou 500px si tu préfères moins large */
  margin: 2vh auto;
}
```

## 3. Modales

### 3.1 Style de base des modales

```css
.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.35s, transform 0.35s;
  transform: scale(0.95);
}

.modal.show {
  opacity: 1;
  pointer-events: auto;
  transform: scale(1);
}

.modal-content {
  background: #fff;
  border-radius: 10px;
  padding: 2rem;
  text-align: center;
  width: 90%;
  max-width: 400px;  /* ou 90% / 600px selon l'importance du contenu */
  box-shadow: 0 0 10px rgba(0,0,0,0.3);
}
```

### 3.2 Variantes de modales

#### Modale de message

```css
#message-modal .bloc-centre {
  width: 60%;
  max-width: 400px;
}

.message-card {
  background: #fff;
  border-radius: 10px;
  padding: 2rem;
  text-align: center;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 0 10px rgba(0,0,0,0.3);
}
```

#### Modale de ré-authentification

```css
#modal-reauthentication .bloc-centre,
#modal-password-parent .bloc-centre {
  max-width: 350px;
}
```

#### Modale de suppression de compte

```css
#delete-account-modal .message-card p {
  color: #e74c3c; 
  font-weight: bold;
}

#btn-confirm-delete-account {
  background: #e74c3c; 
  color: #fff;
}
```

## 4. Analyse des incohérences

### 4.1 Incohérences dans les boutons

1. **Marges variables** :
   - Boutons standards : `margin: 0.38em 0 0.28em 0;`
   - Boutons dans .form-buttons : `margin: 0;`
   - Boutons dans #accueil-content : `margin: 0.38em auto;`

2. **Largeurs variables** :
   - Boutons standards : `width: 100%;`
   - Boutons dans #accueil-content : `max-width: 300px;`
   - Boutons dans .form-buttons:only-child : `flex: 0 0 48%; max-width: 200px;`
   - Boutons dans #mes-histoires-actions.single : `flex: 0 0 48%; max-width: 200px;`

3. **Styles d'icônes incohérents** :
   - #btn-renommer-histoire.icon-action : taille 56px, bordure 2px
   - #btn-export-pdf.icon-action, etc. : taille 2.3em, bordure 2px
   - Différences de marges et de tailles entre les boutons d'action

### 4.2 Incohérences dans les blocs centrés

1. **Largeurs variables** :
   - Blocs standards : `width: 90%; max-width: 600px;`
   - #connexion .bloc-centre : `width: 100%; max-width: 360px;`
   - #formulaire .bloc-centre : `width: 100%; max-width: 500px;`
   - #resultat .bloc-centre : `width: 100%; max-width: 500px;`

2. **Marges variables** :
   - Blocs standards : `margin: 2vh auto;`
   - #accueil-content : `margin: 0;`
   - #resultat .bloc-centre : `margin: 2vh 0;`

3. **Arrondis variables** :
   - Blocs standards : `border-radius: 36px !important;`
   - Modales : `border-radius: 10px;`

### 4.3 Incohérences dans les modales

1. **Tailles variables** :
   - modal-content standard : `max-width: 400px;`
   - #message-modal .bloc-centre : `width: 60%; max-width: 400px;`
   - #modal-reauthentication .bloc-centre : `max-width: 350px;`

2. **Styles de fond variables** :
   - modal-content standard : `background: #fff;`
   - .bloc-centre dans les modales : `background: #fff8e1 !important;`

## 5. Recommandations

1. **Standardiser les boutons** :
   - Utiliser les classes `.ui-button`, `.ui-button--primary`, `.ui-button--secondary` du nouveau système
   - Standardiser les tailles avec `.ui-button--small`, `.ui-button--medium`, `.ui-button--large`
   - Standardiser les largeurs avec `.ui-button--auto`, `.ui-button--full`, `.ui-button--half`

2. **Standardiser les blocs centrés** :
   - Utiliser les classes `.ui-card`, `.ui-card--white`, `.ui-card--cream` du nouveau système
   - Standardiser les tailles avec `.ui-card--small`, `.ui-card--medium`, `.ui-card--large`
   - Standardiser les paddings avec `.ui-card--padding-sm`, `.ui-card--padding-md`, `.ui-card--padding-lg`

3. **Standardiser les modales** :
   - Utiliser les classes `.ui-modal`, `.ui-modal-content` du nouveau système
   - Standardiser les tailles avec `.ui-modal-content--small`, `.ui-modal-content--medium`, `.ui-modal-content--large`

4. **Utiliser les utilitaires** :
   - Utiliser les classes d'espacement `.ui-mt-*`, `.ui-mb-*`, `.ui-ml-*`, `.ui-mr-*`, `.ui-p-*`
   - Utiliser les classes de flexbox `.ui-flex`, `.ui-flex-column`, `.ui-justify-center`, etc.
   - Utiliser les classes de texte `.ui-text-center`, `.ui-text-left`, `.ui-text-right`
