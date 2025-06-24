
"use client";

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { findAndCreateMatch, toggleMatchmakingStatus } from '@/app/actions/matching';
import { Loader2, MessageSquare, Search, UserPlus, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import Image from 'next/image';
import type { UserProfile } from '@/types';

export default function DashboardPage() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isMatchmaking, setIsMatchmaking] = useState(false);

  useEffect(() => {
    // If we have a profile and it has a match ID, redirect to the chat page.
    if (userProfile?.currentMatchId) {
      router.push(`/chat/${userProfile.currentMatchId}`);
    }
  }, [userProfile, router]);


  const handleFindPartner = async () => {
    if (!user) return;
    setIsMatchmaking(true);
    toast({ title: "Searching for a partner...", description: "Please wait a moment." });

    const result = await findAndCreateMatch(user.uid);
    setIsMatchmaking(false);

    if (result.success && result.matchId) {
      toast({ title: "Partner Found!", description: "Redirecting you to the chat..." });
      // The useEffect above will handle the redirection
    } else if (!result.success) {
      // This means no partner found yet, user added to queue
      toast({ title: "In Queue", description: result.error || "No partners available right now. You've been added to the queue." });
      // Ensure local state reflects being in queue, relying on snapshot for definitive update
      if (userProfile && !userProfile.isLookingForMatch) {
         await toggleMatchmakingStatus(user.uid, true);
      }
    }
  };
  
  const handleToggleQueue = async () => {
    if (!user || !userProfile) return;
    
    const newStatus = !userProfile.isLookingForMatch;
    setIsMatchmaking(true); // Use same loading state for this action
    
    const result = await toggleMatchmakingStatus(user.uid, newStatus);
    setIsMatchmaking(false);

    if (result.success) {
      // The userProfile from context will update automatically via onSnapshot.
      toast({ 
        title: newStatus ? "Joined Queue" : "Left Queue", 
        description: newStatus ? "You are now waiting for a partner." : "You are no longer in the matchmaking queue."
      });
      if (newStatus) { // If they just joined the queue, try to find a match immediately
        handleFindPartner();
      }
    } else {
      toast({ title: "Error", description: result.error || "Failed to update queue status.", variant: "destructive" });
    }
  };

  // Main loading state: wait for auth check and profile fetch to complete.
  if (authLoading || !userProfile) {
    return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }
  
  // If user has an active match, show a redirecting message. The useEffect will handle the push.
  if (userProfile.currentMatchId) {
     return (
      <div className="flex flex-col items-center justify-center text-center space-y-4 p-8 h-full">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <h2 className="text-2xl font-semibold">You have an active chat!</h2>
        <p className="text-muted-foreground">Redirecting you to your conversation...</p>
        <Button asChild>
          <Link href={`/chat/${userProfile.currentMatchId}`}>Go to Chat Now</Link>
        </Button>
      </div>
    );
  }


  return (
    <div className="flex flex-col items-center justify-center space-y-8 py-12">
      <Card className="w-full max-w-lg shadow-xl text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <Search className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="font-headline text-3xl">Find a Chat Partner</CardTitle>
          <CardDescription>
            {userProfile.isLookingForMatch 
              ? "You are currently in the queue. We'll notify you when a partner is found."
              : "Ready to practice your German? Click below to find someone to chat with."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {userProfile.isLookingForMatch ? (
             <div className="space-y-4">
                <div className="flex items-center justify-center space-x-2 text-primary">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="text-lg">Waiting for a partner...</span>
                </div>
                <p className="text-sm text-muted-foreground">
                    Feel free to navigate away, you will be notified. Or, you can try searching again.
                </p>
             </div>
          ) : (
            <p className="text-muted-foreground">
              We&apos;ll match you with another learner or native speaker to practice your German conversation skills.
            </p>
          )}
        </CardContent>
        <CardFooter className="flex flex-col space-y-3">
          <Button 
            size="lg" 
            className="w-full" 
            onClick={handleFindPartner} 
            disabled={isMatchmaking || userProfile.isLookingForMatch}
          >
            {isMatchmaking && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
            {userProfile.isLookingForMatch ? 'Already in Queue' : 'Find a Partner Now'}
            {!userProfile.isLookingForMatch && <UserPlus className="ml-2 h-5 w-5" />}
          </Button>
          <Button 
            size="lg" 
            variant="outline" 
            className="w-full" 
            onClick={handleToggleQueue} 
            disabled={isMatchmaking}
          >
            {isMatchmaking && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
            {userProfile.isLookingForMatch ? (
              <>
                <XCircle className="mr-2 h-5 w-5" /> Leave Queue
              </>
            ) : (
              <>
                <UserPlus className="mr-2 h-5 w-5" /> Join Queue
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      <div className="w-full max-w-lg text-center mt-8">
          <h3 className="font-headline text-xl font-semibold mb-2">Tips for a Great Chat:</h3>
          <ul className="list-disc list-inside text-left text-muted-foreground space-y-1">
              <li>Be patient and respectful.</li>
              <li>Try to use only German, even if it's challenging.</li>
              <li>Don't be afraid to make mistakes – that's how we learn!</li>
              <li>Ask questions and show interest in your partner.</li>
          </ul>
      </div>
    </div>
  );
}
