/**
 * Renderer-side task service (replaces Firestore client).
 *
 * NOTE:
 * - All DB/storage operations are handled in the Electron main process.
 * - The main process should expose IPC handlers for the channels used below:
 *    - 'tasks:getForUser'  -> (userId: string) => Task[]
 *    - 'tasks:add'         -> (task: Omit<Task,'id'|'createdAt'>) => Task
 *    - 'tasks:update'      -> (payload: { taskId: string; updates: Partial<Task> }) => Task
 *    - 'tasks:delete'      -> (taskId: string) => { success: boolean }
 *
 * - The preload script should expose an invoke-style API on window.electronAPI:
 *    contextBridge.exposeInMainWorld('electronAPI', { invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args) })
 *
 * This file intentionally avoids any cloud SDKs (Firebase, etc.) and delegates to local IPC.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface Task {
  id?: string;
  userId: string;
  content: string;
  componentId: string;
  displayData: Record<string, any>;
  // createdAt is serialized by the main process (ISO string or epoch ms)
  createdAt: string | number;
}

/* Minimal typing for the exposed preload API. The real preload should provide this shape. */
declare global {
  interface Window {
    electronAPI?: {
      invoke: (channel: string, ...args: any[]) => Promise<any>;
    };
  }
}

function ensureIpc(): NonNullable<Window['electronAPI']> {
  if (!window.electronAPI || typeof window.electronAPI.invoke !== 'function') {
    throw new Error(
      'IPC API not available. Ensure preload exposes window.electronAPI.invoke and the main process registers handlers.'
    );
  }
  return window.electronAPI;
}

export const getTasksForUser = async (userId: string): Promise<Task[]> => {
  const ipc = ensureIpc();
  const result = await ipc.invoke('tasks:getForUser', userId);
  // Expect an array of tasks; main process should serialize Date -> ISO/string
  return Array.isArray(result) ? (result as Task[]) : [];
};

export const addTask = async (task: Omit<Task, 'id' | 'createdAt'>): Promise<Task> => {
  const ipc = ensureIpc();
  const added = await ipc.invoke('tasks:add', task);
  return added as Task;
};

export const updateTask = async (taskId: string, updates: Partial<Task>): Promise<Task> => {
  const ipc = ensureIpc();
  const updated = await ipc.invoke('tasks:update', { taskId, updates });
  return updated as Task;
};

export const deleteTask = async (taskId: string): Promise<{ success: boolean }> => {
  const ipc = ensureIpc();
  const res = await ipc.invoke('tasks:delete', taskId);
  return res as { success: boolean };
};
