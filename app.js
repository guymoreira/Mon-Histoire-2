// app.js
let resultatSource = "formulaire"; // Par défaut
// (le reste de tes variables globales)

firebase.auth().useDeviceLanguage();

const firebaseErrorMessages = {
  "auth/email-already-in-use": "Cette adresse e-mail est déjà utilisée.",
  "auth/invalid-email": "L'adresse e-mail n'est pas valide.",
  "auth/user-disabled": "Ce compte utilisateur a été désactivé.",
  "auth/user-not-found": "Aucun compte trouvé avec cet e-mail.",
  "auth/wrong-password": "Le mot de passe est incorrect.",
  "auth/weak-password": "Le mot de passe est trop faible (minimum 6 caractères).",
  "auth/too-many-requests": "Trop de tentatives. Merci de réessayer plus tard.",
  "auth/operation-not-allowed": "Opération non autorisée. Merci de contacter le support.",
  "auth/missing-password": "Merci de saisir un mot de passe.",
  "auth/missing-email": "Merci de saisir une adresse e-mail.",
  "auth/invalid-credential": "L'identifiant ou le mot de passe est invalide.",
  "auth/network-request-failed": "Problème de connexion réseau. Veuillez réessayer.",
  "auth/invalid-credential": "L'identifiant ou le mot de passe est invalide ou a expiré.",

};

firebase.auth().onAuthStateChanged(function(user) {
  if (user) {
    afficherUtilisateurConnecté();
    afficherHistoiresSauvegardees(); // On migrera plus tard vers Firestore
    bindLongPress();
  } else {
    afficherUtilisateurDéconnecté();
    afficherHistoiresSauvegardees();
    bindLongPress();
  }
});

// Affiche le modal générique avec un message
function showMessageModal(message) {
  document.getElementById("message-modal-text").textContent = message;
  const modal = document.getElementById("message-modal");
  modal.classList.add("show");
}

// Ferme le modal lorsque l'utilisateur clique sur OK
function closeMessageModal() {
  const modal = document.getElementById("message-modal");
  modal.classList.remove("show");
}
// —————————————
// State de navigation
// —————————————
let currentScreen  = "accueil";
let previousScreen = null;

// Affiche un écran, mémorise l’historique et gère le bouton “Sauvegarder”
function showScreen(screen) {
  if (screen === currentScreen) return;
  previousScreen = currentScreen;
  // masque tous les écrans actifs
  document.querySelectorAll('.screen.active')
          .forEach(el => el.classList.remove('active'));
  // affiche le nouvel écran
  document.getElementById(screen).classList.add('active');
  currentScreen = screen;

  // cas spécial Résultat : affiche ou cache le bouton “Sauvegarder”
if (screen === "resultat") {
  const btn = document.getElementById("btn-sauvegarde");
  // Affiche le bouton sauvegarde uniquement si connecté ET si on vient du formulaire de création
  if (firebase.auth().currentUser && resultatSource === "formulaire") {
    btn.style.display = "inline-block";
  } else {
    btn.style.display = "none";
  }
}


  // cas particulier : si c’est Mes Histoires, on rafraîchit la liste
if (screen === "mes-histoires") {
  afficherHistoiresSauvegardees();

  // Affiche le bouton Accueil seulement si tu viens de "resultat"
  const btnAccueil = document.getElementById("btn-accueil-mes-histoires");
  if (previousScreen === "resultat") {
    btnAccueil.style.display = "inline-block";
  } else {
    btnAccueil.style.display = "none";
  }
}
}
/** Bouton “Retour” : revient à l’écran précédent (ou accueil par défaut) */
function goBack() {
  showScreen(previousScreen || "accueil");
}

/**
 * Bascule l’affichage d’une “screen” sans délai ni flash.
 */

function loginUser() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  if (!email || !password) {
    showMessageModal("Merci de remplir tous les champs.");
    return;
  }

  // Firebase Auth
  firebase.auth().signInWithEmailAndPassword(email, password)
    .then((userCredential) => {
      afficherUtilisateurConnecté();
      showScreen("accueil");
    })
    .catch((error) => {
      const msg = firebaseErrorMessages[error.code] || error.message;
      showMessageModal(msg);
    });
}


