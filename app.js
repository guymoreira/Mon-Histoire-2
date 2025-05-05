
let initials = 'GM';

document.addEventListener("DOMContentLoaded", () => {
  document.body.style.display = "block";
  setTimeout(() => {
    document.body.style.opacity = "1";
  }, 10);
  updateInterface();
});

function getCurrentScreen() {
  return document.querySelector(".screen:not(.hidden)");
}

function updateInterface() {
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  const userIcon = document.getElementById("user-icon");
  const logoutModal = document.getElementById("logout-modal");
  const loginBtn = document.getElementById("login-btn");

  if (isLoggedIn) {
    if (loginBtn) loginBtn.style.display = "none";
    if (userIcon) {
      userIcon.textContent = initials;
      userIcon.style.display = "flex";
      userIcon.addEventListener("click", showLogoutModal);
    }
  } else {
    if (loginBtn) loginBtn.style.display = "inline-block";
    if (userIcon) userIcon.style.display = "none";
    if (logoutModal) logoutModal.style.display = "none";
  }
}

function loginUser(event) {
  event.preventDefault();
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const loginBtn = document.getElementById("login-btn");
  const userIcon = document.getElementById("user-icon");
  const creerBtn = document.getElementById("creer-btn");

  if (email && password) {
    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("initials", "GM");

    if (loginBtn) loginBtn.style.display = "none";
    if (userIcon) {
      userIcon.textContent = "GM";
      userIcon.style.display = "flex";
      userIcon.addEventListener("click", showLogoutModal);
    }
    if (creerBtn) creerBtn.style.display = "inline-block";

    showForm();
    updateInterface();
  } else {
    alert("Veuillez remplir tous les champs.");
  }
}

function showForm() {
  const accueil = document.getElementById("accueil");
  const formulaire = document.getElementById("formulaire");
  if (accueil && formulaire) {
    accueil.classList.add("fade-out");
    accueil.addEventListener("animationend", function handler() {
      accueil.removeEventListener("animationend", handler);
      accueil.classList.add("hidden");
      accueil.classList.remove("fade-out");
      formulaire.classList.remove("hidden");
      formulaire.classList.add("fade-in");
    });
  }
}

function showConnexion() {
  const accueil = document.getElementById("accueil");
  const connexion = document.getElementById("connexion");
  if (accueil && connexion) {
    accueil.classList.add("fade-out");
    accueil.addEventListener("animationend", function handler() {
      accueil.removeEventListener("animationend", handler);
      accueil.classList.add("hidden");
      accueil.classList.remove("fade-out");
      connexion.classList.remove("hidden");
      connexion.classList.add("fade-in");
    });
  }
}

function goHome() {
  const current = getCurrentScreen();
  const accueil = document.getElementById("accueil");
  if (current && current !== accueil) {
    current.classList.add("fade-out");
    current.addEventListener("animationend", function handler() {
      current.removeEventListener("animationend", handler);
      current.classList.add("hidden");
      current.classList.remove("fade-out");
      accueil.classList.remove("hidden");
      accueil.classList.add("fade-in");
    });
  }
}

function generateStory() {
  const nom = document.getElementById("nom").value;
  const personnage = document.getElementById("personnage").value;
  const decor = document.getElementById("decor").value;
  const objet = document.getElementById("objet").value;
  const compagnon = document.getElementById("compagnon").value || "compagnon";
  const objectif = document.getElementById("objectif").value;
  const style = document.getElementById("style").value;
  const duree = document.getElementById("duree").value;
  const storyText = `${nom} était un(e) ${personnage} très courageux(se), vivant dans un(e) ${decor}. Un jour, sa mission fut de ${objectif}. Avec son fidèle ${compagnon} et sa ${objet}, ${nom} partit à l’aventure.`;

  document.getElementById("story-container").innerHTML = `<p>${storyText}</p>`;

  const formulaire = document.getElementById("formulaire");
  const resultat = document.getElementById("resultat");

  formulaire.classList.add("fade-out");
  formulaire.addEventListener("animationend", function handler() {
    formulaire.removeEventListener("animationend", handler);
    formulaire.classList.add("hidden");
    formulaire.classList.remove("fade-out");
    resultat.classList.remove("hidden");
    resultat.classList.add("fade-in");
  });
}

function goBackToForm() {
  const resultat = document.getElementById("resultat");
  const formulaire = document.getElementById("formulaire");

  resultat.classList.add("fade-out");
  resultat.addEventListener("animationend", function handler() {
    resultat.removeEventListener("animationend", handler);
    resultat.classList.add("hidden");
    resultat.classList.remove("fade-out");
    formulaire.classList.remove("hidden");
    formulaire.classList.add("fade-in");
  });
}

function logoutUser() {
  localStorage.removeItem("isLoggedIn");
  const accueil = document.getElementById("accueil");
  const formulaire = document.getElementById("formulaire");
  const connexion = document.getElementById("connexion");
  const userIcon = document.getElementById("user-icon");
  const logoutModal = document.getElementById("logout-modal");

  if (formulaire) formulaire.classList.add("hidden");
  if (connexion) connexion.classList.add("hidden");
  if (logoutModal) logoutModal.classList.add("hidden");
  if (userIcon) userIcon.style.display = "none";
  accueil.classList.remove("hidden");
}

function hideLogoutModal() {
  const modal = document.getElementById("logout-modal");
  if (modal) modal.classList.add("hidden");
}

function showLogoutModal() {
  const modal = document.getElementById("logout-modal");
  if (modal) modal.classList.remove("hidden");
}

window.onload = function () {
  if (localStorage.getItem("isLoggedIn") === "true") {
    showForm();
    const userIcon = document.getElementById("user-icon");
    if (userIcon) {
      userIcon.style.display = "inline-block";
      userIcon.addEventListener("click", showLogoutModal);
    }
  }
};
