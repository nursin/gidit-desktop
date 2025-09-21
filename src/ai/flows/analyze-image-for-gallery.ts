import {promisify} from 'util';
import {execFile as _execFile, spawn} from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import {z} from 'zod';

const execFile = promisify(_execFile);

/**
 * An AI flow to analyze an image, generate a title, description, categories,
 * and extract text (OCR).
 *
 * This module is intended to run in the Electron main process. Renderer code
 * should call it via IPC (exposed through preload).
 *
 * Implementation notes:
 * - OCR: uses `tesseract` CLI (if available). If tesseract is not installed,
 *   OCR will be skipped and extractedText will be null.
 * - AI generation: uses the Ollama CLI. The model name can be overridden via
 *   OLLAMA_MODEL env var. The code calls `ollama run <model> --prompt "<prompt>"`.
 *   Adjust to your local Ollama setup if needed.
 *
 * The function validates inputs/outputs using zod schemas.
 */

/* Schemas */

/* Input: expect a data URI that includes MIME type and base64 portion */
const AnalyzeImageForGalleryInputSchema = z.object({
  imageDataUri: z
    .string()
    .describe(
      "An image, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type AnalyzeImageForGalleryInput = z.infer<typeof AnalyzeImageForGalleryInputSchema>;

const ImageAnalysisSchema = z.object({
  title: z.string().describe('A concise, descriptive title for the image (max 5 words).'),
  description: z.string().describe("A one-paragraph description of what is depicted in the image."),
  categories: z
    .array(z.string())
    .describe("An array of 1-3 relevant categories for the image (e.g., 'Nature', 'Document', 'People', 'Food', 'Art', 'Technology')."),
  extractedText: z.string().nullable().describe("Any text extracted from the image. If no text is present, this should be null."),
});
export type ImageAnalysis = z.infer<typeof ImageAnalysisSchema>;

/* Helpers */

function parseDataUri(dataUri: string) {
  const match = dataUri.match(/^data:(.+?);base64,(.+)$/);
  if (!match) return null;
  return {
    mime: match[1],
    base64: match[2],
  };
}

async function writeTempImage(base64: string, ext = '.png') {
  const buffer = Buffer.from(base64, 'base64');
  const tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'img-analyze-'));
  const filePath = path.join(tmpDir, `image${ext}`);
  await fs.promises.writeFile(filePath, buffer);
  return {filePath, tmpDir};
}

async function tryTesseractOcr(imagePath: string): Promise<string | null> {
  // Use tesseract CLI if available: `tesseract <image> stdout`
  try {
    const {stdout} = await execFile('tesseract', [imagePath, 'stdout'], {maxBuffer: 10 * 1024 * 1024});
    const text = stdout?.toString().trim();
    return text && text.length > 0 ? text : null;
  } catch (err) {
    // If tesseract isn't available or fails, gracefully return null.
    // You may replace this with a Python OCR script or another service as needed.
    return null;
  }
}

async function runOllama(prompt: string, model = process.env.OLLAMA_MODEL || 'gpt-4o-mini'): Promise<string> {
  // Use `ollama run <model> --prompt '<prompt>'`
  // Note: depending on the installed Ollama version, flags may differ.
  // This is a pragmatic default; adjust to your environment.
  return new Promise((resolve, reject) => {
    const args = ['run', model, '--prompt', prompt];
    const proc = spawn('ollama', args, {stdio: ['ignore', 'pipe', 'pipe']});

    let out = '';
    let err = '';

    proc.stdout.on('data', (chunk) => (out += chunk.toString()));
    proc.stderr.on('data', (chunk) => (err += chunk.toString()));

    proc.on('close', (code) => {
      if (code === 0) {
        resolve(out.trim());
      } else {
        reject(new Error(`ollama exited ${code}: ${err || out}`));
      }
    });

    proc.on('error', (e) => reject(e));
  });
}

/* Prompt template builder */
function buildPrompt(imageDataUri: string, ocrText: string | null) {
  // Provide the image as data URI in the prompt (many local models may accept it,
  // or the model can reason using the OCR text if OCR available).
  // We instruct the model to return strict JSON matching the schema.
  const ocrNote = ocrText ? `OCR_TEXT_START\n${ocrText}\nOCR_TEXT_END` : 'No OCR text detected.';
  return `
You are an expert AI for a photo gallery application. Your task is to analyze the provided image and return structured JSON.

Image is provided as a data URI (base64). If your model cannot "view" the image directly, prefer to use the provided OCR text (if any) and infer content; otherwise, make a best-effort visual guess.

Image (data URI):
${imageDataUri}

OCR/Text extracted from the image (if any):
${ocrNote}

Please return ONLY a single JSON object matching this schema exactly:
{
  "title": "A concise title (max 5 words)",
  "description": "A one-paragraph description of the image content.",
  "categories": ["Category1", "Category2"],   // 1 to 3 categories chosen from: Nature, Document, People, Food, Art, Technology, Architecture, Travel, Animal, Abstract
  "extractedText": "The extracted text or null"
}

Guidelines:
- Title: max 5 words.
- Description: one paragraph, somewhat detailed.
- Categories: choose 1-3 relevant categories from the allowed list: Nature, Document, People, Food, Art, Technology, Architecture, Travel, Animal, Abstract.
- extractedText: if OCR text is present, include the extracted text; otherwise null.

Return only the JSON object and nothing else.
`;
}

/* Main exported function */

export async function analyzeImageForGallery(input: AnalyzeImageForGalleryInput): Promise<ImageAnalysis> {
  // Validate input
  const parsed = AnalyzeImageForGalleryInputSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error('Invalid input to analyzeImageForGallery: ' + parsed.error.message);
  }

  const {imageDataUri} = parsed.data;

  const data = parseDataUri(imageDataUri);
  if (!data) {
    throw new Error('imageDataUri must be a valid data URI with base64 payload');
  }

  const ext = (() => {
    const mime = data.mime.toLowerCase();
    if (mime.includes('png')) return '.png';
    if (mime.includes('jpeg') || mime.includes('jpg')) return '.jpg';
    if (mime.includes('webp')) return '.webp';
    return '.png';
  })();

  let tmpDir: string | null = null;
  let imagePath: string | null = null;
  try {
    const written = await writeTempImage(data.base64, ext);
    imagePath = written.filePath;
    tmpDir = written.tmpDir;

    // Run OCR (best-effort). If not available, value will be null.
    const ocrText = await tryTesseractOcr(imagePath);

    // Build prompt and call local Ollama model
    const prompt = buildPrompt(imageDataUri, ocrText);

    // Run Ollama and parse JSON from its output. The model should return only JSON per prompt.
    const modelOutput = await runOllama(prompt);

    // Try to find the first JSON object in the output (defensive parsing)
    const firstBrace = modelOutput.indexOf('{');
    const lastBrace = modelOutput.lastIndexOf('}');
    if (firstBrace === -1 || lastBrace === -1) {
      throw new Error('AI output did not contain a JSON object');
    }
    const jsonText = modelOutput.slice(firstBrace, lastBrace + 1);

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(jsonText);
    } catch (e) {
      throw new Error('Failed to parse JSON from AI output: ' + String(e));
    }

    // Validate output against schema
    const validated = ImageAnalysisSchema.safeParse(parsedJson);
    if (!validated.success) {
      throw new Error('AI output did not match expected schema: ' + validated.error.message);
    }

    // Ensure extractedText is null if empty string
    const result = {
      ...validated.data,
      extractedText: validated.data.extractedText === '' ? null : validated.data.extractedText,
    };

    // If OCR produced text and model returned null extractedText, prefer OCR text
    if (!result.extractedText && ocrText) {
      result.extractedText = ocrText;
    }

    return result;
  } finally {
    // Clean up temp files
    if (tmpDir) {
      try {
        // remove files and dir
        const files = await fs.promises.readdir(tmpDir);
        await Promise.all(files.map((f) => fs.promises.unlink(path.join(tmpDir!, f))));
        await fs.promises.rmdir(tmpDir);
      } catch {
        // ignore cleanup errors
      }
    }
  }
}
