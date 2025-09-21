import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Gift, Dices, Zap } from "lucide-react";

const tasks = [
  "Organize your desktop files",
  "Reply to 3 old emails",
  "Stretch for 5 minutes",
  "Plan your meals for tomorrow",
  "Tidy up your workspace",
  "Read one article related to your field",
  "Do a 10-minute brain dump",
  "Unsubscribe from 5 newsletters",
  "Watch a 15-minute TED talk",
];

type MysteryTaskPickerProps = {
  name?: string;
};

export function MysteryTaskPicker({ name = "Mystery Task Picker" }: MysteryTaskPickerProps) {
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [isRevealing, setIsRevealing] = useState(false);

  const handleDrawTask = () => {
    setIsRevealing(true);
    setSelectedTask(null);
    setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * tasks.length);
      setSelectedTask(tasks[randomIndex]);
      setIsRevealing(false);
    }, 1000); // Animation duration
  };

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Gift className="w-6 h-6 text-primary" />
          <div>
            <CardTitle>{name}</CardTitle>
            <CardDescription>Get a random task to tackle now.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col flex-grow justify-center items-center gap-4 text-center">
        <div className="relative w-40 h-24 flex items-center justify-center">
          {isRevealing && (
            <div className="absolute animate-bounce">
              <Dices className="w-12 h-12 text-primary" />
            </div>
          )}
          {selectedTask && !isRevealing && (
            <div className="p-4 bg-secondary rounded-lg animate-in fade-in-50">
              <p className="font-semibold">{selectedTask}</p>
            </div>
          )}
          {!selectedTask && !isRevealing && (
            <p className="text-muted-foreground">Click the button to draw a task!</p>
          )}
        </div>
        <Button onClick={handleDrawTask} disabled={isRevealing}>
          {isRevealing ? (
            "Drawing..."
          ) : (
            <>
              <Zap className="w-4 h-4 mr-2" /> Draw a Task
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
