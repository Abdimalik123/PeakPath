import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { fetchDashboard } from '../api/dashboard';
import client from '../api/client';
import type { DashboardData } from '../api/dashboard';
import { WorkoutCard } from '../components/WorkoutCard';
import { Navigation } from '../components/Navigation';
import { PageHeader } from '../components/PageHeader';
import { StatCard, StatsGrid } from '../components/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card';
import { Zap, CheckCircle, Target, Flame, Play, Dumbbell, ChevronLeft, ChevronRight } from 'lucide-react';
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
  fire:    'bg-[var(--brand-secondary)]/10 border-[var(--brand-secondary)]/20 text-[var(--brand-secondary)]',
  done:    'bg-[var(--brand-primary)]/10 border-[var(--brand-primary)]/20 text-[var(--brand-primary)]',
  neutral: 'bg-[var(--bg-secondary)] border-[var(--border-default)] text-[var(--text-secondary)]',
};

// ── Component ────────────────────────────────────────────────────────────────
const Dashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Calendar state
  const now = new Date();
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth()); // 0-indexed
  const [calWorkouts, setCalWorkouts] = useState<{ date: string; type: string }[]>([]);
  const [selectedCalDay, setSelectedCalDay] = useState<string | null>(null);

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
    client.get('/workouts').then(res => {
      if (res.data.success) setCalWorkouts(res.data.workouts.map((w: any) => ({ date: w.date, type: w.type })));
    }).catch(() => {});
  }, []);

  const workoutDayMap = useMemo(() => {
    const map: Record<string, string[]> = {};
    calWorkouts.forEach(w => {
      if (!map[w.date]) map[w.date] = [];
      map[w.date].push(w.type);
    });
    return map;
  }, [calWorkouts]);

  const calDays = useMemo(() => {
    const firstDay = new Date(calYear, calMonth, 1);
    const lastDay = new Date(calYear, calMonth + 1, 0);
    const startDow = (firstDay.getDay() + 6) % 7; // Mon = 0
    const days: (Date | null)[] = Array(startDow).fill(null);
    for (let d = 1; d <= lastDay.getDate(); d++) days.push(new Date(calYear, calMonth, d));
    return days;
  }, [calYear, calMonth]);

  const calMonthLabel = new Date(calYear, calMonth, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  const isCurrentMonth = calYear === now.getFullYear() && calMonth === now.getMonth();

  const goPrevMonth = () => {
    if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11); }
    else setCalMonth(m => m - 1);
    setSelectedCalDay(null);
  };
  const goNextMonth = () => {
    if (isCurrentMonth) return;
    if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0); }
    else setCalMonth(m => m + 1);
    setSelectedCalDay(null);
  };

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
                          className="px-4 py-2 rounded-[var(--radius-md)] text-sm font-medium bg-[var(--brand-primary)] text-[var(--text-inverse)] hover:opacity-90 transition"
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

              {/* Calendar */}
              <div id="tour-heatmap">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Calendar</CardTitle>
                      <div className="flex items-center gap-0.5">
                        <button
                          onClick={goPrevMonth}
                          className="p-1 hover:bg-[var(--bg-tertiary)] rounded transition"
                          title="Previous month"
                        >
                          <ChevronLeft className="w-4 h-4 text-[var(--text-muted)]" />
                        </button>
                        <span className="text-xs font-semibold text-[var(--text-muted)] px-1 min-w-[80px] text-center">{calMonthLabel}</span>
                        <button
                          onClick={goNextMonth}
                          disabled={isCurrentMonth}
                          className="p-1 hover:bg-[var(--bg-tertiary)] rounded transition disabled:opacity-30"
                          title="Next month"
                        >
                          <ChevronRight className="w-4 h-4 text-[var(--text-muted)]" />
                        </button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Day-of-week headers */}
                    <div className="grid grid-cols-7 mb-1">
                      {['Mo','Tu','We','Th','Fr','Sa','Su'].map(d => (
                        <span key={d} className="text-[10px] font-semibold text-[var(--text-muted)] text-center">{d}</span>
                      ))}
                    </div>
                    {/* Day cells */}
                    <div className="grid grid-cols-7 gap-0.5">
                      {calDays.map((day, i) => {
                        if (!day) return <div key={`e-${i}`} />;
                        const dateStr = `${day.getFullYear()}-${String(day.getMonth()+1).padStart(2,'0')}-${String(day.getDate()).padStart(2,'0')}`;
                        const isToday = dateStr === today;
                        const hasWorkout = !!workoutDayMap[dateStr];
                        const isSelected = selectedCalDay === dateStr;
                        return (
                          <button
                            key={dateStr}
                            onClick={() => setSelectedCalDay(isSelected ? null : dateStr)}
                            className={`aspect-square flex items-center justify-center rounded text-xs font-medium transition ${
                              hasWorkout
                                ? 'bg-[var(--brand-primary)] text-[var(--text-inverse)] hover:opacity-80'
                                : isToday
                                ? 'border border-[var(--brand-primary)]/60 text-[var(--brand-primary)] hover:bg-[var(--bg-tertiary)]'
                                : 'text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)]'
                            } ${isSelected ? 'ring-2 ring-offset-1 ring-[var(--brand-primary)]' : ''}`}
                          >
                            {day.getDate()}
                          </button>
                        );
                      })}
                    </div>

                    {/* Selected day detail */}
                    {selectedCalDay && (
                      <div className="mt-3 pt-3 border-t border-[var(--border-default)]">
                        <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
                          {new Date(selectedCalDay + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' })}
                        </p>
                        {workoutDayMap[selectedCalDay]?.length > 0 ? (
                          workoutDayMap[selectedCalDay].map((type, i) => (
                            <div key={i} className="flex items-center gap-2 py-0.5">
                              <Dumbbell className="w-3.5 h-3.5 text-[var(--brand-primary)] flex-shrink-0" />
                              <span className="text-sm font-medium text-[var(--text-primary)]">{type}</span>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-[var(--text-muted)]">Rest day</p>
                        )}
                      </div>
                    )}

                    <div className="flex items-center gap-1.5 mt-3 text-[10px] text-[var(--text-muted)]">
                      <div className="w-2.5 h-2.5 rounded-sm bg-[var(--brand-primary)]" />
                      <span>Workout logged</span>
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
