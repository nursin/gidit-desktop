import { useState, useRef, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Target, Dices } from "lucide-react";
import { useToast } from "../../hooks/useToast";

const initialTasks = [
  "Organize your desktop",
  "Reply to 3 old emails",
  "Stretch for 5 minutes",
  "Plan tomorrow's meals",
  "Tidy up your workspace",
  "Read an article",
  "Do a 10-minute brain dump",
  "Unsubscribe from 5 newsletters",
];

const colors = [
  "#673AB7", "#3F51B5", "#2196F3", "#00BCD4",
  "#4CAF50", "#8BC34A", "#CDDC39", "#FFEB3B",
  "#FFC107", "#FF9800", "#FF5722", "#F44336"
].reverse();

export function TaskSpinner({ name = "Task Spinner" }: { name?: string }) {
  const [tasks] = useState(initialTasks);
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const tickTimeoutRef = useRef<number | null>(null);
  const endTimeoutRef = useRef<number | null>(null);
  const { toast } = useToast();

  const initializeAudio = useCallback(() => {
    if (!audioCtxRef.current) {
      try {
        const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
        if (!Ctx) throw new Error("No AudioContext available");
        const ctx: AudioContext = new Ctx();
        if (ctx.state === "suspended") {
          ctx.resume().catch(() => {});
        }
        audioCtxRef.current = ctx;
      } catch (e) {
        console.error("Web Audio API is not supported.", e);
        toast?.({
          variant: "destructive",
          title: "Audio Error",
          description: "The Web Audio API isn't available in this environment.",
        });
      }
    }
    return audioCtxRef.current;
  }, [toast]);

  const playTick = useCallback((freq = 1200, duration = 0.05) => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      // swallow audio errors to avoid breaking UI
      console.error("Audio play error", e);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (tickTimeoutRef.current) {
        clearTimeout(tickTimeoutRef.current);
        tickTimeoutRef.current = null;
      }
      if (endTimeoutRef.current) {
        clearTimeout(endTimeoutRef.current);
        endTimeoutRef.current = null;
      }
      if (audioCtxRef.current) {
        try {
          audioCtxRef.current.close();
        } catch {
          // ignore
        }
        audioCtxRef.current = null;
      }
    };
  }, []);

  const spinWheel = () => {
    if (isSpinning) return;
    initializeAudio();
    setIsSpinning(true);
    setSelectedTask(null);

    const fullSpins = Math.floor(Math.random() * 5) + 5;
    const sliceAngle = 360 / tasks.length;
    const randomIndex = Math.floor(Math.random() * tasks.length);
    const targetAngle = 360 - (randomIndex * sliceAngle);

    const spinDuration = Math.random() * 5000 + 10000; // ms
    const newRotation = (360 * fullSpins) + targetAngle;

    setRotation((prev) => prev + newRotation);

    // ticking logic: start fast ticks and slow down over time
    let interval = 50;
    let slowdownRate = 1.05;

    const slowdown = () => {
      playTick();
      interval *= slowdownRate;
      if (interval > 150) slowdownRate = 1.1;
      if (Date.now() < startTime + spinDuration - 1000) {
        tickTimeoutRef.current = window.setTimeout(slowdown, interval);
      }
    };

    const startTime = Date.now();
    tickTimeoutRef.current = window.setTimeout(slowdown, interval);

    // end sequence
    endTimeoutRef.current = window.setTimeout(() => {
      if (tickTimeoutRef.current) {
        clearTimeout(tickTimeoutRef.current);
        tickTimeoutRef.current = null;
      }
      // finishing ticks
      window.setTimeout(() => playTick(800, 0.1), 0);
      window.setTimeout(() => playTick(800, 0.1), 300);
      window.setTimeout(() => playTick(800, 0.1), 600);

      setIsSpinning(false);
      setSelectedTask(tasks[randomIndex]);
    }, spinDuration - 1000);
  };

  const sliceAngle = 360 / tasks.length;
  const wheelStyle: React.CSSProperties = {
    transform: `rotate(${rotation}deg)`,
    transition: `transform ${isSpinning ? 12 : 0}s cubic-bezier(0.25, 0.1, 0.25, 1)`,
  };

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Target className="w-6 h-6 text-primary" />
          <div>
            <CardTitle>{name}</CardTitle>
            <CardDescription>Let fate decide your next task.</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col flex-grow justify-center items-center gap-6">
        <div className="relative w-80 h-80">
          <div className="absolute top-[-20px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-t-[20px] border-t-primary z-20" />
          <div
            className="w-full h-full rounded-full overflow-hidden border-4 border-primary/50 shadow-lg relative"
            style={{
              backgroundImage: `conic-gradient(${colors
                .map((c, i) => `${c} ${i * sliceAngle}deg ${(i + 1) * sliceAngle}deg`)
                .join(", ")})`,
              ...wheelStyle,
            }}
          >
            {tasks.map((task, index) => {
              const rotate = index * sliceAngle + sliceAngle / 2;
              return (
                <div
                  key={index}
                  className="absolute w-1/2 h-1/2 top-0 left-1/2 origin-bottom-left flex items-center justify-center"
                  style={{
                    transform: `rotate(${rotate}deg)`,
                  }}
                >
                  <span
                    className="block text-xs font-semibold text-center text-white"
                    style={{
                      transform: `translateX(-50%) translateY(1.5rem) rotate(-90deg)`,
                      textShadow: "1px 1px 1px rgba(0,0,0,0.3)",
                      maxWidth: "80px",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {task}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-background rounded-full border-2 border-primary/50 z-10" />
        </div>

        <div className="h-10">
          {selectedTask && (
            <p className="font-bold text-lg text-center animate-in fade-in">Your task: {selectedTask}</p>
          )}
        </div>

        <Button onClick={spinWheel} disabled={isSpinning}>
          <Dices className="w-4 h-4 mr-2" />
          {isSpinning ? "Spinning..." : "Spin the Wheel"}
        </Button>
      </CardContent>
    </Card>
  );
}

export default TaskSpinner;
