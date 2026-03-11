import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchDashboard } from '../api/dashboard';
import type { DashboardData } from '../api/dashboard';
import { WorkoutCard } from '../components/WorkoutCard';
import { Navigation } from '../components/Navigation';
import { PageHeader } from '../components/PageHeader';
import { StatCard, StatsGrid } from '../components/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card';
import { Zap, CheckCircle, Target, Flame, Play, Dumbbell } from 'lucide-react';
import { DailyQuestsWidget } from '../components/DailyQuestsWidget';
import { StreakProtection } from '../components/StreakProtection';
import { DashboardTour } from '../components/DashboardTour';

// ── Motivational message ─────────────────────────────────────────────────────
function getMotivationalMessage(data: DashboardData): { text: string; emoji: string; tone: 'fire' | 'done' | 'neutral' } {
  const streak       = data.streaks?.current_workout_streak || 0;
  const workedOut    = data.today.workouts_completed > 0;
  const loggedHabits = data.today.habits_logged > 0;
  const weekly       = data.weekly_activity.reduce((s, d) => s + d.workouts, 0);

  if (streak >= 30) return { text: `${streak}-day streak — elite consistency. Keep the standard high.`,            emoji: '🔥', tone: 'fire'    };
  if (streak >= 14) return { text: `${streak} days straight. Two weeks of discipline is real character.`,          emoji: '💪', tone: 'fire'    };
  if (streak >= 7)  return { text: `One full week locked in. This is how habits form.`,                             emoji: '⚡', tone: 'fire'    };
  if (workedOut && loggedHabits) return { text: `Workout logged, habits tracked — today's already a win.`,         emoji: '✅', tone: 'done'    };
  if (workedOut)    return { text: `Workout done. Stay consistent and the results follow.`,                         emoji: '✅', tone: 'done'    };
  if (streak > 0)   return { text: `${streak}-day streak on the line — one session keeps it alive.`,               emoji: '🎯', tone: 'neutral' };
  if (weekly >= 4)  return { text: `${weekly} workouts this week. You're building serious momentum.`,               emoji: '📈', tone: 'neutral' };
  if (weekly > 0)   return { text: `${weekly} workout${weekly > 1 ? 's' : ''} this week. Every session counts.`,  emoji: '📈', tone: 'neutral' };
  return               { text: `Every great streak starts with session one. Today is a good day to begin.`,        emoji: '💡', tone: 'neutral' };
}

