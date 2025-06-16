
"use client";

import type { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import type { ReactNode } from 'react';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import type { UserProfile } from '@/types';
import { doc, onSnapshot } from 'firebase/firestore';
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
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setInitialLoading(false); // Auth state determined
      if (firebaseUser) {
        setLoading(true); // Start loading profile
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const unsubscribeProfile = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            setUserProfile(docSnap.data() as UserProfile);
          } else {
            // Handle case where user exists in Auth but not Firestore (e.g., incomplete registration)
            setUserProfile(null); 
          }
          setLoading(false); // Profile loaded (or confirmed not to exist)
        }, (error) => {
          console.error("Error fetching user profile:", error);
          setUserProfile(null);
          setLoading(false);
        });
        return () => unsubscribeProfile();
      } else {
        setUserProfile(null);
        setLoading(false); // No user, so no profile to load
      }
    });

    return () => unsubscribeAuth();
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
