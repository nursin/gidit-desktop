/**
 * Electron main-side AI helper: triage a brain dump into tasks/notes/calendarEvents/finance.
 *
 * This module is intended to run in the Electron main process (or a helper service module).
 * It uses the Ollama CLI (preferred) to run a local model, and falls back to a local Python
 * script if Ollama is not available. The function returns a typed object validated with zod.
 *
 * NOTE: The actual model name used by Ollama can be configured with the OLLAMA_MODEL env var.
 * You should wire this function up to an IPC handler (e.g. in main.ts) so the renderer can call it.
 */

import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
import { z } from 'zod';

const execFileAsync = promisify(execFile);

// Schemas and Types
const TriageBrainDumpInputSchema = z.object({
  brainDump: z.string().describe('A brain dump containing a list of thoughts and ideas.'),
});
export type TriageBrainDumpInput = z.infer<typeof TriageBrainDumpInputSchema>;

const TriageBrainDumpOutputSchema = z.object({
  tasks: z.array(z.string()).describe('A list of tasks extracted from the brain dump.'),
  notes: z.array(z.string()).describe('A list of notes extracted from the brain dump.'),
  calendarEvents: z.array(z.string()).describe('A list of calendar events extracted from the brain dump.'),
  finance: z.array(z.string()).describe('A list of finance-related items extracted from the brain dump.'),
});
export type TriageBrainDumpOutput = z.infer<typeof TriageBrainDumpOutputSchema>;

// Config: model to use with Ollama (can be overridden by env)
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'ggml-mpt' /* default placeholder */;
// Increase buffer in case model outputs large JSON
const EXEC_OPTS = { maxBuffer: 10 * 1024 * 1024 }; // 10 MB

function buildPrompt(brainDump: string) {
  return `You are a personal assistant that helps users organize their thoughts. The user will provide a brain dump, and you will triage the items into the following categories:

- Tasks: Action items that need to be done.
- Notes: Information that needs to be recorded.
- Calendar Events: Events that need to be added to the calendar.
- Finance: Financial transactions or items that need to be tracked.

Brain Dump:
${brainDump}

Format the output as a JSON object with the keys "tasks", "notes", "calendarEvents", and "finance". Each key should contain a list of strings.
`;
}

/**
 * Try to extract JSON object substring from arbitrary text output.
 */
function extractJson(text: string): string | null {
  const first = text.indexOf('{');
  const last = text.lastIndexOf('}');
  if (first === -1 || last === -1 || last <= first) return null;
  return text.slice(first, last + 1);
}

/**
 * Attempts to run Ollama CLI with the configured model. Returns stdout as string.
 * Throws if Ollama is not available or command fails.
 */
async function runOllama(prompt: string): Promise<string> {
  // Typical ollama usage: `ollama run <model> --prompt "<prompt>"` (CLI may vary by version).
  // We attempt to pass the prompt via the `--prompt` flag to avoid shell quoting issues.
  const args = ['run', OLLAMA_MODEL, '--prompt', prompt];
  try {
    const { stdout } = await execFileAsync('ollama', args, EXEC_OPTS as any);
    return stdout;
  } catch (err: any) {
    // Re-throw with some context
    throw new Error(`Ollama CLI failed or is not available: ${err?.message || String(err)}`);
  }
}

/**
 * Fallback: run a Python script (if present) to generate the triage JSON.
 * Expected script path: same directory as this file named 'triage_brain_dump.py'.
 * The script should read the prompt from stdin and print JSON to stdout.
 */
async function runPythonFallback(prompt: string): Promise<string> {
  const scriptPath = path.resolve(__dirname, 'triage_brain_dump.py');
  if (!fs.existsSync(scriptPath)) {
    throw new Error(`Python fallback script not found at ${scriptPath}`);
  }
  try {
    const { stdout } = await execFileAsync('python3', [scriptPath], { input: prompt, ...EXEC_OPTS } as any);
    return stdout;
  } catch (err: any) {
    throw new Error(`Python fallback failed: ${err?.message || String(err)}`);
  }
}

/**
 * Main exported function to triage the brain dump.
 * Validates inputs and outputs with zod.
 */
export async function triageBrainDump(input: TriageBrainDumpInput): Promise<TriageBrainDumpOutput> {
  // Validate input
  const parsedInput = TriageBrainDumpInputSchema.parse(input);
  const prompt = buildPrompt(parsedInput.brainDump);

  let rawOutput = '';
  // Try Ollama first, then Python fallback
  try {
    rawOutput = await runOllama(prompt);
  } catch (ollamaErr) {
    // eslint-disable-next-line no-console
    console.warn('runOllama failed, attempting Python fallback:', (ollamaErr as Error).message);
    rawOutput = await runPythonFallback(prompt);
  }

  // Attempt to extract JSON portion from raw output
  const jsonText = extractJson(rawOutput) ?? rawOutput.trim();

  // Parse JSON and validate shape
  try {
    const parsed = JSON.parse(jsonText);
    const validated = TriageBrainDumpOutputSchema.parse(parsed);
    return validated;
  } catch (err) {
    // Helpful error with some debugging info
    throw new Error(`Failed to parse/validate triage output. Raw output: ${rawOutput}\nError: ${(err as Error).message}`);
  }
}