const TONE_STYLES = {
  fire:    'bg-orange-500/10 border-orange-500/20 text-orange-300',
  done:    'bg-[var(--brand-primary)]/10 border-[var(--brand-primary)]/20 text-[var(--brand-primary)]',
  neutral: 'bg-[var(--bg-secondary)] border-[var(--border-default)] text-[var(--text-secondary)]',
};

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// ── Component ────────────────────────────────────────────────────────────────
const Dashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setDashboardData(await fetchDashboard());
      } catch {
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
      <div className="text-[var(--brand-primary)] text-lg font-medium">Loading dashboard...</div>
    </div>
  );

  if (error || !dashboardData) return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
      <div className="text-[var(--error)] text-lg">{error || 'Failed to load dashboard'}</div>
    </div>
  );

  const streak         = dashboardData.streaks?.current_workout_streak || 0;
  const noWorkoutToday = dashboardData.today.workouts_completed === 0;
  const pendingHabits  = dashboardData.pending_habits || [];
  const motivation     = getMotivationalMessage(dashboardData);
  const today          = new Date().toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <DashboardTour />
      <Navigation currentPage="/dashboard" />

      <div className="lg:ml-64 min-h-screen pt-14 lg:pt-16 pb-6">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-5">

          <PageHeader
            title={`Welcome back, ${dashboardData.user.name}`}
            subtitle="Your fitness overview for today"
          />

          {/* ── Motivational message — top, sets the tone ── */}
          <div className={`rounded-xl px-4 py-3 flex items-center gap-3 border ${TONE_STYLES[motivation.tone]}`}>
            <span className="text-lg flex-shrink-0">{motivation.emoji}</span>
            <p className="text-sm font-medium">{motivation.text}</p>
          </div>

          <StreakProtection />

          {/* ── Stat cards ── */}
          <div id="tour-stats">
            <StatsGrid>
              <StatCard title="Workouts Today" value={dashboardData.today.workouts_completed} icon={Zap}         iconColor="green" badge="Today"  />
              <StatCard title="Habits Logged"  value={dashboardData.today.habits_logged}      icon={CheckCircle} iconColor="green" badge="Today"  />
              <StatCard title="Active Goals"   value={dashboardData.active_goals.length}       icon={Target}      iconColor="green" badge="Active" />
              <StatCard
                title="Workout Streak"
                value={streak}
                icon={Flame}
                iconColor="green"
                badge={`Best: ${dashboardData.streaks?.longest_workout_streak || 0}`}
              />
            </StatsGrid>
          </div>

          {/* ── Quick Actions — only visible when there's something to do ── */}
          {(noWorkoutToday || pendingHabits.length > 0) && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Up next</p>
              <div className="flex flex-col sm:flex-row gap-2">
                {noWorkoutToday && (
                  <Link
                    to="/active-workout"
                    className="flex items-center gap-3 flex-1 px-4 py-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] hover:border-[var(--brand-primary)]/40 hover:bg-[var(--bg-tertiary)] transition group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[var(--brand-primary)]/15 flex items-center justify-center flex-shrink-0">
                      <Dumbbell className="w-4 h-4 text-[var(--brand-primary)]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[var(--text-primary)]">Log today's workout</p>
                      <p className="text-xs text-[var(--text-muted)]">No session recorded yet</p>
                    </div>
                    <span className="text-[var(--text-muted)] group-hover:text-[var(--brand-primary)] transition text-lg">→</span>
                  </Link>
                )}
                {pendingHabits.slice(0, 1).map((habit) => (
                  <Link
                    key={habit.id}
                    to="/habits"
                    className="flex items-center gap-3 flex-1 px-4 py-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] hover:border-[var(--brand-secondary)]/40 hover:bg-[var(--bg-tertiary)] transition group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[var(--brand-secondary)]/15 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-4 h-4 text-[var(--brand-secondary)]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{habit.name}</p>
                      <p className="text-xs text-[var(--text-muted)]">Pending today</p>
                    </div>
                    <span className="text-[var(--text-muted)] group-hover:text-[var(--brand-secondary)] transition text-lg">→</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* ── Main grid: Recent Sessions (left) + This Week + Goals (right) ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

            {/* Left: Recent Sessions */}
            <div className="lg:col-span-2">
              <div id="tour-sessions">
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
                      <div className="py-8 flex flex-col items-center gap-3 text-center">
                        <p className="text-[var(--text-muted)] text-sm">No sessions logged yet.</p>
                        <Link
                          to="/active-workout"
                          className="px-4 py-2 rounded-lg text-sm font-medium bg-[var(--brand-primary)] text-white hover:opacity-90 transition"
                        >
                          Start your first workout
                        </Link>
                      </div>
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
            </div>

            {/* Right column */}
            <div className="space-y-5">

              {/* This Week — compact 7-day grid (workouts + habits) */}
              <div id="tour-heatmap">
                <Card>
                  <CardHeader>
                    <CardTitle>This Week</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-7 gap-1 mb-3">
                      {DAY_LABELS.map((label, i) => {
                        const day   = dashboardData.weekly_activity[i];
                        const isToday = day?.date === today;
                        const hasWorkout = (day?.workouts || 0) > 0;
                        const hasHabit  = (day?.habits  || 0) > 0;
                        return (
                          <div key={label} className="flex flex-col items-center gap-1">
                            <span className={`text-[10px] font-semibold ${isToday ? 'text-[var(--brand-primary)]' : 'text-[var(--text-muted)]'}`}>
                              {label}
                            </span>
                            {/* Workout dot */}
                            <div
                              className={`w-6 h-6 rounded-md flex items-center justify-center ${
                                hasWorkout
                                  ? 'bg-[var(--brand-primary)] text-white'
                                  : isToday
                                  ? 'border border-[var(--brand-primary)]/30 bg-transparent'
                                  : 'bg-[var(--bg-tertiary)]'
                              }`}
                              title={hasWorkout ? `${day.workouts} workout${day.workouts > 1 ? 's' : ''}` : 'No workout'}
                            >
                              {hasWorkout && <Dumbbell className="w-3 h-3" />}
                            </div>
                            {/* Habit dot */}
                            <div
                              className={`w-6 h-6 rounded-md flex items-center justify-center ${
                                hasHabit
                                  ? 'bg-[var(--brand-secondary)]/80 text-white'
                                  : isToday
                                  ? 'border border-[var(--brand-secondary)]/30 bg-transparent'
                                  : 'bg-[var(--bg-tertiary)]'
                              }`}
                              title={hasHabit ? `${day.habits} habit${day.habits > 1 ? 's' : ''}` : 'No habits'}
                            >
                              {hasHabit && <CheckCircle className="w-3 h-3" />}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex items-center gap-4 text-[10px] text-[var(--text-muted)]">
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-sm bg-[var(--brand-primary)]" />
                        <span>Workout</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-sm bg-[var(--brand-secondary)]/80" />
                        <span>Habits</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Active Goals */}
              {dashboardData.active_goals.length > 0 && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Goals</CardTitle>
                      <Link to="/habits" className="text-sm text-[var(--brand-primary)] font-medium hover:underline">
                        All goals
                      </Link>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {dashboardData.active_goals.slice(0, 3).map((goal) => {
                        const pct = goal.target > 0 ? Math.min(100, Math.round((goal.progress / goal.target) * 100)) : 0;
                        return (
                          <div key={goal.id}>
                            <div className="flex items-center justify-between mb-1.5">
                              <p className="text-sm font-medium text-[var(--text-primary)] truncate pr-2">{goal.name}</p>
                              <span className="text-xs font-bold text-[var(--brand-primary)] flex-shrink-0">{pct}%</span>
                            </div>
                            <div className="w-full bg-[var(--bg-tertiary)] rounded-full h-1.5">
                              <div
                                className="bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-secondary)] h-1.5 rounded-full transition-all duration-500"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Daily Quests — compact */}
              <div id="tour-quests">
                <DailyQuestsWidget compact />
              </div>

            </div>
          </div>

        </main>
      </div>

      {/* Floating Action Button */}
      <Link
        id="tour-fab"
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
