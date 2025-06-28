// src/ai/flows/improve-image-generation-prompt.ts
'use server';
/**
 * @fileOverview This file defines a Genkit flow for improving image generation prompts.
 *
 * The flow takes an initial prompt as input and returns a refined prompt that incorporates missing details and better terminology to achieve better image generation results.
 *
 * @interface ImproveImageGenerationPromptInput - The input schema for the improveImageGenerationPrompt flow.
 * @interface ImproveImageGenerationPromptOutput - The output schema for the improveImageGenerationPrompt flow.
 * @function improveImageGenerationPrompt - The exported function that calls the improveImageGenerationPromptFlow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ImproveImageGenerationPromptInputSchema = z.object({
  originalPrompt: z
    .string()
    .describe('The original image generation prompt provided by the user.'),
});
export type ImproveImageGenerationPromptInput = z.infer<typeof ImproveImageGenerationPromptInputSchema>;

const ImproveImageGenerationPromptOutputSchema = z.object({
  improvedPrompt: z
    .string()
    .describe(
      'A refined image generation prompt that incorporates missing details, better terminology, and popular concepts for better results.'
    ),
});
export type ImproveImageGenerationPromptOutput = z.infer<typeof ImproveImageGenerationPromptOutputSchema>;

export async function improveImageGenerationPrompt(
  input: ImproveImageGenerationPromptInput
): Promise<ImproveImageGenerationPromptOutput> {
  return improveImageGenerationPromptFlow(input);
}

const improveImageGenerationPromptPrompt = ai.definePrompt({
  name: 'improveImageGenerationPromptPrompt',
  input: {schema: ImproveImageGenerationPromptInputSchema},
  output: {schema: ImproveImageGenerationPromptOutputSchema},
  prompt: `You are an expert prompt engineer specializing in improving image generation prompts.

  Given an initial image generation prompt, your goal is to refine it by incorporating missing details, better terminology, and popular concepts to achieve better results.

  Original Prompt: {{{originalPrompt}}}

  Improved Prompt:`, // The improved prompt will be generated here.
});

const improveImageGenerationPromptFlow = ai.defineFlow(
  {
    name: 'improveImageGenerationPromptFlow',
    inputSchema: ImproveImageGenerationPromptInputSchema,
    outputSchema: ImproveImageGenerationPromptOutputSchema,
  },
  async input => {
    const {output} = await improveImageGenerationPromptPrompt(input);
    return output!;
  }
);
