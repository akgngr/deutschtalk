// src/ai/flows/check-german-flow.ts
'use server';

/**
 * @fileOverview This file defines a Genkit flow for checking if a given message is fully in German.
 * It uses an AI model to determine the language of the message and provides a boolean output.
 *
 * - checkGerman - A function that checks if a message is fully in German.
 * - CheckGermanInput - The input type for the checkGerman function.
 * - CheckGermanOutput - The return type for the checkGerman function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CheckGermanInputSchema = z.object({
  message: z.string().describe('The message to check for German language.'),
});
export type CheckGermanInput = z.infer<typeof CheckGermanInputSchema>;

const CheckGermanOutputSchema = z.object({
  isGerman: z.boolean().describe('True if the message is fully in German, false otherwise.'),
});
export type CheckGermanOutput = z.infer<typeof CheckGermanOutputSchema>;

export async function checkGerman(input: CheckGermanInput): Promise<CheckGermanOutput> {
  return checkGermanFlow(input);
}

const checkGermanPrompt = ai.definePrompt({
  name: 'checkGermanPrompt',
  input: {schema: CheckGermanInputSchema},
  output: {schema: CheckGermanOutputSchema},
  prompt: `You are a language expert. Determine if the following message is fully in German.

Message: {{{message}}}

Return true if the message is completely in German. Return false otherwise.`,
});

const checkGermanFlow = ai.defineFlow(
  {
    name: 'checkGermanFlow',
    inputSchema: CheckGermanInputSchema,
    outputSchema: CheckGermanOutputSchema,
  },
  async input => {
    const {output} = await checkGermanPrompt(input);
    return output!;
  }
);
