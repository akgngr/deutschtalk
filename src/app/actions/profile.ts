
"use " + "server"; // Ensure this is a server action

import { auth, db, storage } from '@/lib/firebase';
import type { ProfileUpdateFormData } from '@/lib/validators';
import type { UserProfile } from '@/types';
import { doc, serverTimestamp, updateDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { updateProfile as updateFirebaseProfile } from 'firebase/auth';

export async function updateUserProfile(userId: string, data: ProfileUpdateFormData) {
  if (auth.currentUser?.uid !== userId) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const userDocRef = doc(db, 'users', userId);
    const updateData: Partial<UserProfile> = {
      updatedAt: serverTimestamp() as any,
    };

    if (data.displayName) {
      updateData.displayName = data.displayName;
      // Also update Firebase Auth profile if it's the current user
      if (auth.currentUser && auth.currentUser.uid === userId) {
        await updateFirebaseProfile(auth.currentUser, { displayName: data.displayName });
      }
    }
    if (data.bio !== undefined) { // Check for undefined to allow clearing bio
      updateData.bio = data.bio;
    }
    if (data.germanLevel !== undefined) { // Check for undefined to allow clearing level
      updateData.germanLevel = data.germanLevel;
    }
    
    await updateDoc(userDocRef, updateData);
    
    // Fetch the updated profile to return
    const updatedDoc = await getDoc(userDocRef);
    const updatedProfile = updatedDoc.data() as UserProfile;

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
    const userProfile = userDoc.data() as UserProfile;

    // Delete old photo if it exists
    if (userProfile.photoURL) {
      try {
        const oldPhotoRef = ref(storage, userProfile.photoURL);
        await deleteObject(oldPhotoRef);
      } catch (deleteError: any) {
        // Ignore if old photo doesn't exist or other deletion error, proceed with upload
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
      updatedAt: serverTimestamp() as any,
    });
    
    // Also update Firebase Auth profile if it's the current user
    if (auth.currentUser && auth.currentUser.uid === userId) {
      await updateFirebaseProfile(auth.currentUser, { photoURL: photoURL });
    }

    return { success: true, photoURL: photoURL };
  } catch (error: any) {
    console.error("Error updating profile picture:", error);
    return { success: false, error: error.message };
  }
}
