document.addEventListener("DOMContentLoaded", () => {
  const iconeConnexion = document.getElementById("icone-connexion");
  const modal = document.getElementById("modal-deconnexion");
  const btnSeDeconnecter = document.getElementById("btn-se-deconnecter");
  const btnAnnuler = document.getElementById("btn-annuler");

  if (iconeConnexion) {
    iconeConnexion.addEventListener("click", () => {
      modal.style.display = "block";
    });
  }

  if (btnSeDeconnecter) {
    btnSeDeconnecter.addEventListener("click", () => {
      localStorage.removeItem("connecte");
      window.location.href = "index.html";
    });
  }

  if (btnAnnuler) {
    btnAnnuler.addEventListener("click", () => {
      modal.style.display = "none";
    });
  }

  if (localStorage.getItem("connecte") === "true") {
    const boutonConnexion = document.querySelector(".secondary-button");
    if (boutonConnexion) boutonConnexion.style.display = "none";

    const container = document.querySelector(".container");
    if (container) {
      const icone = document.createElement("div");
      icone.id = "icone-connexion";
      icone.textContent = "GM";
      icone.className = "icone-profil";
      container.appendChild(icone);
    }
  }
});