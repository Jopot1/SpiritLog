
import { initializeApp } from 'firebase/app';
import { getAnalytics } from "firebase/analytics";
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager,
  collection
} from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

/**
 * CONFIGURATION FIREBASE
 * Remplace ces valeurs par celles fournies dans ta console Firebase.
 */
const firebaseConfig = {
  apiKey: "AIzaSyDPrJ2NLkMAuziYvyF0G1nsa2SH14kRosk",
  authDomain: "rhum-testing.firebaseapp.com",
  projectId: "rhum-testing",
  storageBucket: "rhum-testing.firebasestorage.app",
  messagingSenderId: "337106300340",
  appId: "1:337106300340:web:6a9488aa958e55921fd6e1",
  measurementId: "G-LHBQBL9DLN"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Fonctions d'aide pour obtenir les collections spécifiques à l'utilisateur
export const getUserDoc = (uid: string) => `users/${uid}`;
export const getMembersCol = (uid: string) => collection(db, `users/${uid}/members`);
export const getRumsCol = (uid: string) => collection(db, `users/${uid}/rums`);
export const getTastingsCol = (uid: string) => collection(db, `users/${uid}/tastings`);
