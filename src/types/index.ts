
import type { Timestamp } from 'firebase/firestore';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  bio?: string;
  germanLevel?: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' | 'Native' | null;
  isLookingForMatch?: boolean;
  currentMatchId?: string | null;
  createdAt: string; // Changed from Timestamp
  updatedAt: string; // Changed from Timestamp
  fcmTokens?: string[]; 
}

export interface ChatMessage {
  id: string;
  matchId: string;
  senderId: string;
  senderDisplayName: string | null; // Added for easier display
  senderPhotoURL?: string | null; // Added for easier display
  text: string;
  timestamp: Timestamp; // Keep as Timestamp for Firestore, convert if passed to client directly
  isGerman?: boolean | null;
  correction?: string | null;
  explanation?: string | null;
  isModerated?: boolean;
  moderationReason?: string;
}

export interface Match {
  id: string;
  participants: string[]; // Array of UIDs
  participantNames: { [uid: string]: string | null }; // Map UID to display name
  participantPhotoURLs: { [uid: string]: string | null }; // Map UID to photo URL
  createdAt: Timestamp; // Keep as Timestamp for Firestore, convert if passed to client directly
  status: 'pending' | 'active' | 'ended';
  lastMessage?: {
    text: string;
    timestamp: Timestamp; // Keep as Timestamp for Firestore
    senderId: string;
  } | null;
}

export interface MatchmakingQueueEntry {
  uid: string;
  timestamp: Timestamp; // Keep as Timestamp for Firestore
  germanLevel?: UserProfile['germanLevel'];
}
