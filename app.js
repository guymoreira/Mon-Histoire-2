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

/**
 * Bascule l’affichage d’une “screen” sans délai ni flash.
 */
function showScreen(id) {
  // on masque tout ce qui était actif
  document.querySelectorAll('.screen.active').forEach(el => el.classList.remove('active'));

  // si on arrive sur Mes Histoires, on rafraîchit la liste et re-bind les événements  
  if (id === 'mes-histoires') {
    afficherHistoiresSauvegardees();
  }

  // on affiche ensuite l’écran demandé
  const next = document.getElementById(id);
  if (next) next.classList.add('active');
}


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
  const pr = document.getElementById("prenom").value.trim();
  const em = document.getElementById("signup-email").value.trim();
  const pw = document.getElementById("signup-password").value;
  const cf = document.getElementById("signup-confirm").value;
  if (!pr || !em || !pw || !cf) { alert("Merci de remplir tous les champs."); return; }
  if (pw !== cf) { alert("Les mots de passe ne correspondent pas."); return; }
  alert("Compte créé (simulation) !");
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
  const em = document.getElementById("reset-email").value.trim();
  if (!em) { alert("Veuillez saisir votre adresse email."); return; }
  alert("Lien de réinitialisation envoyé (simulation)");
  toggleReset(false);
}

function demanderSauvegarde() {
  const h = JSON.parse(localStorage.getItem("histoires") || "[]");
  if (h.length >= 5) {
    document.getElementById("modal-limite").style.display = "block";
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
  alert("Histoire sauvegardée !");
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
      // démarrage du timer pour détecter le long-press
      timer = setTimeout(() => {
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

function supprimerHistoiresSelectionnees() {
  const sels = Array.from(document.querySelectorAll("#liste-histoires li.selected"))
    .map(li => parseInt(li.dataset.index, 10));
  let h = JSON.parse(localStorage.getItem("histoires") || "[]");
  h = h.filter((_, i) => !sels.includes(i));
  localStorage.setItem("histoires", JSON.stringify(h));
  reinitialiserSelectionHistoires();
  afficherHistoiresSauvegardees();
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
function retourDepuisMesHistoires() {
  showScreen("accueil");
}
