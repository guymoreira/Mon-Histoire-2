document.addEventListener("DOMContentLoaded", function () {
  const loginButton = document.getElementById("login-button");
  const userIcon = document.getElementById("user-icon");
  const logoutModal = document.getElementById("logout-modal");

  const isLoggedIn = localStorage.getItem("loggedIn") === "true";
  const initials = localStorage.getItem("initiales") || "";

  if (isLoggedIn) {
    if (loginButton) loginButton.style.display = "none";
    if (userIcon) {
      userIcon.style.display = "flex";
      userIcon.textContent = initials;
      userIcon.addEventListener("click", () => {
        if (logoutModal) logoutModal.style.display = "block";
      });
    }
  } else {
    if (userIcon) userIcon.style.display = "none";
    if (logoutModal) logoutModal.style.display = "none";
  }

  if (logoutModal) {
    logoutModal.addEventListener("click", (e) => {
      if (e.target === logoutModal) {
        logoutModal.style.display = "none";
      }
    });
  }
});

function logout() {
  localStorage.removeItem("loggedIn");
  localStorage.removeItem("initiales");
  window.location.href = "index.html";
}

// === GESTION DE L’INTERFACE ===

function showForm() {
  document.getElementById("accueil").classList.add("hidden");
  document.getElementById("formulaire").classList.remove("hidden");
}

function goHome() {
  document.querySelectorAll(".screen").forEach((el) => el.classList.add("hidden"));
  document.getElementById("accueil").classList.remove("hidden");
}

// === GÉNÉRATION DE L’HISTOIRE ===

function generateStory() {
  const name = document.getElementById("name").value;
  const type = document.getElementById("type").value;
  const setting = document.getElementById("setting").value;
  const object = document.getElementById("object").value;
  const companion = document.getElementById("companion").value;
  const goal = document.getElementById("goal").value;

  const title = `${name} le ${type.toLowerCase()}`;
  const text = `${name} était un(e) ${type.toLowerCase()} très courageux(se) vivant dans ${setting.toLowerCase()}.
Un jour, il/elle reçut une mission importante : ${goal.toLowerCase()}.
Armé(e) de sa ${object.toLowerCase()} et accompagné(e) de son fidèle ${companion.toLowerCase()},
${name} partit à l’aventure…`;

  document.getElementById("story-title").innerText = title;
  document.getElementById("story-text").innerText = text;

  document.getElementById("formulaire").classList.add("hidden");
  document.getElementById("resultat").classList.remove("hidden");
}
