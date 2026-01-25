
import { initializeApp } from 'firebase/app';
import { getAnalytics } from "firebase/analytics";
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager,
  collection
} from 'firebase/firestore';

/**
 * CONFIGURATION FIREBASE
 * Remplace ces valeurs par celles fournies dans ta console Firebase :
 * https://console.firebase.google.com/
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

// Initialisation de Firestore avec le nouveau système de cache persistant (Auto-géré)
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});

// Références de collections
export const usersCol = collection(db, 'users');
export const rumsCol = collection(db, 'rums');
export const tastingsCol = collection(db, 'tastings');
