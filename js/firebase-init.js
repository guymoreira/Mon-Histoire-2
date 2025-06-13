// Configuration et initialisation de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBZdLStt6vpHY1pI5lHnPhwGQxFY4LPEQk",
  authDomain: "monhistoire-3.firebaseapp.com",
  projectId: "monhistoire-3",
  storageBucket: "monhistoire-3.firebasestorage.app",
  messagingSenderId: "936891025632",
  appId: "1:936891025632:web:3672fd54638abfedf5e885",
  measurementId: "G-TQ8F3CBX74",
  databaseURL: "https://monhistoire-3-default-rtdb.europe-west1.firebasedatabase.app"
};

// Initialisation de Firebase
firebase.initializeApp(firebaseConfig);

// Activation de Firebase Analytics si configuré
if ('measurementId' in firebaseConfig) {
  firebase.analytics();
}

// Configuration du cache Firestore
firebase.firestore().settings({
  cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED
});

// Activer la persistance Firestore pour le mode hors ligne
// Cela doit être fait avant toute autre opération Firestore
firebase.firestore().enablePersistence({
  synchronizeTabs: true // Synchronisation entre onglets
}).then(() => {
  console.log("Persistence Firestore activée avec succès");
}).catch((err) => {
  if (err.code === 'failed-precondition') {
    // Plusieurs onglets ouverts, la persistance ne peut être activée que dans un seul
    console.warn("La persistance ne peut pas être activée car plusieurs onglets sont ouverts");
  } else if (err.code === 'unimplemented') {
    // Le navigateur ne prend pas en charge la persistance
    console.warn("Ce navigateur ne prend pas en charge la persistance Firestore");
  } else {
    console.error("Erreur lors de l'activation de la persistance:", err);
  }
});
