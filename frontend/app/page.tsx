"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import axios from "axios";

export default function Landing() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [startupName, setStartupName] = useState("");
  const [loading, setLoading] = useState(false);
  const [showWaitlistModal, setShowWaitlistModal] = useState(false);

  const handleJoinWaitlist = async () => {
    if (!startupName || !email) {
      alert("Please fill in both your startup name and email!");
      return;
    }
    
    setLoading(true);
    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/waitlist/join`, {
        startup_name: startupName,
        email: email
      });
      
      if (response.data.success) {
        alert("🎉 Thank you for joining! We'll be in touch soon.");
        setEmail("");
        setStartupName("");
        setShowWaitlistModal(false);
      } else {
        alert(response.data.message);
      }
    } catch (error: any) {
      console.error("Waitlist error:", error);
      alert(error.response?.data?.detail || "Failed to join waitlist. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleTestFinny = () => {
    const workspace_id = "eff079c8-5bf9-4a45-8142-2b4d009e1eb4";
    router.push(`/connect?workspace_id=${workspace_id}&name=Demo User`);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white overflow-hidden">
      {/* Navigation Bar */}
      <nav className="relative z-10 flex justify-between items-center px-8 py-6 border-b border-gray-800 backdrop-blur-sm bg-black/30">
        <div className="flex items-center gap-3">
        <Image
            src="/logo.png" 
            alt="FINNY Logo" 
            width={72}
            height={72}
            className="object-contain"
          />
          <span className="text-3xl font-bold tracking-tight">FINNY</span>
        </div>
        <button 
          onClick={() => setShowWaitlistModal(true)}
          className="px-6 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-green-500/50"
        >
          Join Our Waitlist
        </button>
      </nav>

      {/* Waitlist Modal */}
      {showWaitlistModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowWaitlistModal(false)}>
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold">Join Our Waitlist</h3>
              <button onClick={() => setShowWaitlistModal(false)} className="text-gray-400 hover:text-white text-2xl">&times;</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Startup Name</label>
                <input
                  type="text"
                  value={startupName}
                  onChange={(e) => setStartupName(e.target.value)}
                  placeholder="Acme Inc."
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="founder@acme.com"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={handleJoinWaitlist}
                disabled={loading}
                className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Submitted ✓" : "Get Early Access"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <div className="relative max-w-7xl mx-auto px-8 py-20 md:py-32">
        {/* Gradient Orbs */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/20 rounded-full filter blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-green-500/20 rounded-full filter blur-3xl animate-pulse delay-1000"></div>
        
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left Section - Main Content */}
          <div className="space-y-8">
            <div className="inline-block px-4 py-2 bg-gradient-to-r from-blue-500/20 to-green-500/20 border border-blue-500/30 rounded-full text-sm font-medium backdrop-blur-sm">
              🤖 AI-Powered Financial Intelligence
            </div>
            
            <h1 className="text-6xl md:text-7xl font-extrabold leading-tight">
              Meet{" "}
              <span className="bg-gradient-to-r from-green-400 via-blue-500 to-purple-500 text-transparent bg-clip-text animate-gradient">
                FINNY
              </span>
          </h1>
            
            <p className="text-xl md:text-2xl text-gray-300 leading-relaxed">
              Your AI-native CFO that helps you forecast revenue, manage burn rate, and automate accounting—all in one intelligent platform.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={handleTestFinny}
                className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold text-lg rounded-xl transition-all duration-300 transform hover:scale-105 shadow-2xl hover:shadow-blue-500/50"
              >
                <span className="relative z-10">Test FINNY Now</span>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-xl opacity-0 group-hover:opacity-20 transition-opacity"></div>
              </button>
              
              <button 
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-8 py-4 bg-white/5 hover:bg-white/10 border-2 border-white/20 hover:border-white/40 text-white font-bold text-lg rounded-xl transition-all duration-300 backdrop-blur-sm"
              >
                Learn More
              </button>
            </div>

            <div className="flex items-center gap-8 pt-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-400">500+</div>
                <div className="text-sm text-gray-400">Startups</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-400">$50M+</div>
                <div className="text-sm text-gray-400">Tracked</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-400">24/7</div>
                <div className="text-sm text-gray-400">AI Support</div>
              </div>
            </div>
          </div>

          {/* Right Section - Feature Cards */}
          <div className="space-y-6" id="features">
            <div className="group p-6 bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl hover:border-green-500/50 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-green-500/20">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 group-hover:scale-110 transition-transform">
                  📊
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2 text-green-400">Revenue Forecasting</h3>
                  <p className="text-gray-400">AI-powered predictions that help you plan your financial future with confidence and precision.</p>
                </div>
              </div>
            </div>

            <div className="group p-6 bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl hover:border-blue-500/50 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/20">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 group-hover:scale-110 transition-transform">
                  🔥
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2 text-blue-400">Burn Rate Management</h3>
                  <p className="text-gray-400">Real-time insights into your cash flow and runway, so you always know where you stand.</p>
                </div>
              </div>
            </div>

            <div className="group p-6 bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl hover:border-purple-500/50 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/20">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-500 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 group-hover:scale-110 transition-transform">
                  ⚡
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2 text-purple-400">Automated Accounting</h3>
                  <p className="text-gray-400">Smart categorization and anomaly detection that saves you hours of manual work every week.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Waitlist Section */}
      <div className="relative py-20 border-t border-gray-800">
        <div className="max-w-4xl mx-auto px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Transform Your Financial Operations?
          </h2>
          <p className="text-xl text-gray-400 mb-8">
            Join hundreds of startups using FINNY to make smarter financial decisions.
          </p>
          <div className="flex flex-col gap-4 justify-center max-w-xl mx-auto">
            <input
              type="text"
              value={startupName}
              onChange={(e) => setStartupName(e.target.value)}
              placeholder="Your startup name"
              className="w-full px-6 py-4 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent backdrop-blur-sm"
            />
            <div className="flex flex-col sm:flex-row gap-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="flex-1 px-6 py-4 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent backdrop-blur-sm"
              />
              <button
                onClick={handleJoinWaitlist}
                disabled={loading}
                className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-green-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Submitted ✓" : "Get Early Access"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-8">
        <div className="max-w-7xl mx-auto px-8 text-center text-gray-500">
          <p className="flex items-center justify-center gap-2">
            Powered by{" "}
            <span className="text-green-400 font-semibold">Lava Payments</span>
            {" "}• Built for the future of finance
          </p>
        </div>
      </footer>
      </main>
  );
}
