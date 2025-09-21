import React, { useState, useRef, useEffect } from 'react';
import { DndContext, useDraggable, useDroppable, closestCorners, type DragEndEvent, DragOverlay, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { GripVertical, KanbanSquare, Plus, Trash2, Palette } from 'lucide-react';
import { cn } from '../../lib/utils';
import { v4 as uuidv4 } from 'uuid';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../ui/alert-dialog";

type Task = {
  id: string;
  content: string;
  columnId: string;
};

type Column = {
  id: string;
  title: string;
  color: string; // hex color
};

const defaultColumns: Column[] = [
  { id: 'backlog', title: 'Backlog', color: '#71717a' }, // gray
  { id: 'todo', title: 'To Do', color: '#3b82f6' }, // blue
  { id: 'in-progress', title: 'In Progress', color: '#eab308' }, // yellow
  { id: 'done', title: 'Done', color: '#22c55e' }, // green
];

const initialTasks: Task[] = [
  { id: uuidv4(), columnId: 'backlog', content: 'Design new landing page' },
  { id: uuidv4(), columnId: 'backlog', content: 'Research state management libraries' },
  { id: uuidv4(), columnId: 'todo', content: 'Implement user authentication' },
  { id: uuidv4(), columnId: 'in-progress', content: 'Develop API for user profiles' },
  { id: uuidv4(), columnId: 'done', content: 'Set up CI/CD pipeline' },
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
      className={cn("bg-background/80 p-3 rounded-lg shadow flex items-center gap-2", isDragging && "opacity-50")}
    >
      <div {...attributes} {...listeners} className="cursor-grab touch-none">
        <GripVertical className="w-4 h-4 text-muted-foreground" />
      </div>
      <p className="text-sm flex-grow">{task.content}</p>
    </div>
  );
}

function AddTaskForm({ columnId, onAddTask, onCancel }: { columnId: string; onAddTask: (columnId: string, content: string) => void; onCancel: () => void; }) {
  const [content, setContent] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleAddTask = () => {
    if (content.trim()) {
      onAddTask(columnId, content.trim());
      setContent('');
      onCancel();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddTask();
    }
    if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <div className="space-y-2">
      <Textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Enter a title for this card..."
        className="resize-none h-20 text-sm"
      />
      <div className="flex items-center gap-2">
        <Button size="sm" onClick={handleAddTask}>Add card</Button>
        <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}

function ColumnContainer({ column, tasks, onTitleChange, onAddTask, onDeleteColumn, onColorChange }: { column: Column; tasks: Task[]; onTitleChange: (id: string, newTitle: string) => void; onAddTask: (columnId: string, content: string) => void; onDeleteColumn: (id: string) => void; onColorChange: (id: string, newColor: string) => void; }) {
  const { setNodeRef } = useDroppable({
    id: column.id,
    data: {
      type: 'Column',
    }
  });

  const [isEditing, setIsEditing] = useState(false);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [title, setTitle] = useState(column.title);

  const handleTitleBlur = () => {
    setIsEditing(false);
    onTitleChange(column.id, title);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleTitleBlur();
    }
  };

  // Helper to convert hex to rgba for transparent background
  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  return (
    <div className="flex flex-col h-full">
      <div
        ref={setNodeRef}
        className="flex flex-col gap-4 p-4 rounded-lg h-full"
        style={{ backgroundColor: hexToRgba(column.color, 0.2) }}
      >
        <div className="font-semibold text-sm flex justify-between items-center gap-2">
          {isEditing ? (
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleBlur}
              onKeyDown={handleKeyDown}
              autoFocus
              className="h-7 text-sm"
            />
          ) : (
            <h3 onClick={() => setIsEditing(true)} className="cursor-pointer flex-grow truncate">
              {column.title}
            </h3>
          )}
          <Badge variant="secondary" className="flex-shrink-0">{tasks.length}</Badge>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <Palette className="w-3 h-3" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-24 p-2">
              <Input
                type="color"
                value={column.color}
                onChange={(e) => onColorChange(column.id, e.target.value)}
                className="p-1 h-8"
              />
            </PopoverContent>
          </Popover>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <Trash2 className="w-3 h-3" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the column and all tasks within it.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => onDeleteColumn(column.id)}>Continue</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
        <div className="flex flex-col gap-3 min-h-[100px] flex-grow">
          {tasks.map(task => <TaskCard key={task.id} task={task} />)}
        </div>
        {isAddingTask ? (
          <AddTaskForm columnId={column.id} onAddTask={onAddTask} onCancel={() => setIsAddingTask(false)} />
        ) : (
          <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => setIsAddingTask(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add a card
          </Button>
        )}
      </div>
    </div>
  );
}

