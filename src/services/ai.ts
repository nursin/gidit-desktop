/**
 * Renderer-side AI service for extracting micro-tasks.
 *
 * This module replaces server-side GenKit flows. It validates input/output
 * with zod and delegates actual model invocation to the Electron main process
 * via IPC (preload should expose window.api.invoke).
 *
 * The main process is responsible for running the local model (Ollama or
 * Python-based pipelines) and returning a plain JSON object matching the
 * ExtractMicroTasksOutput schema.
 */

import { z } from 'zod';

const ExtractMicroTasksInputSchema = z.object({
  taskDescription: z
    .string()
    .describe('A detailed description of a task or project.'),
});
export type ExtractMicroTasksInput = z.infer<typeof ExtractMicroTasksInputSchema>;

const ExtractMicroTasksOutputSchema = z.object({
  microTasks: z
    .array(z.string())
    .describe('A list of micro-tasks extracted from the task description.'),
});
export type ExtractMicroTasksOutput = z.infer<typeof ExtractMicroTasksOutputSchema>;

/**
 * Minimal typing for the preload-exposed API. Ensure your preload.ts exposes
 * an `api.invoke(channel, ...args)` that calls ipcRenderer.invoke under the hood.
 */
declare global {
  interface Window {
    api?: {
      invoke: (channel: string, ...args: any[]) => Promise<any>;
    };
  }
}

/**
 * extractMicroTasks
 *
 * Calls the main process to run the AI model that extracts micro-tasks.
 * Validates input and output with zod schemas.
 *
 * IPC channel used: 'ai:extractMicroTasks'
 */
export async function extractMicroTasks(
  input: ExtractMicroTasksInput
): Promise<ExtractMicroTasksOutput> {
  // Validate input early
  const parsedInput = ExtractMicroTasksInputSchema.parse(input);

  if (!window.api || typeof window.api.invoke !== 'function') {
    throw new Error(
      'window.api.invoke is not available. Ensure preload exposes an invoke API.'
    );
  }

  // Invoke Electron main. Main should run the model (Ollama/Python) and return JSON.
  const result = await window.api.invoke('ai:extractMicroTasks', parsedInput);

  // Validate and return
  return ExtractMicroTasksOutputSchema.parse(result);
}
