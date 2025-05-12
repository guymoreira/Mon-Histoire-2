
function showScreen(screenId) {
  const screens = document.querySelectorAll(".ecran");
  screens.forEach(screen => screen.classList.remove("visible"));
  document.getElementById(screenId).classList.add("visible");
}

// Connexion simulée
function seConnecter() {
  const email = document.getElementById("email").value;
  const motDePasse = document.getElementById("motdepasse").value;
  if (email) {
    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("userEmail", email);
    afficherUtilisateurConnecté();
    showScreen("formulaire");
  }
}

function seDeconnecter() {
  localStorage.removeItem("isLoggedIn");
  localStorage.removeItem("userEmail");
  localStorage.removeItem("histoires");
  afficherUtilisateurDéconnecté();
  showScreen("accueil");
}

function afficherUtilisateurConnecté() {
  const email = localStorage.getItem("userEmail") || "";
  document.getElementById("login-button").style.display = "none";
  document.getElementById("my-stories-button").style.display = "inline-block";
  document.getElementById("initiales").innerText = email.charAt(0).toUpperCase();
  document.getElementById("user-icon").style.display = "inline-block";
}

function afficherUtilisateurDéconnecté() {
  document.getElementById("login-button").style.display = "inline-block";
  document.getElementById("my-stories-button").style.display = "none";
  document.getElementById("user-icon").style.display = "none";
}

// Création d'une histoire
function creerHistoire() {
  const nom = document.getElementById("nom").value;
  const genre = document.getElementById("genre").value;
  const univers = document.getElementById("univers").value;

  if (nom && genre && univers) {
    const histoire = {
      titre: "Histoire du " + new Date().toLocaleDateString(),
      contenu: `<h2>Chapitre 1</h2><p>${nom} vivait une aventure dans un univers ${univers}...</p>`
    };

    document.getElementById("histoire").innerHTML = histoire.contenu;
    showScreen("resultat");
  }
}

// Sauvegarde d'une histoire
function sauvegarderHistoire() {
  const contenu = document.getElementById("histoire").innerHTML;
  if (!contenu) return;

  const histoires = JSON.parse(localStorage.getItem("histoires") || "[]");

  const nouvelleHistoire = {
    titre: "Histoire du " + new Date().toLocaleDateString(),
    contenu: contenu
  };

  histoires.unshift(nouvelleHistoire);
  localStorage.setItem("histoires", JSON.stringify(histoires));
  alert("Histoire sauvegardée !");
}

function afficherHistoiresSauvegardees() {
  const liste = document.getElementById("liste-histoires");
  if (!liste) return;
  liste.innerHTML = "";
  const histoires = JSON.parse(localStorage.getItem("histoires") || "[]");

  histoires.forEach((histoire, index) => {
    const li = document.createElement("li");
    li.innerHTML = `<button class="button" onclick="afficherHistoire(${index})">${histoire.titre}</button>`;
    liste.appendChild(li);
  });
}

function afficherHistoire(index) {
  const histoires = JSON.parse(localStorage.getItem("histoires") || "[]");
  const histoire = histoires[index];
  if (histoire) {
    document.getElementById("histoire").innerHTML = histoire.contenu;
    showScreen("resultat");
  }
}

window.onload = () => {
  if (localStorage.getItem("isLoggedIn") === "true") {
    afficherUtilisateurConnecté();
  } else {
    afficherUtilisateurDéconnecté();
  }
  afficherHistoiresSauvegardees();
};
