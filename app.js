document.addEventListener("DOMContentLoaded", function () {
  const btnConnexion = document.getElementById("btn-connexion");
  if (btnConnexion) {
    btnConnexion.addEventListener("click", function () {
      window.location.href = "connexion.html";
    });
  }
});
