
"use " + "server"; // Ensure this is a server action

import { auth, db, storage } from '@/lib/firebase';
import type { ProfileUpdateFormData } from '@/lib/validators';
import type { UserProfile } from '@/types';
import { doc, serverTimestamp, updateDoc, getDoc, type Timestamp } from 'firebase/firestore'; // Import Timestamp
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { updateProfile as updateFirebaseProfile } from 'firebase/auth';

export async function updateUserProfile(userId: string, data: ProfileUpdateFormData) {
  if (auth.currentUser?.uid !== userId) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const userDocRef = doc(db, 'users', userId);
    // Data for Firestore update
    const updateDataForFirestore: any = { // Use 'any' temporarily for serverTimestamp
      updatedAt: serverTimestamp(),
    };

    if (data.displayName) {
      updateDataForFirestore.displayName = data.displayName;
      if (auth.currentUser && auth.currentUser.uid === userId) {
        await updateFirebaseProfile(auth.currentUser, { displayName: data.displayName });
      }
    }
    if (data.bio !== undefined) {
      updateDataForFirestore.bio = data.bio;
    }
    if (data.germanLevel !== undefined) {
      updateDataForFirestore.germanLevel = data.germanLevel;
    }
    
    await updateDoc(userDocRef, updateDataForFirestore);
    
    const updatedDocSnap = await getDoc(userDocRef);
    if (!updatedDocSnap.exists()) {
        throw new Error("User profile not found after update.");
    }
    const docData = updatedDocSnap.data();
    const createdAtTimestamp = docData.createdAt as Timestamp | undefined;
    const updatedAtTimestamp = docData.updatedAt as Timestamp | undefined;

    const updatedProfile: UserProfile = {
      uid: userId,
      email: docData.email || auth.currentUser?.email || null, // Get email from docData or auth
      displayName: docData.displayName || null,
      photoURL: docData.photoURL || null,
      bio: docData.bio || '',
      germanLevel: docData.germanLevel || null,
      isLookingForMatch: docData.isLookingForMatch || false,
      currentMatchId: docData.currentMatchId || null,
      createdAt: createdAtTimestamp?.toDate().toISOString() || new Date().toISOString(),
      updatedAt: updatedAtTimestamp?.toDate().toISOString() || new Date().toISOString(),
      fcmTokens: docData.fcmTokens || [],
    };

    return { success: true, profile: updatedProfile };
  } catch (error: any) {
    console.error("Error updating profile:", error);
    return { success: false, error: error.message };
  }
}

export async function updateUserProfilePicture(userId: string, file: File) {
  if (auth.currentUser?.uid !== userId) {
    return { success: false, error: "Unauthorized" };
  }
  if (!file.type.startsWith('image/')) {
    return { success: false, error: "Invalid file type. Only images are allowed." };
  }
  if (file.size > 5 * 1024 * 1024) { // 5MB limit
    return { success: false, error: "File is too large. Maximum 5MB." };
  }

  try {
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    if (!userDoc.exists()) {
      return { success: false, error: "User profile not found." };
    }
    const userProfileData = userDoc.data();

    if (userProfileData.photoURL) {
      try {
        const oldPhotoRef = ref(storage, userProfileData.photoURL);
        await deleteObject(oldPhotoRef);
      } catch (deleteError: any) {
        if (deleteError.code !== 'storage/object-not-found') {
            console.warn("Could not delete old profile picture:", deleteError);
        }
      }
    }
    
    const storageRef = ref(storage, `profile-pictures/${userId}/${Date.now()}-${file.name}`);
    await uploadBytes(storageRef, file);
    const photoURL = await getDownloadURL(storageRef);

    await updateDoc(userDocRef, { 
      photoURL: photoURL,
      updatedAt: serverTimestamp(), // Firestore serverTimestamp
    });
    
    if (auth.currentUser && auth.currentUser.uid === userId) {
      await updateFirebaseProfile(auth.currentUser, { photoURL: photoURL });
    }

    return { success: true, photoURL: photoURL };
  } catch (error: any) {
    console.error("Error updating profile picture:", error);
    return { success: false, error: error.message };
  }
}
