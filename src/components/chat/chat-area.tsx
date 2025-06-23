
"use client";

import type { ChatMessage, Match, UserProfile } from '@/types';
import { useAuth } from '@/hooks/use-auth';
import { useEffect, useRef, useState } from 'react';
import { collection, doc, onSnapshot, orderBy, query, limit, startAfter, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { MessageInput } from './message-input';
import { MessageItem } from './message-item';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, ArrowLeft, Info, Loader2, Users } from 'lucide-react';
import { Button } from '../ui/button';
import { useRouter } from 'next/navigation';
import { leaveMatch } from '@/app/actions/matching';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { cn } from '@/lib/utils';

interface ChatAreaProps {
  matchId: string;
}

const MESSAGES_PER_LOAD = 20;

export function ChatArea({ matchId }: ChatAreaProps) {
  const { user, userProfile } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [matchDetails, setMatchDetails] = useState<Match | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!user || !matchId) return;

    setIsLoading(true);
    const matchDocRef = doc(db, 'matches', matchId);
    const unsubscribeMatch = onSnapshot(matchDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const matchData = docSnap.data() as Match;
        setMatchDetails(matchData);
        if (matchData.status === 'ended') {
          toast({ title: "Chat Ended", description: "This chat session has ended.", variant: "default" });
        }
      } else {
        setError("Match not found. It might have been deleted or an error occurred.");
        setMatchDetails(null);
      }
    }, (err) => {
      console.error("Error fetching match details:", err);
      setError("Failed to load match details.");
    });
    
    const messagesQuery = query(
      collection(db, 'matches', matchId, 'messages'),
      orderBy('timestamp', 'desc'),
      limit(MESSAGES_PER_LOAD)
    );

    const unsubscribeMessages = onSnapshot(messagesQuery, (snapshot) => {
      const fetchedMessages: ChatMessage[] = [];
      snapshot.forEach(doc => fetchedMessages.push({ id: doc.id, ...doc.data() } as ChatMessage));
      setMessages(fetchedMessages.reverse()); // Reverse to show newest at bottom
      setIsLoading(false);
      if (fetchedMessages.length < MESSAGES_PER_LOAD) {
        setHasMoreMessages(false);
      }
      // Scroll to bottom on new message, if user is near the bottom
      setTimeout(() => { // Timeout to allow DOM update
        if (chatContainerRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
            // Check if user is close to the bottom before auto-scrolling
            if (scrollHeight - scrollTop - clientHeight < 200) { 
                messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
            }
        }
      }, 100);

    }, (err) => {
      console.error("Error fetching messages:", err);
      setError("Failed to load messages.");
      setIsLoading(false);
    });

    return () => {
      unsubscribeMatch();
      unsubscribeMessages();
    };
  }, [user, matchId, toast]);

  const loadMoreMessages = async () => {
    if (!hasMoreMessages || isLoadingMore || messages.length === 0) return;

    setIsLoadingMore(true);
    const lastVisibleMessage = messages[0]; // Oldest message currently loaded (since we reverse for display)
    
    try {
      const nextMessagesQuery = query(
        collection(db, 'matches', matchId, 'messages'),
        orderBy('timestamp', 'desc'),
        startAfter(lastVisibleMessage.timestamp), // Firestore timestamp object
        limit(MESSAGES_PER_LOAD)
      );
      const snapshot = await getDocs(nextMessagesQuery);
      const newMessages: ChatMessage[] = [];
      snapshot.forEach(doc => newMessages.push({ id: doc.id, ...doc.data() } as ChatMessage));
      
      setMessages(prev => [...newMessages.reverse(), ...prev]);
      if (newMessages.length < MESSAGES_PER_LOAD) {
        setHasMoreMessages(false);
      }
    } catch (err) {
      console.error("Error loading more messages:", err);
      toast({ title: "Error", description: "Could not load older messages.", variant: "destructive" });
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleLeaveChat = async () => {
    if (!user || !matchId) return;
    const confirmation = window.confirm("Are you sure you want to leave this chat? This will end the session for both participants.");
    if (confirmation) {
      const result = await leaveMatch(user.uid, matchId);
      if (result.success) {
        toast({ title: "Chat Ended", description: "You have left the chat." });
        router.push('/dashboard');
      } else {
        toast({ title: "Error", description: result.error || "Could not leave chat.", variant: "destructive" });
      }
    }
  };
  
  const partnerId = matchDetails?.participants.find(pId => pId !== user?.uid);
  const partnerName = partnerId ? matchDetails?.participantNames[partnerId] : "Partner";
  const partnerPhotoURL = partnerId ? matchDetails?.participantPhotoURLs[partnerId] : undefined;

  const getInitials = (name: string | null | undefined) => {
    if (!name) return '??';
    const names = name.split(' ');
    if (names.length === 1) return names[0].substring(0, 2).toUpperCase();
    return (names[0][0] + (names[names.length - 1][0] || '')).toUpperCase();
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-destructive p-4">
        <AlertCircle className="h-12 w-12 mb-4" />
        <h2 className="text-xl font-semibold">Error Loading Chat</h2>
        <p>{error}</p>
        <Button onClick={() => router.push('/dashboard')} className="mt-4">Go to Dashboard</Button>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-[calc(100vh-180px)] md:h-[calc(100vh-150px)] bg-card rounded-xl shadow-2xl overflow-hidden border">
      <header className="p-4 border-b flex items-center justify-between bg-background sticky top-0 z-10">
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard')} className="mr-2 md:hidden">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Avatar className="h-10 w-10">
             <AvatarImage src={partnerPhotoURL || undefined} alt={partnerName || 'Partner'} />
             <AvatarFallback>{getInitials(partnerName)}</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="font-semibold text-lg">{partnerName || "Chat Partner"}</h2>
            <p className="text-xs text-muted-foreground">{matchDetails?.status === 'active' ? 'Online' : 'Chat Ended'}</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleLeaveChat} className="border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive">
          Leave Chat
        </Button>
      </header>

      <div ref={chatContainerRef} className="flex-grow overflow-y-auto p-4 space-y-1 bg-gradient-to-br from-background to-secondary/10">
        {isLoading && messages.length === 0 && (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={cn("flex items-start space-x-3 py-2", i % 2 === 0 ? "" : "justify-end")}>
              {i % 2 !== 0 && <Skeleton className="h-8 w-48 rounded-lg" />}
              <Skeleton className="h-8 w-8 rounded-full" />
              {i % 2 === 0 && <Skeleton className="h-8 w-48 rounded-lg" />}
            </div>
          ))
        )}
        
        {hasMoreMessages && !isLoading && messages.length > 0 && (
          <div className="text-center my-2">
            <Button variant="outline" size="sm" onClick={loadMoreMessages} disabled={isLoadingMore}>
              {isLoadingMore && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Load Older Messages
            </Button>
          </div>
        )}

        {!isLoading && messages.length === 0 && matchDetails?.status === 'active' && (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-center p-6">
            <MessageSquare className="h-16 w-16 mb-4 opacity-50" />
            <p className="text-lg font-medium">No messages yet.</p>
            <p>Be the first to say "Hallo"! 👋</p>
          </div>
        )}

        {messages.map(msg => (
          <MessageItem key={msg.id} message={msg} isCurrentUser={msg.senderId === user?.uid} />
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      {matchDetails?.status === 'active' ? (
        <MessageInput matchId={matchId} />
      ) : (
        <div className="p-4 border-t bg-muted text-center text-muted-foreground">
          <Info className="inline-block h-5 w-5 mr-2" /> This chat session has ended.
          <Button variant="link" asChild className="ml-2"><Link href="/dashboard">Find a new partner</Link></Button>
        </div>
      )}
    </div>
  );
}
