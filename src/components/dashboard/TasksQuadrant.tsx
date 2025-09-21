import React, { useState } from "react";
import {
  DndContext,
  useDraggable,
  useDroppable,
  closestCorners,
  type DragEndEvent,
  type DragStartEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Badge } from "../ui/badge";
import { ListTodo, GripVertical, Briefcase, Calendar } from "lucide-react";

/**
 * Small classname helper to avoid pulling in external utils.
 * In the app you can replace this with your shared `cn` util.
 */
const cn = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(" ");

type QuadrantId = "q1" | "q2" | "q3" | "q4";

type Task = {
  id: string;
  label: string;
  quadrantId: QuadrantId;
  tags: { name: string; icon: React.ReactNode }[];
};

const initialTasks: Task[] = [
  // Urgent & Important
  {
    id: "t1",
    quadrantId: "q1",
    label: "Finish Q3 report",
    tags: [{ name: "Work", icon: <Briefcase className="w-3 h-3" /> }],
  },
  { id: "t2", quadrantId: "q1", label: "Call plumber about leak", tags: [] },
  // Not Urgent & Important
  { id: "t3", quadrantId: "q2", label: "Plan next week's meals", tags: [] },
  {
    id: "t4",
    quadrantId: "q2",
    label: "Book flights for vacation",
    tags: [{ name: "Travel", icon: <Calendar className="w-3 h-3" /> }],
  },
  {
    id: "t5",
    quadrantId: "q2",
    label: "Start on new feature design",
    tags: [{ name: "Work", icon: <Briefcase className="w-3 h-3" /> }],
  },
  // Urgent & Not Important
  {
    id: "t6",
    quadrantId: "q3",
    label: "Respond to non-critical emails",
    tags: [{ name: "Work", icon: <Briefcase className="w-3 h-3" /> }],
  },
  // Not Urgent & Not Important
  { id: "t7", quadrantId: "q4", label: "Organize desktop files", tags: [] },
];

const quadrantConfig: Record<QuadrantId, { color: string }> = {
  q1: { color: "bg-red-500/10" },
  q2: { color: "bg-blue-500/10" },
  q3: { color: "bg-yellow-500/10" },
  q4: { color: "bg-gray-500/10" },
};

function DraggableTask({ task }: { task: Task }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
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
      className={cn(
        "bg-background/80 p-2 rounded-md shadow flex items-center gap-2 text-sm",
        isDragging && "opacity-50"
      )}
      {...attributes}
      {...listeners}
    >
      <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      <span className="flex-grow truncate">{task.label}</span>
      {task.tags.map((tag) => (
        <Badge
          key={tag.name}
          variant="secondary"
          className="flex items-center gap-1 text-xs"
        >
          {tag.icon} {tag.name}
        </Badge>
      ))}
    </div>
  );
}

function Quadrant({ quadrantId, tasks }: { quadrantId: QuadrantId; tasks: Task[] }) {
  const { setNodeRef } = useDroppable({ id: quadrantId });
  return (
    <div
      ref={setNodeRef}
      className={cn("p-4 rounded-lg min-h-[150px] space-y-3", quadrantConfig[quadrantId].color)}
    >
      {tasks.map((task) => (
        <DraggableTask key={task.id} task={task} />
      ))}
    </div>
  );
}

type TasksQuadrantProps = {
  name?: string;
};

export function TasksQuadrant({ name = "Task Quadrants" }: TasksQuadrantProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const handleDragStart = (event: DragStartEvent) => {
    // active.data.current.task is set in useDraggable's data
    const maybeTask = (event.active?.data as any)?.current?.task;
    setActiveTask(maybeTask ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    // If dropped onto a different droppable (quadrant)
    if (active.id !== over.id) {
      setTasks((prev) => {
        const activeId = String(active.id);
        const overId = String(over.id) as QuadrantId;

        // If task not found, return as-is
        const existing = prev.find((t) => t.id === activeId);
        if (!existing) return prev;

        // If quadrant unchanged, no-op
        if (existing.quadrantId === overId) return prev;

        // Return new array with updated quadrantId for the dragged task
        return prev.map((t) => (t.id === activeId ? { ...t, quadrantId: overId } : t));
      });
    }
  };

  return (
    <Card className="h-full flex flex-col bg-transparent border-0 shadow-none">
      <CardHeader>
        <div className="flex items-center gap-3">
          <ListTodo className="w-6 h-6 text-primary" />
          <div>
            <CardTitle>{name}</CardTitle>
            <CardDescription>Prioritize what truly matters by dragging tasks.</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 min-h-0">
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          collisionDetection={closestCorners}
        >
          <div className="grid grid-cols-[auto,1fr,1fr] grid-rows-[auto,1fr,1fr] gap-4 h-full">
            {/* Top Labels */}
            <div />
            <div className="font-bold text-center text-sm text-muted-foreground flex items-center justify-center">
              Urgent
            </div>
            <div className="font-bold text-center text-sm text-muted-foreground flex items-center justify-center">
              Not Urgent
            </div>

            {/* Side Label + Quadrants */}
            <div className="font-bold text-center text-sm text-muted-foreground flex items-center justify-center [writing-mode:vertical-rl] rotate-180">
              Important
            </div>
            <Quadrant quadrantId="q1" tasks={tasks.filter((t) => t.quadrantId === "q1")} />
            <Quadrant quadrantId="q2" tasks={tasks.filter((t) => t.quadrantId === "q2")} />

            <div className="font-bold text-center text-sm text-muted-foreground flex items-center justify-center [writing-mode:vertical-rl] rotate-180">
              Not Important
            </div>
            <Quadrant quadrantId="q3" tasks={tasks.filter((t) => t.quadrantId === "q3")} />
            <Quadrant quadrantId="q4" tasks={tasks.filter((t) => t.quadrantId === "q4")} />
          </div>

          <DragOverlay>{activeTask ? <DraggableTask task={activeTask} /> : null}</DragOverlay>
        </DndContext>
      </CardContent>
    </Card>
  );
}
