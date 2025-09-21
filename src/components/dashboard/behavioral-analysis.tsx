import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Activity } from "lucide-react";

const weeklyFocusData = [
  { day: "Mon", hours: 2.5 },
  { day: "Tue", hours: 3 },
  { day: "Wed", hours: 1.5 },
  { day: "Thu", hours: 4 },
  { day: "Fri", hours: 3.5 },
  { day: "Sat", hours: 1 },
  { day: "Sun", hours: 0.5 },
];

const taskCategoryData = [
  { name: "Work", value: 400 },
  { name: "Personal", value: 300 },
  { name: "Home", value: 200 },
  { name: "Learning", value: 100 },
];

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
];

type BehavioralAnalysisProps = {
  name?: string;
};

export function BehavioralAnalysis({
  name = "Behavioral Analysis",
}: BehavioralAnalysisProps) {
  return (
    <Card className="flex flex-col h-full bg-transparent border-0 shadow-none">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Activity className="w-6 h-6 text-primary" />
          <div>
            <CardTitle>{name}</CardTitle>
            <CardDescription>
              Insights into your productivity patterns.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-grow">
        <div className="flex flex-col gap-4">
          <h4 className="text-sm font-semibold text-center">
            Weekly Focus Sessions
          </h4>
          <div className="flex-grow h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyFocusData}>
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
                  unit="h"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)",
                  }}
                />
                <Bar
                  dataKey="hours"
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <h4 className="text-sm font-semibold text-center">Task Distribution</h4>
          <div className="flex-grow h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={taskCategoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {taskCategoryData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default BehavioralAnalysis;
