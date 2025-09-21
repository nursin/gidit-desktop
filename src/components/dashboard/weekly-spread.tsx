import { useState } from 'react';
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
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { GripVertical, CalendarDays } from 'lucide-react';
import { cn } from '../../lib/utils';
import { v4 as uuidv4 } from 'uuid';
import { addDays, format } from 'date-fns';

type Task = {
  id: string;
  content: string;
  dayId: string;
};

type Day = {
  id: string;
  title: string;
  date: Date;
};

const today = new Date();
const initialDays: Day[] = Array.from({ length: 7 }).map((_, i) => ({
  id: `day-${i}`,
  title: format(addDays(today, i), 'EEEE'),
  date: addDays(today, i),
}));

const initialTasks: Task[] = [
  { id: uuidv4(), dayId: 'day-0', content: 'Team Standup' },
  { id: uuidv4(), dayId: 'day-1', content: 'Review PRs' },
  { id: uuidv4(), dayId: 'day-1', content: 'Design meeting' },
  { id: uuidv4(), dayId: 'day-2', content: 'Focus block: feature dev' },
  { id: uuidv4(), dayId: 'day-4', content: 'Deploy to staging' },
];

function TaskCard({ task }: { task: Task }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: {
      type: 'Task',
      task,
    },
  });

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn('bg-background/80 p-2 rounded-md shadow flex items-center gap-2', isDragging && 'opacity-50')}
    >
      <div {...attributes} {...listeners} className="cursor-grab touch-none">
        <GripVertical className="w-4 h-4 text-muted-foreground" />
      </div>
      <p className="text-xs flex-grow">{task.content}</p>
    </div>
  );
}

function DayColumn({ day, tasks }: { day: Day; tasks: Task[] }) {
  const { setNodeRef } = useDroppable({
    id: day.id,
    data: {
      type: 'Day',
    },
  });
  const isToday = format(day.date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

  return (
    <div ref={setNodeRef} className="flex flex-col gap-3 p-2 rounded-lg bg-background/30">
      <h3 className={cn('font-semibold text-sm text-center', isToday && 'text-primary')}>
        {day.title}
        <p className="text-xs text-muted-foreground font-normal">{format(day.date, 'MMM d')}</p>
      </h3>
      <div className="flex flex-col gap-2 min-h-[100px] flex-grow">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
      </div>
    </div>
  );
}

type WeeklySpreadProps = {
  name?: string;
};

export function WeeklySpread({ name = 'Weekly Spread' }: WeeklySpreadProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const onDragStart = (event: DragStartEvent) => {
    if (event.active.data.current?.type === 'Task') {
      setActiveTask(event.active.data.current.task as Task);
    }
  };

  const onDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    if (activeId === overId) return;

    const isActiveATask = active.data.current?.type === 'Task';
    const isOverADay = over.data.current?.type === 'Day';

    if (isActiveATask && isOverADay) {
      // Move the task to the target day by updating its dayId.
      // Keep relative ordering of tasks intact (we simply change the dayId).
      setTasks((prev) =>
        prev.map((t) => (t.id === activeId ? { ...t, dayId: overId } : t))
      );
    } else if (isActiveATask && !isOverADay) {
      // If dropped over another task, try to reorder within the same day.
      // `over.data.current` may contain a Task — handle that.
      const isOverATask = over.data.current?.type === 'Task';
      if (isOverATask) {
        const overTask: Task | undefined = over.data.current?.task;
        if (overTask) {
          setTasks((prev) => {
            const activeIndex = prev.findIndex((t) => t.id === activeId);
            const overIndex = prev.findIndex((t) => t.id === overTask.id);
            if (activeIndex === -1 || overIndex === -1) return prev;
            // If moving between days, ensure dayId is updated to match target task's day.
            const updated = prev.map((t) =>
              t.id === activeId ? { ...t, dayId: prev[overIndex].dayId } : t
            );
            return arrayMove(updated, activeIndex, overIndex);
          });
        }
      }
    }
  };

  return (
    <Card className="flex flex-col h-full bg-transparent border-0 shadow-none">
      <CardHeader>
        <div className="flex items-center gap-3">
          <CalendarDays className="w-6 h-6 text-primary" />
          <div>
            <CardTitle>{name}</CardTitle>
            <CardDescription>Plan your week at a glance.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-grow min-h-0 overflow-x-auto">
        <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd} collisionDetection={closestCorners}>
          <div className="grid grid-cols-7 gap-2 h-full">
            {initialDays.map((day) => (
              <DayColumn key={day.id} day={day} tasks={tasks.filter((t) => t.dayId === day.id)} />
            ))}
          </div>
          <DragOverlay>{activeTask ? <TaskCard task={activeTask} /> : null}</DragOverlay>
        </DndContext>
      </CardContent>
    </Card>
  );
}
