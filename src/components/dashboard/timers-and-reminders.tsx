import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Timer, Bell, Repeat, Plus, Trash2, Play, Pause, RotateCw } from "lucide-react";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { v4 as uuidv4 } from "uuid";
import { ScrollArea } from "../ui/scroll-area";
import { useToast } from "../../hooks/useToast";
import { format, formatDistanceToNow, addDays, addWeeks } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Progress } from "../ui/progress";

// Reminder Types
type RepeatOption = "none" | "daily" | "weekly";
type Reminder = {
  id: string;
  name: string;
  dueDateTime: Date;
  repeat: RepeatOption;
};

// Timer Types
type TimerInstance = {
  id: string;
  name: string;
  initialDuration: number; // in seconds
  timeLeft: number; // in seconds
  isRunning: boolean;
};

// Common Hooks and Components
function TimeRemaining({ dueDate }: { dueDate: Date }) {
  const [timeString, setTimeString] = useState("");
  useEffect(() => {
    const update = () => {
      const now = new Date();
      if (dueDate < now) setTimeString("Overdue");
      else setTimeString(formatDistanceToNow(dueDate, { addSuffix: true }));
    };
    update();
    const interval = setInterval(update, 1000 * 30);
    return () => clearInterval(interval);
  }, [dueDate]);
  return <span className="text-xs text-muted-foreground">{timeString}</span>;
}

function ReminderItem({
  reminder,
  onRemove,
}: {
  reminder: Reminder;
  onRemove: (id: string) => void;
}) {
  return (
    <div className="relative p-3 bg-secondary/50 rounded-lg flex items-center gap-3 border">
      <Bell className="w-5 h-5 text-primary flex-shrink-0" />
      <div className="flex-grow">
        <h4 className="font-semibold text-sm truncate">{reminder.name}</h4>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{format(reminder.dueDateTime, "MMM d, yyyy @ h:mm a")}</span> &bull;
          <TimeRemaining dueDate={reminder.dueDateTime} />
        </div>
      </div>
      {reminder.repeat !== "none" && <Repeat className="w-3 h-3 text-muted-foreground" />}
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 flex-shrink-0"
        onClick={() => onRemove(reminder.id)}
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );
}

