'use server';
/**
 * @fileOverview AI agent that generates an image using a trained character model.
 *
 * - generateImageWithCharacter - A function that generates an image based on a text prompt and a set of reference character images.
 * - GenerateImageWithCharacterInput - The input type for the function.
 * - GenerateImageWithCharacterOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {MediaPart} from 'genkit/media';

const GenerateImageWithCharacterInputSchema = z.object({
  prompt: z.string().describe('A detailed text description of the desired scene.'),
  characterImages: z
    .array(
      z
        .string()
        .describe(
          "A reference image of the character, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
        )
    )
    .min(1)
    .describe('An array of reference images for the character.'),
});

export type GenerateImageWithCharacterInput = z.infer<
  typeof GenerateImageWithCharacterInputSchema
>;

const GenerateImageWithCharacterOutputSchema = z.object({
  imageUrl: z.string().describe('The data URI of the generated image.'),
});

export type GenerateImageWithCharacterOutput = z.infer<
  typeof GenerateImageWithCharacterOutputSchema
>;

export async function generateImageWithCharacter(
  input: GenerateImageWithCharacterInput
): Promise<GenerateImageWithCharacterOutput> {
  return generateImageWithCharacterFlow(input);
}

const generateImageWithCharacterFlow = ai.defineFlow(
  {
    name: 'generateImageWithCharacterFlow',
    inputSchema: GenerateImageWithCharacterInputSchema,
    outputSchema: GenerateImageWithCharacterOutputSchema,
  },
  async input => {
    const systemPrompt = `You are an expert image generation AI. Your task is to create a new image based on a user's prompt, featuring a specific character provided through a set of reference images.
    It is crucial that you maintain the character's identity, including their facial features, skin tone, and body shape, exactly as shown in the reference images.
    Place this exact character into the scene described by the user's prompt.`;

    const promptParts: (MediaPart | string)[] = [systemPrompt];
    
    // Add all character reference images
    input.characterImages.forEach(image => {
      promptParts.push({ media: { url: image } });
    });
    
    // Add the user's text prompt
    promptParts.push(`User prompt: "${input.prompt}"`);

    const {media} = await ai.generate({
      model: 'googleai/gemini-2.0-flash-preview-image-generation',
      prompt: promptParts,
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
