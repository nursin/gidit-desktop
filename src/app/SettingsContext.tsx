import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'light' | 'dark';
export type AIProvider = 'gemini' | 'groq' | 'openai' | 'anthropic' | 'deepseek' | 'ollama';
export type IconSize = 'sm' | 'md' | 'lg';

interface CustomColors {
  background: string;
  primary: string;
  accent: string;
}

interface APIKeys {
  gemini: string;
  groq: string;
  openai: string;
  anthropic: string;
  deepseek: string;
  ollama: string; // Not an API key, but used for host URL
}

interface FeatureFlags {
  sideQuests: boolean;
  changeVenue: boolean;
  noveltyRewards: boolean;
  interestSurfacing: boolean;
  buildingConfidence: boolean;
  reducingShame: boolean;
  kindnessAndFlexibility: boolean;
  selfForgiveness: boolean;
}

interface SettingsContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  font: string;
  setFont: (font: string) => void;
  iconSize: IconSize;
  setIconSize: (size: IconSize) => void;
  customColors: CustomColors;
  setCustomColors: (colors: CustomColors) => void;
  aiProvider: AIProvider;
  setAiProvider: (provider: AIProvider) => void;
  apiKeys: APIKeys;
  setApiKeys: (keys: APIKeys) => void;
  featureFlags: FeatureFlags;
  setFeatureFlags: (flags: FeatureFlags) => void;
  applyCustomColors: (colors?: CustomColors) => void;
  resetToDefaults: () => void;
}

/**
 * Optional electron preload bridge API. The preload script can expose
 * an electronAPI with getSetting/setSetting methods to persist settings
 * in the main process (e.g. to SQLite). If not available we fall back
 * to localStorage for renderer-only persistence.
 */
declare global {
  interface Window {
    electronAPI?: {
      getSetting: (key: string) => Promise<any | null>;
      setSetting: (key: string, value: any) => Promise<void>;
      // other electron APIs may exist...
    };
  }
}

const defaultColors: CustomColors = {
  background: '210 20% 95%',
  primary: '210 75% 50%',
  accent: '180 75% 50%',
};

const defaultApiKeys: APIKeys = {
  gemini: '',
  groq: '',
  openai: '',
  anthropic: '',
  deepseek: '',
  ollama: 'http://127.0.0.1:11434',
};

