// app.js
const MAX_HISTOIRES = 5; // Change cette valeur pour la limite souhaitée
const SEUIL_ALERTE_HISTOIRES = 4; // passe en rouge à partir de 4/5 (ajuste si tu veux)
let resultatSource = "formulaire"; // Par défaut
// (le reste de tes variables globales)

firebase.auth().useDeviceLanguage();

const firebaseErrorMessages = {
  "auth/email-already-in-use": "Cette adresse e-mail est déjà utilisée.",
  "auth/invalid-email": "L'adresse e-mail n'est pas valide.",
  "auth/user-disabled": "Ce compte utilisateur a été désactivé.",
  "auth/user-not-found": "Aucun compte trouvé avec cet e-mail.",
  "auth/wrong-password": "Le mot de passe est incorrect.",
  "auth/weak-password": "Le mot de passe est trop faible (minimum 6 caractères).",
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
let currentScreen  = "accueil";
let previousScreen = null;

// Affiche un écran, mémorise l’historique et gère le bouton “Sauvegarder”
function showScreen(screen) {
  if (screen === currentScreen) return;
  previousScreen = currentScreen;
  // masque tous les écrans actifs
  document.querySelectorAll('.screen.active')
          .forEach(el => el.classList.remove('active'));
  // affiche le nouvel écran
  document.getElementById(screen).classList.add('active');
  currentScreen = screen;

  // cas spécial Résultat : affiche ou cache le bouton “Sauvegarder”
if (screen === "resultat") {
  const btn = document.getElementById("btn-sauvegarde");
  // Affiche le bouton sauvegarde uniquement si connecté ET si on vient du formulaire de création
  if (firebase.auth().currentUser && resultatSource === "formulaire") {
    btn.style.display = "inline-block";
  } else {
    btn.style.display = "none";
  }
}


  // cas particulier : si c’est Mes Histoires, on rafraîchit la liste
if (screen === "mes-histoires") {
  afficherHistoiresSauvegardees();
  // Affiche le bouton Accueil seulement si tu viens de "resultat"
  const btnAccueil = document.getElementById("btn-accueil-mes-histoires");
  const group = document.getElementById("mes-histoires-actions");
  if (previousScreen === "resultat") {
    btnAccueil.style.display = "inline-block";
    group.classList.remove('single');
  } else {
    btnAccueil.style.display = "none";
    group.classList.add('single');
  }
}
}
/** Bouton “Retour” : revient à l’écran précédent (ou accueil par défaut) */
function goBack() {
  showScreen(previousScreen || "accueil");
}

/**
 * Bascule l’affichage d’une “screen” sans délai ni flash.
 */

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
      showScreen("accueil");
    })
    .catch((error) => {
      const msg = firebaseErrorMessages[error.code] || error.message;
      showMessageModal(msg);
    });
}


function logoutUser() {
  firebase.auth().signOut().then(() => {
    afficherUtilisateurDéconnecté();
    document.getElementById("logout-modal").style.display = "none";
    showScreen("accueil");
  });
}


