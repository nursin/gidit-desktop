import { execFile } from 'child_process';
import { promisify } from 'util';
import { z } from 'zod';
import type { IpcMain } from 'electron';

const execFileAsync = promisify(execFile);

const OrganizeNotesInputSchema = z.object({
  notes: z.string().describe('A raw text dump of notes, ideas, and observations.'),
  goal: z.string().describe('The goal or purpose of the notes.'),
  maxMinutes: z.number().describe('The target reading time for the output brief.'),
});
export type OrganizeNotesInput = z.infer<typeof OrganizeNotesInputSchema>;

const OrganizeNotesOutputSchema = z.object({
  organizedNotes: z.string().describe('The structured, high-fidelity brief generated from the notes.'),
});
export type OrganizeNotesOutput = z.infer<typeof OrganizeNotesOutputSchema>;

/**
 * Build the prompt used to drive the local model.
 * This mostly preserves the original prompt from the Next.js code,
 * adapted for a single string that will be sent to Ollama or similar local model.
 */
function buildPrompt(input: OrganizeNotesInput): string {
  const { notes, goal, maxMinutes } = input;
  return `Role: You are an expert note-editor and analyst. Your job is to preserve meaning and specifics while making the notes instantly scannable. Do not add outside facts or opinions.
Inputs
* Goal/Purpose (why these notes exist): ${goal}
* Reading time target (minutes): ${maxMinutes}
* Notes:
${notes}

Non-negotiable Rules
1. Fidelity over paraphrase: Keep original terminology, numbers, dates, names, URLs, quotes. If you compress, never change facts. Mark any uncertainty.
2. No invention: Only use info present in the notes. If something seems implied but not stated, put it under Inferred (low confidence).
3. Deduplicate smartly: Merge repeats; keep one “canonical” item. List meaningful variants underneath.
4. Traceability: Every bullet or row must include a [src: …] pointer (filename/section/line, or generated IDs like N001, N002 if none exist). IMPORTANT: Format these as markdown links, e.g., '[src: N001](#note-N001)'. Include short key excerpt when helpful (≤20 words).
5. Skimmable formatting: Clear headings, short bullets, aligned tables, bold labels, consistent order. No walls of text.
6. Triage for speed: Put the most important 10–20% first. Long details go to appendices.

Output Format (exactly this structure)
1. Executive Digest (≤6 bullets; ≤120 words total)
    * Who/what/why in one glance. Use bold keywords. Include the one-line point of the notes. [src: N001](#note-N001)
2. Canonical Outline (deduped, organized)
    * Themes/Topics → Subpoints
        * Bullet 1 (keep specifics; 1–2 lines). Metrics/figures inline. [src: N002](#note-N002)
        * Bullet 2 …
    * Order topics by importance to the stated Goal.
3. Decisions & Rationale
    * Decision: … Date/Owner: … Why: … Alternatives considered: … [src: N003](#note-N003)
4. Open Questions / Unknowns / Blockers
    * Question: … Needed to resolve: … Owner/Next step: … Deadline (if any): … [src: N004](#note-N004)
5. Action Items (Do-First list)
    * Action: … Owner: … When: … Definition of done: … [src: N005](#note-N005)
6. Numbers, Specs & Constraints (table)
| Item | Value/Range | Unit/Assumption | Notes | Source |
|---|---|---|---|---|
| e.g., Budget | 25,000 | USD | Phase 1 only | [src:N014](#note-N014) |
7. Entities (people, orgs, tools, systems)
    * Name/Thing: role/purpose; contact/URL if present; responsibilities. [src: N006](#note-N006)
8. Timeline (as mentioned in notes)
    * YYYY-MM-DD: event/milestone; implications. [src: N007](#note-N007)
9. Conflicts & Duplicates (resolved/kept)
    * Topic: canonical version → variants that differed; note what changed (date/amount/owner). [src: N008](#note-N008)
10. Key Excerpts (verbatim, optional)
    * “…” (≤20 words) — why it matters. [src: N009](#note-N009)
11. Find-It-Fast Index (for “I know I wrote this somewhere…”)
    * Query tags: #pricing #LLM-config #timeline-Q4 …
    * Phrase index: short memorable phrases → [src: N010](#note-N010)
    * Search hints: 3–5 suggested queries to jump back to sources.
12. Appendix A — Long Details
    * Park anything lengthy here (logs, multi-step reasoning, expanded lists), each item with [src: N011](#note-N011).
13. Appendix B — Source Map
    * Map every generated [src: …](#note-...) to its original snippet ID (file/section/line or generated N###).

Processing Steps (do this internally)
* Pass 1 (Harvest): Extract all concrete facts (numbers, dates, decisions, owners, URLs, definitions). Assign temporary IDs (N001…).
* Pass 2 (Cluster): Group by themes; detect near-duplicates (semantic similarity) and merge; keep the richest instance as canonical; list variants.
* Pass 3 (Prioritize): Rank by importance to {{{goal}}}. Put high-value items in Digest/Outline; demote the rest to appendices.
* Pass 4 (Verify): Spot conflicts/missing pieces; move to Conflicts and Open Questions; add precise, clickable [src] for each bullet.

Formatting Constraints
* Use concise bullets (ideally ≤18 words).
* Bold labels for scannability (e.g., Decision, Owner, Why).
* Keep the main body to a reading time of ~${maxMinutes} minutes; overflow → Appendices.
* American date format or ISO (be consistent).
* No emojis; no marketing fluff.

If Inputs Lack Structure
* If no filenames/lines exist, create note IDs in read order (N001…); reuse them in Source Map.
* If the goal is missing, infer from notes and label it Inferred goal (low confidence).

Final Check
* Did every bullet/row get a clickable [src]?
* Are all numbers/dates exactly as written?
* Are conflicts and open questions explicitly listed?
* Is the Digest truly skimmable?

Return ONLY the markdown-formatted brief as a single string.`;
}

