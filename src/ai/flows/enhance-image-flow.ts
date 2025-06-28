'use server';

/**
 * @fileOverview AI agent that enhances an existing image based on a text prompt.
 *
 * - enhanceImage - A function that enhances an image based on an optional text description.
 * - EnhanceImageInput - The input type for the enhanceImage function.
 * - EnhanceImageOutput - The return type for the enhanceImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EnhanceImageInputSchema = z.object({
  image: z
    .string()
    .describe(
      "The image to enhance, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  prompt: z
    .string()
    .optional()
    .describe('An optional text description of how to enhance the image.'),
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
    const textPrompt =
      input.prompt ||
      'Enhance this image to look like a professional graphic design. Improve lighting, color, composition, and overall appeal.';

    const {media} = await ai.generate({
      model: 'googleai/gemini-2.0-flash-preview-image-generation',
      prompt: [{media: {url: input.image}}, {text: textPrompt}],
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
