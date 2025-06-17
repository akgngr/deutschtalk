
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
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

if (process.env.NODE_ENV === 'development') {
  // Ensure this block runs for both client and server-side evaluations in dev.
  // The Firebase SDK methods for connecting to emulators are typically idempotent.
  // Using a global flag to prevent multiple connection logs from HMR on client or multiple server action calls.
  try {
    // @ts-ignore - Check if a global flag is set to avoid re-logging connection attempts excessively
    if (!globalThis._firebaseEmulatorsConnectedAttempted) {
      console.log("Attempting to connect to Firebase Emulators for development...");
      
      // @ts-ignore - Check internal emulatorConfig to see if already connected by this instance
      if (!auth.emulatorConfig) {
        connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
      }
      // @ts-ignore - _settings can indicate emulator connection for Firestore
      if (!db['_settings'] || !db['_settings'].host?.includes('localhost')) {
         connectFirestoreEmulator(db, 'localhost', 8080);
      }
      // @ts-ignore - Check internal _protocol or a similar heuristic for Storage
      if (!storage['_protocol']?.includes('http:')) { // Live uses https, emulator typically http
        connectStorageEmulator(storage, 'localhost', 9199);
      }
      console.log("Firebase Emulators connection attempts complete. If emulators are running, they should be connected.");
      // @ts-ignore - Set the global flag
      globalThis._firebaseEmulatorsConnectedAttempted = true;
    }
  } catch (error) {
    console.warn(
        "Warning: Error attempting to connect to Firebase emulators. " +
        "This might be expected if emulators are not running. " +
        "The application will attempt to connect to live Firebase services. Details:",
        error
    );
  }
}

export { app, auth, db, storage, googleProvider };
