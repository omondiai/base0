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
const ffmpeg = require('ffmpeg-static');
const ffprobe = require('ffprobe-static');
import {spawn} from 'child_process';
import {writeFile, unlink, readFile} from 'fs/promises';
import {tmpdir} from 'os';
import {join} from 'path';

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
async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });
    const bufs: Buffer[] = [];
    writer.on('error', reject);
    writer.on('data', d => bufs.push(d));
    writer.on('end', () => resolve(Buffer.concat(bufs)));
    writer.write(pcmData);
    writer.end();
  });
}

// Helper to get audio duration
async function getAudioDuration(audioFilePath: string): Promise<number> {
    return new Promise((resolve, reject) => {
      const ffprobeProcess = spawn(ffprobe.path, [
        '-v', 'error',
        '-show_entries', 'format=duration',
        '-of', 'default=noprint_wrappers=1:nokey=1',
        audioFilePath
      ]);
  
      let duration = '';
      ffprobeProcess.stdout.on('data', (data) => {
        duration += data.toString();
      });
  
      let stderr = '';
      ffprobeProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });
  
      ffprobeProcess.on('close', (code) => {
        if (code === 0) {
          resolve(parseFloat(duration));
        } else {
          reject(new Error(`ffprobe exited with code ${code}: ${stderr}`));
        }
      });
       ffprobeProcess.on('error', (err) => {
        reject(err);
      });
    });
  }


const generateVideoFlow = ai.defineFlow(
  {
    name: 'generateVideoFlow',
    inputSchema: GenerateVideoInputSchema,
    outputSchema: GenerateVideoOutputSchema,
  },
  async ({image, narration, prompt}) => {
    let audioWavBuffer: Buffer | null = null;
    let audioUrl: string | undefined = undefined;
    let audioDuration = 5; // Default duration

    const tempImageFile = join(tmpdir(), `input-${Date.now()}.${image.substring(image.indexOf('/') + 1, image.indexOf(';'))}`);
    const tempAudioFile = join(tmpdir(), `input-${Date.now()}.wav`);
    const tempVideoFile = join(tmpdir(), `output-${Date.now()}.mp4`);
    
    // 1. Generate narration if text is provided
    if (narration) {
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
        prompt: narration,
      });

      if (media) {
        const pcmBuffer = Buffer.from(
          media.url.substring(media.url.indexOf(',') + 1),
          'base64'
        );
        audioWavBuffer = await toWav(pcmBuffer);
        audioUrl = 'data:audio/wav;base64,' + audioWavBuffer.toString('base64');
        await writeFile(tempAudioFile, audioWavBuffer);
        audioDuration = await getAudioDuration(tempAudioFile);
      }
    }

    // 2. Create video from image (and audio if available)
    const imageBuffer = Buffer.from(
      image.substring(image.indexOf(',') + 1),
      'base64'
    );
    
    await writeFile(tempImageFile, imageBuffer);

    const ffmpegPath = ffmpeg;
    if (!ffmpegPath) {
      throw new Error('Could not find ffmpeg binary.');
    }

    // FFmpeg command arguments
    const ffmpegArgs = [
      '-loop', '1', // Loop the input image
      '-i', tempImageFile,
    ];

    if (audioWavBuffer) {
      ffmpegArgs.push('-i', tempAudioFile, '-c:a', 'aac', '-b:a', '192k');
    } else {
      // If no audio, generate a silent track for the default duration
      ffmpegArgs.push('-f', 'lavfi', '-i', 'anullsrc=r=44100:cl=mono');
    }
    
    ffmpegArgs.push(
      '-t', `${audioDuration}`, // set duration
      '-c:v', 'libx264', // Video codec
      '-pix_fmt', 'yuv420p', // Pixel format for compatibility
      '-vf', "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2,setsar=1", // Scale and pad to 720p
      '-y', // Overwrite output file if it exists
      tempVideoFile
    );

    // Execute FFmpeg
    await new Promise<void>((resolve, reject) => {
      const process = spawn(ffmpegPath, ffmpegArgs);

      let stderr = '';
      process.stderr.on('data', data => {
        stderr += data.toString();
      });

      process.on('close', code => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`ffmpeg process exited with code ${code}: ${stderr}`));
        }
      });
      process.on('error', err => {
        reject(err);
      });
    });

    const videoBuffer = await readFile(tempVideoFile);

    // Clean up temporary files
    await unlink(tempImageFile);
    if(audioWavBuffer) await unlink(tempAudioFile);
    await unlink(tempVideoFile);

    return {
      videoUrl: 'data:video/mp4;base64,' + videoBuffer.toString('base64'),
      audioUrl: audioUrl,
    };
  }
);
