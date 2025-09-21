import React, { useEffect, useRef, useState, useTransition } from "react";
import { v4 as uuidv4 } from "uuid";
import { Notebook, PlusCircle, RefreshCw, Loader2, Trash2, Wand2 } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { ScrollArea } from "../ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { cn } from "../../lib/utils";
import { useToast } from "../../hooks/useToast";
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

import { organizeNotes, processNotes } from "../../services/ai";

type Note = {
  id: string;
  title: string;
  rawNotes: string;
  organizedNotes: string;
  strategicPlan: string;
};

type NoteDisplayProps = {
  name?: string;
  rawNotes?: string;
  organizedNotes?: string;
  onSaveNoteAsPage?: (note: { title: string; rawNotes: string; organizedNotes: string }) => void;
};

// A simple markdown-to-html converter
const markdownToHtml = (markdown: string) => {
  if (!markdown) return "";
  let html = markdown
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

  return html
    .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold mt-6 mb-3 border-b pb-2">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-8 mb-4 border-b-2 pb-2">$1</h1>')
    .replace(/\*\*(.*?)\*\*/gim, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/gim, "<em>$1</em>")
    .replace(/\[src: (.*?)\]\((.*?)\)/gim, '<a href="$2" class="src-link text-primary hover:underline transition-colors text-xs p-1 rounded-sm bg-primary/10">[$1]</a>')
    .replace(/`([^`]+)`/gim, '<code class="bg-secondary px-1 py-0.5 rounded-sm text-sm">$1</code>')
    .replace(/^- (.*$)/gim, "<li>$1</li>")
    .replace(/^\* (.*$)/gim, "<li>$1</li>")
    .replace(/<\/li><li>/gim, "</li><li>")
    .replace(/\n/g, "<br />")
    .replace(/<br \/><li>/gim, "<li>")
    .replace(/<\/li><br \/>/gim, "</li>");
};

function NoteContent({
  note,
  onNoteUpdate,
}: {
  note: Note;
  onNoteUpdate: (noteId: string, updates: Partial<Note>) => void;
}) {
  const briefContentRef = useRef<HTMLDivElement>(null);
  const rawContentRef = useRef<HTMLDivElement>(null);
  const [isOrganizing, startOrganizeTransition] = useTransition();
  const [isStrategizing, startStrategizeTransition] = useTransition();
  const [activeTab, setActiveTab] = useState("raw");
  const { toast } = useToast();

  useEffect(() => {
    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLAnchorElement;
      if (target.classList.contains("src-link") && target.hash) {
        e.preventDefault();
        const targetId = target.hash.substring(1); // #note-N001 -> note-N001

        setActiveTab("raw");

        setTimeout(() => {
          const rawNotesContainer = rawContentRef.current;
          if (!rawNotesContainer) return;

          const targetElement = rawNotesContainer.querySelector(`#${targetId}`);

          if (targetElement) {
            targetElement.scrollIntoView({ behavior: "smooth", block: "center" });
            targetElement.classList.add(
              "bg-yellow-200",
              "dark:bg-yellow-800",
              "transition-all",
              "duration-1000",
              "ease-out",
              "rounded-sm",
              "p-1",
              "-m-1"
            );
            setTimeout(() => {
              targetElement.classList.remove("bg-yellow-200", "dark:bg-yellow-800", "p-1", "-m-1");
            }, 2000);
          }
        }, 100);
      }
    };

    const contentDiv = briefContentRef.current;
    contentDiv?.addEventListener("click", handleLinkClick);

    return () => {
      contentDiv?.removeEventListener("click", handleLinkClick);
    };
  }, [note.id]);

  const createAnchoredRawNotes = (notes: string) => {
    return notes
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;")
      .replace(/^(N\d+)/gim, '<span id="note-$1">$1</span>')
      .replace(/\n/g, "<br />");
  };

  const handleOrganize = () => {
    startOrganizeTransition(async () => {
      try {
        const currentRawNotes = rawContentRef.current?.innerText || note.rawNotes;
        onNoteUpdate(note.id, { rawNotes: currentRawNotes });

        const result = await organizeNotes({
          notes: currentRawNotes,
          goal: `Refine notes for: ${note.title}`,
          maxMinutes: 5,
        });
        onNoteUpdate(note.id, { organizedNotes: result.organizedNotes });
        toast({ title: "Brief Updated!", description: "Your structured brief has been refreshed." });
      } catch (error) {
        toast({ title: "Error", description: "Could not organize notes.", variant: "destructive" });
      }
    });
  };

  const handleStrategize = () => {
    startStrategizeTransition(async () => {
      try {
        const currentRawNotes = rawContentRef.current?.innerText || note.rawNotes;
        onNoteUpdate(note.id, { rawNotes: currentRawNotes });

        const result = await processNotes({ notes: currentRawNotes });

        // Format the strategic plan into markdown
        const strategicMarkdown = `
# Strategic Plan for: ${note.title}

## Summary
${result.summary}

## Strategic Plan
${result.strategicPlan.map((step: string) => `- ${step}`).join("\n")}

## Actionable Tasks
| Task | Time to Complete | Goal |
|---|---|---|
${result.tasks.map((t: any) => `| ${t.task} | ${t.timeToComplete} | ${t.goal} |`).join("\n")}
                `;

        onNoteUpdate(note.id, { strategicPlan: strategicMarkdown });
        toast({ title: "Strategy Generated!", description: "A new strategic plan has been created." });
      } catch (error) {
        toast({ title: "Error", description: "Could not generate strategy.", variant: "destructive" });
      }
    });
  };

  const handleRawNotesChange = (e: React.FormEvent<HTMLDivElement>) => {
    onNoteUpdate(note.id, { rawNotes: e.currentTarget.innerText });
  };

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
      <div className="flex justify-between items-center flex-shrink-0">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="organized">Structured Brief</TabsTrigger>
          <TabsTrigger value="strategized">Strategic Plan</TabsTrigger>
          <TabsTrigger value="raw">Original Notes</TabsTrigger>
        </TabsList>
        <div className="flex gap-2 ml-4">
          <Button variant="outline" size="sm" onClick={handleOrganize} disabled={isOrganizing}>
            {isOrganizing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Organize
          </Button>
          <Button variant="outline" size="sm" onClick={handleStrategize} disabled={isStrategizing}>
            {isStrategizing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
            Strategize
          </Button>
        </div>
      </div>
      <TabsContent value="organized" className="flex-1 mt-2 min-h-0">
        <ScrollArea className="h-full pr-4">
          <div ref={briefContentRef} className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: markdownToHtml(note.organizedNotes) }} />
        </ScrollArea>
      </TabsContent>
      <TabsContent value="strategized" className="flex-1 mt-2 min-h-0">
        <ScrollArea className="h-full pr-4">
          <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: markdownToHtml(note.strategicPlan) }} />
        </ScrollArea>
      </TabsContent>
      <TabsContent value="raw" className="flex-1 mt-2 min-h-0">
        <ScrollArea className="h-full border rounded-md p-2 bg-secondary/30">
          <div
            ref={rawContentRef}
            contentEditable
            suppressContentEditableWarning
            onBlur={handleRawNotesChange}
            className="w-full h-full resize-none whitespace-pre-wrap text-sm text-muted-foreground bg-transparent border-0 focus-visible:ring-0 focus-visible:outline-none"
            dangerouslySetInnerHTML={{ __html: createAnchoredRawNotes(note.rawNotes) }}
          />
        </ScrollArea>
      </TabsContent>
    </Tabs>
  );
}

