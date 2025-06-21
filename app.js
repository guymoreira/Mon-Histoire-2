// app.js
const MAX_HISTOIRES = 5; // Change cette valeur pour la limite souhaitée
const SEUIL_ALERTE_HISTOIRES = 4; // passe en rouge à partir de 4/5 (ajuste si tu veux)
let resultatSource = "formulaire"; // Par défaut
// Instancie "profilActif" à partir du localStorage, sinon sur {type:"parent"} :
let profilActif = localStorage.getItem("profilActif")
  ? JSON.parse(localStorage.getItem("profilActif"))
  : { type: "parent" };

// Variables pour la lecture audio
let lectureAudioEnCours = false;
let syntheseVocale = null;
let pauseAudio = false;

// Variables pour la notification de partage
let notificationSwipeStartX = 0;
let notificationSwipeStartY = 0;
let notificationTimeout = null;
let histoiresPartageesListener = null; // Pour stocker la référence à l'écouteur en temps réel

firebase.auth().useDeviceLanguage();

// Ici une modificaion

const firebaseErrorMessages = {
  "auth/email-already-in-use": "Cette adresse e-mail est déjà utilisée.",
  "auth/invalid-email": "L'adresse e-mail n'est pas valide.",
  "auth/user-disabled": "Ce compte utilisateur a été désactivé.",
  "auth/user-not-found": "Aucun compte trouvé avec cet e-mail.",
  "auth/wrong-password": "Le mot de passe est incorrect.",
  "auth/weak-password": "Le mot de passe est trop faible (minimum 10 caractères).",
  "auth/password-does-not-meet-requirements": "Le mot de passe doit comporter au moins 10 caractères, dont une minuscule, une majuscule et un caractère spécial.",
  "auth/too-many-requests": "Trop de tentatives. Merci de réessayer plus tard.",
  "auth/operation-not-allowed": "Opération non autorisée. Merci de contacter le support.",
  "auth/missing-password": "Merci de saisir un mot de passe.",
  "auth/missing-email": "Merci de saisir une adresse e-mail.",
  "auth/invalid-credential": "L'identifiant ou le mot de passe est invalide.",
  "auth/network-request-failed": "Problème de connexion réseau. Veuillez réessayer.",
  "auth/invalid-credential": "L'identifiant ou le mot de passe est invalide ou a expiré.",
};

firebase.auth().onAuthStateChanged(function(user) {
  if (user) {
    afficherUtilisateurConnecté();
    afficherHistoiresSauvegardees(); // On migrera plus tard vers Firestore
    bindLongPress();
    verifierHistoiresPartagees(); // Vérifie s'il y a des histoires partagées
  } else {
    afficherUtilisateurDéconnecté();
    afficherHistoiresSauvegardees();
    bindLongPress();
  }
});

// Affiche le modal générique avec un message
function showMessageModal(message) {
  document.getElementById("message-modal-text").innerHTML = message;
  const modal = document.getElementById("message-modal");
  modal.classList.add("show");
}
// Ferme le modal lorsque l'utilisateur clique sur OK
function closeMessageModal() {
  const modal = document.getElementById("message-modal");
  modal.classList.remove("show");
}
// —————————————
// State de navigation
// —————————————
// Initialisation des variables d'état pour la navigation
// Ces variables sont maintenant gérées par le module MonHistoire.core.navigation
window.MonHistoire = window.MonHistoire || {};
MonHistoire.state = MonHistoire.state || {};
MonHistoire.state.currentScreen = "accueil";
MonHistoire.state.previousScreen = null;
MonHistoire.state.resultatSource = "formulaire";
MonHistoire.state.lectureAudioEnCours = false;
MonHistoire.events = MonHistoire.events || {
  emit: function(event, data) {
    // Émet un événement personnalisé
    const customEvent = new CustomEvent('monhistoire:' + event, { detail: data });
    document.dispatchEvent(customEvent);
  }
};

function loginUser() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  if (!email || !password) {
    showMessageModal("Merci de remplir tous les champs.");
    return;
  }

  // Firebase Auth
  firebase.auth().signInWithEmailAndPassword(email, password)
    .then((userCredential) => {
      afficherUtilisateurConnecté();
      logActivite("connexion"); // LOG : Connexion réussie
      showScreen("accueil");
      verifierHistoiresPartagees(); // Vérifie s'il y a des histoires partagées après connexion
    })
    .catch((error) => {
      const msg = firebaseErrorMessages[error.code] || error.message;
      showMessageModal(msg);
    });
}


function logoutUser() {
  // Arrête l'écouteur d'histoires partagées avant la déconnexion
  if (histoiresPartageesListener) {
    histoiresPartageesListener();
    histoiresPartageesListener = null;
  }
  
  firebase.auth().signOut().then(() => {
    logActivite("deconnexion"); // LOG : Déconnexion
    afficherUtilisateurDéconnecté();
    fermerLogoutModal(); // <-- C'est ça qu'il faut appeler maintenant
    profilActif = { type: "parent" };
    localStorage.removeItem("profilActif");
    showScreen("accueil");
  });
}

function afficherUtilisateurConnecté() {
  document.getElementById("user-icon").classList.remove("hidden");
  document.getElementById("login-button").classList.add("hidden");
  document.getElementById("my-stories-button").classList.remove("hidden");

  // → Si un profil enfant était actif, on court-circuite tout :
  if (profilActif.type === "enfant") {
    // On met directement l'initiale de l'enfant
    document.getElementById("user-icon").textContent = profilActif.prenom
      .trim()
      .charAt(0)
      .toUpperCase();
    return; // on ne fait pas la requête Firestore parent
  }

  // Sinon, c’est le parent → on récupère son prénom dans Firestore
  const user = firebase.auth().currentUser;
  if (user) {
    firebase.firestore().collection("users").doc(user.uid).get()
      .then((doc) => {
        let initiale = "U"; // Valeur par défaut
        if (doc.exists && doc.data().prenom) {
          initiale = doc.data().prenom.trim().charAt(0).toUpperCase();
        } else if (user.email) {
          initiale = user.email.charAt(0).toUpperCase();
        }
        document.getElementById("user-icon").textContent = initiale;
      })
      .catch(() => {
        if (user.email) {
          document.getElementById("user-icon").textContent = user.email.charAt(0).toUpperCase();
        } else {
          document.getElementById("user-icon").textContent = "U";
        }
      });
  }
}

function afficherUtilisateurDéconnecté() {
  document.getElementById("user-icon").classList.add("hidden");
  document.getElementById("login-button").classList.remove("hidden");
  document.getElementById("my-stories-button").classList.add("hidden");
}