function logoutUser() {
  firebase.auth().signOut().then(() => {
    afficherUtilisateurDéconnecté();
    document.getElementById("logout-modal").style.display = "none";
    showScreen("accueil");
  });
}


function afficherUtilisateurConnecté() {
  document.getElementById("user-icon").classList.remove("hidden");
  document.getElementById("login-button").classList.add("hidden");
  document.getElementById("my-stories-button").classList.remove("hidden");

  // Récupère l'utilisateur connecté
  const user = firebase.auth().currentUser;
  if (user) {
    // Récupère le prénom stocké dans Firestore (ou affiche l'initiale de l'email sinon)
    firebase.firestore().collection("users").doc(user.uid).get()
      .then((doc) => {
        let initiale = "U"; // Valeur par défaut
        if (doc.exists && doc.data().prenom) {
          initiale = doc.data().prenom.trim().charAt(0).toUpperCase();
        } else if (user.email) {
          initiale = user.email.charAt(0).toUpperCase();
        }
        document.getElementById("user-icon").textContent = initiale;
      })
      .catch(() => {
        // En cas d'erreur, affiche l'initiale de l'email
        if (user.email) {
          document.getElementById("user-icon").textContent = user.email.charAt(0).toUpperCase();
        } else {
          document.getElementById("user-icon").textContent = "U";
        }
      });
  }
}

function afficherUtilisateurDéconnecté() {
  document.getElementById("user-icon").classList.add("hidden");
  document.getElementById("login-button").classList.remove("hidden");
  document.getElementById("my-stories-button").classList.add("hidden");
}

function genererHistoire() {
  const nom = document.getElementById("nom").value.trim();
  const pers = document.getElementById("personnage").value;
  const lieu = document.getElementById("lieu").value;
  const obj  = document.getElementById("objet").value;
  const cmp  = document.getElementById("compagnon").value;
  const mis  = document.getElementById("mission").value;
  const st   = document.getElementById("style").value;
  const dur  = document.getElementById("duree").value;

  const html = `
    <h3>Chapitre 1 : Le départ</h3>
    <p>${nom}, un jeune ${pers}, vivait paisiblement près de la ${lieu}. On lui confia la mission : ${mis}.</p>
    <div class="illustration-chapitre"><img src="illustration-chevalier-chateau-chapitre-1.jpg" alt=""></div>
    <h3>Chapitre 2 : L'objet magique</h3>
    <p>En explorant, ${nom} découvrit une ${obj} brillante aux pouvoirs mystérieux.</p>
    <div class="illustration-chapitre"><img src="illustration-chevalier-chateau-chapitre-2.jpg" alt=""></div>
    <h3>Chapitre 3 : La rencontre</h3>
    <p>Sur sa route, il rencontra un(e) ${cmp}, et tous deux poursuivirent l’aventure.</p>
    <div class="illustration-chapitre"><img src="illustration-chevalier-chateau-chapitre-3.jpg" alt=""></div>
    <h3>Chapitre 4 : L'aventure</h3>
    <p>Dans un style ${st}, cette histoire ${dur} fut riche en rebondissements.</p>
    <div class="illustration-chapitre"><img src="illustration-chevalier-chateau-chapitre-4.jpg" alt=""></div>
    <h3>Chapitre 5 : La réussite</h3>
    <p>Grâce à son courage, ${nom} réussit à ${mis.toLowerCase()} et revint triomphant.</p>
    <div class="illustration-chapitre"><img src="illustration-chevalier-chateau-chapitre-5.jpg" alt=""></div>
  `;
  document.getElementById("histoire").innerHTML = html;
  resultatSource = "formulaire";
  showScreen("resultat");
}

// Fonction de contrôle de complexité du mot de passe
function isPasswordSecure(password) {
  // Minimum 8 caractères, au moins 1 majuscule, 1 chiffre, 1 caractère spécial
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[!@#$%^&*(),.?":{}|<>]/.test(password)
  );
}

