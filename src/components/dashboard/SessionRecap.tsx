import { useState, useTransition, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { generateSessionRecap } from "../../services/ai";
import { Sparkles, Loader2, Zap } from "lucide-react";
import { useToast } from "../../hooks/useToast";

const recentTasksExample =
  "Finished Q3 report draft, Called plumber about kitchen sink, Sketched out new feature design for 'Project Phoenix'";

type SessionRecapProps = {
  name?: string;
};

export function SessionRecap({ name = "Quick Recap" }: SessionRecapProps) {
  const [recap, setRecap] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  // useToast is optional; provide a simple fallback to alert if not available
  const toastCtx = useToast ? useToast() : undefined;
  const toast = toastCtx?.toast ?? ((opts: { title?: string; description?: string }) => {
    // basic fallback for environments without a toast system
    // eslint-disable-next-line no-alert
    window.alert(`${opts.title ?? "Notification"}\n${opts.description ?? ""}`);
  });

  const handleGenerateRecap = () => {
    startTransition(async () => {
      try {
        const result = await generateSessionRecap({ recentTasks: recentTasksExample });
        setRecap(result?.recap ?? null);
      } catch (error) {
        // Keep console logging for debugging in desktop app
        // and show a user-friendly message via toast/fallback
        // eslint-disable-next-line no-console
        console.error("Failed to generate recap:", error);
        toast({
          title: "Error Generating Recap",
          description: "Could not fetch your recent activity. Please try again.",
        });
      }
    });
  };

  useEffect(() => {
    handleGenerateRecap();
    // Intentionally run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Card className="flex flex-col h-full bg-transparent border-0 shadow-none">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Zap className="w-6 h-6 text-primary" />
          <div>
            <CardTitle>{name}</CardTitle>
            <CardDescription>Get back on track, fast.</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col flex-grow justify-center items-center gap-4 text-center">
        {isPending && !recap ? (
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
        ) : recap ? (
          <div className="p-4 bg-secondary rounded-lg">
            <p className="font-medium whitespace-pre-wrap">{recap}</p>
          </div>
        ) : (
          <p className="text-muted-foreground">Click the button for a summary of your last session.</p>
        )}

        <Button onClick={handleGenerateRecap} disabled={isPending}>
          {isPending ? (
            "Remembering..."
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" /> Refresh Recap
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
