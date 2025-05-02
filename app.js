
function genererHistoire() {
  const nom = document.getElementById("nom").value.trim();
  const personnage = document.getElementById("personnage").value.toLowerCase().replace(/\s+/g, '-');
  const lieu = document.getElementById("lieu").value.toLowerCase().replace(/\s+/g, '-');
  const objet = document.getElementById("objet").value.toLowerCase().replace(/\s+/g, '-');
  const compagnon = document.getElementById("compagnon").value.toLowerCase().replace(/\s+/g, '-');
  const mission = document.getElementById("mission").value.toLowerCase();

  const baseImg = `illustration-${personnage}-${lieu}`;

  const chapitres = [
    {
      titre: "Chapitre 1 : Le départ",
      texte: `${nom}, un jeune ${personnage}, vivait paisiblement dans un village près d’une ${lieu}. Un matin, une voix magique lui confia une mission : ${mission}.`,
    },
    {
      titre: "Chapitre 2 : L’objet magique",
      texte: `En chemin, ${nom} découvrit une mystérieuse ${objet}. Dès qu’il la toucha, il sentit une puissance magique l’envahir.`,
    },
    {
      titre: "Chapitre 3 : Le compagnon",
      texte: `Soudain, un ${compagnon} surgit de la forêt. Loin d’être menaçant, il proposa à ${nom} de l’aider dans sa quête.`,
    },
    {
      titre: "Chapitre 4 : Le danger dans la ${lieu}",
      texte: `${nom} et son ${compagnon} affrontèrent mille épreuves au cœur de la ${lieu}, déterminés à réussir leur mission.`,
    },
    {
      titre: "Chapitre 5 : Le triomphe",
      texte: `Grâce à son courage, sa ${objet} et l’aide de son fidèle ${compagnon}, ${nom} réussit à ${mission} et devint un héros.`,
    }
  ];

  let contenu = "";
  chapitres.forEach((chapitre, i) => {
    contenu += `<h2>${chapitre.titre}</h2>`;
    contenu += `<img src="${baseImg}-chapitre-${i+1}.jpg" alt="${chapitre.titre}" class="chapitre-illustration" />`;
    contenu += `<p>${chapitre.texte}</p>`;
  });

  document.getElementById("histoire").innerHTML = contenu;
  document.getElementById("formulaire").classList.add("hidden");
  document.getElementById("resultat").classList.remove("hidden");
}


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
}function showForm() {
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

document.getElementById("personnage").addEventListener("change", updatePreview);
document.getElementById("lieu").addEventListener("change", updatePreview);

function updatePreview() {
  const personnage = document.getElementById("personnage").value.toLowerCase().replace(/\s+/g, '-');
  const lieu = document.getElementById("lieu").value.toLowerCase().replace(/\s+/g, '-');
  const previewImg = document.getElementById("preview");
  if (personnage && lieu) {
    previewImg.src = `illustration-${personnage}-${lieu}-chapitre-1.jpg`;
    previewImg.alt = `illustration de ${personnage} dans ${lieu}`;
  }
}
