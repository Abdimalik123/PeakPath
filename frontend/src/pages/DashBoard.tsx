import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { fetchDashboard, DashboardData } from '../api/dashboard';
import { WorkoutCard } from '../components/WorkoutCard';
import { GoalProgress } from '../components/GoalProgress';
import { Navigation } from '../components/Navigation';
import { StatCard, StatsGrid } from '../components/StatCard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/Card';
import { Button } from '../components/Button';
import { Zap, CheckCircle, Target, Dumbbell, TrendingUp, ArrowRight } from 'lucide-react';

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
      <div className="lg:ml-64 min-h-screen">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-1">
              Welcome back, {dashboardData.user.name}
            </h1>
            <p className="text-sm text-[var(--text-muted)]">Here's your fitness overview for today</p>
          </div>

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
              iconColor="blue"
              badge="Today"
            />
            <StatCard
              title="Active Goals"
              value={dashboardData.active_goals.length}
              icon={Target}
              iconColor="purple"
              badge="Active"
            />
            <StatCard
              title="Recent Workouts"
              value={dashboardData.recent_workouts.length}
              icon={Dumbbell}
              iconColor="orange"
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
                    <TrendingUp className="w-5 h-5 text-[var(--brand-primary)]" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end justify-between h-48 gap-2">
                    {dashboardData.weekly_activity.map((day, idx) => {
                      const totalActivity = day.workouts + day.habits;
                      const maxActivity = Math.max(...dashboardData.weekly_activity.map(d => d.workouts + d.habits), 1);
                      const height = `${(totalActivity / maxActivity) * 100}%`;
                      const colors = ['bg-[var(--brand-primary)]', 'bg-[var(--brand-secondary)]', 'bg-purple-500', 'bg-orange-500'];
                      const colorClass = colors[idx % colors.length];
                      
                      return (
                        <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                          <div className="w-full bg-[var(--bg-tertiary)] rounded-t-[var(--radius-sm)] relative group cursor-pointer" style={{height: height || '5%'}}>
                            <div className={`absolute inset-0 ${colorClass} rounded-t-[var(--radius-sm)] transition-all group-hover:opacity-80`}></div>
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
                          onClick={(id) => console.log('Navigate to workout:', id)}
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              
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
              <Card className="bg-gradient-brand border-none">
                <CardContent className="text-white">
                  <h3 className="text-lg font-semibold mb-1">Quick Actions</h3>
                  <p className="text-sm text-white/70 mb-4">Command Center</p>
                  
                  <div className="space-y-2">
                    <Link to="/workouts" className="flex items-center gap-3 p-3 bg-white/20 hover:bg-white/30 rounded-[var(--radius-md)] transition text-sm font-medium">
                      <Zap className="w-4 h-4" />
                      Log Workout
                    </Link>
                    <Link to="/habits" className="flex items-center gap-3 p-3 bg-white/20 hover:bg-white/30 rounded-[var(--radius-md)] transition text-sm font-medium">
                      <CheckCircle className="w-4 h-4" />
                      Complete Habit
                    </Link>
                    <Link to="/goals" className="flex items-center gap-3 p-3 bg-white/20 hover:bg-white/30 rounded-[var(--radius-md)] transition text-sm font-medium">
                      <Target className="w-4 h-4" />
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