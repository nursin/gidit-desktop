import CalendarHeatmap from "react-calendar-heatmap";
import "react-calendar-heatmap/dist/styles.css";
import { Tooltip as ReactTooltip } from "react-tooltip";
import { Activity } from "lucide-react";
import { subDays, format } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";

type HeatmapValue = {
  date: string;
  count: number;
};

const generateHeatmapData = (days: number): HeatmapValue[] => {
  const today = new Date();
  return Array.from({ length: days }, (_, i) => {
    const date = subDays(today, days - i - 1);
    return {
      date: format(date, "yyyy-MM-dd"),
      count: Math.floor(Math.random() * 5), // Random activity count from 0 to 4
    };
  });
};

type ActivityHeatmapProps = {
  name?: string;
};

export function ActivityHeatmap({ name = "Activity Heatmap" }: ActivityHeatmapProps) {
  const data = generateHeatmapData(120); // Last 4 months

  return (
    <Card className="flex flex-col h-full bg-transparent border-0 shadow-none">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Activity className="w-6 h-6 text-primary" />
          <div>
            <CardTitle>{name}</CardTitle>
            <CardDescription>Your productivity patterns at a glance.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col flex-grow justify-center items-center">
        <div className="w-full">
          <CalendarHeatmap
            startDate={subDays(new Date(), 119)}
            endDate={new Date()}
            values={data}
            classForValue={(value) => {
              if (!value) {
                return "color-empty";
              }
              return `color-scale-${value.count}`;
            }}
            tooltipDataAttrs={(value: HeatmapValue | null) => {
              if (!value || !value.date) return null;
              return {
                "data-tooltip-id": "heatmap-tooltip",
                "data-tooltip-content": `${value.date}: ${value.count} activities`,
              } as any;
            }}
          />
          <ReactTooltip id="heatmap-tooltip" />
        </div>
        <div className="flex items-center gap-2 text-xs mt-4">
          <span>Less</span>
          <div className="w-4 h-4 rounded-sm bg-primary/20" />
          <div className="w-4 h-4 rounded-sm bg-primary/40" />
          <div className="w-4 h-4 rounded-sm bg-primary/60" />
          <div className="w-4 h-4 rounded-sm bg-primary/80" />
          <div className="w-4 h-4 rounded-sm bg-primary" />
          <span>More</span>
        </div>
      </CardContent>
    </Card>
  );
}
