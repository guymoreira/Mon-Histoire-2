// app.js
window.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("isLoggedIn") === "true") {
    afficherUtilisateurConnecté();
  } else {
    afficherUtilisateurDéconnecté();
  }
  afficherHistoiresSauvegardees();
  bindLongPress();
});


// Affiche le modal générique avec un message
function showMessageModal(message) {
  document.getElementById("message-modal-text").textContent = message;
  document.getElementById("message-modal").style.display = "flex";
}

// Ferme le modal lorsque l'utilisateur clique sur OK
function closeMessageModal() {
  document.getElementById("message-modal").style.display = "none";
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
    btn.style.display = localStorage.getItem("isLoggedIn") === "true"
      ? "inline-block"
      : "none";
  }

  // cas particulier : si c’est Mes Histoires, on rafraîchit la liste
  if (screen === "mes-histoires") {
    afficherHistoiresSauvegardees();
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
  const e = document.getElementById("email").value.trim();
  const p = document.getElementById("password").value.trim();
  if (e && p) {
    localStorage.setItem("isLoggedIn", "true");
    afficherUtilisateurConnecté();
    showScreen("accueil");
  }
}

function logoutUser() {
  localStorage.setItem("isLoggedIn", "false");
  localStorage.removeItem("histoires");
  afficherUtilisateurDéconnecté();
  document.getElementById("logout-modal").style.display = "none";
  showScreen("accueil");
}

function afficherUtilisateurConnecté() {
  document.getElementById("user-icon").style.display = "inline-block";
  document.getElementById("login-button").style.display = "none";
  document.getElementById("my-stories-button").style.display = "inline-block";
}
function afficherUtilisateurDéconnecté() {
  document.getElementById("user-icon").style.display = "none";
  document.getElementById("login-button").style.display = "inline-block";
  document.getElementById("my-stories-button").style.display = "none";
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
  showScreen("resultat");
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

    showMessageModal("Compte créé (simulation) !");
  toggleSignup(false);
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

  showMessageModal("Lien de réinitialisation envoyé !");
  toggleReset(false);
}

function demanderSauvegarde() {
  const h = JSON.parse(localStorage.getItem("histoires") || "[]");
  if (h.length >= 5) {
    document.getElementById("modal-limite").style.display = "flex";
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

    btn.addEventListener('touchstart', start);
    btn.addEventListener('mousedown',  start);
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
    showScreen("resultat");
  }
}

function fermerModaleLimite() {
  document.getElementById("modal-limite").style.display = "none";
}
function validerModaleLimite() {
  document.getElementById("modal-limite").style.display = "none";
  showScreen("mes-histoires");
}

// Ouvre la modale CSS de confirmation
function supprimerHistoiresSelectionnees() {
  document.getElementById("delete-modal").style.display = "flex";
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
  document.getElementById("delete-modal").style.display = "none";

  // 5) Reste bien sur l’écran "mes-histoires"
  showScreen("mes-histoires");
}

// Utilisateur clique "Non"
function closeDeleteModal() {
  document.getElementById("delete-modal").style.display = "none";
}

