// The use server directive must come at the top of the file
'use server';

/**
 * @fileOverview AI agent that generates audio narration from text.
 *
 * - generateNarration - A function that generates audio from text.
 * - GenerateNarrationInput - The input type for the generateNarration function.
 * - GenerateNarrationOutput - The return type for the generateNarration function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import wav from 'wav';

const GenerateNarrationInputSchema = z.object({
  narrationText: z.string().describe('The text to be converted to speech.'),
});
export type GenerateNarrationInput = z.infer<
  typeof GenerateNarrationInputSchema
>;

const GenerateNarrationOutputSchema = z.object({
  audioUrl: z
    .string()
    .describe(
      'The data URI of the generated audio narration, in WAV format.'
    ),
});
export type GenerateNarrationOutput = z.infer<
  typeof GenerateNarrationOutputSchema
>;

export async function generateNarration(
  input: GenerateNarrationInput
): Promise<GenerateNarrationOutput> {
  return generateNarrationFlow(input);
}

async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    const bufs: Buffer[] = [];
    writer.on('error', reject);
    writer.on('data', function (d) {
      bufs.push(d);
    });
    writer.on('end', function () {
      resolve(Buffer.concat(bufs).toString('base64'));
    });

    writer.write(pcmData);
    writer.end();
  });
}

const generateNarrationFlow = ai.defineFlow(
  {
    name: 'generateNarrationFlow',
    inputSchema: GenerateNarrationInputSchema,
    outputSchema: GenerateNarrationOutputSchema,
  },
  async ({narrationText}) => {
    if (!narrationText) {
      return {audioUrl: ''};
    }

    const {media} = await ai.generate({
      model: googleAI.model('gemini-2.5-flash-preview-tts'),
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {voiceName: 'Algenib'},
          },
        },
      },
      prompt: narrationText,
    });
    if (!media) {
      throw new Error('no media returned');
    }
    const audioBuffer = Buffer.from(
      media.url.substring(media.url.indexOf(',') + 1),
      'base64'
    );

    const wavBase64 = await toWav(audioBuffer);

    return {
      audioUrl: 'data:audio/wav;base64,' + wavBase64,
    };
  }
);
