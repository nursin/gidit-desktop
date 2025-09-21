import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { BatteryCharging, BatteryLow, BatteryMedium, BatteryFull } from "lucide-react";
import { cn } from "../../lib/utils";

const energyLevels = [
  { level: "low", icon: <BatteryLow className="w-5 h-5" />, label: "Low" },
  { level: "medium", icon: <BatteryMedium className="w-5 h-5" />, label: "Medium" },
  { level: "high", icon: <BatteryFull className="w-5 h-5" />, label: "High" },
];

type EnergySelectorProps = {
  name?: string;
};

export function EnergySelector({ name = "Energy Selector" }: EnergySelectorProps) {
  const [selectedEnergy, setSelectedEnergy] = useState<string | null>(null);

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <div className="flex items-center gap-3">
          <BatteryCharging className="w-6 h-6 text-primary" />
          <div>
            <CardTitle>{name}</CardTitle>
            <CardDescription>Filter tasks by your current energy.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col flex-grow justify-center items-center gap-4">
        <p className="text-sm text-muted-foreground">What's your energy level?</p>
        <div className="flex justify-around items-center w-full max-w-xs">
          {energyLevels.map(({ level, icon, label }) => (
            <Button
              key={level}
              variant={selectedEnergy === level ? "secondary" : "ghost"}
              className={cn(
                "flex flex-col h-20 w-20 gap-2 border",
                selectedEnergy === level && "border-primary"
              )}
              onClick={() => setSelectedEnergy(level)}
            >
              {icon}
              <span className="text-xs font-medium">{label}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
