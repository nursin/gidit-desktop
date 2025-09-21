import React, { useState } from 'react';
import {
  DndContext,
  useDraggable,
  useDroppable,
  closestCorners,
  type DragEndEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { Clock } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';

/**
 * Lightweight classNames helper (replacement for project-specific cn util)
 */
function cn(...args: Array<string | false | null | undefined>) {
  return args.filter(Boolean).join(' ');
}

type Task = {
  id: string;
  content: string;
  timeSlotId: string | null;
  duration: number; // minutes
};

type TimeSlot = {
  id: string;
  time: string;
};

const initialTimeSlots: TimeSlot[] = Array.from({ length: 10 }).map((_, i) => ({
  id: `slot-${i}`,
  time: `${i + 8}:00`,
}));

const initialTasks: Task[] = [
  { id: uuidv4(), timeSlotId: null, content: 'Review project brief', duration: 60 },
  { id: uuidv4(), timeSlotId: 'slot-2', content: 'Team sync meeting', duration: 45 },
  { id: uuidv4(), timeSlotId: null, content: 'Design mockups', duration: 120 },
  { id: uuidv4(), timeSlotId: null, content: 'Code review', duration: 60 },
];

function TaskCard({ task }: { task: Task }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: {
      type: 'Task',
      task,
    },
  });

  const style: React.CSSProperties = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'bg-background/80 p-2 rounded-md shadow flex items-center gap-2 text-xs',
        isDragging && 'opacity-50'
      )}
      {...attributes}
      {...listeners}
    >
      <p className="font-medium flex-grow">{task.content}</p>
      <p className="text-muted-foreground">{task.duration}m</p>
    </div>
  );
}

function TimeSlotRow({ timeSlot, tasks }: { timeSlot: TimeSlot; tasks: Task[] }) {
  const { setNodeRef } = useDroppable({
    id: timeSlot.id,
    data: {
      type: 'TimeSlot',
    },
  });

  return (
    <div className="flex items-start border-t">
      <div className="w-16 text-xs text-muted-foreground p-2 border-r">{timeSlot.time}</div>
      <div ref={setNodeRef} className="flex-1 p-2 min-h-[50px] space-y-2">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
      </div>
    </div>
  );
}

export function TimeBlockPlanner({ name = 'Time Block Planner' }: { name?: string }) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const onDragStart = (event: any) => {
    if (event.active?.data?.current?.type === 'Task') {
      setActiveTask(event.active.data.current.task);
    }
  };

  const onDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId === overId) return;

    const isOverTimeSlot = over.data.current?.type === 'TimeSlot';

    if (isOverTimeSlot) {
      setTasks((prev) =>
        prev.map((t) => (t.id === activeId ? { ...t, timeSlotId: overId } : t))
      );
    } else {
      // Optionally: handle reordering when dropping onto another task within same timeslot
      // If over is a Task, attempt to place active task in same timeslot and reorder
      const isOverTask = over.data.current?.type === 'Task';
      if (isOverTask) {
        const overTask: Task | undefined = over.data.current?.task;
        if (!overTask) return;
        setTasks((prev) => {
          const activeIndex = prev.findIndex((t) => t.id === activeId);
          const overIndex = prev.findIndex((t) => t.id === overTask.id);
          if (activeIndex === -1 || overIndex === -1) return prev;
          // Move the active task to the position of the over task
          const next = arrayMove([...prev], activeIndex, overIndex);
          // Ensure the moved task has the same timeslot as the over task
          next[overIndex] = { ...next[overIndex], timeSlotId: overTask.timeSlotId ?? null };
          return next;
        });
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-transparent border-0 shadow-none">
      <header className="flex items-center gap-3 p-4">
        <Clock className="w-6 h-6 text-primary" />
        <div>
          <h3 className="text-lg font-semibold">{name}</h3>
          <p className="text-xs text-muted-foreground">Plan your day: {format(new Date(), 'EEEE, MMMM d')}</p>
        </div>
      </header>

      <main className="flex-grow min-h-0 overflow-auto p-4">
        <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd} collisionDetection={closestCorners}>
          <div className="border rounded-lg bg-background/20 h-full">
            {initialTimeSlots.map((slot) => (
              <TimeSlotRow key={slot.id} timeSlot={slot} tasks={tasks.filter((t) => t.timeSlotId === slot.id)} />
            ))}
          </div>

          <DragOverlay>{activeTask ? <TaskCard task={activeTask} /> : null}</DragOverlay>
        </DndContext>
      </main>
    </div>
  );
}

export default TimeBlockPlanner;
