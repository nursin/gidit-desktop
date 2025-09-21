/**
 * Electron main service: extractDocumentDetails
 *
 * - Replaces the previous Next.js server flow with a main-process implementation that:
 *   1) Accepts a document image as a data URI,
 *   2) Writes it to a temp file,
 *   3) Attempts to run a Python OCR helper (if available) to get full text,
 *   4) Calls a local Ollama model via CLI to extract structured details (falls back safely),
 *   5) Validates output with zod and returns the typed DocumentDetails object.
 *
 * Notes:
 * - This file is intended to run in the Electron main process.
 * - It uses child_process to call Python and the Ollama CLI. Make sure system environment has python/pytesseract and ollama installed if you want OCR/LLM work.
 * - The function is resilient: if OCR or Ollama aren't available it returns a best-effort object.
 */

import fs from 'fs';
import os from 'os';
import path from 'path';
import { spawnSync } from 'child_process';
import { z } from 'zod';

// --- Schemas (kept compatible with the original) ---
const ExtractDocumentDetailsInputSchema = z.object({
  documentDataUri: z
    .string()
    .describe(
      "A document image, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ExtractDocumentDetailsInput = z.infer<typeof ExtractDocumentDetailsInputSchema>;

const PharmacyDetailsSchema = z
  .object({
    medication: z.string().nullable().describe('The name of the medication.'),
    dosage: z.string().nullable().describe("The dosage instructions (e.g., '1 tablet twice a day')."),
    pharmacy: z.string().nullable().describe('The name of the pharmacy.'),
    prescribingDoctor: z.string().nullable().describe('The name of the prescribing doctor.'),
    rxNumber: z.string().nullable().describe('The prescription (Rx) number.'),
    fillDate: z.string().nullable().describe('The date the prescription was filled.'),
    quantity: z.number().nullable().describe('The quantity of the medication dispensed.'),
  })
  .optional();

const TransactionLineItemSchema = z.object({
  date: z.string().nullable().describe('The date of the transaction.'),
  description: z.string().describe('The description of the transaction line item.'),
  amount: z.number().describe(
    'The amount of the transaction. Use negative for debits/expenses and positive for credits/income.'
  ),
});

const StatementDetailsSchema = z
  .object({
    accountNumber: z.string().nullable().describe("The account number, with sensitive digits masked if possible (e.g., '**** 1234')."),
    statementPeriod: z.string().nullable().describe('The start and end date of the statement period.'),
    transactions: z.array(TransactionLineItemSchema).describe('A list of transactions from the statement.'),
    openingBalance: z.number().nullable().describe('The opening balance for the statement period.'),
    closingBalance: z.number().nullable().describe('The closing balance for the statement period.'),
  })
  .optional();

const DocumentDetailsSchema = z.object({
  documentType: z
    .string()
    .describe(
      "The type of document (e.g., Receipt, Bank Statement, Invoice, Letter, Paystub, Pharmacy Record, Medical Document)."
    ),
  title: z.string().nullable().describe('The main title or subject of the document.'),
  date: z
    .string()
    .nullable()
    .describe('The primary date found on the document (formatted as YYYY-MM-DD if possible).'),
  summary: z.string().describe("A brief summary of the document's content."),
  totalAmount: z
    .number()
    .nullable()
    .describe('The main financial total if applicable (e.g., receipt total, statement balance, invoice amount).'),
  fullText: z.string().optional().describe('The full extracted text from the document.'),
  pharmacyDetails: PharmacyDetailsSchema.describe("Specific structured details if the document is a pharmacy or medication record."),
  statementDetails: StatementDetailsSchema.describe("Specific structured details if the document is a bank or credit card statement."),
});
export type DocumentDetails = z.infer<typeof DocumentDetailsSchema>;

// --- Helpers ---

/**
 * Save a data URI (base64) to a temp file and return its path.
 */
async function saveDataUriToTempFile(dataUri: string): Promise<string> {
  const match = dataUri.match(/^data:(.+?);base64,(.+)$/);
  if (!match) throw new Error('Invalid data URI. Expected "data:<mimetype>;base64,<data>".');

  const mime = match[1];
  const b64 = match[2];

  // Choose extension from mime if possible
  const ext = mime.split('/')[1] || 'bin';
  const tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'gdt-doc-'));
  const filePath = path.join(tmpDir, `document.${ext}`);
  const buffer = Buffer.from(b64, 'base64');
  await fs.promises.writeFile(filePath, buffer);
  return filePath;
}

/**
 * Attempt to run a small Python OCR helper to produce full text.
 * This uses a simple inline Python snippet that requires Pillow and pytesseract.
 * If Python is not available or the helper fails, return null.
 */
function runPythonOcr(imagePath: string): string | null {
  try {
    const script = `
import sys
try:
    from PIL import Image
    import pytesseract
    img = Image.open(sys.argv[1])
    txt = pytesseract.image_to_string(img)
    if txt is None:
        txt = ""
    # Print as-is
    print(txt)
except Exception as e:
    # On any error, exit with empty output (we'll fallback in JS)
    # Do not print stack traces to not bloat output
    sys.exit(0)
`;
    const res = spawnSync('python3', ['-c', script, imagePath], { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
    if (res.status === 0 && res.stdout) {
      return res.stdout.trim();
    }
    // Try 'python' as fallback
    const res2 = spawnSync('python', ['-c', script, imagePath], { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
    if (res2.status === 0 && res2.stdout) {
      return res2.stdout.trim();
    }
    return null;
  } catch (_e) {
    return null;
  }
}

/**
 * Call the Ollama CLI to run a local model prompt and return the textual output.
 * Expects 'ollama' CLI to be installed and accessible.
 * The model to run can be overridden via process.env.OLLAMA_MODEL.
 */
function runOllamaPrompt(prompt: string, maxWaitMs = 30_000): string | null {
  try {
    const model = process.env.OLLAMA_MODEL || 'llama2'; // override as needed
    // Some Ollama setups accept: ollama run <model> --prompt "<text>"
    // We'll call it and capture stdout. Use spawnSync for simplicity.
    const args = ['run', model, '--prompt', prompt];
    const res = spawnSync('ollama', args, { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024, timeout: maxWaitMs });
    if (res.status === 0 && res.stdout) {
      return res.stdout.trim();
    }
    // Some versions may output to stderr or return non-zero on warnings
    if (res.stdout) return res.stdout.trim();
    if (res.stderr) return res.stderr.trim();
    return null;
  } catch (_e) {
    return null;
  }
}

/**
 * Extract JSON blob from arbitrary text. The LLM may output explanation + JSON.
 */
function extractJsonFromText(text: string): string | null {
  if (!text) return null;
  // Attempt direct parse
  try {
    JSON.parse(text);
    return text;
  } catch (_) {
    // Find first { ... } block that looks like JSON
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        JSON.parse(jsonMatch[0]);
        return jsonMatch[0];
      } catch (_) {
        return null;
      }
    }
  }
  return null;
}

// --- Prompt template (string) ---
const extractorPromptTemplate = (ocrText: string | null) => `
You are an expert at Optical Character Recognition (OCR) and document analysis. Your task is to analyze the provided document (OCR output given below or the image if needed), identify its type, and return a strict JSON object with the following fields:

- documentType: string (e.g., Receipt, Bank Statement, Invoice, Letter, Paystub, Pharmacy Record, Medical Document)
- title: string or null
- date: string (YYYY-MM-DD when possible) or null
- summary: brief string summary of the document
- totalAmount: number or null
- fullText: the full extracted text (string)
- pharmacyDetails: object or null (if pharmacy/med record) - fields: medication, dosage, pharmacy, prescribingDoctor, rxNumber, fillDate, quantity
- statementDetails: object or null (if bank/credit statement) - fields: accountNumber, statementPeriod, transactions[], openingBalance, closingBalance

Important:
- Return ONLY valid JSON. Do not include commentary, analysis, or markdown.
- If you cannot find a value, use null for strings/numbers or an empty array/object where appropriate.

OCR_TEXT:
${ocrText ? ocrText.replace(/\r/g, '') : '<<no-ocr-text-available>>'}

If OCR_TEXT is insufficient, you may rely on the image (the image path is available to the calling process), but the response must still be valid JSON.
`;

// --- Public function exported for other main-process modules to call ---

/**
 * Main entrypoint for extracting structured document details from a data URI.
 *
 * This function is suitable to be exposed via IPC (e.g., from preload -> renderer).
 */
export async function extractDocumentDetails(input: ExtractDocumentDetailsInput): Promise<DocumentDetails> {
  // Validate input shape
  const parsedInput = ExtractDocumentDetailsInputSchema.parse(input);

  // Save image to temp file
  let tempImagePath: string | null = null;
  try {
    tempImagePath = await saveDataUriToTempFile(parsedInput.documentDataUri);
  } catch (err) {
    // Fail early if file couldn't be written
    throw new Error('Failed to save document image: ' + String(err));
  }

  // Attempt OCR via Python helper (non-fatal)
  let ocrText: string | null = null;
  try {
    ocrText = runPythonOcr(tempImagePath);
  } catch {
    ocrText = null;
  }

  // Build prompt for the local LLM
  const prompt = extractorPromptTemplate(ocrText);

  // Call Ollama (non-fatal)
  let llmOutputText: string | null = null;
  try {
    llmOutputText = runOllamaPrompt(prompt);
  } catch {
    llmOutputText = null;
  }

  // Attempt to extract JSON from LLM output
  let jsonText: string | null = null;
  if (llmOutputText) {
    jsonText = extractJsonFromText(llmOutputText);
  }

  // Fallback: if no JSON obtained, attempt a minimal best-effort object
  let parsedResult: unknown;
  if (jsonText) {
    try {
      parsedResult = JSON.parse(jsonText);
    } catch {
      parsedResult = null;
    }
  }

  if (!parsedResult) {
    // Build a best-effort result using OCR text (or placeholders)
    const fallbackSummary = ocrText ? (ocrText.slice(0, 300) + (ocrText.length > 300 ? '...' : '')) : 'Unable to extract content.';
    parsedResult = {
      documentType: 'Unknown',
      title: null,
      date: null,
      summary: fallbackSummary,
      totalAmount: null,
      fullText: ocrText || '',
      pharmacyDetails: null,
      statementDetails: null,
    };
  }

  // Validate final object against schema
  try {
    const validated = DocumentDetailsSchema.parse(parsedResult);
    // cleanup temp files optionally
    try {
      if (tempImagePath) {
        // remove the file and parent tempDir
        const parent = path.dirname(tempImagePath);
        await fs.promises.rm(parent, { recursive: true, force: true });
      }
    } catch {
      // ignore cleanup errors
    }
    return validated;
  } catch (err) {
    // If validation fails, throw an informative error
    throw new Error('Extracted document details did not match expected schema: ' + String(err));
  }
}
