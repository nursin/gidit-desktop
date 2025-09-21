import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Progress } from "../ui/progress";
import { Hourglass, Play, ArrowRight } from "lucide-react";
import { Separator } from "../ui/separator";

const DURATION_SECONDS = 25 * 60; // 25 minutes

type NowNextPanelProps = {
  name?: string;
};

export function NowNextPanel({ name = "Now & Next" }: NowNextPanelProps) {
  const [nowTask, setNowTask] = useState({ id: 1, title: "Draft proposal email" });
  const [nextTask, setNextTask] = useState({ id: 2, title: "Review Q3 analytics" });

  const [secondsLeft, setSecondsLeft] = useState<number>(DURATION_SECONDS);
  const [isActive, setIsActive] = useState<boolean>(false);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (isActive) {
      intervalRef.current = window.setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            if (intervalRef.current !== null) {
              window.clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
            setIsActive(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    return () => {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isActive]);

  const handleStart = () => {
    if (secondsLeft === 0) {
      setSecondsLeft(DURATION_SECONDS);
    }
    setIsActive(true);
  };

  const handleComplete = () => {
    setIsActive(false);
    setNowTask(nextTask);
    setNextTask({ id: 3, title: "Plan tomorrow's agenda" }); // mock next task
    setSecondsLeft(DURATION_SECONDS);
  };

  const progress = ((DURATION_SECONDS - secondsLeft) / DURATION_SECONDS) * 100;
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
  };

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Hourglass className="w-6 h-6 text-primary" />
          <div>
            <CardTitle>{name}</CardTitle>
            <CardDescription>Focus on one task at a time.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col flex-grow justify-around">
        {/* NOW Section */}
        <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
          <h3 className="text-sm font-semibold text-primary mb-2">NOW</h3>
          <p className="text-lg font-bold">{nowTask.title}</p>
          <div className="mt-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-mono text-primary">{formatTime(secondsLeft)}</span>
              <span className="text-xs text-muted-foreground">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} />
            <div className="flex gap-2 pt-2">
              <Button size="sm" onClick={handleStart} disabled={isActive || secondsLeft === 0}>
                <Play className="w-4 h-4 mr-2" />
                Start
              </Button>
              <Button size="sm" variant="outline" onClick={handleComplete}>
                <ArrowRight className="w-4 h-4 mr-2" />
                Next
              </Button>
            </div>
          </div>
        </div>

        <Separator />

        {/* NEXT Section */}
        <div className="p-4 rounded-lg bg-secondary/50">
          <h3 className="text-sm font-semibold text-muted-foreground mb-2">NEXT</h3>
          <p className="text-lg font-medium text-muted-foreground">{nextTask.title}</p>
        </div>
      </CardContent>
    </Card>
  );
}
