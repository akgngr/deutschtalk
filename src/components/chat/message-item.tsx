
"use client";

import type { ChatMessage, UserProfile } from '@/types';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { Bot, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";


interface MessageItemProps {
  message: ChatMessage;
  isCurrentUser: boolean;
}

export function MessageItem({ message, isCurrentUser }: MessageItemProps) {
  
  const getInitials = (name: string | null | undefined) => {
    if (!name) return '??';
    const names = name.split(' ');
    if (names.length === 1) return names[0].substring(0, 2).toUpperCase();
    return (names[0][0] + (names[names.length - 1][0] || names[0][1] || '')).toUpperCase();
  };

  const timeAgo = message.timestamp ? formatDistanceToNow(message.timestamp.toDate(), { addSuffix: true }) : 'sending...';

  return (
    <div className={cn(
      "flex items-start space-x-3 py-3 px-2 group",
      isCurrentUser ? "justify-end" : ""
    )}>
      {!isCurrentUser && (
        <Avatar className="h-8 w-8 self-end mb-1">
          <AvatarImage src={message.senderPhotoURL || undefined} alt={message.senderDisplayName || 'User'} />
          <AvatarFallback>{getInitials(message.senderDisplayName)}</AvatarFallback>
        </Avatar>
      )}
      <div className={cn(
        "max-w-xs md:max-w-md lg:max-w-lg p-3 rounded-xl shadow-md break-words",
        isCurrentUser 
          ? "bg-primary text-primary-foreground rounded-br-none" 
          : "bg-card text-card-foreground rounded-bl-none"
      )}>
        {!isCurrentUser && (
          <p className="text-xs font-semibold mb-1">{message.senderDisplayName || "Anonymous"}</p>
        )}
        <p className="text-sm whitespace-pre-wrap">{message.text}</p>
        <p className={cn(
          "text-xs mt-1 opacity-70",
          isCurrentUser ? "text-right" : "text-left"
        )}>{timeAgo}</p>

        {message.isModerated && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="mt-2 flex items-center text-destructive-foreground/80 bg-destructive/80 p-1 rounded-md text-xs">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  <span>Content Warning</span>
                </div>
              </TooltipTrigger>
              <TooltipContent side={isCurrentUser ? "left" : "right"}>
                <p className="text-xs">{message.moderationReason || "This message was flagged."}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        
        {(message.isGerman === false || message.correction) && !message.isModerated && (
          <Accordion type="single" collapsible className="w-full mt-2">
            <AccordionItem value="ai-feedback" className="border-none">
              <AccordionTrigger className={cn(
                "py-1 px-2 text-xs hover:no-underline rounded focus:ring-2 focus:ring-offset-1",
                 isCurrentUser ? "hover:bg-primary/80 focus:ring-primary-foreground" : "hover:bg-accent/20 focus:ring-accent",
                 message.isGerman === false ? "text-amber-700 dark:text-amber-400" : (isCurrentUser ? "text-primary-foreground/90" : "text-foreground/90")
              )}>
                <div className="flex items-center">
                  <Bot className="h-4 w-4 mr-1.5" /> AI Feedback
                </div>
              </AccordionTrigger>
              <AccordionContent className={cn(
                "p-2 mt-1 rounded-md text-xs",
                isCurrentUser ? "bg-primary/80" : "bg-accent/10"
              )}>
                {message.isGerman === false && (
                  <div className="flex items-start text-amber-900 dark:text-amber-300 mb-1.5 p-1.5 rounded bg-amber-500/20">
                    <AlertTriangle className="h-4 w-4 mr-1.5 shrink-0 mt-0.5" />
                    <p>This message might not be entirely in German. Try to stick to German for practice!</p>
                  </div>
                )}
                {message.correction && (
                  <div className="mb-1.5">
                    <p className={cn("font-medium mb-0.5 flex items-center", isCurrentUser ? "text-primary-foreground" : "text-foreground")}>
                      <CheckCircle2 className="h-4 w-4 mr-1.5 text-green-600 dark:text-green-400"/> Suggested Correction:
                    </p>
                    <p className="italic p-1.5 bg-black/5 dark:bg-white/5 rounded">{message.correction}</p>
                  </div>
                )}
                {message.explanation && (
                   <div>
                    <p className={cn("font-medium mb-0.5 flex items-center", isCurrentUser ? "text-primary-foreground" : "text-foreground")}>
                       <Info className="h-4 w-4 mr-1.5 text-blue-600 dark:text-blue-400"/> Explanation:
                    </p>
                    <p className="p-1.5 bg-black/5 dark:bg-white/5 rounded">{message.explanation}</p>
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}

      </div>
      {isCurrentUser && (
        <Avatar className="h-8 w-8 self-end mb-1">
          <AvatarImage src={message.senderPhotoURL || undefined} alt={message.senderDisplayName || 'User'} />
          <AvatarFallback>{getInitials(message.senderDisplayName)}</AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
