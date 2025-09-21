import { useState, useTransition, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { generateDailyTaskSuggestions } from "../../services/ai";
import { Lightbulb, Loader2, Wand2 } from "lucide-react";
import { ScrollArea } from "../ui/scroll-area";

/**
 * Note:
 * - This component calls into the renderer service (src/services/ai.ts),
 *   which should forward the request to the Electron main process via IPC.
 * - The main process is responsible for running local AI models (Ollama) or
 *   Python scripts and returning results to the renderer.
 */

const pastTasksExample =
  "Finished Q3 report, Planned next week's meals, Responded to non-critical emails, Organized desktop files";

type DailyTaskSuggestionsProps = {
  name?: string;
};

export function DailyTaskSuggestions({ name = "Daily Suggestions" }: DailyTaskSuggestionsProps) {
  const [suggestedTasks, setSuggestedTasks] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();

  const handleGenerateSuggestions = () => {
    startTransition(async () => {
      try {
        // Optionally clear previous suggestions while generating
        setSuggestedTasks([]);

        const result = await generateDailyTaskSuggestions({ pastTasks: pastTasksExample });

        // Accept either a CSV string or an array of strings from the service
        if (!result) {
          setSuggestedTasks([]);
          return;
        }

        if (typeof result === "string") {
          setSuggestedTasks(result.split(",").map((s) => s.trim()).filter(Boolean));
        } else if (Array.isArray(result)) {
          setSuggestedTasks(result.map((s) => String(s).trim()).filter(Boolean));
        } else if ((result as any).suggestedTasks && typeof (result as any).suggestedTasks === "string") {
          setSuggestedTasks((result as any).suggestedTasks.split(",").map((s: string) => s.trim()).filter(Boolean));
        } else {
          // Fallback: try to coerce to string and split
          setSuggestedTasks(String(result).split(",").map((s) => s.trim()).filter(Boolean));
        }
      } catch (err) {
        console.error("Failed to generate suggestions", err);
        setSuggestedTasks([]);
      }
    });
  };

  useEffect(() => {
    // Generate suggestions on initial load
    handleGenerateSuggestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Lightbulb className="w-6 h-6 text-primary" />
          <div>
            <CardTitle>{name}</CardTitle>
            <CardDescription>Smart ideas for what to do next.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col flex-grow gap-4">
        {isPending && suggestedTasks.length === 0 ? (
          <div className="flex items-center justify-center flex-grow">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <ScrollArea className="flex-grow">
            <ul className="space-y-2 text-sm list-disc list-inside pr-4">
              {suggestedTasks.map((task, index) => (
                <li key={index}>{task}</li>
              ))}
            </ul>
          </ScrollArea>
        )}
        <Button onClick={handleGenerateSuggestions} disabled={isPending} className="flex-shrink-0">
          {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
          Refresh Suggestions
        </Button>
      </CardContent>
    </Card>
  );
}
