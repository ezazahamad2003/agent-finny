"use client";
import { useState, useEffect, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import axios from "axios";

interface ChatMessage {
  text: string;
  role: "ai" | "user";
  timestamp: Date;
}

function MeetingContent() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [loading, setLoading] = useState(true);
  const [taskContext, setTaskContext] = useState<any>(null);

  useEffect(() => {
    loadMeetingContext();
  }, [slug]);

  const loadMeetingContext = async () => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/tasks/meeting/${slug}`);
      setTaskContext(response.data);
      
      // Start with AI greeting
      const greeting: ChatMessage = {
        text: `Hello! I'm FINNY, your AI CFO assistant. I'm here to help with "${response.data.task.title}". How can I assist you today?`,
        role: "ai",
        timestamp: new Date()
      };
      setMessages([greeting]);
    } catch (error) {
      console.error("Failed to load meeting:", error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    // Add user message
    const userMessage: ChatMessage = {
      text: inputText,
      role: "user",
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setInputText("");
    setIsSpeaking(true);

    // Simulate AI response (in production, call 11 Labs API)
    setTimeout(() => {
      const aiResponses = [
        "That's a great question. Based on your financial data, I can see that your burn rate has been relatively stable over the past quarter.",
        "Looking at your expenses, there are several opportunities to optimize costs in the SaaS category.",
        "I recommend focusing on extending your runway by reducing non-essential spending while maintaining growth momentum.",
        "Would you like me to prepare a detailed analysis of your burn rate trends?"
      ];
      
      const aiMessage: ChatMessage = {
        text: aiResponses[Math.floor(Math.random() * aiResponses.length)],
        role: "ai",
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiMessage]);
      setIsSpeaking(false);
    }, 1500);
  };

  const endMeeting = () => {
    if (confirm("Are you sure you want to end this meeting? A summary will be sent.")) {
      // Navigate back to tasks
      router.push("/tasks?workspace_id=eff079c8-5bf9-4a45-8142-2b4d009e1eb4");
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
          <div className="animate-spin h-12 w-12 border-4 border-green-500 border-t-transparent rounded-full" />
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#0f0f0f] text-white">
        {/* Header */}
        <div className="border-b border-gray-800">
          <div className="max-w-7xl mx-auto px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold">Meeting with FINNY</h1>
                <p className="text-gray-400 text-sm mt-1">
                  {taskContext?.task.title}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className={`h-3 w-3 rounded-full ${
                    isSpeaking ? "bg-green-500 animate-pulse" : isListening ? "bg-blue-500 animate-pulse" : "bg-gray-500"
                  }`} />
                  <span className="text-sm text-gray-400">
                    {isSpeaking ? "AI Speaking..." : isListening ? "Listening..." : "Ready"}
                  </span>
                </div>
                <button
                  onClick={endMeeting}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg font-medium transition-colors"
                >
                  End Meeting
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="max-w-4xl mx-auto px-8 py-8 h-[calc(100vh-200px)] flex flex-col">
          <div className="flex-1 overflow-y-auto space-y-6 mb-6">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === "ai" ? "justify-start" : "justify-end"}`}
              >
                <div
                  className={`max-w-lg rounded-2xl px-6 py-4 ${
                    msg.role === "ai"
                      ? "bg-[#1a1a1a] border border-gray-800"
                      : "bg-green-600"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {msg.role === "ai" && (
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-sm font-bold">F</span>
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-medium mb-1">
                        {msg.role === "ai" ? "FINNY" : "You"}
                      </p>
                      <p className="text-gray-300">{msg.text}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {isSpeaking && (
              <div className="flex justify-start">
                <div className="bg-[#1a1a1a] border border-gray-800 rounded-2xl px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="h-2 w-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="h-2 w-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="h-2 w-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                    <span className="text-sm text-gray-400">FINNY is thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-800 pt-4">
            <div className="flex gap-3">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Type your message or use voice..."
                className="flex-1 px-4 py-3 bg-[#1a1a1a] border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <button
                onClick={() => setInputText("What's our current burn rate?")}
                className="px-4 py-3 bg-gray-800 hover:bg-gray-700 text-white text-sm rounded-lg font-medium transition-colors"
              >
                💬
              </button>
              <button
                onClick={sendMessage}
                disabled={!inputText.trim()}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm rounded-lg font-medium transition-colors"
              >
                Send
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              💬 Powered by 11 Labs AI Voice
            </p>
          </div>
        </div>
      </main>
    </>
  );
}

export default function MeetingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-green-500 border-t-transparent rounded-full" />
      </div>
    }>
      <MeetingContent />
    </Suspense>
  );
}
