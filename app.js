function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function loginUser() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  if (email && password) {
    localStorage.setItem("user", email);
    showScreen('accueil');
  }
}

function genererHistoire() {
  const nom = document.getElementById("nom").value.trim();
  const personnage = document.getElementById("personnage").value.trim();
  const lieu = document.getElementById("lieu").value.trim();
  const objet = document.getElementById("objet").value.trim();
  const compagnon = document.getElementById("compagnon").value.trim();
  const mission = document.getElementById("mission").value.trim();
  const style = document.getElementById("style").value;
  const duree = document.getElementById("duree").value;

  const texte = `Voici l'histoire de ${nom}, un ${personnage} courageux qui vivait près de ${lieu}. Sa mission : ${mission}. Avec l'aide d'un(e) ${
    compagnon || 'ami mystérieux'
  }, et une ${objet} magique, l'aventure commence ! (Style : ${style}, Durée : ${duree})`;

  document.getElementById("histoire").innerText = texte;
  showScreen('resultat');
}

// Reconnexion automatique si utilisateur connu
if (localStorage.getItem("user")) {
  showScreen('accueil');
}
