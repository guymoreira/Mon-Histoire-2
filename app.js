// app.js
window.addEventListener("DOMContentLoaded", () => {
  try {
    if (localStorage.getItem("isLoggedIn") === "true") {
      afficherUtilisateurConnecté();
    } else {
      afficherUtilisateurDéconnecté();
    }
  } catch (e) {
    console.warn("Initialisation échouée :", e);
  }
  afficherHistoiresSauvegardees();
  bindLongPress();
});

function showScreen(id) {
  const current = document.querySelector(".screen.active");
  const next = document.getElementById(id);
  if (current && next && current !== next) {
    current.classList.remove("active");
    setTimeout(() => next.classList.add("active"), 50);
  } else if (next) {
    next.classList.add("active");
  }
}

function loginUser() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  if (email && password) {
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
  const nom        = document.getElementById("nom").value.trim();
  const personnage = document.getElementById("personnage").value;
  const lieu       = document.getElementById("lieu").value;
  const objet      = document.getElementById("objet").value;
  const compagnon  = document.getElementById("compagnon").value;
  const mission    = document.getElementById("mission").value;
  const style      = document.getElementById("style").value;
  const duree      = document.getElementById("duree").value;

  const texte = `
    <h3>Chapitre 1 : Le départ</h3>
    <p>${nom}, un jeune ${personnage}, vivait paisiblement près de la ${lieu}. Un jour, on lui confia la mission : ${mission}.</p>
    <div class="illustration-chapitre"><img src="illustration-chevalier-chateau-chapitre-1.jpg" alt=""></div>
    <h3>Chapitre 2 : L'objet magique</h3>
    <p>En explorant, ${nom} découvrit une ${objet} brillante aux pouvoirs mystérieux.</p>
    <div class="illustration-chapitre"><img src="illustration-chevalier-chateau-chapitre-2.jpg" alt=""></div>
    <h3>Chapitre 3 : La rencontre</h3>
    <p>Sur sa route, il rencontra un(e) ${compagnon}, et tous deux poursuivirent l’aventure.</p>
    <div class="illustration-chapitre"><img src="illustration-chevalier-chateau-chapitre-3.jpg" alt=""></div>
    <h3>Chapitre 4 : L'aventure</h3>
    <p>L’histoire, dans un style ${style}, dura ${duree} et fut remplie de rebondissements.</p>
    <div class="illustration-chapitre"><img src="illustration-chevalier-chateau-chapitre-4.jpg" alt=""></div>
    <h3>Chapitre 5 : La réussite</h3>
    <p>Grâce à son courage, ${nom} réussit à ${mission.toLowerCase()} et revint triomphant.</p>
    <div class="illustration-chapitre"><img src="illustration-chevalier-chateau-chapitre-5.jpg" alt=""></div>
  `;
  document.getElementById("histoire").innerHTML = texte;
  showScreen("resultat");
}

function registerUser() {
  const prenom  = document.getElementById("prenom").value.trim();
  const email   = document.getElementById("signup-email").value.trim();
  const pwd     = document.getElementById("signup-password").value;
  const confirm = document.getElementById("signup-confirm").value;
  if (!prenom || !email || !pwd || !confirm) {
    alert("Merci de remplir tous les champs.");
    return;
  }
  if (pwd !== confirm) {
    alert("Les mots de passe ne correspondent pas.");
    return;
  }
  alert("Compte créé avec succès ! (simulation)");
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
    alert("Veuillez saisir votre adresse email.");
    return;
  }
  alert("Lien de réinitialisation envoyé ! (simulation)");
  toggleReset(false);
}

function demanderSauvegarde() {
  const his = JSON.parse(localStorage.getItem("histoires") || "[]");
  if (his.length >= 5) {
    document.getElementById("modal-limite").style.display = "block";
  } else {
    sauvegarderHistoire();
  }
}

function sauvegarderHistoire() {
  const histos = JSON.parse(localStorage.getItem("histoires") || "[]");
  const contenu = document.getElementById("histoire").innerHTML;
  histos.push({
    titre: "Histoire du " + new Date().toLocaleDateString(),
    contenu,
    date: new Date().toISOString()
  });
  localStorage.setItem("histoires", JSON.stringify(histos));
  afficherHistoiresSauvegardees();
  alert("Histoire sauvegardée !");
}

function supprimerHistoiresSelectionnees() {
  const checked = Array.from(document.querySelectorAll("#liste-histoires input[type='checkbox']:checked"))
    .map(cb => parseInt(cb.value, 10));
  let his = JSON.parse(localStorage.getItem("histoires") || "[]");
  his = his.filter((_, i) => !checked.includes(i));
  localStorage.setItem("histoires", JSON.stringify(his));
  reinitialiserSelectionHistoires();
  afficherHistoiresSauvegardees();
}

function toutSelectionner(source) {
  document.querySelectorAll('#liste-histoires input[type="checkbox"]').forEach(cb => cb.checked = source.checked);
  mettreAJourBarreSuppression();
}

function mettreAJourBarreSuppression() {
  const any = Array.from(document.querySelectorAll('#liste-histoires input[type="checkbox"]')).some(cb => cb.checked);
  const bar = document.getElementById('barre-suppression');
  const sec = document.getElementById('mes-histoires');
  if (any) {
    bar.style.display = 'flex';
    sec.classList.add('selection-mode');
  } else {
    bar.style.display = 'none';
    sec.classList.remove('selection-mode');
  }
}

function reinitialiserSelectionHistoires() {
  document.querySelectorAll('#liste-histoires input[type="checkbox"]').forEach(cb => cb.checked = false);
  const selAll = document.getElementById('tout-selectionner');
  if (selAll) selAll.checked = false;
  mettreAJourBarreSuppression();
}

function bindLongPress() {
  document.querySelectorAll('#liste-histoires li').forEach(li => {
    const btn = li.querySelector('button');
    const cb  = li.querySelector('input[type="checkbox"]');
    let timer = null;

    const start = e => {
      e.preventDefault();
      timer = setTimeout(() => {
        cb.checked = true;
        mettreAJourBarreSuppression();
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
        afficherHistoire(parseInt(cb.value, 10));
      }
    });
  });
}

function afficherHistoiresSauvegardees() {
  const liste = document.getElementById("liste-histoires");
  liste.innerHTML = "";
  const histoires = JSON.parse(localStorage.getItem("histoires") || "[]");
  histoires.forEach((h, i) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <button class="button">${h.titre}</button>
      <input type="checkbox" value="${i}">
    `;
    liste.appendChild(li);
  });
  bindLongPress();
  mettreAJourBarreSuppression();
}

function afficherHistoire(index) {
  const his = JSON.parse(localStorage.getItem("histoires") || "[]");
  if (his[index]) {
    document.getElementById("histoire").innerHTML = his[index].contenu;
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
