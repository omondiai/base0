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
    const systemPrompt = `You are a highly specialized image generation AI. Your purpose is to function as a photorealistic, fine-tuned character model (like a LoRA or Dreambooth). Your single most important task is to preserve the identity of a character provided via reference images with 100% accuracy.

    **CRITICAL DIRECTIVE: IDENTITY LOCK & PHOTOREALISM**
    You MUST treat the provided reference images as an 'identity lock'. This is not a suggestion for style, it is a command for photorealistic replication. Your highest priority is to perfectly replicate the person in the reference images. All other aspects of the prompt are secondary to this.

    - **FACE:** Replicate the facial features—eyes, nose, mouth, jawline, and bone structure—with *absolute precision*. The generated face must be indistinguishable from the reference photos. The shape, size, and look must be maintained.
    - **NO STYLIZATION:** You are forbidden from creating 'toon' images, caricatures, or any stylized interpretation of the character. The output must be a stunning, high-quality, REALISTIC photo that perfectly matches the realism of the provided images. Any distortion of the face is a failure.
    - **SKIN TONE & TEXTURE:** Match the exact skin tone and texture.
    - **BODY SHAPE:** Preserve the character's height, weight, and body structure.
    - **DO NOT DEVIATE:** Do not interpret, enhance, or stylize the character. Replicate the person exactly as shown. Any deviation from the reference identity is a failure.

    You will receive the reference images first, which establish the character's identity lock. After the images, you will receive a prompt for the scene. Your task is to place the *identical* person from the reference photos into the scene described.`;

    const promptParts: (MediaPart | {text: string})[] = [{text: systemPrompt}];

    // Add all character reference images to establish the 'identity lock'
    input.characterImages.forEach(image => {
      promptParts.push({media: {url: image}});
    });

    // Add the user's text prompt as the final instruction
    promptParts.push({
      text: `IDENTITY ESTABLISHED. Now, generate a high-quality, stunning, and photorealistic image based on the following scene description: "${input.prompt}". Remember, the character's appearance is non-negotiable and must be an exact, unaltered match to the reference images. Do not generate a 'toon' or stylized image.`,
    });

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
