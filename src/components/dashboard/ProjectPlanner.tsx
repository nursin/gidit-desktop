import React, { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Progress } from "../ui/progress";
import { Checkbox } from "../ui/checkbox";
import { Textarea } from "../ui/textarea";
import { ScrollArea } from "../ui/scroll-area";
import { CaseUpper, Plus, Trash2, Flag, Target } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { addDays, differenceInDays, startOfDay } from "date-fns";
import { v4 as uuidv4 } from "uuid";
import { cn } from "../../lib/utils";

type Task = {
  id: string;
  name: string;
  startDate: Date;
  duration: number; // in days
  completed: boolean;
};

type Goal = {
  id: string;
  text: string;
};

// Mock Data
const today = startOfDay(new Date());
const initialTasks: Task[] = [
  { id: uuidv4(), name: "Project Kick-off & Planning", startDate: today, duration: 3, completed: true },
  { id: uuidv4(), name: "UI/UX Design Mockups", startDate: addDays(today, 2), duration: 5, completed: false },
  { id: uuidv4(), name: "Frontend Development", startDate: addDays(today, 6), duration: 10, completed: false },
  { id: uuidv4(), name: "Backend API Integration", startDate: addDays(today, 10), duration: 8, completed: false },
  { id: uuidv4(), name: "User Testing & Feedback", startDate: addDays(today, 18), duration: 4, completed: false },
  { id: uuidv4(), name: "Deployment", startDate: addDays(today, 22), duration: 2, completed: false },
];

const initialGoals: Goal[] = [
  { id: uuidv4(), text: "Launch MVP by the end of the quarter." },
  { id: uuidv4(), text: "Achieve 90% user satisfaction in beta testing." },
];

export function ProjectPlanner({ name = "Project Planner" }: { name?: string }) {
  const [projectName, setProjectName] = useState("New Website Launch");
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [goals] = useState<Goal[]>(initialGoals);
  const [newTaskName, setNewTaskName] = useState("");

  const chartData = useMemo(() => {
    return tasks.map(task => ({
      name: task.name,
      range: [
        differenceInDays(task.startDate, today),
        differenceInDays(task.startDate, today) + task.duration
      ],
      fill: task.completed ? "hsl(var(--primary) / 0.5)" : "hsl(var(--primary))",
    }));
  }, [tasks]);
  
  const completedTasks = useMemo(() => tasks.filter(t => t.completed).length, [tasks]);
  const progress = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0;

  const handleAddTask = () => {
    if (newTaskName.trim() === "") return;
    const lastTask = tasks[tasks.length - 1];
    const newStartDate = lastTask ? addDays(lastTask.startDate, lastTask.duration) : today;
    const newTask: Task = {
      id: uuidv4(),
      name: newTaskName,
      startDate: newStartDate,
      duration: 3,
      completed: false,
    };
    setTasks([...tasks, newTask]);
    setNewTaskName("");
  };
  
  const handleToggleTask = (id: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };
  
  const handleRemoveTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  return (
    <Card className="flex flex-col h-full bg-transparent border-0 shadow-none">
      <CardHeader>
        <div className="flex items-center gap-3">
          <CaseUpper className="w-6 h-6 text-primary" />
          <div>
            <Input 
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="text-2xl font-semibold leading-none tracking-tight border-none focus-visible:ring-0 p-0 h-auto"
            />
            <CardDescription>Track your project from start to finish.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4 min-h-0">
        {/* Progress Bar */}
        <div>
            <div className="flex justify-between items-baseline mb-1">
                <h4 className="text-sm font-semibold">Overall Progress</h4>
                <p className="text-sm text-muted-foreground">{completedTasks} / {tasks.length} tasks</p>
            </div>
            <Progress value={progress} />
        </div>
        {/* Gantt Chart */}
        <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
            <BarChart layout="vertical" data={chartData} margin={{ top: 5, right: 20, left: 120, bottom: 5 }}>
                <XAxis type="number" domain={[0, 30]} tickFormatter={(val) => `Day ${val}`} />
                <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12 }} />
                <Tooltip 
                    contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: 'var(--radius)',
                    }}
                    labelFormatter={(label) => String(label)}
                    formatter={(value: any) => [`Duration: ${value[1] - value[0]} days`, ""]}
                />
                <ReferenceLine x={0} stroke="hsl(var(--destructive))" strokeDasharray="3 3" />
                <Bar dataKey="range" />
            </BarChart>
            </ResponsiveContainer>
        </div>
        
        {/* Goals & Tasks */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 min-h-0">
            {/* Goals */}
            <div className="flex flex-col gap-2">
                <h4 className="font-semibold flex items-center gap-2"><Target className="w-4 h-4"/> Goals</h4>
                <div className="p-3 bg-background/50 rounded-lg flex-1">
                    <ul className="space-y-2 text-sm">
                        {goals.map(goal => (
                            <li key={goal.id} className="flex items-start gap-2">
                                <Flag className="w-4 h-4 mt-0.5 text-primary flex-shrink-0"/>
                                <span>{goal.text}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
            {/* Tasks */}
            <div className="flex flex-col gap-2 min-h-0">
                <h4 className="font-semibold">Tasks</h4>
                 <div className="flex gap-2">
                    <Input 
                        placeholder="Add a new task..."
                        value={newTaskName}
                        onChange={(e) => setNewTaskName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                    />
                    <Button onClick={handleAddTask} size="icon"><Plus className="w-4 h-4"/></Button>
                </div>
                <ScrollArea className="flex-1 -mx-3">
                   <div className="space-y-2 px-3">
                     {tasks.map(task => (
                        <div key={task.id} className="flex items-center gap-3 p-2 bg-background/50 rounded-md">
                            <Checkbox checked={task.completed} onCheckedChange={() => handleToggleTask(task.id)} />
                            <label className={cn("flex-1 text-sm", task.completed && "line-through text-muted-foreground")}>
                                {task.name}
                            </label>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleRemoveTask(task.id)}>
                                <Trash2 className="w-3 h-3 text-muted-foreground"/>
                            </Button>
                        </div>
                     ))}
                   </div>
                </ScrollArea>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
