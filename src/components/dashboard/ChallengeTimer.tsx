import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Trophy, Timer, Play, RotateCw, Sparkles } from "lucide-react";

/**
 * A self-contained Challenge Timer component adapted for an Electron + Vite + React renderer.
 * - Uses plain HTML inputs/buttons with Tailwind classes (no Next.js UI primitives).
 * - No cloud services or external auth dependencies.
 *
 * Place this file at: /app/renderer/src/components/ChallengeTimer.tsx
 */

const CHALLENGE_DURATION_SECONDS = 25 * 60;

type Task = {
  id: number;
  text: string;
  completed: boolean;
};

const initialTasks: Task[] = [
  { id: 1, text: "", completed: false },
  { id: 2, text: "", completed: false },
  { id: 3, text: "", completed: false },
];

type ChallengeStatus = "setup" | "active" | "completed" | "failed";

export function ChallengeTimer({ name = "Flash Round Challenge" }: { name?: string }) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [timeLeft, setTimeLeft] = useState(CHALLENGE_DURATION_SECONDS);
  const [status, setStatus] = useState<ChallengeStatus>("setup");

  const isActive = status === "active";
  const allTasksCompleted = useMemo(() => tasks.every((t) => t.completed), [tasks]);
  const isSetupValid = useMemo(() => tasks.every((t) => t.text.trim() !== ""), [tasks]);

  useEffect(() => {
    if (allTasksCompleted && isActive) {
      setStatus("completed");
    }
  }, [allTasksCompleted, isActive]);

  useEffect(() => {
    if (!isActive) return;

    if (timeLeft <= 0) {
      setStatus(allTasksCompleted ? "completed" : "failed");
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isActive, timeLeft, allTasksCompleted]);

  const handleTaskTextChange = useCallback((id: number, text: string) => {
    setTasks((prev) => prev.map((task) => (task.id === id ? { ...task, text } : task)));
  }, []);

  const handleTaskCompletionChange = useCallback((id: number, completed: boolean) => {
    setTasks((prev) => prev.map((task) => (task.id === id ? { ...task, completed } : task)));
  }, []);

  const startChallenge = () => {
    if (isSetupValid) {
      setStatus("active");
    }
  };

  const resetChallenge = () => {
    setTasks(initialTasks.map((t) => ({ ...t, text: "", completed: false })));
    setTimeLeft(CHALLENGE_DURATION_SECONDS);
    setStatus("setup");
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const renderStatusScreen = () => {
    switch (status) {
      case "completed":
        return (
          <div className="text-center space-y-2">
            <Sparkles className="w-12 h-12 text-yellow-400 mx-auto" />
            <p className="font-bold text-lg">Challenge Complete!</p>
            <p className="text-sm text-gray-500">You finished with {formatTime(timeLeft)} remaining.</p>
            <button
              onClick={resetChallenge}
              className="inline-flex items-center px-3 py-1 rounded bg-indigo-600 text-white text-sm mt-2 hover:bg-indigo-700"
            >
              <RotateCw className="w-4 h-4 mr-2" />
              New Challenge
            </button>
          </div>
        );
      case "failed":
        return (
          <div className="text-center space-y-2">
            <Trophy className="w-12 h-12 text-gray-400 mx-auto" />
            <p className="font-bold text-lg text-red-600">Time's Up!</p>
            <p className="text-sm text-gray-500">Better luck next time. You got this!</p>
            <button
              onClick={resetChallenge}
              className="inline-flex items-center px-3 py-1 rounded bg-red-600 text-white text-sm mt-2 hover:bg-red-700"
            >
              <RotateCw className="w-4 h-4 mr-2" />
              Try Again
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="border rounded-lg shadow-sm flex flex-col h-full bg-white">
      <div className="p-4 border-b flex items-center gap-3">
        <Trophy className="w-6 h-6 text-indigo-600" />
        <div>
          <div className="text-lg font-semibold">{name}</div>
          <div className="text-sm text-gray-500">Complete 3 tasks in 25 minutes.</div>
        </div>
      </div>

      <div className="p-4 flex flex-col flex-grow justify-center items-center gap-4">
        {(status === "setup" || status === "active") ? (
          <>
            <div className="w-full space-y-3">
              {tasks.map((task) => (
                <div key={task.id} className="flex items-center gap-3">
                  <input
                    id={`task-${task.id}`}
                    type="checkbox"
                    checked={task.completed}
                    onChange={(e) => handleTaskCompletionChange(task.id, e.target.checked)}
                    disabled={!isActive}
                    className="w-5 h-5 text-indigo-600 rounded"
                  />
                  <input
                    id={`task-input-${task.id}`}
                    placeholder={`Task #${task.id}...`}
                    value={task.text}
                    onChange={(e) => handleTaskTextChange(task.id, e.target.value)}
                    disabled={isActive}
                    className="flex-1 h-9 px-3 border rounded bg-gray-50 disabled:opacity-60 disabled:bg-gray-100"
                  />
                </div>
              ))}
            </div>

            <div className="text-center">
              <div className="text-sm text-gray-500">Time Remaining</div>
              <div className="text-4xl font-bold font-mono text-indigo-600">{formatTime(timeLeft)}</div>
            </div>

            {status === "setup" && (
              <div>
                <button
                  onClick={startChallenge}
                  disabled={!isSetupValid}
                  className={`inline-flex items-center px-3 py-1 rounded text-white mt-1 ${
                    isSetupValid ? "bg-green-600 hover:bg-green-700" : "bg-gray-400 cursor-not-allowed"
                  }`}
                >
                  <Play className="w-4 h-4 mr-2" />
                  Start Challenge
                </button>
              </div>
            )}
          </>
        ) : (
          renderStatusScreen()
        )}
      </div>
    </div>
  );
}

export default ChallengeTimer;
