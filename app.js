
let initials = "GM";

document.addEventListener("DOMContentLoaded", () => {
  bindEvents();
  if (localStorage.getItem("isLoggedIn") === "true") {
    updateInterface();
    goHome();
  } else {
    resetToHome();
  }
});

function bindEvents() {
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
  document.getElementById("login-form")?.addEventListener("submit", loginUser);
  document.getElementById("cancel-login-btn")?.addEventListener("click", resetToHome);
}

function updateInterface() {
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  const userIcon = document.getElementById("user-icon");
  const loginBtn = document.getElementById("login-btn");
  const logoutModal = document.getElementById("logout-modal");

  if (isLoggedIn) {
    loginBtn?.classList.add("hidden");
    userIcon.textContent = initials;
    userIcon.style.display = "flex";
    userIcon.removeEventListener("click", showLogoutModal);
    userIcon.addEventListener("click", showLogoutModal);
  } else {
    loginBtn?.classList.remove("hidden");
    if (userIcon) userIcon.style.display = "none";
    logoutModal?.classList.add("hidden");
  }
}
    userIcon.style.display = "none";
    logoutModal?.classList.add("hidden");
  }
}

function loginUser(e) {
  e.preventDefault();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if (email && password) {
    localStorage.setItem("isLoggedIn", "true");
    updateInterface();
    goHome();
  } else {
    alert("Veuillez remplir tous les champs.");
  }
}

function logoutUser() {
  localStorage.removeItem("isLoggedIn");
  updateInterface();
  resetToHome();
}

function resetToHome() {
  showScreen("accueil");
}

function showConnexion() {
  showScreen("connexion");
}

function showForm() {
  showScreen("formulaire");
}

function goHome() {
  showScreen("accueil");
}

function goBackToForm() {
  showScreen("formulaire");
}

function showLogoutModal() {
  document.getElementById("logout-modal")?.classList.remove("hidden");
}
function hideLogoutModal() {
  document.getElementById("logout-modal")?.classList.add("hidden");
}

function showScreen(id) {
  const allScreens = document.querySelectorAll(".screen");
  allScreens.forEach((screen) => screen.classList.add("hidden"));

  const target = document.getElementById(id);
  if (target) {
    target.classList.remove("hidden");
    target.classList.add("fade-in");
  }
}

function generateStory() {
  const nom = document.getElementById("nom")?.value;
  const personnage = document.getElementById("personnage")?.value;
  const decor = document.getElementById("decor")?.value;
  const objet = document.getElementById("objet")?.value;
  const compagnon = document.getElementById("compagnon")?.value || "compagnon";
  const objectif = document.getElementById("objectif")?.value;

  const storyText = `${nom} Ã©tait un(e) ${personnage} trÃ¨s courageux(se), vivant dans un(e) ${decor}. Un jour, sa mission fut de ${objectif}. Avec son fidÃ¨le ${compagnon} et sa ${objet}, ${nom} partit Ã  lâ€™aventure.`;

  document.getElementById("story-container").innerHTML = `<p>${storyText}</p>`;
  showScreen("resultat");
}
