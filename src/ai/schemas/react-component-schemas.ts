/**
 * Schemas and types for the React Component Generator AI flow.
 *
 * Notes:
 * - Replaced genkit's `z` with zod for runtime validation.
 * - This file is intended for use in the renderer (UI) layer to validate
 *   inputs/outputs when interacting with the AI service via IPC.
 */

import { z } from 'zod';

export const GenerateReactComponentInputSchema = z.object({
  description: z.string().describe('A natural language description of the React component to be generated.'),
});
export type GenerateReactComponentInput = z.infer<typeof GenerateReactComponentInputSchema>;

export const GenerateReactComponentOutputSchema = z.object({
  // The complete, self-contained JavaScript code (not JSX) for the React component.
  componentCode: z.string().describe('The complete, self-contained JavaScript code (not JSX) for the React component.'),
});
export type GenerateReactComponentOutput = z.infer<typeof GenerateReactComponentOutputSchema>;
