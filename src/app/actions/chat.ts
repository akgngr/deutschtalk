
"use " + "server";

import { auth, db } from '@/lib/firebase';
import type { ChatMessage, Match, UserProfile } from '@/types';
import { MessageSchema, type MessageFormData } from '@/lib/validators';
import { addDoc, collection, doc, serverTimestamp, updateDoc, getDoc, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { checkGerman } from '@/ai/flows/check-german-flow';
import { correctGerman } from '@/ai/flows/correct-german-flow';
import { suggestReplies, type SuggestRepliesInput } from '@/ai/flows/suggest-replies-flow';

// Basic profanity filter (very rudimentary, for demonstration)
const profanityList = ["badword1", "badword2", "scheisse", "arschloch"]; // Add more German/English bad words
function containsProfanity(text: string): boolean {
  const lowerText = text.toLowerCase();
  return profanityList.some(word => lowerText.includes(word));
}

export async function sendMessage(matchId: string, formData: MessageFormData) {
  const validation = MessageSchema.safeParse(formData);
  if (!validation.success) {
    return { success: false, error: "Invalid message data.", details: validation.error.flatten() };
  }
  const { text } = validation.data;

  const currentUser = auth.currentUser;
  if (!currentUser) {
    return { success: false, error: "User not authenticated." };
  }

  try {
    // Verify user is part of the match
    const matchDocRef = doc(db, 'matches', matchId);
    const matchSnap = await getDoc(matchDocRef);
    if (!matchSnap.exists()) {
      return { success: false, error: "Match not found." };
    }
    const matchData = matchSnap.data() as Match;
    if (!matchData.participants.includes(currentUser.uid)) {
      return { success: false, error: "User not part of this match." };
    }
    if (matchData.status !== 'active') {
      return { success: false, error: "This chat is not active." };
    }

    // Fetch sender's profile for displayName and photoURL
    const senderProfileSnap = await getDoc(doc(db, 'users', currentUser.uid));
    const senderProfile = senderProfileSnap.data() as UserProfile | undefined;

    const messageData: Omit<ChatMessage, 'id'> = {
      matchId,
      senderId: currentUser.uid,
      senderDisplayName: senderProfile?.displayName || currentUser.displayName || "Anonymous",
      senderPhotoURL: senderProfile?.photoURL || currentUser.photoURL || undefined,
      text,
      timestamp: serverTimestamp() as any,
      isModerated: false,
    };

    // Moderation (basic profanity check)
    if (containsProfanity(text)) {
      messageData.isModerated = true;
      messageData.moderationReason = "Message contains potentially inappropriate language.";
      // Optionally, don't save the message or save it with a flag for review
      // For this example, we'll save it but mark it.
      // In a real app, you might prevent sending or queue for admin review.
    }
    
    const messageRef = await addDoc(collection(db, 'matches', matchId, 'messages'), messageData);
    
    // Update match's lastMessage for previews
    await updateDoc(matchDocRef, {
      lastMessage: {
        text: messageData.text.substring(0, 50) + (messageData.text.length > 50 ? "..." : ""), // Truncate for preview
        timestamp: messageData.timestamp,
        senderId: messageData.senderId,
      },
      updatedAt: serverTimestamp()
    });
    
    // Asynchronous AI processing (don't block message sending)
    // No need to await these if we want the message to appear instantly
    processAIMessage(messageRef.id, matchId, text);

    return { success: true, messageId: messageRef.id };

  } catch (error: any) {
    console.error("Error sending message:", error);
    return { success: false, error: error.message };
  }
}

async function processAIMessage(messageId: string, matchId: string, text: string) {
  try {
    const messageDocRef = doc(db, 'matches', matchId, 'messages', messageId);
    let aiUpdates: Partial<ChatMessage> = {};

    // 1. Check if message is German
    const germanCheckResult = await checkGerman({ message: text });
    aiUpdates.isGerman = germanCheckResult.isGerman;

    // 2. If German, try to correct
    if (germanCheckResult.isGerman) {
      const correctionResult = await correctGerman({ message: text });
      aiUpdates.correction = correctionResult.correctedMessage;
      aiUpdates.explanation = correctionResult.explanation;
    }
    
    if (Object.keys(aiUpdates).length > 0) {
      await updateDoc(messageDocRef, aiUpdates);
    }

  } catch (aiError: any) {
    console.error("Error processing message with AI:", aiError);
    // Optionally update the message with an error flag for AI processing
    const messageDocRef = doc(db, 'matches', matchId, 'messages', messageId);
    await updateDoc(messageDocRef, { aiProcessingError: aiError.message || "Unknown AI processing error" });
  }
}

export async function getInitialMessages(matchId: string, count: number = 20) {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      return { success: false, error: "User not authenticated.", messages: [] };
    }
    try {
        const messagesRef = collection(db, 'matches', matchId, 'messages');
        const q = query(messagesRef, orderBy('timestamp', 'desc'), limit(count));
        const snapshot = await getDocs(q);
        const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatMessage)).reverse(); // Reverse to show oldest first
        return { success: true, messages };
    } catch (error: any) {
        console.error("Error fetching initial messages:", error);
        return { success: false, error: error.message, messages: [] };
    }
}

export async function getSuggestedReplies(matchId: string) {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    return { success: false, error: 'User not authenticated.' };
  }

  try {
    // 1. Fetch the last 5 messages
    const messagesRef = collection(db, 'matches', matchId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'desc'), limit(5));
    const snapshot = await getDocs(q);
    const messages = snapshot.docs.map(doc => doc.data() as ChatMessage).reverse(); // Oldest to newest

    if (messages.length > 0) {
      // 2. Check if the current user sent the last message
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.senderId === currentUser.uid) {
        return { success: true, replies: [] }; // Don't suggest replies if user was the last to speak
      }
    }
    
    // 3. Fetch current user's profile to get their name
    const userProfileSnap = await getDoc(doc(db, 'users', currentUser.uid));
    if (!userProfileSnap.exists()) {
        return { success: false, error: 'User profile not found.' };
    }
    const userProfile = userProfileSnap.data() as UserProfile;


    // 4. Format messages for the AI flow
    const historyForAI: SuggestRepliesInput['history'] = messages.map(msg => ({
      sender: msg.senderDisplayName || 'User',
      text: msg.text,
    }));

    // 5. Call the AI flow
    const result = await suggestReplies({
      history: historyForAI,
      responderName: userProfile.displayName || 'Me',
    });

    return { success: true, replies: result.suggestions };

  } catch (error: any) {
    console.error('Error getting suggested replies:', error);
    return { success: false, error: error.message, replies: [] };
  }
}