// ────── Nouvelle fonction ouvrirLogoutModal() ──────
async function ouvrirLogoutModal() {
  // 1. Récupérer l'élément qui contiendra le prénom et la liste
  const nameEl = document.getElementById('logout-profile-name');
  const listEl = document.getElementById('logout-profiles-list');

  // Vider tout contenu précédent
  nameEl.textContent = "";
  listEl.innerHTML = "";

  const user = firebase.auth().currentUser;
  if (!user) {
    // Si pas d'utilisateur connecté, on ne fait rien et on ferme
    document.getElementById('logout-modal').classList.remove('show');
    return;
  }

  // 2.a. Si le profil actif est "parent"
  if (profilActif.type === "parent") {
    // 2.a.1. Récupérer le prénom du parent dans Firestore (ou initiale si absent)
    let prenomParent = "";
    try {
      const docParent = await firebase.firestore()
        .collection("users")
        .doc(user.uid)
        .get();
      if (docParent.exists && docParent.data().prenom) {
        prenomParent = docParent.data().prenom;
      } else {
        prenomParent = user.email.charAt(0).toUpperCase();
      }
    } catch (e) {
      prenomParent = user.email ? user.email.charAt(0).toUpperCase() : "U";
    }
    // Afficher le prénom du parent en en-tête
    nameEl.textContent = prenomParent;

    // 2.a.2. Lister chaque enfant avec un bouton bleu
    try {
      const enfantsSnap = await firebase.firestore()
        .collection("users")
        .doc(user.uid)
        .collection("profils_enfant")
        .get();
      enfantsSnap.forEach(docEnfant => {
        const data = docEnfant.data();
        const btn = document.createElement("button");
        btn.className = "button button-blue";
        btn.textContent = data.prenom;
        btn.style.marginBottom = "0.75em";
        btn.onclick = () => {
          profilActif = {
            type: "enfant",
            id: docEnfant.id,
            prenom: data.prenom
          };
         // ★ Enregistre le profil enfant dans localStorage ★
         localStorage.setItem("profilActif", JSON.stringify(profilActif));

          logActivite("changement_profil", {
            ancien: "parent",
            nouveau: data.prenom
          });
          fermerLogoutModal();
          document.getElementById("user-icon").textContent = data.prenom.charAt(0).toUpperCase();
          verifierHistoiresPartagees(); // Vérifie les histoires partagées après changement de profil
        };
        listEl.appendChild(btn);
      });

    } catch (e) {
      console.error("Erreur lecture profils enfants :", e);
    }

    // 2.a.3. Afficher les boutons "Mon Compte" et "Déconnecter"
    document.querySelector("#logout-modal button[onclick='ouvrirMonCompte()']").style.display = "block";
    document.querySelector("#logout-modal button[onclick='logoutUser()']").style.display = "block";

  // 2.b. Sinon, si le profil actif est "enfant"
  } else {
    // 2.b.1. Afficher le prénom de l'enfant en tête
    nameEl.textContent = profilActif.prenom;

    // 2.b.2. Afficher un bouton bleu "Parent" (pour repasser au parent)
    let prenomParent = "";
    try {
      const docParent = await firebase.firestore()
        .collection("users")
        .doc(user.uid)
        .get();
      if (docParent.exists && docParent.data().prenom) {
        prenomParent = docParent.data().prenom;
      } else {
        prenomParent = user.email.charAt(0).toUpperCase();
      }
    } catch (e) {
      prenomParent = user.email ? user.email.charAt(0).toUpperCase() : "U";
    }
    const btnParent = document.createElement("button");
    btnParent.className = "button button-blue";
    btnParent.textContent = prenomParent;
    btnParent.style.marginBottom = "0.75em";
    btnParent.onclick = () => {
     // ★ Fermer d’abord la modale de sélection de profil ★
     fermerLogoutModal();
     // Puis ouvrir la modale de saisie du mot de passe parent
      ouvrirModalMotDePasseParent();
    };
    listEl.appendChild(btnParent);


    // 2.b.3. Afficher les autres enfants (sauf celui en cours)
    try {
      const enfantsSnap = await firebase.firestore()
        .collection("users")
        .doc(user.uid)
        .collection("profils_enfant")
        .get();
      enfantsSnap.forEach(docEnfant => {
        const data = docEnfant.data();
        if (docEnfant.id === profilActif.id) return;
        const btn = document.createElement("button");
        btn.className = "button button-blue";
        btn.textContent = data.prenom;
        btn.style.marginBottom = "0.75em";
        btn.onclick = () => {
          const ancienPrenom = profilActif.prenom;
          profilActif = {
            type: "enfant",
            id: docEnfant.id,
            prenom: data.prenom
          };
             // ★ Enregistre le profil enfant dans localStorage ★
   localStorage.setItem("profilActif", JSON.stringify(profilActif));
          logActivite("changement_profil", {
            ancien: ancienPrenom,
            nouveau: data.prenom
          });
          fermerLogoutModal();
          document.getElementById("user-icon").textContent = data.prenom.charAt(0).toUpperCase();
          verifierHistoiresPartagees(); // Vérifie les histoires partagées après changement de profil
        };
        listEl.appendChild(btn);
      });
    } catch (e) {
      console.error("Erreur lecture autres profils enfants :", e);
    }

    // 2.b.4. Masquer "Mon Compte" et "Déconnecter" quand un enfant est actif
    document.querySelector("#logout-modal button[onclick='ouvrirMonCompte()']").style.display = "none";
    document.querySelector("#logout-modal button[onclick='logoutUser()']").style.display = "none";
  }

  // 3. Afficher la modale
  document.getElementById('logout-modal').classList.add('show');
}

function ouvrirModalMotDePasseParent() {
  const modal = document.getElementById("modal-password-parent");
  // On remet l’état d’erreur à zéro
  document.getElementById("password-parent-error").style.display = "none";
  document.getElementById("input-password-parent").value = "";

  // Ajoute la classe "show" pour afficher la modale (opacity:1, pointer-events:auto)
  modal.classList.add("show");
}

function fermerModalPasswordParent() {
  const modal = document.getElementById("modal-password-parent");
  modal.classList.remove("show");
}


// ────── Nouvelle fonction verifierMotdepasseParent() ──────
/*async function verifierMotdepasseParent() {
  const pwd = document.getElementById("input-password-parent").value.trim();
  const user = firebase.auth().currentUser;
  if (!pwd) {
    const errEl = document.getElementById("password-parent-error");
    errEl.textContent = "Veuillez saisir votre mot de passe.";
    errEl.style.display = "block";
    return;
  }
  const credential = firebase.auth.EmailAuthProvider.credential(user.email, pwd);
  try {
    await user.reauthenticateWithCredential(credential);
    // Succès : retour au profil parent
    const ancien = profilActif.prenom;
    profilActif = { type: "parent" };
    logActivite("changement_profil", { ancien: ancien || "enfant", nouveau: "parent" });
    // Mettre à jour l’icône parent
    firebase.firestore().collection("users").doc(user.uid).get()
      .then(doc => {
        const prenomParent = doc.exists && doc.data().prenom
          ? doc.data().prenom
          : user.email.charAt(0).toUpperCase();
         document.getElementById("user-icon").textContent = prenomParent.charAt(0).toUpperCase();
         verifierHistoiresPartagees(); // Vérifie les histoires partagées après retour au profil parent
       });
     fermerModalPasswordParent();
  } catch (error) {
    const errEl = document.getElementById("password-parent-error");
    errEl.textContent = "Mot de passe incorrect !";
    errEl.style.display = "block";
    logActivite("tentative_acces_parent");
  }
}*/

 async function verifierMotdepasseParent() {
   const pwd = document.getElementById("input-password-parent").value.trim();
   const user = firebase.auth().currentUser;
   if (!pwd) {
     // Champ vide → message d'erreur
     const errEl = document.getElementById("password-parent-error");
     errEl.textContent = "Veuillez saisir votre mot de passe.";
     errEl.style.display = "block";
     return;
   }

   // On ré-authentifie l’utilisateur pour vérifier le mot de passe
   const credential = firebase.auth.EmailAuthProvider.credential(user.email, pwd);
   try {
     await user.reauthenticateWithCredential(credential);
     // Succès : on repasse en mode parent
     const ancien = profilActif.prenom;
     profilActif = { type: "parent" };
        // ★ Enregistre le retour au profil parent dans localStorage ★
   localStorage.setItem("profilActif", JSON.stringify(profilActif));
     logActivite("changement_profil", { ancien: ancien || "enfant", nouveau: "parent" });
     // Mettre à jour l’icône utilisateur avec initiale parent
     firebase.firestore().collection("users").doc(user.uid).get()
       .then(doc => {
         const prenomParent = doc.exists && doc.data().prenom
           ? doc.data().prenom
           : user.email.charAt(0).toUpperCase();
         document.getElementById("user-icon").textContent = prenomParent.charAt(0).toUpperCase();
         verifierHistoiresPartagees(); // Vérifie les histoires partagées après retour au profil parent
       });
     fermerModalPasswordParent();
   } catch (error) {
     // Mot de passe incorrect : message d’erreur
     const errEl = document.getElementById("password-parent-error");
     errEl.textContent = "Mot de passe incorrect !";
     errEl.style.display = "block";
     logActivite("tentative_acces_parent");
   }
 }
function fermerLogoutModal() {
  document.getElementById('logout-modal').classList.remove('show');
}

