
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

// --- TEMPORARY HARD-CODED CONFIGURATION ---
// This is a temporary workaround to bypass the cloud environment issue.
// WARNING: This is not secure for a real production app.
// Please replace the placeholder values with your actual Firebase project configuration.
// You can find these values in your Firebase project settings under "Your apps".
const firebaseConfig = {
  apiKey: "YOUR_API_KEY_HERE", // Found in Project Settings -> General
  authDomain: "lokal-reels.firebaseapp.com",
  projectId: "lokal-reels",
  storageBucket: "lokal-reels.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID_HERE", // Found in Project Settings -> Cloud Messaging
  appId: "1:726672636556:web:a24c1d6bcb21d9c5a199a9",
};

// This logic checks if all the placeholder values have been replaced.
const isProperlyConfigured = 
    firebaseConfig.apiKey &&
    firebaseConfig.apiKey !== "YOUR_API_KEY_HERE" &&
    firebaseConfig.messagingSenderId &&
    firebaseConfig.messagingSenderId !== "YOUR_MESSAGING_SENDER_ID_HERE";

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;

// Export a flag to check if Firebase is configured.
// It's true if and only if all the public Firebase keys are present.
export const isFirebaseEnabled = isProperlyConfigured;

if (isFirebaseEnabled) {
  // Initialize Firebase only if the config is filled out.
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
}

export { app, auth, db, storage };
