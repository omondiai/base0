// src/ai/flows/transfer-style-from-image.ts
'use server';
/**
 * @fileOverview An AI agent that transfers the style from a user-uploaded image to a newly generated image.
 *
 * - transferStyleFromImage - A function that handles the style transfer process.
 * - TransferStyleFromImageInput - The input type for the transferStyleFromImage function.
 * - TransferStyleFromImageOutput - The return type for the transferStyleFromImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TransferStyleFromImageInputSchema = z.object({
  baseImagePrompt: z
    .string()
    .describe('A text prompt describing the base image to generate.'),
  styleImage: z
    .string()
    .describe(
      'A photo whose style should be transferred to the generated image, as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.'    ),
  styleStrength: z
    .number()
    .min(0)
    .max(1)
    .default(0.5)
    .describe(
      'The strength of the style transfer, from 0 (no style transfer) to 1 (full style transfer).'
    ),
});
export type TransferStyleFromImageInput = z.infer<typeof TransferStyleFromImageInputSchema>;

const TransferStyleFromImageOutputSchema = z.object({
  generatedImage: z
    .string()
    .describe(
      'The generated image with the transferred style, as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.'    ),
});
export type TransferStyleFromImageOutput = z.infer<typeof TransferStyleFromImageOutputSchema>;

export async function transferStyleFromImage(
  input: TransferStyleFromImageInput
): Promise<TransferStyleFromImageOutput> {
  return transferStyleFromImageFlow(input);
}

const prompt = ai.definePrompt({
  name: 'transferStyleFromImagePrompt',
  input: {schema: TransferStyleFromImageInputSchema},
  output: {schema: TransferStyleFromImageOutputSchema},
  prompt: `You are an AI that transfers the style of a given image to a newly generated image based on a text prompt.

  The user will provide a base image prompt and a style image. You will generate an image based on the base image prompt, but with the style of the style image applied to it.

  The user can control style strength by providing styleStrength number between 0 and 1. By default the styleStrength is 0.5.

  Base Image Prompt: {{{baseImagePrompt}}}
  Style Image: {{media url=styleImage}}
  Style Strength: {{{styleStrength}}}

  Return the generated image as a data URI.
  `,
});

const transferStyleFromImageFlow = ai.defineFlow(
  {
    name: 'transferStyleFromImageFlow',
    inputSchema: TransferStyleFromImageInputSchema,
    outputSchema: TransferStyleFromImageOutputSchema,
  },
  async input => {
    const {media} = await ai.generate({
      model: 'googleai/gemini-2.0-flash-preview-image-generation',
      prompt: [
        {media: {url: input.styleImage}},
        {
          text: `generate an image of ${input.baseImagePrompt} with style strength ${input.styleStrength}`,
        },
      ],
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    return {generatedImage: media!.url!};
  }
);
