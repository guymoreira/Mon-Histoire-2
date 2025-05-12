let modeSelection = false;
let longPressTimer = null;

function initialiserSelectionHistoires() {
  document.querySelectorAll(".bouton-histoire").forEach((el, index) => {
    el.addEventListener("mousedown", () => startLongPress(el, index));
    el.addEventListener("mouseup", cancelLongPress);
    el.addEventListener("touchstart", () => startLongPress(el, index));
    el.addEventListener("touchend", cancelLongPress);
    el.addEventListener("click", (e) => {
      if (modeSelection) {
        e.preventDefault();
        toggleItem(el, index);
      }
    });
  });

  const checkAll = document.getElementById("checkAll");
  if (checkAll) {
    checkAll.addEventListener("change", function () {
      const checkboxes = document.querySelectorAll(".checkbox");
      const allDivs = document.querySelectorAll(".bouton-histoire");
      checkboxes.forEach((cb, i) => {
        cb.checked = this.checked;
        allDivs[i].classList.toggle("selectionnee", this.checked);
      });
    });
  }

  const corbeille = document.querySelector(".corbeille");
  if (corbeille) {
    corbeille.addEventListener("click", () => {
      if (!confirm("Supprimer les histoires sélectionnées ?")) return;
      document.querySelectorAll(".bouton-histoire").forEach(el => {
        const cb = el.querySelector(".checkbox");
        if (cb && cb.checked) el.remove();
      });
      quitterModeSelection();
    });
  }

  const annuler = document.querySelector(".annuler-selection");
  if (annuler) {
    annuler.addEventListener("click", quitterModeSelection);
  }
}

function startLongPress(el, index) {
  cancelLongPress();
  longPressTimer = setTimeout(() => {
    modeSelection = true;
    document.body.classList.add("mode-selection");
    toggleItem(el, index, true);
  }, 500);
}

function cancelLongPress() {
  if (longPressTimer) clearTimeout(longPressTimer);
}

function toggleItem(el, index, forceSelect = null) {
  const checkbox = el.querySelector(".checkbox");
  if (!checkbox) return;
  if (forceSelect !== null) checkbox.checked = forceSelect;
  else checkbox.checked = !checkbox.checked;
  el.classList.toggle("selectionnee", checkbox.checked);
}

function quitterModeSelection() {
  modeSelection = false;
  document.body.classList.remove("mode-selection");
  const checkAll = document.getElementById("checkAll");
  if (checkAll) checkAll.checked = false;
  document.querySelectorAll(".checkbox").forEach(cb => cb.checked = false);
  document.querySelectorAll(".bouton-histoire").forEach(el => el.classList.remove("selectionnee"));
}

// Simuler des histoires si aucune présente
function simulerHistoires() {
  const liste = document.getElementById("liste-histoires");
  if (!liste) return;
  for (let i = 1; i <= 3; i++) {
    const div = document.createElement("div");
    div.className = "bouton-histoire";
    div.innerHTML = '<input type="checkbox" class="checkbox" /> <span>Histoire ' + i + "</span>";
    liste.appendChild(div);
  }
}

// Initialisation
window.addEventListener("DOMContentLoaded", () => {
  simulerHistoires();
  initialiserSelectionHistoires();
});


function showScreen(id) {
  document.querySelectorAll(".ecran").forEach(e => e.classList.remove("actif"));
  const cible = document.getElementById(id);
  if (cible) {
    cible.classList.add("actif");
    if (id === "mes-histoires") {
      simulerHistoires();
      initialiserSelectionHistoires();
    }
  }
}

window.addEventListener("DOMContentLoaded", () => {
  // Simule une session utilisateur
  sessionStorage.setItem("utilisateur", JSON.stringify({ nom: "MOREIRA", prenom: "Guy" }));
  // Tente d'afficher l'utilisateur connecté (fonction de ton app réelle)
  if (typeof afficherUtilisateurConnecte === "function") {
    afficherUtilisateurConnecte();
  }
  showScreen("mes-histoires");
});

