
"use server";

import { auth, db, googleProvider } from '@/lib/firebase';
import type { LoginFormData, RegisterFormData } from '@/lib/validators';
import type { UserProfile } from '@/types';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, signOut, updateProfile as updateFirebaseProfile } from 'firebase/auth';
import { doc, serverTimestamp, setDoc, getDoc } from 'firebase/firestore';

async function createUserProfile(userId: string, email: string, displayName?: string, photoURL?: string): Promise<UserProfile> {
  const userDocRef = doc(db, 'users', userId);
  const userProfileData: UserProfile = {
    uid: userId,
    email,
    displayName: displayName || null,
    photoURL: photoURL || null,
    bio: '',
    germanLevel: null,
    isLookingForMatch: false,
    currentMatchId: null,
    createdAt: serverTimestamp() as any, // Will be converted by Firestore
    updatedAt: serverTimestamp() as any, // Will be converted by Firestore
  };
  await setDoc(userDocRef, userProfileData);
  return {
    ...userProfileData,
    // Simulate serverTimestamp resolution for immediate use
    createdAt: new Date() as any, 
    updatedAt: new Date() as any,
  };
}

export async function signUpWithEmail(data: RegisterFormData) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
    const user = userCredential.user;
    await updateFirebaseProfile(user, { displayName: data.displayName });
    const profile = await createUserProfile(user.uid, user.email!, data.displayName, user.photoURL);
    return { success: true, userId: user.uid, profile };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function signInWithEmail(data: LoginFormData) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
    const user = userCredential.user;
    // Ensure profile exists or fetch it
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);
    let profile;
    if (userDoc.exists()) {
      profile = userDoc.data() as UserProfile;
    } else {
      // This case should ideally not happen if profile is created on sign-up
      // For robustness, create if missing.
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
    // Check if user profile exists, create if not
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);
    let profile;
    if (userDoc.exists()) {
       profile = userDoc.data() as UserProfile;
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
