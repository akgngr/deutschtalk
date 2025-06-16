
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
  !apiKey || // Catches undefined, null, or empty string ""
  apiKey.trim() === "" || // Catches whitespace-only strings
  apiKey.endsWith(placeholderSuffix) ||
  apiKey === simplePlaceholderApiKey ||
  apiKey.startsWith(newProminentPlaceholderPrefix) ||
  apiKey === "FIREBASE_API_KEY_PLACEHOLDER" // Legacy check
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
  measurementId, // Optional
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
// const analytics = getAnalytics(app); // Optional

// Setup emulators if running in development
// Important: Ensure these are not run in production
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  // Check if already connected to avoid re-connecting (HMR can cause this)
  // Note: Firebase SDK doesn't provide a direct way to check if emulator is connected.
  // This is a simple guard. For robust HMR, manage connection state.
  // For now, we assume they are not connected on first load in dev.
  // try {
  //   connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
  //   connectFirestoreEmulator(db, 'localhost', 8080);
  //   connectStorageEmulator(storage, 'localhost', 9199);
  //   console.log("Firebase Emulators connected for development.");
  // } catch (error) {
  //   console.warn("Error connecting to Firebase emulators. They might already be connected or not running.", error);
  // }
}


export { app, auth, db, storage, googleProvider };
