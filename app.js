function showForm() {
  document.getElementById('accueil').classList.add('hidden');
  document.getElementById('formulaire').classList.remove('hidden');
}

function goHome() {
  document.querySelectorAll('.screen').forEach(el => el.classList.add('hidden'));
  document.getElementById('accueil').classList.remove('hidden');
}

function generateStory() {
  const name = document.getElementById('name').value;
  const type = document.getElementById('type').value;
  const setting = document.getElementById('setting').value;
  const object = document.getElementById('object').value;
  const companion = document.getElementById('companion').value;
  const goal = document.getElementById('goal').value;

  const title = `${name} le ${type.toLowerCase()}`;

  const text = `${name} était un(e) ${type.toLowerCase()} très courageux(se) vivant dans ${setting.toLowerCase()}.
Un jour, un appel magique le/la poussa à accomplir une mission très importante : ${goal.toLowerCase()}.

Avec son fidèle ${companion.toLowerCase()} et sa ${object.toLowerCase()} en main, ${name} quitta son foyer. 
La route fut longue et semée d'embûches...

Finalement, il/elle réussit sa mission !`;

  document.getElementById('story-title').innerText = title;
  document.getElementById('story-text').innerText = text;

  document.getElementById('formulaire').classList.add('hidden');
  document.getElementById('resultat').classList.remove('hidden');
}

// Gestion connexion / déconnexion
document.addEventListener("DOMContentLoaded", function () {
  const isLoggedIn = localStorage.getItem("loggedIn") === "true";
  const loginBtn = document.getElementById("login-button");
  const userIcon = document.getElementById("user-icon");
  const logoutModal = document.getElementById("logout-modal");
  const initials = localStorage.getItem("initiales") || "";

  if (isLoggedIn) {
    if (loginBtn) loginBtn.style.display = "none";
    if (userIcon) {
      userIcon.style.display = "flex";
      userIcon.textContent = initials;
      userIcon.addEventListener("click", function () {
        if (logoutModal) logoutModal.style.display = "block";
      });
    }
  } else {
    if (loginBtn) loginBtn.style.display = "inline-block";
    if (userIcon) userIcon.style.display = "none";
    if (logoutModal) logoutModal.style.display = "none";
  }
});

function logout() {
  localStorage.removeItem("loggedIn");
  localStorage.removeItem("initiales");
  window.location.href = "index.html";
}
