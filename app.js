
document.addEventListener("DOMContentLoaded", () => {
  bindEvents();
  if (localStorage.getItem("isLoggedIn") === "true") {
    showUserUI();
  }
});

function bindEvents() {
  document.getElementById("btn-creer").addEventListener("click", () => showScreen("formulaire"));
  document.getElementById("login-btn").addEventListener("click", loginUser);
  document.getElementById("btn-accueil-form").addEventListener("click", () => showScreen("accueil"));
  document.getElementById("btn-retour-resultat").addEventListener("click", () => showScreen("formulaire"));
  document.getElementById("btn-accueil-resultat").addEventListener("click", () => showScreen("accueil"));
  document.getElementById("logout-btn").addEventListener("click", logoutUser);
  document.getElementById("logout-cancel-btn").addEventListener("click", hideLogoutModal);
  document.getElementById("user-icon").addEventListener("click", showLogoutModal);
  document.getElementById("story-form").addEventListener("submit", createStory);
}

function showScreen(id) {
  document.querySelectorAll(".screen").forEach(el => el.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

function loginUser() {
  localStorage.setItem("isLoggedIn", "true");
  showUserUI();
}

function logoutUser() {
  localStorage.removeItem("isLoggedIn");
  document.getElementById("user-icon").style.display = "none";
  hideLogoutModal();
}

function showUserUI() {
  document.getElementById("user-icon").style.display = "inline-flex";
}

function showLogoutModal() {
  document.getElementById("logout-modal").style.display = "block";
}

function hideLogoutModal() {
  document.getElementById("logout-modal").style.display = "none";
}

function createStory(e) {
  e.preventDefault();
  const name = document.getElementById("prenom").value;
  const theme = document.getElementById("univers").value;
  const story = `Il était une fois un héros nommé ${name} dans l'univers ${theme}.`;
  document.getElementById("story-output").textContent = story;
  document.getElementById("story-image").src = "illustration-resultat.jpg";
  showScreen("resultat");
}
