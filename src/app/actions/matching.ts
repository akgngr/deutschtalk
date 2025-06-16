
"use " + "server";

import { auth, db } from '@/lib/firebase';
import type { Match, MatchmakingQueueEntry, UserProfile } from '@/types';
import { collection, deleteDoc, doc, getDoc, getDocs, limit, orderBy, query, runTransaction, serverTimestamp, where, writeBatch } from 'firebase/firestore';
import {nanoid} from 'nanoid'; // Make sure to install nanoid: npm install nanoid

export async function toggleMatchmakingStatus(userId: string, isLooking: boolean) {
  if (auth.currentUser?.uid !== userId) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const userDocRef = doc(db, 'users', userId);
    const matchmakingQueueDocRef = doc(db, 'matchmakingQueue', userId);

    await runTransaction(db, async (transaction) => {
      const userDoc = await transaction.get(userDocRef);
      if (!userDoc.exists()) {
        throw new Error("User profile not found.");
      }
      const userProfile = userDoc.data() as UserProfile;

      transaction.update(userDocRef, { 
        isLookingForMatch: isLooking,
        updatedAt: serverTimestamp()
      });

      if (isLooking) {
        const queueEntry: MatchmakingQueueEntry = {
          uid: userId,
          timestamp: serverTimestamp() as any,
          germanLevel: userProfile.germanLevel
        };
        transaction.set(matchmakingQueueDocRef, queueEntry);
      } else {
        transaction.delete(matchmakingQueueDocRef);
      }
    });

    return { success: true, isLookingForMatch: isLooking };
  } catch (error: any) {
    console.error("Error toggling matchmaking status:", error);
    return { success: false, error: error.message };
  }
}


export async function findAndCreateMatch(userId: string): Promise<{ success: boolean; matchId?: string; error?: string }> {
  if (auth.currentUser?.uid !== userId) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    // Check if user is already in a match
    const currentUserDocRef = doc(db, 'users', userId);
    const currentUserSnap = await getDoc(currentUserDocRef);
    if (!currentUserSnap.exists()) return { success: false, error: "User not found" };
    const currentUserProfile = currentUserSnap.data() as UserProfile;
    if (currentUserProfile.currentMatchId) {
      return { success: true, matchId: currentUserProfile.currentMatchId }; // Already in a match
    }

    const matchmakingQueueRef = collection(db, 'matchmakingQueue');
    // Find another user in the queue, not the current user
    // Ideally, match based on German level or other criteria here
    const q = query(
      matchmakingQueueRef,
      where('uid', '!=', userId), // Exclude current user
      orderBy('timestamp', 'asc'),
      limit(1)
    );
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      // No one else in queue, add current user to queue if not already (handled by toggleMatchmakingStatus)
      // Ensure user is marked as looking for match
      if (!currentUserProfile.isLookingForMatch) {
        await toggleMatchmakingStatus(userId, true);
      }
      return { success: false, error: "No suitable partners found in queue. You've been added to the queue." };
    }

    const partnerQueueEntry = querySnapshot.docs[0].data() as MatchmakingQueueEntry;
    const partnerId = partnerQueueEntry.uid;

    // Fetch partner's profile
    const partnerDocRef = doc(db, 'users', partnerId);
    const partnerSnap = await getDoc(partnerDocRef);
    if (!partnerSnap.exists()) {
      // Partner doc missing, remove from queue and try again (or return error)
      await deleteDoc(doc(db, 'matchmakingQueue', partnerId));
      return { success: false, error: "Potential partner not found, please try again." };
    }
    const partnerProfile = partnerSnap.data() as UserProfile;
    if (partnerProfile.currentMatchId) {
      // Partner already in a match, remove from queue and try again
      await deleteDoc(doc(db, 'matchmakingQueue', partnerId));
      return { success: false, error: "Partner already matched, please try again." };
    }


    // Create a new match
    const matchId = nanoid();
    const matchDocRef = doc(db, 'matches', matchId);

    const newMatch: Match = {
      id: matchId,
      participants: [userId, partnerId],
      participantNames: {
        [userId]: currentUserProfile.displayName || 'Anonymous',
        [partnerId]: partnerProfile.displayName || 'Anonymous',
      },
      participantPhotoURLs: {
        [userId]: currentUserProfile.photoURL || null,
        [partnerId]: partnerProfile.photoURL || null,
      },
      createdAt: serverTimestamp() as any,
      status: 'active',
    };

    // Use a batch write to update profiles and create match atomically
    const batch = writeBatch(db);
    batch.set(matchDocRef, newMatch);
    batch.update(currentUserDocRef, { 
      currentMatchId: matchId, 
      isLookingForMatch: false, 
      updatedAt: serverTimestamp() 
    });
    batch.update(partnerDocRef, { 
      currentMatchId: matchId, 
      isLookingForMatch: false, 
      updatedAt: serverTimestamp() 
    });

    // Remove both users from queue
    batch.delete(doc(db, 'matchmakingQueue', userId));
    batch.delete(doc(db, 'matchmakingQueue', partnerId));

    await batch.commit();

    return { success: true, matchId };

  } catch (error: any) {
    console.error("Error finding or creating match:", error);
    // If an error occurred, ensure the current user is still in the queue if they were looking
    try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists() && (userDoc.data() as UserProfile).isLookingForMatch) {
            await setDoc(doc(db, 'matchmakingQueue', userId), { 
                uid: userId, 
                timestamp: serverTimestamp() 
            }, { merge: true });
        }
    } catch (cleanupError) {
        console.error("Error during matchmaking cleanup:", cleanupError);
    }
    return { success: false, error: error.message };
  }
}

export async function leaveMatch(userId: string, matchId: string) {
  if (auth.currentUser?.uid !== userId) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const userDocRef = doc(db, 'users', userId);
    const matchDocRef = doc(db, 'matches', matchId);

    await runTransaction(db, async (transaction) => {
      const matchDoc = await transaction.get(matchDocRef);
      if (!matchDoc.exists()) {
        // Match doesn't exist, clear from user profile if necessary
        transaction.update(userDocRef, { currentMatchId: null, updatedAt: serverTimestamp() });
        return;
      }
      const matchData = matchDoc.data() as Match;
      if (!matchData.participants.includes(userId)) {
         transaction.update(userDocRef, { currentMatchId: null, updatedAt: serverTimestamp() });
         return; // User not in this match
      }

      // Update match status to 'ended' or remove participant
      // For simplicity, let's just mark as ended if one leaves.
      // More complex logic could involve finding a new partner for the other participant.
      transaction.update(matchDocRef, { status: 'ended', updatedAt: serverTimestamp() });
      
      // Clear currentMatchId for all participants
      matchData.participants.forEach(pid => {
        const participantDocRef = doc(db, 'users', pid);
        transaction.update(participantDocRef, { currentMatchId: null, updatedAt: serverTimestamp() });
      });
    });

    return { success: true };
  } catch (error: any) {
    console.error("Error leaving match:", error);
    return { success: false, error: error.message };
  }
}

