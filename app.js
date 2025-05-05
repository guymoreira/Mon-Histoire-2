document.addEventListener("DOMContentLoaded", () => {
  document.body.style.display = "block";
  setTimeout(() => {
    document.body.style.opacity = "1";
  }, 10);
  updateInterface(); // ✅ appel obligatoire pour lancer l'app
});

function getCurrentScreen() {
  return document.querySelector(".screen:not(.hidden)");
}
function updateInterface() {
  const isLoggedIn = localStorage.getItem("loggedIn") === "true";
  const userIcon = document.getElementById("user-icon");
  const logoutModal = document.getElementById("logout-modal");
  const loginBtn = document.getElementById("login-btn");
  if (isLoggedIn) {
    if (loginBtn) loginBtn.style.display = "none";
    if (userIcon) {
      const initials = localStorage.getItem("initials") || "??";
      userIcon.textContent = initials;
      userIcon.style.display = "flex";
      userIcon.addEventListener("click", function () {
        if (logoutModal) {
          logoutModal.style.display = "block";
          logoutModal.classList.remove("fade-out");
          logoutModal.classList.add("fade-in");
        }
      });
    }
  } else {
    if (loginBtn) loginBtn.style.display = "inline-block";
    if (userIcon) userIcon.style.display = "none";
    if (logoutModal) logoutModal.style.display = "none";
  }
}
function genererHistoire() {
  const nom = document.getElementById("nom").value.trim();
  const objet = document.getElementById("objet").value.toLowerCase().replace(/\s+/g, '-');
  const compagnon = document.getElementById("compagnon").value.toLowerCase().replace(/\s+/g, '-');
  const mission = document.getElementById("mission").value.toLowerCase();
  const baseImg = `illustration-${personnage}-${lieu}`;
  const chapitres = [
    {
      titre: "Chapitre 1 : Le départ",
      texte: `${nom}, un jeune ${personnage}, vivait paisiblement dans un village près d’une ${lieu}. Un matin, une voix magique lui confia une mission : ${mission}.`,
    },
    {
      titre: "Chapitre 2 : L’objet magique",
      texte: `En chemin, ${nom} découvrit une mystérieuse ${objet}. Dès qu’il la toucha, il sentit une puissance magique l’envahir.`,
    },
    {
      titre: "Chapitre 3 : Le compagnon",
      texte: `Soudain, un ${compagnon} surgit de la forêt. Loin d’être menaçant, il proposa à ${nom} de l’aider dans sa quête.`,
    },
    {
      titre: "Chapitre 4 : Le danger dans la ${lieu}",
      texte: `${nom} et son ${compagnon} affrontèrent mille épreuves au cœur de la ${lieu}, déterminés à réussir leur mission.`,
    },
    {
      titre: "Chapitre 5 : Le triomphe",
      texte: `Grâce à son courage, sa ${objet} et l’aide de son fidèle ${compagnon}, ${nom} réussit à ${mission} et devint un héros.`,
    }
  ];
  let contenu = "";
  chapitres.forEach((chapitre, i) => {
    contenu += `<h2>${chapitre.titre}</h2>`;
    contenu += `<img src="${baseImg}-chapitre-${i+1}.jpg" alt="${chapitre.titre}" class="chapitre-illustration" />`;
    contenu += `<p>${chapitre.texte}</p>`;
  });
  document.getElementById("histoire").innerHTML = contenu;
  document.getElementById("formulaire").classList.add("hidden");
  document.getElementById("resultat").classList.remove("hidden");
}

function goHome() {
  const current = getCurrentScreen();
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
function generateStory() {
  const nom = document.getElementById("nom").value;
  const personnage = document.getElementById("personnage").value;
  const decor = document.getElementById("decor").value;
  const objet = document.getElementById("objet").value;
  const compagnon = document.getElementById("compagnon").value || "compagnon";
  const objectif = document.getElementById("objectif").value;
  const style = document.getElementById("style").value;
  const duree = document.getElementById("duree").value;
  const storyText = `${nom} était un(e) ${personnage} très courageux(se), vivant dans un(e) ${decor}. Un jour, sa mission fut de ${objectif}. Avec son fidèle ${compagnon} et sa ${objet}, ${nom} partit à l’aventure.`;
  document.getElementById("story-container").innerHTML = `<p>${storyText}</p>`;
formulaire.classList.add("fade-out");
formulaire.addEventListener("animationend", function handler() {
  formulaire.removeEventListener("animationend", handler);
  formulaire.classList.add("hidden");
  formulaire.classList.remove("fade-out");
  resultat.classList.remove("hidden");
  resultat.classList.add("fade-in");
});
}
function updatePreview() {
  const previewImg = document.getElementById("preview");
  if (personnage && lieu) {
    previewImg.src = `illustration-${personnage}-${lieu}-chapitre-1.jpg`;
    previewImg.alt = `illustration de ${personnage} dans ${lieu}`;
  }
}

function logout() {
  localStorage.setItem("loggedIn", "false");

  const current = getCurrentScreen();
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

  // cacher pastille et bouton
  const userIcon = document.getElementById("user-icon");
  const loginBtn = document.getElementById("login-btn");
  const logoutModal = document.getElementById("logout-modal");

  if (loginBtn) loginBtn.style.display = "inline-block";
  if (userIcon) userIcon.style.display = "none";
  if (logoutModal) logoutModal.style.display = "none";
}

function goBackToForm() {
  resultat.classList.add("fade-out");
  resultat.addEventListener("animationend", function handler() {
    resultat.removeEventListener("animationend", handler);
    resultat.classList.add("hidden");
    resultat.classList.remove("fade-out");
    formulaire.classList.remove("hidden");
    formulaire.classList.add("fade-in");
  });
}
function closeLogoutModal() {
  const modal = document.getElementById("logout-modal");
  modal.classList.remove("fade-in");
  modal.classList.add("fade-out");
  modal.addEventListener("animationend", function handler() {
    modal.removeEventListener("animationend", handler);
    modal.style.display = "none";
    modal.classList.remove("fade-out");
  });
}
function loginUser(event) {
  event.preventDefault();
  const email = document.getElementById("email");
  const password = document.getElementById("password");
  const accueil = document.getElementById("accueil");
  const connexion = document.getElementById("connexion");
  const userIcon = document.getElementById("user-icon");
  const loginBtn = document.getElementById("login-btn"); // ✅ à ajouter

  if (email.value === "test@exemple.com" && password.value === "motdepasse") {
    localStorage.setItem("loggedIn", "true");
    connexion.classList.add("fade-out");
    connexion.addEventListener("animationend", function handler() {
      connexion.removeEventListener("animationend", handler);
      connexion.classList.add("hidden");
      connexion.classList.remove("fade-out");
      accueil.classList.remove("hidden");
      accueil.classList.add("fade-in");

      if (loginBtn) loginBtn.style.display = "none";
      if (userIcon) userIcon.style.display = "inline-block";
    });
  } else {
    alert("Identifiants incorrects");
  }
  if (email && password) {
    if (loginBtn) loginBtn.style.display = "none";
    if (userIcon) {
      userIcon.textContent = initials;
      userIcon.style.display = "flex";
    }
    // 👇 forcer les boutons d'accueil à apparaître immédiatement
    const creerBtn = document.getElementById("creer-btn");
    if (creerBtn) creerBtn.style.display = "inline-block";
  } else {
    alert("Veuillez remplir tous les champs.");
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
  accueil.classList.remove("hidden");
}

  

