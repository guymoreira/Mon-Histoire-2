
document.addEventListener("DOMContentLoaded", () => {
  try {
    if (localStorage.getItem("isLoggedIn") === "true") {
      afficherUtilisateurConnectÃ©();
    } else {
      afficherUtilisateurDÃ©connectÃ©();
    }
  } catch (e) {
    console.warn("Initialisation Ã©chouÃ©e :", e);
  }
});

function showScreen(id) {
  const current = document.querySelector(".screen.active");
  const next = document.getElementById(id);
  if (current && next && current !== next) {
    current.classList.remove("active");
    setTimeout(() => {
      next.classList.add("active");
    }, 50); // courte pause pour activer la transition
  } else if (next) {
    next.classList.add("active");
  }
}

function loginUser() {
  const email = document.getElementById("email");
  const password = document.getElementById("password");

  if (email && password && email.value.trim() && password.value.trim()) {
    localStorage.setItem("isLoggedIn", "true");
    afficherUtilisateurConnecté();
    showScreen("accueil");
  }
}

function logoutUser() {
  localStorage.removeItem("isLoggedIn");
  afficherUtilisateurConnecté();
  showScreen("accueil");
}

function afficherUtilisateurConnecté() {
  const userIcon = document.getElementById("user-icon");
  const loginButton = document.getElementById("login-button");
  const myStoriesButton = document.getElementById("my-stories-button");

  const connected = localStorage.getItem("isLoggedIn") === "true";
  userIcon.style.display = connected ? "inline-block" : "none";
  loginButton.style.display = connected ? "none" : "inline-block";
  myStoriesButton.style.display = connected ? "inline-block" : "none";
}

function toggleCreateAccount() {
  document.getElementById("signup-form").style.display = "block";
  document.getElementById("login-form").style.display = "none";
}

function createAccount() {
  const name = document.getElementById("signup-name").value;
  const email = document.getElementById("signup-email").value;

  if (name && email) {
    localStorage.setItem("userName", name);
    localStorage.setItem("userEmail", email);
    localStorage.setItem("isLoggedIn", "true");
    afficherUtilisateurConnecté();
    showScreen("accueil");
  }
}

function resetPassword() {
  const modal = document.getElementById("reset-modal");
  modal.style.display = "block";
}

function confirmReset() {
  document.getElementById("reset-modal").style.display = "none";
  alert("Un lien de réinitialisation a été envoyé à votre adresse e-mail.");
}

function cancelReset() {
  document.getElementById("reset-modal").style.display = "none";
}

let previousScreen = "accueil";

function showScreen(id) {
  document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
  const cible = document.getElementById(id);
  if (cible) cible.classList.add("active");
  if (id !== "mes-histoires") previousScreen = id;
  if (id === "mes-histoires") afficherHistoiresSauvegardees();
  if (id !== "mes-histoires") reinitialiserSelectionHistoires();
}

function genererHistoire() {
  const nom = document.getElementById("nom").value;
  const personnage = document.getElementById("personnage").value;
  const lieu = document.getElementById("lieu").value;
  const objet = document.getElementById("objet").value;
  const compagnon = document.getElementById("compagnon").value;
  const mission = document.getElementById("mission").value;
  const style = document.getElementById("style").value;
  const duree = document.getElementById("duree").value;

  const texte = `
    <h3>Chapitre 1</h3>
    <p>${nom}, un(e) ${personnage}, vivait dans un(e) ${lieu} magique. Sa mission : ${mission}.</p>
    <div class="illustration-chapitre"><img src="illustration-chapitre-1.jpg" alt="Chapitre 1"></div>
    <h3>Chapitre 2</h3>
    <p>Il trouva une ${objet} et fit équipe avec un(e) ${compagnon}.</p>
    <div class="illustration-chapitre"><img src="illustration-chapitre-2.jpg" alt="Chapitre 2"></div>
    <h3>Chapitre 3</h3>
    <p>Ils vécurent ensemble une aventure pleine de ${style} pendant une durée ${duree}.</p>
    <div class="illustration-chapitre"><img src="illustration-chapitre-3.jpg" alt="Chapitre 3"></div>
  `;

  document.getElementById("histoire").innerHTML = texte;
  showScreen("resultat");
}

