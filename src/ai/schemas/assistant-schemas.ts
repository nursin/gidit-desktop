/**
 * Schemas and types for the AI Assistant flow.
 *
 * Shared between Electron main and renderer processes.
 * Uses zod for runtime validation.
 */

import { z } from 'zod';

export const ChatMessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string(),
});

export type ChatMessage = z.infer<typeof ChatMessageSchema>;

export const ChatAssistantInputSchema = z.object({
  history: z.array(ChatMessageSchema).describe('The conversation history.'),
  message: z.string().describe('The latest user message.'),
});
export type ChatAssistantInput = z.infer<typeof ChatAssistantInputSchema>;

export const ChatAssistantOutputSchema = z.object({
  response: z.string().describe("The AI assistant's response."),
});
export type ChatAssistantOutput = z.infer<typeof ChatAssistantOutputSchema>;
