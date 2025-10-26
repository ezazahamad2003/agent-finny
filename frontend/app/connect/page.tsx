"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { useSearchParams, useRouter } from "next/navigation";
import { usePlaidLink } from "react-plaid-link";

export default function Connect() {
  const router = useRouter();
  const sp = useSearchParams();
  const workspace_id = sp.get("workspace_id")!;
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

  const handleDemoData = async () => {
    setLoading(true);
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/plaid/demo-item`, { workspace_id });
      router.push(`/dashboard?workspace_id=${workspace_id}&name=${encodeURIComponent(name)}`);
    } catch (error) {
      console.error("Error loading demo data:", error);
      alert("Failed to load demo data. Please try again.");
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-xl w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Connect Your Bank</h1>
          <p className="text-gray-600">
            Link your bank account to get real-time financial insights
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-900 font-medium mb-2">🧪 Sandbox Test Credentials</p>
          <div className="text-sm text-blue-800 space-y-1">
            <p>
              <strong>Username:</strong> user_good
            </p>
            <p>
              <strong>Password:</strong> pass_good
            </p>
            <p>
              <strong>MFA Code:</strong> 1234
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => open()}
            disabled={!ready || !linkToken || loading}
            className="w-full px-6 py-4 bg-black text-white rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                Processing...
              </>
            ) : (
              <>
                <span>🏦</span> Connect Sandbox Bank
              </>
            )}
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">OR</span>
            </div>
          </div>

          <button
            onClick={handleDemoData}
            disabled={loading}
            className="w-full px-6 py-4 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            ⚡ Load Demo Data (One-Click)
          </button>
        </div>

        <p className="text-xs text-gray-500 text-center mt-6">
          Powered by Plaid • Your data is secure
        </p>
      </div>
    </main>
  );
}

