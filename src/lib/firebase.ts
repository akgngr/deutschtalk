
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
// import { getAnalytics } from "firebase/analytics"; // Optional: if you use analytics

const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
const messagingSenderId = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;
const measurementId = process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID;

const placeholderSuffix = "_PLACEHOLDER";
const simplePlaceholderApiKey = "YOUR_API_KEY"; // Older placeholder
const newProminentPlaceholderPrefix = "!!!_REPLACE_WITH_YOUR_ACTUAL_"; // New placeholder

if (
  !apiKey || 
  apiKey.trim() === "" || 
  apiKey.endsWith(placeholderSuffix) ||
  apiKey === simplePlaceholderApiKey ||
  apiKey.startsWith(newProminentPlaceholderPrefix) ||
  apiKey === "FIREBASE_API_KEY_PLACEHOLDER"
) {
  throw new Error(
    'Firebase API Key is missing, a placeholder (e.g., "!!!_REPLACE_WITH_YOUR_ACTUAL_FIREBASE_API_KEY_!!!"), or invalid. ' +
    'Please ensure NEXT_PUBLIC_FIREBASE_API_KEY is set with your actual Firebase API key in the .env file. ' +
    'You can find this in your Firebase project settings: Project settings > General > Your apps > Web app SDK snippet. ' +
    'After updating .env, you may need to restart your Next.js development server.'
  );
}

const firebaseConfig = {
  apiKey,
  authDomain,
  projectId,
  storageBucket,
  messagingSenderId,
  appId,
  measurementId, 
};

let app: FirebaseApp;

if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();

// Module-scoped flag to prevent multiple connection attempts, especially with HMR.
let emulatorsConnected = false;

if (process.env.NODE_ENV === 'development') {
  if (!emulatorsConnected) {
    try {
      console.log('[Firebase/Dev] Attempting to connect to Firebase Emulators...');
      
      connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
      console.log('[Firebase/Dev] Auth Emulator connected to http://localhost:9099');

      connectFirestoreEmulator(db, 'localhost', 8080);
      console.log('[Firebase/Dev] Firestore Emulator connected to localhost:8080');

      connectStorageEmulator(storage, 'localhost', 9199);
      console.log('[Firebase/Dev] Storage Emulator connected to localhost:9199');
      
      emulatorsConnected = true;
      console.log('[Firebase/Dev] Successfully connected to all Firebase Emulators.');

    } catch (error: any) {
      console.warn(
        `[Firebase/Dev] WARNING: Could not connect to Firebase Emulators. This is normal if you have not started them. The application will fall back to live Firebase services.\n` +
        `To use the local emulators, run 'firebase emulators:start' in your project's root directory.\n` +
        `Full error: ${error.message}`
      );
      // Set flag to true to prevent repeated connection attempts on failure.
      emulatorsConnected = true;
    }
  }
}


export { app, auth, db, storage, googleProvider };
