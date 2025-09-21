/**
 * Electron-main side utility to OCR a receipt image and extract structured financial data.
 *
 * This module is intended to run in the Electron main process. It:
 * - Validates input
 * - Writes a data URI image to a temp file
 * - Spawns a Python script (recommended) to perform OCR + parsing, or any CLI that returns the structured JSON to stdout
 * - Validates and returns the structured JSON
 *
 * Expected runtime:
 * - Node / Electron main
 * - A Python script at app/electron/scripts/extract_receipt.py (or another path you choose) that accepts a single argument (image path)
 *   and writes the extracted JSON object to stdout.
 *
 * If you prefer to call Ollama or another local model, replace the spawn/python call with the appropriate child_process invocation.
 */

import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { spawn } from 'child_process';
import crypto from 'crypto';
import { z } from 'zod';

type AIProvider = 'ollama' | 'local' | 'other';

type FlowConfig = {
  provider: AIProvider;
  apiKey?: string;
};

// --- Schemas (zod) ---
export const ExtractReceiptDataInputSchema = z.object({
  receiptDataUri: z
    .string()
    .describe(
      "A receipt image, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  config: z
    .object({
      provider: z.enum(['ollama', 'local', 'other']).optional(),
      apiKey: z.string().optional(),
    })
    .optional(),
});
export type ExtractReceiptDataInput = z.infer<typeof ExtractReceiptDataInputSchema>;

const StoreSchema = z.object({
  address: z.string().nullable().describe('The address of the store.'),
  phone: z.string().nullable().describe('The phone number of the store.'),
  name: z.string().nullable().describe('The name of the store.'),
});

const TransactionSchema = z.object({
  date: z.string().nullable().describe('The date of the transaction.'),
  time: z.string().nullable().describe('The time of the transaction.'),
});

const ItemSchema = z.object({
  description: z.string().nullable().describe('The description of the item purchased.'),
  price_per_unit: z.number().nullable().describe('The price per unit of the item.'),
  quantity: z.number().nullable().describe('The quantity of the item purchased.'),
  total_price: z.number().nullable().describe('The total price for the item(s).'),
});

const TotalsSchema = z.object({
  subtotal: z.number().nullable().describe('The subtotal of the transaction.'),
  taxes: z.number().nullable().describe('The total taxes.'),
  total: z.number().nullable().describe('The final total amount of the transaction.'),
  change: z.number().nullable().describe('The change given.'),
  total_quantity: z.number().nullable().describe('The total quantity of all items.'),
});

const PaymentSchema = z.object({
  type: z.string().nullable().describe('The payment method (e.g., card, cash).'),
  card_last_four: z.string().nullable().describe('The last four digits of the card used for payment.'),
  amount: z.number().nullable().describe('The amount paid.'),
  currency: z.string().nullable().describe('The currency of the transaction (e.g., USD).'),
});

export const ReceiptDataSchema = z.object({
  store: StoreSchema,
  transaction: TransactionSchema,
  items: z.array(ItemSchema).describe('A list of all items purchased.'),
  totals: TotalsSchema,
  payment: PaymentSchema,
});
export type ReceiptData = z.infer<typeof ReceiptDataSchema>;

// --- Helpers ---
function dataUriToBuffer(dataUri: string): { buffer: Buffer; ext: string } {
  const match = dataUri.match(/^data:(.+?);base64,(.+)$/);
  if (!match) throw new Error('Invalid data URI. Expected format: data:<mimetype>;base64,<data>');
  const mime = match[1];
  const b64 = match[2];
  const buffer = Buffer.from(b64, 'base64');

  // primitive mime -> ext mapping
  const mimeToExt: Record<string, string> = {
    'image/png': '.png',
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/webp': '.webp',
    'image/bmp': '.bmp',
    'image/tiff': '.tiff',
  };
  const ext = mimeToExt[mime] || '';
  return { buffer, ext };
}

async function writeTempFile(buffer: Buffer, ext: string) {
  const name = `receipt-${crypto.randomBytes(8).toString('hex')}${ext}`;
  const tmpPath = path.join(os.tmpdir(), name);
  await fs.writeFile(tmpPath, buffer);
  return tmpPath;
}

function runCliAndCollectStdout(command: string, args: string[], options?: { cwd?: string; env?: NodeJS.ProcessEnv }) {
  return new Promise<{ stdout: string; stderr: string; code: number | null }>((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      ...options,
    });

    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => (stdout += chunk.toString()));
    child.stderr.on('data', (chunk) => (stderr += chunk.toString()));
    child.on('error', (err) => reject(err));
    child.on('close', (code) => resolve({ stdout, stderr, code }));
  });
}

