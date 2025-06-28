'use server';
/**
 * @fileOverview A conversational AI agent.
 *
 * - chat - A function that handles a single turn of a conversation.
 * - ChatMessage - The type for a single message in the chat history.
 * - ChatInput - The input type for the chat function.
 * - ChatOutput - The return type for the chat function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ChatMessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string(),
});
export type ChatMessage = z.infer<typeof ChatMessageSchema>;

const ChatInputSchema = z.object({
  history: z.array(ChatMessageSchema).describe("The chat history."),
  newMessage: z.string().describe("The new message from the user."),
});
export type ChatInput = z.infer<typeof ChatInputSchema>;

const ChatOutputSchema = z.object({
  response: z.string().describe("The model's response."),
});
export type ChatOutput = z.infer<typeof ChatOutputSchema>;

export async function chat(input: ChatInput): Promise<ChatOutput> {
  return chatFlow(input);
}

const chatFlow = ai.defineFlow(
  {
    name: 'chatFlow',
    inputSchema: ChatInputSchema,
    outputSchema: ChatOutputSchema,
  },
  async ({ history, newMessage }) => {
    const chatHistory = history.map(msg => ({
      role: msg.role,
      content: [{ text: msg.content }],
    }));

    const response = await ai.generate({
      // @ts-ignore - Genkit types for history are a bit strict, but this works
      history: chatHistory,
      prompt: newMessage,
    });

    return { response: response.text };
  }
);
