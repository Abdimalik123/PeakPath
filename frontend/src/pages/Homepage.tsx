import React from 'react';
import { Link } from 'react-router-dom';
import { Navigation } from '../components/Navigation';

const HomePage: React.FC = () => {
  const hasToken = typeof window !== 'undefined' && !!localStorage.getItem('token');

  return (
    /* Background: Deep Dark Navy Gradient matching the image */
    <div className="min-h-screen bg-[#121420] text-gray-300 font-sans selection:bg-cyan-500/30">
      
      {/* Navigation: Transparent & Sleek */}
      <Navigation showAuthButtons={true} />

      {/* Hero Section: Data-centric and Dark */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute top-0 -left-20 w-72 h-72 bg-cyan-500/10 rounded-full blur-[120px]"></div>
        
        <div className="text-center relative z-10">
          <h2 className="text-5xl md:text-7xl font-extrabold text-white mb-6 tracking-tight">
            Track. <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Analyze.</span> Conquer.
          </h2>
          <p className="text-lg text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            A high-performance interface for monitoring your physical evolution. 
            Real-time analytics for the modern athlete.
          </p>
          <div className="flex justify-center gap-4">
            {hasToken ? (
              <Link 
                to="/dashboard" 
                className="bg-white text-[#121420] px-10 py-4 rounded-full text-sm font-bold hover:bg-cyan-400 transition-all duration-300 shadow-xl"
              >
                Open Dashboard
              </Link>
            ) : (
              <>
                <Link 
                  to="/register" 
                  className="bg-white text-[#121420] px-10 py-4 rounded-full text-sm font-bold hover:bg-cyan-400 transition-all duration-300 shadow-xl"
                >
                  Start Tracking
                </Link>
                <button className="border border-white/10 px-10 py-4 rounded-full text-sm font-bold hover:bg-white/5 transition">
                  View Demo
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features Section: Using the Card style from the image */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Feature Card 1: Inspired by the Map/Stats UI in the image */}
          <div className="bg-[#1c1f2e] border border-white/5 p-8 rounded-[2rem] hover:border-cyan-500/50 transition-all group">
            <div className="flex justify-between items-start mb-6">
              <div className="p-3 bg-cyan-500/10 rounded-2xl text-cyan-400 group-hover:bg-cyan-500 group-hover:text-[#121420] transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-xs font-mono text-cyan-500/50">LIVE_DATA</span>
            </div>
            <h4 className="text-lg font-bold text-white mb-2">Workout Analytics</h4>
            <p className="text-sm text-gray-500 leading-relaxed">
              Precision logging for every rep. View progress through interactive heatmaps and strike charts.
            </p>
            {/* Visual element mimicking the image lines */}
            <div className="mt-6 h-1 w-full bg-white/5 rounded-full overflow-hidden">
               <div className="h-full bg-cyan-400 w-2/3 shadow-[0_0_10px_#22d3ee]"></div>
            </div>
          </div>

          {/* Feature Card 2 */}
          <div className="bg-[#1c1f2e] border border-white/5 p-8 rounded-[2rem] hover:border-cyan-500/50 transition-all">
            <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-400 mb-6 inline-block">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h4 className="text-lg font-bold text-white mb-2">Daily Rituals</h4>
            <p className="text-sm text-gray-500 leading-relaxed">
              Build unbreakable habits with visual streak tracking and automated smart-reminders.
            </p>
          </div>

          {/* Feature Card 3 */}
          <div className="bg-[#1c1f2e] border border-white/5 p-8 rounded-[2rem] hover:border-cyan-500/50 transition-all">
            <div className="p-3 bg-purple-500/10 rounded-2xl text-purple-400 mb-6 inline-block">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h4 className="text-lg font-bold text-white mb-2">Milestones</h4>
            <p className="text-sm text-gray-500 leading-relaxed">
              Set complex multi-stage goals and watch your progress unfold in high-fidelity charts.
            </p>
          </div>

          {/* Feature Card 4 */}
          <div className="bg-[#1c1f2e] border border-white/5 p-8 rounded-[2rem] hover:border-cyan-500/50 transition-all">
            <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-400 mb-6 inline-block">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h4 className="text-lg font-bold text-white mb-2">Performance Dashboard</h4>
            <p className="text-sm text-gray-500 leading-relaxed">
              An all-in-one command center. Filter your bio-data by day, week, or year.
            </p>
          </div>

        </div>
      </section>

      {/* Footer: Minimal & Dark */}
      <footer className="border-t border-white/5 bg-[#0f111a] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-center md:text-left">
              <p className="text-lg font-bold text-white">LIFE<span className="text-cyan-400">TRACKER</span></p>
              <p className="text-xs text-gray-600 uppercase tracking-widest mt-1">Optimization Engine &copy; 2026</p>
            </div>
            <div className="flex gap-8 text-xs font-medium uppercase tracking-widest text-gray-500">
              <a href="#" className="hover:text-cyan-400 transition">Security</a>
              <a href="#" className="hover:text-cyan-400 transition">API</a>
              <a href="#" className="hover:text-cyan-400 transition">Support</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;