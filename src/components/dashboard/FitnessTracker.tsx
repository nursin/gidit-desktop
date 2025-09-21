import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { ScrollArea } from "../ui/scroll-area";
import { Dumbbell, Plus, Trash2, BarChart, History, Check } from "lucide-react";
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";
import { format } from "date-fns";
import { v4 as uuidv4 } from "uuid";

type Exercise = {
  id: string;
  name: string;
  sets: number;
  reps: number;
  weight: number;
};

type Workout = {
  id: string;
  date: Date;
  name: string;
  exercises: Exercise[];
};

const initialWorkouts: Workout[] = [
  {
    id: uuidv4(),
    date: new Date(Date.now() - 86400000 * 2),
    name: "Push Day",
    exercises: [
      { id: uuidv4(), name: "Bench Press", sets: 3, reps: 8, weight: 135 },
      { id: uuidv4(), name: "Overhead Press", sets: 3, reps: 10, weight: 75 },
    ],
  },
  {
    id: uuidv4(),
    date: new Date(Date.now() - 86400000 * 4),
    name: "Pull Day",
    exercises: [
      { id: uuidv4(), name: "Deadlift", sets: 1, reps: 5, weight: 225 },
      { id: uuidv4(), name: "Pull Ups", sets: 3, reps: 8, weight: 0 },
    ],
  },
];

export function FitnessTracker({ name = "Fitness Tracker" }: { name?: string }) {
  const [workouts, setWorkouts] = useState<Workout[]>(initialWorkouts);
  const [currentWorkout, setCurrentWorkout] = useState<Exercise[]>([]);
  const [workoutName, setWorkoutName] = useState("Today's Workout");
  const [activeTab, setActiveTab] = useState<"log" | "history" | "stats">("log");

  const addExercise = () => {
    const newExercise: Exercise = {
      id: uuidv4(),
      name: "New Exercise",
      sets: 3,
      reps: 10,
      weight: 0,
    };
    setCurrentWorkout([...currentWorkout, newExercise]);
  };

  const updateExercise = (
    id: string,
    field: keyof Exercise,
    value: string | number
  ) => {
    setCurrentWorkout(
      currentWorkout.map((ex) => (ex.id === id ? { ...ex, [field]: value } : ex))
    );
  };

  const removeExercise = (id: string) => {
    setCurrentWorkout(currentWorkout.filter((ex) => ex.id !== id));
  };

  const finishWorkout = () => {
    if (currentWorkout.length === 0) return;
    const newWorkout: Workout = {
      id: uuidv4(),
      date: new Date(),
      name: workoutName,
      exercises: currentWorkout,
    };
    setWorkouts([newWorkout, ...workouts]);
    setCurrentWorkout([]);
    setWorkoutName("Today's Workout");
    setActiveTab("history");
  };

  const totalVolumeData = workouts
    .map((w) => ({
      date: format(w.date, "MMM d"),
      volume: w.exercises.reduce((acc, ex) => acc + ex.sets * ex.reps * ex.weight, 0),
    }))
    .reverse();

  return (
    <Card className="flex flex-col h-full bg-transparent border-0 shadow-none">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Dumbbell className="w-6 h-6 text-primary" />
          <div>
            <CardTitle>{name}</CardTitle>
            <CardDescription>Log workouts and track your progress.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col min-h-0">
        <div className="flex flex-col flex-1">
          {/* Tabs (simple local implementation) */}
          <div className="grid w-full grid-cols-3">
            <button
              className={`py-2 ${activeTab === "log" ? "font-semibold" : "text-muted-foreground"}`}
              onClick={() => setActiveTab("log")}
            >
              Log Workout
            </button>
            <button
              className={`py-2 flex items-center justify-center ${activeTab === "history" ? "font-semibold" : "text-muted-foreground"}`}
              onClick={() => setActiveTab("history")}
            >
              <History className="w-4 h-4 mr-2" />
              History
            </button>
            <button
              className={`py-2 flex items-center justify-center ${activeTab === "stats" ? "font-semibold" : "text-muted-foreground"}`}
              onClick={() => setActiveTab("stats")}
            >
              <BarChart className="w-4 h-4 mr-2" />
              Stats
            </button>
          </div>

          {activeTab === "log" && (
            <div className="flex-1 flex flex-col gap-4 pt-4">
              <div className="flex items-center gap-4">
                <Input
                  value={workoutName}
                  onChange={(e) => setWorkoutName(e.target.value)}
                  placeholder="Workout Name (e.g., Push Day)"
                />
                <Button onClick={addExercise}>
                  <Plus className="w-4 h-4 mr-2" />
                  Exercise
                </Button>
              </div>
              <ScrollArea className="flex-1 pr-4 -mr-4">
                <div className="space-y-4">
                  {currentWorkout.map((ex) => (
                    <div
                      key={ex.id}
                      className="p-3 bg-background/50 rounded-lg grid grid-cols-12 gap-2 items-center"
                    >
                      <Input
                        value={ex.name}
                        onChange={(e) => updateExercise(ex.id, "name", e.target.value)}
                        className="col-span-4 h-8"
                      />
                      <div className="col-span-2 space-y-1">
                        <Label className="text-xs text-muted-foreground">Sets</Label>
                        <Input
                          type="number"
                          value={ex.sets}
                          onChange={(e) => updateExercise(ex.id, "sets", Number(e.target.value))}
                          className="h-8"
                        />
                      </div>
                      <div className="col-span-2 space-y-1">
                        <Label className="text-xs text-muted-foreground">Reps</Label>
                        <Input
                          type="number"
                          value={ex.reps}
                          onChange={(e) => updateExercise(ex.id, "reps", Number(e.target.value))}
                          className="h-8"
                        />
                      </div>
                      <div className="col-span-3 space-y-1">
                        <Label className="text-xs text-muted-foreground">Weight (lbs)</Label>
                        <Input
                          type="number"
                          value={ex.weight}
                          onChange={(e) =>
                            updateExercise(ex.id, "weight", Number(e.target.value))
                          }
                          className="h-8"
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 col-span-1"
                        onClick={() => removeExercise(ex.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <Button onClick={finishWorkout} disabled={currentWorkout.length === 0}>
                <Check className="w-4 h-4 mr-2" />
                Finish Workout
              </Button>
            </div>
          )}

          {activeTab === "history" && (
            <div className="flex-1 pt-4">
              <ScrollArea className="h-full pr-4 -mr-4">
                <div className="space-y-4">
                  {workouts.map((w) => (
                    <div key={w.id} className="p-4 bg-background/50 rounded-lg border">
                      <div className="flex justify-between items-baseline mb-2">
                        <h4 className="font-semibold">{w.name}</h4>
                        <p className="text-xs text-muted-foreground">{format(w.date, "EEEE, MMM d")}</p>
                      </div>
                      <ul className="space-y-1 text-sm">
                        {w.exercises.map((ex) => (
                          <li key={ex.id} className="flex justify-between">
                            <span>{ex.name}</span>
                            <span className="text-muted-foreground">
                              {ex.sets}x{ex.reps} @ {ex.weight} lbs
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {activeTab === "stats" && (
            <div className="flex-1 flex flex-col gap-4 pt-4">
              <h4 className="font-semibold text-center">Total Volume Over Time</h4>
              <div className="flex-grow h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={totalVolumeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="volume"
                      stroke="currentColor"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
