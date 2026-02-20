import { useState, useEffect } from 'react';
import { Navigation } from '../components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card';
import { StatCard, StatsGrid } from '../components/StatCard';
import { TrendingUp, Dumbbell, Calendar, Target, Flame, Award, Activity } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';

interface AnalyticsStats {
  totalWorkouts: number;
  totalHabits: number;
  totalGoals: number;
  goalsCompleted: number;
  currentStreak: number;
  longestStreak: number;
  totalPoints: number;
  level: number;
  workoutMinutes: number;
  avgWorkoutDuration: number;
  mostFrequentWorkout: string;
  bestWorkoutDay: string;
  habitCompletionRate: number;
  workoutDaysPerWeek: number;
}

export default function Analytics() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');
  const [stats, setStats] = useState<AnalyticsStats | null>(null);

  // Mock data - Replace with actual API calls when backend is ready
  const mockStats: AnalyticsStats = {
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
  };

  const workoutData = [
    { date: 'Mon', workouts: 1, habits: 4 },
    { date: 'Tue', workouts: 0, habits: 3 },
    { date: 'Wed', workouts: 1, habits: 5 },
    { date: 'Thu', workouts: 1, habits: 4 },
    { date: 'Fri', workouts: 0, habits: 3 },
    { date: 'Sat', workouts: 1, habits: 4 },
    { date: 'Sun', workouts: 1, habits: 5 },
  ];

  const workoutTypes = [
    { name: 'Push Day', value: 15, color: '#22c55e' },
    { name: 'Pull Day', value: 12, color: '#3b82f6' },
    { name: 'Leg Day', value: 10, color: '#8b5cf6' },
    { name: 'Cardio', value: 5, color: '#f59e0b' },
    { name: 'Other', value: 3, color: '#6b7280' },
  ];

  const habitData = [
    { week: 'Week 1', rate: 75 },
    { week: 'Week 2', rate: 82 },
    { week: 'Week 3', rate: 88 },
    { week: 'Week 4', rate: 91 },
  ];

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
      setLoading(true);
      // TODO: Replace with actual API calls
      // const response = await client.get(`/analytics?range=${timeRange}`);
      // setStats(response.data);
      
      // Using mock data for now
      setStats(mockStats);
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error: any) {
      if (error?.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)]">
        <Navigation currentPage="/analytics" />
        <div className="lg:ml-64 min-h-screen flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-[var(--brand-primary)] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <Navigation currentPage="/analytics" />
      
      <div className="lg:ml-64 min-h-screen">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-[var(--text-primary)] flex items-center gap-3">
                <TrendingUp className="w-8 h-8 text-[var(--brand-primary)]" />
                Analytics
              </h1>
              <p className="text-sm text-[var(--text-muted)] mt-1">
                Track your fitness journey with detailed insights
              </p>
            </div>
            
            {/* Time Range Filter */}
            <div className="flex gap-2">
              {(['week', 'month', 'year'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-4 py-2 rounded-[var(--radius-md)] font-medium text-sm transition ${
                    timeRange === range
                      ? 'bg-[var(--brand-primary)] text-[var(--text-inverse)]'
                      : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]'
                  }`}
                >
                  {range.charAt(0).toUpperCase() + range.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Key Stats Grid */}
          <StatsGrid className="mb-8">
            <StatCard
              title="Total Workouts"
              value={stats.totalWorkouts}
              icon={Dumbbell}
              iconColor="green"
            />
            <StatCard
              title="Habits Logged"
              value={stats.totalHabits}
              icon={Calendar}
              iconColor="blue"
            />
            <StatCard
              title="Goals Completed"
              value={`${stats.goalsCompleted}/${stats.totalGoals}`}
              icon={Target}
              iconColor="purple"
            />
            <StatCard
              title="Current Streak"
              value={`${stats.currentStreak} days`}
              icon={Flame}
              iconColor="orange"
            />
          </StatsGrid>

          {/* Performance Metrics */}
          <div className="grid md:grid-cols-3 gap-5 mb-8">
            <Card>
              <CardContent className="pt-6">
                <Activity className="w-6 h-6 text-[var(--brand-primary)] mb-3" />
                <p className="text-2xl font-bold text-[var(--text-primary)]">{stats.workoutMinutes} min</p>
                <p className="text-sm text-[var(--text-muted)] mb-3">Total Workout Time</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-[var(--bg-tertiary)] rounded-full h-2">
                    <div className="bg-[var(--brand-primary)] h-2 rounded-full" style={{ width: '65%' }}></div>
                  </div>
                  <span className="text-xs text-[var(--text-muted)]">65% of goal</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <Calendar className="w-6 h-6 text-[var(--brand-secondary)] mb-3" />
                <p className="text-2xl font-bold text-[var(--text-primary)]">{stats.habitCompletionRate}%</p>
                <p className="text-sm text-[var(--text-muted)] mb-3">Habit Completion Rate</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-[var(--bg-tertiary)] rounded-full h-2">
                    <div className="bg-[var(--brand-secondary)] h-2 rounded-full" style={{ width: `${stats.habitCompletionRate}%` }}></div>
                  </div>
                  <span className="text-xs text-[var(--success)]">+5%</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <Award className="w-6 h-6 text-purple-400 mb-3" />
                <p className="text-2xl font-bold text-[var(--text-primary)]">Level {stats.level}</p>
                <p className="text-sm text-[var(--text-muted)] mb-3">{stats.totalPoints} total points</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-[var(--bg-tertiary)] rounded-full h-2">
                    <div className="bg-purple-500 h-2 rounded-full" style={{ width: '40%' }}></div>
                  </div>
                  <span className="text-xs text-[var(--text-muted)]">200 to next</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row 1 */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-[var(--brand-primary)]" />
                  <CardTitle>Weekly Activity</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={workoutData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="date" stroke="var(--text-muted)" />
                    <YAxis stroke="var(--text-muted)" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'var(--bg-secondary)', 
                        border: '1px solid var(--border-default)', 
                        borderRadius: 'var(--radius-md)' 
                      }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="workouts" stroke="#22c55e" strokeWidth={2} name="Workouts" />
                    <Line type="monotone" dataKey="habits" stroke="#3b82f6" strokeWidth={2} name="Habits" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Dumbbell className="w-5 h-5 text-[var(--brand-primary)]" />
                  <CardTitle>Workout Types</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={workoutTypes}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                      outerRadius={80}
                      dataKey="value"
                    >
                      {workoutTypes.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'var(--bg-secondary)', 
                        border: '1px solid var(--border-default)', 
                        borderRadius: 'var(--radius-md)' 
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row 2 */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-[var(--brand-secondary)]" />
                  <CardTitle>Habit Completion Trend</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={habitData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="week" stroke="var(--text-muted)" />
                    <YAxis stroke="var(--text-muted)" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'var(--bg-secondary)', 
                        border: '1px solid var(--border-default)', 
                        borderRadius: 'var(--radius-md)' 
                      }}
                    />
                    <Bar dataKey="rate" fill="#3b82f6" name="Completion Rate %" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-purple-400" />
                  <CardTitle>Monthly Progress</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="month" stroke="var(--text-muted)" />
                    <YAxis stroke="var(--text-muted)" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'var(--bg-secondary)', 
                        border: '1px solid var(--border-default)', 
                        borderRadius: 'var(--radius-md)' 
                      }}
                    />
                    <Legend />
                    <Bar dataKey="workouts" fill="#22c55e" name="Workouts" />
                    <Bar dataKey="goals" fill="#8b5cf6" name="Goals Completed" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Insights */}
          <div className="grid md:grid-cols-3 gap-5">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-[var(--brand-primary)]/20 flex items-center justify-center">
                    <Dumbbell className="w-5 h-5 text-[var(--brand-primary)]" />
                  </div>
                  <h4 className="font-semibold text-[var(--text-primary)]">Most Active Day</h4>
                </div>
                <p className="text-2xl font-bold text-[var(--brand-primary)] mb-1">{stats.bestWorkoutDay}</p>
                <p className="text-sm text-[var(--text-muted)]">Your favorite workout day</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-[var(--brand-secondary)]/20 flex items-center justify-center">
                    <Activity className="w-5 h-5 text-[var(--brand-secondary)]" />
                  </div>
                  <h4 className="font-semibold text-[var(--text-primary)]">Avg Duration</h4>
                </div>
                <p className="text-2xl font-bold text-[var(--brand-secondary)] mb-1">{stats.avgWorkoutDuration} min</p>
                <p className="text-sm text-[var(--text-muted)]">Per workout session</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                    <Flame className="w-5 h-5 text-orange-400" />
                  </div>
                  <h4 className="font-semibold text-[var(--text-primary)]">Best Streak</h4>
                </div>
                <p className="text-2xl font-bold text-orange-400 mb-1">{stats.longestStreak} days</p>
                <p className="text-sm text-[var(--text-muted)]">Your longest streak ever</p>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}