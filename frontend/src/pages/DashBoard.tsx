import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchDashboard } from '../api/dashboard';
import type { DashboardData } from '../api/dashboard';
import { WorkoutCard } from '../components/WorkoutCard';
import { GoalProgress } from '../components/GoalProgress';
import { WeeklyOverview } from '../components/WeeklyOverview';
import { Navigation } from '../components/Navigation';
import { PageHeader } from '../components/PageHeader';
import { StatCard, StatsGrid } from '../components/StatCard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/Card';
import { Zap, CheckCircle, Target, Dumbbell, ArrowRight } from 'lucide-react';
import { WorkoutHeatmap } from '../components/WorkoutHeatmap';
import { DailyQuestsWidget } from '../components/DailyQuestsWidget';
import { WeightTracker } from '../components/WeightTracker';
import { EmptyStateGuide } from '../components/EmptyStateGuide';

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

  const getDayName = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
  };

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

      {/* Main Content - with sidebar offset */}
      <div className="lg:ml-64 min-h-screen pt-16 lg:pt-0">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
          
          <PageHeader 
            title={`Welcome back, ${dashboardData.user.name}`}
            subtitle="Your fitness overview for today"
          />

          {/* Weekly Overview */}
          <div className="mb-8">
            <WeeklyOverview />
          </div>

          {/* Workout Heatmap */}
          <div className="mb-8">
            <WorkoutHeatmap />
          </div>

          {/* Empty State Guide for new users */}
          {dashboardData.recent_workouts.length === 0 && dashboardData.active_goals.length === 0 && (
            <div className="mb-8">
              <EmptyStateGuide type="dashboard" />
            </div>
          )}

          {/* Stats Grid */}
          <StatsGrid className="mb-8">
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
              title="Recent Workouts"
              value={dashboardData.recent_workouts.length}
              icon={Dumbbell}
              iconColor="green"
              badge="Recent"
            />
          </StatsGrid>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Weekly Activity Chart */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Weekly Activity</CardTitle>
                      <CardDescription>Training volume over the last 7 days</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end justify-between h-48 gap-2">
                    {dashboardData.weekly_activity.map((day, idx) => {
                      const totalActivity = day.workouts + day.habits;
                      const maxActivity = Math.max(...dashboardData.weekly_activity.map(d => d.workouts + d.habits), 1);
                      const height = `${(totalActivity / maxActivity) * 100}%`;
                      
                      return (
                        <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                          <div className="w-full bg-[var(--bg-tertiary)] rounded-t-[var(--radius-sm)] relative group cursor-pointer" style={{height: height || '5%'}}>
                            <div className="absolute inset-0 bg-[var(--brand-primary)] rounded-t-[var(--radius-sm)] transition-all group-hover:opacity-80"></div>
                            <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-xs font-medium text-[var(--text-primary)] opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                              {day.workouts}W / {day.habits}H
                            </span>
                          </div>
                          <span className="text-xs font-medium text-[var(--text-muted)]">{getDayName(day.date)}</span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Workouts */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Recent Sessions</CardTitle>
                      <CardDescription>Last {dashboardData.recent_workouts.length} workouts</CardDescription>
                    </div>
                    <Link to="/workouts" className="pp-btn-ghost text-sm">
                      View all <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  {dashboardData.recent_workouts.length === 0 ? (
                    <p className="text-[var(--text-muted)] text-center py-8">No workouts yet. Start your first workout!</p>
                  ) : (
                    <div className="space-y-3">
                      {dashboardData.recent_workouts.map((workout) => (
                        <WorkoutCard 
                          key={workout.id} 
                          workout={workout} 
                          onClick={() => {}}
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              
              {/* Daily Quests */}
              <DailyQuestsWidget />
              
              {/* Weight Tracker */}
              <WeightTracker />

              {/* Active Goals */}
              <Card>
                <CardHeader>
                  <CardTitle>Active Goals</CardTitle>
                  <CardDescription>In progress</CardDescription>
                </CardHeader>
                <CardContent>
                  {dashboardData.active_goals.length === 0 ? (
                    <p className="text-[var(--text-muted)] text-center py-4 text-sm">No active goals. Create one!</p>
                  ) : (
                    <div className="space-y-4">
                      {dashboardData.active_goals.slice(0, 3).map((goal) => (
                        <GoalProgress key={goal.id} goal={goal} />
                      ))}
                    </div>
                  )}
                  {dashboardData.active_goals.length > 0 && (
                    <Link to="/goals" className="block mt-6 text-center text-[var(--brand-primary)] text-sm font-medium hover:underline">
                      View all goals →
                    </Link>
                  )}
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Command Center</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Link to="/workouts" className="flex items-center gap-3 p-3 bg-[var(--bg-tertiary)] hover:bg-[var(--bg-tertiary)]/80 rounded-[var(--radius-md)] transition text-sm font-medium text-[var(--text-primary)]">
                      <Zap className="w-4 h-4 text-[var(--brand-primary)]" />
                      Log Workout
                    </Link>
                    <Link to="/habits" className="flex items-center gap-3 p-3 bg-[var(--bg-tertiary)] hover:bg-[var(--bg-tertiary)]/80 rounded-[var(--radius-md)] transition text-sm font-medium text-[var(--text-primary)]">
                      <CheckCircle className="w-4 h-4 text-[var(--brand-primary)]" />
                      Complete Habit
                    </Link>
                    <Link to="/goals" className="flex items-center gap-3 p-3 bg-[var(--bg-tertiary)] hover:bg-[var(--bg-tertiary)]/80 rounded-[var(--radius-md)] transition text-sm font-medium text-[var(--text-primary)]">
                      <Target className="w-4 h-4 text-[var(--brand-primary)]" />
                      View Goals
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;