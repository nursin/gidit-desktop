import React, { useState, useTransition } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { generateStory } from "../../services/ai";
import { FileText, Loader2, Sparkles } from "lucide-react";
import { Separator } from "../ui/separator";
import { ScrollArea } from "../ui/scroll-area";

type StoryWriterProps = {
  name?: string;
};

export function StoryWriter({ name = "Smart Story Writer" }: StoryWriterProps) {
  const [prompt, setPrompt] = useState("");
  const [story, setStory] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleGenerateStory = () => {
    // run generation in a transition so UI stays responsive
    startTransition(async () => {
      try {
        // The renderer-side service will call the Electron main process via IPC
        const result = await generateStory(prompt);
        // support services that return either a string or an object like { story: string }
        const storyText = typeof result === "string" ? result : result?.story ?? "";
        setStory(storyText);
      } catch (err) {
        console.error("Failed to generate story:", err);
        setStory("An error occurred while generating the story.");
      }
    });
  };

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <div className="flex items-center gap-3">
          <FileText className="w-6 h-6 text-primary" />
          <div>
            <CardTitle>{name}</CardTitle>
            <CardDescription>Bring your creative ideas to life.</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col flex-grow gap-4 min-h-0">
        <Textarea
          placeholder="A lone astronaut on a forgotten planet finds a mysterious artifact..."
          className="min-h-[80px] resize-none"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />

        <Button onClick={handleGenerateStory} disabled={isPending || !prompt} className="flex-shrink-0">
          {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
          Write Story
        </Button>

        {story && (
          <div className="space-y-3 flex flex-col flex-grow min-h-0">
            <Separator />
            <ScrollArea className="flex-grow p-1">
              <div className="p-3 bg-secondary/50 rounded-lg whitespace-pre-wrap">
                <h3 className="font-semibold mb-2">Generated Story</h3>
                <p className="text-sm">{story}</p>
              </div>
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
