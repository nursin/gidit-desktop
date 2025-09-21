/**
 * Electron main process service to synthesize SBAR reports using a local LLM (via Ollama CLI).
 *
 * - Runs in Electron main.
 * - Exposes an IPC handler 'ai:synthesize-sbar' (use ipcRenderer.invoke from renderer).
 * - Uses the Ollama CLI (spawn) to run a local model. The model is expected to be installed locally.
 *
 * Notes:
 * - This file intentionally does not rely on any cloud services.
 * - Keep model name/configuration configurable if you want to change models/tuning.
 *
 * Usage (from main.ts):
 *   import { registerSbarIpc } from './services/sbar-synthesizer';
 *   registerSbarIpc(ipcMain, { model: 'llama2' });
 *
 * Usage (from renderer via preload):
 *   const result = await window.electron.invoke('ai:synthesize-sbar', input);
 */

import { spawn } from 'child_process';
import type { IpcMain } from 'electron';
import { Readable } from 'stream';

/**
 * Minimal input/output types.
 * Adapt these to your real shared types if you have a shared types package.
 */
export type SbarSynthesizerInput = {
  notes: string; // raw clinical notes
  documents?: Array<{ fileName: string; dataUri?: string }>;
  // additional fields can be added as needed
};

export type Slide = { title: string; bullets: string[] };

export type LiteratureItem = {
  title: string;
  summary: string;
  stance: 'supporting' | 'refuting';
};

export type SbarSynthesizerOutput = {
  situation: string;
  background: string;
  assessment: string;
  recommendation: string;
  presentationSlides: Slide[];
  pdfContent: string; // the full SBAR report formatted for PDF
  literatureReview: LiteratureItem[];
  // include rawModelOutput for debugging if needed
  raw?: string;
};

type RegisterOptions = {
  model?: string; // Ollama model name
  timeoutMs?: number;
};

/**
 * Construct the prompt based on the original prompt content. The model is instructed to OUTPUT STRICT JSON
 * that serializes to the SbarSynthesizerOutput type. This helps ensure we can parse the result.
 */
function buildPrompt(input: SbarSynthesizerInput) {
  const documentsText =
    input.documents?.length > 0
      ? input.documents
          .map((d) => {
            // keep it simple; dataUri may be huge — if you want to support file parsing, do that in main before calling the LLM
            return `- ${d.fileName}${d.dataUri ? ' (inline document provided)' : ''}`;
          })
          .join('\n')
      : 'None';

  return `
You are an expert Nursing Informatics Specialist with extensive experience in clinical operations and IT systems. Your task is to take raw inputs and synthesize them into a comprehensive SBAR report for a feature request or process change.

Analyze all the provided text notes and documents. Structure your output according to the SBAR format:
- Situation: Clearly and concisely state the problem. Explain why addressing it is beneficial for the entire enterprise.
- Background: Detail the context. What led to this situation? What is the current process or system in place? What did you find in the provided documents?
- Assessment: Provide your analysis of the situation. What are the core issues, risks, and opportunities?
- Recommendation: Propose clear, actionable recommendations. Also, define how success will be measured (e.g., "reduce charting time by 15%," "decrease medication errors by 5%").

From this SBAR report, also generate:
1. Presentation Slides: An array of slides (title + bullet points).
2. PDF Content: The full SBAR report formatted as a single text block, suitable for direct PDF rendering.
3. Literature Review: 2-3 resources from literature or practice that either support or refute the need for the recommended changes. For each: title, brief summary of relevance, and stance: 'supporting' or 'refuting'.

User Inputs:
Raw Notes:
${input.notes || '(none)'}

Supporting Documents:
${documentsText}

RESPONSE FORMAT INSTRUCTIONS:
You MUST output valid JSON ONLY (no surrounding commentary). The JSON must have the following keys:
{
  "situation": string,
  "background": string,
  "assessment": string,
  "recommendation": string,
  "presentationSlides": [{ "title": string, "bullets": [string] }],
  "pdfContent": string,
  "literatureReview": [{ "title": string, "summary": string, "stance": "supporting" | "refuting" }]
}

Be concise but complete. Make sure arrays are valid JSON arrays. End output with a single valid JSON object.
`;
}