async function genererHistoire() {
  // 1. Lire le prénom du héros
  let prenom = "";
const prenomInput = document.getElementById("hero-prenom");
if (prenomInput && prenomInput.value.trim()) {
  prenom = prenomInput.value.trim();
  localStorage.setItem("prenom_heros", prenom);
} else {
  prenom = localStorage.getItem("prenom_heros") || "";
}
  console.log("DEBUG prénom utilisé :", prenom);
  const personnage = document.getElementById("personnage").value;
  const lieu = document.getElementById("lieu").value;
  const objet = document.getElementById("objet").value;
  const compagnon = document.getElementById("compagnon").value;
  const objectif = document.getElementById("objectif").value;

  const user = firebase.auth().currentUser;
  if (!user) {
    showMessageModal("Veuillez vous connecter pour lancer une histoire.");
    return;
  }

  // 2. Nouvelle clé unique (on garde la même formule)
  const filtresKey = `${personnage}|${lieu}|${objet}|${compagnon}|${objectif}`;
  const histoiresLuesRef = firebase.firestore()
    .collection("users")
    .doc(user.uid)
    .collection("histoires_lues")
    .doc(filtresKey);

  // 3. Récupérer la liste des histoires déjà lues
  let lues = [];
  try {
    const luesDoc = await histoiresLuesRef.get();
    if (luesDoc.exists && Array.isArray(luesDoc.data().ids)) {
      lues = luesDoc.data().ids;
    }
  } catch (e) {
    console.error(e);
  }

  // 4. Construire la requête Firestore
  let query = firebase.firestore().collection("stock_histoires")
    .where("personnage", "==", personnage)
    .where("lieu", "==", lieu)
    .where("objet", "==", objet)
    .where("objectif", "==", objectif);

  if (compagnon) {
    query = query.where("compagnon", "==", compagnon);
  }

  try {
    const snap = await query.get();
    if (snap.empty) {
      showMessageModal("Aucune histoire trouvée avec ces critères. Essaie d'autres filtres !");
      return;
    }

    const stories = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    let histoire = stories.find(st => !lues.includes(st.id));
    if (!histoire) {
      lues = [];
      histoire = stories[0];
    }
console.log("DEBUG histoire récupérée :", histoire);

    if (!lues.includes(histoire.id)) {
      lues.push(histoire.id);
      await histoiresLuesRef.set({ ids: lues }, { merge: true });
    }

    // 5. AFFICHAGE DE L'HISTOIRE (avec prénom désormais)
    let html = "";
    histoire.chapitres.forEach((chap, idx) => {
      html += `<h3>${chap.titre || "Chapitre " + (idx + 1)}</h3>`;
      // On passe le prénom saisi, puis le type de personnage (“fille”)
      let texte = personnaliserTexteChapitre(chap.texte, prenom, personnage);
      html += `<p>${texte}</p>`;
      if (chap.image) {
        html += `<div class="illustration-chapitre"><img src="${chap.image}" alt=""></div>`;
      }
    });

    document.getElementById("histoire").innerHTML = html;
    // Personnalisation du titre à l'affichage (stock -> affichage)
// Récupère le prénom depuis le formulaire si dispo, sinon depuis le localStorage
let titrePerso = histoire.titre || "Mon Histoire";
if (prenom) {
  titrePerso = titrePerso.replace(/^fille/i, prenom);
  // + plus tard d'autres types si besoin
}
document.getElementById("titre-histoire-resultat").textContent = titrePerso;

    resultatSource = "formulaire";
    showScreen("resultat");
  } catch (e) {
    showMessageModal("Erreur lors de la recherche de l'histoire : " + e.message);
  }
}


function registerUser() {
  const prenom  = document.getElementById("prenom").value.trim();
  const email   = document.getElementById("signup-email").value.trim();
  const password= document.getElementById("signup-password").value;
  const confirm = document.getElementById("signup-confirm").value;

  // Vérification consentement parental
  const consentCheckbox = document.getElementById("checkbox-consent");
  const consent = consentCheckbox ? consentCheckbox.checked : false;
  if (!consent) {
    showMessageModal(
      'Merci de cocher la case de consentement parental.<br>Tu peux consulter les <a href="#" onclick="document.getElementById(\'modal-rgpd\').classList.add(\'show\');return false;">règles de vie privée</a> ici.'
    );
    return;
  }

  if (!prenom || !email || !password || !confirm) {
    showMessageModal("Merci de remplir tous les champs.");
    return;
  }
  if (password !== confirm) {
    showMessageModal("Les mots de passe ne correspondent pas.");
    return;
  }

  // Firebase Auth
  firebase.auth().createUserWithEmailAndPassword(email, password)
    .then((userCredential) => {
      const user = userCredential.user;
      // Stocke le consentement parental dans Firestore
      return firebase.firestore().collection("users").doc(user.uid).set({
        prenom: prenom,
        email: email,
        createdAt: new Date().toISOString(),
        consentement_parental: true
      });
    })
    .then(() => {
      logActivite("creation_compte");  // LOG : création de compte
      toggleSignup(false); // Ferme le formulaire d'inscription avant d'afficher le message
      showMessageModal("Ton compte a bien été créé ! Tu peux maintenant te connecter.");
    })
    .catch((error) => {
      const msg = firebaseErrorMessages[error.code] || error.message;
      showMessageModal(msg);
    });
}

function toggleSignup(show) {
  document.getElementById("signup-form").style.display = show ? "block" : "none";
  document.getElementById("reset-form").style.display = "none";
}
function toggleReset(show) {
  document.getElementById("reset-form").style.display = show ? "block" : "none";
  document.getElementById("signup-form").style.display = "none";
}
function sendReset() {
  const email = document.getElementById("reset-email").value.trim();
  if (!email) {
    showMessageModal("Veuillez saisir votre adresse email.");
    return;
  }

  firebase.auth().sendPasswordResetEmail(email)
    .then(() => {
      showMessageModal("Lien de réinitialisation envoyé !");
      toggleReset(false);
    })
    .catch((error) => {
      const msg = firebaseErrorMessages[error.code] || error.message;
      showMessageModal(msg);
    });
}

async function sauvegarderHistoire(nombreRestant) {
  const user = firebase.auth().currentUser;
  if (!user) {
    showMessageModal("Vous devez être connecté pour sauvegarder.");
    return;
  }
  const contenu = document.getElementById("histoire").innerHTML;
  // Utilise le même titre que celui affiché sous "Ton Histoire"
  // On reprend le prénom utilisé lors de la génération (champ du formulaire)
let titre = document.getElementById("titre-histoire-resultat").textContent || "Titre de Mon Histoire";
// Le titre affiché est déjà personnalisé ! Pas besoin de remplacer encore.

// ... puis sauvegarde le favori avec ce titre (titre déjà personnalisé !)
  const images = Array.from(document.querySelectorAll("#histoire img")).map(img => img.src);

  try {
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
    await storiesRef.add({
      titre: titre,
      contenu: contenu,
      images: images,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    });

    // --- SI on est en mode ENFANT, incrémenter nb_histoires sur son document de profil ---
    if (profilActif.type === "enfant") {
      const profilDocRef = firebase.firestore()
        .collection("users")
        .doc(user.uid)
        .collection("profils_enfant")
        .doc(profilActif.id);
      await profilDocRef.update({
        nb_histoires: firebase.firestore.FieldValue.increment(1)
      });
    }
    logActivite("sauvegarde_histoire"); // LOG : Sauvegarde d'une histoire
    afficherHistoiresSauvegardees();

    // Affiche le message spécial à partir de 3 histoires déjà enregistrées, sauf si plus de place
    if ((MAX_HISTOIRES - nombreRestant) >= 3 && nombreRestant > 0) {
      showMessageModal(
        "Histoire sauvegardée en ligne !<br><b>Plus que " + nombreRestant + " enregistrement(s) possible(s).</b>"
      );
    } else {
      showMessageModal("Histoire sauvegardée en ligne !");
    }
  } catch (error) {
    let msg = "Erreur : " + error.message;
    if (error.code === "unavailable" || error.message.includes("offline")) {
      msg = "Impossible de récupérer l’histoire : vous n’êtes pas connecté à Internet.";
    }
    showMessageModal(msg);
  }
}

async function demanderSauvegarde() {
  const user = firebase.auth().currentUser;
  if (!user) {
    showMessageModal("Vous devez être connecté pour sauvegarder.");
    return;
  }
  try {
   // Selon le profil, calculer le quota sur la collection correspondante
   let quotaRef;
   if (profilActif.type === "parent") {
     quotaRef = firebase.firestore()
       .collection("users")
       .doc(user.uid)
       .collection("stories");
   } else {
     quotaRef = firebase.firestore()
       .collection("users")
       .doc(user.uid)
       .collection("profils_enfant")
       .doc(profilActif.id)
       .collection("stories");
   }
   const snap = await quotaRef.get();

    const nbHistoires = snap.size;
    const restant = MAX_HISTOIRES - nbHistoires;

    if (nbHistoires >= MAX_HISTOIRES) {
      document.getElementById("modal-limite").classList.add("show");
    } else {
      await sauvegarderHistoire(restant); // On passe le nombre restant à la fonction
    }
  } catch (error) {
    showMessageModal("Erreur lors de la vérification du quota : " + error.message);
  }
}


