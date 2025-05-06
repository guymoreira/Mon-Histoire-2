let initials = "GM";

document.addEventListener("DOMContentLoaded", () => {
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  updateInterface();

  // Écouteurs globaux
  document.getElementById("btn-creer")?.addEventListener("click", showForm);
  document.getElementById("login-btn")?.addEventListener("click", showConnexion);
  document.getElementById("btn-accueil-form")?.addEventListener("click", goHome);
  document.getElementById("btn-accueil-resultat")?.addEventListener("click", goHome);
  document.getElementById("btn-retour-resultat")?.addEventListener("click", goBackToForm);
  document.getElementById("logout-btn")?.addEventListener("click", logoutUser);
  document.getElementById("logout-cancel-btn")?.addEventListener("click", hideLogoutModal);
  document.getElementById("user-icon")?.addEventListener("click", showLogoutModal);
  document.getElementById("story-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    generateStory();
  });

  if (isLoggedIn) showForm();
});

function updateInterface() {
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  const userIcon = document.getElementById("user-icon");
  const loginBtn = document.getElementById("login-btn");
  const logoutModal = document.getElementById("logout-modal");

  if (isLoggedIn) {
    loginBtn?.classList.add("hidden");
    userIcon.textContent = initials;
    userIcon.style.display = "flex";
  } else {
    loginBtn?.classList.remove("hidden");
    userIcon.style.display = "none";
    logoutModal?.classList.add("hidden");
  }
}

function loginUser(e) {
  e.preventDefault();
  const email = document.getElementById("email")?.value.trim();
  const password = document.getElementById("password")?.value.trim();
  if (email && password) {
    localStorage.setItem("isLoggedIn", "true");
    updateInterface();
    showForm();
  } else {
    alert("Veuillez remplir tous les champs.");
  }
}

function logoutUser() {
  localStorage.removeItem("isLoggedIn");
  updateInterface();
  goHome();
}

function showLogoutModal() {
  document.getElementById("logout-modal")?.classList.remove("hidden");
}
function hideLogoutModal() {
  document.getElementById("logout-modal")?.classList.add("hidden");
}

function showForm() {
  switchScreen("accueil", "formulaire");
}

function showConnexion() {
  switchScreen("accueil", "connexion");
}

function goHome() {
  const current = getCurrentScreen();
  switchScreen(current.id, "accueil");
}

function goBackToForm() {
  switchScreen("resultat", "formulaire");
}

function switchScreen(fromId, toId) {
  const from = document.getElementById(fromId);
  const to = document.getElementById(toId);
  from?.classList.add("fade-out");
  from?.addEventListener("animationend", function handler() {
    from.removeEventListener("animationend", handler);
    from.classList.add("hidden");
    from.classList.remove("fade-out");
    to?.classList.remove("hidden");
    to?.classList.add("fade-in");
  });
}

function getCurrentScreen() {
  return document.querySelector(".screen:not(.hidden)");
}

function generateStory() {
  const nom = document.getElementById("nom")?.value;
  const personnage = document.getElementById("personnage")?.value;
  const decor = document.getElementById("decor")?.value;
  const objet = document.getElementById("objet")?.value;
  const compagnon = document.getElementById("compagnon")?.value || "compagnon";
  const objectif = document.getElementById("objectif")?.value;

  const storyText = `${nom} était un(e) ${personnage} très courageux(se), vivant dans un(e) ${decor}. Un jour, sa mission fut de ${objectif}. Avec son fidèle ${compagnon} et sa ${objet}, ${nom} partit à l’aventure.`;

  document.getElementById("story-container").innerHTML = `<p>${storyText}</p>`;
  switchScreen("formulaire", "resultat");
}