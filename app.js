
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
  const current = document.querySelector(".screen.active");
  const next = document.getElementById(id);
  if (current && next && current !== next) {
    current.classList.remove("active");
    setTimeout(() => {
      next.classList.add("active");
    }, 50); // courte pause pour activer la transition
  } else if (next) {
    next.classList.add("active");
  }
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


function toggleSignup(show) {
  const loginFields = document.getElementById("login-fields");
  const signupForm = document.getElementById("signup-form");
  if (show) {
    loginFields.style.display = "none";
    signupForm.style.display = "block";
  } else {
    loginFields.style.display = "block";
    signupForm.style.display = "none";
  }
}

function registerUser() {
  const prenom = document.getElementById("prenom").value.trim();
  const email = document.getElementById("signup-email").value.trim();
  const password = document.getElementById("signup-password").value;
  const confirm = document.getElementById("signup-confirm").value;

  if (!prenom || !email || !password || !confirm) {
    alert("Merci de remplir tous les champs.");
    return;
  }
  if (password !== confirm) {
    alert("Les mots de passe ne correspondent pas.");
    return;
  }

  alert("Compte créé avec succès ! (fonctionnalité simulée)");
  toggleSignup(false);
}


function toggleReset(show) {
  const loginFields = document.getElementById("login-fields");
  const signupForm = document.getElementById("signup-form");
  const resetForm = document.getElementById("reset-form");
  if (show) {
    loginFields.style.display = "none";
    signupForm.style.display = "none";
    resetForm.style.display = "block";
  } else {
    loginFields.style.display = "block";
    resetForm.style.display = "none";
  }
}

function sendReset() {
  const email = document.getElementById("reset-email").value.trim();
  if (!email) {
    alert("Veuillez saisir votre adresse email.");
    return;
  }

  alert("Un lien de réinitialisation a été envoyé (simulation).");
  toggleReset(false);
}


function afficherHistoireParDefaut() {
  document.getElementById("histoire").innerHTML = `
    <h3>Chapitre 1 : Le départ</h3>
    <p>Un jeune héros vivait paisiblement dans une région magique.</p>
    <h3>Chapitre 2 : La découverte</h3>
    <p>Il découvrit un objet mystérieux au cœur d'une forêt enchantée.</p>
    <h3>Chapitre 3 : La rencontre</h3>
    <p>Un compagnon fabuleux l'accompagna dans sa quête pleine de surprises.</p>
    <h3>Chapitre 4 : L'aventure</h3>
    <p>Des épreuves, du courage, et une aventure inoubliable l’attendaient.</p>
    <h3>Chapitre 5 : La réussite</h3>
    <p>Grâce à sa bravoure, il accomplit sa mission et rentra triomphant.</p>
  `;
  showScreen("resultat");
}

// Modifier afficherUtilisateurConnecté pour aussi afficher le bouton "Mes Histoires"
function afficherUtilisateurConnecté() {
  const icon = document.getElementById("user-icon");
  const loginBtn = document.getElementById("login-button");
  const storiesBtn = document.getElementById("my-stories-button");
  if (icon) icon.style.display = "inline-block";
  if (loginBtn) loginBtn.style.display = "none";
  if (storiesBtn) storiesBtn.style.display = "inline-block";
}

function afficherUtilisateurDéconnecté() {
  const icon = document.getElementById("user-icon");
  const loginBtn = document.getElementById("login-button");
  const storiesBtn = document.getElementById("my-stories-button");
  if (icon) icon.style.display = "none";
  if (loginBtn) loginBtn.style.display = "inline-block";
  if (storiesBtn) storiesBtn.style.display = "none";
}


function toggleSignup(show) {
  document.getElementById("signup-form").style.display = show ? "block" : "none";
  document.getElementById("reset-form").style.display = "none";
}

function toggleReset(show) {
  document.getElementById("reset-form").style.display = show ? "block" : "none";
  document.getElementById("signup-form").style.display = "none";
}

function registerUser() {
  const prenom = document.getElementById("prenom").value.trim();
  const email = document.getElementById("signup-email").value.trim();
  const password = document.getElementById("signup-password").value;
  const confirm = document.getElementById("signup-confirm").value;

  if (!prenom || !email || !password || !confirm) {
    alert("Merci de remplir tous les champs.");
    return;
  }
  if (password !== confirm) {
    alert("Les mots de passe ne correspondent pas.");
    return;
  }

  alert("Compte créé avec succès ! (simulation)");
  toggleSignup(false);
}

function sendReset() {
  const email = document.getElementById("reset-email").value.trim();
  if (!email) {
    alert("Veuillez saisir votre adresse email.");
    return;
  }

  alert("Un lien de réinitialisation a été envoyé (simulation).");
  toggleReset(false);
}
