let initials = "GM";

document.addEventListener("DOMContentLoaded", () => {
  document.body.style.display = "block";
  setTimeout(() => {
    document.body.style.opacity = "1";
  }, 10);
  updateInterface();
});

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

  if (email && password) {
    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("initials", initials);
    updateInterface();
    showForm();
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

function goBackAccueil() {
  const accueil = document.getElementById("accueil");
  const formulaire = document.getElementById("formulaire");
  const connexion = document.getElementById("connexion");

  if (formulaire) formulaire.classList.add("hidden");
  if (connexion) connexion.classList.add("hidden");
  if (accueil) accueil.classList.remove("hidden");
}

function showLogoutModal() {
  const modal = document.getElementById("logout-modal");
  if (modal) modal.classList.remove("hidden");
}

function hideLogoutModal() {
  const modal = document.getElementById("logout-modal");
  if (modal) modal.classList.add("hidden");
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
  if (accueil) accueil.classList.remove("hidden");
}

window.onload = function () {
  if (localStorage.getItem("isLoggedIn") === "true") {
    updateInterface();
    showForm();
  }
};