type ScrumBoardProps = {
  name?: string;
};

export function ScrumBoard({ name = "Scrum Board" }: ScrumBoardProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [columns, setColumns] = useState<Column[]>(defaultColumns);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const onDragStart = (event: any) => {
    if (event.active.data.current?.type === 'Task') {
      setActiveTask(event.active.data.current.task);
    }
  };

  const onDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveATask = active.data.current?.type === 'Task';
    const isOverAColumn = over.data.current?.type === 'Column';

    if (isActiveATask && isOverAColumn) {
      setTasks((tasks) => {
        const activeIndex = tasks.findIndex((t) => t.id === activeId);
        // move the task to the new column
        if (activeIndex === -1) return tasks;
        const updated = [...tasks];
        updated[activeIndex] = { ...updated[activeIndex], columnId: overId as string };
        // keep order intact; arrayMove with same index keeps positions consistent
        return arrayMove(updated, activeIndex, activeIndex);
      });
    }
  };

  const handleTitleChange = (id: string, newTitle: string) => {
    setColumns(prev => prev.map(col => col.id === id ? { ...col, title: newTitle } : col));
  };

  const handleColorChange = (id: string, newColor: string) => {
    setColumns(prev => prev.map(col => col.id === id ? { ...col, color: newColor } : col));
  };

  const handleAddTask = (columnId: string, content: string) => {
    const newTask: Task = {
      id: uuidv4(),
      columnId,
      content,
    };
    setTasks(prev => [...prev, newTask]);
  };

  const handleAddColumn = () => {
    const newColumn: Column = {
      id: uuidv4(),
      title: 'New Column',
      color: '#a1a1aa', // gray
    };
    setColumns(prev => [...prev, newColumn]);
  };

  const handleDeleteColumn = (id: string) => {
    setColumns(prev => prev.filter(col => col.id !== id));
    setTasks(prev => prev.filter(task => task.columnId !== id));
  };

  return (
    <Card className="flex flex-col h-full bg-transparent border-0 shadow-none">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <KanbanSquare className="w-6 h-6 text-primary" />
            <div>
              <CardTitle>{name}</CardTitle>
              <CardDescription>Organize your project workflow.</CardDescription>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleAddColumn}>
            <Plus className="w-4 h-4 mr-2" />
            Add Column
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-grow min-h-0 p-4">
        <DndContext
          sensors={sensors}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          collisionDetection={closestCorners}
        >
          <div
            className="grid gap-4 h-full"
            style={{
              gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))`
            }}
          >
            {columns.map(col => (
              <ColumnContainer
                key={col.id}
                column={col}
                tasks={tasks.filter(t => t.columnId === col.id)}
                onTitleChange={handleTitleChange}
                onAddTask={handleAddTask}
                onDeleteColumn={handleDeleteColumn}
                onColorChange={handleColorChange}
              />
            ))}
          </div>
          <DragOverlay>
            {activeTask ? <TaskCard task={activeTask} /> : null}
          </DragOverlay>
        </DndContext>
      </CardContent>
    </Card>
  );
}