function registerUser() {
  const prenom  = document.getElementById("prenom").value.trim();
  const email   = document.getElementById("signup-email").value.trim();
  const password= document.getElementById("signup-password").value;
  const confirm = document.getElementById("signup-confirm").value;

  if (!prenom || !email || !password || !confirm) {
    showMessageModal("Merci de remplir tous les champs.");
    return;
  }
  if (password !== confirm) {
    showMessageModal("Les mots de passe ne correspondent pas.");
    return;
  }
  if (!isPasswordSecure(password)) {
    showMessageModal("Ton mot de passe doit contenir au moins 8 caractères, une majuscule, un chiffre et un caractère spécial.");
    return;
  }

  // Firebase Auth
  firebase.auth().createUserWithEmailAndPassword(email, password)
    .then((userCredential) => {
      const user = userCredential.user;
      return firebase.firestore().collection("users").doc(user.uid).set({
        prenom: prenom,
        email: email,
        createdAt: new Date().toISOString()
      });
    })
    .then(() => {
      toggleSignup(false); // Ferme le formulaire d'inscription avant d'afficher le message
      showMessageModal("Ton compte a bien été créé ! Tu peux maintenant te connecter.");
    })
    .catch((error) => {
      const msg = firebaseErrorMessages[error.code] || error.message;
      showMessageModal(msg);
    });
}


function toggleSignup(show) {
  document.getElementById("signup-form").style.display = show ? "block" : "none";
  document.getElementById("reset-form").style.display = "none";
}
function toggleReset(show) {
  document.getElementById("reset-form").style.display = show ? "block" : "none";
  document.getElementById("signup-form").style.display = "none";
}
function sendReset() {
  const email = document.getElementById("reset-email").value.trim();
  if (!email) {
    showMessageModal("Veuillez saisir votre adresse email.");
    return;
  }

  firebase.auth().sendPasswordResetEmail(email)
    .then(() => {
      showMessageModal("Lien de réinitialisation envoyé !");
      toggleReset(false);
    })
    .catch((error) => {
      const msg = firebaseErrorMessages[error.code] || error.message;
      showMessageModal(msg);
    });
}

function demanderSauvegarde() {
  const h = JSON.parse(localStorage.getItem("histoires") || "[]");
  if (h.length >= 5) {
    document.getElementById("modal-limite").classList.add("show");
  } else {
    sauvegarderHistoire();
  }
}
function sauvegarderHistoire() {
  const h = JSON.parse(localStorage.getItem("histoires") || "[]");
  h.push({
    titre: "Histoire du " + new Date().toLocaleDateString(),
    contenu: document.getElementById("histoire").innerHTML,
    date: new Date().toISOString()
  });
  localStorage.setItem("histoires", JSON.stringify(h));
  afficherHistoiresSauvegardees();
  showMessageModal("Histoire sauvegardée !");
}

function afficherHistoiresSauvegardees() {
  const ul = document.getElementById("liste-histoires");
  ul.innerHTML = "";
  const h = JSON.parse(localStorage.getItem("histoires") || "[]");
  h.forEach((item, i) => {
    const li = document.createElement("li");
    li.dataset.index = i;
    li.innerHTML = `<button class="button">${item.titre}</button>`;
    ul.appendChild(li);
  });
  bindLongPress();
  mettreAJourBar();
}

function bindLongPress() {
  document.querySelectorAll('#liste-histoires li').forEach(li => {
    const btn = li.querySelector('button');
    let timer = null;

    const start = e => {
      // timer unique pour le long-press (600ms)
      timer = setTimeout(() => {
        // feedback haptique
        if (navigator.vibrate) {
          navigator.vibrate(50);
        }
        // sélection de l’histoire
        li.classList.add("selected");
        mettreAJourBar();
      }, 600);
    };
    const cancel = () => clearTimeout(timer);

   btn.addEventListener('touchstart', (e) => {
  if (navigator.vibrate) navigator.vibrate(10);
  start(e);
});
btn.addEventListener('mousedown', (e) => {
  if (navigator.vibrate) navigator.vibrate(10);
  start(e);
});
    btn.addEventListener('touchend',   cancel);
    btn.addEventListener('mouseup',    cancel);
    btn.addEventListener('mouseleave', cancel);

    btn.addEventListener('click', e => {
      const sec = document.getElementById('mes-histoires');
      if (!sec.classList.contains('selection-mode')) {
        const idx = parseInt(li.dataset.index, 10);
        afficherHistoire(idx);
      } else {
        li.classList.toggle('selected');
        mettreAJourBar();
      }
    });
  });
}

