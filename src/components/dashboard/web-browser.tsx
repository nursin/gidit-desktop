import React, { useState, useRef, KeyboardEvent, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../../../0renderer/src/components/ui/button";
import { Input } from "../ui/input";
import { Globe, ArrowLeft, ArrowRight, RotateCw, Plus, X } from "lucide-react";
import { cn } from "../../lib/utils";
import { v4 as uuidv4 } from "uuid";

type Tab = {
  id: string;
  history: string[];
  historyIndex: number;
};

const createNewTab = (): Tab => ({
  id: uuidv4(),
  history: ["https://www.google.com/webhp?igu=1"],
  historyIndex: 0,
});

export function WebBrowser({ name = "Web Browser" }: { name?: string }) {
  // create a stable initial tab so derived initial states are consistent
  const initialTab = createNewTab();
  const [tabs, setTabs] = useState<Tab[]>([initialTab]);
  const [activeTabId, setActiveTabId] = useState<string>(initialTab.id);
  const [inputValue, setInputValue] = useState(initialTab.history[0]);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const activeTab = tabs.find((tab) => tab.id === activeTabId) || tabs[0];
  const currentUrl = activeTab.history[activeTab.historyIndex];

  useEffect(() => {
    setInputValue(currentUrl);
  }, [currentUrl]);

  const updateTab = (tabId: string, updates: Partial<Tab>) => {
    setTabs((prevTabs) =>
      prevTabs.map((tab) => (tab.id === tabId ? { ...tab, ...updates } : tab))
    );
  };

  const navigateTo = (url: string) => {
    let newUrl = url.trim();
    if (!/^(https?:\/\/|about:blank)/i.test(newUrl)) {
      newUrl = `https://${newUrl}`;
    }

    // Ensure we use the latest activeTab from current state
    setTabs((prevTabs) => {
      const idx = prevTabs.findIndex((t) => t.id === activeTab.id);
      if (idx === -1) return prevTabs;

      const tab = prevTabs[idx];
      const newHistory = tab.history.slice(0, tab.historyIndex + 1);
      newHistory.push(newUrl);

      const newTab = { ...tab, history: newHistory, historyIndex: newHistory.length - 1 };
      const newTabs = [...prevTabs];
      newTabs[idx] = newTab;
      return newTabs;
    });

    setInputValue(newUrl);
  };

  const goBack = () => {
    if (activeTab.historyIndex > 0) {
      updateTab(activeTab.id, { historyIndex: activeTab.historyIndex - 1 });
    }
  };

  const goForward = () => {
    if (activeTab.historyIndex < activeTab.history.length - 1) {
      updateTab(activeTab.id, { historyIndex: activeTab.historyIndex + 1 });
    }
  };

  const reload = () => {
    if (iframeRef.current) {
      // quick blank load to force a reload
      iframeRef.current.src = "about:blank";
      setTimeout(() => {
        if (iframeRef.current) {
          iframeRef.current.src = currentUrl;
        }
      }, 50);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      navigateTo(inputValue);
    }
  };

  const addTab = () => {
    const newTab = createNewTab();
    setTabs((prev) => [...prev, newTab]);
    setActiveTabId(newTab.id);
  };

  const closeTab = (tabIdToClose: string) => {
    setTabs((prevTabs) => {
      const tabIndex = prevTabs.findIndex((tab) => tab.id === tabIdToClose);
      const newTabs = prevTabs.filter((tab) => tab.id !== tabIdToClose);

      if (newTabs.length === 0) {
        const firstTab = createNewTab();
        setActiveTabId(firstTab.id);
        return [firstTab];
      }

      if (activeTabId === tabIdToClose) {
        const newActiveIndex = Math.max(0, tabIndex - 1);
        setActiveTabId(newTabs[newActiveIndex].id);
      }

      return newTabs;
    });
  };

  const getTabTitle = (tab: Tab) => {
    try {
      const url = new URL(tab.history[tab.historyIndex]);
      return url.hostname.replace("www.", "");
    } catch {
      return "New Tab";
    }
  };

  return (
    <Card className="flex flex-col h-full bg-transparent border-0 shadow-none">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          <Globe className="w-6 h-6 text-primary" />
          <div>
            <CardTitle>{name}</CardTitle>
            <CardDescription>Browse the web within your dashboard.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-2 min-h-0">
        <div className="flex items-center gap-1 border-b">
          {tabs.map((tab) => (
            <div
              key={tab.id}
              onClick={() => setActiveTabId(tab.id)}
              className={cn(
                "flex items-center gap-1.5 pl-3 pr-2 py-2 border-r text-sm cursor-pointer relative",
                activeTabId === tab.id ? "bg-background/80" : "bg-secondary hover:bg-background/50"
              )}
            >
              <span className="truncate max-w-[120px]">{getTabTitle(tab)}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 rounded-full"
                onClick={(e) => {
                  e.stopPropagation();
                  closeTab(tab.id);
                }}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          ))}
          <Button variant="ghost" size="icon" onClick={addTab} className="h-8 w-8 ml-1">
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2 p-2 border rounded-md bg-background/50">
          <Button variant="ghost" size="icon" onClick={goBack} disabled={activeTab.historyIndex === 0}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={goForward}
            disabled={activeTab.historyIndex === activeTab.history.length - 1}
          >
            <ArrowRight className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={reload}>
            <RotateCw className="w-4 h-4" />
          </Button>
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="https://example.com"
            className="h-9"
          />
        </div>

        <div className="flex-1 border rounded-md overflow-hidden bg-background">
          <iframe
            ref={iframeRef}
            src={currentUrl}
            title="Web Browser"
            className="w-full h-full"
            sandbox="allow-forms allow-popups allow-scripts allow-same-origin"
            onError={() => console.error(`Failed to load: ${currentUrl}`)}
          />
        </div>
      </CardContent>
    </Card>
  );
}

export default WebBrowser;
