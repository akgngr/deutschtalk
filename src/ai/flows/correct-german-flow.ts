// src/ai/flows/correct-german-flow.ts
'use server';

/**
 * @fileOverview Correct German grammar and spelling.
 *
 * - correctGerman - A function that handles the grammar and spelling correction process.
 * - CorrectGermanInput - The input type for the correctGerman function.
 * - CorrectGermanOutput - The return type for the correctGerman function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CorrectGermanInputSchema = z.object({
  message: z.string().describe('The German message to be corrected.'),
});
export type CorrectGermanInput = z.infer<typeof CorrectGermanInputSchema>;

const CorrectGermanOutputSchema = z.object({
  correctedMessage: z.string().describe('The corrected German message.'),
  explanation: z.string().describe('An explanation of the corrections made.'),
});
export type CorrectGermanOutput = z.infer<typeof CorrectGermanOutputSchema>;

export async function correctGerman(input: CorrectGermanInput): Promise<CorrectGermanOutput> {
  return correctGermanFlow(input);
}

const prompt = ai.definePrompt({
  name: 'correctGermanPrompt',
  input: {schema: CorrectGermanInputSchema},
  output: {schema: CorrectGermanOutputSchema},
  prompt: `You are a expert German language teacher. 

You will be given a message in German, and your job is to correct any grammar or spelling mistakes. You will also provide an explanation of the corrections you made. 

Message: {{{message}}}
`,
});

const correctGermanFlow = ai.defineFlow(
  {
    name: 'correctGermanFlow',
    inputSchema: CorrectGermanInputSchema,
    outputSchema: CorrectGermanOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
