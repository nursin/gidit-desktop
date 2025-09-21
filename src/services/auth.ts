/**
 * Renderer-side Auth service for the Electron app.
 *
 * Replaces previous Firebase-based auth with local IPC-based auth.
 * The Electron preload script should expose an IPC invoke helper on window
 * (e.g. `window.api.invoke` or `window.electronAPI.invoke`) that forwards
 * calls to the main process.
 *
 * Expected IPC channels handled in the main process:
 *  - "auth:register"    : { username, password } -> { success: boolean, user?: { id, username }, error?: string }
 *  - "auth:login"       : { username, password } -> { success: boolean, user?: { id, username }, token?: string, error?: string }
 *  - "auth:logout"      : void                   -> { success: boolean }
 *  - "auth:getSession"  : void                   -> { user?: { id, username }, authenticated: boolean }
 *
 * Make sure the preload.ts exposes an invoke function, e.g.:
 *   contextBridge.exposeInMainWorld('api', { invoke: (channel, payload) => ipcRenderer.invoke(channel, payload) })
 */

type IpcInvoke = (channel: string, payload?: any) => Promise<any>;

const getIpcInvoke = (): IpcInvoke => {
  if (typeof window === 'undefined') {
    throw new Error('Window is not available');
  }

  // Common preload exposure names. Adjust if your preload uses a different name.
  const anyWindow = window as any;

  if (anyWindow.api && typeof anyWindow.api.invoke === 'function') {
    return anyWindow.api.invoke.bind(anyWindow.api);
  }

  if (anyWindow.electronAPI && typeof anyWindow.electronAPI.invoke === 'function') {
    return anyWindow.electronAPI.invoke.bind(anyWindow.electronAPI);
  }

  if (anyWindow.ipcRenderer && typeof anyWindow.ipcRenderer.invoke === 'function') {
    // Less recommended (direct exposure), but support if present.
    return anyWindow.ipcRenderer.invoke.bind(anyWindow.ipcRenderer);
  }

  throw new Error(
    'No IPC invoke function found on window. Ensure preload exposes an API (e.g. window.api.invoke).'
  );
};

export type RegisterResult = { success: true; user: { id: string; username: string } } | { success: false; error: string };
export type LoginResult = { success: true; user: { id: string; username: string }; token?: string } | { success: false; error: string };
export type LogoutResult = { success: boolean };
export type SessionResult = { authenticated: boolean; user?: { id: string; username: string } };

/**
 * Register a new local user (username/password).
 * The main process should hash and store credentials (bcrypt/argon2) in the local DB.
 */
export const register = async (username: string, password: string): Promise<RegisterResult> => {
  const invoke = getIpcInvoke();
  return invoke('auth:register', { username, password }) as Promise<RegisterResult>;
};

/**
 * Login with local username/password.
 * Main process should verify password and return session info (optionally a token).
 */
export const login = async (username: string, password: string): Promise<LoginResult> => {
  const invoke = getIpcInvoke();
  return invoke('auth:login', { username, password }) as Promise<LoginResult>;
};

/**
 * Logout current session.
 */
export const logout = async (): Promise<LogoutResult> => {
  const invoke = getIpcInvoke();
  return invoke('auth:logout') as Promise<LogoutResult>;
};

/**
 * Get current session (if any).
 */
export const getSession = async (): Promise<SessionResult> => {
  const invoke = getIpcInvoke();
  return invoke('auth:getSession') as Promise<SessionResult>;
};

// Optional convenience: check authentication status
export const isAuthenticated = async (): Promise<boolean> => {
  const session = await getSession();
  return !!session?.authenticated;
};