function demanderSauvegarde() {
  const histoires = JSON.parse(localStorage.getItem("histoires") || "[]");
  if (histoires.length >= 5) {
    document.getElementById("modal-limite").style.display = "block";
  } else {
    sauvegarderHistoire();
  }
}

function sauvegarderHistoire() {
  const histoires = JSON.parse(localStorage.getItem("histoires") || "[]");
  const contenu = document.getElementById("histoire").innerHTML;
  const titre = "Histoire " + (histoires.length + 1);
  const nouvelle = { titre, contenu, date: new Date().toISOString() };
  histoires.push(nouvelle);
  localStorage.setItem("histoires", JSON.stringify(histoires));
  alert("Histoire sauvegardée !");
  showScreen("accueil");
}

function afficherHistoiresSauvegardees() {
  const liste = document.getElementById("liste-histoires");
  liste.innerHTML = "";
  const histoires = JSON.parse(localStorage.getItem("histoires") || "[]");

  histoires.forEach((histoire, index) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <button class="button" onclick="afficherHistoire(${index})">${histoire.titre}</button>
      <input type="checkbox" value="${index}" onchange="mettreAJourBarreSuppression()">
    `;
    liste.appendChild(li);
  });

  mettreAJourBarreSuppression();
}

function afficherHistoire(index) {
  const histoires = JSON.parse(localStorage.getItem("histoires") || "[]");
  const histoire = histoires[index];
  if (histoire) {
    document.getElementById("histoire").innerHTML = histoire.contenu;
    showScreen("resultat");
  }
}

// Modale “plus de place”
function fermerModaleLimite() {
  document.getElementById("modal-limite").style.display = "none";
}

function validerModaleLimite() {
  document.getElementById("modal-limite").style.display = "none";
  showScreen("mes-histoires");
}

// Retour contextuel
function retourDepuisMesHistoires() {
  if (previousScreen === "resultat") {
    showScreen("resultat");
  } else {
    showScreen("accueil");
  }
}

function mettreAJourBarreSuppression() {
  const checkboxes = document.querySelectorAll("#liste-histoires input[type='checkbox']");
  const visible = Array.from(checkboxes).some(cb => cb.checked);
  document.getElementById("btn-corbeille").style.display = visible ? "inline-block" : "none";
  document.getElementById("btn-annuler-selection").style.display = visible ? "inline-block" : "none";
}

function supprimerHistoiresSelectionnees() {
  const checkboxes = document.querySelectorAll("#liste-histoires input[type='checkbox']:checked");
  const indices = Array.from(checkboxes).map(cb => parseInt(cb.value));

  let histoires = JSON.parse(localStorage.getItem("histoires") || "[]");
  histoires = histoires.filter((_, i) => !indices.includes(i));
  localStorage.setItem("histoires", JSON.stringify(histoires));

  afficherHistoiresSauvegardees();
  reinitialiserSelectionHistoires();
}

function toutSelectionner(source) {
  const checkboxes = document.querySelectorAll("#liste-histoires input[type='checkbox']");
  checkboxes.forEach(cb => cb.checked = source.checked);
  mettreAJourBarreSuppression();
}

function reinitialiserSelectionHistoires() {
  const checkboxes = document.querySelectorAll("#liste-histoires input[type='checkbox']");
  checkboxes.forEach(cb => cb.checked = false);
  const tout = document.getElementById("tout-selectionner");
  if (tout) tout.checked = false;
  mettreAJourBarreSuppression();
}

// Réinitialisation du mot de passe (modale déjà dans index.html)
function resetPassword() {
  const modal = document.getElementById("reset-modal");
  modal.style.display = "block";
}

function confirmReset() {
  document.getElementById("reset-modal").style.display = "none";
  alert("Un lien de réinitialisation a été envoyé (simulé)");
}

function cancelReset() {
  document.getElementById("reset-modal").style.display = "none";
}

// === Initialisation ===
window.onload = () => {
  afficherUtilisateurConnecté();
  afficherHistoiresSauvegardees();
};

