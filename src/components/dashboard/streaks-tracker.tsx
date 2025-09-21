import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Flame } from "lucide-react";

type StreaksTrackerProps = {
  name?: string;
  count?: number;
  unit?: string;
};

export const StreaksTracker: React.FC<StreaksTrackerProps> = ({
  name = "Daily Streak",
  count = 12,
  unit = "days",
}) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Flame className="w-6 h-6 text-primary" />
          <div>
            <CardTitle>{name}</CardTitle>
            <CardDescription>Keep the fire alive!</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex items-center justify-center gap-4">
        <Flame className="w-16 h-16 text-orange-500" />
        <div className="text-center">
          <p className="text-6xl font-bold text-primary">{count}</p>
          <p className="text-muted-foreground">{unit}</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default StreaksTracker;
