"use client";
import { useEffect, useState, Suspense } from "react";
import axios from "axios";
import { useSearchParams, useRouter } from "next/navigation";
import { usePlaidLink } from "react-plaid-link";

function ConnectContent() {
  const router = useRouter();
  const sp = useSearchParams();
  const workspace_id = sp.get("workspace_id") || "eff079c8-5bf9-4a45-8142-2b4d009e1eb4";
  const name = sp.get("name") || "Your Startup";
  const [linkToken, setLinkToken] = useState<string>();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    axios
      .post(`${process.env.NEXT_PUBLIC_API_URL}/plaid/link-token`, { workspace_id })
      .then((r) => setLinkToken(r.data.link_token))
      .catch((e) => console.error("Error fetching link token:", e));
  }, [workspace_id]);

  const { open, ready } = usePlaidLink({
    token: linkToken!,
    onSuccess: async (public_token) => {
      setLoading(true);
      try {
        await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/plaid/exchange`, {
          public_token,
          workspace_id,
        });
        router.push(`/dashboard?workspace_id=${workspace_id}&name=${encodeURIComponent(name)}`);
      } catch (error) {
        console.error("Error exchanging token:", error);
        alert("Failed to connect bank. Please try again.");
        setLoading(false);
      }
    },
  });

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900 p-6">
      <div className="max-w-5xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">Connect Your Bank</h1>
          <p className="text-xl text-gray-300">
            Link your bank account to get real-time financial insights
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Side - Connection Box */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-2xl p-8 border border-gray-700">
            <h2 className="text-2xl font-bold text-white mb-6">Connect with Plaid Sandbox</h2>
            
            <button
              onClick={() => open()}
              disabled={!ready || !linkToken || loading}
              className="w-full px-8 py-5 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white text-lg font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-green-500/50 flex items-center justify-center gap-3"
            >
              {loading ? (
                <>
                  <div className="animate-spin h-6 w-6 border-3 border-white border-t-transparent rounded-full" />
                  Processing...
                </>
              ) : (
                <>
                  <span className="text-2xl">🏦</span> Connect Sandbox Bank
                </>
              )}
            </button>

            <p className="text-sm text-gray-400 text-center mt-6">
              Powered by Plaid • Your data is secure
            </p>
          </div>

          {/* Right Side - Instructions */}
          <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl p-8 border border-gray-700/50 backdrop-blur-sm">
            <h2 className="text-2xl font-bold text-white mb-6">📋 How to Connect</h2>
            
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">
                  1
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">Click Connect Button</h3>
                  <p className="text-gray-400">Click the "Connect Sandbox Bank" button on the left</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">
                  2
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">Enter Test Credentials</h3>
                  <div className="bg-gray-900/50 rounded-lg p-4 mt-2 border border-gray-700">
                    <p className="text-sm text-gray-300 mb-2"><strong className="text-green-400">Username:</strong> user_good</p>
                    <p className="text-sm text-gray-300 mb-2"><strong className="text-green-400">Password:</strong> pass_good</p>
                    <p className="text-sm text-gray-300"><strong className="text-green-400">MFA Code:</strong> 1234</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">
                  3
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">Select Accounts</h3>
                  <p className="text-gray-400">Choose which accounts to link to FINNY</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">
                  4
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">View Dashboard</h3>
                  <p className="text-gray-400">Access your financial insights and AI-powered CFO recommendations</p>
                </div>
              </div>
            </div>

            <div className="mt-8 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <p className="text-sm text-blue-300">
                💡 <strong>Tip:</strong> This is a sandbox environment. Your real banking data is never accessed.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function Connect() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#0f0f0f]">
      <div className="animate-spin h-12 w-12 border-4 border-green-500 border-t-transparent rounded-full" />
    </div>}>
      <ConnectContent />
    </Suspense>
  );
}

