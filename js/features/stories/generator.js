// js/features/stories/generator.js
// Génération d'histoires à partir du formulaire

// S'assurer que les objets nécessaires existent
window.MonHistoire = window.MonHistoire || {};
MonHistoire.features = MonHistoire.features || {};
MonHistoire.features.stories = MonHistoire.features.stories || {};

// Module de génération d'histoires
MonHistoire.features.stories.generator = {
  // Initialisation du module
  init() {
    // Rien à initialiser pour l'instant
  },
  
  // Génère une histoire à partir des données du formulaire
  genererHistoire() {
    // Récupère les valeurs du formulaire
    const personnage = document.getElementById("personnage").value;
    const lieu = document.getElementById("lieu").value;
    
    // Vérifie que les champs sont remplis
    if (!personnage || !lieu) {
      MonHistoire.showMessageModal("Merci de remplir tous les champs.");
      return;
    }
    
    // Récupère les éléments pour afficher le résultat
    const titreHistoireElement = document.getElementById("titre-histoire-resultat");
    const histoireElement = document.getElementById("histoire");
    
    // Vérifie si les éléments essentiels existent
    if (!histoireElement) {
      console.error("[DEBUG] Élément HTML essentiel #histoire manquant pour l'affichage de l'histoire");
      return;
    }
    
    // Affiche le titre dans l'élément approprié s'il existe
    if (titreHistoireElement) {
      titreHistoireElement.textContent = "Génération en cours...";
    }
    
    // Afficher le message de chargement dans le conteneur principal
    histoireElement.innerHTML = "<p>Merci de patienter pendant que l'histoire se crée...</p>";
    
    // Indique qu'on vient du formulaire (pour le bouton Sauvegarder)
    MonHistoire.state.resultatSource = "formulaire";
    
    // Affiche l'écran de résultat
    MonHistoire.core.navigation.showScreen("resultat");
    
    // Prépare les données pour l'API
    const data = {
      personnage: personnage,
      lieu: lieu,
      objet: document.getElementById("objet").value || "",
      compagnon: document.getElementById("compagnon").value || "",
      objectif: document.getElementById("objectif").value || ""
    };
    
    // Appelle l'API pour générer l'histoire
    this.appellerAPIHistoire(data)
      .then(histoire => {
        // L'histoire est déjà affichée dans la fonction appellerAPIHistoire
        
        // Log l'activité
        if (MonHistoire.core && MonHistoire.core.auth && firebase.auth().currentUser) {
          MonHistoire.core.auth.logActivite("generation_histoire", {
            personnage: personnage,
            lieu: lieu
          });
        }
        
        // Log l'activité
        if (MonHistoire.core && MonHistoire.core.auth && firebase.auth().currentUser) {
          MonHistoire.core.auth.logActivite("generation_histoire", {
            personnage: personnage,
            lieu: lieu
          });
        }
        
        // Vérifie si l'utilisateur approche de son quota d'histoires
        if (firebase.auth().currentUser && 
            MonHistoire.core && 
            MonHistoire.core.storage) {
          MonHistoire.core.storage.verifierSeuilAlerteHistoires()
            .then(seuilAtteint => {
              if (seuilAtteint) {
                setTimeout(() => {
                  MonHistoire.showMessageModal(`Attention : tu approches de la limite de ${MonHistoire.config.MAX_HISTOIRES} histoires sauvegardées.`);
                }, 1000);
              }
            });
        }
      })
      .catch(error => {
        console.error("Erreur lors de la génération de l'histoire:", error);
        if (titreHistoireElement) {
          titreHistoireElement.textContent = "Erreur";
        }
        histoireElement.innerHTML = "<p>Désolé, une erreur est survenue lors de la génération de l'histoire. Merci de réessayer.</p>";
      });
  },
  
  // Appelle Firebase pour récupérer une histoire
  appellerAPIHistoire(data) {
    const user = firebase.auth().currentUser;
    if (!user) {
      return Promise.reject(new Error("Utilisateur non connecté"));
    }
    
    // 1. Récupère le prénom du héros
    let prenom = "";
    const prenomInput = document.getElementById("hero-prenom");
    if (prenomInput && prenomInput.value.trim()) {
      prenom = prenomInput.value.trim();
      localStorage.setItem("prenom_heros", prenom);
    } else {
      prenom = localStorage.getItem("prenom_heros") || "";
    }
    
    // 2. Nouvelle clé unique pour les histoires lues
    const filtresKey = `${data.personnage}|${data.lieu}|${data.objet}|${data.compagnon}|${data.objectif}`;
    const histoiresLuesRef = firebase.firestore()
      .collection("users")
      .doc(user.uid)
      .collection("histoires_lues")
      .doc(filtresKey);
    
    // 3. Récupérer la liste des histoires déjà lues
    return histoiresLuesRef.get()
      .then(luesDoc => {
        let lues = [];
        if (luesDoc.exists && Array.isArray(luesDoc.data().ids)) {
          lues = luesDoc.data().ids;
        }
        
        // 4. Construire la requête Firestore
        let query = firebase.firestore().collection("stock_histoires")
          .where("personnage", "==", data.personnage)
          .where("lieu", "==", data.lieu)
          .where("objet", "==", data.objet)
          .where("objectif", "==", data.objectif);
        
        if (data.compagnon) {
          query = query.where("compagnon", "==", data.compagnon);
        }
        
        return query.get().then(snap => {
          if (snap.empty) {
            throw new Error("Aucune histoire trouvée avec ces critères. Essaie d'autres filtres !");
          }
          
          const stories = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          
          // Trouve une histoire non lue, ou réinitialise si toutes sont lues
          let histoire = stories.find(st => !lues.includes(st.id));
          if (!histoire) {
            lues = [];
            histoire = stories[0];
          }
          
          // Marque l'histoire comme lue
          if (!lues.includes(histoire.id)) {
            lues.push(histoire.id);
            histoiresLuesRef.set({ ids: lues }, { merge: true });
          }
          
          // Personnalise le titre avec le prénom du héros
          let titre = histoire.titre || "Mon Histoire";
          if (prenom) {
            titre = titre.replace(/^fille/i, prenom);
          }
          
          // Récupère les éléments pour afficher le résultat
          const titreHistoireElement = document.getElementById("titre-histoire-resultat");
          const histoireElement = document.getElementById("histoire");
          
          // Vérifie si l'élément histoire existe
          if (!histoireElement) {
            console.error("[DEBUG] Élément HTML essentiel #histoire manquant pour l'affichage de l'histoire");
            return Promise.reject(new Error("Élément HTML essentiel #histoire manquant"));
          }
          
          // Affiche le titre dans l'élément approprié s'il existe
          if (titreHistoireElement) {
            titreHistoireElement.textContent = titre;
            
            // Stocke l'ID de l'histoire pour le partage
            if (histoire.id) {
              titreHistoireElement.dataset.histoireId = histoire.id;
            }
          }
          
          // Génère le HTML complet pour l'histoire
          let displayHtml = '';
          
          // Remplir le HTML avec les chapitres
          if (histoire.chapitres && Array.isArray(histoire.chapitres)) {
            // Utiliser les chapitres de l'histoire si disponibles
            histoire.chapitres.forEach((chap, idx) => {
              if (idx < 5) {
                // Personnalise le texte avec le prénom du héros
                let texte = chap.texte || "";
                if (prenom) {
                  texte = this.personnaliserTexteChapitre(texte, prenom, data.personnage);
                }
                
                displayHtml += `<h3>${chap.titre || "Chapitre " + (idx + 1)}</h3>`;
                displayHtml += `<p>${texte}</p>`;
                
                // Ajouter l'image si elle existe
                if (chap.image) {
                  displayHtml += `<div class="illustration-chapitre"><img src="${chap.image}" alt="Illustration du chapitre ${idx+1}"></div>`;
                }
              }
            });
          } else {
            // Fallback si les chapitres ne sont pas disponibles dans le format attendu
            // Utiliser les champs chapitre1, chapitre2, etc.
            const chapitres = [
              histoire.chapitre1 || "",
              histoire.chapitre2 || "",
              histoire.chapitre3 || "",
              histoire.chapitre4 || "",
              histoire.chapitre5 || ""
            ];
            
            chapitres.forEach((texte, idx) => {
              if (texte) {
                // Personnaliser le texte avec le prénom du héros si nécessaire
                if (prenom) {
                  texte = this.personnaliserTexteChapitre(texte, prenom, data.personnage);
                }
                
                displayHtml += `<h3>Chapitre ${idx + 1}</h3>`;
                displayHtml += `<p>${texte}</p>`;
              }
            });
            
            // Ajouter les images si elles existent
            if (histoire.images && Array.isArray(histoire.images)) {
              histoire.images.forEach((imageUrl, idx) => {
                if (imageUrl && idx < 5) {
                  // Trouve le chapitre correspondant
                  const chapitreHTML = `<h3>Chapitre ${idx+1}</h3>`;
                  const position = displayHtml.indexOf(chapitreHTML) + chapitreHTML.length;
                  
                  // Trouve la fin du paragraphe
                  const finParagraphe = displayHtml.indexOf('</p>', position) + 4;
                  
                  // Insère l'image après le paragraphe
                  if (finParagraphe > 4) {
                    const avant = displayHtml.substring(0, finParagraphe);
                    const apres = displayHtml.substring(finParagraphe);
                    displayHtml = avant + `<div class="illustration-chapitre"><img src="${imageUrl}" alt="Illustration du chapitre ${idx+1}"></div>` + apres;
                  }
                }
              });
            }
          }
          
          // Injecte le HTML complet dans le conteneur principal
          histoireElement.innerHTML = displayHtml;
          
          // Construire le contenu HTML complet pour le stockage et l'export
          let storageHtml = "";
          
          // Utiliser directement les chapitres de l'histoire comme dans le code original
          if (histoire.chapitres && Array.isArray(histoire.chapitres)) {
            histoire.chapitres.forEach((chap, idx) => {
              storageHtml += `<h3>${chap.titre || "Chapitre " + (idx + 1)}</h3>`;
              // Personnaliser le texte avec le prénom du héros
              let texte = chap.texte || "";
              if (prenom) {
                texte = this.personnaliserTexteChapitre(texte, prenom, data.personnage);
              }
              storageHtml += `<p>${texte}</p>`;
              if (chap.image) {
                storageHtml += `<div class="illustration-chapitre"><img src="${chap.image}" alt="Illustration du chapitre ${idx + 1}"></div>`;
              }
            });
          } else {
            // Fallback si les chapitres ne sont pas disponibles dans le format attendu
            if (histoire.chapitre1) {
              storageHtml += `<h3>Chapitre 1</h3><p>${histoire.chapitre1}</p>`;
            }
            if (histoire.chapitre2) {
              storageHtml += `<h3>Chapitre 2</h3><p>${histoire.chapitre2}</p>`;
            }
            if (histoire.chapitre3) {
              storageHtml += `<h3>Chapitre 3</h3><p>${histoire.chapitre3}</p>`;
            }
            if (histoire.chapitre4) {
              storageHtml += `<h3>Chapitre 4</h3><p>${histoire.chapitre4}</p>`;
            }
            if (histoire.chapitre5) {
              storageHtml += `<h3>Chapitre 5</h3><p>${histoire.chapitre5}</p>`;
            }
          }
          
          // Crée l'objet histoire complet pour le retour
          const histoireComplete = {
            id: histoire.id,
            titre: titre,
            personnage: data.personnage,
            lieu: data.lieu,
            chapitre1: histoire.chapitre1 || "",
            chapitre2: histoire.chapitre2 || "",
            chapitre3: histoire.chapitre3 || "",
            chapitre4: histoire.chapitre4 || "",
            chapitre5: histoire.chapitre5 || "",
            chapitres: histoire.chapitres || [],
            contenu: storageHtml // Ajout du contenu HTML complet
          };
          
          // Retourne l'histoire complète
          return histoireComplete;
        });
      });
  },
  
  // Génère une histoire localement (sans API)
  genererHistoireLocale(personnage, lieu) {
    // Détermine le type de personnage et de lieu pour adapter l'histoire
    const typePersonnage = this.determinerTypePersonnage(personnage);
    const typeLieu = this.determinerTypeLieu(lieu);
    
    // Génère un titre basé sur le personnage et le lieu
    const titre = `${personnage} et l'aventure ${this.genererAdjectifLieu(typeLieu)} du ${lieu}`;
    
    // Génère les chapitres de l'histoire
    const chapitre1 = this.genererChapitre1(personnage, lieu, typePersonnage, typeLieu);
    const chapitre2 = this.genererChapitre2(personnage, lieu, typePersonnage, typeLieu);
    const chapitre3 = this.genererChapitre3(personnage, lieu, typePersonnage, typeLieu);
    const chapitre4 = this.genererChapitre4(personnage, lieu, typePersonnage, typeLieu);
    const chapitre5 = this.genererChapitre5(personnage, lieu, typePersonnage, typeLieu);
    
    // Retourne l'histoire complète
    return {
      titre: titre,
      personnage: personnage,
      lieu: lieu,
      chapitre1: chapitre1,
      chapitre2: chapitre2,
      chapitre3: chapitre3,
      chapitre4: chapitre4,
      chapitre5: chapitre5
    };
  },
  
  // Détermine le type de personnage pour adapter l'histoire
  determinerTypePersonnage(personnage) {
    const personnageLower = personnage.toLowerCase();
    
    if (personnageLower.includes("princesse") || personnageLower.includes("prince")) {
      return "royal";
    } else if (personnageLower.includes("chevalier") || personnageLower.includes("guerrier") || personnageLower.includes("guerrière")) {
      return "guerrier";
    } else if (personnageLower.includes("sorcier") || personnageLower.includes("sorcière") || personnageLower.includes("magicien") || personnageLower.includes("magicienne")) {
      return "magique";
    } else if (personnageLower.includes("fée") || personnageLower.includes("elfe") || personnageLower.includes("lutin")) {
      return "feerique";
    } else if (personnageLower.includes("dragon") || personnageLower.includes("monstre")) {
      return "creature";
    } else if (personnageLower.includes("pirate") || personnageLower.includes("marin")) {
      return "aventurier";
    } else {
      return "normal";
    }
  },
  
  // Détermine le type de lieu pour adapter l'histoire
  determinerTypeLieu(lieu) {
    const lieuLower = lieu.toLowerCase();
    
    if (lieuLower.includes("château") || lieuLower.includes("palais")) {
      return "royal";
    } else if (lieuLower.includes("forêt") || lieuLower.includes("bois")) {
      return "naturel";
    } else if (lieuLower.includes("montagne") || lieuLower.includes("colline")) {
      return "montagneux";
    } else if (lieuLower.includes("mer") || lieuLower.includes("océan") || lieuLower.includes("plage")) {
      return "maritime";
    } else if (lieuLower.includes("grotte") || lieuLower.includes("caverne")) {
      return "souterrain";
    } else if (lieuLower.includes("village") || lieuLower.includes("ville")) {
      return "urbain";
    } else if (lieuLower.includes("lac") || lieuLower.includes("rivière")) {
      return "aquatique";
    } else if (lieuLower.includes("marais") || lieuLower.includes("marécage")) {
      return "marecageux";
    } else {
      return "mysterieux";
    }
  },
  
  // Génère un adjectif pour le lieu
  genererAdjectifLieu(typeLieu) {
    const adjectifs = {
      royal: ["majestueuse", "royale", "noble", "grandiose"],
      naturel: ["mystérieuse", "enchantée", "verdoyante", "sauvage"],
      montagneux: ["périlleuse", "vertigineuse", "imposante", "escarpée"],
      maritime: ["tumultueuse", "infinie", "salée", "azurée"],
      souterrain: ["sombre", "profonde", "secrète", "obscure"],
      urbain: ["animée", "bruyante", "colorée", "vivante"],
      aquatique: ["paisible", "cristalline", "miroitante", "fraîche"],
      marecageux: ["brumeuse", "humide", "mystique", "trouble"],
      mysterieux: ["étrange", "inconnue", "fascinante", "intrigante"]
    };
    
    const listeAdjectifs = adjectifs[typeLieu] || adjectifs.mysterieux;
    return listeAdjectifs[Math.floor(Math.random() * listeAdjectifs.length)];
  },
  
  // Génère le premier chapitre de l'histoire
  genererChapitre1(personnage, lieu, typePersonnage, typeLieu) {
    const debuts = {
      royal: [
        `Il était une fois, dans un royaume lointain, ${personnage} qui rêvait de découvrir ${lieu}.`,
        `${personnage}, héritier d'une noble lignée, s'ennuyait dans son palais et décida d'explorer ${lieu}.`,
        `Le royaume était en fête lorsque ${personnage} annonça son intention de partir à l'aventure vers ${lieu}.`
      ],
      guerrier: [
        `${personnage}, le plus brave des guerriers, reçut la mission de se rendre à ${lieu} pour accomplir une quête importante.`,
        `Après de nombreuses batailles, ${personnage} cherchait un nouveau défi et entendit parler de ${lieu}.`,
        `Les légendes racontaient que seul ${personnage} pourrait affronter les dangers de ${lieu}.`
      ],
      magique: [
        `${personnage} étudiait d'anciens grimoires qui parlaient d'un pouvoir mystérieux caché dans ${lieu}.`,
        `Une prophétie annonçait que ${personnage} devrait se rendre à ${lieu} pour sauver le monde d'une terrible menace.`,
        `${personnage} sentit une étrange magie l'appeler depuis ${lieu} et décida de suivre cet appel mystérieux.`
      ],
      feerique: [
        `Les ailes scintillantes de ${personnage} brillaient dans la lumière du matin tandis qu'il se préparait à visiter ${lieu}.`,
        `${personnage} avait pour mission de répandre la magie et la joie dans ${lieu} qui avait perdu son enchantement.`,
        `Personne n'avait jamais vu ${personnage} aussi excité que le jour où il décida d'explorer ${lieu}.`
      ],
      creature: [
        `${personnage}, la plus redoutable des créatures, quitta sa tanière pour partir à la conquête de ${lieu}.`,
        `Les habitants tremblaient à l'idée que ${personnage} s'approche de ${lieu}, mais ils ne connaissaient pas ses véritables intentions.`,
        `Contrairement aux rumeurs, ${personnage} était gentil et curieux, et souhaitait simplement découvrir ${lieu}.`
      ],
      aventurier: [
        `La carte au trésor entre les mains, ${personnage} mit le cap vers ${lieu}, prêt à affronter tous les dangers.`,
        `${personnage} avait navigué sur toutes les mers, mais jamais encore il n'avait osé s'aventurer vers ${lieu}.`,
        `L'appel de l'aventure était trop fort pour ${personnage} qui décida de partir explorer ${lieu}.`
      ],
      normal: [
        `Un beau matin, ${personnage} se réveilla avec une idée fixe : partir à l'aventure vers ${lieu}.`,
        `${personnage} en avait assez de sa vie ordinaire et rêvait de découvrir les mystères de ${lieu}.`,
        `Personne ne croyait que ${personnage} oserait s'aventurer vers ${lieu}, et pourtant, l'aventure commença.`
      ]
    };
    
    const listeDebuts = debuts[typePersonnage] || debuts.normal;
    return listeDebuts[Math.floor(Math.random() * listeDebuts.length)];
  },
  
  // Génère le deuxième chapitre de l'histoire
  genererChapitre2(personnage, lieu, typePersonnage, typeLieu) {
    const milieux = {
      royal: [
        `En arrivant à ${lieu}, ${personnage} fut accueilli avec tous les honneurs, mais sentit rapidement que quelque chose n'allait pas.`,
        `Les habitants de ${lieu} furent impressionnés par la présence royale de ${personnage}, mais certains semblaient cacher un secret.`,
        `${personnage} découvrit que ${lieu} était sous l'emprise d'un sortilège et décida d'utiliser son influence pour aider.`
      ],
      naturel: [
        `Les arbres de ${lieu} semblaient murmurer au passage de ${personnage}, comme s'ils essayaient de lui révéler un secret ancien.`,
        `En s'enfonçant dans ${lieu}, ${personnage} découvrit des plantes et des animaux qu'il n'avait jamais vus auparavant.`,
        `La beauté de ${lieu} était à couper le souffle, mais ${personnage} sentit rapidement qu'un danger se cachait parmi cette splendeur.`
      ],
      montagneux: [
        `L'ascension de ${lieu} fut difficile pour ${personnage}, mais chaque pas le rapprochait du sommet et de son objectif.`,
        `Les vents violents de ${lieu} rendaient la progression de ${personnage} périlleuse, mais sa détermination était plus forte.`,
        `En gravissant ${lieu}, ${personnage} découvrit d'anciennes ruines qui semblaient l'appeler.`
      ],
      maritime: [
        `Les vagues de ${lieu} berçaient doucement le navire de ${personnage}, mais la mer pouvait devenir déchaînée à tout moment.`,
        `${personnage} plongea dans les eaux cristallines de ${lieu} et découvrit un monde sous-marin fascinant.`,
        `Une tempête se leva soudainement sur ${lieu}, mettant à l'épreuve le courage de ${personnage}.`
      ],
      souterrain: [
        `L'obscurité de ${lieu} était oppressante, mais ${personnage} avançait courageusement, guidé par une faible lueur au loin.`,
        `Chaque pas dans ${lieu} révélait à ${personnage} de nouvelles merveilles souterraines et d'étranges créatures.`,
        `Les échos résonnaient dans ${lieu}, donnant l'impression à ${personnage} qu'il n'était pas seul.`
      ],
      urbain: [
        `Les rues animées de ${lieu} étaient un labyrinthe pour ${personnage}, qui cherchait à comprendre les coutumes locales.`,
        `${personnage} fut surpris par l'accueil chaleureux des habitants de ${lieu}, qui semblaient l'attendre depuis longtemps.`,
        `En se promenant dans ${lieu}, ${personnage} remarqua des signes étranges sur les bâtiments, comme un code secret.`
      ],
      aquatique: [
        `Les eaux calmes de ${lieu} reflétaient le visage pensif de ${personnage}, qui méditait sur sa quête.`,
        `${personnage} découvrit que ${lieu} abritait des créatures aquatiques intelligentes qui pouvaient l'aider.`,
        `Un étrange brouillard enveloppait ${lieu}, donnant à ${personnage} l'impression d'être dans un rêve.`
      ],
      marecageux: [
        `Chaque pas dans ${lieu} était un défi pour ${personnage}, qui s'enfonçait dans la boue et devait éviter des plantes carnivores.`,
        `Les brumes de ${lieu} jouaient des tours à l'esprit de ${personnage}, lui faisant voir des choses étranges.`,
        `${personnage} rencontra un vieil ermite dans ${lieu}, qui lui offrit un guide précieux pour sa quête.`
      ],
      mysterieux: [
        `${lieu} était encore plus mystérieux que ce que ${personnage} avait imaginé, avec des phénomènes inexplicables partout.`,
        `En explorant ${lieu}, ${personnage} trouva des indices sur une ancienne civilisation disparue.`,
        `Les lois de la nature semblaient différentes dans ${lieu}, ce qui intrigua grandement ${personnage}.`
      ]
    };
    
    const listeMilieux = milieux[typeLieu] || milieux.mysterieux;
    return listeMilieux[Math.floor(Math.random() * listeMilieux.length)];
  },
  
  // Génère le troisième chapitre de l'histoire
  genererChapitre3(personnage, lieu, typePersonnage, typeLieu) {
    const rencontres = [
      `Dans ${lieu}, ${personnage} fit la rencontre d'un étrange personnage qui se présenta comme le gardien des lieux.`,
      `Une créature mystérieuse apparut devant ${personnage} et lui proposa un marché qui pourrait changer le cours de son aventure.`,
      `${personnage} découvrit qu'il n'était pas seul à explorer ${lieu} : un rival de longue date suivait ses traces.`,
      `Un vieil oracle vivant dans ${lieu} révéla à ${personnage} une prophétie concernant son destin.`,
      `Les habitants de ${lieu} considéraient ${personnage} comme l'élu d'une ancienne légende.`,
      `Un animal blessé croisa le chemin de ${personnage} dans ${lieu}, et en le soignant, il gagna un allié précieux.`,
      `${personnage} tomba dans un piège tendu par les gardiens secrets de ${lieu}.`,
      `Une voix mystérieuse guidait ${personnage} à travers les dangers de ${lieu}.`
    ];
    
    return rencontres[Math.floor(Math.random() * rencontres.length)];
  },
  
  // Génère le quatrième chapitre de l'histoire
  genererChapitre4(personnage, lieu, typePersonnage, typeLieu) {
    const epreuves = [
      `Pour prouver sa valeur, ${personnage} dut affronter trois épreuves périlleuses dans ${lieu}.`,
      `Un terrible danger menaçait ${lieu}, et seul ${personnage} pouvait y faire face.`,
      `${personnage} découvrit que le véritable trésor de ${lieu} n'était pas celui qu'il cherchait initialement.`,
      `Les forces obscures qui hantaient ${lieu} se dressèrent contre ${personnage}, mettant à l'épreuve son courage.`,
      `${personnage} comprit que pour accomplir sa quête dans ${lieu}, il devrait d'abord surmonter ses propres peurs.`,
      `Une tempête magique s'abattit sur ${lieu}, et ${personnage} dut utiliser toute son ingéniosité pour protéger les habitants.`,
      `Le temps semblait s'écouler différemment dans ${lieu}, ce qui compliquait la mission de ${personnage}.`,
      `${personnage} dut résoudre une énigme ancestrale pour découvrir le secret de ${lieu}.`
    ];
    
    return epreuves[Math.floor(Math.random() * epreuves.length)];
  },
  
  // Génère le cinquième chapitre de l'histoire
  genererChapitre5(personnage, lieu, typePersonnage, typeLieu) {
    const fins = {
      royal: [
        `Après cette aventure extraordinaire, ${personnage} retourna dans son royaume avec de précieuses connaissances acquises dans ${lieu}.`,
        `Les habitants de ${lieu} demandèrent à ${personnage} de devenir leur souverain, mais son cœur appartenait à son royaume d'origine.`,
        `${personnage} établit une alliance durable entre son royaume et ${lieu}, apportant prospérité aux deux peuples.`
      ],
      guerrier: [
        `La victoire de ${personnage} dans ${lieu} fut célébrée par des chants et des poèmes pendant des générations.`,
        `Après avoir vaincu tous les dangers de ${lieu}, ${personnage} décida de s'y installer pour protéger ses nouveaux amis.`,
        `${personnage} repartit vers de nouvelles aventures, mais promit de revenir un jour à ${lieu} qui avait conquis son cœur.`
      ],
      magique: [
        `Les pouvoirs de ${personnage} s'étaient considérablement renforcés grâce à l'énergie magique de ${lieu}.`,
        `${personnage} décida de fonder une école de magie dans ${lieu} pour transmettre son savoir aux générations futures.`,
        `Le lien mystique entre ${personnage} et ${lieu} perdura, leur permettant de communiquer même à grande distance.`
      ],
      feerique: [
        `La magie de ${personnage} avait redonné vie et couleurs à ${lieu}, qui retrouva son enchantement d'antan.`,
        `Chaque année, ${personnage} revenait à ${lieu} pour célébrer l'anniversaire de cette aventure merveilleuse.`,
        `Les habitants de ${lieu} pouvaient désormais voir les êtres féeriques grâce au don que leur avait fait ${personnage}.`
      ],
      creature: [
        `Contre toute attente, ${personnage} devint le protecteur bien-aimé de ${lieu} et de ses habitants.`,
        `${personnage} et les créatures de ${lieu} apprirent à vivre en harmonie, brisant les préjugés ancestraux.`,
        `La légende de ${personnage}, la créature au grand cœur de ${lieu}, se transmit de génération en génération.`
      ],
      aventurier: [
        `Le trésor que ${personnage} découvrit dans ${lieu} n'était pas fait d'or, mais de souvenirs et d'amitiés précieuses.`,
        `${personnage} cartographia ${lieu} avec précision, permettant à d'autres aventuriers de découvrir ses merveilles.`,
        `Les récits des aventures de ${personnage} dans ${lieu} inspirèrent de nombreux jeunes à partir à leur tour à l'aventure.`
      ],
      normal: [
        `Cette aventure dans ${lieu} avait transformé ${personnage}, qui ne serait plus jamais la même personne.`,
        `${personnage} revint chez lui après son périple dans ${lieu}, mais gardait toujours un œil sur l'horizon, prêt pour la prochaine aventure.`,
        `Les habitants de ${lieu} considéraient désormais ${personnage} comme l'un des leurs, et l'invitèrent à revenir quand il le souhaiterait.`
      ]
    };
    
    const listeFins = fins[typePersonnage] || fins.normal;
    return listeFins[Math.floor(Math.random() * listeFins.length)];
  },
  
  // Personnalise le texte d'un chapitre en remplaçant les références génériques par le prénom
  personnaliserTexteChapitre(texte, prenom, personnage) {
    if (!prenom) return texte;
    
    if (personnage.toLowerCase().includes("fille") || 
        personnage.toLowerCase().includes("princesse") || 
        personnage.toLowerCase().includes("sorcière")) {
      // Remplacements pour personnage féminin
      return texte.replace(
        /\b(la fillette|la petite fille|l'héroïne|la jeune fille|la heroine|la fillette héroïne|la fillette heroïne|la jeune héroïne)\b/gi,
        prenom
      );
    } else {
      // Remplacements pour personnage masculin
      return texte.replace(
        /\b(le garçon|le petit garçon|le héros|le jeune garçon|l'héros|le garçon héros)\b/gi,
        prenom
      );
    }
  }
};

// Exporter pour utilisation dans d'autres modules
window.MonHistoire = MonHistoire;
