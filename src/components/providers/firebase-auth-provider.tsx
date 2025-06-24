
"use client";

import type { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import type { ReactNode } from 'react';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import type { UserProfile } from '@/types';
import { doc, onSnapshot, type Timestamp, type Unsubscribe } from 'firebase/firestore'; 
import { Loader2 } from 'lucide-react';

interface FirebaseAuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  initialLoading: boolean; // Tracks initial auth state check
}

const FirebaseAuthContext = createContext<FirebaseAuthContextType | undefined>(undefined);

export const FirebaseAuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true); // General loading for profile fetch
  const [initialLoading, setInitialLoading] = useState(true); // Specific for auth state

  useEffect(() => {
    let unsubscribeProfile: Unsubscribe = () => {};

    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      // First, clean up any existing profile listener from the previous auth state
      unsubscribeProfile();

      setUser(firebaseUser);
      setInitialLoading(false);

      if (firebaseUser) {
        setLoading(true);
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        
        // Assign the new snapshot listener's unsubscribe function
        unsubscribeProfile = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            const createdAtTimestamp = data.createdAt as Timestamp | undefined;
            const updatedAtTimestamp = data.updatedAt as Timestamp | undefined;

            setUserProfile({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: data.displayName || firebaseUser.displayName || null,
              photoURL: data.photoURL || firebaseUser.photoURL || null,
              bio: data.bio || '',
              germanLevel: data.germanLevel || null,
              isLookingForMatch: data.isLookingForMatch || false,
              currentMatchId: data.currentMatchId || null,
              createdAt: createdAtTimestamp?.toDate().toISOString() || new Date().toISOString(),
              updatedAt: updatedAtTimestamp?.toDate().toISOString() || new Date().toISOString(),
              fcmTokens: data.fcmTokens || [],
            });
          } else {
            console.warn(`UserProfile document not found in Firestore for UID: ${firebaseUser.uid}. UserProfile will be null.`);
            setUserProfile(null); 
          }
          setLoading(false);
        }, (error) => {
          console.error("Error fetching user profile from Firestore:", error);
          setUserProfile(null);
          setLoading(false);
        });
      } else {
        setUserProfile(null);
        setLoading(false); // No user, so no profile to load
      }
    });

    // Cleanup function for the main useEffect
    return () => {
      unsubscribeAuth();
      unsubscribeProfile(); // Also clean up the profile listener on unmount
    };
  }, []);

  return (
    <FirebaseAuthContext.Provider value={{ user, userProfile, loading, initialLoading }}>
      {children}
    </FirebaseAuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(FirebaseAuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within a FirebaseAuthProvider');
  }
  return context;
};

// Optional: A component to handle loading state globally or for specific routes
export const AuthStateGate: React.FC<{ children: ReactNode, loadingFallback?: ReactNode }> = ({ children, loadingFallback }) => {
  const { initialLoading } = useAuth();

  if (initialLoading) {
    return loadingFallback || (
      <div className="flex h-screen w-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  return <>{children}</>;
};
