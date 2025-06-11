import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

console.log("FIREBASE CONFIG:", firebaseConfig);

if (Object.values(firebaseConfig).some(v => !v)) {
  throw new Error("Missing Firebase config value: " + JSON.stringify(firebaseConfig));
}

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

// REMOVE the custom host/ssl config
const db = getFirestore(app);

const auth = getAuth(app);
const googleAuthProvider = new GoogleAuthProvider();

export { app, auth, db, googleAuthProvider };
