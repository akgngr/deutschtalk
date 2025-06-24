'use server';
/**
 * @fileOverview Suggest replies for a chat conversation.
 *
 * - suggestReplies - A function that suggests replies based on conversation history.
 * - SuggestRepliesInput - The input type for the suggestReplies function.
 * - SuggestRepliesOutput - The return type for the suggestReplies function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const MessageContextSchema = z.object({
  sender: z.string().describe("The display name of the person who sent the message."),
  text: z.string().describe("The content of the message."),
});

const SuggestRepliesInputSchema = z.object({
  history: z.array(MessageContextSchema).describe('The last few messages in the conversation.'),
  responderName: z.string().describe("The name of the user for whom we are generating replies."),
});
export type SuggestRepliesInput = z.infer<typeof SuggestRepliesInputSchema>;

const SuggestRepliesOutputSchema = z.object({
  suggestions: z
    .array(z.string())
    .describe('An array of 3 short, natural-sounding reply suggestions in German.'),
});
export type SuggestRepliesOutput = z.infer<typeof SuggestRepliesOutputSchema>;

export async function suggestReplies(input: SuggestRepliesInput): Promise<SuggestRepliesOutput> {
  return suggestRepliesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestRepliesPrompt',
  input: {schema: SuggestRepliesInputSchema},
  output: {schema: SuggestRepliesOutputSchema},
  prompt: `You are a helpful and friendly German language tutor.
Your student, {{responderName}}, is in a chat conversation and needs help with what to say next.
Look at the conversation history and provide 3 short, natural-sounding replies in German that {{responderName}} could send.
The replies should be appropriate for the context of the conversation. Keep them concise and typical for a casual chat.

Conversation History:
{{#each history}}
{{sender}}: {{text}}
{{/each}}

Generate 3 suggestions for {{responderName}}.
`,
});

const suggestRepliesFlow = ai.defineFlow(
  {
    name: 'suggestRepliesFlow',
    inputSchema: SuggestRepliesInputSchema,
    outputSchema: SuggestRepliesOutputSchema,
  },
  async input => {
    // If history is empty, provide some conversation starters.
    if (input.history.length === 0) {
      return {
        suggestions: ["Hallo! Wie geht's?", "Hi, was machst du gerade?", "Hey! Lust zu plaudern?"],
      };
    }
    const {output} = await prompt(input);
    return output!;
  }
);
