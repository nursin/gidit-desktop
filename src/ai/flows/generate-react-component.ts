import { spawn } from 'child_process';
import { platform } from 'os';
import path from 'path';

/**
 * Electron main-side utility to generate a self-contained React component
 * using a locally-run Ollama model.
 *
 * This replaces the previous server-side "genkit" flow. The renderer should
 * call this via IPC (exposed in preload.ts) as e.g.:
 *   window.api.ai.generateReactComponent({ description })
 *
 * Notes:
 * - Ollama CLI must be installed and reachable in the runtime PATH for the
 *   packaged app, or you must ship a bundled Ollama binary and point to it.
 * - This function spawns the ollama CLI and returns the raw text output. The
 *   output is assumed to be the complete JS script described by the prompt.
 */

/* Types (kept minimal and local to avoid cross-deps) */
export type GenerateReactComponentInput = {
  description: string;
  model?: string; // Ollama model name, optional
  temperature?: number; // optional
  maxTokens?: number; // optional
};

export type GenerateReactComponentOutput = {
  code: string;
};

const DEFAULT_MODEL = 'llama2' as const;

/* Prompt based on the original flow. Kept as a single string and we'll inject the description. */
const BASE_PROMPT = `
You are an expert React developer. Your task is to write ONLY runnable JavaScript code (no markdown fences, no prose, and NO JSX).

**User Description:**
"{{{description}}}"

**Rules & Best Practices:**
1.  **JavaScript Only:** The entire component must be in a single block of pure JavaScript code. Do NOT use JSX. Use \`React.createElement\` for all elements.
2.  **No Imports/Exports:** The environment provides React as a global. Do NOT use \`import\`, \`require\`, or \`export\`.
3.  **Render API:** Use the globally available \`FrameAPI.render()\` function to render your root component into the 'center' anchor. Example: \`FrameAPI.render({ center: React.createElement(MyComponent) });\`
4.  **Self-Contained:** All components must be defined inline. Do not rely on any external libraries or variables, except for the global \`React\` and \`FrameAPI\` objects.
5.  **Styling:** Use inline styles for all styling. Create style objects and reference them. Example: \`const styles = { container: { padding: '1rem' } }; React.createElement('div', { style: styles.container })\`.
6.  **Completeness:** The generated code must be a complete, runnable script. It must not contain any placeholders or comments like "// your code here".
7.  **No Placeholders:** For images or data, generate plausible placeholder content directly in the code.
8.  **Fit to container:** The root element of your main component should have a style of \`{ width: '100%', height: '100%', boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center' }\` to ensure it fills its container.
`;

/**
 * Spawn the Ollama CLI to generate text for the given prompt.
 * Returns stdout as a string.
 */
async function runOllamaGenerate(prompt: string, model = DEFAULT_MODEL, temperature?: number, maxTokens?: number): Promise<string> {
  return await new Promise<string>((resolve, reject) => {
    const args: string[] = ['generate', model, '--prompt', prompt];

    // Add optional flags (note: actual Ollama CLI flag names may vary by version)
    if (typeof temperature === 'number') {
      args.push('--temperature', String(temperature));
    }
    if (typeof maxTokens === 'number') {
      args.push('--max-tokens', String(maxTokens));
    }

    // On some platforms packaged apps may require explicit path to binary.
    // Here we assume 'ollama' is on PATH. If you bundle it, adjust accordingly.
    const cmd = 'ollama';

    const proc = spawn(cmd, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      env: process.env,
    });

    let out = '';
    let err = '';

    proc.stdout.on('data', (chunk) => {
      out += chunk.toString();
    });
    proc.stderr.on('data', (chunk) => {
      err += chunk.toString();
    });

    proc.on('error', (e) => {
      reject(new Error(`Failed to start ollama CLI: ${e.message}`));
    });

    proc.on('close', (code) => {
      if (code === 0) {
        // Trim leading/trailing whitespace
        resolve(out.trim());
      } else {
        const message = err.trim() || `ollama exited with code ${code}`;
        reject(new Error(message));
      }
    });
  });
}

/**
 * Public entry: generate a React component script for the provided description.
 * This is intended to be called from Electron main handlers or exported to preload for IPC.
 */
export async function generateReactComponent(input: GenerateReactComponentInput): Promise<GenerateReactComponentOutput> {
  if (!input || typeof input.description !== 'string' || input.description.trim() === '') {
    throw new Error('generateReactComponent: description is required');
  }

  const model = input.model ?? DEFAULT_MODEL;
  const temperature = input.temperature;
  const maxTokens = input.maxTokens;

  // Build prompt by injecting the user description. We keep triple braces pattern from original.
  const prompt = BASE_PROMPT.replace('{{{description}}}', input.description.trim());

  try {
    const result = await runOllamaGenerate(prompt, model, temperature, maxTokens);
    // The model is expected to output the complete JS script. We return it as `code`.
    return { code: result };
  } catch (err: any) {
    // Bubble up a readable error for the caller / IPC layer
    throw new Error(`AI generation failed: ${err?.message ?? String(err)}`);
  }
}
