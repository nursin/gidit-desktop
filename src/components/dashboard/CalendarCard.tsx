import React, { useState } from "react";
import {
  DndContext,
  useDraggable,
  useDroppable,
  type DragEndEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { DayPicker, type DateFormatter } from "react-day-picker";
import { CalendarDays, GripVertical } from "lucide-react";
import { format, isSameDay } from "date-fns";
import { v4 as uuidv4 } from "uuid";

import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { cn } from "../../lib/utils";

type Task = {
  id: string;
  title: string;
  date: Date | null;
};

const initialTasks: Task[] = [
  { id: uuidv4(), title: "Finalize presentation deck", date: null },
  { id: uuidv4(), title: "Schedule dentist appointment", date: new Date() },
  { id: uuidv4(), title: "Buy groceries for the week", date: null },
  { id: uuidv4(), title: "Read one chapter of 'Atomic Habits'", date: new Date(Date.now() + 86400000 * 3) },
];

function DraggableTask({ task }: { task: Task }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: { task },
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 100,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn("bg-background/80 p-2 rounded-md shadow flex items-center gap-2 text-xs", isDragging && "opacity-50")}
      {...attributes}
      {...listeners}
    >
      <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      <span className="flex-grow truncate">{task.title}</span>
    </div>
  );
}

type CalendarCardProps = {
  name?: string;
  width?: number;
};

export function CalendarCard({ name = "Calendar", width = 2 }: CalendarCardProps) {
  const [date, setDate] = React.useState<Date | undefined>(new Date());
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const handleDragStart = (event: any) => {
    setActiveTask(event.active.data.current?.task ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);
    const { over, active } = event;
    if (!over) return;

    const droppedDate = over.data.current?.date as Date | undefined;
    if (droppedDate) {
      setTasks(prevTasks =>
        prevTasks.map(task => (task.id === active.id ? { ...task, date: droppedDate } : task))
      );
    }
  };

  const DayContent = (props: { date: Date; displayMonth: Date }) => {
    const { setNodeRef } = useDroppable({
      id: format(props.date, "yyyy-MM-dd"),
      data: { date: props.date },
    });
    const dayTasks = tasks.filter(task => task.date && isSameDay(task.date, props.date));

    return (
      <div ref={setNodeRef} className="h-full w-full flex flex-col items-start p-1 relative">
        <div className="absolute top-1 right-1">{format(props.date, "d")}</div>
        <div className="mt-6 space-y-1 w-full">
          {dayTasks.map(task => (
            <DraggableTask key={task.id} task={task} />
          ))}
        </div>
      </div>
    );
  };

  const formatDay: DateFormatter = day => format(day, "d");

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <Card className="flex flex-col h-full bg-transparent border-0 shadow-none">
        <CardHeader>
          <div className="flex items-center gap-3">
            <CalendarDays className="w-6 h-6 text-primary" />
            <CardTitle>{name}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="flex-grow flex flex-col min-h-0">
          <div className="flex-1 min-w-0">
            <DayPicker
              mode="single"
              selected={date}
              onSelect={setDate}
              numberOfMonths={1}
              formatters={{ formatDay }}
              components={{ DayContent }}
              classNames={{
                month: "space-y-4 w-full",
                table: "w-full border-collapse",
                head_row: "flex",
                head_cell: "w-full text-muted-foreground rounded-md font-normal text-[0.8rem]",
                row: "flex w-full mt-2",
                cell: "h-24 w-full text-center text-sm p-0 relative border focus-within:relative focus-within:z-20",
                day: "h-full w-full p-0 font-normal",
                day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                day_today: "bg-accent text-accent-foreground",
                day_outside: "text-muted-foreground opacity-50",
              }}
            />
          </div>
        </CardContent>
      </Card>
      <DragOverlay>{activeTask ? <DraggableTask task={activeTask} /> : null}</DragOverlay>
    </DndContext>
  );
}

export default CalendarCard;