async function afficherHistoiresSauvegardees() {
  const ul = document.getElementById("liste-histoires");
  ul.innerHTML = "";
  const compteur = document.getElementById("compteur-histoires");
  if (compteur) {
    compteur.textContent = '';
    compteur.classList.remove('quota-alerte');
  }
  const user = firebase.auth().currentUser;
  if (!user) {
    // Affiche rien si déconnecté
    return;
  }
  try {
    // Selon le profil actif, on pointe vers la collection correspondante
    let storiesRef;
    if (profilActif.type === "parent") {
      storiesRef = firebase.firestore()
        .collection("users")
        .doc(user.uid)
        .collection("stories");
    } else {
      // mode enfant : on stocke les stories sous /users/{uid}/profils_enfant/{childId}/stories
      storiesRef = firebase.firestore()
        .collection("users")
        .doc(user.uid)
        .collection("profils_enfant")
        .doc(profilActif.id)
        .collection("stories");
    }
    const snap = await storiesRef
      .orderBy("createdAt", "desc")
      .get();

    // Ajout ou MAJ du compteur de quota
    if (compteur) {
      compteur.textContent = `${snap.size} / ${MAX_HISTOIRES}`;
      // Passe en rouge si on atteint le seuil
      if (snap.size >= SEUIL_ALERTE_HISTOIRES) {
        compteur.classList.add('quota-alerte');
      } else {
        compteur.classList.remove('quota-alerte');
      }
    }

snap.forEach(doc => {
  const data = doc.data();
  const li = document.createElement("li");
  li.dataset.id = doc.id;
  
  // Vérifie si l'histoire a été partagée par quelqu'un
  if (data.partageParPrenom) {
    // Ajoute une indication de qui a partagé l'histoire
    li.innerHTML = `
      <button class="button button-blue">
        ${data.titre || "Sans titre"}
        <small style="display:block; font-size:0.8em; opacity:0.8; margin-top:0.2em;">
          Partagé par ${data.partageParPrenom}
        </small>
      </button>
    `;
  } else {
    // Histoire normale (non partagée)
    li.innerHTML = `<button class="button button-blue">${data.titre || "Sans titre"}</button>`;
  }
  
  ul.appendChild(li);
});
    bindLongPress();
    mettreAJourBar();
  } catch (error) {
    showMessageModal("Erreur lors de la lecture : " + error.message);
  }
}


function bindLongPress() {
  document.querySelectorAll('#liste-histoires li').forEach(li => {
    const btn = li.querySelector('button');
    let timer = null;

    const start = e => {
      // timer unique pour le long-press (600ms)
      timer = setTimeout(() => {
        // feedback haptique
        if (navigator.vibrate) {
          navigator.vibrate(50);
        }
        // sélection de l’histoire
        li.classList.add("selected");
        mettreAJourBar();
      }, 600);
    };
    const cancel = () => clearTimeout(timer);

   btn.addEventListener('touchstart', (e) => {
  if (navigator.vibrate) navigator.vibrate(10);
  start(e);
});
btn.addEventListener('mousedown', (e) => {
  if (navigator.vibrate) navigator.vibrate(10);
  start(e);
});
    btn.addEventListener('touchend',   cancel);
    btn.addEventListener('mouseup',    cancel);
    btn.addEventListener('mouseleave', cancel);

btn.addEventListener('click', e => {
  const sec = document.getElementById('mes-histoires');
  if (!sec.classList.contains('selection-mode')) {
    const storyId = li.dataset.id;
    afficherHistoireById(storyId);
  } else {
    li.classList.toggle('selected');
    mettreAJourBar();
  }
});
  });
}

function mettreAJourBar() {
  const sec = document.getElementById("mes-histoires");
  const any = !!document.querySelector("#liste-histoires li.selected");
  const barre = document.getElementById("barre-suppression");
  document.getElementById("barre-suppression").style.display = any ? "flex" : "none";
  sec.classList.toggle("selection-mode", any);

  // Gestion bouton Renommer
  const btnRenommer = document.getElementById("btn-renommer-histoire");
  const nbSelected = document.querySelectorAll("#liste-histoires li.selected").length;
  if (btnRenommer) {
    btnRenommer.style.display = (nbSelected === 1) ? "inline-block" : "none";
  }
  // Applique une classe spéciale si le bouton renommer est visible
  if (barre) {
    barre.classList.toggle("with-rename", btnRenommer && btnRenommer.style.display !== "none");
  }
}

function reinitialiserSelectionHistoires() {
  document.querySelectorAll("#liste-histoires li.selected").forEach(li => li.classList.remove("selected"));
  mettreAJourBar();
}

async function afficherHistoireById(storyId) {
  const user = firebase.auth().currentUser;
  if (!user) return;
  try {
    let storyDocRef;
    if (profilActif.type === "parent") {
      storyDocRef = firebase.firestore()
        .collection("users")
        .doc(user.uid)
        .collection("stories")
        .doc(storyId);
    } else {
      storyDocRef = firebase.firestore()
        .collection("users")
        .doc(user.uid)
        .collection("profils_enfant")
        .doc(profilActif.id)
        .collection("stories")
        .doc(storyId);
    }
    const doc = await storyDocRef.get();

if (doc.exists) {
  document.getElementById("histoire").innerHTML = doc.data().contenu;
  document.getElementById("titre-histoire-resultat").textContent = doc.data().titre || "Titre de Mon Histoire";
  resultatSource = "mes-histoires";
  showScreen("resultat");
  logActivite("consultation_histoire", { story_id: storyId }); // LOG : consultation d'histoire
}
  } catch (error) {
    showMessageModal("Erreur : " + error.message);
  }
}



function fermerModaleLimite() {
  document.getElementById("modal-limite").classList.remove("show");
}
function validerModaleLimite() {
  document.getElementById("modal-limite").classList.remove("show");
  showScreen("mes-histoires");
}

// Ouvre la modale CSS de confirmation
function supprimerHistoiresSelectionnees() {
  document.getElementById("delete-modal").classList.add("show");
}

// Utilisateur clique "Oui"
async function confirmDelete() {
  const user = firebase.auth().currentUser;
  if (!user) return;
  const selectedLis = Array.from(document.querySelectorAll("#liste-histoires li.selected"));
  for (const li of selectedLis) {
    const storyId = li.dataset.id;
    let deleteRef;
    if (profilActif.type === "parent") {
      deleteRef = firebase.firestore()
        .collection("users")
        .doc(user.uid)
        .collection("stories")
        .doc(storyId);
    } else {
      deleteRef = firebase.firestore()
        .collection("users")
        .doc(user.uid)
        .collection("profils_enfant")
        .doc(profilActif.id)
        .collection("stories")
        .doc(storyId);
    }
    await deleteRef.delete();
    
    // --- Si on est en mode ENFANT, décrémenter nb_histoires sur son document de profil ---
    if (profilActif.type === "enfant") {
      const profilDocRef = firebase.firestore()
        .collection("users")
        .doc(user.uid)
        .collection("profils_enfant")
        .doc(profilActif.id);
      await profilDocRef.update({
        nb_histoires: firebase.firestore.FieldValue.increment(-1)
      });
    }
    logActivite("suppression_histoire", { story_id: storyId }); // LOG : Suppression histoire
  }
  reinitialiserSelectionHistoires();
  afficherHistoiresSauvegardees();
  document.getElementById("delete-modal").classList.remove("show");
  showScreen("mes-histoires");
}

function openDeleteAccountModal() {
  fermerMonCompte();
  fermerLogoutModal();
  document.getElementById('delete-account-modal').classList.add('show');
}

function closeDeleteAccountModal() {
  document.getElementById('delete-account-modal').classList.remove('show');
}
function deleteAccount() {
  const user = firebase.auth().currentUser;
  if (!user) {
    showMessageModal("Aucun utilisateur connecté.");
    closeDeleteAccountModal();
    return;
  }
  logActivite("suppression_compte"); // LOG : suppression compte
  // Supprime les données Firestore associées (ex: profil)
  firebase.firestore().collection("users").doc(user.uid).delete()
    .catch(() => {}) // Ignore si déjà supprimé ou inexistant
    .finally(() => {
      // Supprime le compte Auth
      user.delete()
        .then(() => {
          closeDeleteAccountModal();
          showMessageModal("Compte supprimé. Au revoir !");
          afficherUtilisateurDéconnecté();
          showScreen("accueil");
        })
        .catch((error) => {
          if (error.code === "auth/requires-recent-login") {
            showMessageModal("Pour des raisons de sécurité, veuillez vous reconnecter puis réessayer la suppression.");
          } else {
            showMessageModal("Erreur lors de la suppression : " + error.message);
          }
          closeDeleteAccountModal();
        });
    });
}

