import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../ui/tabs";
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp } from "lucide-react";

const dailyData = {
  tasksCompleted: 5,
  focusHours: 2.5,
  tasks: [
    "Finish Q3 report",
    "Call plumber about leak",
    "Plan next week's meals",
    "Book flights for vacation",
    "Respond to non-critical emails",
  ],
};

const weeklyData = {
  totalTasks: 29,
  totalFocusHours: 18.5,
  chartData: [
    { day: "Mon", tasks: 4 },
    { day: "Tue", tasks: 6 },
    { day: "Wed", tasks: 3 },
    { day: "Thu", tasks: 8 },
    { day: "Fri", tasks: 5 },
    { day: "Sat", tasks: 2 },
    { day: "Sun", tasks: 1 },
  ],
};

const monthlyData = {
  totalTasks: 124,
  totalFocusHours: 75,
  chartData: [
    { week: "Week 1", tasks: 32 },
    { week: "Week 2", tasks: 28 },
    { week: "Week 3", tasks: 35 },
    { week: "Week 4", tasks: 29 },
  ],
};

type StatsPanelProps = {
  name?: string;
};

export function StatsPanel({ name = "Stats Panel" }: StatsPanelProps) {
  return (
    <Card className="flex flex-col h-full bg-transparent border-0 shadow-none">
      <CardHeader>
        <div className="flex items-center gap-3">
          <TrendingUp className="w-6 h-6 text-primary" />
          <div>
            <CardTitle>{name}</CardTitle>
            <CardDescription>Your productivity at a glance.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col flex-grow min-h-0">
        <Tabs defaultValue="weekly" className="flex flex-col flex-grow">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="daily">Daily</TabsTrigger>
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
          </TabsList>

          <TabsContent value="daily" className="flex-grow mt-4">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-3xl font-bold">{dailyData.tasksCompleted}</p>
                  <p className="text-xs text-muted-foreground">Tasks Completed</p>
                </div>
                <div>
                  <p className="text-3xl font-bold">{dailyData.focusHours}h</p>
                  <p className="text-xs text-muted-foreground">Focus Hours</p>
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-sm mb-2">Today's Accomplishments:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  {dailyData.tasks.map((task, i) => (
                    <li key={i}>{task}</li>
                  ))}
                </ul>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="weekly" className="flex-grow mt-4 flex flex-col">
            <div className="grid grid-cols-2 gap-4 text-center mb-4">
              <div>
                <p className="text-3xl font-bold">{weeklyData.totalTasks}</p>
                <p className="text-xs text-muted-foreground">Total Tasks</p>
              </div>
              <div>
                <p className="text-3xl font-bold">{weeklyData.totalFocusHours}h</p>
                <p className="text-xs text-muted-foreground">Total Focus</p>
              </div>
            </div>
            <div className="flex-grow h-48">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart data={weeklyData.chartData}>
                  <XAxis dataKey="day" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)",
                    }}
                  />
                  <Bar dataKey="tasks" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </RechartsBarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="monthly" className="flex-grow mt-4 flex flex-col">
            <div className="grid grid-cols-2 gap-4 text-center mb-4">
              <div>
                <p className="text-3xl font-bold">{monthlyData.totalTasks}</p>
                <p className="text-xs text-muted-foreground">Total Tasks</p>
              </div>
              <div>
                <p className="text-3xl font-bold">{monthlyData.totalFocusHours}h</p>
                <p className="text-xs text-muted-foreground">Total Focus</p>
              </div>
            </div>
            <div className="flex-grow h-48">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart data={monthlyData.chartData}>
                  <XAxis dataKey="week" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)",
                    }}
                  />
                  <Bar dataKey="tasks" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </RechartsBarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
