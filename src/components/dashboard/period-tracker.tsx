import { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { DayPicker, Matcher } from "react-day-picker";
import { addDays, differenceInDays, format } from "date-fns";
import { Droplet } from "lucide-react";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Input } from "../ui/input";

type PeriodTrackerProps = {
  name?: string;
};

export function PeriodTracker({ name = "Period Tracker" }: PeriodTrackerProps) {
  const [periodLog, setPeriodLog] = useState<Date[]>([new Date()]);
  const [cycleLength, setCycleLength] = useState(28);
  const [periodLength, setPeriodLength] = useState(5);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const lastPeriodStart = useMemo(() => {
    return periodLog.sort((a, b) => b.getTime() - a.getTime())[0];
  }, [periodLog]);

  const cycleData = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const cycleDay = differenceInDays(today, lastPeriodStart) % cycleLength + 1;
    const nextPeriodStart = addDays(lastPeriodStart, cycleLength);
    const daysUntilNextPeriod = differenceInDays(nextPeriodStart, today);

    const menstruationDays: Matcher = (date) => {
      for (const start of periodLog) {
        const diff = differenceInDays(date, start);
        if (diff >= 0 && diff < periodLength) {
          return true;
        }
      }
      return false;
    };

    const ovulationDay: Matcher = {
      from: addDays(lastPeriodStart, 13),
      to: addDays(lastPeriodStart, 14),
    };

    const fertileWindow: Matcher = {
      from: addDays(lastPeriodStart, 11),
      to: addDays(lastPeriodStart, 15),
    };

    return {
      cycleDay,
      nextPeriodStart,
      daysUntilNextPeriod,
      modifiers: {
        menstruation: menstruationDays,
        fertile: fertileWindow,
        ovulation: ovulationDay,
      },
      modifiersStyles: {
        menstruation: {
          backgroundColor: "hsl(var(--primary) / 0.2)",
          color: "hsl(var(--primary))",
        },
        fertile: {
          backgroundColor: "hsl(var(--accent) / 0.3)",
        },
        ovulation: {
          backgroundColor: "hsl(var(--accent))",
          color: "hsl(var(--accent-foreground))",
        },
      },
    };
  }, [lastPeriodStart, cycleLength, periodLength, periodLog]);

  const handleLogPeriod = () => {
    const newLog = [...periodLog, new Date()];
    newLog.sort((a, b) => b.getTime() - a.getTime());
    setPeriodLog(newLog);
  };

  return (
    <Card className="flex flex-col h-full bg-transparent border-0 shadow-none">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Droplet className="w-6 h-6 text-primary" />
          <div>
            <CardTitle>{name}</CardTitle>
            <CardDescription>
              Track your menstrual cycle and predictions.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <DayPicker
            mode="single"
            month={currentMonth}
            onMonthChange={setCurrentMonth}
            modifiers={cycleData.modifiers}
            modifiersStyles={cycleData.modifiersStyles}
            className="w-full"
            classNames={{
              day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 rounded-full",
              day_selected:
                "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
              day_today: "bg-accent text-accent-foreground rounded-full",
            }}
          />
        </div>
        <div className="lg:col-span-1 space-y-4">
          <div className="p-4 bg-background/50 rounded-lg text-center">
            <p className="text-sm text-muted-foreground">Cycle Day</p>
            <p className="text-4xl font-bold">{cycleData.cycleDay}</p>
          </div>
          <div className="p-4 bg-background/50 rounded-lg">
            <h4 className="font-semibold text-sm mb-2">Cycle Insights</h4>
            <ul className="space-y-1 text-xs">
              <li>
                Next period starts in{" "}
                <span className="font-bold">{cycleData.daysUntilNextPeriod}</span>{" "}
                days.
              </li>
              <li>
                Estimated Next Period:{" "}
                <span className="font-bold">
                  {format(cycleData.nextPeriodStart, "MMM d")}
                </span>
              </li>
            </ul>
          </div>
          <div className="p-4 bg-background/50 rounded-lg space-y-3">
            <h4 className="font-semibold text-sm">Settings</h4>
            <div className="space-y-1">
              <Label htmlFor="cycleLength" className="text-xs">
                Avg. Cycle Length
              </Label>
              <Input
                id="cycleLength"
                type="number"
                value={cycleLength}
                onChange={(e) => setCycleLength(Number(e.target.value))}
                className="h-8"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="periodLength" className="text-xs">
                Avg. Period Length
              </Label>
              <Input
                id="periodLength"
                type="number"
                value={periodLength}
                onChange={(e) => setPeriodLength(Number(e.target.value))}
                className="h-8"
              />
            </div>
          </div>
          <Button className="w-full" onClick={handleLogPeriod}>
            Log Today as Period Start
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
