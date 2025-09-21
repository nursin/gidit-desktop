import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Trophy, CheckCircle2 } from "lucide-react";
import { cn } from "../../lib/utils";
import { ScrollArea } from "../ui/scroll-area";
import { Badge } from "../ui/badge";

const allCompletedTasks = [
  { id: 1, title: "Finish Q3 report", completedAt: new Date(Date.now() - 86400000 * 0), tags: ["Work"] },
  { id: 2, title: "Call plumber about leak", completedAt: new Date(Date.now() - 86400000 * 1), tags: [] },
  { id: 3, title: "Plan next week's meals", completedAt: new Date(Date.now() - 86400000 * 2), tags: ["Home"] },
  { id: 4, title: "Book flights for vacation", completedAt: new Date(Date.now() - 86400000 * 3), tags: ["Travel"] },
  { id: 5, title: "Respond to non-critical emails", completedAt: new Date(Date.now() - 86400000 * 5), tags: ["Work"] },
  { id: 6, title: "Organize desktop files", completedAt: new Date(Date.now() - 86400000 * 8), tags: [] },
  { id: 7, title: "Start on new feature design", completedAt: new Date(Date.now() - 86400000 * 10), tags: ["Work"] },
];

type Filter = "today" | "week" | "all";

type DoneWallProps = {
  name?: string;
};

export function DoneWall({ name = "Wall of Completion" }: DoneWallProps) {
  const [filter, setFilter] = useState<Filter>("all");
  const streakDays = 12; // Mock streak data

  const filterTasks = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(Date.now() - 7 * 86400000);

    switch (filter) {
      case "today":
        return allCompletedTasks.filter((task) => new Date(task.completedAt) >= today);
      case "week":
        return allCompletedTasks.filter((task) => new Date(task.completedAt) >= weekAgo);
      case "all":
      default:
        return allCompletedTasks;
    }
  };

  const filteredTasks = filterTasks();

  return (
    <Card
      className={cn(
        "flex flex-col h-full relative",
        streakDays > 0 && "shadow-lg shadow-amber-500/20 border-amber-400"
      )}
    >
      {streakDays > 0 && (
        <div className="absolute -inset-1 bg-gradient-to-r from-amber-400 to-orange-500 rounded-lg blur opacity-10 animate-pulse" />
      )}
      <CardHeader className="relative">
        <div className="flex items-center gap-3">
          <Trophy className="w-6 h-6 text-primary" />
          <div>
            <CardTitle>{name}</CardTitle>
            <CardDescription>Celebrate your achievements.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col flex-grow min-h-0 relative">
        <div className="flex justify-center gap-2 mb-4">
          <Button size="sm" variant={filter === "today" ? "secondary" : "ghost"} onClick={() => setFilter("today")}>
            Today
          </Button>
          <Button size="sm" variant={filter === "week" ? "secondary" : "ghost"} onClick={() => setFilter("week")}>
            This Week
          </Button>
          <Button size="sm" variant={filter === "all" ? "secondary" : "ghost"} onClick={() => setFilter("all")}>
            All Time
          </Button>
        </div>
        <ScrollArea className="flex-grow">
          <div className="space-y-3 pr-4">
            {filteredTasks.length > 0 ? (
              filteredTasks.map((task) => (
                <div key={task.id} className="flex items-center gap-3 p-2 bg-secondary/50 rounded-md">
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <div className="flex-grow">
                    <p className="text-sm font-medium">{task.title}</p>
                    <p className="text-xs text-muted-foreground">Completed: {new Date(task.completedAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex-shrink-0">
                    {task.tags.map((tag: string) => (
                      <Badge key={tag} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground pt-8">No tasks completed in this period.</p>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

export default DoneWall;
