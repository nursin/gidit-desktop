import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Smile, Frown, Meh, Laugh, Angry, BarChart2 } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type MoodTrackerProps = {
  name?: string;
};

/**
 * Small local `cn` helper to avoid relying on project path aliases.
 * If you already have a shared utility (e.g. src/lib/utils.ts with `cn`),
 * replace this with an import from that file.
 */
const cn = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(" ");

const moodData = [
  { day: "Mon", mood: 4 },
  { day: "Tue", mood: 5 },
  { day: "Wed", mood: 3 },
  { day: "Thu", mood: 5 },
  { day: "Fri", mood: 4 },
  { day: "Sat", mood: 2 },
  { day: "Sun", mood: 3 },
];

const moods = [
  { level: 1, icon: <Angry className="w-8 h-8" />, label: "Awful" },
  { level: 2, icon: <Frown className="w-8 h-8" />, label: "Bad" },
  { level: 3, icon: <Meh className="w-8 h-8" />, label: "Okay" },
  { level: 4, icon: <Smile className="w-8 h-8" />, label: "Good" },
  { level: 5, icon: <Laugh className="w-8 h-8" />, label: "Great" },
];

export function MoodTracker({ name = "Mood Tracker" }: MoodTrackerProps) {
  const [selectedMood, setSelectedMood] = useState<number | null>(null);

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <div className="flex items-center gap-3">
          <BarChart2 className="w-6 h-6 text-primary" />
          <div>
            <CardTitle>{name}</CardTitle>
            <CardDescription>Log and visualize your daily mood.</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col flex-grow gap-4">
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={moodData}>
              <XAxis
                dataKey="day"
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                domain={[0, 5]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                }}
              />
              <Bar dataKey="mood" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="flex justify-around items-end pt-4">
          {moods.map((mood) => (
            <button
              key={mood.level}
              onClick={() => setSelectedMood(mood.level)}
              className="text-center text-muted-foreground hover:text-primary transition-colors focus:outline-none focus:text-primary"
            >
              <div
                className={cn(
                  "p-2 rounded-full transition-colors",
                  selectedMood === mood.level ? "text-primary bg-primary/10" : ""
                )}
              >
                {mood.icon}
              </div>
              <span className="text-xs font-medium">{mood.label}</span>
            </button>
          ))}
        </div>

        <Button disabled={!selectedMood}>Log Today's Mood</Button>
      </CardContent>
    </Card>
  );
}

export default MoodTracker;
