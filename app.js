
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
  localStorage.setItem("isLoggedIn", "false");
  localStorage.removeItem("histoires");
  afficherUtilisateurDéconnecté();
  const modal = document.getElementById("logout-modal");
  if (modal) modal.style.display = "none";
  showScreen("accueil");
  window.location.reload();
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
    <div class="illustration-chapitre">
      <img src="illustration-chevalier-chateau-chapitre-1.jpg" alt="Illustration chapitre 1">
    </div>

    <h3>Chapitre 2 : L'objet magique</h3>
    <p>En explorant les environs, ${nom} découvrit une ${objet} brillante. Elle semblait dotée de pouvoirs mystérieux.</p>
    <div class="illustration-chapitre">
      <img src="illustration-chevalier-chateau-chapitre-2.jpg" alt="Illustration chapitre 2">
    </div>

    <h3>Chapitre 3 : La rencontre</h3>
    <p>Sur son chemin, ${nom} rencontra un(e) ${compagnon}. Ensemble, ils se mirent en route avec courage et détermination.</p>
    <div class="illustration-chapitre">
      <img src="illustration-chevalier-chateau-chapitre-3.jpg" alt="Illustration chapitre 3">
    </div>

    <h3>Chapitre 4 : L'aventure</h3>
    <p>L’histoire se déroula dans un style ${style}, avec des rebondissements captivants et une durée ${duree}.</p>
    <div class="illustration-chapitre">
      <img src="illustration-chevalier-chateau-chapitre-4.jpg" alt="Illustration chapitre 4">
    </div>

    <h3>Chapitre 5 : La réussite</h3>
    <p>Grâce à sa bravoure, ${nom} réussit à ${mission.toLowerCase()} et revint triomphant dans son village.</p>
    <div class="illustration-chapitre">
      <img src="illustration-chevalier-chateau-chapitre-5.jpg" alt="Illustration chapitre 5">
    </div>
  `;

  document.getElementById("histoire").innerHTML = texte;
  showScreen("resultat");
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


// Confirmation avant sauvegarde
function demanderSauvegarde() {
  const histoires = JSON.parse(localStorage.getItem("histoires") || "[]");
  if (histoires.length >= 5) {
    document.getElementById("modal-limite").style.display = "block";
  } else {
    sauvegarderHistoire();
  }
}

// Sauvegarde locale simulée avec limite à 10
function sauvegarderHistoire() {
  const histoires = JSON.parse(localStorage.getItem("histoires") || "[]");
  if (histoires.length >= 10) {
    afficherGestionSuppression();
    return;
  }
  const contenu = document.getElementById("histoire").innerHTML;
  const histoire = {
    titre: "Histoire du " + new Date().toLocaleDateString(),
    contenu: contenu,
    date: new Date().toISOString()
  };
  histoires.push(histoire);
  localStorage.setItem("histoires", JSON.stringify(histoires));
  afficherHistoiresSauvegardees();
  alert("Histoire sauvegardée !");

}

// Afficher une page temporaire pour supprimer des histoires
function afficherGestionSuppression() {
  const container = document.getElementById("liste-histoires");
  container.innerHTML = "";

  const histoires = JSON.parse(localStorage.getItem("histoires") || "[]");

  histoires.forEach((histoire, index) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <label style="display:flex; align-items:center; gap:0.5rem;">
        <input type="checkbox" value="${index}">
        <span>${histoire.titre}</span>
      </label>
    `;
    container.appendChild(li);
  });

  const boutonSupp = document.createElement("button");
  boutonSupp.className = "button";
  boutonSupp.textContent = "";
  boutonSupp.onclick = supprimerHistoiresSelectionnees;

  container.appendChild(boutonSupp);
  showScreen("mes-histoires");
}

function supprimerHistoiresSelectionnees() {
  const checkboxes = document.querySelectorAll("#liste-histoires input[type='checkbox']:checked");
  const indicesASupprimer = Array.from(checkboxes).map(cb => parseInt(cb.value));
  let histoires = JSON.parse(localStorage.getItem("histoires") || "[]");

  histoires = histoires.filter((_, i) => !indicesASupprimer.includes(i));
  localStorage.setItem("histoires", JSON.stringify(histoires));
  alert("Histoires supprimées. Vous pouvez réessayer de sauvegarder.");
  showScreen("formulaire");
}

// Affiche ou masque la corbeille et la croix rouge en fonction de la sélection
function mettreAJourBarreSuppression() {
  const checkboxes = document.querySelectorAll('#liste-histoires input[type="checkbox"]');
  const selectionnee = Array.from(checkboxes).some(cb => cb.checked);
  document.getElementById('barre-suppression').style.display = selectionnee ? 'flex' : 'none';
}

// Cocher/Décocher toutes les histoires
function toutSelectionner(source) {
  const checkboxes = document.querySelectorAll('#liste-histoires input[type="checkbox"]');
  checkboxes.forEach(cb => cb.checked = source.checked);
  mettreAJourBarreSuppression();
}

// Réinitialise la sélection en quittant la page
function reinitialiserSelectionHistoires() {
  const checkboxes = document.querySelectorAll('#liste-histoires input[type="checkbox"]');
  checkboxes.forEach(cb => cb.checked = false);
  const selectAll = document.getElementById('tout-selectionner');
  if (selectAll) selectAll.checked = false;
  mettreAJourBarreSuppression();
}

// Quand on quitte la page des histoires
function showScreen(nouvelEcran) {
  const anciens = document.querySelectorAll('.screen.active');
  anciens.forEach(section => section.classList.remove('active'));

  const cible = document.getElementById(nouvelEcran);
  if (cible) {
    cible.classList.add('active');

    // réinitialiser sélection si on quitte la page des histoires
    if (nouvelEcran !== 'mes-histoires') {
      reinitialiserSelectionHistoires();
    }
  }
}

// Réagir quand on clique sur une case histoire
document.addEventListener("change", function (e) {
  if (e.target.matches('#liste-histoires input[type="checkbox"]')) {
    mettreAJourBarreSuppression();
  }
});

function fermerModaleLimite() {
  document.getElementById("modal-limite").style.display = "none";
}

function validerModaleLimite() {
  document.getElementById("modal-limite").style.display = "none";
  showScreen("mes-histoires");
}

function retourDepuisMesHistoires() {
  showScreen("accueil");
}



// Initialisation au chargement de la page

function afficherHistoiresSauvegardees() {
  const liste = document.getElementById("liste-histoires");
  if (!liste) return;
  liste.innerHTML = "";
  const histoires = JSON.parse(localStorage.getItem("histoires") || "[]");
  histoires.forEach((histoire, index) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <button class="button" onclick="afficherHistoire(${index})">${histoire.titre}</button>
      <input type="checkbox" value="${index}">
    `;
    liste.appendChild(li);
  });
  mettreAJourBarreSuppression();
}

function afficherHistoire(index) {
  const histoires = JSON.parse(localStorage.getItem("histoires") || "[]");
  const histoire = histoires[index];
  if (histoire) {
    document.getElementById("histoire").innerHTML = histoire.contenu;
    showScreen("resultat");
  }
}
window.onload = () => {
  if (localStorage.getItem("isLoggedIn") === "true") {
    afficherUtilisateurConnecté();
  } else {
    afficherUtilisateurDéconnecté();
  }
  afficherHistoiresSauvegardees();
};