const defaultFeatureFlags: FeatureFlags = {
  sideQuests: true,
  changeVenue: true,
  noveltyRewards: true,
  interestSurfacing: true,
  buildingConfidence: true,
  reducingShame: true,
  kindnessAndFlexibility: true,
  selfForgiveness: true,
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

/* Helper persistence that prefers the electronAPI if present, otherwise localStorage */
const readStoreItem = async (key: string): Promise<string | null> => {
  try {
    if (window.electronAPI?.getSetting) {
      const val = await window.electronAPI.getSetting(key);
      // allow serialized JSON or plain strings; return as-is
      return val ?? null;
    }
  } catch {
    // ignore and fall back
  }
  try {
    const v = localStorage.getItem(key);
    return v;
  } catch {
    return null;
  }
};

const writeStoreItem = async (key: string, value: string | null) => {
  try {
    if (window.electronAPI?.setSetting) {
      await window.electronAPI.setSetting(key, value);
    }
  } catch {
    // ignore electron errors, still write to localStorage fallback
  }
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    // ignore
  }
};

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setThemeState] = useState<Theme>('light');
  const [font, setFontState] = useState('font-inter');
  const [iconSize, setIconSizeState] = useState<IconSize>('md');
  const [customColors, setCustomColorsState] = useState<CustomColors>(defaultColors);
  const [aiProvider, setAiProviderState] = useState<AIProvider>('gemini');
  const [apiKeys, setApiKeysState] = useState<APIKeys>(defaultApiKeys);
  const [featureFlags, setFeatureFlagsState] = useState<FeatureFlags>(defaultFeatureFlags);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    (async () => {
      const storedTheme = (await readStoreItem('app-theme')) as Theme | null;
      const storedFont = (await readStoreItem('app-font')) as string | null;
      const storedIconSize = (await readStoreItem('app-icon-size')) as IconSize | null;
      const storedColors = await readStoreItem('app-colors');
      const storedAiProvider = (await readStoreItem('app-ai-provider')) as AIProvider | null;
      const storedApiKeys = await readStoreItem('app-api-keys');
      const storedFeatureFlags = await readStoreItem('app-feature-flags');

      if (storedTheme) setThemeState(storedTheme);
      if (storedFont) setFontState(storedFont);
      if (storedIconSize) setIconSizeState(storedIconSize);
      if (storedColors) {
        try {
          // allow stored plain string (legacy) or JSON
          setCustomColorsState(JSON.parse(storedColors));
        } catch {
          // fallback assume it's in the form "h s% l%" or similar
          setCustomColorsState(defaultColors);
        }
      }
      if (storedAiProvider) setAiProviderState(storedAiProvider);
      if (storedApiKeys) {
        try {
          setApiKeysState({ ...defaultApiKeys, ...JSON.parse(storedApiKeys) });
        } catch {
          setApiKeysState(defaultApiKeys);
        }
      }
      if (storedFeatureFlags) {
        try {
          setFeatureFlagsState({ ...defaultFeatureFlags, ...JSON.parse(storedFeatureFlags) });
        } catch {
          setFeatureFlagsState(defaultFeatureFlags);
        }
      }

      setIsMounted(true);
    })();
    // run once on mount
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    // persist theme
    writeStoreItem('app-theme', theme);
    if (theme === 'light') {
      applyCustomColors(customColors);
    } else {
      root.style.removeProperty('--background');
      root.style.removeProperty('--primary');
      root.style.removeProperty('--accent');
    }
  }, [theme, isMounted, customColors]);

  useEffect(() => {
    if (!isMounted) return;
    document.body.classList.remove('font-inter', 'font-roboto', 'font-lato', 'font-montserrat');
    document.body.classList.add(font);
    writeStoreItem('app-font', font);
  }, [font, isMounted]);

  const applyCustomColors = (colors: CustomColors = customColors) => {
    const root = document.documentElement;
    root.style.setProperty('--background', colors.background);
    root.style.setProperty('--primary', colors.primary);
    root.style.setProperty('--accent', colors.accent);
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const setFont = (newFont: string) => {
    setFontState(newFont);
  };

  const setIconSize = (newSize: IconSize) => {
    setIconSizeState(newSize);
    writeStoreItem('app-icon-size', newSize);
  };

  const setCustomColors = (newColors: CustomColors) => {
    setCustomColorsState(newColors);
    writeStoreItem('app-colors', JSON.stringify(newColors));
    if (theme === 'light') {
      applyCustomColors(newColors);
    }
  };

  const setAiProvider = (provider: AIProvider) => {
    setAiProviderState(provider);
    writeStoreItem('app-ai-provider', provider);
  };

  const setApiKeys = (keys: APIKeys) => {
    setApiKeysState(keys);
    writeStoreItem('app-api-keys', JSON.stringify(keys));
  };

  const setFeatureFlags = (flags: FeatureFlags) => {
    setFeatureFlagsState(flags);
    writeStoreItem('app-feature-flags', JSON.stringify(flags));
  };

  const resetToDefaults = () => {
    setTheme('light');
    setFont('font-inter');
    setIconSize('md');
    setCustomColors(defaultColors);
    setAiProvider('gemini');
    setApiKeys(defaultApiKeys);
    setFeatureFlags(defaultFeatureFlags);

    // remove persisted values both in electron store (if present) and localStorage
    writeStoreItem('app-theme', null);
    writeStoreItem('app-font', null);
    writeStoreItem('app-icon-size', null);
    writeStoreItem('app-colors', null);
    writeStoreItem('app-ai-provider', null);
    writeStoreItem('app-api-keys', null);
    writeStoreItem('app-feature-flags', null);
  };

  if (!isMounted) {
    return null;
  }

  return (
    <SettingsContext.Provider
      value={{
        theme,
        setTheme,
        font,
        setFont,
        iconSize,
        setIconSize,
        customColors,
        setCustomColors,
        aiProvider,
        setAiProvider,
        apiKeys,
        setApiKeys,
        featureFlags,
        setFeatureFlags,
        applyCustomColors,
        resetToDefaults,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
