
function showScreen(nouvelEcran) {
  const anciens = document.querySelectorAll('.screen.active');
  anciens.forEach(section => section.classList.remove('active'));

  const cible = document.getElementById(nouvelEcran);
  if (cible) {
    cible.classList.add('active');
    if (nouvelEcran !== 'mes-histoires') {
      reinitialiserSelectionHistoires();
    }
  }
}

function genererHistoire() {
  const texte = `
    <h3>Chapitre 1 : Le départ</h3>
    <p>La princesse partit sur sa licorne aider son ami le lapin à retrouver son doudou.</p>
  `;
  document.getElementById("histoire").innerHTML = texte;
  showScreen("resultat");
}

function demanderSauvegarde() {
  if (confirm("Sauvegarder cette histoire ?")) sauvegarderHistoire();
}

function sauvegarderHistoire() {
  const histoires = JSON.parse(localStorage.getItem("histoires") || "[]");
  if (histoires.length >= 10) {
    alert("Limite atteinte. Supprimez des histoires.");
    return;
  }
  const contenu = document.getElementById("histoire").innerHTML;
  const histoire = {
    titre: "Histoire " + (histoires.length + 1),
    contenu: contenu,
    date: new Date().toISOString()
  };
  histoires.push(histoire);
  localStorage.setItem("histoires", JSON.stringify(histoires));
  alert("Histoire sauvegardée !");
}

function afficherHistoiresSauvegardees() {
  const liste = document.getElementById("liste-histoires");
  liste.innerHTML = "";
  const histoires = JSON.parse(localStorage.getItem("histoires") || "[]");
  histoires.forEach((h, index) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <button class="button" onclick="afficherHistoire(${index})">${h.titre}</button>
      <input type="checkbox" value="${index}" onchange="mettreAJourBarreSuppression()">
    `;
    liste.appendChild(li);
  });
}

function afficherHistoire(index) {
  const histoires = JSON.parse(localStorage.getItem("histoires") || "[]");
  const h = histoires[index];
  if (!h) return;
  document.getElementById("histoire").innerHTML = h.contenu;
  showScreen("resultat");
}

function mettreAJourBarreSuppression() {
  const checkboxes = document.querySelectorAll('#liste-histoires input[type="checkbox"]');
  const visible = Array.from(checkboxes).some(cb => cb.checked);
  document.getElementById('barre-suppression').style.display = visible ? 'flex' : 'none';
}

function toutSelectionner(source) {
  const checkboxes = document.querySelectorAll('#liste-histoires input[type="checkbox"]');
  checkboxes.forEach(cb => cb.checked = source.checked);
  mettreAJourBarreSuppression();
}

function reinitialiserSelectionHistoires() {
  const checkboxes = document.querySelectorAll('#liste-histoires input[type="checkbox"]');
  checkboxes.forEach(cb => cb.checked = false);
  const tout = document.getElementById("tout-selectionner");
  if (tout) tout.checked = false;
  mettreAJourBarreSuppression();
}

window.onload = afficherHistoiresSauvegardees;
