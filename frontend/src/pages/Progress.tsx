import { useState, useEffect } from 'react';
import { Navigation } from '../components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card';
import { StatCard, StatsGrid } from '../components/StatCard';
import { WeightTracker } from '../components/WeightTracker';
import { ExerciseProgressionChart } from '../components/ExerciseProgressionChart';
import { useToast } from '../contexts/ToastContext';
import ProgressPhotos from './ProgressPhotos';
import {
  TrendingUp, Dumbbell, Calendar, Target, Flame, Award, Activity,
  BarChart3, Scale
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import client from '../api/client';

interface AnalyticsData {
  stats: {
    total_workouts: number;
    total_duration: number;
    avg_duration: number;
    habits_completed: number;
    habit_completion_rate: number;
    active_goals: number;
    completed_goals: number;
    total_points: number;
    level: number;
    points_to_next_level: number;
    current_streak: number;
    longest_streak: number;
    best_day: string;
    most_frequent_workout: string;
  };
  daily_activity: { date: string; label: string; workouts: number; habits: number }[];
  workout_types: { name: string; value: number; color: string }[];
  volume_trend: { label: string; volume: number }[];
}

export default function Progress() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'overview' | 'strength' | 'body'>('overview');
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [selectedExerciseId, setSelectedExerciseId] = useState<number | null>(null);
  const [exercises, setExercises] = useState<{ id: number; name: string }[]>([]);

  useEffect(() => { loadAnalytics(); }, [timeRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const [analyticsRes, exercisesRes] = await Promise.all([
        client.get(`/analytics/enhanced?range=${timeRange}`),
        client.get('/exercises'),
      ]);
      if (analyticsRes.data.success) setAnalyticsData(analyticsRes.data);
      if (exercisesRes.data.success || Array.isArray(exercisesRes.data)) {
        const list = Array.isArray(exercisesRes.data) ? exercisesRes.data : exercisesRes.data.exercises || [];
        setExercises(list.map((e: any) => ({ id: e.id, name: e.name })));
      }
    } catch {
      console.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const tooltipStyle = {
    backgroundColor: 'var(--bg-secondary)',
    border: '1px solid var(--border-default)',
    borderRadius: 'var(--radius-md)',
  };

  const tabs = [
    { key: 'overview' as const, label: 'Overview', icon: BarChart3 },
    { key: 'strength' as const, label: 'Strength', icon: Dumbbell },
    { key: 'body' as const, label: 'Body', icon: Scale },
  ];

  if (loading || !analyticsData) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)]">
        <Navigation currentPage="/progress" />
        <div className="lg:ml-64 min-h-screen flex items-center justify-center pt-14 lg:pt-16">
          <div className="w-12 h-12 border-4 border-[var(--brand-primary)] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  const { stats } = analyticsData;

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <Navigation currentPage="/progress" />

      <div className="lg:ml-64 min-h-screen pt-14 lg:pt-16 pb-20 lg:pb-0">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] flex items-center gap-3">
                <TrendingUp className="w-7 h-7 text-[var(--brand-primary)]" />
                Progress
              </h1>
              <p className="text-sm text-[var(--text-muted)] mt-1">Track your fitness journey</p>
            </div>
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

          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b border-[var(--border-default)] overflow-x-auto">
            {tabs.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`px-5 py-3 font-semibold text-sm transition whitespace-nowrap flex items-center gap-2 ${
                  activeTab === key
                    ? 'text-[var(--brand-primary)] border-b-2 border-[var(--brand-primary)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>

          {/* ── OVERVIEW TAB ── */}
          {activeTab === 'overview' && (
            <>
              <StatsGrid className="mb-8">
                <StatCard title="Total Workouts" value={stats.total_workouts} icon={Dumbbell} iconColor="green" />
                <StatCard title="Habits Completed" value={stats.habits_completed} icon={Calendar} iconColor="blue" />
                <StatCard title="Goals Completed" value={`${stats.completed_goals}/${stats.active_goals + stats.completed_goals}`} icon={Target} iconColor="purple" />
                <StatCard title="Current Streak" value={`${stats.current_streak} days`} icon={Flame} iconColor="orange" />
              </StatsGrid>

              <div className="grid md:grid-cols-3 gap-5 mb-8">
                <Card>
                  <CardContent className="pt-6">
                    <Activity className="w-6 h-6 text-[var(--brand-primary)] mb-3" />
                    <p className="text-2xl font-bold text-[var(--text-primary)]">{stats.total_duration} min</p>
                    <p className="text-sm text-[var(--text-muted)] mb-3">Total Workout Time</p>
                    <p className="text-xs text-[var(--text-muted)]">Avg {stats.avg_duration} min per session</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <Calendar className="w-6 h-6 text-[var(--brand-secondary)] mb-3" />
                    <p className="text-2xl font-bold text-[var(--text-primary)]">{stats.habit_completion_rate}%</p>
                    <p className="text-sm text-[var(--text-muted)] mb-3">Habit Completion Rate</p>
                    <div className="flex-1 bg-[var(--bg-tertiary)] rounded-full h-2">
                      <div className="bg-[var(--brand-secondary)] h-2 rounded-full" style={{ width: `${stats.habit_completion_rate}%` }} />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <Award className="w-6 h-6 text-purple-400 mb-3" />
                    <p className="text-2xl font-bold text-[var(--text-primary)]">Level {stats.level}</p>
                    <p className="text-sm text-[var(--text-muted)] mb-3">{stats.total_points} total points</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-[var(--bg-tertiary)] rounded-full h-2">
                        <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${Math.max(5, 100 - (stats.points_to_next_level / (stats.level * 100)) * 100)}%` }} />
                      </div>
                      <span className="text-xs text-[var(--text-muted)]">{stats.points_to_next_level} to next</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Daily Activity Chart */}
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-[var(--brand-primary)]" />
                      <CardTitle>Daily Activity</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <AreaChart data={analyticsData.daily_activity}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis dataKey="label" stroke="var(--text-muted)" tick={{ fontSize: 11 }} interval={timeRange === 'week' ? 0 : timeRange === 'month' ? 4 : 30} />
                        <YAxis stroke="var(--text-muted)" />
                        <Tooltip contentStyle={tooltipStyle} />
                        <Legend />
                        <Area type="monotone" dataKey="workouts" stroke="#22c55e" fill="#22c55e" fillOpacity={0.2} strokeWidth={2} name="Workouts" />
                        <Area type="monotone" dataKey="habits" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} strokeWidth={2} name="Habits" />
                      </AreaChart>
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
                    {analyticsData.workout_types.length > 0 ? (
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie data={analyticsData.workout_types} cx="50%" cy="50%" labelLine={false}
                            label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                            outerRadius={80} dataKey="value">
                            {analyticsData.workout_types.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={tooltipStyle} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-[250px] text-[var(--text-muted)]">No workout data yet</div>
                    )}
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
                    <p className="text-2xl font-bold text-[var(--brand-primary)] mb-1">{stats.best_day}</p>
                    <p className="text-sm text-[var(--text-muted)]">Your favorite workout day</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-[var(--brand-secondary)]/20 flex items-center justify-center">
                        <Activity className="w-5 h-5 text-[var(--brand-secondary)]" />
                      </div>
                      <h4 className="font-semibold text-[var(--text-primary)]">Top Workout</h4>
                    </div>
                    <p className="text-2xl font-bold text-[var(--brand-secondary)] mb-1">{stats.most_frequent_workout}</p>
                    <p className="text-sm text-[var(--text-muted)]">Most frequent type</p>
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
                    <p className="text-2xl font-bold text-orange-400 mb-1">{stats.longest_streak} days</p>
                    <p className="text-sm text-[var(--text-muted)]">Your longest streak ever</p>
                  </CardContent>
                </Card>
              </div>
            </>
          )}

          {/* ── STRENGTH TAB ── */}
          {activeTab === 'strength' && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-purple-400" />
                      <CardTitle>Volume Trend (kg)</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {analyticsData.volume_trend.length > 0 && analyticsData.volume_trend.some(v => v.volume > 0) ? (
                      <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={analyticsData.volume_trend}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                          <XAxis dataKey="label" stroke="var(--text-muted)" tick={{ fontSize: 11 }} />
                          <YAxis stroke="var(--text-muted)" />
                          <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => [`${value.toLocaleString()} kg`, 'Volume']} />
                          <Bar dataKey="volume" fill="#8b5cf6" name="Weekly Volume" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-[280px] text-[var(--text-muted)]">
                        Log workouts with weights to see volume trends
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-[var(--brand-primary)]" />
                      <CardTitle>Exercise Progression</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4">
                      <select
                        value={selectedExerciseId ?? ''}
                        onChange={(e) => setSelectedExerciseId(e.target.value ? Number(e.target.value) : null)}
                        className="w-full sm:w-64 px-3 py-2 rounded-[var(--radius-md)] bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-default)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]"
                      >
                        <option value="">Select an exercise...</option>
                        {exercises.map((exercise) => (
                          <option key={exercise.id} value={exercise.id}>{exercise.name}</option>
                        ))}
                      </select>
                    </div>
                    {selectedExerciseId ? (
                      <ExerciseProgressionChart
                        exerciseId={selectedExerciseId}
                        exerciseName={exercises.find((e) => e.id === selectedExerciseId)?.name || ''}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-48 text-[var(--text-muted)]">
                        <p>Select an exercise to view progression.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* ── BODY TAB ── */}
          {activeTab === 'body' && (
            <div className="space-y-8">
              <WeightTracker />
              <ProgressPhotos embedded />
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
