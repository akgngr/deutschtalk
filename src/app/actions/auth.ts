
"use server";

import { auth, db, googleProvider } from '@/lib/firebase';
import type { LoginFormData, RegisterFormData } from '@/lib/validators';
import type { UserProfile } from '@/types';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, signOut, updateProfile as updateFirebaseProfile } from 'firebase/auth';
import { doc, serverTimestamp, setDoc, getDoc, type Timestamp } from 'firebase/firestore';

async function createUserProfile(userId: string, email: string, displayName?: string, photoURL?: string): Promise<UserProfile> {
  const userDocRef = doc(db, 'users', userId);
  
  // Data to be stored in Firestore (with serverTimestamps)
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

  // Data to be returned to client (with ISO strings for dates)
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

export async function signUpWithEmail(data: RegisterFormData) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
    const user = userCredential.user;
    await updateFirebaseProfile(user, { displayName: data.displayName });
    // createUserProfile now returns a UserProfile with ISO date strings
    const profile = await createUserProfile(user.uid, user.email!, data.displayName, user.photoURL);
    return { success: true, userId: user.uid, profile };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

function serializeProfile(data: any, user: { uid: string; email: string | null; displayName?: string | null; photoURL?: string | null; }): UserProfile {
  const createdAtTimestamp = data.createdAt as Timestamp | undefined;
  const updatedAtTimestamp = data.updatedAt as Timestamp | undefined;
  return {
    uid: user.uid, // Use authenticated user's UID
    email: user.email, // Use authenticated user's email
    displayName: data.displayName || user.displayName || null,
    photoURL: data.photoURL || user.photoURL || null,
    bio: data.bio || '',
    germanLevel: data.germanLevel || null,
    isLookingForMatch: data.isLookingForMatch || false,
    currentMatchId: data.currentMatchId || null,
    createdAt: createdAtTimestamp?.toDate().toISOString() || new Date().toISOString(),
    updatedAt: updatedAtTimestamp?.toDate().toISOString() || new Date().toISOString(),
    fcmTokens: data.fcmTokens || [],
  };
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
      profile = await createUserProfile(user.uid, user.email!, user.displayName || undefined, user.photoURL || undefined);
    }
    return { success: true, userId: user.uid, profile };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);
    let profile: UserProfile;

    if (userDoc.exists()) {
      profile = serializeProfile(userDoc.data(), user);
    } else {
      profile = await createUserProfile(user.uid, user.email!, user.displayName || undefined, user.photoURL || undefined);
    }
    return { success: true, userId: user.uid, profile };
  } catch (error: any) {
    return { success: false, error: error.message };
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
