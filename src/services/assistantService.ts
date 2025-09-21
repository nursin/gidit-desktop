/**
 * Electron main service: assistantService.ts
 *
 * Replaces the previous Next.js server-side flow for the conversational assistant.
 * This module runs in the Electron main process and invokes a local LLM via the Ollama CLI.
 *
 * Responsibilities:
 * - Build the assistant prompt (persona, conversation history, and new user message).
 * - Invoke Ollama CLI (child_process) to generate a response.
 * - Return a minimal structured response for renderer IPC handlers to forward to UI.
 *
 * Note:
 * - The renderer should call this via an IPC handler (e.g. ipcMain.handle('ai:chat', chatAssistant)).
 * - Model selection is configurable via process.env.OLLAMA_MODEL (defaults to 'gpt-4o-mini' if not set).
 * - Adjust exec strategy if your Ollama CLI invocation differs. This implementation uses execFileSync for simplicity.
 */

import { execFileSync } from 'child_process';
import path from 'path';

type Role = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  role: Role;
  content: string;
}

export interface ChatAssistantInput {
  message: string;
  history?: ChatMessage[]; // chronological: oldest -> newest
  // future: could include metadata like userId, sessionId, modelOverride, etc.
  model?: string;
}

export interface ChatAssistantOutput {
  response: string;
  // future: add tokens usage, rawOutput, or structured blocks (graphs, reminders) if needed.
}

const DEFAULT_MODEL = process.env.OLLAMA_MODEL || 'gpt-4o-mini';

/**
 * Builds the plain-text prompt consumed by the LLM.
 * Mirrors the persona and instructions from the original Next.js flow.
 */
function buildPrompt(input: ChatAssistantInput) {
  const persona = `
You are Giddy, a super helpful AI assistant for the application "Gidit", a productivity studio for users with ADHD.

Your personality: cheerful, eager to please, and incredibly persistent. You never give up on solving a user's issue.

Your role:
- Provide help with using the app's features.
- Help users find information they've saved.
- Offer productivity tips related to the app's tools.
- Gather feedback and ratings about the app.
- When asked to "Chat with a representative" or for human help, politely inform the user that live chat is not available yet, but they can email BKEEL@GIDIT.CO for assistance.
- Be supportive, concise, and friendly, always encouraging the user.
- Provide display descriptions for graphs, reminders, etc., that the renderer can use to render visual elements in the chatbox.
`;

  const historyBlock = (input.history || [])
    .map(h => `- ${h.role}: ${h.content}`)
    .join('\n');

  const prompt = [
    persona.trim(),
    '',
    'Here is the conversation history:',
    historyBlock || '- (no prior messages)',
    '',
    'Here is the new user message:',
    `- user: ${input.message}`,
    '',
    'Please provide a helpful response in Giddy\'s voice. Keep it concise but thorough. When you describe graphs or reminders, provide a clear short description and structured hints that the renderer can use to display them (e.g. "graph: type=bar; title=Tasks Completed; data=[...]").'
  ].join('\n');

  return prompt;
}

/**
 * Executes the Ollama CLI to generate a response.
 * - Uses execFileSync to avoid shell escaping issues.
 * - If your installation requires different args, adjust here.
 *
 * Note: Ollama usage varies by version. Common pattern:
 *   ollama generate <model> "<prompt text>"
 *
 * We pass the prompt as a separate argument. If your Ollama CLI expects prompt from stdin,
 * change the invocation accordingly.
 */
function runOllamaGenerate(prompt: string, model: string) {
  const modelName = model || DEFAULT_MODEL;

  try {
    // execFileSync throws on non-zero exit code
    // We pass the prompt as a single argument to avoid shell interpolation.
    // Increase maxBuffer in case of long outputs.
    const stdout = execFileSync(
      'ollama',
      ['generate', modelName, prompt],
      {
        encoding: 'utf8',
        maxBuffer: 10 * 1024 * 1024, // 10MB
        // cwd: process.cwd(), // optionally set working dir
      }
    );

    return stdout?.toString?.() ?? '';
  } catch (err: any) {
    // Try to surface helpful debug information while keeping message concise.
    const msg = (err && err.message) ? err.message : String(err);
    throw new Error(`Ollama generate failed: ${msg}`);
  }
}

/**
 * Primary entrypoint used by the Electron main process IPC handler.
 * Example usage in main.ts:
 *   ipcMain.handle('ai:chat', async (event, input) => chatAssistant(input));
 */
export async function chatAssistant(input: ChatAssistantInput): Promise<ChatAssistantOutput> {
  if (!input || typeof input.message !== 'string' || input.message.trim() === '') {
    return { response: "I'm sorry — I didn't receive a message. Please try again." };
  }

  const prompt = buildPrompt(input);

  // Allow runtime override of model per-request.
  const model = input.model || process.env.OLLAMA_MODEL || DEFAULT_MODEL;

  let rawOutput: string;
  try {
    rawOutput = runOllamaGenerate(prompt, model);
  } catch (err: any) {
    // Return a friendly error message; renderer can surface details if needed.
    const errorMsg = typeof err?.message === 'string' ? err.message : 'Unknown error';
    return { response: `Giddy couldn't generate a response right now. (${errorMsg})` };
  }

  // Basic post-processing: trim and normalize whitespace.
  const response = rawOutput.trim();

  return { response };
}
