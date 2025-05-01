function showForm() {
  document.getElementById('accueil').classList.add('hidden');
  document.getElementById('formulaire').classList.remove('hidden');
}

function goHome() {
  document.querySelectorAll('.screen').forEach(el => el.classList.add('hidden'));
  document.getElementById('accueil').classList.remove('hidden');
}

function generateStory() {
  const name = document.getElementById('name').value;
  const type = document.getElementById('type').value;
  const setting = document.getElementById('setting').value;
  const object = document.getElementById('object').value;
  const companion = document.getElementById('companion').value;
  const goal = document.getElementById('goal').value;

  const title = `${name} le ${type.toLowerCase()}`;
  const text = `${name}, un(e) ${type.toLowerCase()}, vivait dans ${setting.toLowerCase()}.
Avec ${object.toLowerCase()} magique et son fidèle ${companion.toLowerCase()}, il/elle se lança dans une mission pour ${goal.toLowerCase()}.
L'aventure fut remplie d'épreuves, de magie et de belles rencontres.`;

  document.getElementById('story-title').innerText = title;
  document.getElementById('story-text').innerText = text;

  document.getElementById('formulaire').classList.add('hidden');
  document.getElementById('resultat').classList.remove('hidden');
}
