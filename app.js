function generateStory() {
  const name = document.getElementById('name').value || 'Maxime';
  const type = document.getElementById('type').value || 'chevalier';
  const setting = document.getElementById('setting').value || 'forêt enchantée';
  const object = document.getElementById('object').value || 'épée magique';
  const companion = document.getElementById('companion').value || 'dragon';
  const goal = document.getElementById('goal').value || 'sauver un village';

  const storyText = `Il était une fois, dans ${setting}, un ${type} nommé ${name}...
  Armé de ${object} et accompagné de ${companion}, il devait ${goal}.
  Une grande aventure pleine de magie l'attendait.`;

  document.getElementById('story').innerText = storyText;
  document.getElementById('audio').style.display = 'block';
}