// Determine script path relative to this file (assuming app/electron/scripts/extract_receipt.py)
const __dirname = path.dirname(new URL(import.meta.url).pathname);
const defaultPythonScriptPath = path.join(__dirname, '..', 'scripts', 'extract_receipt.py');

/**
 * extractReceiptData
 * - input: { receiptDataUri, config? }
 * - output: parsed & validated ReceiptData
 *
 * Implementation notes:
 * - This uses an external CLI/Python script by default. You may change to call Ollama CLI (or other) instead.
 * - The external script must accept the image path as the first (and only) argument and print a single JSON object matching ReceiptDataSchema.
 */
export async function extractReceiptData(input: ExtractReceiptDataInput): Promise<ReceiptData> {
  // Validate input
  const parsedInput = ExtractReceiptDataInputSchema.parse(input);
  const { receiptDataUri, config } = parsedInput;

  // Convert and write image to temp file
  const { buffer, ext } = dataUriToBuffer(receiptDataUri);
  const tmpFilePath = await writeTempFile(buffer, ext || '.png');

  try {
    // Choose execution path based on config.provider
    const provider = (config && (config as FlowConfig).provider) || 'local';

    if (provider === 'ollama') {
      // Example: call Ollama CLI to run a model that performs OCR+extraction.
      // This is a placeholder: replace model name and prompt handling as needed.
      // Ollama CLI example (pseudo):
      //   ollama run my-ocr-model --input-file /path/to/image --json
      // For now, try to invoke `ollama` if present.
      const ollamaCmd = 'ollama';
      const modelName = 'gpt-ocr'; // change to actual model name you host locally
      // Passing filepath as an argument; your model's wrapper should accept and read it.
      const { stdout, stderr, code } = await runCliAndCollectStdout(ollamaCmd, ['run', modelName, tmpFilePath]);
      if (code !== 0) {
        throw new Error(`Ollama run failed: ${stderr || 'exit code ' + code}`);
      }
      const parsed = JSON.parse(stdout);
      return ReceiptDataSchema.parse(parsed);
    }

    // Default: use Python script
    const scriptPath = defaultPythonScriptPath;
    // Ensure script exists
    try {
      await fs.access(scriptPath);
    } catch (err) {
      throw new Error(
        `Python extraction script not found at ${scriptPath}. Please add a script that accepts an image path and prints JSON.`
      );
    }

    // Run python3 <script> <tmpFilePath>
    const pythonCmd = 'python3'; // or 'python' depending on your environment
    const { stdout, stderr, code } = await runCliAndCollectStdout(pythonCmd, [scriptPath, tmpFilePath]);

    if (code !== 0) {
      throw new Error(`Python script failed with exit code ${code}. stderr: ${stderr}`);
    }

    let parsed;
    try {
      parsed = JSON.parse(stdout);
    } catch (err) {
      throw new Error(`Failed to parse JSON output from script. Error: ${(err as Error).message}. Raw output: ${stdout}`);
    }

    // Validate against schema
    const validated = ReceiptDataSchema.parse(parsed);
    return validated;
  } finally {
    // Clean up temp file
    try {
      await fs.unlink(tmpFilePath);
    } catch {
      /* ignore */
    }
  }
}
