
function showForm() {
  document.getElementById("accueil").classList.add("hidden");
  document.getElementById("formulaire").classList.remove("hidden");
}

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
      texte: `${nom}, un jeune ${personnage}, vivait près d’une ${lieu}. Un matin, une voix magique lui confia une mission : ${mission}.`,
    },
    {
      titre: "Chapitre 2 : L’objet magique",
      texte: `${nom} découvrit une ${objet} aux pouvoirs étonnants.`,
    },
    {
      titre: "Chapitre 3 : Le compagnon",
      texte: `Un ${compagnon} étrange se joignit à ${nom} dans sa quête.`,
    },
    {
      titre: "Chapitre 4 : Le grand défi",
      texte: `Au cœur de la ${lieu}, ils affrontèrent de grands dangers.`,
    },
    {
      titre: "Chapitre 5 : Le retour en héros",
      texte: `${nom} réussit à ${mission} grâce à son courage.`,
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
