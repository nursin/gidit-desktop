import { ipcMain } from 'electron';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { z } from 'zod';

const execFileAsync = promisify(execFile);

const OLLAMA_CLI = process.env.OLLAMA_CLI_PATH || 'ollama';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama2'; // override via env if needed
const OLLAMA_TIMEOUT_MS = Number(process.env.OLLAMA_TIMEOUT_MS || 60_000); // 60s default

// Input schema
const GenerateFlashcardsInputSchema = z.object({
  topic: z.string().min(1).describe('The subject or topic for which to generate flashcards.'),
  count: z
    .number()
    .int()
    .positive()
    .optional()
    .default(10)
    .describe('The number of flashcards to generate.'),
});
export type GenerateFlashcardsInput = z.infer<typeof GenerateFlashcardsInputSchema>;

// Flashcard schema
const FlashcardSchema = z.object({
  front: z.string().describe(
    "The front of the flashcard (question, term, or cloze deletion sentence). For cloze, use '...' for the blank part."
  ),
  back: z.string().describe("The back of the flashcard (answer or the filled-in word for cloze)."),
});

const GenerateFlashcardsOutputSchema = z.object({
  cards: z.array(FlashcardSchema).describe('An array of generated flashcards.'),
});
export type GenerateFlashcardsOutput = z.infer<typeof GenerateFlashcardsOutputSchema>;

/**
 * Build the prompt to send to the local model.
 */
function buildPrompt(input: GenerateFlashcardsInput) {
  const count = input.count ?? 10;
  return [
    'You are an expert educator. Your task is to create a set of high-quality flashcards in strict JSON format.',
    `Topic: ${input.topic}`,
    `Number of cards to generate: ${count}`,
    '',
    'Generate a mix of question/answer, term/definition, and cloze deletion style cards. For cloze deletion, replace the key term in a sentence with "...".',
    '',
    'Return ONLY a JSON object that matches this schema:',
    JSON.stringify(
      {
        cards: [{ front: 'string', back: 'string' }],
      },
      null,
      2
    ),
    '',
    'Ensure the JSON is parseable (no surrounding text).',
  ].join('\n');
}

/**
 * Call Ollama CLI to get model output.
 * Tries to call: ollama run <model> --json --prompt "<prompt>"
 * Note: CLI args may vary across Ollama versions; adjust OLLAMA_CLI/OLLAMA_MODEL env vars accordingly.
 */
async function callOllama(prompt: string): Promise<string> {
  // Build args. Use --json if available to encourage structured output.
  const args = ['run', OLLAMA_MODEL, '--prompt', prompt, '--json'];

  try {
    const { stdout, stderr } = await execFileAsync(OLLAMA_CLI, args, {
      timeout: OLLAMA_TIMEOUT_MS,
      maxBuffer: 10 * 1024 * 1024,
    });

    if (stderr && stderr.trim()) {
      // Not fatal, but log for debugging in main process logs.
      console.warn('Ollama stderr:', stderr);
    }

    return stdout;
  } catch (err: any) {
    // Provide a helpful error message for main process logs and propagate to renderer.
    const message = err?.stderr || err?.message || String(err);
    throw new Error(`Ollama CLI call failed: ${message}`);
  }
}

/**
 * Try to extract JSON object from a string. This is tolerant in case the model returns surrounding text.
 */
function extractJsonFromString(text: string): string | null {
  const first = text.indexOf('{');
  const last = text.lastIndexOf('}');
  if (first === -1 || last === -1 || last <= first) return null;
  return text.slice(first, last + 1);
}

/**
 * Generate flashcards by validating input, calling the local model, and validating output.
 */
export async function generateFlashcards(inputLike: unknown): Promise<GenerateFlashcardsOutput> {
  // Validate input
  const input = GenerateFlashcardsInputSchema.parse(inputLike);

  const prompt = buildPrompt(input);

  const raw = await callOllama(prompt);

  // Try parsing direct JSON from stdout
  let parsed: unknown = null;

  // Some Ollama configs output JSON directly; try parsing stdout as JSON first.
  try {
    parsed = JSON.parse(raw);
  } catch {
    // If direct parse fails, try extracting JSON substring.
    const jsonStr = extractJsonFromString(raw);
    if (jsonStr) {
      try {
        parsed = JSON.parse(jsonStr);
      } catch (e) {
        throw new Error('Model returned text that could not be parsed as JSON.');
      }
    } else {
      throw new Error('Model did not return JSON output.');
    }
  }

  // Validate output shape
  const out = GenerateFlashcardsOutputSchema.parse(parsed);
  return out;
}

/**
 * Register an IPC handler on the provided ipcMain instance.
 * Call this from your main.ts during app initialization.
 *
 * Example in main.ts:
 *   import { registerGenerateFlashcardsIpc } from './services/generate-flashcards';
 *   registerGenerateFlashcardsIpc();
 */
export function registerGenerateFlashcardsIpc() {
  // Avoid double-registering handlers when reloading in dev.
  const channel = 'ai:generate-flashcards';
  // Remove existing handler if present (safe no-op in many Electron versions).
  try {
    // @ts-expect-error - some Electron versions expose removeHandler
    if ((ipcMain as any).removeHandler) {
      (ipcMain as any).removeHandler(channel);
    }
  } catch {
    // ignore
  }

  ipcMain.handle(channel, async (_event, input) => {
    // Returns a serializable object or throws an error which will be forwarded to the renderer.
    return generateFlashcards(input);
  });
}
