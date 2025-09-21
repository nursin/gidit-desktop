import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../../../0renderer/src/components/ui/button";
import { Textarea } from "../ui/textarea";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../ui/tabs";
import {
  BrainCircuit,
  Smile,
  Frown,
  Meh,
  Laugh,
  Angry,
  PenSquare,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { useToast } from "../../hooks/useToast";

const moods = [
  { level: 1, icon: <Angry className="w-8 h-8" />, label: "Awful" },
  { level: 2, icon: <Frown className="w-8 h-8" />, label: "Bad" },
  { level: 3, icon: <Meh className="w-8 h-8" />, label: "Okay" },
  { level: 4, icon: <Smile className="w-8 h-8" />, label: "Good" },
  { level: 5, icon: <Laugh className="w-8 h-8" />, label: "Great" },
];

const thoughtPrompts = [
  "What's one thing I'm assuming to be true right now?",
  "Is there a more positive or useful way to look at this situation?",
  "What would I tell a friend who was thinking this way?",
  "What is one piece of evidence that contradicts this negative thought?",
  "If this thought weren't true, what would that mean for me?",
];

export function MindfulMoments({ name = "Mindful Moments" }: { name?: string }) {
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [thought, setThought] = useState("");
  const [prompt, setPrompt] = useState(thoughtPrompts[0]);
  const [breathingState, setBreathingState] = useState<'idle' | 'in' | 'hold' | 'out'>('idle');
  const [breathInstruction, setBreathInstruction] = useState("Click Start to Begin");

  const { toast } = useToast();

  useEffect(() => {
    let timer: number | undefined;
    if (breathingState === 'in') {
      setBreathInstruction("Breathe in...");
      timer = window.setTimeout(() => setBreathingState('hold'), 4000);
    } else if (breathingState === 'hold') {
      setBreathInstruction("Hold");
      timer = window.setTimeout(() => setBreathingState('out'), 7000);
    } else if (breathingState === 'out') {
      setBreathInstruction("Breathe out...");
      timer = window.setTimeout(() => setBreathingState('in'), 8000);
    }
    return () => {
      if (timer) window.clearTimeout(timer);
    };
  }, [breathingState]);

  const handleLogMood = async () => {
    if (!selectedMood) return;
    // Try to persist via IPC if preload exposes an API; otherwise fallback to toast only.
    try {
      const api = (window as any).electronAPI;
      if (api?.saveMood) {
        await api.saveMood({ mood: selectedMood, timestamp: new Date().toISOString() });
      }
    } catch (err) {
      // ignore persistence errors in renderer; main should log
      // eslint-disable-next-line no-console
      console.warn("Failed to persist mood via IPC:", err);
    }

    toast?.({
      title: "Mood Logged",
      description: "Your mood has been saved for today.",
    });
  };

  const handleSaveThought = async () => {
    if (!thought.trim()) return;

    try {
      const api = (window as any).electronAPI;
      if (api?.saveThought) {
        await api.saveThought({
          text: thought.trim(),
          prompt,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn("Failed to persist thought via IPC:", err);
    }

    toast?.({
      title: "Thought Saved",
      description: "Your reflection has been recorded.",
    });

    setThought("");
    setPrompt(thoughtPrompts[Math.floor(Math.random() * thoughtPrompts.length)]);
  };

  const toggleBreathing = () => {
    if (breathingState === 'idle') {
      setBreathingState('in');
    } else {
      setBreathingState('idle');
      setBreathInstruction("Click Start to Begin");
    }
  };

  return (
    <>
      <style>{`
        @keyframes circle-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        .animate-circle-pulse { animation: circle-pulse 8s ease-in-out infinite; }
      `}</style>

      <Card className="flex flex-col h-full bg-transparent border-0 shadow-none">
        <CardHeader>
          <div className="flex items-center gap-3">
            <BrainCircuit className="w-6 h-6 text-primary" />
            <div>
              <CardTitle>{name}</CardTitle>
              <CardDescription>Tools for emotional awareness and calm.</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col min-h-0">
          <Tabs defaultValue="check-in" className="flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="check-in">Check-in</TabsTrigger>
              <TabsTrigger value="reflect">Reflect</TabsTrigger>
              <TabsTrigger value="breathe">Breathe</TabsTrigger>
            </TabsList>

            <TabsContent value="check-in" className="flex-1 flex flex-col justify-center items-center gap-4">
              <p className="text-lg font-medium">How are you feeling right now?</p>
              <div className="flex justify-around items-end w-full max-w-sm">
                {moods.map(mood => (
                  <button
                    key={mood.level}
                    onClick={() => setSelectedMood(mood.level)}
                    className="text-center text-muted-foreground hover:text-primary transition-colors focus:outline-none focus:text-primary"
                    aria-pressed={selectedMood === mood.level}
                    aria-label={`Select mood ${mood.label}`}
                  >
                    <div className={cn("p-2 rounded-full transition-colors", selectedMood === mood.level ? "text-primary bg-primary/10" : "")}>
                      {mood.icon}
                    </div>
                    <span className="text-xs font-medium">{mood.label}</span>
                  </button>
                ))}
              </div>
              <Button onClick={handleLogMood} disabled={!selectedMood}>Log Mood</Button>
            </TabsContent>

            <TabsContent value="reflect" className="flex-1 flex flex-col gap-4 pt-4">
              <div className="p-3 bg-secondary rounded-lg">
                <p className="text-sm font-semibold">Cognitive Reframing Prompt</p>
                <p className="text-xs text-muted-foreground">{prompt}</p>
              </div>
              <Textarea
                placeholder="Write down a thought that's bothering you..."
                className="flex-1 resize-none"
                value={thought}
                onChange={(e) => setThought(e.target.value)}
              />
              <Button onClick={handleSaveThought} disabled={!thought.trim()}>
                <PenSquare className="w-4 h-4 mr-2" />
                Save Thought
              </Button>
            </TabsContent>

            <TabsContent value="breathe" className="flex-1 flex flex-col justify-center items-center gap-6">
              <div className="relative w-40 h-40 flex items-center justify-center">
                <div
                  className={cn(
                    "absolute w-full h-full bg-primary/20 rounded-full transition-transform duration-[4000ms] ease-in-out",
                    breathingState === 'in' && 'scale-100',
                    breathingState === 'hold' && 'scale-100',
                    breathingState === 'out' && 'scale-50',
                    breathingState === 'idle' && 'scale-50'
                  )}
                />
                <div className="w-24 h-24 bg-primary/30 rounded-full" />
              </div>
              <p className="text-2xl font-semibold text-center h-8">{breathInstruction}</p>
              <Button onClick={toggleBreathing}>
                {breathingState === 'idle' ? 'Start' : 'Stop'}
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </>
  );
}

export default MindfulMoments;
