import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchDashboard } from '../api/dashboard';
import type { DashboardData } from '../api/dashboard';
import { WorkoutCard } from '../components/WorkoutCard';
import { Navigation } from '../components/Navigation';
import { PageHeader } from '../components/PageHeader';
import { StatCard, StatsGrid } from '../components/StatCard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/Card';
import { Zap, CheckCircle, Target, Dumbbell, Flame, Play } from 'lucide-react';
import { WorkoutHeatmap } from '../components/WorkoutHeatmap';
import { DailyQuestsWidget } from '../components/DailyQuestsWidget';
import { EmptyStateGuide } from '../components/EmptyStateGuide';
import { StreakProtection } from '../components/StreakProtection';
import { ComebackBanner } from '../components/ComebackBanner';

const Dashboard: React.FC = () => {
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="text-[var(--brand-primary)] text-lg font-medium">Loading dashboard...</div>
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="text-[var(--error)] text-lg">{error || 'Failed to load dashboard'}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <Navigation currentPage="/dashboard" />

      <div className="lg:ml-64 min-h-screen pt-14 lg:pt-16 pb-20 lg:pb-0">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">

          <PageHeader
            title={`Welcome back, ${dashboardData.user.name}`}
            subtitle="Your fitness overview for today"
          />

          {/* Re-engagement banners */}
          <ComebackBanner />
          <StreakProtection />

          {/* Empty State Guide for new users */}
          {dashboardData.recent_workouts.length === 0 && dashboardData.active_goals.length === 0 && (
            <div className="mb-6">
              <EmptyStateGuide type="dashboard" />
            </div>
          )}

          {/* Section 1: Quick Stats */}
          <StatsGrid className="mb-6">
            <StatCard
              title="Workouts Today"
              value={dashboardData.today.workouts_completed}
              icon={Zap}
              iconColor="green"
              badge="Today"
            />
            <StatCard
              title="Habits Logged"
              value={dashboardData.today.habits_logged}
              icon={CheckCircle}
              iconColor="green"
              badge="Today"
            />
            <StatCard
              title="Active Goals"
              value={dashboardData.active_goals.length}
              icon={Target}
              iconColor="green"
              badge="Active"
            />
            <StatCard
              title="Workout Streak"
              value={dashboardData.streaks?.current_workout_streak || 0}
              icon={Flame}
              iconColor="green"
              badge={`Best: ${dashboardData.streaks?.longest_workout_streak || 0}`}
            />
          </StatsGrid>

          {/* Section 2: Today's Actions + Streak Heatmap */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

            {/* Left: Daily Quests + Recent Workouts */}
            <div className="lg:col-span-2 space-y-6">
              <DailyQuestsWidget />

              {/* Recent Workouts (compact) */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Recent Sessions</CardTitle>
                    <Link to="/train" className="text-sm text-[var(--brand-primary)] font-medium hover:underline">
                      View all
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  {dashboardData.recent_workouts.length === 0 ? (
                    <p className="text-[var(--text-muted)] text-center py-6 text-sm">No workouts yet. Start your first session!</p>
                  ) : (
                    <div className="space-y-3">
                      {dashboardData.recent_workouts.slice(0, 3).map((workout) => (
                        <WorkoutCard key={workout.id} workout={workout} onClick={() => {}} />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right: Heatmap + Quick Actions */}
            <div className="space-y-6">
              <WorkoutHeatmap />

              {/* Active Goals (compact) */}
              {dashboardData.active_goals.length > 0 && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Active Goals</CardTitle>
                      <Link to="/habits" className="text-sm text-[var(--brand-primary)] font-medium hover:underline">
                        All goals
                      </Link>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {dashboardData.active_goals.slice(0, 2).map((goal) => (
                        <div key={goal.id} className="flex items-center gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-[var(--text-primary)] truncate">{goal.name}</p>
                            <div className="w-full bg-[var(--bg-tertiary)] rounded-full h-1.5 mt-1">
                              <div
                                className="bg-[var(--brand-primary)] h-1.5 rounded-full"
                                style={{ width: `${goal.target > 0 ? Math.min(100, (goal.progress / goal.target) * 100) : 0}%` }}
                              />
                            </div>
                          </div>
                          <span className="text-xs text-[var(--text-muted)] whitespace-nowrap">
                            {goal.target > 0 ? Math.round((goal.progress / goal.target) * 100) : 0}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Floating Action Button - Start Workout */}
      <Link
        to="/active-workout"
        className="fixed bottom-24 right-6 lg:bottom-8 lg:right-8 z-40 w-14 h-14 bg-[var(--brand-primary)] text-[var(--text-inverse)] rounded-full shadow-lg hover:opacity-90 transition flex items-center justify-center group"
        title="Start Workout"
      >
        <Play className="w-6 h-6 ml-0.5" />
        <span className="absolute right-full mr-3 px-3 py-1.5 bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-lg text-sm font-medium text-[var(--text-primary)] whitespace-nowrap opacity-0 group-hover:opacity-100 transition pointer-events-none hidden lg:block shadow-lg">
          Start Workout
        </span>
      </Link>
    </div>
  );
};

export default Dashboard;
