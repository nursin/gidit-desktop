import React, { useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "../ui/dialog";
import { Label } from "../ui/label";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { useSettings, type AIProvider, type IconSize } from "../../context/settings-context";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { useToast } from "../../hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../ui/alert-dialog";
import { Switch } from "../ui/switch";

declare global {
  interface Window {
    // Preload should expose an API similar to this. These are optional to allow fallback to localStorage behavior.
    electronAPI?: {
      exportAppState?: () => Promise<void>;
      importAppState?: () => Promise<string | null>;
      clearAppState?: () => Promise<void>;
    };
  }
}

const FONT_OPTIONS = [
  { value: "font-inter", label: "Inter" },
  { value: "font-roboto", label: "Roboto" },
  { value: "font-lato", label: "Lato" },
  { value: "font-montserrat", label: "Montserrat" },
];

function hexToHsl(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return "0 0% 0%";
  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  let h = 0,
    s = 0,
    l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  h = Math.round(h * 360);
  s = Math.round(s * 100);
  l = Math.round(l * 100);
  return `${h} ${s}% ${l}%`;
}

function hslToHex(h: number, s: number, l: number): string {
  l /= 100;
  const a = (s * Math.min(l, 1 - l)) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function hslStringToHex(hsl: string): string {
  if (!hsl) return "#000000";
  const parts = hsl.split(" ");
  if (parts.length !== 3) return "#000000";
  const [h, s, l] = parts.map((val) => parseInt(val, 10));
  return hslToHex(h, s, l);
}

export function AppSettingsDialog({ children }: { children: React.ReactNode }) {
  const {
    theme,
    setTheme,
    font,
    setFont,
    iconSize,
    setIconSize,
    customColors,
    setCustomColors,
    resetToDefaults,
    aiProvider,
    setAiProvider,
    apiKeys,
    setApiKeys,
    featureFlags,
    setFeatureFlags,
  } = useSettings();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleColorChange = (colorName: keyof typeof customColors, value: string) => {
    setCustomColors({ ...customColors, [colorName]: hexToHsl(value) });
  };

  const handleApiKeyChange = (keyName: keyof typeof apiKeys, value: string) => {
    setApiKeys({ ...apiKeys, [keyName]: value });
  };

  const handleFeatureFlagChange = (keyName: keyof typeof featureFlags, value: boolean) => {
    setFeatureFlags({ ...featureFlags, [keyName]: value });
  };

  const handleExport = async () => {
    // Prefer Electron main process to handle file saving (native dialogs, filesystem).
    if (window.electronAPI?.exportAppState) {
      try {
        await window.electronAPI.exportAppState();
        toast({ title: "Data Exported", description: "Your data has been saved." });
      } catch (err) {
        console.error(err);
        toast({ title: "Export Failed", description: "Unable to export data.", variant: "destructive" });
      }
      return;
    }

    // Fallback: browser-style download using localStorage
    const state = localStorage.getItem("app-state");
    if (state) {
      const blob = new Blob([state], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `gidit-backup-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Data Exported", description: "Your data has been downloaded." });
    } else {
      toast({ title: "No Data Found", description: "There is no data to export.", variant: "destructive" });
    }
  };

  const handleImportClick = async () => {
    // If electron API is available, use native dialog & file read in main
    if (window.electronAPI?.importAppState) {
      try {
        const content = await window.electronAPI.importAppState();
        if (!content) {
          toast({ title: "Import Cancelled", description: "No file was selected." });
          return;
        }
        // Basic validation then persist via fallback localStorage (or via settings hooks if desired)
        JSON.parse(content);
        localStorage.setItem("app-state", content);
        toast({ title: "Import Successful", description: "Your data has been restored. Please restart the app." });
        setTimeout(() => window.location.reload(), 1500);
      } catch (error) {
        console.error(error);
        toast({ title: "Import Failed", description: "The selected file is not valid JSON.", variant: "destructive" });
      }
      return;
    }

    // Fallback to input file element
    fileInputRef.current?.click();
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          JSON.parse(text);
          localStorage.setItem("app-state", text);
          toast({ title: "Import Successful", description: "Your data has been restored. Please refresh the page." });
          setTimeout(() => window.location.reload(), 1500);
        } catch (error) {
          toast({ title: "Import Failed", description: "The selected file is not valid JSON.", variant: "destructive" });
        }
      };
      reader.readAsText(file);
    }
  };

  const handleClearData = async () => {
    // Prefer main process to clear data (e.g. wipe SQLite). If not available, clear localStorage.
    if (window.electronAPI?.clearAppState) {
      try {
        await window.electronAPI.clearAppState();
        toast({ title: "Data Cleared", description: "All your local data has been removed. Please restart the app." });
        setTimeout(() => window.location.reload(), 1500);
      } catch (err) {
        console.error(err);
        toast({ title: "Clear Failed", description: "Unable to clear data.", variant: "destructive" });
      }
      return;
    }

    localStorage.removeItem("app-state");
    toast({ title: "Data Cleared", description: "All your local data has been removed. Please refresh the page." });
    setTimeout(() => window.location.reload(), 1500);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>App Settings</DialogTitle>
          <DialogDescription>Customize the application's appearance and manage your data.</DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="appearance">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="features">Features</TabsTrigger>
            <TabsTrigger value="ai">AI</TabsTrigger>
            <TabsTrigger value="data">Data</TabsTrigger>
          </TabsList>
          <TabsContent value="appearance" className="pt-4">
            <div className="grid gap-6">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Theme</Label>
                <RadioGroup
                  defaultValue={theme}
                  onValueChange={(value: "light" | "dark") => setTheme(value)}
                  className="col-span-3 flex items-center gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="light" id="light" />
                    <Label htmlFor="light">Light</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="dark" id="dark" />
                    <Label htmlFor="dark">Dark</Label>
                  </div>
                </RadioGroup>
              </div>
              {theme === "light" && (
                <>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Primary</Label>
                    <Input type="color" defaultValue={hslStringToHex(customColors.primary)} onChange={(e) => handleColorChange("primary", e.target.value)} className="col-span-3 p-1" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Accent</Label>
                    <Input type="color" defaultValue={hslStringToHex(customColors.accent)} onChange={(e) => handleColorChange("accent", e.target.value)} className="col-span-3 p-1" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Background</Label>
                    <Input type="color" defaultValue={hslStringToHex(customColors.background)} onChange={(e) => handleColorChange("background", e.target.value)} className="col-span-3 p-1" />
                  </div>
                </>
              )}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="font" className="text-right">
                  Font
                </Label>
                <div className="col-span-3">
                  <Select defaultValue={font} onValueChange={setFont}>
                    <SelectTrigger id="font">
                      <SelectValue placeholder="Select font" />
                    </SelectTrigger>
                    <SelectContent>
                      {FONT_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Icon Size</Label>
                <RadioGroup
                  defaultValue={iconSize}
                  onValueChange={(value: IconSize) => setIconSize(value)}
                  className="col-span-3 flex items-center gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="sm" id="sm" />
                    <Label htmlFor="sm">Small</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="md" id="md" />
                    <Label htmlFor="md">Medium</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="lg" id="lg" />
                    <Label htmlFor="lg">Large</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="features" className="pt-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <h4 className="font-medium">Side Quests</h4>
                  <p className="text-sm text-muted-foreground">Randomly appearing, interesting tasks.</p>
                </div>
                <Switch checked={featureFlags.sideQuests} onCheckedChange={(checked) => handleFeatureFlagChange("sideQuests", checked)} />
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <h4 className="font-medium">Change Venue</h4>
                  <p className="text-sm text-muted-foreground">Suggesting different work environments.</p>
                </div>
                <Switch checked={featureFlags.changeVenue} onCheckedChange={(checked) => handleFeatureFlagChange("changeVenue", checked)} />
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <h4 className="font-medium">Novelty Rewards</h4>
                  <p className="text-sm text-muted-foreground">Special rewards for starting tasks.</p>
                </div>
                <Switch checked={featureFlags.noveltyRewards} onCheckedChange={(checked) => handleFeatureFlagChange("noveltyRewards", checked)} />
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <h4 className="font-medium">Interest-Driven Surfacing</h4>
                  <p className="text-sm text-muted-foreground">Prioritizing tasks based on your interests.</p>
                </div>
                <Switch checked={featureFlags.interestSurfacing} onCheckedChange={(checked) => handleFeatureFlagChange("interestSurfacing", checked)} />
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <h4 className="font-medium">Building Confidence</h4>
                  <p className="text-sm text-muted-foreground">Positive reinforcement and celebrating wins.</p>
                </div>
                <Switch checked={featureFlags.buildingConfidence} onCheckedChange={(checked) => handleFeatureFlagChange("buildingConfidence", checked)} />
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <h4 className="font-medium">Reducing Shame</h4>
                  <p className="text-sm text-muted-foreground">Normalizing ADHD challenges.</p>
                </div>
                <Switch checked={featureFlags.reducingShame} onCheckedChange={(checked) => handleFeatureFlagChange("reducingShame", checked)} />
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <h4 className="font-medium">Kindness and Flexibility</h4>
                  <p className="text-sm text-muted-foreground">Adapting the system to your energy levels.</p>
                </div>
                <Switch checked={featureFlags.kindnessAndFlexibility} onCheckedChange={(checked) => handleFeatureFlagChange("kindnessAndFlexibility", checked)} />
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <h4 className="font-medium">Self-Forgiveness</h4>
                  <p className="text-sm text-muted-foreground">Encouraging self-compassion through reflection.</p>
                </div>
                <Switch checked={featureFlags.selfForgiveness} onCheckedChange={(checked) => handleFeatureFlagChange("selfForgiveness", checked)} />
              </div>
            </div>
          </TabsContent>
          <TabsContent value="ai" className="pt-4">
            <div className="space-y-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="ai-provider" className="text-right">
                  Provider
                </Label>
                <div className="col-span-3">
                  <Select value={aiProvider} onValueChange={(value: AIProvider) => setAiProvider(value)}>
                    <SelectTrigger id="ai-provider">
                      <SelectValue placeholder="Select AI Provider" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gemini">Google Gemini</SelectItem>
                      <SelectItem value="groq">Groq</SelectItem>
                      <SelectItem value="openai">OpenAI</SelectItem>
                      <SelectItem value="anthropic">Anthropic</SelectItem>
                      <SelectItem value="deepseek">DeepSeek</SelectItem>
                      <SelectItem value="ollama">Ollama (Local)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="gemini-key" className="text-right">
                  Gemini Key
                </Label>
                <Input id="gemini-key" type="password" value={apiKeys.gemini} onChange={(e) => handleApiKeyChange("gemini", e.target.value)} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="groq-key" className="text-right">
                  Groq Key
                </Label>
                <Input id="groq-key" type="password" value={apiKeys.groq} onChange={(e) => handleApiKeyChange("groq", e.target.value)} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="openai-key" className="text-right">
                  OpenAI Key
                </Label>
                <Input id="openai-key" type="password" value={apiKeys.openai} onChange={(e) => handleApiKeyChange("openai", e.target.value)} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="anthropic-key" className="text-right">
                  Anthropic Key
                </Label>
                <Input id="anthropic-key" type="password" value={apiKeys.anthropic} onChange={(e) => handleApiKeyChange("anthropic", e.target.value)} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="deepseek-key" className="text-right">
                  DeepSeek Key
                </Label>
                <Input id="deepseek-key" type="password" value={apiKeys.deepseek} onChange={(e) => handleApiKeyChange("deepseek", e.target.value)} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="ollama-host" className="text-right">
                  Ollama Host
                </Label>
                <Input id="ollama-host" type="text" value={apiKeys.ollama} onChange={(e) => handleApiKeyChange("ollama", e.target.value)} className="col-span-3" />
              </div>
            </div>
          </TabsContent>
          <TabsContent value="data" className="pt-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <h4 className="font-medium">Export Data</h4>
                  <p className="text-sm text-muted-foreground">Save your dashboard layout and tasks to a file.</p>
                </div>
                <Button onClick={handleExport}>Export</Button>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <h4 className="font-medium">Import Data</h4>
                  <p className="text-sm text-muted-foreground">Load your dashboard from a backup file.</p>
                </div>
                <input type="file" ref={fileInputRef} onChange={handleFileImport} className="hidden" accept=".json" />
                <Button onClick={handleImportClick} variant="outline">
                  Import
                </Button>
              </div>
              <div className="flex items-center justify-between p-3 border border-destructive/50 rounded-lg">
                <div>
                  <h4 className="font-medium text-destructive">Clear All Data</h4>
                  <p className="text-sm text-muted-foreground">Permanently delete all your local data.</p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">Clear</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete all your pages, widgets, and tasks from this device.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleClearData}>Continue</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        <DialogFooter className="pt-4">
          <Button variant="ghost" onClick={resetToDefaults}>
            Reset to Defaults
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
