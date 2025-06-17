
"use server";

import { auth, db } from '@/lib/firebase'; // googleProvider is not used directly in server actions anymore for popup
import type { LoginFormData, RegisterFormData } from '@/lib/validators';
import type { UserProfile } from '@/types';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile as updateFirebaseProfile } from 'firebase/auth';
import { doc, serverTimestamp, setDoc, getDoc, type Timestamp } from 'firebase/firestore';

// This function creates the profile in Firestore and returns a client-friendly UserProfile object
async function createUserProfile(userId: string, email: string, displayName?: string, photoURL?: string): Promise<UserProfile> {
  const userDocRef = doc(db, 'users', userId);
  
  const profileDataForFirestore = {
    uid: userId,
    email,
    displayName: displayName || null,
    photoURL: photoURL || null,
    bio: '',
    germanLevel: null,
    isLookingForMatch: false,
    currentMatchId: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    fcmTokens: [],
  };
  await setDoc(userDocRef, profileDataForFirestore);

  const now = new Date().toISOString();
  return {
    uid: userId,
    email,
    displayName: displayName || null,
    photoURL: photoURL || null,
    bio: '',
    germanLevel: null,
    isLookingForMatch: false,
    currentMatchId: null,
    createdAt: now, 
    updatedAt: now,
    fcmTokens: [],
  };
}

// This function serializes a Firestore document and authenticated user data into a client-friendly UserProfile object
function serializeProfile(firestoreData: any, authUserData: { uid: string; email: string | null; displayName?: string | null; photoURL?: string | null; }): UserProfile {
  const createdAtTimestamp = firestoreData.createdAt as Timestamp | undefined;
  const updatedAtTimestamp = firestoreData.updatedAt as Timestamp | undefined;
  return {
    uid: authUserData.uid,
    email: authUserData.email,
    displayName: firestoreData.displayName || authUserData.displayName || null,
    photoURL: firestoreData.photoURL || authUserData.photoURL || null,
    bio: firestoreData.bio || '',
    germanLevel: firestoreData.germanLevel || null,
    isLookingForMatch: firestoreData.isLookingForMatch || false,
    currentMatchId: firestoreData.currentMatchId || null,
    createdAt: createdAtTimestamp?.toDate().toISOString() || new Date().toISOString(),
    updatedAt: updatedAtTimestamp?.toDate().toISOString() || new Date().toISOString(),
    fcmTokens: firestoreData.fcmTokens || [],
  };
}

export async function signUpWithEmail(data: RegisterFormData) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
    const user = userCredential.user;
    await updateFirebaseProfile(user, { displayName: data.displayName });
    const profile = await createUserProfile(user.uid, user.email!, data.displayName, user.photoURL || undefined);
    return { success: true, userId: user.uid, profile };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function signInWithEmail(data: LoginFormData) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
    const user = userCredential.user;
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);
    let profile: UserProfile;

    if (userDoc.exists()) {
      profile = serializeProfile(userDoc.data(), user);
    } else {
      // This case should ideally not happen if sign-up always creates a profile.
      // However, as a fallback, create one.
      profile = await createUserProfile(user.uid, user.email!, user.displayName || undefined, user.photoURL || undefined);
    }
    return { success: true, userId: user.uid, profile };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// New Server Action to handle user data after client-side Google Sign-In
export async function handleGoogleUser(userData: { uid: string; email: string | null; displayName?: string | null; photoURL?: string | null; }) {
  try {
    const userDocRef = doc(db, 'users', userData.uid);
    const userDoc = await getDoc(userDocRef);
    let profile: UserProfile;

    if (userDoc.exists()) {
      // User profile exists, serialize and return it
      profile = serializeProfile(userDoc.data(), userData);
    } else {
      // User profile doesn't exist, create it
      profile = await createUserProfile(userData.uid, userData.email!, userData.displayName || undefined, userData.photoURL || undefined);
    }
    return { success: true, userId: userData.uid, profile };
  } catch (error: any) {
    console.error("Error in handleGoogleUser:", error);
    return { success: false, error: error.message || "Failed to process Google user data." };
  }
}

export async function signOutUser() {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
