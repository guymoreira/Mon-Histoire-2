
document.addEventListener("DOMContentLoaded", () => {
  try {
    if (localStorage.getItem("isLoggedIn") === "true") {
      afficherUtilisateurConnecté();
    } else {
      afficherUtilisateurDéconnecté();
    }
  } catch (e) {
    console.warn("Initialisation échouée :", e);
  }
});

function showScreen(id) {
  document.querySelectorAll(".screen").forEach((el) => {
    el.classList.remove("active");
  });
  document.getElementById(id).classList.add("active");
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
  afficherUtilisateurDéconnecté();
  const modal = document.getElementById("logout-modal");
  if (modal) modal.style.display = "none";
  showScreen("accueil");
}

function afficherUtilisateurConnecté() {
  const icon = document.getElementById("user-icon");
  const loginBtn = document.getElementById("login-button");
  if (icon) icon.style.display = "inline-block";
  if (loginBtn) loginBtn.style.display = "none";
}

function afficherUtilisateurDéconnecté() {
  const icon = document.getElementById("user-icon");
  const loginBtn = document.getElementById("login-button");
  if (icon) icon.style.display = "none";
  if (loginBtn) loginBtn.style.display = "inline-block";
}

function genererHistoire() {
  const nom = document.getElementById("nom").value.trim();
  const personnage = document.getElementById("personnage").value;
  const lieu = document.getElementById("lieu").value;
  const objet = document.getElementById("objet").value;
  const compagnon = document.getElementById("compagnon").value;
  const mission = document.getElementById("mission").value;
  const style = document.getElementById("style").value;
  const duree = document.getElementById("duree").value;

  const texte = `
    <h3>Chapitre 1 : Le départ</h3>
    <p>${nom}, un jeune ${personnage}, vivait paisiblement dans une région proche de la ${lieu}.
    Un jour, une mission importante lui fut confiée : ${mission}.</p>

    <h3>Chapitre 2 : L'objet magique</h3>
    <p>En explorant les environs, ${nom} découvrit une ${objet} brillante. Elle semblait dotée de pouvoirs mystérieux.</p>

    <h3>Chapitre 3 : La rencontre</h3>
    <p>Sur son chemin, ${nom} rencontra un(e) ${compagnon}. Ensemble, ils se mirent en route avec courage et détermination.</p>

    <h3>Chapitre 4 : L'aventure</h3>
    <p>L’histoire se déroula dans un style ${style}, avec des rebondissements captivants et une durée ${duree}.</p>

    <h3>Chapitre 5 : La réussite</h3>
    <p>Grâce à sa bravoure, ${nom} réussit à ${mission.toLowerCase()} et revint triomphant dans son village.</p>
  `;

  document.getElementById("histoire").innerHTML = texte;
  showScreen("resultat");
}
