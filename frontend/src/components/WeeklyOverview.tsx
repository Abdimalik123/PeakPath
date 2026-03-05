import { useEffect, useState } from 'react';
import { Dumbbell, Target, CheckCircle, TrendingUp, Flame, Award } from 'lucide-react';
import { StreakCalendar } from './StreakCalendar';
import client from '../api/client';

interface OverviewData {
  workouts_this_week: number;
  total_workout_duration: number;
  habits_completed: number;
  active_goals: number;
  completed_goals_this_week: number;
  points_this_week: number;
  current_level: number;
  total_points: number;
  points_to_next_level: number;
  workout_streak: number;
}

export function WeeklyOverview() {
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOverview();
  }, []);

  const loadOverview = async () => {
    try {
      const response = await client.get('/analytics/weekly-overview');
      if (response.data.success) {
        setOverview(response.data.overview);
      }
    } catch (error) {
      console.error('Failed to load overview:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="pp-card p-6 animate-pulse">
            <div className="h-4 bg-[var(--bg-tertiary)] rounded w-1/2 mb-4"></div>
            <div className="h-8 bg-[var(--bg-tertiary)] rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!overview) return null;

  const progressPercentage = overview.points_to_next_level > 0
    ? ((overview.total_points % (overview.current_level * 100)) / (overview.current_level * 100)) * 100
    : 0;

  return (
    <div className="space-y-6">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Workouts */}
        <div className="pp-card p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-[var(--brand-primary)]/10 rounded-lg">
              <Dumbbell className="w-5 h-5 text-[var(--brand-primary)]" />
            </div>
            <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">This Week</span>
          </div>
          <div className="space-y-1">
            <p className="text-3xl font-bold text-[var(--text-primary)]">{overview.workouts_this_week}</p>
            <p className="text-sm text-[var(--text-muted)]">Workouts</p>
            <p className="text-xs text-[var(--text-muted)] mt-2">{overview.total_workout_duration} min total</p>
          </div>
        </div>

        {/* Habits */}
        <div className="pp-card p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
            <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Completed</span>
          </div>
          <div className="space-y-1">
            <p className="text-3xl font-bold text-[var(--text-primary)]">{overview.habits_completed}</p>
            <p className="text-sm text-[var(--text-muted)]">Habits</p>
          </div>
        </div>

        {/* Goals */}
        <div className="pp-card p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <Target className="w-5 h-5 text-purple-500" />
            </div>
            <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Active</span>
          </div>
          <div className="space-y-1">
            <p className="text-3xl font-bold text-[var(--text-primary)]">{overview.active_goals}</p>
            <p className="text-sm text-[var(--text-muted)]">Goals</p>
            {overview.completed_goals_this_week > 0 && (
              <p className="text-xs text-green-500 mt-2">+{overview.completed_goals_this_week} completed this week!</p>
            )}
          </div>
        </div>

        {/* Points */}
        <div className="pp-card p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-yellow-500/10 rounded-lg">
              <TrendingUp className="w-5 h-5 text-yellow-500" />
            </div>
            <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">This Week</span>
          </div>
          <div className="space-y-1">
            <p className="text-3xl font-bold text-[var(--text-primary)]">+{overview.points_this_week}</p>
            <p className="text-sm text-[var(--text-muted)]">Points Earned</p>
          </div>
        </div>
      </div>

      {/* Level Progress & Streak */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Level Progress */}
        <div className="pp-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[var(--brand-primary)]/10 rounded-lg">
                <Award className="w-5 h-5 text-[var(--brand-primary)]" />
              </div>
              <div>
                <h3 className="font-bold text-[var(--text-primary)]">Level {overview.current_level}</h3>
                <p className="text-xs text-[var(--text-muted)]">{overview.total_points.toLocaleString()} total points</p>
              </div>
            </div>
            <span className="text-sm font-bold text-[var(--brand-primary)]">
              {overview.points_to_next_level} to next
            </span>
          </div>
          <div className="relative h-3 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-secondary)] rounded-full transition-all duration-500"
              style={{ width: `${Math.min(progressPercentage, 100)}%` }}
            />
          </div>
        </div>

        {/* Workout Streak */}
        <StreakCalendar streak={overview.workout_streak} title="Workout Streak" />
      </div>
    </div>
  );
}