// Utilisateur clique "Non"
function closeDeleteModal() {
  document.getElementById("delete-modal").classList.remove("show");
}
function retourDepuisResultat() {
  if (resultatSource === "mes-histoires") {
    showScreen("mes-histoires");
  } else {
    showScreen("formulaire");
  }
}
function afficherModaleRenommer() {
  const selected = document.querySelector("#liste-histoires li.selected");
  if (!selected) return;
  // Récupère le titre actuel
  const btn = selected.querySelector('button');
  document.getElementById('input-nouveau-titre').value = btn.textContent.trim();
  document.getElementById("modal-renommer").classList.add("show");
}

function fermerModaleRenommer() {
  document.getElementById("modal-renommer").classList.remove("show");
}

async function confirmerRenommer() {
  const selected = document.querySelector("#liste-histoires li.selected");
  if (!selected) return;
  const storyId = selected.dataset.id;
  const nouveauTitre = document.getElementById('input-nouveau-titre').value.trim();
  if (!nouveauTitre) {
    showMessageModal("Le titre ne peut pas être vide.");
    return;
  }
  // Met à jour Firestore
  const user = firebase.auth().currentUser;
  if (!user) return;
  try {
    let updateRef;
    if (profilActif.type === "parent") {
      updateRef = firebase.firestore()
        .collection("users")
        .doc(user.uid)
        .collection("stories")
        .doc(storyId);
    } else {
      updateRef = firebase.firestore()
        .collection("users")
        .doc(user.uid)
        .collection("profils_enfant")
        .doc(profilActif.id)
        .collection("stories")
        .doc(storyId);
    }
    await updateRef.update({ titre: nouveauTitre });
    logActivite("renommage_histoire", { story_id: storyId }); // LOG : Renommage histoire
    fermerModaleRenommer();
    afficherHistoiresSauvegardees();
    reinitialiserSelectionHistoires();
    showMessageModal("Titre modifié !");
  } catch (error) {
    showMessageModal("Erreur lors du renommage : " + error.message);
  }
}
async function exporterPDF() {
  const { jsPDF } = window.jspdf;
  const titre = document.getElementById("titre-histoire-resultat").textContent || "Mon Histoire";
  const histoireElem = document.getElementById("histoire");
  const pdf = new jsPDF('p', 'mm', 'a4');
  let y = 25;

  pdf.setFontSize(20);
  pdf.text(titre, 105, y, { align: "center" });
  y += 15;

  async function imgSrcToDataURL(src) {
    return new Promise((resolve, reject) => {
      const img = document.createElement("img");
      img.crossOrigin = "anonymous";
      img.src = src;
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL("image/png"));
        } catch (e) {
          reject(e);
        }
      };
      img.onerror = reject;
    });
  }

  const nodes = Array.from(histoireElem.childNodes);
  for (const node of nodes) {
    if (node.nodeType === 1) {
      if (node.tagName.toLowerCase() === "h3") {
        y += 14;
        pdf.setFontSize(16);
        if (y > 260) { pdf.addPage(); y = 20; }
        pdf.text(node.textContent, 105, y, { align: "center" });
        y += 6;
      }
      if (node.classList && node.classList.contains('illustration-chapitre')) {
        const img = node.querySelector("img");
        if (img && img.src) {
          y += 2;
          if (y > 200) { pdf.addPage(); y = 20; }
          try {
            const imgData = await imgSrcToDataURL(img.src);
            // Centre l’image sur la page
          const imgWidth = 140, imgHeight = 140;
          const x = (210 - imgWidth) / 2;
// Si l'image déborde de la page, saute à la page suivante
          if (y + imgHeight > 290) { // 290 = bas de page moins marge (A4 portrait)
          pdf.addPage();
           y = 20; // marge en haut de page
          }

pdf.addImage(imgData, "PNG", x, y, imgWidth, imgHeight);
y += imgHeight + 6;
          } catch (e) {}
        }
      }
      if (node.tagName.toLowerCase() === "p") {
        pdf.setFontSize(12);
        y += 2;
        if (y > 280) { pdf.addPage(); y = 20; }
        let split = pdf.splitTextToSize(node.textContent, 180);
          for (let i = 0; i < split.length; i++) {
          if (y > 280) {
          pdf.addPage();
          y = 20;
        }
  pdf.text(split[i], 15, y);
  y += 7;
}
y += 2;
      }
    }
  }

  pdf.save((titre.replace(/[^a-z0-9]/gi, '_').toLowerCase() || "mon_histoire") + '.pdf');
  logActivite("export_pdf"); // LOG : Export PDF
}
function personnaliserTexteChapitre(texte, prenom, personnage) {
  if (personnage === "fille") {
    return texte.replace(
      /\b(la fillette|la petite fille|l'héroïne|la jeune fille|la heroine|la fillette héroïne|la fillette heroïne|la jeune héroïne)\b/gi,
      prenom
    );
  } else {
    return texte.replace(
      /\b(le garçon|le petit garçon|le héros|le jeune garçon|l'héros|le garçon héros)\b/gi,
      prenom
    );
  }
}

// ========== FONCTIONNALITÉS DE LECTURE AUDIO ==========

// Vérifie si l'API Web Speech est disponible dans le navigateur
function estSynthesisDisponible() {
  return 'speechSynthesis' in window;
}

// Extrait le texte de l'histoire pour la lecture audio
function extraireTexteHistoire() {
  const histoire = document.getElementById("histoire");
  let texte = "";
  
  // Parcourt tous les éléments enfants de la div histoire
  Array.from(histoire.childNodes).forEach(node => {
    // Si c'est un titre (h3)
    if (node.nodeName === "H3") {
      texte += node.textContent + ". ";
    }
    // Si c'est un paragraphe (p)
    else if (node.nodeName === "P") {
      texte += node.textContent + " ";
    }
    // On ignore les images et autres éléments
  });
  
  return texte;
}

// Démarre la lecture audio de l'histoire
function demarrerLectureAudio() {
  if (!estSynthesisDisponible()) {
    showMessageModal("Désolé, votre navigateur ne prend pas en charge la lecture audio.");
    return;
  }
  
  // Récupère le texte de l'histoire
  const texte = extraireTexteHistoire();
  if (!texte) {
    showMessageModal("Aucun texte à lire.");
    return;
  }
  
  // Crée un nouvel objet SpeechSynthesisUtterance
  syntheseVocale = new SpeechSynthesisUtterance(texte);
  syntheseVocale.lang = 'fr-FR';
  syntheseVocale.rate = 0.9; // Vitesse légèrement plus lente pour une meilleure compréhension
  syntheseVocale.pitch = 1.0; // Hauteur normale
  
  // Événements pour gérer la fin de la lecture
  syntheseVocale.onend = function() {
    arreterLectureAudio();
  };
  
  syntheseVocale.onerror = function(event) {
    console.error("Erreur de synthèse vocale:", event);
    arreterLectureAudio();
  };
  
  // Démarre la lecture
  window.speechSynthesis.speak(syntheseVocale);
  lectureAudioEnCours = true;
  pauseAudio = false;
  
  // Met à jour l'interface
  mettreAJourBoutonAudio();
  
  // Log de l'activité
  logActivite("lecture_audio");
}

// Arrête la lecture audio
function arreterLectureAudio() {
  if (estSynthesisDisponible()) {
    window.speechSynthesis.cancel();
  }
  
  lectureAudioEnCours = false;
  pauseAudio = false;
  syntheseVocale = null;
  
  // Met à jour l'interface
  mettreAJourBoutonAudio();
}

// Met en pause la lecture audio
function pauserLectureAudio() {
  if (estSynthesisDisponible() && lectureAudioEnCours) {
    window.speechSynthesis.pause();
    pauseAudio = true;
    
    // Met à jour l'interface
    mettreAJourBoutonAudio();
  }
}

// Reprend la lecture audio après une pause
function reprendreLectureAudio() {
  if (estSynthesisDisponible() && lectureAudioEnCours && pauseAudio) {
    window.speechSynthesis.resume();
    pauseAudio = false;
    
    // Met à jour l'interface
    mettreAJourBoutonAudio();
  }
}

// Met à jour l'apparence du bouton audio selon l'état de la lecture
function mettreAJourBoutonAudio() {
  const bouton = document.getElementById("btn-audio");
  const icone = document.getElementById("icon-audio");
  
  if (lectureAudioEnCours) {
    bouton.classList.add("active");
    
    if (pauseAudio) {
      icone.textContent = "⏯️";
      icone.classList.remove("playing");
    } else {
      icone.textContent = "⏸️";
      icone.classList.add("playing");
    }
  } else {
    bouton.classList.remove("active");
    icone.textContent = "🔊";
    icone.classList.remove("playing");
  }
}

// Fonction appelée par le bouton audio pour basculer entre lecture/pause/arrêt
function toggleLectureAudio() {
  if (!lectureAudioEnCours) {
    demarrerLectureAudio();
  } else if (pauseAudio) {
    reprendreLectureAudio();
  } else {
    pauserLectureAudio();
  }
}

// Fonction de compatibilité pour rediriger vers le module de navigation
function showScreen(screen) {
  if (MonHistoire.core && MonHistoire.core.navigation) {
    MonHistoire.core.navigation.showScreen(screen);
  }
}

// Fonction de compatibilité pour rediriger vers le module de navigation
function goBack() {
  if (MonHistoire.core && MonHistoire.core.navigation) {
    MonHistoire.core.navigation.goBack();
  }
}
// Ouvre la modale "Mon Compte" et remplit les champs avec les infos actuelles
function ouvrirMonCompte() {
  const user = firebase.auth().currentUser;
  if (!user) return;
  firebase.firestore().collection("users").doc(user.uid).get()
    .then(doc => {
      document.getElementById('compte-prenom').value = doc.exists && doc.data().prenom ? doc.data().prenom : '';
      document.getElementById('compte-email').value = user.email || '';
      document.getElementById('modal-moncompte').classList.add('show');
      fermerLogoutModal();

      // Affiche le stock d’histoires dans la modale
      const quota = typeof MAX_HISTOIRES !== 'undefined' ? MAX_HISTOIRES : 5; // valeur par défaut
      firebase.firestore().collection("users").doc(user.uid).collection("stories").get()
        .then(snap => {
          document.getElementById("compte-stock-histoires").innerHTML =
            `Stock d’histoires : <b>${snap.size}</b> / ${quota}`;
        })
        .catch(() => {
          document.getElementById("compte-stock-histoires").innerHTML =
            `Stock d’histoires : <i>erreur de lecture</i>`;
        });
      firebase.firestore()
  .collection("users")
  .doc(user.uid)
  .collection("profils_enfant")
  .get()
  .then(snapshot => {
    etatInitialProfilsEnfant = [];
    snapshot.forEach(doc => {
      etatInitialProfilsEnfant.push({ id: doc.id, prenom: doc.data().prenom });
    });
  });
      afficherProfilsEnfants();
    });
}

// Ferme la modale "Mon Compte"
function fermerMonCompte() {
  // Réinitialise les modifs si on annule
  profilsEnfantModifies = [];

  etatInitialProfilsEnfant.forEach(profil => {
    const ligne = document.querySelector(`#liste-profils-enfants .ligne-profil[data-id="${profil.id}"]`);
    if (ligne) {
      ligne.style.display = "";
      const prenomEl = ligne.querySelector(".prenom");
      if (prenomEl) prenomEl.textContent = profil.prenom;
    }
  });

  const modal = document.getElementById("modal-moncompte");
  modal.classList.add("fade-out");

  setTimeout(() => {
    modal.classList.remove("fade-out");
    modal.classList.remove("show");
  }, 300); // correspond à la durée de l'animation CSS
}

// Modifie le prénom et l'adresse email dans Firebase
function modifierMonCompte() {
  const user = firebase.auth().currentUser;
  if (!user) return;
  const prenom = document.getElementById('compte-prenom').value.trim();
  const email = document.getElementById('compte-email').value.trim();
  if (!prenom || !email) {
    showMessageModal("Merci de remplir tous les champs.");
    return;
  }
  // Met à jour Firestore (prénom)
  firebase.firestore().collection("users").doc(user.uid).set(
    { prenom: prenom },
    { merge: true }
  ).then(() => {
    // Met à jour Firebase Auth (email) si changé
    if (user.email !== email) {
      return user.updateEmail(email);
    }
  }).then(() => {
    logActivite("modification_prenom"); // LOG : modification prénom
fermerMonCompte(); // D'abord on ferme calmement la modale

setTimeout(() => {
  showMessageModal("Modifications enregistrées !");
}, 100); // On attend 100ms pour fluidifier visuellement

afficherUtilisateurConnecté(); // Met à jour l’icône avec nouvelle initiale
 // MAJ de l'icône utilisateur en haut à droite
  }).catch(e => {
    showMessageModal("Erreur : " + (e.message || e));
  });
}

// Envoie un e-mail de réinitialisation du mot de passe
function envoyerResetEmail() {
  const user = firebase.auth().currentUser;
  if (!user) return;
  fermerMonCompte(); // On ferme la modale "Mon Compte" avant d'afficher la confirmation
  firebase.auth().sendPasswordResetEmail(user.email)
    .then(() => {
      showMessageModal("Un e-mail de réinitialisation a été envoyé.");
    })
    .catch(e => {
      showMessageModal("Erreur : " + (e.message || e));
    });
}
// Activation du lien footer RGPD
document.addEventListener('DOMContentLoaded', function() {
  const rgpdLink = document.getElementById('link-rgpd');
  if (rgpdLink) {
    rgpdLink.onclick = function(e) {
      e.preventDefault();
      document.getElementById('modal-rgpd').classList.add('show');
    };
  }

  // Bouton de renommage d'histoire
  const btnRename = document.getElementById('btn-renommer-histoire');
  if (btnRename) {
    btnRename.addEventListener('click', afficherModaleRenommer);
  }

  // Boutons de la modale de renommage
  const btnCancelRename = document.getElementById('btn-annuler-renommer');
  if (btnCancelRename) {
    btnCancelRename.addEventListener('click', fermerModaleRenommer);
  }

  const btnConfirmRename = document.getElementById('btn-confirmer-renommer');
  if (btnConfirmRename) {
    btnConfirmRename.addEventListener('click', confirmerRenommer);
  }
});
// ========== LOG D'ACTIVITÉ UTILISATEUR ==========
// Log anonyme d'une action utilisateur (stocké dans /users/{uid}/logs)
function logActivite(type, data = {}) {
  const user = firebase.auth().currentUser;
  if (!user) return;
  const entry = {
    type: type,
    timestamp: new Date().toISOString(),
    ...data
  };
  firebase.firestore()
    .collection("users")
    .doc(user.uid)
    .collection("logs")
    .add(entry)
    .catch(() => {}); // On ignore les erreurs pour ne jamais bloquer l'appli
}
function togglePassword(inputId, eyeSpan) {
  const input = document.getElementById(inputId);
  if (!input) return;
  if (input.type === "password") {
    input.type = "text";
    eyeSpan.textContent = "🙈";
  } else {
    input.type = "password";
    eyeSpan.textContent = "👁️";
  }
}
// ==========================
// 🔧 GESTION PROFILS ENFANT
// ==========================

// Variable globale (en haut de fichier si tu préfères)
let profilsEnfantModifies = [];
let etatInitialProfilsEnfant = []; // Pour restaurer les prénoms si on annule

// Afficher les profils enfants dans la modale
function afficherProfilsEnfants() {
  const user = firebase.auth().currentUser;
  if (!user) return;

  const liste = document.getElementById("liste-profils-enfants");
  liste.innerHTML = "";

  firebase.firestore()
    .collection("users").doc(user.uid)
    .collection("profils_enfant")
    .get()
    .then(snapshot => {
      let count = 0;
      snapshot.forEach(doc => {
        const data = doc.data();
        count++;
        const li = document.createElement("li");
        li.className = "ligne-profil";
        li.setAttribute("data-id", doc.id); // Ajout ici ✅
        li.innerHTML = `
          <span class="prenom">${data.prenom}</span>
          <span class="quota">${data.nb_histoires || 0}/5</span>
          <img src="corbeille-cartoon.png" alt="Supprimer" class="btn-corbeille" onclick="retirerProfil('${doc.id}')">
          <button type="button" class="btn-edit" onclick="modifierProfil('${doc.id}', '${data.prenom}')">✏️</button>
        `;
        liste.appendChild(li);
      });

      // Masquer bouton d’ajout si 2 profils
      document.getElementById("btn-ajouter-enfant").style.display = (count >= 2) ? "none" : "inline-block";
    });
}
function ouvrirFormAjoutEnfant() {
  const form = document.getElementById("form-ajout-enfant");
  form.classList.remove("fade-in"); // au cas où
  void form.offsetWidth; // forcer le redémarrage d'animation
  form.classList.add("fade-in");
  form.style.display = "block";
}

function retirerProfil(id) {
  profilsEnfantModifies.push({ action: "supprimer", id });
  document.querySelector(`img[onclick*='${id}']`).closest("li").remove();
}

let idProfilEnfantActif = null;

function modifierProfil(id, prenomActuel) {
  idProfilEnfantActif = id;
  const input = document.getElementById("input-nouveau-prenom");
  input.value = prenomActuel;
  document.getElementById("modal-renommer-profil").classList.add("show");
}
function fermerModaleRenommerProfil() {
  document.getElementById("modal-renommer-profil").classList.remove("show");
  idProfilEnfantActif = null;
}

function confirmerRenommerProfil() {
  const nouveauPrenom = document.getElementById("input-nouveau-prenom").value.trim();
  if (!nouveauPrenom) {
    showMessageModal("Le prénom ne peut pas être vide.");
    return;
  }
  if (!idProfilEnfantActif) return;

  const user = firebase.auth().currentUser;
  if (!user) return;

  // Stocke la modif localement sans toucher Firestore
  profilsEnfantModifies.push({ action: "modifier", id: idProfilEnfantActif, nouveauPrenom });

  // Mise à jour visuelle immédiate
  const element = document.querySelector(`#liste-profils-enfants .ligne-profil[data-id="${idProfilEnfantActif}"] .prenom`);
  if (element) element.textContent = nouveauPrenom;

  fermerModaleRenommerProfil();
}



function annulerAjoutEnfant() {
  const form = document.getElementById("form-ajout-enfant");
form.classList.remove("fade-in");
form.classList.add("fade-out");
setTimeout(() => {
  form.style.display = "none";
  form.classList.remove("fade-out");
  document.getElementById("input-prenom-enfant").value = "";
}, 250);

  document.getElementById("input-prenom-enfant").value = "";
}

function validerAjoutEnfant() {
  const user = firebase.auth().currentUser;
  const prenom = document.getElementById("input-prenom-enfant").value.trim();
  if (!prenom || !user) return;

  const ref = firebase.firestore()
    .collection("users").doc(user.uid)
    .collection("profils_enfant").doc();

  ref.set({
    prenom,
    createdAt: new Date().toISOString(),
    nb_histoires: 0
  }).then(() => {
    annulerAjoutEnfant();
    document.getElementById("input-prenom-enfant").value = "";
    afficherProfilsEnfants();
  });
}

// À appeler quand on clique sur le bouton “Enregistrer”
function enregistrerModificationsProfils() {
  const user = firebase.auth().currentUser;
  const batch = firebase.firestore().batch();
  const ref = firebase.firestore().collection("users").doc(user.uid).collection("profils_enfant");

  profilsEnfantModifies.forEach(modif => {
    if (modif.action === "supprimer") {
      batch.delete(ref.doc(modif.id));
      logActivite("suppression_profil_enfant", { id_enfant: modif.id });
    }
    if (modif.action === "modifier") {
      batch.update(ref.doc(modif.id), { prenom: modif.nouveauPrenom });
      logActivite("modification_prenom_profil", { id_enfant: modif.id });
    }
  });

batch.commit().then(() => {
  profilsEnfantModifies = [];
  afficherProfilsEnfants();

  const form = document.getElementById("form-ajout-enfant");
  if (form && form.style.display !== "none") {
    form.classList.remove("fade-in");
    form.classList.add("fade-out");

    // Attendre la fin du fondu avant de fermer la modale principale
    setTimeout(() => {
      form.style.display = "none";
      form.classList.remove("fade-out");

      fermerMonCompte(); // Ferme "Mon Compte" une fois que tout est calme

      setTimeout(() => {
        showMessageModal("Modifications enregistrées !");
      }, 100);
    }, 250); // temps du fondu en ms
  } else {
    fermerMonCompte();
    setTimeout(() => {
      showMessageModal("Modifications enregistrées !");
    }, 100);
  }
});
}

// ========== FONCTIONNALITÉS DE PARTAGE D'HISTOIRES ==========

// Variable pour stocker l'ID de l'histoire à partager
let histoireAPartager = null;

// Ouvre la modale de partage et affiche la liste des profils disponibles
async function ouvrirModalePartage() {
  const user = firebase.auth().currentUser;
  if (!user) {
    showMessageModal("Vous devez être connecté pour partager une histoire.");
    return;
  }

  // Récupère l'histoire actuellement affichée
  const titre = document.getElementById("titre-histoire-resultat").textContent;
  const contenu = document.getElementById("histoire").innerHTML;
  
  // Si aucune histoire n'est affichée, on ne fait rien
  if (!contenu) {
    showMessageModal("Aucune histoire à partager.");
    return;
  }

  // Stocke temporairement l'histoire à partager
  histoireAPartager = {
    titre: titre,
    contenu: contenu,
    images: Array.from(document.querySelectorAll("#histoire img")).map(img => img.src),
    partageParProfil: profilActif.type === "parent" ? null : profilActif.id,
    partageParPrenom: profilActif.type === "parent" ? null : profilActif.prenom
  };

  // Vide la liste des profils
  const listeEl = document.getElementById("liste-partage-profils");
  listeEl.innerHTML = "";

  try {
    // Récupère tous les profils enfants
    const enfantsSnap = await firebase.firestore()
      .collection("users")
      .doc(user.uid)
      .collection("profils_enfant")
      .get();

    // Si aucun profil enfant, affiche un message
    if (enfantsSnap.empty) {
      listeEl.innerHTML = "<p style='text-align:center;'>Aucun profil disponible pour le partage.</p>";
      document.getElementById("modal-partage").classList.add("show");
      return;
    }

    // Ajoute un bouton pour le parent (sauf si on est déjà le parent)
    if (profilActif.type === "enfant") {
      // Récupère le prénom du parent
      const docParent = await firebase.firestore()
        .collection("users")
        .doc(user.uid)
        .get();
      
      let prenomParent = "";
      if (docParent.exists && docParent.data().prenom) {
        prenomParent = docParent.data().prenom;
      } else {
        prenomParent = "Parent";
      }

      const btnParent = document.createElement("button");
      btnParent.className = "button button-blue";
      btnParent.textContent = prenomParent;
      btnParent.style.marginBottom = "0.75em";
      btnParent.onclick = () => partagerHistoire("parent", null, prenomParent);
      listeEl.appendChild(btnParent);
    }

    // Ajoute un bouton pour chaque profil enfant (sauf celui actif)
    enfantsSnap.forEach(docEnfant => {
      const data = docEnfant.data();
      // Ne pas afficher le profil actif
      if (profilActif.type === "enfant" && docEnfant.id === profilActif.id) return;

      const btn = document.createElement("button");
      btn.className = "button button-blue";
      btn.textContent = data.prenom;
      btn.style.marginBottom = "0.75em";
      btn.onclick = () => partagerHistoire("enfant", docEnfant.id, data.prenom);
      listeEl.appendChild(btn);
    });

    // Affiche la modale
    document.getElementById("modal-partage").classList.add("show");
  } catch (error) {
    showMessageModal("Erreur lors du chargement des profils : " + error.message);
  }
}

// Ferme la modale de partage
function fermerModalePartage() {
  document.getElementById("modal-partage").classList.remove("show");
  histoireAPartager = null;
}

// Partage l'histoire avec le profil sélectionné
async function partagerHistoire(type, id, prenom) {
  if (!histoireAPartager) {
    fermerModalePartage();
    return;
  }

  const user = firebase.auth().currentUser;
  if (!user) {
    showMessageModal("Vous devez être connecté pour partager une histoire.");
    fermerModalePartage();
    return;
  }

  try {
    // Détermine la collection cible selon le type de profil
    let targetRef;
    if (type === "parent") {
      targetRef = firebase.firestore()
        .collection("users")
        .doc(user.uid)
        .collection("stories");
    } else {
      targetRef = firebase.firestore()
        .collection("users")
        .doc(user.uid)
        .collection("profils_enfant")
        .doc(id)
        .collection("stories");
    }

    // Ajoute l'histoire partagée
    await targetRef.add({
      titre: histoireAPartager.titre,
      contenu: histoireAPartager.contenu,
      images: histoireAPartager.images,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      partageParProfil: histoireAPartager.partageParProfil,
      partageParPrenom: histoireAPartager.partageParPrenom,
      nouvelleHistoire: true // Marque l'histoire comme nouvelle pour la notification
    });

    // Si on partage avec un profil enfant, incrémente son compteur d'histoires
    if (type === "enfant") {
      const profilDocRef = firebase.firestore()
        .collection("users")
        .doc(user.uid)
        .collection("profils_enfant")
        .doc(id);
      
      await profilDocRef.update({
        nb_histoires: firebase.firestore.FieldValue.increment(1)
      });
    }

    // Log de l'activité
    logActivite("partage_histoire", { 
      destinataire_type: type,
      destinataire_id: id,
      destinataire_prenom: prenom
    });

    fermerModalePartage();
    showMessageModal(`Histoire partagée avec ${prenom} !`);
  } catch (error) {
    showMessageModal("Erreur lors du partage : " + error.message);
    fermerModalePartage();
  }
}

// ========== FONCTIONNALITÉS DE NOTIFICATION DE PARTAGE ==========

// Configure un écouteur en temps réel pour les nouvelles histoires partagées
function configurerEcouteurHistoiresPartagees() {
  // Arrête l'écouteur précédent s'il existe
  if (histoiresPartageesListener) {
    histoiresPartageesListener();
    histoiresPartageesListener = null;
  }

  const user = firebase.auth().currentUser;
  if (!user) return;
  
  // S'assure que le profilActif est correctement initialisé depuis localStorage
  if (!profilActif) {
    profilActif = localStorage.getItem("profilActif")
      ? JSON.parse(localStorage.getItem("profilActif"))
      : { type: "parent" };
  }

  // Détermine la collection à surveiller selon le profil actif
  let storiesRef;
  if (profilActif.type === "parent") {
    storiesRef = firebase.firestore()
      .collection("users")
      .doc(user.uid)
      .collection("stories")
      .where("nouvelleHistoire", "==", true);
  } else {
    storiesRef = firebase.firestore()
      .collection("users")
      .doc(user.uid)
      .collection("profils_enfant")
      .doc(profilActif.id)
      .collection("stories")
      .where("nouvelleHistoire", "==", true);
  }

  // Configure l'écouteur en temps réel
  histoiresPartageesListener = storiesRef.onSnapshot(snapshot => {
    // Vérifie s'il y a des changements
    const changesCount = snapshot.docChanges().length;
    if (changesCount === 0) return;

    // Parcourt les documents ajoutés ou modifiés
    snapshot.docChanges().forEach(change => {
      // Ne traite que les documents ajoutés
      if (change.type === "added") {
        const data = change.doc.data();
        
        if (data.partageParPrenom) {
          // Affiche la notification
          afficherNotificationPartage(data.partageParPrenom);
          
          // Marque l'histoire comme vue
          change.doc.ref.update({ nouvelleHistoire: false });
        }
      }
    });
  }, error => {
    console.error("Erreur lors de l'écoute des histoires partagées:", error);
  });
}

// Vérifie s'il y a des histoires partagées pour l'utilisateur connecté
async function verifierHistoiresPartagees() {
  const user = firebase.auth().currentUser;
  if (!user) return;

  // S'assure que le profilActif est correctement initialisé depuis localStorage
  if (!profilActif) {
    profilActif = localStorage.getItem("profilActif")
      ? JSON.parse(localStorage.getItem("profilActif"))
      : { type: "parent" };
  }

  try {
    // Détermine la collection à vérifier selon le profil actif
    let storiesRef;
    if (profilActif.type === "parent") {
      storiesRef = firebase.firestore()
        .collection("users")
        .doc(user.uid)
        .collection("stories")
        .where("nouvelleHistoire", "==", true)
        .limit(1);
    } else {
      storiesRef = firebase.firestore()
        .collection("users")
        .doc(user.uid)
        .collection("profils_enfant")
        .doc(profilActif.id)
        .collection("stories")
        .where("nouvelleHistoire", "==", true)
        .limit(1);
    }

    const snapshot = await storiesRef.get();
    
    if (!snapshot.empty) {
      // Il y a au moins une histoire partagée
      const doc = snapshot.docs[0];
      const data = doc.data();
      
      if (data.partageParPrenom) {
        // Affiche la notification
        afficherNotificationPartage(data.partageParPrenom);
        
        // Marque l'histoire comme vue
        doc.ref.update({ nouvelleHistoire: false });
      }
    }
    
    // Configure l'écouteur en temps réel pour les futures histoires partagées
    configurerEcouteurHistoiresPartagees();
  } catch (error) {
    console.error("Erreur lors de la vérification des histoires partagées:", error);
  }
}

// Affiche la notification de partage
function afficherNotificationPartage(prenomPartageur) {
  const notification = document.getElementById("notification-partage");
  const message = document.getElementById("notification-message");
  
  // Définit le message
  message.textContent = `${prenomPartageur} t'as partagé une histoire`;
  
  // Ajoute les écouteurs d'événements pour le swipe
  notification.addEventListener("touchstart", demarrerSwipeNotification, { passive: true });
  notification.addEventListener("touchmove", deplacerSwipeNotification, { passive: true });
  notification.addEventListener("touchend", terminerSwipeNotification, { passive: true });
  notification.addEventListener("mousedown", demarrerSwipeNotification);
  notification.addEventListener("mousemove", deplacerSwipeNotification);
  notification.addEventListener("mouseup", terminerSwipeNotification);
  notification.addEventListener("mouseleave", terminerSwipeNotification);
  
  // Ajoute l'écouteur pour le clic
  notification.addEventListener("click", clicNotificationPartage);
  
  // Affiche la notification avec animation
  notification.classList.add("animate-in");
  
  // Supprime la classe d'animation après qu'elle soit terminée
  setTimeout(() => {
    notification.classList.remove("animate-in");
    notification.classList.add("show");
  }, 500);
  
  // Ferme automatiquement la notification après 5 secondes
  notificationTimeout = setTimeout(() => {
    fermerNotificationPartage();
  }, 5000);
}

// Ferme la notification de partage
function fermerNotificationPartage() {
  const notification = document.getElementById("notification-partage");
  
  // Annule le timeout si existant
  if (notificationTimeout) {
    clearTimeout(notificationTimeout);
    notificationTimeout = null;
  }
  
  // Ajoute l'animation de sortie
  notification.classList.remove("show");
  notification.classList.add("animate-out");
  
  // Supprime les classes et les écouteurs après l'animation
  setTimeout(() => {
    notification.classList.remove("animate-out");
    
    // Supprime les écouteurs d'événements
    notification.removeEventListener("touchstart", demarrerSwipeNotification);
    notification.removeEventListener("touchmove", deplacerSwipeNotification);
    notification.removeEventListener("touchend", terminerSwipeNotification);
    notification.removeEventListener("mousedown", demarrerSwipeNotification);
    notification.removeEventListener("mousemove", deplacerSwipeNotification);
    notification.removeEventListener("mouseup", terminerSwipeNotification);
    notification.removeEventListener("mouseleave", terminerSwipeNotification);
    notification.removeEventListener("click", clicNotificationPartage);
  }, 500);
}

// Gestion du swipe - Début
function demarrerSwipeNotification(e) {
  // Annule le timeout automatique
  if (notificationTimeout) {
    clearTimeout(notificationTimeout);
    notificationTimeout = null;
  }
  
  // Enregistre la position de départ
  if (e.type === "touchstart") {
    notificationSwipeStartX = e.touches[0].clientX;
    notificationSwipeStartY = e.touches[0].clientY;
  } else {
    notificationSwipeStartX = e.clientX;
    notificationSwipeStartY = e.clientY;
  }
}

// Gestion du swipe - Déplacement
function deplacerSwipeNotification(e) {
  // Ne fait rien si on n'a pas commencé un swipe
  if (notificationSwipeStartX === 0 && notificationSwipeStartY === 0) return;
  
  let currentX, currentY;
  
  if (e.type === "touchmove") {
    currentX = e.touches[0].clientX;
    currentY = e.touches[0].clientY;
  } else {
    currentX = e.clientX;
    currentY = e.clientY;
  }
  
  // Calcule la distance parcourue
  const distanceX = Math.abs(currentX - notificationSwipeStartX);
  const distanceY = Math.abs(currentY - notificationSwipeStartY);
  
  // Si la distance est suffisante, ferme la notification
  if (distanceX > 50 || distanceY > 50) {
    fermerNotificationPartage();
    
    // Réinitialise les positions
    notificationSwipeStartX = 0;
    notificationSwipeStartY = 0;
  }
}

// Gestion du swipe - Fin
function terminerSwipeNotification() {
  // Réinitialise les positions
  notificationSwipeStartX = 0;
  notificationSwipeStartY = 0;
}

// Gestion du clic sur la notification
function clicNotificationPartage(e) {
  // Empêche la propagation du clic
  e.preventDefault();
  e.stopPropagation();
  
  // Ferme la notification
  fermerNotificationPartage();
  
  // Redirige vers "Mes histoires"
  showScreen("mes-histoires");
}
