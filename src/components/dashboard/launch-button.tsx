import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Rocket } from "lucide-react";
import { cn } from "../../lib/utils";

type LaunchButtonProps = {
  name?: string;
};

export function LaunchButton({ name = "Launch Button" }: LaunchButtonProps) {
  const [countdown, setCountdown] = useState<number | null>(null);

  useEffect(() => {
    if (countdown === null || countdown === 0) return;

    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown]);

  const startCountdown = () => {
    setCountdown(5);
  };

  const isCountingDown = countdown !== null && countdown > 0;
  const isLaunched = countdown === 0;

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Rocket className="w-6 h-6 text-primary" />
          <div>
            <CardTitle>{name}</CardTitle>
            <CardDescription>A countdown to begin your task.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col flex-grow justify-center items-center gap-4">
        <div
          className={cn(
            "relative w-40 h-40 flex items-center justify-center transition-all duration-300",
            isCountingDown && "scale-110",
            isLaunched && "scale-125"
          )}
        >
          {isCountingDown && (
            <div className="absolute text-8xl font-bold text-primary animate-ping opacity-75">
              {countdown}
            </div>
          )}
          {isLaunched && (
            <div className="absolute text-6xl font-bold text-green-500 animate-pulse">GO!</div>
          )}
          <Button
            className="w-40 h-40 rounded-full text-2xl font-bold"
            onClick={startCountdown}
            disabled={isCountingDown}
          >
            {isLaunched ? <Rocket className="w-16 h-16" /> : "LAUNCH"}
          </Button>
        </div>
        {isLaunched && (
          <Button variant="outline" size="sm" onClick={() => setCountdown(null)}>
            Reset
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
