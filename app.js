document.addEventListener("DOMContentLoaded", () => {
  document.body.style.display = "block";
  setTimeout(() => {
    document.body.style.opacity = "1";
  }, 10);
  updateInterface(); // âœ… appel obligatoire pour lancer l'app
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
      titre: "Chapitre 1 : Le dÃ©part",
      texte: `${nom}, un jeune ${personnage}, vivait paisiblement dans un village prÃ¨s dâ€™une ${lieu}. Un matin, une voix magique lui confia une mission : ${mission}.`,
    },
    {
      titre: "Chapitre 2 : Lâ€™objet magique",
      texte: `En chemin, ${nom} dÃ©couvrit une mystÃ©rieuse ${objet}. DÃ¨s quâ€™il la toucha, il sentit une puissance magique lâ€™envahir.`,
    },
    {
      titre: "Chapitre 3 : Le compagnon",
      texte: `Soudain, un ${compagnon} surgit de la forÃªt. Loin dâ€™Ãªtre menaÃ§ant, il proposa Ã  ${nom} de lâ€™aider dans sa quÃªte.`,
    },
    {
      titre: "Chapitre 4 : Le danger dans la ${lieu}",
      texte: `${nom} et son ${compagnon} affrontÃ¨rent mille Ã©preuves au cÅ“ur de la ${lieu}, dÃ©terminÃ©s Ã  rÃ©ussir leur mission.`,
    },
    {
      titre: "Chapitre 5 : Le triomphe",
      texte: `GrÃ¢ce Ã  son courage, sa ${objet} et lâ€™aide de son fidÃ¨le ${compagnon}, ${nom} rÃ©ussit Ã  ${mission} et devint un hÃ©ros.`,
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
  const storyText = `${nom} Ã©tait un(e) ${personnage} trÃ¨s courageux(se), vivant dans un(e) ${decor}. Un jour, sa mission fut de ${objectif}. Avec son fidÃ¨le ${compagnon} et sa ${objet}, ${nom} partit Ã  lâ€™aventure.`;
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
  const loginBtn = document.getElementById("login-btn"); // âœ… Ã  ajouter

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
    showForm();
    const userIcon = document.getElementById("user-icon");
    if (userIcon) {
        userIcon.addEventListener("click", showLogoutModal);
    }
    localStorage.setItem("isLoggedIn", "true");
    });
  } else {
  }
  if (email && password) {
    if (loginBtn) loginBtn.style.display = "none";
    if (userIcon) {
    const initials = "GM";
      userIcon.textContent = initials;
      userIcon.style.display = "flex";
    }
    // ðŸ‘‡ forcer les boutons d'accueil Ã  apparaÃ®tre immÃ©diatement
    const creerBtn = document.getElementById("creer-btn");
    if (creerBtn) creerBtn.style.display = "inline-block";
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


function showLogoutModal() {
  const modal = document.getElementById("logout-modal");
  if (modal) modal.classList.remove("hidden");
}

window.onload = function() {
  if (localStorage.getItem("isLoggedIn") === "true") {
    showForm();
    const userIcon = document.getElementById("user-icon");
    if (userIcon) {
      userIcon.style.display = "inline-block";
      userIcon.addEventListener("click", showLogoutModal);
    }
  }
};