function TimerItem({
  timer,
  onToggle,
  onReset,
  onRemove,
}: {
  timer: TimerInstance;
  onToggle: (id: string) => void;
  onReset: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  const progress =
    timer.initialDuration > 0
      ? ((timer.initialDuration - timer.timeLeft) / timer.initialDuration) * 100
      : 0;
  const formatTime = (seconds: number) => new Date(seconds * 1000).toISOString().substr(14, 5);

  return (
    <div className="p-3 bg-secondary/50 rounded-lg border">
      <div className="flex justify-between items-center">
        <h4 className="font-semibold text-sm">{timer.name}</h4>
        <p className="font-mono text-lg">{formatTime(timer.timeLeft)}</p>
      </div>
      <Progress value={progress} className="my-2" />
      <div className="flex items-center gap-2">
        <Button size="sm" onClick={() => onToggle(timer.id)} className="w-20">
          {timer.isRunning ? (
            <>
              <Pause className="w-4 h-4 mr-2" /> Pause
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-2" /> Start
            </>
          )}
        </Button>
        <Button size="sm" variant="outline" onClick={() => onReset(timer.id)}>
          <RotateCw className="w-4 h-4 mr-2" /> Reset
        </Button>
        <Button size="icon" variant="ghost" onClick={() => onRemove(timer.id)} className="ml-auto">
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

export function TimersAndReminders({ name = "Timers & Reminders" }: { name?: string }) {
  // State for Reminders
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [newName, setNewName] = useState("");
  const [newDate, setNewDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [newTime, setNewTime] = useState(format(new Date(), "HH:mm"));
  const [newRepeat, setNewRepeat] = useState<RepeatOption>("none");

  // State for Timers
  const [timers, setTimers] = useState<TimerInstance[]>([]);

  const { toast } = useToast();

  // Reminder Logic
  const handleAddReminder = () => {
    if (!newName.trim() || !newDate || !newTime) {
      toast({
        title: "Missing Information",
        description: "Please provide a name, date, and time.",
        variant: "destructive",
      });
      return;
    }
    const dueDateTime = new Date(`${newDate}T${newTime}`);
    if (isNaN(dueDateTime.getTime())) {
      toast({ title: "Invalid Date/Time", variant: "destructive" });
      return;
    }
    const newReminder: Reminder = { id: uuidv4(), name: newName, dueDateTime, repeat: newRepeat };
    setReminders((prev) =>
      [...prev, newReminder].sort((a, b) => a.dueDateTime.getTime() - b.dueDateTime.getTime())
    );
    setNewName("");
    toast({ title: "Reminder Set!", description: `"${newName}" scheduled.` });
  };
  const handleRemoveReminder = (id: string) => setReminders((prev) => prev.filter((r) => r.id !== id));
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      let hasUpdates = false;
      const updatedReminders = reminders
        .map((r) => {
          if (r.repeat !== "none" && r.dueDateTime < now) {
            hasUpdates = true;
            let nextDueDate = r.dueDateTime;
            while (nextDueDate < now) {
              if (r.repeat === "daily") nextDueDate = addDays(nextDueDate, 1);
              else if (r.repeat === "weekly") nextDueDate = addWeeks(nextDueDate, 1);
            }
            return { ...r, dueDateTime: nextDueDate };
          }
          return r;
        })
        .sort((a, b) => a.dueDateTime.getTime() - b.dueDateTime.getTime());

      if (hasUpdates) setReminders(updatedReminders);
    }, 1000 * 60);
    return () => clearInterval(interval);
  }, [reminders]);

  // Timer Logic
  const handleAddTimer = (duration: number, name: string) => {
    const newTimer: TimerInstance = {
      id: uuidv4(),
      name,
      initialDuration: duration,
      timeLeft: duration,
      isRunning: false,
    };
    setTimers((prev) => [...prev, newTimer]);
  };
  const handleToggleTimer = (id: string) =>
    setTimers((prev) => prev.map((t) => (t.id === id ? { ...t, isRunning: !t.isRunning } : t)));
  const handleResetTimer = (id: string) =>
    setTimers((prev) => prev.map((t) => (t.id === id ? { ...t, timeLeft: t.initialDuration, isRunning: false } : t)));
  const handleRemoveTimer = (id: string) => setTimers((prev) => prev.filter((t) => t.id !== id));
  useEffect(() => {
    const interval = setInterval(() => {
      setTimers((prev) =>
        prev.map((t) => {
          if (t.isRunning && t.timeLeft > 0) return { ...t, timeLeft: t.timeLeft - 1 };
          if (t.isRunning && t.timeLeft <= 0) {
            toast({ title: "Timer Finished!", description: `Your timer "${t.name}" is done.` });
            return { ...t, isRunning: false };
          }
          return t;
        })
      );
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="flex flex-col h-full bg-transparent border-0 shadow-none">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <Timer className="w-6 h-6 text-primary" />
          <div>
            <CardTitle>{name}</CardTitle>
            <CardDescription>Set countdowns and scheduled reminders.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col flex-grow gap-4 min-h-0">
        <Tabs defaultValue="timers" className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="timers">Timers</TabsTrigger>
            <TabsTrigger value="reminders">Reminders</TabsTrigger>
          </TabsList>
          <TabsContent value="timers" className="flex-1 flex flex-col gap-4 pt-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <Button variant="outline" onClick={() => handleAddTimer(5 * 60, "5 Min Timer")}>
                5 min
              </Button>
              <Button variant="outline" onClick={() => handleAddTimer(15 * 60, "15 Min Timer")}>
                15 min
              </Button>
              <Button variant="outline" onClick={() => handleAddTimer(25 * 60, "25 Min Timer")}>
                25 min
              </Button>
              <Button variant="outline" onClick={() => handleAddTimer(60 * 60, "1 Hour Timer")}>
                60 min
              </Button>
            </div>
            <ScrollArea className="w-full flex-grow">
              <div className="space-y-3 pr-4">
                {timers.length > 0 ? (
                  timers.map((timer) => (
                    <TimerItem
                      key={timer.id}
                      timer={timer}
                      onToggle={handleToggleTimer}
                      onReset={handleResetTimer}
                      onRemove={handleRemoveTimer}
                    />
                  ))
                ) : (
                  <div className="text-center text-muted-foreground pt-12">
                    <p>No active timers.</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
          <TabsContent value="reminders" className="flex-1 flex flex-col gap-4 pt-4">
            <div className="p-4 border rounded-lg bg-background/50 space-y-3">
              <Input placeholder="Reminder name..." value={newName} onChange={(e) => setNewName(e.target.value)} />
              <div className="grid grid-cols-2 gap-3">
                <Input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} />
                <Input type="time" value={newTime} onChange={(e) => setNewTime(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3 items-center">
                <Select value={newRepeat} onValueChange={(v: RepeatOption) => setNewRepeat(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Repeat" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Does not repeat</SelectItem>
                    <SelectItem value="daily">Repeats Daily</SelectItem>
                    <SelectItem value="weekly">Repeats Weekly</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleAddReminder}>
                  <Plus className="w-4 h-4 mr-2" /> Add Reminder
                </Button>
              </div>
            </div>
            <ScrollArea className="w-full flex-grow">
              <div className="space-y-3 pr-4">
                {reminders.length > 0 ? (
                  reminders.map((r) => <ReminderItem key={r.id} reminder={r} onRemove={handleRemoveReminder} />)
                ) : (
                  <div className="text-center text-muted-foreground pt-12">
                    <p>No reminders set.</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