export function NoteDisplay({
  name: initialTitle = "Saved Note",
  rawNotes = "No raw notes provided.",
  organizedNotes = "No organized brief provided.",
}: NoteDisplayProps) {
  const [notes, setNotes] = useState<Note[]>(() => {
    // In the Electron app this will later be loaded from the local DB / IPC.
    return [
      {
        id: uuidv4(),
        title: initialTitle,
        rawNotes,
        organizedNotes,
        strategicPlan: "### Strategic Plan\nYour strategic plan will appear here after processing.",
      },
    ];
  });
  const [activeNoteId, setActiveNoteId] = useState<string>(notes[0]?.id || "");
  const { toast } = useToast();

  const handleAddNote = () => {
    const newNote: Note = {
      id: uuidv4(),
      title: `New Note ${notes.length + 1}`,
      rawNotes: "Start typing your raw notes here...",
      organizedNotes: "### New Note\nYour organized brief will appear here after processing.",
      strategicPlan: "### Strategic Plan\nYour strategic plan will appear here after processing.",
    };
    setNotes([...notes, newNote]);
    setActiveNoteId(newNote.id);
    toast?.({ title: "Note Created", description: "A new note was added." });
  };

  const handleNoteUpdate = (noteId: string, updates: Partial<Note>) => {
    setNotes((prev) => prev.map((n) => (n.id === noteId ? { ...n, ...updates } : n)));
  };

  const handleDeleteNote = (noteId: string) => {
    setNotes((prev) => {
      const newNotes = prev.filter((n) => n.id !== noteId);
      if (activeNoteId === noteId) {
        setActiveNoteId(newNotes[0]?.id || "");
      }
      return newNotes;
    });
    toast?.({ title: "Note Deleted", description: "The note was removed." });
  };

  const activeNote = notes.find((n) => n.id === activeNoteId);

  return (
    <Card className="flex flex-col h-full bg-transparent border-0 shadow-none">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Notebook className="w-6 h-6 text-primary" />
            <div>
              {activeNote ? (
                <Input
                  value={activeNote.title}
                  onChange={(e) => handleNoteUpdate(activeNote.id, { title: e.target.value })}
                  className="text-2xl font-semibold leading-none tracking-tight border-none focus-visible:ring-0 p-0 h-auto"
                />
              ) : (
                <CardTitle>Notes</CardTitle>
              )}
              <CardDescription>A collection of your saved and processed notes.</CardDescription>
            </div>
          </div>
          {activeNote && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Note
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete "{activeNote.title}". This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleDeleteNote(activeNote.id)}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 min-h-0">
        <div className="flex h-full gap-4">
          {/* Vertical Tabs / Sidebar */}
          <div className="w-1/4 border-r pr-4">
            <Button onClick={handleAddNote} className="w-full mb-4" variant="outline">
              <PlusCircle className="mr-2 h-4 w-4" />
              New Note
            </Button>
            <ScrollArea className="h-[calc(100%-4rem)]">
              <div className="flex flex-col gap-2 pr-2">
                {notes.map((note) => (
                  <button
                    key={note.id}
                    onClick={() => setActiveNoteId(note.id)}
                    className={cn(
                      "p-2 rounded-md text-left text-sm w-full truncate",
                      activeNoteId === note.id ? "bg-primary/10 text-primary font-semibold" : "hover:bg-accent"
                    )}
                  >
                    {note.title}
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>
          {/* Content */}
          <div className="w-3/4">
            {activeNote ? (
              <NoteContent note={activeNote} onNoteUpdate={handleNoteUpdate} />
            ) : (
              <div className="text-center text-muted-foreground pt-12">
                <p>No notes found.</p>
                <p className="text-sm">Click "New Note" to get started.</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
