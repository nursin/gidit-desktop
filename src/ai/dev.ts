/**
 * Electron main process AI flow loader / runner
 *
 * Responsibilities:
 * - Load AI "flow" modules from the local ai/flows folder (each flow should export a default async handler)
 * - Provide runFlow(name, payload) to execute a flow handler
 * - Utility helpers to run local Python scripts and call Ollama CLI (spawned as child processes)
 *
 * Placement:
 * - This file is intended to live in app/electron/ai/dev.ts
 * - Flows should be placed under app/electron/ai/flows and export a default async function:
 *     export default async function handler(payload: any) { ... }
 *
 * Notes:
 * - All model execution / python scripts should be invoked from the Electron main process (this module).
 * - Renderer should call into main via IPC (preload + contextBridge) and not require these modules directly.
 */

import { spawn, spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';

export type FlowHandler = (payload: any) => Promise<any>;

const flows: Record<string, FlowHandler> = {};
let initialized = false;

/**
 * Initialize and load all flow modules from the flows directory.
 * Call this from your Electron main entry (main.ts) as part of app startup.
 *
 * @param baseDir Optional base directory where this file lives; defaults to __dirname
 */
export async function initAIFlows(baseDir?: string) {
  if (initialized) return;
  const base = baseDir || __dirname; // when compiled, __dirname will point to compiled location
  const flowsDir = path.resolve(base, 'ai', 'flows');

  if (!fs.existsSync(flowsDir)) {
    // no flows directory yet; nothing to load
    initialized = true;
    return;
  }

  const files = fs.readdirSync(flowsDir);
  for (const file of files) {
    if (!file.endsWith('.js') && !file.endsWith('.ts')) continue;
    const full = path.join(flowsDir, file);
    try {
      // Use dynamic import so TS/ESM compiled files work; require fallback for CJS
      // Normalize to file:// if using ESM import
      let mod: any;
      try {
        const resolved = require.resolve(full);
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        mod = require(resolved);
      } catch (e) {
        // fallback to dynamic import (works if bundler produced ESM)
        // convert to file:// for import()
        const asUrl = `file://${full}`;
        mod = await import(asUrl);
      }

      const handler: FlowHandler | undefined = mod?.default ?? mod?.handler;
      if (typeof handler === 'function') {
        const name = path.basename(file, path.extname(file));
        flows[name] = handler;
        console.info(`[AI FLOWS] Registered flow "${name}" from ${file}`);
      } else {
        console.warn(`[AI FLOWS] Flow file ${file} does not export default handler function. Skipping.`);
      }
    } catch (err) {
      console.error(`[AI FLOWS] Failed to load flow ${file}:`, err);
    }
  }

  initialized = true;
}

/**
 * Run a registered flow by name.
 *
 * @param name Flow name (filename without extension)
 * @param payload Arbitrary payload passed to the flow handler
 */
export async function runFlow(name: string, payload: any): Promise<any> {
  if (!initialized) {
    await initAIFlows();
  }
  const handler = flows[name];
  if (!handler) {
    throw new Error(`Flow "${name}" not found. Available flows: ${Object.keys(flows).join(', ')}`);
  }
  try {
    return await handler(payload);
  } catch (err) {
    console.error(`[AI FLOWS] Flow "${name}" error:`, err);
    throw err;
  }
}

/**
 * Get list of registered flow names.
 */
export function getRegisteredFlows(): string[] {
  return Object.keys(flows);
}

/**
 * Helper: run a Python script as a child process.
 *
 * @param scriptPath Absolute path to the python script
 * @param args Array of args passed to the script
 * @param input Optional stdin string
 */
export function runPythonScript(scriptPath: string, args: string[] = [], input?: string, timeoutMs = 120000): Promise<{ stdout: string; stderr: string; code: number | null }> {
  return new Promise((resolve, reject) => {
    const python = process.env.PYTHON_PATH || 'python3';
    const proc = spawn(python, [scriptPath, ...args], { stdio: ['pipe', 'pipe', 'pipe'] });

    let stdout = '';
    let stderr = '';
    const timer = setTimeout(() => {
      proc.kill();
      reject(new Error('Python script timed out'));
    }, timeoutMs);

    proc.stdout.on('data', (d) => { stdout += d.toString(); });
    proc.stderr.on('data', (d) => { stderr += d.toString(); });

    proc.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });

    proc.on('close', (code) => {
      clearTimeout(timer);
      resolve({ stdout, stderr, code });
    });

    if (input) {
      proc.stdin.write(input);
    }
    proc.stdin.end();
  });
}

/**
 * Helper: call Ollama CLI to run local models
 * (requires ollama to be installed and available in PATH)
 *
 * Example: runOllama(['run', 'alpaca', '--prompt', 'hello'])
 *
 * @param args CLI args
 * @param input Optional stdin for model
 */
export function runOllama(args: string[], input?: string, timeoutMs = 120000): Promise<{ stdout: string; stderr: string; code: number | null }> {
  return new Promise((resolve, reject) => {
    const cmd = 'ollama';
    const proc = spawn(cmd, args, { stdio: ['pipe', 'pipe', 'pipe'] });

    let stdout = '';
    let stderr = '';
    const timer = setTimeout(() => {
      proc.kill();
      reject(new Error('Ollama call timed out'));
    }, timeoutMs);

    proc.stdout.on('data', (d) => { stdout += d.toString(); });
    proc.stderr.on('data', (d) => { stderr += d.toString(); });

    proc.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });

    proc.on('close', (code) => {
      clearTimeout(timer);
      resolve({ stdout, stderr, code });
    });

    if (input) {
      proc.stdin.write(input);
    }
    proc.stdin.end();
  });
}

/**
 * Small synchronous helper to check if ollama is available.
 */
export function isOllamaAvailable(): boolean {
  try {
    const res = spawnSync('ollama', ['version'], { encoding: 'utf8' });
    return res.status === 0;
  } catch {
    return false;
  }
}

export default {
  initAIFlows,
  runFlow,
  getRegisteredFlows,
  runPythonScript,
  runOllama,
  isOllamaAvailable,
};