/**
 * Run Ollama CLI with the provided prompt and return stdout.
 * This function writes the prompt to Ollama stdin (so we can pass long prompts) and collects stdout.
 */
async function runOllamaGenerate(prompt: string, model = 'llama2', timeoutMs = 120000): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const args = ['generate', model, '-']; // read prompt from stdin
    const proc = spawn('ollama', args, { stdio: ['pipe', 'pipe', 'pipe'] });

    let stdout = '';
    let stderr = '';
    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;
      proc.kill('SIGKILL');
      reject(new Error(`Ollama timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    proc.stdout.setEncoding('utf8');
    proc.stdout.on('data', (chunk) => {
      stdout += chunk;
    });

    proc.stderr.setEncoding('utf8');
    proc.stderr.on('data', (chunk) => {
      stderr += chunk;
    });

    proc.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });

    proc.on('close', (code) => {
      clearTimeout(timer);
      if (timedOut) return;
      if (code !== 0) {
        return reject(new Error(`Ollama process exited with code ${code}. Stderr: ${stderr}`));
      }
      resolve(stdout);
    });

    // Write prompt to stdin and close
    const readable = Readable.from([prompt]);
    readable.pipe(proc.stdin);
  });
}

/**
 * Attempt to extract the first JSON object from text.
 * This is tolerant: it looks for the first '{' and last matching '}'.
 */
function extractFirstJson(text: string): string | null {
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) return null;
  const candidate = text.slice(firstBrace, lastBrace + 1);
  try {
    JSON.parse(candidate);
    return candidate;
  } catch {
    return null;
  }
}

/**
 * Synthesize SBAR by calling the local model via Ollama.
 * Returns a parsed SbarSynthesizerOutput. If parsing fails, throws an error describing the issue.
 */
export async function synthesizeSbarReportMain(
  input: SbarSynthesizerInput,
  opts: RegisterOptions = {}
): Promise<SbarSynthesizerOutput> {
  const model = opts.model ?? 'llama2';
  const timeoutMs = opts.timeoutMs ?? 120_000;
  const prompt = buildPrompt(input);

  const raw = await runOllamaGenerate(prompt, model, timeoutMs);

  // Try to extract JSON from model output
  const jsonText = extractFirstJson(raw);
  if (!jsonText) {
    // If no JSON found, surface the raw output for debugging
    throw new Error(
      `Model did not return valid JSON. Raw output: ${raw.slice(0, 4000)}... (truncated)`
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch (err) {
    throw new Error(`Failed to parse JSON from model output: ${(err as Error).message}`);
  }

  // Basic runtime validation (lightweight)
  const requiredKeys = ['situation', 'background', 'assessment', 'recommendation', 'presentationSlides', 'pdfContent', 'literatureReview'];
  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    requiredKeys.some((k) => !(k in (parsed as Record<string, unknown>)))
  ) {
    throw new Error('Parsed JSON does not conform to expected SBAR shape.');
  }

  const output: SbarSynthesizerOutput = {
    ...(parsed as SbarSynthesizerOutput),
    raw,
  };

  return output;
}

/**
 * Register the IPC handler on the provided ipcMain instance.
 * Renderer should call: ipcRenderer.invoke('ai:synthesize-sbar', input)
 */
export function registerSbarIpc(ipcMain: IpcMain, opts: RegisterOptions = {}) {
  ipcMain.handle('ai:synthesize-sbar', async (_event, input: SbarSynthesizerInput) => {
    try {
      const result = await synthesizeSbarReportMain(input, opts);
      return { ok: true, result };
    } catch (err) {
      return { ok: false, error: (err as Error).message ?? String(err) };
    }
  });
}
