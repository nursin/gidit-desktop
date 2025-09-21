import React, { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { ShieldCheck, LogIn, AlertTriangle, Timer, XCircle, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Progress } from "../ui/progress";

const FOCUS_DURATIONS = [15, 25, 45, 60, 90]; // in minutes

type FocusModeProps = {
  name?: string;
};

export function FocusMode({ name = "Focus Mode" }: FocusModeProps) {
  const [duration, setDuration] = useState<number>(25 * 60); // seconds
  const [timeLeft, setTimeLeft] = useState<number>(25 * 60);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [sessionEnded, setSessionEnded] = useState<boolean>(false);
  const [reason, setReason] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // In browser/electron renderer, setInterval returns number
  const timerRef = useRef<number | null>(null);

  const startTimer = useCallback(() => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
    }
    timerRef.current = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) {
            window.clearInterval(timerRef.current);
            timerRef.current = null;
          }
          handleSessionEnd("completed");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const handleSessionEnd = (endReason: "completed" | "exited" | "cancelled") => {
    setIsActive(false);
    setSessionEnded(true);
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {
        /* ignore */
      });
    }
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }

    switch (endReason) {
      case "completed":
        setReason("You successfully completed the focus session!");
        break;
      case "exited":
        setReason("Focus session ended because you exited fullscreen mode.");
        break;
      case "cancelled":
        setReason("Focus session cancelled.");
        break;
    }
  };

  const handleStartClick = () => {
    setIsLoading(true);
  };

  const handleEnterFullscreen = async () => {
    try {
      await document.documentElement.requestFullscreen();
      setIsLoading(false);
      setTimeLeft(duration);
      setSessionEnded(false);
      setIsActive(true);
      startTimer();
    } catch (err) {
      // In Electron there are other ways to toggle fullscreen from main; this fallback is fine for renderer-only
      // Show simple alert for now; apps can replace with modal/notification
      alert("Could not enter fullscreen mode. This feature may not be supported.");
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && isActive) {
        handleSessionEnd("exited");
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden" && isActive) {
        handleSessionEnd("exited");
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isActive]);

  // Keep timeLeft in sync when duration changes (only when not active)
  useEffect(() => {
    if (!isActive && !sessionEnded) {
      setTimeLeft(duration);
    }
  }, [duration, isActive, sessionEnded]);

  const resetState = () => {
    setSessionEnded(false);
    setIsLoading(false);
    setTimeLeft(duration);
    setReason("");
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  };

  const progress = duration > 0 ? ((duration - timeLeft) / duration) * 100 : 0;

  if (isActive) {
    return (
      <div className="fixed inset-0 bg-background z-50 flex flex-col items-center justify-center p-8">
        <Timer className="w-16 h-16 text-primary mb-4" />
        <h1 className="text-6xl font-bold font-mono mb-4">{formatTime(timeLeft)}</h1>
        <Progress value={progress} className="w-full max-w-md mb-8" />
        <Button variant="destructive" onClick={() => handleSessionEnd("cancelled")}>
          <XCircle className="mr-2" />
          End Session
        </Button>
        <p className="text-muted-foreground mt-8 text-center text-sm max-w-sm">
          To maintain focus, leaving fullscreen or switching tabs will automatically end the session.
        </p>
      </div>
    );
  }

  return (
    <Card className="flex flex-col h-full bg-transparent border-0 shadow-none">
      <CardHeader>
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-6 h-6 text-primary" />
          <div>
            <CardTitle>{name}</CardTitle>
            <CardDescription>Lock in and minimize distractions.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col flex-grow justify-center items-center gap-6 text-center">
        {sessionEnded ? (
          <>
            <AlertTriangle className="w-12 h-12 text-primary" />
            <p className="font-semibold">{reason}</p>
            <Button onClick={resetState}>New Session</Button>
          </>
        ) : isLoading ? (
          <>
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
            <p className="font-semibold">Preparing Focus Mode...</p>
            <Button size="lg" onClick={handleEnterFullscreen}>
              <LogIn className="mr-2" />
              Click to Enter Fullscreen
            </Button>
            <Button variant="ghost" size="sm" onClick={resetState}>
              Cancel
            </Button>
          </>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <p className="font-medium">Duration:</p>
              <Select
                onValueChange={(val) => {
                  const secs = parseInt(val, 10) * 60;
                  setDuration(secs);
                }}
                defaultValue={String(duration / 60)}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Duration" />
                </SelectTrigger>
                <SelectContent>
                  {FOCUS_DURATIONS.map((min) => (
                    <SelectItem key={min} value={String(min)}>
                      {min} minutes
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button size="lg" onClick={handleStartClick}>
              <LogIn className="mr-2" />
              Start Focus Session
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
