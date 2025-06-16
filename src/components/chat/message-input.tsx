
"use client";

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { MessageSchema, type MessageFormData } from '@/lib/validators';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { sendMessage } from '@/app/actions/chat';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { Loader2, Send } from 'lucide-react';

interface MessageInputProps {
  matchId: string;
}

export function MessageInput({ matchId }: MessageInputProps) {
  const { toast } = useToast();
  const [isSending, setIsSending] = useState(false);

  const form = useForm<MessageFormData>({
    resolver: zodResolver(MessageSchema),
    defaultValues: {
      text: '',
    },
  });

  async function onSubmit(data: MessageFormData) {
    setIsSending(true);
    const result = await sendMessage(matchId, data);
    setIsSending(false);

    if (result.success) {
      form.reset(); // Clear input field
    } else {
      toast({
        title: "Message Failed",
        description: result.error || "Could not send message.",
        variant: "destructive",
      });
    }
  }

  return (
    <Form {...form}>
      <form 
        onSubmit={form.handleSubmit(onSubmit)} 
        className="flex items-start space-x-2 p-4 border-t bg-background"
        aria-label="Chat message input form"
      >
        <FormField
          control={form.control}
          name="text"
          render={({ field }) => (
            <FormItem className="flex-grow">
              <FormControl>
                <Textarea
                  placeholder="Type your message in German..."
                  className="resize-none min-h-[60px] max-h-[150px] rounded-lg shadow-sm focus-visible:ring-primary focus-visible:ring-2"
                  {...field}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      form.handleSubmit(onSubmit)();
                    }
                  }}
                  aria-label="Message input field"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button 
          type="submit" 
          disabled={isSending} 
          className="h-[60px] w-[60px] rounded-lg shadow-sm"
          aria-label={isSending ? "Sending message" : "Send message"}
        >
          {isSending ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            <Send className="h-6 w-6" />
          )}
        </Button>
      </form>
    </Form>
  );
}
