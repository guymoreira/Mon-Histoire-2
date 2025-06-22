// js/core/storage.js
// Gestion des interactions avec Firestore pour les histoires

// S'assurer que les objets nécessaires existent
window.MonHistoire = window.MonHistoire || {};
MonHistoire.core = MonHistoire.core || {};

// Module de stockage
MonHistoire.core.storage = {
  // Initialisation du module
  init() {
    // Rien à initialiser pour l'instant
  },
  
  // Récupère toutes les histoires sauvegardées de l'utilisateur
  getHistoiresSauvegardees() {
    console.log("[DEBUG] getHistoiresSauvegardees() - Début de la fonction");
    
    const user = firebase.auth().currentUser;
    console.log("[DEBUG] État utilisateur:", user ? "Connecté" : "Non connecté");
    
    if (!user) {
      console.log("[DEBUG] Aucun utilisateur connecté, retour tableau vide");
      return Promise.resolve([]);
    }
    
    console.log("[DEBUG] ID utilisateur:", user.uid);
    console.log("[DEBUG] Email utilisateur:", user.email);
    
    // Vérifier le profil actif - Récupérer depuis localStorage si non disponible dans MonHistoire.state
    let profilActif;
    if (MonHistoire.state && MonHistoire.state.profilActif) {
      profilActif = MonHistoire.state.profilActif;
    } else {
      // Récupérer directement depuis localStorage comme fallback
      profilActif = localStorage.getItem("profilActif")
        ? JSON.parse(localStorage.getItem("profilActif"))
        : { type: "parent" };
      
      // Mettre à jour MonHistoire.state si possible
      if (MonHistoire.state) {
        MonHistoire.state.profilActif = profilActif;
      }
    }
    console.log("[DEBUG] Profil actif:", JSON.stringify(profilActif));
    
    // Déterminer la collection à interroger en fonction du profil actif
    let storiesRef;
    if (profilActif.type === "parent") {
      console.log("[DEBUG] Mode parent, préparation requête Firestore: users/" + user.uid + "/stories");
      storiesRef = firebase.firestore()
        .collection("users")
        .doc(user.uid)
        .collection("stories");
    } else {
      console.log("[DEBUG] Mode enfant, préparation requête Firestore: users/" + user.uid + "/profils_enfant/" + profilActif.id + "/stories");
      storiesRef = firebase.firestore()
        .collection("users")
        .doc(user.uid)
        .collection("profils_enfant")
        .doc(profilActif.id)
        .collection("stories");
    }
    
    return storiesRef
      .orderBy("createdAt", "desc")
      .get()
      .then(snapshot => {
        console.log("[DEBUG] Snapshot Firestore reçu, taille:", snapshot.size);
        console.log("[DEBUG] Snapshot vide?", snapshot.empty);
        
        const histoires = [];
        
        snapshot.forEach(doc => {
          console.log("[DEBUG] Traitement document ID:", doc.id);
          const data = doc.data();
          console.log("[DEBUG] Données brutes:", JSON.stringify(data));
          
          // Créer un objet histoire avec tous les champs possibles
          const histoire = {
            id: doc.id,
            titre: data.titre || "Histoire sans titre",
            personnage: data.personnage || "",
            lieu: data.lieu || "",
            chapitre1: data.chapitre1 || "",
            chapitre2: data.chapitre2 || "",
            chapitre3: data.chapitre3 || "",
            chapitre4: data.chapitre4 || "",
            chapitre5: data.chapitre5 || "",
            createdAt: data.createdAt || "",
            contenu: data.contenu || "",
            images: data.images || [],
            partageParPrenom: data.partageParPrenom || null,
            partageParProfil: data.partageParProfil || null,
            note: typeof data.note === 'number' ? data.note : null,
            nouvelleHistoire: !!data.nouvelleHistoire
          };
          
          // Vérifier si les données sont au format tableau numéroté [0, 1, 2, 3]
          if (data[0] && typeof data[0] === 'object') {
            console.log("[DEBUG] Détection du format tableau numéroté [0, 1, 2, 3]");
            
            // Convertir le tableau numéroté en chapitres individuels
            for (let i = 0; i < 5; i++) {
              if (data[i] && data[i].texte) {
                histoire[`chapitre${i+1}`] = data[i].texte;
              }
            }
            
            // Extraire les images si disponibles
            histoire.images = [];
            for (let i = 0; i < 5; i++) {
              if (data[i] && data[i].image) {
                histoire.images[i] = data[i].image;
              }
            }
            
            // Créer aussi un tableau chapitres au format attendu
            histoire.chapitres = [];
            for (let i = 0; i < 5; i++) {
              if (data[i]) {
                histoire.chapitres.push({
                  titre: data[i].titre || `Chapitre ${i+1}`,
                  texte: data[i].texte || "",
                  image: data[i].image || null
                });
              }
            }
            
            // Générer le contenu HTML
            let contenuHTML = '';
            for (let i = 0; i < 5; i++) {
              if (data[i] && data[i].texte) {
                contenuHTML += `<h3>${data[i].titre || `Chapitre ${i+1}`}</h3><p>${data[i].texte}</p>`;
                if (data[i].image) {
                  contenuHTML += `<div class="illustration-chapitre"><img src="${data[i].image}" alt="Illustration du chapitre ${i+1}"></div>`;
                }
              }
            }
            histoire.contenu = contenuHTML;
          }
          // Si l'histoire a un contenu HTML mais pas de chapitres individuels,
          // essayer d'extraire les chapitres du contenu HTML
          else if (histoire.contenu && (!histoire.chapitre1 && !histoire.chapitre2 && !histoire.chapitre3)) {
            try {
              // Créer un élément temporaire pour parser le contenu HTML
              const tempDiv = document.createElement('div');
              tempDiv.innerHTML = histoire.contenu;
              
              // Extraire les chapitres du contenu HTML
              const paragraphes = tempDiv.querySelectorAll('p');
              if (paragraphes.length > 0) histoire.chapitre1 = paragraphes[0].textContent || '';
              if (paragraphes.length > 1) histoire.chapitre2 = paragraphes[1].textContent || '';
              if (paragraphes.length > 2) histoire.chapitre3 = paragraphes[2].textContent || '';
              if (paragraphes.length > 3) histoire.chapitre4 = paragraphes[3].textContent || '';
              if (paragraphes.length > 4) histoire.chapitre5 = paragraphes[4].textContent || '';
            } catch (e) {
              console.error("[DEBUG] Erreur lors de l'extraction des chapitres du contenu HTML:", e);
            }
          }
          
          histoires.push(histoire);
        });
        
        console.log("[DEBUG] Nombre d'histoires extraites:", histoires.length);
        console.log("[DEBUG] Histoires:", histoires.map(h => ({id: h.id, titre: h.titre})));
        
        return histoires;
      })
      .catch(error => {
        console.error("[DEBUG] ERREUR dans getHistoiresSauvegardees:", error);
        throw error; // Relancer l'erreur pour la gestion en amont
      });
  },
  
  // Récupère une histoire spécifique par son ID
  getHistoireById(id) {
    const user = firebase.auth().currentUser;
    if (!user) {
      return Promise.reject(new Error("Utilisateur non connecté"));
    }
    
    // Vérifier le profil actif - Récupérer depuis localStorage si non disponible dans MonHistoire.state
    let profilActif;
    if (MonHistoire.state && MonHistoire.state.profilActif) {
      profilActif = MonHistoire.state.profilActif;
    } else {
      // Récupérer directement depuis localStorage comme fallback
      profilActif = localStorage.getItem("profilActif")
        ? JSON.parse(localStorage.getItem("profilActif"))
        : { type: "parent" };
      
      // Mettre à jour MonHistoire.state si possible
      if (MonHistoire.state) {
        MonHistoire.state.profilActif = profilActif;
      }
    }
    
    // Déterminer la référence en fonction du profil actif
    let storyRef;
    if (profilActif.type === "parent") {
      storyRef = firebase.firestore()
        .collection("users")
        .doc(user.uid)
        .collection("stories")
        .doc(id);
    } else {
      storyRef = firebase.firestore()
        .collection("users")
        .doc(user.uid)
        .collection("profils_enfant")
        .doc(profilActif.id)
        .collection("stories")
        .doc(id);
    }
    
    return storyRef.get()
      .then(doc => {
        if (!doc.exists) {
          throw new Error("Histoire non trouvée");
        }
        
        const data = doc.data();
        
        // Créer un objet histoire avec tous les champs possibles
        const histoire = {
          id: doc.id,
          titre: data.titre || "Histoire sans titre",
          personnage: data.personnage || "",
          lieu: data.lieu || "",
          chapitre1: data.chapitre1 || "",
          chapitre2: data.chapitre2 || "",
          chapitre3: data.chapitre3 || "",
          chapitre4: data.chapitre4 || "",
          chapitre5: data.chapitre5 || "",
          createdAt: data.createdAt || "",
          contenu: data.contenu || "",
          images: data.images || [],
          partageParPrenom: data.partageParPrenom || null,
          partageParProfil: data.partageParProfil || null,
          note: typeof data.note === 'number' ? data.note : null,
          nouvelleHistoire: !!data.nouvelleHistoire
        };
        
        // Vérifier si les données sont au format tableau numéroté [0, 1, 2, 3]
        if (data[0] && typeof data[0] === 'object') {
          console.log("[DEBUG] Détection du format tableau numéroté [0, 1, 2, 3] dans getHistoireById");
          
          // Convertir le tableau numéroté en chapitres individuels
          for (let i = 0; i < 5; i++) {
            if (data[i] && data[i].texte) {
              histoire[`chapitre${i+1}`] = data[i].texte;
            }
          }
          
          // Extraire les images si disponibles
          histoire.images = [];
          for (let i = 0; i < 5; i++) {
            if (data[i] && data[i].image) {
              histoire.images[i] = data[i].image;
            }
          }
          
          // Créer aussi un tableau chapitres au format attendu
          histoire.chapitres = [];
          for (let i = 0; i < 5; i++) {
            if (data[i]) {
              histoire.chapitres.push({
                titre: data[i].titre || `Chapitre ${i+1}`,
                texte: data[i].texte || "",
                image: data[i].image || null
              });
            }
          }
          
          // Générer le contenu HTML
          let contenuHTML = '';
          for (let i = 0; i < 5; i++) {
            if (data[i] && data[i].texte) {
              contenuHTML += `<h3>${data[i].titre || `Chapitre ${i+1}`}</h3><p>${data[i].texte}</p>`;
              if (data[i].image) {
                contenuHTML += `<div class="illustration-chapitre"><img src="${data[i].image}" alt="Illustration du chapitre ${i+1}"></div>`;
              }
            }
          }
          histoire.contenu = contenuHTML;
        }
        // Si l'histoire a un contenu HTML mais pas de chapitres individuels,
        // essayer d'extraire les chapitres du contenu HTML
        else if (histoire.contenu && (!histoire.chapitre1 && !histoire.chapitre2 && !histoire.chapitre3)) {
          try {
            // Créer un élément temporaire pour parser le contenu HTML
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = histoire.contenu;
            
            // Extraire les chapitres du contenu HTML
            const paragraphes = tempDiv.querySelectorAll('p');
            if (paragraphes.length > 0) histoire.chapitre1 = paragraphes[0].textContent || '';
            if (paragraphes.length > 1) histoire.chapitre2 = paragraphes[1].textContent || '';
            if (paragraphes.length > 2) histoire.chapitre3 = paragraphes[2].textContent || '';
            if (paragraphes.length > 3) histoire.chapitre4 = paragraphes[3].textContent || '';
            if (paragraphes.length > 4) histoire.chapitre5 = paragraphes[4].textContent || '';
          } catch (e) {
            console.error("[DEBUG] Erreur lors de l'extraction des chapitres du contenu HTML:", e);
          }
        }
        
        return histoire;
      });
  },
  
  // Récupère une histoire partagée par son ID
  getHistoirePartagee(id) {
    const user = firebase.auth().currentUser;
    if (!user) {
      return Promise.reject(new Error("Utilisateur non connecté"));
    }
    
    // Vérifier le profil actif - Récupérer depuis localStorage si non disponible dans MonHistoire.state
    let profilActif;
    if (MonHistoire.state && MonHistoire.state.profilActif) {
      profilActif = MonHistoire.state.profilActif;
    } else {
      // Récupérer directement depuis localStorage comme fallback
      profilActif = localStorage.getItem("profilActif")
        ? JSON.parse(localStorage.getItem("profilActif"))
        : { type: "parent" };
      
      // Mettre à jour MonHistoire.state si possible
      if (MonHistoire.state) {
        MonHistoire.state.profilActif = profilActif;
      }
    }
    
    let storyRef;
    if (profilActif.type === "parent") {
      storyRef = firebase.firestore()
        .collection("users")
        .doc(user.uid)
        .collection("stories")
        .doc(id);
    } else {
      storyRef = firebase.firestore()
        .collection("users")
        .doc(user.uid)
        .collection("profils_enfant")
        .doc(profilActif.id)
        .collection("stories")
        .doc(id);
    }
    
    return storyRef.get()
      .then(doc => {
        if (!doc.exists) {
          throw new Error("Histoire partagée non trouvée");
        }
        
        const data = doc.data();
        
        // Créer un objet histoire avec tous les champs possibles
        const histoire = {
          id: doc.id,
          titre: data.titre || "Histoire sans titre",
          personnage: data.personnage || "",
          lieu: data.lieu || "",
          chapitre1: data.chapitre1 || "",
          chapitre2: data.chapitre2 || "",
          chapitre3: data.chapitre3 || "",
          chapitre4: data.chapitre4 || "",
          chapitre5: data.chapitre5 || "",
          createdAt: data.createdAt || "",
          contenu: data.contenu || "",
          images: data.images || [],
          partageParPrenom: data.partageParPrenom || null,
          partageParProfil: data.partageParProfil || null,
          note: typeof data.note === 'number' ? data.note : null,
          nouvelleHistoire: !!data.nouvelleHistoire
        };
        
        // Vérifier si les données sont au format tableau numéroté [0, 1, 2, 3]
        if (data[0] && typeof data[0] === 'object') {
          console.log("[DEBUG] Détection du format tableau numéroté [0, 1, 2, 3] dans getHistoirePartagee");
          
          // Convertir le tableau numéroté en chapitres individuels
          for (let i = 0; i < 5; i++) {
            if (data[i] && data[i].texte) {
              histoire[`chapitre${i+1}`] = data[i].texte;
            }
          }
          
          // Extraire les images si disponibles
          histoire.images = [];
          for (let i = 0; i < 5; i++) {
            if (data[i] && data[i].image) {
              histoire.images[i] = data[i].image;
            }
          }
          
          // Créer aussi un tableau chapitres au format attendu
          histoire.chapitres = [];
          for (let i = 0; i < 5; i++) {
            if (data[i]) {
              histoire.chapitres.push({
                titre: data[i].titre || `Chapitre ${i+1}`,
                texte: data[i].texte || "",
                image: data[i].image || null
              });
            }
          }
          
          // Générer le contenu HTML
          let contenuHTML = '';
          for (let i = 0; i < 5; i++) {
            if (data[i] && data[i].texte) {
              contenuHTML += `<h3>${data[i].titre || `Chapitre ${i+1}`}</h3><p>${data[i].texte}</p>`;
              if (data[i].image) {
                contenuHTML += `<div class="illustration-chapitre"><img src="${data[i].image}" alt="Illustration du chapitre ${i+1}"></div>`;
              }
            }
          }
          histoire.contenu = contenuHTML;
        }
        // Si l'histoire a un contenu HTML mais pas de chapitres individuels,
        // essayer d'extraire les chapitres du contenu HTML
        else if (histoire.contenu && (!histoire.chapitre1 && !histoire.chapitre2 && !histoire.chapitre3)) {
          try {
            // Créer un élément temporaire pour parser le contenu HTML
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = histoire.contenu;
            
            // Extraire les chapitres du contenu HTML
            const paragraphes = tempDiv.querySelectorAll('p');
            if (paragraphes.length > 0) histoire.chapitre1 = paragraphes[0].textContent || '';
            if (paragraphes.length > 1) histoire.chapitre2 = paragraphes[1].textContent || '';
            if (paragraphes.length > 2) histoire.chapitre3 = paragraphes[2].textContent || '';
            if (paragraphes.length > 3) histoire.chapitre4 = paragraphes[3].textContent || '';
            if (paragraphes.length > 4) histoire.chapitre5 = paragraphes[4].textContent || '';
          } catch (e) {
            console.error("[DEBUG] Erreur lors de l'extraction des chapitres du contenu HTML:", e);
          }
        }
        
        return histoire;
      });
  },
  
  // Sauvegarde une nouvelle histoire
  sauvegarderHistoire(histoire) {
    const user = firebase.auth().currentUser;
    if (!user) {
      return Promise.reject(new Error("Utilisateur non connecté"));
    }
    
    // Vérifie le quota d'histoires
    return this.verifierQuotaHistoires()
      .then(quotaOk => {
        if (!quotaOk) {
          throw new Error(`Tu as atteint le maximum de ${MonHistoire.config.MAX_HISTOIRES} histoires sauvegardées. Supprime une histoire pour en créer une nouvelle.`);
        }
        
        // Prépare les données à sauvegarder
        const data = {
          titre: histoire.titre || "Histoire sans titre",
          personnage: histoire.personnage || "",
          lieu: histoire.lieu || "",
          chapitre1: histoire.chapitre1 || "",
          chapitre2: histoire.chapitre2 || "",
          chapitre3: histoire.chapitre3 || "",
          chapitre4: histoire.chapitre4 || "",
          chapitre5: histoire.chapitre5 || "",
          contenu: histoire.contenu || "", // Ajout du contenu HTML
          images: histoire.images || [], // Ajout des images
          createdAt: new Date().toISOString()
        };
        
        // Ajouter le tableau chapitres s'il existe
        if (histoire.chapitres && Array.isArray(histoire.chapitres)) {
          data.chapitres = histoire.chapitres;
        } else if (histoire.chapitre1 || histoire.chapitre2 || histoire.chapitre3) {
          // Créer le tableau chapitres à partir des chapitres individuels
          data.chapitres = [];
          for (let i = 1; i <= 5; i++) {
            if (histoire[`chapitre${i}`]) {
              data.chapitres.push({
                titre: `Chapitre ${i}`,
                texte: histoire[`chapitre${i}`],
                image: histoire.images && histoire.images[i-1] ? histoire.images[i-1] : null
              });
            }
          }
        }
        
        // Vérifier le profil actif - Récupérer depuis localStorage si non disponible dans MonHistoire.state
        let profilActif;
        if (MonHistoire.state && MonHistoire.state.profilActif) {
          profilActif = MonHistoire.state.profilActif;
        } else {
          // Récupérer directement depuis localStorage comme fallback
          profilActif = localStorage.getItem("profilActif")
            ? JSON.parse(localStorage.getItem("profilActif"))
            : { type: "parent" };
          
          // Mettre à jour MonHistoire.state si possible
          if (MonHistoire.state) {
            MonHistoire.state.profilActif = profilActif;
          }
        }
        
        // Déterminer la collection à interroger en fonction du profil actif
        let storiesRef;
        if (profilActif.type === "parent") {
          storiesRef = firebase.firestore()
            .collection("users")
            .doc(user.uid)
            .collection("stories");
        } else {
          storiesRef = firebase.firestore()
            .collection("users")
            .doc(user.uid)
            .collection("profils_enfant")
            .doc(profilActif.id)
            .collection("stories");
        }
        
        // Sauvegarde dans Firestore
        return storiesRef.add(data)
          .then(docRef => {
            // Si c'est un profil enfant, mettre à jour le compteur nb_histoires
            if (profilActif.type === "enfant") {
              const profilEnfantRef = firebase.firestore()
                .collection("users")
                .doc(user.uid)
                .collection("profils_enfant")
                .doc(profilActif.id);
              
              return profilEnfantRef.update({
                nb_histoires: firebase.firestore.FieldValue.increment(1)
              })
              .then(() => docRef)
              .catch(error => {
                console.error("Erreur lors de la mise à jour du compteur nb_histoires:", error);
                return docRef; // On continue même si la mise à jour du compteur échoue
              });
            }
            
            return docRef;
          });
      })
      .then(docRef => {
        // Log l'activité
        if (MonHistoire.core && MonHistoire.core.auth) {
          MonHistoire.core.auth.logActivite("sauvegarde_histoire", {
            histoire_id: docRef.id,
            titre: histoire.titre
          });
        }
        
      return docRef.id;
      });
  },

  // Met à jour le titre d'une histoire
  updateStoryTitle(id, titre) {
    const user = firebase.auth().currentUser;
    if (!user) {
      return Promise.reject(new Error("Utilisateur non connecté"));
    }

    // Vérifier le profil actif - Récupérer depuis localStorage si non disponible dans MonHistoire.state
    let profilActif;
    if (MonHistoire.state && MonHistoire.state.profilActif) {
      profilActif = MonHistoire.state.profilActif;
    } else {
      // Récupérer directement depuis localStorage comme fallback
      profilActif = localStorage.getItem("profilActif")
        ? JSON.parse(localStorage.getItem("profilActif"))
        : { type: "parent" };

      // Mettre à jour MonHistoire.state si possible
      if (MonHistoire.state) {
        MonHistoire.state.profilActif = profilActif;
      }
    }

    // Déterminer la référence en fonction du profil actif
    let storyRef;
    if (profilActif.type === "parent") {
      storyRef = firebase.firestore()
        .collection("users")
        .doc(user.uid)
        .collection("stories")
        .doc(id);
    } else {
      storyRef = firebase.firestore()
        .collection("users")
        .doc(user.uid)
        .collection("profils_enfant")
        .doc(profilActif.id)
        .collection("stories")
        .doc(id);
    }

    return storyRef.update({
      titre: titre,
      updatedAt: new Date().toISOString()
    });
  },
  
  // Supprime une histoire
  supprimerHistoire(id) {
    const user = firebase.auth().currentUser;
    if (!user) {
      return Promise.reject(new Error("Utilisateur non connecté"));
    }
    
    // Vérifier le profil actif - Récupérer depuis localStorage si non disponible dans MonHistoire.state
    let profilActif;
    if (MonHistoire.state && MonHistoire.state.profilActif) {
      profilActif = MonHistoire.state.profilActif;
    } else {
      // Récupérer directement depuis localStorage comme fallback
      profilActif = localStorage.getItem("profilActif")
        ? JSON.parse(localStorage.getItem("profilActif"))
        : { type: "parent" };
      
      // Mettre à jour MonHistoire.state si possible
      if (MonHistoire.state) {
        MonHistoire.state.profilActif = profilActif;
      }
    }
    
    // Déterminer la référence en fonction du profil actif
    let storyRef;
    if (profilActif.type === "parent") {
      storyRef = firebase.firestore()
        .collection("users")
        .doc(user.uid)
        .collection("stories")
        .doc(id);
    } else {
      storyRef = firebase.firestore()
        .collection("users")
        .doc(user.uid)
        .collection("profils_enfant")
        .doc(profilActif.id)
        .collection("stories")
        .doc(id);
    }
    
    return storyRef.delete()
      .then(() => {
        // Si c'est un profil enfant, mettre à jour le compteur nb_histoires
        if (profilActif.type === "enfant") {
          const profilEnfantRef = firebase.firestore()
            .collection("users")
            .doc(user.uid)
            .collection("profils_enfant")
            .doc(profilActif.id);
          
          return profilEnfantRef.update({
            nb_histoires: firebase.firestore.FieldValue.increment(-1)
          })
          .catch(error => {
            console.error("Erreur lors de la mise à jour du compteur nb_histoires:", error);
            // On continue même si la mise à jour du compteur échoue
          });
        }
      })
      .then(() => {
        // Log l'activité
        if (MonHistoire.core && MonHistoire.core.auth) {
          MonHistoire.core.auth.logActivite("suppression_histoire", { histoire_id: id });
        }
      });
  },
  
  // Vérifie si l'utilisateur a atteint son quota d'histoires
  verifierQuotaHistoires() {
    const user = firebase.auth().currentUser;
    if (!user) {
      return Promise.resolve(false);
    }
    
    // Vérifier le profil actif - Récupérer depuis localStorage si non disponible dans MonHistoire.state
    let profilActif;
    if (MonHistoire.state && MonHistoire.state.profilActif) {
      profilActif = MonHistoire.state.profilActif;
    } else {
      // Récupérer directement depuis localStorage comme fallback
      profilActif = localStorage.getItem("profilActif")
        ? JSON.parse(localStorage.getItem("profilActif"))
        : { type: "parent" };
      
      // Mettre à jour MonHistoire.state si possible
      if (MonHistoire.state) {
        MonHistoire.state.profilActif = profilActif;
      }
    }
    
    // Déterminer la collection à interroger en fonction du profil actif
    let storiesRef;
    if (profilActif.type === "parent") {
      storiesRef = firebase.firestore()
        .collection("users")
        .doc(user.uid)
        .collection("stories");
    } else {
      storiesRef = firebase.firestore()
        .collection("users")
        .doc(user.uid)
        .collection("profils_enfant")
        .doc(profilActif.id)
        .collection("stories");
    }
    
    // On récupère toutes les histoires
    return storiesRef.get()
      .then(snapshot => {
        const count = snapshot.size;
        const maxHistoires = MonHistoire.config.MAX_HISTOIRES || 5;
        return count < maxHistoires;
      });
  },
  
  // Vérifie si l'utilisateur approche de son quota d'histoires
  verifierSeuilAlerteHistoires() {
    const user = firebase.auth().currentUser;
    if (!user) {
      return Promise.resolve(false);
    }
    
    // Vérifier le profil actif - Récupérer depuis localStorage si non disponible dans MonHistoire.state
    let profilActif;
    if (MonHistoire.state && MonHistoire.state.profilActif) {
      profilActif = MonHistoire.state.profilActif;
    } else {
      // Récupérer directement depuis localStorage comme fallback
      profilActif = localStorage.getItem("profilActif")
        ? JSON.parse(localStorage.getItem("profilActif"))
        : { type: "parent" };
      
      // Mettre à jour MonHistoire.state si possible
      if (MonHistoire.state) {
        MonHistoire.state.profilActif = profilActif;
      }
    }
    
    // Déterminer la collection à interroger en fonction du profil actif
    let storiesRef;
    if (profilActif.type === "parent") {
      storiesRef = firebase.firestore()
        .collection("users")
        .doc(user.uid)
        .collection("stories");
    } else {
      storiesRef = firebase.firestore()
        .collection("users")
        .doc(user.uid)
        .collection("profils_enfant")
        .doc(profilActif.id)
        .collection("stories");
    }
    
    // On récupère toutes les histoires
    return storiesRef.get()
      .then(snapshot => {
        const count = snapshot.size;
        const maxHistoires = MonHistoire.config.MAX_HISTOIRES || 5;
        const seuilAlerte = MonHistoire.config.SEUIL_ALERTE_HISTOIRES || 4;
        return count >= seuilAlerte && count < maxHistoires;
      });
  },
  
  // Recalcule et met à jour le nombre d'histoires pour un profil enfant
  recalculerNbHistoires() {
    const user = firebase.auth().currentUser;
    if (!user) {
      return Promise.reject(new Error("Utilisateur non connecté"));
    }
    
    // Vérifier le profil actif - Récupérer depuis localStorage si non disponible dans MonHistoire.state
    let profilActif;
    if (MonHistoire.state && MonHistoire.state.profilActif) {
      profilActif = MonHistoire.state.profilActif;
    } else {
      // Récupérer directement depuis localStorage comme fallback
      profilActif = localStorage.getItem("profilActif")
        ? JSON.parse(localStorage.getItem("profilActif"))
        : { type: "parent" };
      
      // Mettre à jour MonHistoire.state si possible
      if (MonHistoire.state) {
        MonHistoire.state.profilActif = profilActif;
      }
    }
    
    // Ne rien faire si ce n'est pas un profil enfant
    if (profilActif.type !== "enfant") {
      return Promise.resolve();
    }
    
    // Récupérer toutes les histoires du profil enfant
    const storiesRef = firebase.firestore()
      .collection("users")
      .doc(user.uid)
      .collection("profils_enfant")
      .doc(profilActif.id)
      .collection("stories");
    
    return storiesRef.get()
      .then(snapshot => {
        const count = snapshot.size;
        
        // Mettre à jour le compteur nb_histoires
        const profilEnfantRef = firebase.firestore()
          .collection("users")
          .doc(user.uid)
          .collection("profils_enfant")
          .doc(profilActif.id);
        
        return profilEnfantRef.update({
          nb_histoires: count
        });
      });
  }
};

// Exporter pour utilisation dans d'autres modules
window.MonHistoire = MonHistoire;
