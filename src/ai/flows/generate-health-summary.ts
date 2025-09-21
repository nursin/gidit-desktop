/**
 * Electron main process AI helper for generating a comprehensive health summary.
 *
 * Replaces Next.js/genkit server flow with a main-process implementation that:
 *  - Accepts a data URI (image/pdf) as input
 *  - Attempts local OCR (tesseract / pdftotext) if available
 *  - Calls a local Ollama CLI model via child_process (configurable via OLLAMA_MODEL env var)
 *
 * Notes:
 *  - This file is intended to run in the Electron main process (Node environment).
 *  - The renderer should call this via IPC (exposed in preload.ts).
 *
 * Requirements (recommended):
 *  - tesseract CLI (for image OCR) and/or pdftotext (poppler) for PDFs (optional)
 *  - ollama CLI available in PATH and a local model running (or accessible via ollama run)
 *
 * If you want a different AI backend, replace the call to runOllamaModel(...) with your implementation.
 */

import { z } from 'zod';
import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

const GenerateHealthSummaryInputSchema = z.object({
  documentDataUri: z
    .string()
    .describe(
      "A medical document image or PDF, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type GenerateHealthSummaryInput = z.infer<typeof GenerateHealthSummaryInputSchema>;

const GenerateHealthSummaryOutputSchema = z.object({
  comprehensiveSummary: z.string().describe('A comprehensive, well-structured History and Physical summary.'),
});
export type GenerateHealthSummaryOutput = z.infer<typeof GenerateHealthSummaryOutputSchema>;

/**
 * Main exported function to generate a health summary.
 * Should be invoked from Electron main (and exposed to renderer via IPC).
 */
export async function generateHealthSummary(
  input: GenerateHealthSummaryInput
): Promise<GenerateHealthSummaryOutput> {
  // validate input
  GenerateHealthSummaryInputSchema.parse(input);

  // Create temp file for the uploaded data URI
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'gidi-ai-'));
  let filePath: string | null = null;
  let cleanupPaths: string[] = [];

  try {
    const { mimeType, buffer } = parseDataUri(input.documentDataUri);
    const ext = mimeToExtension(mimeType) || '.bin';
    const fileName = `doc${ext}`;
    filePath = path.join(tmpDir, fileName);
    await fs.writeFile(filePath, buffer);
    cleanupPaths.push(filePath);

    // Try OCR if appropriate
    let ocrText = '';
    try {
      if (mimeType.startsWith('image/')) {
        // Try tesseract: `tesseract inputPath stdout`
        const { stdout } = await execFileAsync('tesseract', [filePath, 'stdout'], { maxBuffer: 10 * 1024 * 1024 });
        ocrText = stdout?.toString().trim() || '';
      } else if (mimeType === 'application/pdf') {
        // Try pdftotext: `pdftotext inputPath -`
        const { stdout } = await execFileAsync('pdftotext', [filePath, '-'], { maxBuffer: 10 * 1024 * 1024 });
        ocrText = stdout?.toString().trim() || '';
      }
    } catch (ocrErr) {
      // OCR not available or failed; continue without OCR
      // (Keep ocrText empty)
      // We intentionally do not throw here; OCR is optional.
      // console.warn('OCR attempt failed:', ocrErr);
    }

    // Build a robust prompt based on original prompt from Next.js flow
    const promptText = buildPrompt({
      ocrText,
      note: ocrText ? 'OCR text extracted from document is provided below.' : 'No OCR text available; original data URI was provided.',
      dataUriSnippet: summarizeDataUri(input.documentDataUri),
    });

    // Call local Ollama model via CLI (configurable model name)
    const model = process.env.OLLAMA_MODEL || 'local-model';
    const aiOutput = await runOllamaModel(model, promptText);

    const comprehensiveSummary = aiOutput?.trim() || '';

    GenerateHealthSummaryOutputSchema.parse({ comprehensiveSummary });

    return { comprehensiveSummary };
  } finally {
    // Cleanup temp files and directory
    try {
      for (const p of cleanupPaths) {
        await fs.unlink(p).catch(() => {});
      }
      if (tmpDir) {
        await fs.rmdir(tmpDir).catch(() => {});
      }
    } catch {
      // ignore cleanup errors
    }
  }
}

/* -----------------------
   Helper utilities
   ----------------------- */

function parseDataUri(dataUri: string): { mimeType: string; buffer: Buffer } {
  const m = dataUri.match(/^data:([^;]+);base64,(.+)$/);
  if (!m) throw new Error('Invalid data URI. Expected data:<mimetype>;base64,<data>');
  const mimeType = m[1];
  const base64 = m[2];
  const buffer = Buffer.from(base64, 'base64');
  return { mimeType, buffer };
}

function mimeToExtension(mime: string): string | null {
  if (mime === 'image/png') return '.png';
  if (mime === 'image/jpeg' || mime === 'image/jpg') return '.jpg';
  if (mime === 'image/tiff') return '.tiff';
  if (mime === 'application/pdf') return '.pdf';
  return null;
}

function summarizeDataUri(dataUri: string): string {
  // Don't include entire base64 in prompt; include mime and size instead
  const m = dataUri.match(/^data:([^;]+);base64,(.+)$/);
  if (!m) return 'Unknown data URI format.';
  const mime = m[1];
  const size = Math.round((m[2].length * 3) / 4); // approx bytes
  return `Document MIME type: ${mime}. Data size: ~${size} bytes.`;
}

function buildPrompt(opts: { ocrText: string; note: string; dataUriSnippet: string }): string {
  const header = `You are a highly skilled medical scribe and assistant. Your task is to analyze the provided medical document (or extracted text) and synthesize its information into a single, comprehensive, and well-structured History and Physical (H&P) report.

Instructions:
- Review the document and the extracted text carefully.
- Consolidate all available information into a standard H&P format.
- If a section has no information, you may omit it or state "Not provided."
- Be concise, clinically focused, and organized with clear section headers.

`;

  const docSection = `Document summary: ${opts.dataUriSnippet}
${opts.note}

${opts.ocrText ? `OCR extracted text:\n\n${opts.ocrText}\n` : 'No OCR text available; use document metadata above and infer cautiously.'}

Based on all the information in the document, generate a new, updated, and comprehensive H&P report below.
`;

  return header + docSection;
}

/**
 * Runs a local Ollama model via the 'ollama' CLI and returns its textual output.
 * This implementation uses: `ollama run <model> --prompt "<prompt>"`
 *
 * Notes:
 *  - The exact CLI flags may vary by Ollama version. Adjust as needed for your environment.
 *  - If you use Ollama HTTP API instead, replace this implementation accordingly.
 */
async function runOllamaModel(model: string, promptText: string): Promise<string> {
  // Protect against extremely large prompts in buffer limits
  const maxBuffer = 16 * 1024 * 1024; // 16MB

  try {
    // Many versions of ollama support: ollama run <model> --prompt "<prompt>"
    // If your version differs, update the CLI invocation here.
    const args = ['run', model, '--prompt', promptText];

    const { stdout } = await execFileAsync('ollama', args, { maxBuffer });
    // ollama CLI may return additional metadata; assume stdout contains the generated text
    return stdout.toString();
  } catch (err: any) {
    // If ollama CLI fails, provide a helpful error message
    const msg = typeof err === 'string' ? err : err?.message ?? 'Unknown error running ollama CLI';
    throw new Error(`Failed to run local AI model (ollama). Ensure 'ollama' is installed and OLLAMA_MODEL is set. Error: ${msg}`);
  }
}
