"use client";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";

interface Task {
  id: string;
  title: string;
  description: string;
  status: "todo" | "in_progress" | "done";
  priority: "low" | "medium" | "high";
  createdAt: Date;
}

const ALLOWED_EMAIL = "chicostategac@gmail.com";

export default function Tasks() {
  const sp = useSearchParams();
  const workspace_id = sp.get("workspace_id") || "eff079c8-5bf9-4a45-8142-2b4d009e1eb4";
  
  const [emailInput, setEmailInput] = useState("");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [showError, setShowError] = useState(false);
  
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: "1",
      title: "Review Q4 Financials",
      description: "Analyze revenue and expenses for Q4",
      status: "in_progress",
      priority: "high",
      createdAt: new Date(),
    },
    {
      id: "2",
      title: "Cut SaaS Subscriptions",
      description: "Review and cancel unused subscriptions",
      status: "todo",
      priority: "high",
      createdAt: new Date(),
    },
    {
      id: "3",
      title: "Update Cash Flow Forecast",
      description: "Project next 6 months cash flow",
      status: "todo",
      priority: "medium",
      createdAt: new Date(),
    },
  ]);

  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [showAddTask, setShowAddTask] = useState(false);

  const handleEmailVerify = () => {
    if (emailInput.toLowerCase().trim() === ALLOWED_EMAIL.toLowerCase()) {
      setIsAuthorized(true);
      setShowError(false);
    } else {
      setShowError(true);
    }
  };

  const addTask = () => {
    if (!newTaskTitle.trim()) return;
    
    const newTask: Task = {
      id: Date.now().toString(),
      title: newTaskTitle,
      description: "",
      status: "todo",
      priority: "medium",
      createdAt: new Date(),
    };
    
    setTasks([newTask, ...tasks]);
    setNewTaskTitle("");
    setShowAddTask(false);
  };

  const toggleTaskStatus = (id: string) => {
    setTasks(tasks.map(task => {
      if (task.id === id) {
        const statusOrder: Task["status"][] = ["todo", "in_progress", "done"];
        const currentIndex = statusOrder.indexOf(task.status);
        const nextStatus = statusOrder[(currentIndex + 1) % statusOrder.length];
        return { ...task, status: nextStatus };
      }
      return task;
    }));
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter(task => task.id !== id));
  };

  const todoTasks = tasks.filter(t => t.status === "todo");
  const inProgressTasks = tasks.filter(t => t.status === "in_progress");
  const doneTasks = tasks.filter(t => t.status === "done");

  // Show access restriction if not authorized
  if (!isAuthorized) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-[#0f0f0f] text-white flex items-center justify-center">
          <div className="max-w-md w-full mx-4">
            <div className="bg-[#1a1a1a] rounded-lg p-8 border border-gray-800">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-500/10 rounded-full mb-4">
                  <svg className="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold mb-2">Access Restricted</h2>
                <p className="text-gray-400 text-sm mb-6">
                  The Tasks feature is currently limited to authorized users due to API rate limits and infrastructure costs.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Authorized Email
                  </label>
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleEmailVerify()}
                    placeholder="Enter your email"
                    className="w-full px-4 py-2 bg-[#0f0f0f] border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                    suppressHydrationWarning
                  />
                </div>

                {showError && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                    <p className="text-red-400 text-sm">
                      ⚠️ Email not authorized. Only <span className="font-medium">{ALLOWED_EMAIL}</span> has access.
                    </p>
                  </div>
                )}

                <button
                  onClick={handleEmailVerify}
                  className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg font-medium transition-colors"
                  suppressHydrationWarning
                >
                  Verify Access
                </button>

                <div className="pt-4 border-t border-gray-800">
                  <p className="text-xs text-gray-500 text-center">
                    We'll send you an email to book a demo or reserve a spot for early access.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#0f0f0f] text-white">
        <div className="border-b border-gray-800">
          <div className="max-w-7xl mx-auto px-8 py-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-white">Tasks</h1>
                <p className="text-gray-400 mt-1">Manage your financial action items</p>
              </div>
              <button
                onClick={() => setShowAddTask(!showAddTask)}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg font-medium transition-colors"
              >
                + Add Task
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-8 py-8 space-y-6">
          {/* Add Task Form */}
          {showAddTask && (
            <div className="bg-[#1a1a1a] rounded-lg p-4 border border-gray-800">
              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && addTask()}
                placeholder="Task title..."
                className="w-full px-4 py-2 bg-[#0f0f0f] border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                autoFocus
              />
              <div className="flex gap-2 mt-3">
                <button
                  onClick={addTask}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg font-medium transition-colors"
                >
                  Add
                </button>
                <button
                  onClick={() => {
                    setShowAddTask(false);
                    setNewTaskTitle("");
                  }}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Task Columns */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* To Do */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
                  To Do
                </h2>
                <span className="text-xs text-gray-500">{todoTasks.length}</span>
              </div>
              <div className="space-y-3">
                {todoTasks.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onToggle={toggleTaskStatus}
                    onDelete={deleteTask}
                  />
                ))}
              </div>
            </div>

            {/* In Progress */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
                  In Progress
                </h2>
                <span className="text-xs text-gray-500">{inProgressTasks.length}</span>
              </div>
              <div className="space-y-3">
                {inProgressTasks.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onToggle={toggleTaskStatus}
                    onDelete={deleteTask}
                  />
                ))}
              </div>
            </div>

            {/* Done */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
                  Done
                </h2>
                <span className="text-xs text-gray-500">{doneTasks.length}</span>
              </div>
              <div className="space-y-3">
                {doneTasks.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onToggle={toggleTaskStatus}
                    onDelete={deleteTask}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

function TaskCard({
  task,
  onToggle,
  onDelete,
}: {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const priorityColors = {
    low: "bg-gray-600",
    medium: "bg-yellow-600",
    high: "bg-red-600",
  };

  return (
    <div className="bg-[#1a1a1a] rounded-lg p-4 border border-gray-800 hover:border-gray-700 transition-colors group">
      <div className="flex items-start justify-between mb-2">
        <h3
          className={`text-sm font-medium text-white cursor-pointer ${
            task.status === "done" ? "line-through opacity-60" : ""
          }`}
          onClick={() => onToggle(task.id)}
        >
          {task.title}
        </h3>
        <button
          onClick={() => onDelete(task.id)}
          className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition-all text-sm"
        >
          ×
        </button>
      </div>
      {task.description && (
        <p className="text-xs text-gray-400 mb-3">{task.description}</p>
      )}
      <div className="flex items-center justify-between">
        <span className={`text-xs px-2 py-1 rounded ${priorityColors[task.priority]} text-white`}>
          {task.priority}
        </span>
        <button
          onClick={() => onToggle(task.id)}
          className="text-xs text-gray-500 hover:text-green-400 transition-colors"
        >
          {task.status === "todo" ? "Start" : task.status === "in_progress" ? "Complete" : "Reset"}
        </button>
      </div>
    </div>
  );
}

