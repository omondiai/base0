'use server';
/**
 * @fileOverview A conversational AI agent.
 *
 * - chat - A function that handles a single turn of a conversation.
 * - ChatMessage - The type for a single message in the chat history.
 * - ChatInput - The input type for the chat function.
 * - ChatOutput - The return type for the chat function.
 * - ChartData - The type for chart data that can be returned by the AI.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ChatMessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string(),
});
export type ChatMessage = z.infer<typeof ChatMessageSchema>;

const ChartDataSchema = z.object({
    title: z.string().describe('A descriptive title for the chart.'),
    data: z.array(z.record(z.any())).describe('The dataset for the chart, as an array of objects.'),
    categories: z.array(z.string()).describe('An array of keys from the data objects to be plotted as categories (e.g., lines or bars).'),
    index: z.string().describe('The key in the data objects to be used as the chart\'s primary index or x-axis.'),
    type: z.enum(['bar', 'line', 'area']).default('bar').describe('The preferred type of chart to display.'),
});
export type ChartData = z.infer<typeof ChartDataSchema>;


const ChatInputSchema = z.object({
  history: z.array(ChatMessageSchema).describe("The chat history."),
  newMessage: z.string().describe("The new message from the user."),
});
export type ChatInput = z.infer<typeof ChatInputSchema>;

const ChatOutputSchema = z.object({
  response: z.string().describe("The model's textual response."),
  chart: ChartDataSchema.optional().describe("An optional chart to be displayed with the response if the user's query is best answered with a chart.")
});
export type ChatOutput = z.infer<typeof ChatOutputSchema>;

export async function chat(input: ChatInput): Promise<ChatOutput> {
  return chatFlow(input);
}

const chatPrompt = ai.definePrompt({
    name: 'chatPrompt',
    input: { schema: z.object({ newMessage: z.string() }) },
    output: { schema: ChatOutputSchema },
    history: z.array(ChatMessageSchema),
    system: `You are Omondi AI, a friendly and helpful graphic design assistant.
- Your goal is to be a creative partner.
- If a user asks who you are, you must introduce yourself as Omondi AI.
- For image generation requests, you must politely direct the user to the "Generate" tab. Do not attempt to generate images yourself.
- You have the ability to generate data and configuration for charts and graphs to visualize information. If a user asks for data that can be visualized, provide a chart with a title, data, categories, an index, and a chart type.
- You must format your responses using Markdown. This includes lists, tables, bold text, etc.
- You must provide helpful and safe responses. Do not generate harmful, unethical, or inappropriate content.`,
    prompt: `{{{newMessage}}}`,
    config: {
        safetySettings: [
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        ],
    }
});


const chatFlow = ai.defineFlow(
  {
    name: 'chatFlow',
    inputSchema: ChatInputSchema,
    outputSchema: ChatOutputSchema,
  },
  async ({ history, newMessage }) => {
    const { output } = await chatPrompt({ newMessage }, { history });
    return output!;
  }
);
