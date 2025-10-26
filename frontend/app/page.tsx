"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Onboard() {
  // Suppress hydration warnings from browser extensions
  if (typeof window !== 'undefined') {
    // @ts-ignore
    const originalError = console.error;
    console.error = (...args: any[]) => {
      if (typeof args[0] === 'string' && args[0].includes('Hydration')) return;
      originalError(...args);
    };
  }
  const router = useRouter();
  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");

  const handleContinue = () => {
    // Using existing workspace for demo
    const workspace_id = "eff079c8-5bf9-4a45-8142-2b4d009e1eb4";
    router.push(`/connect?workspace_id=${workspace_id}&name=${encodeURIComponent(name)}`);
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">🤖 Agent Finny</h1>
          <p className="text-gray-600">Your AI-powered CFO assistant</p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Startup Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Acme Robotics"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Website URL <span className="text-gray-400 text-xs">(optional)</span>
            </label>
            <input
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://acme.com"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            />
          </div>

          <button
            onClick={handleContinue}
            disabled={!name}
            className="w-full px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Continue → Connect Bank
          </button>
        </div>

        <p className="text-xs text-gray-500 text-center mt-6">
          Demo ready • Lava-powered AI insights
        </p>
      </div>
    </main>
  );
}
