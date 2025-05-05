
let initials = 'GM';

document.addEventListener("DOMContentLoaded", () => {
  document.body.style.display = "block";
  setTimeout(() => {
    document.body.style.opacity = "1";
  }, 10);

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

  updateInterface();
});

function getCurrentScreen() {
  return document.querySelector(".screen:not(.hidden)");
}

function updateInterface() {
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  const userIcon = document.getElementById("user-icon");
  const loginBtn = document.getElementById("login-btn");
  const logoutModal = document.getElementById("logout-modal");

  if (isLoggedIn) {
    if (loginBtn) loginBtn.style.display = "none";
    if (userIcon) {
      userIcon.textContent = initials;
      userIcon.style.display = "flex";
      userIcon.removeEventListener("click", showLogoutModal);
      userIcon.addEventListener("click", showLogoutModal);
    }
  } else {
    if (loginBtn) loginBtn.style.display = "inline-block";
    if (userIcon) userIcon.style.display = "none";
    if (logoutModal) logoutModal.style.display = "none";
  }
}
    if (loginBtn) loginBtn.style.display = "inline-block";
    if (userIcon) userIcon.style.display = "none";
    if (logoutModal) logoutModal.style.display = "none";
  }
}

function loginUser(event) {
  event.preventDefault();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if (email && password) {
    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("initials", initials);
    updateInterface();
    goHome();
    document.getElementById("user-icon")?.addEventListener("click", showLogoutModal);
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

function generateStory() {
  const nom = document.getElementById("nom").value;
  const personnage = document.getElementById("personnage").value;
  const decor = document.getElementById("decor").value;
  const objet = document.getElementById("objet").value;
  const compagnon = document.getElementById("compagnon").value || "compagnon";
  const objectif = document.getElementById("objectif").value;
  const style = document.getElementById("style").value;
  const duree = document.getElementById("duree").value;

  const storyText = `${nom} Ã©tait un(e) ${personnage} trÃ¨s courageux(se), vivant dans un(e) ${decor}. Un jour, sa mission fut de ${objectif}. Avec son fidÃ¨le ${compagnon} et sa ${objet}, ${nom} partit Ã  lâ€™aventure.`;

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

function logoutUser() {
  localStorage.removeItem("isLoggedIn");
  updateInterface();
  goHome();
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
    updateInterface();
  }
};
