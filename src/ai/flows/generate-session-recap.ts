/**
 * Electron main: AI helper to generate a session recap using a local Ollama model.
 *
 * Notes:
 * - This file is intended to run in the Electron main process.
 * - It calls the Ollama CLI (must be installed & available in PATH) via child_process.
 * - The function returns a simple object { recap: string } which can be sent to the renderer via IPC.
 *
 * Usage (example wiring in main.ts):
 *   import { generateSessionRecap } from './ai/generate-session-recap';
 *   ipcMain.handle('ai:generate-session-recap', async (_event, input) => generateSessionRecap(input));
 *
 * Environment:
 * - OLLAMA_MODEL (optional) - model name to pass to `ollama run`. Defaults to 'llama2' (override to your local model).
 */

import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

export type GenerateSessionRecapInput = {
  // recentTasks may be a single string or an array of strings describing recent tasks
  recentTasks: string | string[];
};

export type GenerateSessionRecapOutput = {
  // The generated recap text
  recap: string;
};

const DEFAULT_MODEL = process.env.OLLAMA_MODEL ?? 'llama2';
const DEFAULT_TIMEOUT_MS = 60_000; // 60s, adjust as needed

function buildPrompt(recentTasks: string): string {
  return `You are a "RAM Loader" for a user with ADHD. Your job is to help the user quickly load the context of their last session back into their working memory by providing a detailed, specific summary of their recent activities.

Analyze the following list of recent tasks. Your response should be a detailed list, using clear headings or bullet points for maximum scannability. The total word count should be between 150 and 300 words.

Instead of a simple list of keywords, elaborate on each point. Extract the critical entities, project names, specific actions, and key concepts. Ensure each point in the list contains enough detail to trigger a deep memory recall. The goal is to provide a rich, detailed data-dump that makes it easy for the user to pick up exactly where they left off without having to re-read source documents.

Recent Tasks:
${recentTasks}

Generate the detailed recap now.`;
}

/**
 * Generate a session recap by invoking a local Ollama model via the ollama CLI.
 *
 * @param input - { recentTasks: string | string[] }
 * @returns Promise<{ recap: string }>
 *
 * Throws on CLI error or timeout.
 */
export async function generateSessionRecap(
  input: GenerateSessionRecapInput
): Promise<GenerateSessionRecapOutput> {
  const { recentTasks } = input;
  const recentTasksStr = Array.isArray(recentTasks) ? recentTasks.join('\n') : String(recentTasks ?? '');

  const prompt = buildPrompt(recentTasksStr);

  // Ollama CLI invocation:
  // - `ollama run <model> --prompt "<prompt>"`
  // Some Ollama installs accept --json or streaming; adjust per your local version.
  const model = DEFAULT_MODEL;

  try {
    const { stdout, stderr } = await execFileAsync(
      'ollama',
      ['run', model, '--prompt', prompt],
      {
        timeout: DEFAULT_TIMEOUT_MS,
        maxBuffer: 10 * 1024 * 1024, // 10MB
      }
    );

    if (stderr && stderr.trim().length > 0) {
      // ollama sometimes writes warnings to stderr; do not fail on non-empty stderr,
      // but surface if there's no stdout result.
      console.warn('ollama stderr:', stderr);
    }

    const recapText = stdout?.toString().trim() ?? '';

    if (!recapText) {
      throw new Error('Empty response from Ollama CLI');
    }

    return { recap: recapText };
  } catch (err: any) {
    // Normalize error for caller (main process or IPC handler)
    const message =
      err && typeof err === 'object' && 'message' in err
        ? String((err as any).message)
        : String(err);
    throw new Error(`generateSessionRecap failed: ${message}`);
  }
}
