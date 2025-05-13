// ==== Écouteur DOMContentLoaded
document.addEventListener("DOMContentLoaded", () => {
  // ==== Initialisation de la connexion
  try {
    if (localStorage.getItem("isLoggedIn") === "true") {
      afficherUtilisateurConnecté();
    } else {
      afficherUtilisateurDéconnecté();
    }
  } catch (e) {
    console.warn("Init échouée :", e);
  }

  // ==== Affichage des histoires et setup de la sélection
  afficherHistoiresSauvegardees();
  document.getElementById("btn-annuler-selection")
    .addEventListener("click", desactiverModeSelection);
  document.getElementById("btn-corbeille")
    .addEventListener("click", () => {
      if (confirm("Voulez-vous vraiment supprimer les histoires sélectionnées ?")) {
        supprimerHistoiresSelectionnees();
      }
    });
  document.getElementById("tout-selectionner")
    .addEventListener("change", function () {
      const coché = this.checked;
      document.querySelectorAll("#liste-histoires li").forEach(li => {
        const cb = li.querySelector("input[type='checkbox']");
        cb.checked = coché;
        li.classList.toggle("selected", coché);
      });
      mettreAJourBarreSuppression();
    });
});

// ==== Navigation & Connexion (inchangé) ====
function showScreen(id) {
  const cur = document.querySelector(".screen.active");
  const next = document.getElementById(id);
  if (cur && cur !== next) cur.classList.remove("active");
  if (next) next.classList.add("active");
}

function loginUser() {
  const email = document.getElementById("email");
  const password = document.getElementById("password");
  if (email?.value.trim() && password?.value.trim()) {
    localStorage.setItem("isLoggedIn","true");
    afficherUtilisateurConnecté();
    showScreen("accueil");
  }
}

function logoutUser() {
  localStorage.setItem("isLoggedIn","false");
  localStorage.removeItem("histoires");
  afficherUtilisateurDéconnecté();
  document.getElementById("logout-modal")?.style.display = "none";
  showScreen("accueil");
  window.location.reload();
}

function afficherUtilisateurConnecté() {
  document.getElementById("user-icon").style.display="inline-block";
  document.getElementById("login-button").style.display="none";
  document.getElementById("my-stories-button").style.display="inline-block";
}
function afficherUtilisateurDéconnecté() {
  document.getElementById("user-icon").style.display="none";
  document.getElementById("login-button").style.display="inline-block";
  document.getElementById("my-stories-button").style.display="none";
}

// ==== Création & affichage des histoires ====
function genererHistoire() {
  // ton code inchangé…
}
function afficherHistoire(index) {
  // ton code inchangé…
}
function demanderSauvegarde() { /* inchangé */ }
function sauvegarderHistoire() { /* inchangé */ }
function afficherGestionSuppression() { /* inchangé */ }

// ==== NOUVEAU MODE SÉLECTION pour Mes Histoires ====
function afficherHistoiresSauvegardees() {
  const liste = document.getElementById("liste-histoires");
  if (!liste) return;
  liste.innerHTML = "";
  const histoires = JSON.parse(localStorage.getItem("histoires")||"[]");
  histoires.forEach((h,i) => {
    const li = document.createElement("li");
    li.id = `histoire-${i}`;
    li.innerHTML = `
      <span class="histoire-titre">${h.titre}</span>
      <input type="checkbox" value="${i}">
    `;
    liste.appendChild(li);
    const titreEl = li.querySelector(".histoire-titre");
    let pressTimer;
    const start = () => { pressTimer = setTimeout(()=>{
      activerModeSelection(); toggleSelection(li);
    },500); };
    const cancel = ()=>clearTimeout(pressTimer);
    titreEl.addEventListener("mousedown",start);
    titreEl.addEventListener("touchstart",start);
    titreEl.addEventListener("mouseup",cancel);
    titreEl.addEventListener("touchend",cancel);
    titreEl.addEventListener("click",()=>{
      if (document.getElementById("mes-histoires").classList.contains("selection-mode")) {
        toggleSelection(li);
      } else {
        afficherHistoire(i);
      }
    });
  });
  mettreAJourBarreSuppression();
}

function activerModeSelection() {
  const sec = document.getElementById("mes-histoires");
  sec.classList.add("selection-mode");
  document.getElementById("barre-suppression").style.display="flex";
}

function desactiverModeSelection() {
  const sec = document.getElementById("mes-histoires");
  sec.classList.remove("selection-mode");
  document.getElementById("barre-suppression").style.display="none";
  document.getElementById("tout-selectionner").checked=false;
  document.querySelectorAll("#liste-histoires input[type='checkbox']").forEach(cb=>{
    cb.checked=false;
    cb.closest("li").classList.remove("selected");
  });
}

function toggleSelection(li) {
  const cb = li.querySelector("input[type='checkbox']");
  cb.checked = !cb.checked;
  li.classList.toggle("selected", cb.checked);
  mettreAJourBarreSuppression();
}

function supprimerHistoiresSelectionnees() {
  const checked = document.querySelectorAll("#liste-histoires input[type='checkbox']:checked");
  const idx = Array.from(checked).map(cb=>parseInt(cb.value,10));
  let h = JSON.parse(localStorage.getItem("histoires")||"[]");
  h = h.filter((_,i)=>!idx.includes(i));
  localStorage.setItem("histoires", JSON.stringify(h));
  alert("Histoires supprimées.");
  desactiverModeSelection();
  afficherHistoiresSauvegardees();
}

function mettreAJourBarreSuppression() {
  const any = Array.from(document.querySelectorAll("#liste-histoires input[type='checkbox']")).some(cb=>cb.checked);
  document.getElementById("barre-suppression").style.display = any ? "flex" : "none";
}

// ==== Fonctions d’utilitaires restants (registerUser, toggleSignup, sendReset, etc.) ====

