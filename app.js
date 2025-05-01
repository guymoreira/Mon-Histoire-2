function showForm() {
  document.getElementById('welcome').classList.add('hidden');
  document.getElementById('formulaire').classList.remove('hidden');
}

function generateStory() {
  const name = document.getElementById('name').value || 'Maxime';
  const type = document.getElementById('type').value || 'explorateur';
  const setting = document.getElementById('setting').value || 'forêt enchantée';
  const object = document.getElementById('object').value || 'carte magique';
  const companion = document.getElementById('companion').value || 'licorne';
  const goal = document.getElementById('goal').value || 'trouver un trésor';

  const story = `Il était une fois, dans ${setting}, un ${type} nommé ${name}.
Grâce à son incroyable ${object}, et toujours accompagné de son fidèle ${companion}, il entreprit une quête périlleuse : ${goal}.
En chemin, ${name} traversa des rivières enchantées, des montagnes qui parlaient, et des forêts où les arbres racontaient des histoires.
Chaque pas l’amenait à de nouvelles rencontres : une chouette savante, un lutin grincheux, et une fée perdue.

Un jour, il arriva au sommet d’une colline violette, d’où il vit une lumière étrange danser au loin. Était-ce le trésor ? Ou une illusion ?
Courageux, ${name} continua. Il se servit de ${object} pour ouvrir une porte secrète cachée dans un vieux chêne.
Derrière cette porte, il découvrit un monde inversé : le ciel était en bas, la terre flottait, et le temps s’écoulait à l’envers.

Mais ${name} resta concentré. ${companion} l’encourageait. Ensemble, ils déjouèrent des énigmes, aidèrent des créatures magiques,
et finalement, ils atteignirent la salle du trésor. Mais ce n’était pas de l’or. C’était un cœur lumineux qui battait doucement.

Ce cœur rendait heureux quiconque l’approchait. ${name} comprit que ce trésor devait être partagé. Il le ramena au village.
Depuis ce jour, les habitants furent joyeux, solidaires et apaisés.

Et ${name}, le ${type}, devint une légende racontée encore et encore…`;

  // Animation de transition
  const form = document.getElementById('formulaire');
  form.classList.add('fade-out');
  setTimeout(() => {
    form.style.display = 'none';
    const storyDiv = document.getElementById('story');
    storyDiv.innerText = story;
    storyDiv.classList.remove('hidden');
    storyDiv.classList.add('fade-in');
  }, 800);
}


function goBack() {
  document.getElementById('formulaire').classList.add('hidden');
  document.getElementById('welcome').classList.remove('hidden');
}

function goHome() {
  location.reload();
}
