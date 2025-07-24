import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import { getDatabase, type Database } from "firebase/database";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? `https://${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}-default-rtdb.firebaseio.com` : undefined,
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;
let rtdb: Database | null = null;

// This flag checks if all the public Firebase keys are present.
// It's used to determine if the app should run in "offline mode".
export const isFirebaseEnabled =
  !!firebaseConfig.apiKey &&
  !!firebaseConfig.authDomain &&
  !!firebaseConfig.projectId &&
  !!firebaseConfig.storageBucket &&
  !!firebaseConfig.messagingSenderId &&
  !!firebaseConfig.appId;

// Server-side check for all required secrets (including GOOGLE_API_KEY)
export const areAllSecretsConfigured = () => {
  // This should only run on the server side
  if (typeof window !== 'undefined') {
    return true; // On client side, assume secrets are configured
  }
  
  const requiredSecrets = [
    process.env.GOOGLE_API_KEY,
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  ];
  
  return requiredSecrets.every(secret => !!secret);
};
if (isFirebaseEnabled) {
  // Initialize Firebase only if all keys are present.
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
  rtdb = firebaseConfig.databaseURL ? getDatabase(app) : null;
} else {
  // Log a warning in the server console if Firebase is not configured.
  // This is helpful for debugging deployment issues.
  if (typeof window === 'undefined') {
    console.warn("Firebase is not enabled. Missing one or more NEXT_PUBLIC_FIREBASE_* environment variables.");
  }
}

export { app, auth, db, storage, rtdb };
