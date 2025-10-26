"use client";
import { useState, Suspense, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import axios from "axios";

interface Task {
  id: string;
  title: string;
  description: string;
  status: "todo" | "in_progress" | "done";
  email?: string;
  links?: string[];
  meeting_id?: string;
  meeting_link?: string;
  created_at: string;
}

const ALLOWED_EMAIL = "chicostategac@gmail.com";

function TasksContent() {
  const sp = useSearchParams();
  const router = useRouter();
  const workspace_id = sp.get("workspace_id") || "eff079c8-5bf9-4a45-8142-2b4d009e1eb4";
  
  const [emailInput, setEmailInput] = useState("");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [showError, setShowError] = useState(false);
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [newTaskEmail, setNewTaskEmail] = useState("");
  const [newTaskLinks, setNewTaskLinks] = useState("");
  const [showAddTask, setShowAddTask] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (isAuthorized) {
      loadTasks();
    }
  }, [isAuthorized, workspace_id]);

  const loadTasks = async () => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/tasks/list/${workspace_id}`);
      setTasks(response.data.tasks || []);
    } catch (error) {
      console.error("Failed to load tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailVerify = () => {
    if (emailInput.toLowerCase().trim() === ALLOWED_EMAIL.toLowerCase()) {
      setIsAuthorized(true);
      setShowError(false);
    } else {
      setShowError(true);
    }
  };

  const createTask = async () => {
    if (!newTaskTitle.trim()) return;
    setCreating(true);
    
    try {
      const links = newTaskLinks.split(',').map(l => l.trim()).filter(Boolean);
      
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/tasks/create`, {
        workspace_id,
        title: newTaskTitle,
        description: newTaskDescription || newTaskTitle,
        email: newTaskEmail || undefined,
        links: links.length > 0 ? links : undefined
      });
      
      await loadTasks();
      setNewTaskTitle("");
      setNewTaskDescription("");
      setNewTaskEmail("");
      setNewTaskLinks("");
      setShowAddTask(false);
      
      alert("✅ Task created! Click 'Start Meeting' to begin the AI conversation.");
    } catch (error) {
      console.error("Failed to create task:", error);
      alert("Failed to create task");
    } finally {
      setCreating(false);
    }
  };

  const startMeeting = async (taskId: string) => {
    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/tasks/start-meeting/${taskId}`);
      const { meeting_link } = response.data;
      
      // Navigate to meeting page
      router.push(meeting_link);
    } catch (error) {
      console.error("Failed to start meeting:", error);
      alert("Failed to start meeting");
    }
  };

  const completeTask = async (taskId: string) => {
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/tasks/complete/${taskId}`);
      await loadTasks();
      alert("✅ Task completed! Summary email sent.");
    } catch (error) {
      console.error("Failed to complete task:", error);
      alert("Failed to complete task");
    }
  };

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
                  We'll send you an email to book a demo or reserve a spot for early access.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Enter your email
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

  const todoTasks = tasks.filter(t => t.status === "todo");
  const inProgressTasks = tasks.filter(t => t.status === "in_progress");
  const doneTasks = tasks.filter(t => t.status === "done");

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
            <div className="bg-[#1a1a1a] rounded-lg p-6 border border-gray-800 space-y-4">
              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Task name (e.g., Catch up with investor)"
                className="w-full px-4 py-2 bg-[#0f0f0f] border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                autoFocus
              />
              <textarea
                value={newTaskDescription}
                onChange={(e) => setNewTaskDescription(e.target.value)}
                placeholder="Description"
                rows={3}
                className="w-full px-4 py-2 bg-[#0f0f0f] border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <input
                type="email"
                value={newTaskEmail}
                onChange={(e) => setNewTaskEmail(e.target.value)}
                placeholder="Email (optional)"
                className="w-full px-4 py-2 bg-[#0f0f0f] border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <input
                type="text"
                value={newTaskLinks}
                onChange={(e) => setNewTaskLinks(e.target.value)}
                placeholder="Links (comma separated, optional)"
                className="w-full px-4 py-2 bg-[#0f0f0f] border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <div className="flex gap-2">
                <button
                  onClick={createTask}
                  disabled={creating}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm rounded-lg font-medium transition-colors"
                >
                  {creating ? "Creating..." : "Add Task"}
                </button>
                <button
                  onClick={() => {
                    setShowAddTask(false);
                    setNewTaskTitle("");
                    setNewTaskDescription("");
                    setNewTaskEmail("");
                    setNewTaskLinks("");
                  }}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-green-500 border-t-transparent rounded-full mx-auto" />
            </div>
          ) : (
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
                      onStartMeeting={startMeeting}
                      onComplete={completeTask}
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
                      onStartMeeting={startMeeting}
                      onComplete={completeTask}
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
                      onStartMeeting={startMeeting}
                      onComplete={completeTask}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}

function TaskCard({
  task,
  onStartMeeting,
  onComplete,
}: {
  task: Task;
  onStartMeeting: (id: string) => void;
  onComplete: (id: string) => void;
}) {
  return (
    <div className="bg-[#1a1a1a] rounded-lg p-4 border border-gray-800 hover:border-gray-700 transition-colors">
      <div className="mb-2">
        <h3 className="text-sm font-medium text-white mb-1">
          {task.title}
        </h3>
        {task.description && (
          <p className="text-xs text-gray-400 mb-2">{task.description}</p>
        )}
        {task.email && (
          <p className="text-xs text-gray-500">📧 {task.email}</p>
        )}
      </div>
      
      <div className="flex gap-2 mt-3">
        {task.status === "todo" && (
          <button
            onClick={() => onStartMeeting(task.id)}
            className="flex-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs rounded font-medium transition-colors"
          >
            Start Meeting
          </button>
        )}
        {task.status === "in_progress" && (
          <button
            onClick={() => onComplete(task.id)}
            className="flex-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded font-medium transition-colors"
          >
            Complete
          </button>
        )}
        {task.meeting_link && task.status === "in_progress" && (
          <a
            href={task.meeting_link}
            className="flex-1 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded font-medium transition-colors text-center"
          >
            Join Meeting
          </a>
        )}
      </div>
    </div>
  );
}

export default function Tasks() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
      <div className="animate-spin h-12 w-12 border-4 border-green-500 border-t-transparent rounded-full" />
    </div>}>
      <TasksContent />
    </Suspense>
  );
}

