
function showForm() {
  document.getElementById("accueil").classList.add("hidden");
  document.getElementById("formulaire").classList.remove("hidden");
}

function generateStory() {
  var nomInput = document.getElementById("nom");
  var personnageInput = document.getElementById("personnage");
  var lieuInput = document.getElementById("lieu");
  var objetInput = document.getElementById("objet");
  var compagnonInput = document.getElementById("compagnon");
  var missionInput = document.getElementById("mission");

  var nom = nomInput ? nomInput.value.trim() : "Léo";
  var personnage = personnageInput ? personnageInput.value.toLowerCase().replace(/\s+/g, '-') : "chevalier";
  var lieu = lieuInput ? lieuInput.value.toLowerCase().replace(/\s+/g, '-') : "foret";
  var objet = objetInput ? objetInput.value.toLowerCase().replace(/\s+/g, '-') : "épée";
  var compagnon = compagnonInput ? compagnonInput.value.toLowerCase().replace(/\s+/g, '-') : "dragon";
  var mission = missionInput ? missionInput.value.toLowerCase() : "sauver le village";

  var baseImg = "illustration-" + personnage + "-" + lieu;

  var chapitres = [
    {
      titre: "Chapitre 1 : Le départ",
      texte: nom + ", un jeune " + personnage + ", vivait près d’une " + lieu + ". Un matin, une voix magique lui confia une mission : " + mission + "."
    },
    {
      titre: "Chapitre 2 : L’objet magique",
      texte: nom + " découvrit une " + objet + " aux pouvoirs étonnants."
    },
    {
      titre: "Chapitre 3 : Le compagnon",
      texte: "Un " + compagnon + " étrange se joignit à " + nom + " dans sa quête."
    },
    {
      titre: "Chapitre 4 : Le grand défi",
      texte: "Au cœur de la " + lieu + ", ils affrontèrent de grands dangers."
    },
    {
      titre: "Chapitre 5 : Le retour en héros",
      texte: nom + " réussit à " + mission + " grâce à son courage."
    }
  ];

  var contenu = "";
  for (var i = 0; i < chapitres.length; i++) {
    var chapitre = chapitres[i];
    contenu += "<h2>" + chapitre.titre + "</h2>";
    contenu += "<img src='" + baseImg + "-chapitre-" + (i + 1) + ".jpg' alt='" + chapitre.titre + "' class='chapitre-illustration' />";
    contenu += "<p>" + chapitre.texte + "</p>";
  }

  var cible = document.getElementById("histoire");
  if (cible) {
    cible.innerHTML = contenu;
    document.getElementById("formulaire").classList.add("hidden");
    document.getElementById("resultat").classList.remove("hidden");
  }
}