/**
 * Run the local model via Ollama CLI (or a compatible CLI exposed in PATH).
 *
 * Environment:
 *  - set process.env.OLLAMA_MODEL to override the model name (default: "ollama")
 *  - set process.env.LOCAL_AI_CMD to override the CLI binary (default: "ollama")
 *
 * The exact CLI flags for Ollama may vary; this implementation attempts to call:
 *   <LOCAL_AI_CMD> run <MODEL> --prompt "<PROMPT>"
 *
 * If your local model CLI differs, adjust this helper accordingly.
 */
async function runLocalModel(prompt: string): Promise<string> {
  const cli = process.env.LOCAL_AI_CMD || 'ollama';
  const model = process.env.OLLAMA_MODEL || 'llama2'; // default model placeholder

  // Attempt to call CLI with prompt as an argument. Increase buffer for large prompts.
  try {
    const { stdout } = await execFileAsync(cli, ['run', model, '--prompt', prompt], {
      maxBuffer: 10 * 1024 * 1024,
    } as any);
    return stdout.toString();
  } catch (err: any) {
    // Provide a helpful error with the underlying CLI stderr if available.
    const stderr = err?.stderr ? String(err.stderr) : err?.message ?? String(err);
    throw new Error(`Failed to run local model CLI "${cli}": ${stderr}`);
  }
}

/**
 * Main exported function to organize notes.
 * This runs in Electron main process and returns { organizedNotes }.
 */
export async function organizeNotes(input: OrganizeNotesInput): Promise<OrganizeNotesOutput> {
  // Validate input
  const parsed = OrganizeNotesInputSchema.parse(input);

  // Build prompt and call local model
  const prompt = buildPrompt(parsed);

  const raw = await runLocalModel(prompt);

  // Attempt to parse JSON output if the model/CLI returned structured output.
  // Some model pipelines/CLIs may return straight text; in that case use the text as the organized brief.
  let organizedNotes = raw.trim();

  try {
    const parsedJson = JSON.parse(organizedNotes);
    // Common pattern: AI wrappers might provide a field like 'text' or 'content' or the original schema structured output.
    if (typeof parsedJson === 'object' && parsedJson !== null) {
      if (typeof parsedJson.organizedNotes === 'string') {
        organizedNotes = parsedJson.organizedNotes;
      } else if (typeof parsedJson.text === 'string') {
        organizedNotes = parsedJson.text;
      } else if (typeof parsedJson.content === 'string') {
        organizedNotes = parsedJson.content;
      } else {
        // Fallback: stringify the entire object as a pretty JSON for the renderer to inspect.
        organizedNotes = JSON.stringify(parsedJson, null, 2);
      }
    }
  } catch {
    // Not JSON — keep raw text
  }

  const output = OrganizeNotesOutputSchema.parse({ organizedNotes });
  return output;
}

/**
 * Helper to register an IPC handler on the main process.
 * Renderer can call via: ipcRenderer.invoke('ai:organize-notes', input)
 */
export function registerOrganizeNotesIpc(ipcMain: IpcMain) {
  ipcMain.handle('ai:organize-notes', async (_event, input: unknown) => {
    try {
      // Validate/parse the incoming input
      const parsed = OrganizeNotesInputSchema.parse(input);
      const res = await organizeNotes(parsed);
      return { ok: true, data: res };
    } catch (err: any) {
      return { ok: false, error: String(err?.message ?? err) };
    }
  });
}
