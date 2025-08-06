'use server';

/**
 * @fileOverview AI agent that generates a video from an image and optional audio.
 *
 * - generateVideo - A function that generates a video.
 * - GenerateVideoInput - The input type for the generateVideo function.
 * - GenerateVideoOutput - The return type for the generateVideo function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import wav from 'wav';
import {MediaPart} from 'genkit/media';

const GenerateVideoInputSchema = z.object({
  image: z
    .string()
    .describe(
      "The image to use for the video, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  narration: z.string().optional().describe('Optional text for narration.'),
  prompt: z
    .string()
    .optional()
    .describe('An optional text prompt for the video content.'),
});
export type GenerateVideoInput = z.infer<typeof GenerateVideoInputSchema>;

const GenerateVideoOutputSchema = z.object({
  videoUrl: z.string().describe('The data URI of the generated video.'),
  audioUrl: z
    .string()
    .optional()
    .describe('The data URI of the generated audio.'),
});
export type GenerateVideoOutput = z.infer<typeof GenerateVideoOutputSchema>;

export async function generateVideo(
  input: GenerateVideoInput
): Promise<GenerateVideoOutput> {
  return generateVideoFlow(input);
}

// Helper to convert PCM audio data to a WAV file buffer
async function toWav(pcmData: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels: 1,
      sampleRate: 24000,
      bitDepth: 16,
    });
    const bufs: Buffer[] = [];
    writer.on('error', reject);
    writer.on('data', d => bufs.push(d));
    writer.on('end', () =>
      resolve('data:audio/wav;base64,' + Buffer.concat(bufs).toString('base64'))
    );
    writer.write(pcmData);
    writer.end();
  });
}

const generateVideoFlow = ai.defineFlow(
  {
    name: 'generateVideoFlow',
    inputSchema: GenerateVideoInputSchema,
    outputSchema: GenerateVideoOutputSchema,
  },
  async ({image, narration, prompt}) => {
    let audioUrl: string | undefined = undefined;
    let finalPrompt = prompt || 'Make this image come alive.';

    // 1. Generate narration if text is provided
    if (narration) {
      finalPrompt = `${finalPrompt}. The video should be narrated with the following text: "${narration}"`;
      const {media: audioMedia} = await ai.generate({
        model: googleAI.model('gemini-2.5-flash-preview-tts'),
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {voiceName: 'Algenib'},
            },
          },
        },
        prompt: narration,
      });

      if (audioMedia) {
        const pcmBuffer = Buffer.from(
          audioMedia.url.substring(audioMedia.url.indexOf(',') + 1),
          'base64'
        );
        audioUrl = await toWav(pcmBuffer);
      }
    }

    // 2. Generate video using Veo
    const videoPrompt: (string | MediaPart)[] = [
      {text: finalPrompt},
      {media: {url: image}},
    ];

    if (audioUrl) {
      videoPrompt.push({media: {url: audioUrl}});
    }

    let {operation} = await ai.generate({
      model: googleAI.model('veo-2.0-generate-001'),
      prompt: videoPrompt,
      config: {
        durationSeconds: 5,
        aspectRatio: '16:9',
        personGeneration: 'allow_adult',
      },
    });

    if (!operation) {
      throw new Error('Expected the model to return an operation.');
    }

    // Wait until the operation completes.
    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      operation = await ai.checkOperation(operation);
    }

    if (operation.error) {
      throw new Error(`Video generation failed: ${operation.error.message}`);
    }

    const videoPart = operation.output?.message?.content.find(p =>
      p.media?.contentType?.startsWith('video/')
    );

    if (!videoPart || !videoPart.media) {
      throw new Error('Failed to find the generated video in the response.');
    }

    // Veo returns a temporary URL. We need to fetch it and convert to a data URI.
    const fetch = (await import('node-fetch')).default;
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error(
        'GEMINI_API_KEY is not set. Please set it in your .env file.'
      );
    }
    const videoDownloadResponse = await fetch(
      `${videoPart.media.url}&key=${apiKey}`
    );

    if (!videoDownloadResponse.ok || !videoDownloadResponse.body) {
      throw new Error(
        `Failed to download video from Veo: ${videoDownloadResponse.statusText}`
      );
    }

    const videoBuffer = await videoDownloadResponse.arrayBuffer();
    const videoBase64 = Buffer.from(videoBuffer).toString('base64');
    const videoUrl = `data:${
      videoPart.media.contentType || 'video/mp4'
    };base64,${videoBase64}`;

    return {
      videoUrl,
      audioUrl,
    };
  }
);
