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

  const text = `${name} était un(e) ${type.toLowerCase()} très courageux(se) vivant dans ${setting.toLowerCase()}. Un jour, un appel magique le/la poussa à accomplir une mission très importante : ${goal.toLowerCase()}.

Avec son fidèle ${companion.toLowerCase()} et sa ${object.toLowerCase()} en main, ${name} quitta son foyer. La route fut longue et semée d'embûches : rivières mystérieuses, montagnes chantantes, et créatures étranges l'attendaient.

Chaque nuit, autour d’un feu enchanté, ${name} écrivait ses pensées dans un carnet magique. Le jour, il/elle affrontait les énigmes d’un vieux sphinx, traversait des forêts où les arbres chuchotaient des conseils, et recevait l’aide d’animaux doués de parole.

Au cœur de ${setting.toLowerCase()}, ${name} rencontra un peuple oublié qui gardait un passage secret. Grâce à son ${object.toLowerCase()} et l’intelligence de ${companion.toLowerCase()}, ${name} résolut l’énigme finale.

Enfin, après de nombreuses épreuves, il/elle accomplit sa mission : ${goal.toLowerCase()}. Les habitants célébrèrent ${name}, dont le courage, la gentillesse et la magie devinrent légendaires.

Et c’est ainsi que ${name} vécut encore de nombreuses aventures, toutes aussi merveilleuses les unes que les autres...`;

  document.getElementById('story-title').innerText = title;
  document.getElementById('story-text').innerText = text;

  document.getElementById('formulaire').classList.add('hidden');
  document.getElementById('resultat').classList.remove('hidden');
}
