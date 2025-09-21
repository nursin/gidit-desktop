/**
 * Electron main: AI helper that invokes a local Ollama model via the CLI to
 * generate a categorized checklist of commonly forgotten items.
 *
 * Exports:
 * - generateForgettingSuggestions(): Promise<GenerateForgettingSuggestionsOutput>
 * - registerGenerateForgettingSuggestionsIpc(ipcMain): void
 *
 * Notes:
 * - This runs in the Electron main process and uses child_process to call
 *   the Ollama CLI. Ensure `ollama` is installed and the desired model is
 *   available locally.
 * - The model name can be configured with the OLLAMA_MODEL env var (defaults to "ggml/gpt-4o-mini" as an example).
 * - Output is validated with zod. If validation fails an error is thrown.
 */

import { execFile } from 'child_process';
import { promisify } from 'util';
import { z } from 'zod';
import type { IpcMain } from 'electron';

const execFileAsync = promisify(execFile);

/* Schemas */

const SuggestionSchema = z.object({
  category: z
    .string()
    .describe("The category of the suggestion (e.g., 'Home', 'Work', 'Health', 'Finance')."),
  suggestion: z
    .string()
    .describe('The specific item or task suggestion.'),
});

const GenerateForgettingSuggestionsOutputSchema = z.object({
  suggestions: z
    .array(SuggestionSchema)
    .describe('A list of categorized suggestions for things the user might be forgetting.'),
});
export type GenerateForgettingSuggestionsOutput = z.infer<
  typeof GenerateForgettingSuggestionsOutputSchema
>;

/* Prompt (kept concise and supportive) */
const PROMPT = `You are a helpful assistant designed to help people, especially those with ADHD, remember important things they might be forgetting.

Generate a concise, categorized checklist (as JSON) of common items, tasks, and appointments that people frequently forget. Cover a range of life areas like home, work, health, and finance. The tone should be gentle and supportive, not stressful. Aim for about 8-10 items in total.

Return strictly JSON with the following shape:
{
  "suggestions": [
    { "category": "Home", "suggestion": "Did you lock the door?" },
    ...
  ]
}

Examples (do not include the Examples keys in the output):
- Did you drink water recently?
- Are there any upcoming bills or subscriptions to check on?
- Have you taken your medication today?
- Is there an appointment you need to schedule or confirm?
- Did you reply to that important email?
`;

/**
 * Call Ollama CLI to generate suggestions.
 *
 * This implementation expects `ollama` to be on PATH. The model name can be
 * provided via OLLAMA_MODEL env var. If your Ollama setup requires different
 * CLI flags, adjust args below.
 */
export async function generateForgettingSuggestions(): Promise<GenerateForgettingSuggestionsOutput> {
  const model = process.env.OLLAMA_MODEL || 'ggml/gpt-4o-mini';
  const timeoutMs = Number(process.env.OLLAMA_TIMEOUT_MS || 30_000);

  // Attempt to call: ollama generate <model> --prompt "<PROMPT>" --json
  // Note: Ollama CLI flags vary between versions; adjust as necessary.
  // We pass the prompt via stdin to avoid shell escaping problems.
  const args = ['generate', model, '--prompt', PROMPT, '--json'];

  try {
    const { stdout, stderr } = await execFileAsync('ollama', args, {
      timeout: timeoutMs,
      maxBuffer: 10 * 1024 * 1024, // 10MB
      env: process.env,
    });

    if (stderr) {
      // Some versions of Ollama write informational logs to stderr; don't fail on that alone.
      // But capture it in case of error.
      console.debug('ollama stderr:', stderr);
    }

    // Try to parse JSON from stdout. Some models might output text; attempt to extract JSON.
    const text = stdout?.trim() ?? '';

    // If the model already outputs JSON, parse directly. Otherwise, try to extract a JSON block.
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      // Try to find the first JSON object/array in the text
      const jsonMatch = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
      if (!jsonMatch) {
        throw new Error('Failed to parse JSON from model output');
      }
      parsed = JSON.parse(jsonMatch[0]);
    }

    // Validate shape using zod
    const validated = GenerateForgettingSuggestionsOutputSchema.parse(parsed);
    return validated;
  } catch (err: any) {
    // Wrap errors to provide more context for the main process / renderer callers.
    const message =
      err?.message ??
      'Unknown error while generating forgetting suggestions via Ollama CLI';
    throw new Error(`AI generateForgettingSuggestions failed: ${message}`);
  }
}

/**
 * Helper: register an IPC handler so renderer can request generation.
 *
 * Usage in main.ts:
 *   import { registerGenerateForgettingSuggestionsIpc } from './ai/generate-forgetting-suggestions';
 *   registerGenerateForgettingSuggestionsIpc(appMainIpc);
 */
export function registerGenerateForgettingSuggestionsIpc(ipcMain: IpcMain) {
  // channel: 'ai:generate-forgetting-suggestions'
  // It returns the validated JSON or throws (which becomes an IPC error).
  ipcMain.handle('ai:generate-forgetting-suggestions', async () => {
    return generateForgettingSuggestions();
  });
}
