import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { fetchDashboard, DashboardData } from '../api/dashboard';
import { WorkoutCard } from '../components/WorkoutCard';
import { GoalProgress } from '../components/GoalProgress';
import { Navigation } from '../components/Navigation';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        const data = await fetchDashboard();
        setDashboardData(data);
        setError(null);
      } catch (err) {
        setError('Failed to load dashboard data');
        console.error('Dashboard error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  // Helper function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  // Helper function to get day name from date string
  const getDayName = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#121420] flex items-center justify-center">
        <div className="text-cyan-400 text-xl">Loading dashboard...</div>
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className="min-h-screen bg-[#121420] flex items-center justify-center">
        <div className="text-red-400 text-xl">{error || 'Failed to load dashboard'}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121420] text-gray-300">
      
      <Navigation currentPage="/dashboard" />

      {/* Main Dashboard Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">Welcome back, {dashboardData.user.name}</h2>
          <p className="text-gray-400 text-sm uppercase tracking-wider">PERFORMANCE OVERVIEW // TODAY</p>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          
          {/* Stat Card 1 - Workouts Today */}
          <div className="bg-[#1c1f2e] border border-white/5 p-6 rounded-[2rem] hover:border-cyan-500/50 transition-all group">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-cyan-500/10 rounded-2xl text-cyan-400 group-hover:bg-cyan-500 group-hover:text-[#121420] transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-xs font-mono text-cyan-500/50">TODAY</span>
            </div>
            <h3 className="text-4xl font-bold text-white mb-1">{dashboardData.today.workouts_completed}</h3>
            <p className="text-sm text-gray-500 uppercase tracking-wider">Workouts Today</p>
          </div>

          {/* Stat Card 2 - Habits Today */}
          <div className="bg-[#1c1f2e] border border-white/5 p-6 rounded-[2rem] hover:border-blue-500/50 transition-all group">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-400 group-hover:bg-blue-500 group-hover:text-[#121420] transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-xs font-mono text-blue-500/50">TODAY</span>
            </div>
            <h3 className="text-4xl font-bold text-white mb-1">{dashboardData.today.habits_logged}</h3>
            <p className="text-sm text-gray-500 uppercase tracking-wider">Habits Logged</p>
          </div>

          {/* Stat Card 3 - Active Goals */}
          <div className="bg-[#1c1f2e] border border-white/5 p-6 rounded-[2rem] hover:border-purple-500/50 transition-all group">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-500/10 rounded-2xl text-purple-400 group-hover:bg-purple-500 group-hover:text-[#121420] transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <span className="text-xs font-mono text-purple-500/50">ACTIVE</span>
            </div>
            <h3 className="text-4xl font-bold text-white mb-1">{dashboardData.active_goals.length}</h3>
            <p className="text-sm text-gray-500 uppercase tracking-wider">Active Goals</p>
          </div>

          {/* Stat Card 4 - Recent Workouts */}
          <div className="bg-[#1c1f2e] border border-white/5 p-6 rounded-[2rem] hover:border-emerald-500/50 transition-all group">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-400 group-hover:bg-emerald-500 group-hover:text-[#121420] transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <span className="text-xs font-mono text-emerald-500/50">RECENT</span>
            </div>
            <h3 className="text-4xl font-bold text-white mb-1">{dashboardData.recent_workouts.length}</h3>
            <p className="text-sm text-gray-500 uppercase tracking-wider">Recent Workouts</p>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column - 2/3 width */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Weekly Activity Chart */}
            <div className="bg-[#1c1f2e] border border-white/5 p-8 rounded-[2rem]">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-1">Weekly Activity</h3>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Training Volume Analysis</p>
                </div>
              </div>
              
              {/* Bar Chart from Real Data */}
              <div className="flex items-end justify-between h-64 gap-3">
                {dashboardData.weekly_activity.map((day, idx) => {
                  const totalActivity = day.workouts + day.habits;
                  const maxActivity = Math.max(...dashboardData.weekly_activity.map(d => d.workouts + d.habits), 1);
                  const height = `${(totalActivity / maxActivity) * 100}%`;
                  const colors = ['cyan', 'blue', 'purple', 'emerald', 'cyan', 'blue', 'purple'];
                  const color = colors[idx % colors.length];
                  
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-3">
                      <div className="w-full bg-white/5 rounded-t-xl relative group cursor-pointer" style={{height: height || '5%'}}>
                        <div className={`absolute inset-0 bg-${color}-400 shadow-[0_0_20px_rgba(34,211,238,0.4)] rounded-t-xl transition-all group-hover:scale-105`}></div>
                        <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-sm font-bold text-white opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                          {day.workouts}W / {day.habits}H
                        </span>
                      </div>
                      <span className="text-xs font-mono text-gray-500 uppercase">{getDayName(day.date)}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent Workouts */}
            <div className="bg-[#1c1f2e] border border-white/5 p-8 rounded-[2rem]">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-1">Recent Sessions</h3>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Last {dashboardData.recent_workouts.length} workouts</p>
                </div>
                <Link to="/workouts" className="text-cyan-400 font-bold text-xs uppercase tracking-wider hover:text-cyan-300 transition">View All →</Link>
              </div>
              
              {dashboardData.recent_workouts.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No workouts yet. Start your first workout!</p>
              ) : (
                <div className="space-y-4">
                  {dashboardData.recent_workouts.map((workout) => (
                    <WorkoutCard 
                      key={workout.id} 
                      workout={workout} 
                      onClick={(id) => console.log('Navigate to workout:', id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - 1/3 width */}
          <div className="space-y-6">
            
            {/* Active Goals */}
            <div className="bg-[#1c1f2e] border border-white/5 p-6 rounded-[2rem]">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-white mb-1">Active Goals</h3>
                <p className="text-xs text-gray-500 uppercase tracking-wider">In Progress</p>
              </div>
              
              {dashboardData.active_goals.length === 0 ? (
                <p className="text-gray-500 text-center py-4 text-sm">No active goals. Create one!</p>
              ) : (
                <div className="space-y-5">
                  {dashboardData.active_goals.slice(0, 3).map((goal) => (
                    <GoalProgress key={goal.id} goal={goal} />
                  ))}
                </div>
              )}
              
              {dashboardData.active_goals.length > 0 && (
                <Link to="/goals" className="block mt-6 text-center text-cyan-400 text-sm font-bold uppercase tracking-wider hover:text-cyan-300 transition">
                  View All Goals →
                </Link>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-gradient-to-br from-cyan-500 to-blue-600 rounded-[2rem] p-6 shadow-[0_0_40px_rgba(34,211,238,0.3)]">
              <h3 className="text-xl font-bold text-white mb-1">Quick Actions</h3>
              <p className="text-xs text-cyan-100 uppercase tracking-wider mb-6">Command Center</p>
              
              <div className="space-y-3">
                <Link to="/workouts" className="w-full bg-white/20 hover:bg-white/30 backdrop-blur-sm p-4 rounded-xl font-bold text-white text-left transition flex items-center gap-3 text-sm uppercase tracking-wider">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Log Workout
                </Link>
                <Link to="/habits" className="w-full bg-white/20 hover:bg-white/30 backdrop-blur-sm p-4 rounded-xl font-bold text-white text-left transition flex items-center gap-3 text-sm uppercase tracking-wider">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Complete Habit
                </Link>
                <Link to="/goals" className="w-full bg-white/20 hover:bg-white/30 backdrop-blur-sm p-4 rounded-xl font-bold text-white text-left transition flex items-center gap-3 text-sm uppercase tracking-wider">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  View Goals
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;