function mettreAJourBar() {
  const sec = document.getElementById("mes-histoires");
  const any = !!document.querySelector("#liste-histoires li.selected");
  document.getElementById("barre-suppression").style.display = any ? "flex" : "none";
  sec.classList.toggle("selection-mode", any);
}

function reinitialiserSelectionHistoires() {
  document.querySelectorAll("#liste-histoires li.selected").forEach(li => li.classList.remove("selected"));
  mettreAJourBar();
}

function afficherHistoire(idx) {
  const h = JSON.parse(localStorage.getItem("histoires") || "[]");
  if (h[idx]) {
    document.getElementById("histoire").innerHTML = h[idx].contenu;
    resultatSource = "mes-histoires";
    showScreen("resultat");
  }
}


function fermerModaleLimite() {
  document.getElementById("modal-limite").classList.remove("show");
}
function validerModaleLimite() {
  document.getElementById("modal-limite").classList.remove("show");
  showScreen("mes-histoires");
}

// Ouvre la modale CSS de confirmation
function supprimerHistoiresSelectionnees() {
  document.getElementById("delete-modal").classList.add("show");
}

// Utilisateur clique "Oui"
function confirmDelete() {
  // 1) Récupère les indices sélectionnés
  const sels = Array.from(document.querySelectorAll("#liste-histoires li.selected"))
    .map(li => parseInt(li.dataset.index, 10));

  // 2) Supprime-les du localStorage
  let h = JSON.parse(localStorage.getItem("histoires") || "[]");
  h = h.filter((_, i) => !sels.includes(i));
  localStorage.setItem("histoires", JSON.stringify(h));

  // 3) Réinitialise la sélection et rafraîchit la liste
  reinitialiserSelectionHistoires();
  afficherHistoiresSauvegardees();

  // 4) Ferme la modale
  document.getElementById("delete-modal").classList.remove("show");

  // 5) Reste bien sur l’écran "mes-histoires"
  showScreen("mes-histoires");
}
function openDeleteAccountModal() {
  document.getElementById('logout-modal').style.display = 'none';
  document.getElementById('delete-account-modal').classList.add('show');
}

function closeDeleteAccountModal() {
  document.getElementById('delete-account-modal').classList.remove('show');
}
function deleteAccount() {
  const user = firebase.auth().currentUser;
  if (!user) {
    showMessageModal("Aucun utilisateur connecté.");
    closeDeleteAccountModal();
    return;
  }

  // Supprime les données Firestore associées (ex: profil)
  firebase.firestore().collection("users").doc(user.uid).delete()
    .catch(() => {}) // Ignore si déjà supprimé ou inexistant
    .finally(() => {
      // Supprime le compte Auth
      user.delete()
        .then(() => {
          closeDeleteAccountModal();
          showMessageModal("Compte supprimé. Au revoir !");
          afficherUtilisateurDéconnecté();
          showScreen("accueil");
        })
        .catch((error) => {
          if (error.code === "auth/requires-recent-login") {
            showMessageModal("Pour des raisons de sécurité, veuillez vous reconnecter puis réessayer la suppression.");
          } else {
            showMessageModal("Erreur lors de la suppression : " + error.message);
          }
          closeDeleteAccountModal();
        });
    });
}

// Utilisateur clique "Non"
function closeDeleteModal() {
  document.getElementById("delete-modal").classList.remove("show");
}
function retourDepuisResultat() {
  if (resultatSource === "mes-histoires") {
    showScreen("mes-histoires");
  } else {
    showScreen("formulaire");
  }
}

