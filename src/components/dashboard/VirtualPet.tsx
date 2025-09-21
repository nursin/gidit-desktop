import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import { PawPrint, Heart, Drumstick, Bone, Gamepad2, Skull, Smile, Frown, RotateCcw } from "lucide-react";

const MAX_STAT = 100;
const DECAY_RATE = 2; // Stat points to lose
const TICK_INTERVAL = 2000; // in milliseconds

export interface VirtualPetProps {
  name?: string;
}

export function VirtualPet({ name = "Virtual Pet" }: VirtualPetProps) {
  const [hunger, setHunger] = useState<number>(MAX_STAT);
  const [happiness, setHappiness] = useState<number>(MAX_STAT);
  const [isAlive, setIsAlive] = useState<boolean>(true);

  const decayStats = useCallback(() => {
    if (!isAlive) return;
    setHunger((h) => Math.max(0, h - DECAY_RATE));
    setHappiness((p) => Math.max(0, p - DECAY_RATE));
  }, [isAlive]);

  useEffect(() => {
    const timer = setInterval(decayStats, TICK_INTERVAL);
    return () => clearInterval(timer);
  }, [decayStats]);

  useEffect(() => {
    if ((hunger <= 0 || happiness <= 0) && isAlive) {
      setIsAlive(false);
    }
  }, [hunger, happiness, isAlive]);

  const feed = () => {
    if (!isAlive) return;
    setHunger((h) => Math.min(MAX_STAT, h + 20));
  };

  const play = () => {
    if (!isAlive) return;
    setHappiness((p) => Math.min(MAX_STAT, p + 15));
  };

  const restart = () => {
    setIsAlive(true);
    setHunger(MAX_STAT);
    setHappiness(MAX_STAT);
  };

  const getPetStatusIcon = () => {
    if (!isAlive) return <Skull className="w-16 h-16 text-gray-500" />;
    if (happiness > 60) return <Smile className="w-16 h-16 text-green-500" />;
    return <Frown className="w-16 h-16 text-yellow-500" />;
  };

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <PawPrint className="w-6 h-6 text-primary" />
            <div>
              <CardTitle>{name}</CardTitle>
              <CardDescription>Keep your digital friend happy!</CardDescription>
            </div>
          </div>
          {!isAlive && (
            <Button variant="ghost" size="icon" onClick={restart}>
              <RotateCcw className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex flex-col flex-grow justify-center items-center gap-4">
        <div className="w-24 h-24 flex items-center justify-center">{getPetStatusIcon()}</div>

        {isAlive ? (
          <>
            <div className="w-full space-y-3">
              <div className="space-y-1">
                <div className="flex justify-between items-center text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Bone className="w-3 h-3" /> Hunger
                  </span>
                  <span>{hunger}%</span>
                </div>
                <Progress value={hunger} />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between items-center text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Heart className="w-3 h-3" /> Happiness
                  </span>
                  <span>{happiness}%</span>
                </div>
                <Progress value={happiness} />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={feed}>
                <Drumstick className="w-4 h-4 mr-2" />
                Feed
              </Button>
              <Button onClick={play} variant="outline">
                <Gamepad2 className="w-4 h-4 mr-2" />
                Play
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center">
            <p className="font-bold text-destructive">Your pet has run away.</p>
            <p className="text-sm text-muted-foreground">Try again by restarting.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default VirtualPet;
