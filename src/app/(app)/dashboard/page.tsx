
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
  const [localProfile, setLocalProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (userProfile) {
      setLocalProfile(userProfile);
      // If user has an active match, redirect them to the chat.
      if (userProfile.currentMatchId) {
         // Small delay to ensure UI updates if needed, then redirect.
        setTimeout(() => router.push(`/chat/${userProfile.currentMatchId}`), 100);
      }
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
      router.push(`/chat/${result.matchId}`);
    } else if (result.success && !result.matchId) { // Should not happen with current logic
       toast({ title: "Error", description: "Match created but no ID returned.", variant: "destructive" });
    }
    else {
      // This means no partner found yet, user added to queue
      const toggleResult = await toggleMatchmakingStatus(user.uid, true);
      if(toggleResult.success){
        toast({ title: "In Queue", description: result.error || "No partners available right now. You've been added to the queue." });
        // Optimistically update local state
        if (localProfile) setLocalProfile({...localProfile, isLookingForMatch: true});
      } else {
        toast({ title: "Error", description: toggleResult.error || "Failed to join queue.", variant: "destructive" });
      }
    }
  };
  
  const handleToggleQueue = async () => {
    if (!user || !localProfile) return;
    
    const newStatus = !localProfile.isLookingForMatch;
    setIsMatchmaking(true); // Use same loading state for this action
    
    const result = await toggleMatchmakingStatus(user.uid, newStatus);
    setIsMatchmaking(false);

    if (result.success) {
      setLocalProfile(prev => prev ? {...prev, isLookingForMatch: newStatus} : null);
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

  if (authLoading || !localProfile) {
    return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }
  
  if (localProfile.currentMatchId) {
     return (
      <div className="flex flex-col items-center justify-center text-center space-y-4 p-8">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <h2 className="text-2xl font-semibold">You have an active chat!</h2>
        <p className="text-muted-foreground">Redirecting you to your conversation...</p>
        <Button asChild>
          <Link href={`/chat/${localProfile.currentMatchId}`}>Go to Chat Now</Link>
        </Button>
      </div>
    );
  }


  return (
    <div className="flex flex-col items-center justify-center space-y-8 py-12">
      {user && (
        <Card className="w-full max-w-lg shadow-md mb-6">
          <CardHeader>
            <CardTitle className="text-xl">User Object (Debug)</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-muted p-2 rounded-md overflow-x-auto">
              {JSON.stringify(user, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      <Card className="w-full max-w-lg shadow-xl text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <Search className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="font-headline text-3xl">Find a Chat Partner</CardTitle>
          <CardDescription>
            {localProfile.isLookingForMatch 
              ? "You are currently in the queue. We'll notify you when a partner is found."
              : "Ready to practice your German? Click below to find someone to chat with."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {localProfile.isLookingForMatch ? (
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
            disabled={isMatchmaking || localProfile.isLookingForMatch}
          >
            {isMatchmaking && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
            {localProfile.isLookingForMatch ? 'Already in Queue' : 'Find a Partner Now'}
            {!localProfile.isLookingForMatch && <UserPlus className="ml-2 h-5 w-5" />}
          </Button>
          <Button 
            size="lg" 
            variant="outline" 
            className="w-full" 
            onClick={handleToggleQueue} 
            disabled={isMatchmaking}
          >
            {isMatchmaking && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
            {localProfile.isLookingForMatch ? (
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
