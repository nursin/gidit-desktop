import React, { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { ListChecks, Plus, Trash2 } from "lucide-react";

type Task = {
  id: string;
  label: string;
  completed: boolean;
  priority: "low" | "medium" | "high";
  tags: string[];
};

type ToDoListProps = {
  name?: string;
};

const initialTasks: Task[] = [
  { id: uuidv4(), label: "Finalize presentation deck", completed: false, priority: "high", tags: ["Work"] },
  { id: uuidv4(), label: "Schedule dentist appointment", completed: false, priority: "medium", tags: ["Personal"] },
  { id: uuidv4(), label: "Buy groceries for the week", completed: true, priority: "medium", tags: ["Home"] },
  { id: uuidv4(), label: "Read one chapter of 'Atomic Habits'", completed: false, priority: "low", tags: ["Personal"] },
];

// small helper to conditionally join classes
const cn = (...args: Array<string | false | null | undefined>) => args.filter(Boolean).join(" ");

export function ToDoList({ name = "To-Do List" }: ToDoListProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [newTaskLabel, setNewTaskLabel] = useState("");

  const handleAddTask = () => {
    if (newTaskLabel.trim() === "") return;
    const newTask: Task = {
      id: uuidv4(),
      label: newTaskLabel.trim(),
      completed: false,
      priority: "medium",
      tags: [],
    };
    setTasks([newTask, ...tasks]);
    setNewTaskLabel("");
  };

  const handleToggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((task) => (task.id === id ? { ...task, completed: !task.completed } : task))
    );
  };

  const handleRemoveTask = (id: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== id));
  };

  const priorityClasses: Record<Task["priority"], string> = {
    high: "border-l-4 border-red-500",
    medium: "border-l-4 border-yellow-500",
    low: "border-l-4 border-blue-500",
  };

  return (
    <div className="h-full flex flex-col bg-transparent border-0 shadow-none">
      <div className="flex items-center gap-3 mb-3">
        <ListChecks className="w-6 h-6 text-primary" />
        <div>
          <h3 className="text-lg font-medium">{name}</h3>
          <p className="text-sm text-muted-foreground">Stay organized and on track.</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-4 min-h-0">
        <div className="flex gap-2">
          <input
            className="flex-1 px-3 py-2 rounded border bg-white/5 focus:outline-none focus:ring"
            placeholder="Add a new task..."
            value={newTaskLabel}
            onChange={(e) => setNewTaskLabel(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
            aria-label="Add new task"
          />
          <button
            onClick={handleAddTask}
            className="inline-flex items-center justify-center px-3 py-2 bg-primary text-white rounded hover:opacity-90"
            aria-label="Add task"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 -mx-6 overflow-auto">
          <div className="px-6 space-y-3">
            {tasks.map((task) => (
              <div
                key={task.id}
                className={cn(
                  "flex items-center gap-3 p-3 bg-background/50 rounded-md",
                  priorityClasses[task.priority]
                )}
              >
                <input
                  id={`check-${task.id}`}
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => handleToggleTask(task.id)}
                  className="w-4 h-4"
                />
                <label
                  htmlFor={`check-${task.id}`}
                  className={cn("flex-1 text-sm", task.completed && "line-through text-muted-foreground")}
                >
                  {task.label}
                </label>

                <div className="flex gap-1">
                  {task.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-2 py-0.5 border rounded-full bg-transparent"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <button
                  onClick={() => handleRemoveTask(task.id)}
                  className="h-7 w-7 inline-flex items-center justify-center rounded hover:bg-muted"
                  aria-label={`Remove ${task.label}`}
                >
                  <Trash2 className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            ))}

            {tasks.length === 0 && (
              <div className="text-center text-sm text-muted-foreground py-6">
                No tasks yet — add one above.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ToDoList;