function afficherUtilisateurConnecté() {
  document.getElementById("user-icon").classList.remove("hidden");
  document.getElementById("login-button").classList.add("hidden");
  document.getElementById("my-stories-button").classList.remove("hidden");

  // Récupère l'utilisateur connecté
  const user = firebase.auth().currentUser;
  if (user) {
    // Récupère le prénom stocké dans Firestore (ou affiche l'initiale de l'email sinon)
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
        // En cas d'erreur, affiche l'initiale de l'email
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

async function genererHistoire() {
  const nom = document.getElementById("nom").value.trim();
  const personnage = document.getElementById("personnage").value;
  const lieu = document.getElementById("lieu").value;
  const style = document.getElementById("style").value;
  const tranche_age = document.getElementById("tranche_age").value;

  const user = firebase.auth().currentUser;
  if (!user) {
    showMessageModal("Veuillez vous connecter pour lancer une histoire.");
    return;
  }

  // Clé unique pour la combinaison de filtres
  const filtresKey = `${personnage}|${lieu}|${style}|${tranche_age}`;
  const histoiresLuesRef = firebase.firestore()
    .collection("users")
    .doc(user.uid)
    .collection("histoires_lues")
    .doc(filtresKey);

  // Récupérer la liste des histoires déjà lues pour ces filtres
  let lues = [];
  try {
    const luesDoc = await histoiresLuesRef.get();
    if (luesDoc.exists && Array.isArray(luesDoc.data().ids)) {
      lues = luesDoc.data().ids;
    }
  } catch (e) {
    lues = [];
  }

  // Récupérer toutes les histoires disponibles dans le stock IA
  let query = firebase.firestore().collection("stock_histoires")
    .where("personnage", "==", personnage)
    .where("lieu", "==", lieu)
    .where("style", "==", style)
    .where("tranche_age", "==", tranche_age);

  try {
    const snap = await query.get();
    if (snap.empty) {
      showMessageModal("Aucune histoire trouvée avec ces critères. Essaie d'autres filtres !");
      return;
    }

    // Liste des histoires possibles
    const stories = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Trouve la première histoire jamais lue
    let histoire = stories.find(st => !lues.includes(st.id));
    if (!histoire) {
      // Toutes lues, on remet à zéro
      lues = [];
      histoire = stories[0];
    }

    // Ajoute l'id à la liste et mets à jour Firestore
    if (!lues.includes(histoire.id)) {
      lues.push(histoire.id);
      await histoiresLuesRef.set({ ids: lues }, { merge: true });
    }

    // Affichage de l'histoire
    let html = "";
    histoire.chapitres.forEach((chap, idx) => {
      html += `<h3>${chap.titre || "Chapitre " + (idx+1)}</h3>`;
      let texte = chap.texte.replace(/\b\w+\b/, nom);
      html += `<p>${texte}</p>`;
      if (chap.image) {
        html += `<div class="illustration-chapitre"><img src="${chap.image}" alt=""></div>`;
      }
    });
    document.getElementById("histoire").innerHTML = html;
    document.getElementById("titre-histoire-resultat").textContent = histoire.titre || "Mon Histoire";
    resultatSource = "formulaire";
    showScreen("resultat");
  } catch (e) {
    showMessageModal("Erreur lors de la recherche de l'histoire : " + e.message);
  }
}

// Fonction de contrôle de complexité du mot de passe
function isPasswordSecure(password) {
  // Minimum 8 caractères, au moins 1 majuscule, 1 chiffre, 1 caractère spécial
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[!@#$%^&*(),.?":{}|<>]/.test(password)
  );
}

function registerUser() {
  const prenom  = document.getElementById("prenom").value.trim();
  const email   = document.getElementById("signup-email").value.trim();
  const password= document.getElementById("signup-password").value;
  const confirm = document.getElementById("signup-confirm").value;

  if (!prenom || !email || !password || !confirm) {
    showMessageModal("Merci de remplir tous les champs.");
    return;
  }
  if (password !== confirm) {
    showMessageModal("Les mots de passe ne correspondent pas.");
    return;
  }
  if (!isPasswordSecure(password)) {
    showMessageModal("Ton mot de passe doit contenir au moins 8 caractères, une majuscule, un chiffre et un caractère spécial.");
    return;
  }

  // Firebase Auth
  firebase.auth().createUserWithEmailAndPassword(email, password)
    .then((userCredential) => {
      const user = userCredential.user;
      return firebase.firestore().collection("users").doc(user.uid).set({
        prenom: prenom,
        email: email,
        createdAt: new Date().toISOString()
      });
    })
    .then(() => {
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
  const titre = document.getElementById("titre-histoire-resultat").textContent || "Titre de Mon Histoire";
  const images = Array.from(document.querySelectorAll("#histoire img")).map(img => img.src);

  try {
    await firebase.firestore()
      .collection("users")
      .doc(user.uid)
      .collection("stories")
      .add({
        titre: titre,
        contenu: contenu,
        images: images,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      });

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
    const snap = await firebase.firestore()
      .collection("users")
      .doc(user.uid)
      .collection("stories")
      .get();

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
    const snap = await firebase.firestore()
      .collection("users")
      .doc(user.uid)
      .collection("stories")
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
      li.innerHTML = `<button class="button">${data.titre || "Sans titre"}</button>`;
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
    const doc = await firebase.firestore()
      .collection("users")
      .doc(user.uid)
      .collection("stories")
      .doc(storyId)
      .get();

if (doc.exists) {
  document.getElementById("histoire").innerHTML = doc.data().contenu;
  document.getElementById("titre-histoire-resultat").textContent = doc.data().titre || "Titre de Mon Histoire";
  resultatSource = "mes-histoires";
  showScreen("resultat");
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
    await firebase.firestore()
      .collection("users")
      .doc(user.uid)
      .collection("stories")
      .doc(storyId)
      .delete();
  }
  reinitialiserSelectionHistoires();
  afficherHistoiresSauvegardees();
  document.getElementById("delete-modal").classList.remove("show");
  showScreen("mes-histoires");
}

function openDeleteAccountModal() {
  document.getElementById('logout-modal').style.display = 'none';
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
    await firebase.firestore()
      .collection("users")
      .doc(user.uid)
      .collection("stories")
      .doc(storyId)
      .update({ titre: nouveauTitre });
    fermerModaleRenommer();
    afficherHistoiresSauvegardees();
    reinitialiserSelectionHistoires();
    showMessageModal("Titre modifié !");
  } catch (error) {
    showMessageModal("Erreur lors du renommage : " + error.message);
  }
}
function exporterPDF() {
  const { jsPDF } = window.jspdf;
  const titre = document.getElementById("titre-histoire-resultat").textContent || "Mon Histoire";
  const histoireElem = document.getElementById("histoire");
  const pdf = new jsPDF('p', 'mm', 'a4');
  let y = 20;

  pdf.setFontSize(18);
  pdf.text(titre, 12, y);
  y += 10;

  // On récupère chaque bloc de l’histoire
  histoireElem.childNodes.forEach(node => {
    if (node.nodeType === 1) {
      if (node.tagName.toLowerCase() === "h3") {
        pdf.setFontSize(15);
        y += 10;
        if (y > 270) { pdf.addPage(); y = 20; }
        pdf.text(node.textContent, 12, y);
      }
      if (node.tagName.toLowerCase() === "p") {
        pdf.setFontSize(12);
        y += 7;
        if (y > 280) { pdf.addPage(); y = 20; }
        let split = pdf.splitTextToSize(node.textContent, 180);
        pdf.text(split, 12, y);
        y += (split.length * 6);
      }
      if (node.classList && node.classList.contains('illustration-chapitre')) {
        const img = node.querySelector("img");
        if (img) {
          y += 5;
          if (y > 210) { pdf.addPage(); y = 20; }
          // Crée une image temporaire pour jsPDF (attention à l’asynchrone !)
          let imgData;
          try {
            const canvas = document.createElement("canvas");
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0);
            imgData = canvas.toDataURL("image/png");
          } catch (e) { imgData = null; }
          if (imgData) {
            pdf.addImage(imgData, "PNG", 25, y, 70, 40);
            y += 45;
          }
        }
      }
    }
  });

  pdf.save((titre.replace(/[^a-z0-9]/gi, '_').toLowerCase() || "mon_histoire") + '.pdf');
}
