import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getDatabase } from 'firebase/database';
import { getAnalytics, isSupported } from 'firebase/analytics';

// Firebase configuration
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

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
const auth = getAuth(app);
const firestore = getFirestore(app);
const storage = getStorage(app);
const database = getDatabase(app);

// Set up analytics conditionally
let analytics = null;
isSupported().then(supported => {
  if (supported) {
    analytics = getAnalytics(app);
  }
}).catch(error => {
  console.warn('Firebase Analytics not supported:', error);
});

// Enable persistence for Firestore
enableIndexedDbPersistence(firestore)
  .then(() => {
    console.log('Firestore persistence enabled');
  })
  .catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
    } else if (err.code === 'unimplemented') {
      console.warn('The current browser does not support all of the features required to enable persistence');
    } else {
      console.error('Error enabling Firestore persistence:', err);
    }
  });

// Enable persistence for Auth
setPersistence(auth, browserLocalPersistence)
  .then(() => {
    console.log('Auth persistence enabled');
  })
  .catch((error) => {
    console.error('Error enabling Auth persistence:', error);
  });

export { app, auth, firestore, storage, database, analytics };