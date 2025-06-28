// The use server directive must come at the top of the file
'use server';

/**
 * @fileOverview AI agent that generates images from text descriptions.
 *
 * - generateImageFromDescription - A function that generates an image based on a text description.
 * - GenerateImageFromDescriptionInput - The input type for the generateImageFromDescription function.
 * - GenerateImageFromDescriptionOutput - The return type for the generateImageFromDescription function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateImageFromDescriptionInputSchema = z.object({
  description: z.string().describe('A detailed text description of the desired image.'),
});

export type GenerateImageFromDescriptionInput = z.infer<
  typeof GenerateImageFromDescriptionInputSchema
>;

const GenerateImageFromDescriptionOutputSchema = z.object({
  imageUrl: z.string().describe('The data URI of the generated image.'),
});

export type GenerateImageFromDescriptionOutput = z.infer<
  typeof GenerateImageFromDescriptionOutputSchema
>;

export async function generateImageFromDescription(
  input: GenerateImageFromDescriptionInput
): Promise<GenerateImageFromDescriptionOutput> {
  return generateImageFromDescriptionFlow(input);
}

const generateImageFromDescriptionPrompt = ai.definePrompt({
  name: 'generateImageFromDescriptionPrompt',
  input: {schema: GenerateImageFromDescriptionInputSchema},
  output: {schema: GenerateImageFromDescriptionOutputSchema},
  prompt: `Generate an image based on the following description: {{{description}}}.`,
});

const generateImageFromDescriptionFlow = ai.defineFlow(
  {
    name: 'generateImageFromDescriptionFlow',
    inputSchema: GenerateImageFromDescriptionInputSchema,
    outputSchema: GenerateImageFromDescriptionOutputSchema,
  },
  async input => {
    const {media} = await ai.generate({
      model: 'googleai/gemini-2.0-flash-preview-image-generation',
      prompt: input.description,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    if (!media) {
      throw new Error('No image was generated.');
    }

    return {imageUrl: media.url};
  }
);
