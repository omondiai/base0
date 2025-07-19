'use server';

/**
 * @fileOverview AI agent that enhances or combines existing images based on a text prompt.
 *
 * - enhanceImage - A function that enhances or combines images based on a text description.
 * - EnhanceImageInput - The input type for the enhanceImage function.
 * - EnhanceImageOutput - The return type for the enhanceImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {MediaPart} from 'genkit/media';

const EnhanceImageInputSchema = z.object({
  images: z
    .array(
      z
        .string()
        .describe(
          "An image to process, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
        )
    )
    .min(1),
  prompt: z
    .string()
    .optional()
    .describe(
      'An optional text description of how to enhance or combine the images.'
    ),
});

export type EnhanceImageInput = z.infer<typeof EnhanceImageInputSchema>;

const EnhanceImageOutputSchema = z.object({
  imageUrl: z.string().describe('The data URI of the generated image.'),
});

export type EnhanceImageOutput = z.infer<typeof EnhanceImageOutputSchema>;

export async function enhanceImage(
  input: EnhanceImageInput
): Promise<EnhanceImageOutput> {
  return enhanceImageFlow(input);
}

const enhanceImageFlow = ai.defineFlow(
  {
    name: 'enhanceImageFlow',
    inputSchema: EnhanceImageInputSchema,
    outputSchema: EnhanceImageOutputSchema,
  },
  async input => {
    const defaultSingleImagePrompt = 'Enhance this image to look like a professional graphic design. Improve lighting, color, composition, and overall appeal.';
    const defaultMultiImagePrompt = 'Combine these images into a single, cohesive, and professional-looking graphic design. Arrange them in an aesthetically pleasing way.';
    
    let textPrompt;
    if (input.prompt) {
      textPrompt = input.prompt;
    } else if (input.images.length > 1) {
      textPrompt = defaultMultiImagePrompt;
    } else {
      textPrompt = defaultSingleImagePrompt;
    }

    const promptParts: (MediaPart | string)[] = input.images.map(image => ({
      media: {url: image},
    }));
    promptParts.push(textPrompt);

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
