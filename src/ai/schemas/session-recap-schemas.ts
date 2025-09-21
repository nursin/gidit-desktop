/**
 * Schemas and types for the Session Recap AI flow.
 * Adapted for the Electron + Vite + React renderer (uses zod).
 */

import { z } from 'zod';

export const GenerateSessionRecapInputSchema = z.object({
  recentTasks: z.string().describe('A list of tasks the user was recently working on.'),
});
export type GenerateSessionRecapInput = z.infer<typeof GenerateSessionRecapInputSchema>;

export const GenerateSessionRecapOutputSchema = z.object({
  recap: z.string().describe(
    'A short, encouraging summary of the recent tasks, using memory-activating words.'
  ),
});
export type GenerateSessionRecapOutput = z.infer<typeof GenerateSessionRecapOutputSchema>;
