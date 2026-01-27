import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { TrendingUp, Dumbbell, Calendar, Target, Flame, Award, Activity } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useNavigate } from 'react-router-dom';

export default function Analytics() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');

  // Mock data - Replace with actual API calls
  const [stats, setStats] = useState({
    totalWorkouts: 45,
    totalHabits: 156,
    totalGoals: 3,
    goalsCompleted: 1,
    currentStreak: 12,
    longestStreak: 18,
    totalPoints: 850,
    level: 8,
    workoutMinutes: 2340,
    avgWorkoutDuration: 52,
    mostFrequentWorkout: 'Push Day',
    bestWorkoutDay: 'Monday',
    habitCompletionRate: 87,
    workoutDaysPerWeek: 4.2
  });

  // Workout frequency over time
  const workoutData = [
    { date: 'Mon', workouts: 1, habits: 4 },
    { date: 'Tue', workouts: 0, habits: 3 },
    { date: 'Wed', workouts: 1, habits: 5 },
    { date: 'Thu', workouts: 1, habits: 4 },
    { date: 'Fri', workouts: 0, habits: 3 },
    { date: 'Sat', workouts: 1, habits: 4 },
    { date: 'Sun', workouts: 1, habits: 5 },
  ];

  // Workout types distribution
  const workoutTypes = [
    { name: 'Push Day', value: 15, color: '#10b981' },
    { name: 'Pull Day', value: 12, color: '#3b82f6' },
    { name: 'Leg Day', value: 10, color: '#8b5cf6' },
    { name: 'Cardio', value: 5, color: '#f59e0b' },
    { name: 'Other', value: 3, color: '#6b7280' },
  ];

  // Habit completion rate
  const habitData = [
    { week: 'Week 1', rate: 75 },
    { week: 'Week 2', rate: 82 },
    { week: 'Week 3', rate: 88 },
    { week: 'Week 4', rate: 91 },
  ];

  // Monthly progress
  const monthlyData = [
    { month: 'Jan', workouts: 12, goals: 1 },
    { month: 'Feb', workouts: 16, goals: 0 },
    { month: 'Mar', workouts: 18, goals: 1 },
    { month: 'Apr', workouts: 15, goals: 0 },
    { month: 'May', workouts: 20, goals: 2 },
  ];

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    loadAnalytics();
  }, [navigate, timeRange]);

  const loadAnalytics = async () => {
    try {
      // TODO: Replace with actual API calls
      // const response = await fetchAnalytics(timeRange);
      // setStats(response.data);
      
      setTimeout(() => setLoading(false), 500);
    } catch (error: any) {
      if (error?.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      }
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="p-6 flex items-center justify-center min-h-screen">
          <div className="w-12 h-12 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                <TrendingUp className="w-10 h-10 text-emerald-400" />
                Analytics
              </h1>
              <p className="text-gray-400">Track your fitness journey with detailed insights</p>
            </div>
            {/* Time Range Filter */}
            <div className="flex gap-2">
              {(['week', 'month', 'year'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    timeRange === range
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-800/50 text-gray-400 hover:bg-slate-800'
                  }`}
                >
                  {range.charAt(0).toUpperCase() + range.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Key Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-slate-900/50 backdrop-blur-sm border border-emerald-900/50 rounded-xl p-6">
              <div className="flex items-center justify-between mb-2">
                <Dumbbell className="w-6 h-6 text-emerald-400" />
                <span className="text-sm text-gray-400">Total</span>
              </div>
              <p className="text-3xl font-bold text-white mb-1">{stats.totalWorkouts}</p>
              <p className="text-sm text-gray-400">Workouts</p>
            </div>

            <div className="bg-slate-900/50 backdrop-blur-sm border border-blue-900/50 rounded-xl p-6">
              <div className="flex items-center justify-between mb-2">
                <Calendar className="w-6 h-6 text-blue-400" />
                <span className="text-sm text-gray-400">Total</span>
              </div>
              <p className="text-3xl font-bold text-white mb-1">{stats.totalHabits}</p>
              <p className="text-sm text-gray-400">Habits Logged</p>
            </div>

            <div className="bg-slate-900/50 backdrop-blur-sm border border-purple-900/50 rounded-xl p-6">
              <div className="flex items-center justify-between mb-2">
                <Target className="w-6 h-6 text-purple-400" />
                <span className="text-sm text-gray-400">Completed</span>
              </div>
              <p className="text-3xl font-bold text-white mb-1">{stats.goalsCompleted}/{stats.totalGoals}</p>
              <p className="text-sm text-gray-400">Goals</p>
            </div>

            <div className="bg-slate-900/50 backdrop-blur-sm border border-orange-900/50 rounded-xl p-6">
              <div className="flex items-center justify-between mb-2">
                <Flame className="w-6 h-6 text-orange-400" />
                <span className="text-sm text-gray-400">Current</span>
              </div>
              <p className="text-3xl font-bold text-white mb-1">{stats.currentStreak}</p>
              <p className="text-sm text-gray-400">Day Streak</p>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-br from-emerald-900/30 to-slate-900/30 backdrop-blur-sm border border-emerald-800/30 rounded-xl p-6">
              <Activity className="w-8 h-8 text-emerald-400 mb-3" />
              <p className="text-2xl font-bold text-white mb-1">{stats.workoutMinutes} min</p>
              <p className="text-sm text-gray-400 mb-3">Total Workout Time</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-slate-700 rounded-full h-2">
                  <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '65%' }}></div>
                </div>
                <span className="text-xs text-gray-500">65% of goal</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-900/30 to-slate-900/30 backdrop-blur-sm border border-blue-800/30 rounded-xl p-6">
              <Calendar className="w-8 h-8 text-blue-400 mb-3" />
              <p className="text-2xl font-bold text-white mb-1">{stats.habitCompletionRate}%</p>
              <p className="text-sm text-gray-400 mb-3">Habit Completion Rate</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-slate-700 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${stats.habitCompletionRate}%` }}></div>
                </div>
                <span className="text-xs text-emerald-400">+5%</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-900/30 to-slate-900/30 backdrop-blur-sm border border-purple-800/30 rounded-xl p-6">
              <Award className="w-8 h-8 text-purple-400 mb-3" />
              <p className="text-2xl font-bold text-white mb-1">Level {stats.level}</p>
              <p className="text-sm text-gray-400 mb-3">{stats.totalPoints} total points</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-slate-700 rounded-full h-2">
                  <div className="bg-purple-500 h-2 rounded-full" style={{ width: '40%' }}></div>
                </div>
                <span className="text-xs text-gray-500">200 to next</span>
              </div>
            </div>
          </div>

          {/* Charts Row 1 */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {/* Workout Frequency Chart */}
            <div className="bg-slate-900/50 backdrop-blur-sm border border-emerald-900/50 rounded-xl p-6">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                Weekly Activity
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={workoutData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="date" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                    labelStyle={{ color: '#e2e8f0' }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="workouts" stroke="#10b981" strokeWidth={2} name="Workouts" />
                  <Line type="monotone" dataKey="habits" stroke="#3b82f6" strokeWidth={2} name="Habits" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Workout Types Distribution */}
            <div className="bg-slate-900/50 backdrop-blur-sm border border-emerald-900/50 rounded-xl p-6">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Dumbbell className="w-5 h-5 text-emerald-400" />
                Workout Types
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={workoutTypes}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {workoutTypes.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>

                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Charts Row 2 */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {/* Habit Completion Trend */}
            <div className="bg-slate-900/50 backdrop-blur-sm border border-blue-900/50 rounded-xl p-6">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-400" />
                Habit Completion Trend
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={habitData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="week" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                    labelStyle={{ color: '#e2e8f0' }}
                  />
                  <Bar dataKey="rate" fill="#3b82f6" name="Completion Rate %" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Monthly Progress */}
            <div className="bg-slate-900/50 backdrop-blur-sm border border-purple-900/50 rounded-xl p-6">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-purple-400" />
                Monthly Progress
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="month" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                    labelStyle={{ color: '#e2e8f0' }}
                  />
                  <Legend />
                  <Bar dataKey="workouts" fill="#10b981" name="Workouts" />
                  <Bar dataKey="goals" fill="#8b5cf6" name="Goals Completed" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Insights */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-slate-900/50 backdrop-blur-sm border border-emerald-900/50 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <Dumbbell className="w-5 h-5 text-emerald-400" />
                </div>
                <h4 className="font-semibold text-white">Most Active Day</h4>
              </div>
              <p className="text-2xl font-bold text-emerald-400 mb-1">{stats.bestWorkoutDay}</p>
              <p className="text-sm text-gray-400">Your favorite workout day</p>
            </div>

            <div className="bg-slate-900/50 backdrop-blur-sm border border-blue-900/50 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-blue-400" />
                </div>
                <h4 className="font-semibold text-white">Avg Duration</h4>
              </div>
              <p className="text-2xl font-bold text-blue-400 mb-1">{stats.avgWorkoutDuration} min</p>
              <p className="text-sm text-gray-400">Per workout session</p>
            </div>

            <div className="bg-slate-900/50 backdrop-blur-sm border border-orange-900/50 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                  <Flame className="w-5 h-5 text-orange-400" />
                </div>
                <h4 className="font-semibold text-white">Best Streak</h4>
              </div>
              <p className="text-2xl font-bold text-orange-400 mb-1">{stats.longestStreak} days</p>
              <p className="text-sm text-gray-400">Your longest streak ever</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}