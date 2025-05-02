
function showForm() {
  document.getElementById("accueil").classList.add("hidden");
  document.getElementById("formulaire").classList.remove("hidden");
}

function generateStory() {
  const nom = document.getElementById("nom").value || "Léo";
  const chapitres = [
    {
      titre: "Chapitre 1 : Le début de l'aventure",
      texte: `${nom} vivait paisiblement dans un petit village aux abords d'une immense forêt enchantée. Un matin, il découvrit une lettre mystérieuse lui annonçant une quête magique.`
    },
    {
      titre: "Chapitre 2 : Le passage secret",
      texte: `En explorant la forêt, ${nom} tomba sur une pierre lumineuse. En la touchant, un portail apparut, menant vers un monde inconnu rempli de créatures étranges et de paysages extraordinaires.`
    },
    {
      titre: "Chapitre 3 : Le compagnon inattendu",
      texte: `Dans ce monde nouveau, ${nom} rencontra une petite licorne qui parlait. Elle proposa son aide, affirmant connaître le chemin jusqu'à l'objet magique que ${nom} devait retrouver.`
    },
    {
      titre: "Chapitre 4 : Les épreuves du courage",
      texte: `${nom} et la licorne traversèrent une rivière de feu, escaladèrent une montagne brumeuse et affrontèrent une créature géante pour prouver leur bravoure.`
    },
    {
      titre: "Chapitre 5 : La découverte du cristal",
      texte: `Au sommet de la montagne, ils découvrirent le Cristal du Rêve, une pierre puissante capable d’exaucer un souhait. Mais pour l’obtenir, ${nom} dut résoudre une énigme ancienne.`
    },
    {
      titre: "Chapitre 6 : Le retour triomphant",
      texte: `${nom} résolut l’énigme avec brio. De retour chez lui, il utilisa le cristal pour protéger son village à jamais. Il fut acclamé comme un héros et sa légende fut racontée dans tous les contes.`
    }
  ];

  let contenu = "";
  chapitres.forEach((chapitre, i) => {
    contenu += `<h2>${chapitre.titre}</h2>`;
    contenu += `<p>${chapitre.texte}</p>`;
  });

  document.getElementById("formulaire").classList.add("hidden");
  document.getElementById("resultat").classList.remove("hidden");
  document.getElementById("histoire").innerHTML = contenu;
}

function goHome() {
  location.reload();
}
