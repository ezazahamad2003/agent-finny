"use client";
import { useState, useEffect, Suspense } from "react";
import { useParams } from "next/navigation";
import Navbar from "@/components/Navbar";

interface ChatMessage {
  text: string;
  role: "finny" | "user";
  timestamp: Date;
}

function MeetingContent() {
  const params = useParams();
  const slug = params.slug as string;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Mock script (in production, fetch from API)
  const script = [
    "Hello! I'm FINNY, your AI CFO assistant.",
    "Let me walk you through your financial position.",
    "Your current burn rate is $11.1k per month.",
    "With your runway at 4.3 months, I recommend optimizing expenses.",
    "Consider reducing SaaS costs by 30% to extend runway.",
    "Would you like me to generate a detailed optimization plan?"
  ];

  useEffect(() => {
    // Simulate voice chat
    const interval = setInterval(() => {
      if (currentIndex < script.length && !isPlaying) {
        setIsPlaying(true);
        const message: ChatMessage = {
          text: script[currentIndex],
          role: "finny",
          timestamp: new Date()
        };
        setMessages(prev => [...prev, message]);
        
        // Simulate audio duration
        setTimeout(() => {
          setIsPlaying(false);
          setCurrentIndex(prev => prev + 1);
        }, 2500);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [currentIndex, script.length, isPlaying]);

  const meetingComplete = currentIndex >= script.length;

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
                <p className="text-gray-400 text-sm mt-1">Session: {slug}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className={`h-3 w-3 rounded-full ${
                  isPlaying ? "bg-green-500 animate-pulse" : "bg-gray-500"
                }`} />
                <span className="text-sm text-gray-400">
                  {isPlaying ? "FINNY is speaking..." : "Listening"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="max-w-4xl mx-auto px-8 py-8">
          <div className="space-y-6">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === "finny" ? "justify-start" : "justify-end"}`}
              >
                <div
                  className={`max-w-lg rounded-2xl px-6 py-4 ${
                    msg.role === "finny"
                      ? "bg-[#1a1a1a] border border-gray-800"
                      : "bg-green-600"
                  }`}
                >
                  <p className="text-sm font-medium mb-1">
                    {msg.role === "finny" ? "🤖 FINNY" : "You"}
                  </p>
                  <p className="text-gray-300">{msg.text}</p>
                </div>
              </div>
            ))}

            {isPlaying && (
              <div className="flex justify-start">
                <div className="bg-[#1a1a1a] border border-gray-800 rounded-2xl px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="h-2 w-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="h-2 w-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="h-2 w-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                    <span className="text-sm text-gray-400">FINNY is speaking...</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Summary Section */}
          {meetingComplete && (
            <div className="mt-12 p-8 bg-[#1a1a1a] rounded-2xl border border-gray-800">
              <h2 className="text-xl font-semibold mb-4">📊 Meeting Summary</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-green-400 mb-2">Key Insights</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-300">
                    <li>Monthly burn rate: $11.1k</li>
                    <li>Current runway: 4.3 months</li>
                    <li>Optimization potential: 30% cost reduction</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-medium text-green-400 mb-2">Recommended Actions</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-300">
                    <li>Review and cancel unused SaaS subscriptions</li>
                    <li>Optimize cloud infrastructure costs</li>
                    <li>Set up automated spending alerts</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
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
