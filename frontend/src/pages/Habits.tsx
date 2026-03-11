import React, { useEffect, useState, useMemo } from 'react';
import client from '../api/client';
import { useToast } from '../contexts/ToastContext';
import { HabitCard } from '../components/HabitCard';
import { Navigation } from '../components/Navigation';
import { PageHeader } from '../components/PageHeader';
import { EmptyState } from '../components/EmptyState';
import { Modal } from '../components/Modal';
import { FormInput } from '../components/FormInput';
import { GoalProgress } from '../components/GoalProgress';
import { GoalDetails } from '../components/GoalDetails';
import { AddGoalModal } from '../components/AddGoalModal';
import { useGoals } from '../hooks/useGoals';
import {
  CheckCircle2, Flame, Target, Plus, Calendar, TrendingUp, ChevronLeft, ChevronRight
} from 'lucide-react';

interface Habit {
  id: number;
  name: string;
  frequency: string;
  reminder_time: string;
  description: string;
  next_occurrence: string;
  created_at: string;
}

interface HabitLog {
  id: number;
  timestamp: string;
  completed: boolean;
  amount: number;
  notes: string;
}

const SUGGESTED_HABITS = [
  { name: 'Drink 2L Water', description: 'Stay hydrated throughout the day', frequency: 'daily' },
  { name: 'Morning Stretch', description: '10 minutes of stretching after waking up', frequency: 'daily' },
  { name: '10,000 Steps', description: 'Walk at least 10,000 steps', frequency: 'daily' },
  { name: '7+ Hours Sleep', description: 'Get adequate rest for recovery', frequency: 'daily' },
  { name: 'Take Vitamins', description: 'Daily supplement routine', frequency: 'daily' },
  { name: 'Meal Prep', description: 'Prepare healthy meals for the week', frequency: 'weekly' },
];

const Habits: React.FC = () => {
  const { showToast } = useToast();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const [habitLogs, setHabitLogs] = useState<HabitLog[]>([]);
  const [allLogs, setAllLogs] = useState<Record<number, HabitLog[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'habits' | 'goals'>('habits');
  const [calendarWeekOffset, setCalendarWeekOffset] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    frequency: 'daily',
    reminder_time: '09:00',
    description: '',
    next_occurrence: new Date().toISOString().split('T')[0]
  });

  // Goals
  const {
    goals, selectedGoal, setSelectedGoal, loading: goalsLoading,
    error: goalsError, formData: goalFormData, setFormData: setGoalFormData,
    handleSubmit: handleGoalSubmit, handleUpdateProgress, handleDelete: handleGoalDelete,
    getProgressPercentage
  } = useGoals();
  const [showAddGoalModal, setShowAddGoalModal] = useState(false);

  useEffect(() => { fetchHabits(); }, []);

  useEffect(() => {
    if (selectedHabit) {
      fetchHabitLogs(selectedHabit.id);
    }
  }, [selectedHabit]);

  // Load logs for all habits (for today's overview and weekly calendar)
  useEffect(() => {
    if (habits.length > 0) {
      loadAllLogs();
    }
  }, [habits]);

  const fetchHabits = async () => {
    try {
      const response = await client.get('/habits');
      if (response.data.success) {
        setHabits(response.data.habits);
      } else {
        setError(response.data.message);
      }
    } catch {
      setError('Failed to load habits');
    } finally {
      setLoading(false);
    }
  };

  const fetchHabitLogs = async (habitId: number) => {
    try {
      const response = await client.get(`/habits/${habitId}/logs`);
      if (response.data.success) {
        setHabitLogs(response.data.logs);
      }
    } catch {
      console.error('Failed to load habit logs');
    }
  };

  const loadAllLogs = async () => {
    const logMap: Record<number, HabitLog[]> = {};
    await Promise.all(
      habits.map(async (habit) => {
        try {
          const res = await client.get(`/habits/${habit.id}/logs`);
          if (res.data.success) {
            logMap[habit.id] = res.data.logs;
          }
        } catch {}
      })
    );
    setAllLogs(logMap);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const response = await client.post('/habits', formData);
      if (response.data.success) {
        setShowAddModal(false);
        setFormData({
          name: '', frequency: 'daily', reminder_time: '09:00',
          description: '', next_occurrence: new Date().toISOString().split('T')[0]
        });
        fetchHabits();
        showToast('Habit created!');
      } else {
        setError(response.data.message);
      }
    } catch {
      setError('Failed to create habit');
    }
  };

  const handleQuickAdd = async (suggestion: typeof SUGGESTED_HABITS[0]) => {
    try {
      const response = await client.post('/habits', {
        name: suggestion.name,
        description: suggestion.description,
        frequency: suggestion.frequency,
        reminder_time: '09:00',
        next_occurrence: new Date().toISOString().split('T')[0]
      });
      if (response.data.success) {
        fetchHabits();
        showToast(`Added "${suggestion.name}"!`);
      }
    } catch {
      showToast('Failed to add habit', 'error');
    }
  };

  const handleLogHabit = async (habitId: number) => {
    try {
      const response = await client.post(`/habits/${habitId}/log`, {
        completed: true,
        timestamp: new Date().toISOString()
      });
      if (response.data.success) {
        showToast('Habit logged!');
        loadAllLogs();
        if (selectedHabit && selectedHabit.id === habitId) {
          fetchHabitLogs(habitId);
        }
      } else {
        setError(response.data.message);
      }
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Failed to log habit', 'error');
    }
  };

  const handleDelete = async (habitId: number) => {
    if (!confirm('Delete this habit?')) return;
    try {
      const response = await client.delete(`/habits/${habitId}`);
      if (response.data.success) {
        fetchHabits();
        setSelectedHabit(null);
        showToast('Habit deleted');
      }
    } catch {
      showToast('Failed to delete habit', 'error');
    }
  };

  const handleGoalFormSubmit = async (e: React.FormEvent) => {
    const success = await handleGoalSubmit(e);
    if (success) { setShowAddGoalModal(false); showToast('Goal created!'); }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const getStreakDays = (logs: HabitLog[]) => {
    if (!logs || logs.length === 0) return 0;
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 0; i < logs.length; i++) {
      const logDate = new Date(logs[i].timestamp);
      logDate.setHours(0, 0, 0, 0);
      const daysDiff = Math.floor((today.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff === i && logs[i].completed) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  };

  // Today's completion status
  const todayStats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const dailyHabits = habits.filter(h => h.frequency === 'daily');
    let completed = 0;
    dailyHabits.forEach(h => {
      const logs = allLogs[h.id] || [];
      const doneToday = logs.some(l => l.completed && l.timestamp.startsWith(today));
      if (doneToday) completed++;
    });
    return {
      total: dailyHabits.length,
      completed,
      percentage: dailyHabits.length > 0 ? Math.round((completed / dailyHabits.length) * 100) : 0
    };
  }, [habits, allLogs]);

  // Check if habit is completed on a given date
  const isHabitDoneOnDate = (habitId: number, dateStr: string) => {
    const logs = allLogs[habitId] || [];
    return logs.some(l => l.completed && l.timestamp.startsWith(dateStr));
  };

  // Weekly calendar dates
  const weekDates = useMemo(() => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + (calendarWeekOffset * 7));
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      return d;
    });
  }, [calendarWeekOffset]);

  const totalStreak = useMemo(() => {
    return habits.reduce((max, h) => {
      const s = getStreakDays(allLogs[h.id] || []);
      return s > max ? s : max;
    }, 0);
  }, [habits, allLogs]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="text-[var(--brand-primary)] text-lg font-medium">Loading habits...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <Navigation currentPage="/habits" />

      <div className="lg:ml-64 min-h-screen pt-14 lg:pt-16 pb-6">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <PageHeader
            title="Habits & Goals"
            subtitle="Build consistency, track progress"
            actionButton={{
              label: activeTab === 'habits' ? "Add Habit" : "New Goal",
              onClick: () => activeTab === 'habits' ? setShowAddModal(true) : setShowAddGoalModal(true),
              icon: <Plus className="w-5 h-5" />
            }}
          />

          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b border-[var(--border-default)]">
            <button
              onClick={() => setActiveTab('habits')}
              className={`px-5 py-3 font-semibold text-sm transition flex items-center gap-2 ${
                activeTab === 'habits'
                  ? 'text-[var(--brand-primary)] border-b-2 border-[var(--brand-primary)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Calendar className="w-4 h-4" /> Habits
            </button>
            <button
              onClick={() => setActiveTab('goals')}
              className={`px-5 py-3 font-semibold text-sm transition flex items-center gap-2 ${
                activeTab === 'goals'
                  ? 'text-[var(--brand-primary)] border-b-2 border-[var(--brand-primary)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Target className="w-4 h-4" /> Goals
            </button>
          </div>

          {activeTab === 'habits' && (
            <>
              {/* Today's Overview */}
              {habits.length > 0 && (
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="pp-card p-4 text-center">
                    <CheckCircle2 className="w-6 h-6 text-[var(--brand-primary)] mx-auto mb-2" />
                    <p className="text-2xl font-bold text-[var(--text-primary)]">{todayStats.completed}/{todayStats.total}</p>
                    <p className="text-xs text-[var(--text-muted)]">Done Today</p>
                  </div>
                  <div className="pp-card p-4 text-center">
                    <TrendingUp className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-[var(--text-primary)]">{todayStats.percentage}%</p>
                    <p className="text-xs text-[var(--text-muted)]">Completion</p>
                  </div>
                  <div className="pp-card p-4 text-center">
                    <Flame className="w-6 h-6 text-orange-400 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-[var(--text-primary)]">{totalStreak}</p>
                    <p className="text-xs text-[var(--text-muted)]">Best Streak</p>
                  </div>
                </div>
              )}

              {/* Weekly Calendar */}
              {habits.length > 0 && (
                <div className="pp-card p-4 mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <button onClick={() => setCalendarWeekOffset(prev => prev - 1)} className="p-1.5 hover:bg-[var(--bg-tertiary)] rounded-lg transition">
                      <ChevronLeft className="w-4 h-4 text-[var(--text-muted)]" />
                    </button>
                    <h3 className="text-sm font-bold text-[var(--text-primary)]">
                      {weekDates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — {weekDates[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </h3>
                    <button
                      onClick={() => setCalendarWeekOffset(prev => Math.min(prev + 1, 0))}
                      disabled={calendarWeekOffset >= 0}
                      className="p-1.5 hover:bg-[var(--bg-tertiary)] rounded-lg transition disabled:opacity-30"
                    >
                      <ChevronRight className="w-4 h-4 text-[var(--text-muted)]" />
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr>
                          <th className="text-left py-1.5 px-2 text-[var(--text-muted)] font-medium w-32">Habit</th>
                          {weekDates.map((d, i) => {
                            const isToday = d.toISOString().split('T')[0] === new Date().toISOString().split('T')[0];
                            return (
                              <th key={i} className={`text-center py-1.5 px-1 font-medium ${isToday ? 'text-[var(--brand-primary)]' : 'text-[var(--text-muted)]'}`}>
                                <div>{['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getDay()]}</div>
                                <div className="text-[10px]">{d.getDate()}</div>
                              </th>
                            );
                          })}
                        </tr>
                      </thead>
                      <tbody>
                        {habits.filter(h => h.frequency === 'daily').map(habit => (
                          <tr key={habit.id} className="border-t border-[var(--border-subtle)]">
                            <td className="py-2 px-2 text-[var(--text-primary)] font-medium truncate max-w-[8rem]">{habit.name}</td>
                            {weekDates.map((d, i) => {
                              const dateStr = d.toISOString().split('T')[0];
                              const done = isHabitDoneOnDate(habit.id, dateStr);
                              return (
                                <td key={i} className="text-center py-2 px-1">
                                  <div className={`w-6 h-6 rounded-full mx-auto flex items-center justify-center ${
                                    done ? 'bg-[var(--brand-primary)] text-white' : 'bg-[var(--bg-tertiary)]'
                                  }`}>
                                    {done && <CheckCircle2 className="w-3.5 h-3.5" />}
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {error && (
                <div className="mb-6 p-4 bg-[var(--error)]/10 border border-[var(--error)]/30 rounded-[var(--radius-lg)]">
                  <p className="text-[var(--error)] text-sm text-center font-medium">{error}</p>
                </div>
              )}

              {/* Habits Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                <div className="lg:col-span-2 space-y-4">
                  {habits.length === 0 ? (
                    <>
                      <EmptyState
                        icon={
                          <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        }
                        title="No Habits Yet"
                        description="Start with a suggested habit or create your own"
                      />
                      {/* Suggested Habits */}
                      <div className="pp-card p-5">
                        <h3 className="text-sm font-bold text-[var(--text-primary)] mb-3">Quick Start Suggestions</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {SUGGESTED_HABITS.map((s, i) => (
                            <button
                              key={i}
                              onClick={() => handleQuickAdd(s)}
                              className="flex items-center gap-3 p-3 rounded-lg bg-[var(--bg-tertiary)] hover:bg-[var(--bg-elevated)] transition text-left"
                            >
                              <Plus className="w-4 h-4 text-[var(--brand-primary)] flex-shrink-0" />
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-[var(--text-primary)] truncate">{s.name}</p>
                                <p className="text-xs text-[var(--text-muted)] truncate">{s.description}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {habits.map((habit) => {
                        const logs = allLogs[habit.id] || [];
                        const today = new Date().toISOString().split('T')[0];
                        const doneToday = logs.some(l => l.completed && l.timestamp.startsWith(today));
                        const habitData = {
                          id: habit.id.toString(),
                          name: habit.name,
                          completed: doneToday,
                          streak: getStreakDays(logs),
                          category: habit.frequency
                        };
                        return (
                          <div key={habit.id} onClick={() => setSelectedHabit(habit)}>
                            <HabitCard
                              habit={habitData}
                              onToggle={(id) => handleLogHabit(parseInt(id))}
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Habit Details Sidebar */}
                <div className="space-y-6">
                  {selectedHabit ? (
                    <>
                      <div className="pp-card p-6">
                        <div className="flex justify-between items-start mb-6">
                          <div>
                            <h3 className="text-xl font-bold text-[var(--text-primary)] mb-1">{selectedHabit.name}</h3>
                            <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider">Habit Details</p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setSelectedHabit(null)}
                              className="p-2 hover:bg-[var(--bg-tertiary)] rounded-lg transition text-[var(--text-muted)]"
                              title="Close"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDelete(selectedHabit.id)}
                              className="p-2 hover:bg-[var(--error)]/10 rounded-lg transition text-[var(--error)]"
                              title="Delete"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>

                        <div className="space-y-4 mb-6">
                          {selectedHabit.description && (
                            <div className="p-4 bg-[var(--bg-tertiary)] rounded-[var(--radius-md)]">
                              <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1">Description</p>
                              <p className="text-sm text-[var(--text-primary)]">{selectedHabit.description}</p>
                            </div>
                          )}
                          <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 bg-[var(--bg-tertiary)] rounded-[var(--radius-md)] text-center">
                              <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1">Frequency</p>
                              <p className="text-sm font-bold text-[var(--text-primary)]">{selectedHabit.frequency}</p>
                            </div>
                            <div className="p-3 bg-[var(--bg-tertiary)] rounded-[var(--radius-md)] text-center">
                              <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1">Reminder</p>
                              <p className="text-sm font-bold text-[var(--text-primary)]">{selectedHabit.reminder_time}</p>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => handleLogHabit(selectedHabit.id)}
                          className="w-full pp-btn-primary py-3 flex items-center justify-center gap-2"
                        >
                          <CheckCircle2 className="w-5 h-5" /> Complete Today
                        </button>
                      </div>

                      <div className="pp-card p-6">
                        <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider mb-4">Current Streak</h3>
                        <div className="flex items-end gap-2 mb-3">
                          <span className="text-5xl font-bold text-[var(--brand-primary)]">{getStreakDays(habitLogs)}</span>
                          <span className="text-[var(--text-muted)] mb-2 uppercase tracking-wider text-sm">days</span>
                        </div>
                        <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider">Keep it going!</p>
                      </div>

                      <div className="pp-card p-6">
                        <h4 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider mb-4">Recent Activity</h4>
                        {habitLogs.length === 0 ? (
                          <p className="text-sm text-[var(--text-muted)] text-center py-4">No logs yet</p>
                        ) : (
                          <div className="space-y-2">
                            {habitLogs.slice(0, 7).map((log) => (
                              <div key={log.id} className="flex items-center justify-between p-3 bg-[var(--bg-tertiary)] rounded-[var(--radius-md)]">
                                <div className="flex items-center gap-3">
                                  <div className={`w-2 h-2 rounded-full ${log.completed ? 'bg-[var(--brand-primary)]' : 'bg-[var(--text-muted)]'}`}></div>
                                  <span className="text-sm text-[var(--text-primary)]">{formatDate(log.timestamp)}</span>
                                </div>
                                <span className="text-xs text-[var(--text-muted)]">{formatTime(log.timestamp)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="pp-card p-12 text-center sticky top-24">
                      <svg className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-[var(--text-muted)] text-sm">Select a habit to view details</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* ── GOALS TAB ── */}
          {activeTab === 'goals' && (
            <>
              {goalsError && (
                <div className="mb-6 p-4 bg-[var(--error)]/10 border border-[var(--error)]/30 rounded-[var(--radius-lg)]">
                  <p className="text-[var(--error)] text-sm text-center font-medium">{goalsError}</p>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                  {goals.length === 0 ? (
                    <div className="pp-card p-12 text-center">
                      <Target className="w-12 h-12 mx-auto mb-4 text-[var(--text-muted)] opacity-40" />
                      <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">No Goals Yet</h3>
                      <p className="text-sm text-[var(--text-muted)] mb-4">Create your first goal to start tracking progress</p>
                      <button onClick={() => setShowAddGoalModal(true)} className="pp-btn-primary">
                        <Plus className="w-4 h-4 inline mr-2" /> Create Goal
                      </button>
                    </div>
                  ) : (
                    goals.map((goal) => {
                      const goalData = {
                        id: goal.id.toString(), name: goal.name, progress: goal.progress,
                        target: goal.target, progress_percentage: getProgressPercentage(goal),
                        category: goal.type, deadline: goal.deadline,
                      };
                      return (
                        <div key={goal.id} onClick={() => setSelectedGoal(goal)}>
                          <GoalProgress goal={goalData} />
                          {goal.pace_info && (goal.pace_info.status === 'behind' || goal.pace_info.status === 'overdue') && (
                            <div className={`mt-2 px-3 py-2 rounded-lg text-xs font-medium ${
                              goal.pace_info.status === 'overdue'
                                ? 'bg-[var(--error)]/10 text-[var(--error)]'
                                : 'bg-orange-500/10 text-orange-500'
                            }`}>
                              {goal.pace_info.status === 'overdue'
                                ? `Overdue — ${goal.pace_info.remaining_progress} remaining`
                                : `Behind pace — ${goal.pace_info.days_remaining} days left, need ${goal.pace_info.required_rate}/day (current: ${goal.pace_info.current_rate}/day)`}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
                <div>
                  {selectedGoal ? (
                    <GoalDetails goal={selectedGoal} onDelete={handleGoalDelete} onUpdateProgress={handleUpdateProgress} onClose={() => setSelectedGoal(null)} />
                  ) : (
                    <div className="pp-card p-12 text-center sticky top-24">
                      <Target className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4 opacity-40" />
                      <p className="text-[var(--text-muted)] text-sm">Select a goal to view details</p>
                    </div>
                  )}
                </div>
              </div>

              <AddGoalModal isOpen={showAddGoalModal} onClose={() => setShowAddGoalModal(false)} onSubmit={handleGoalFormSubmit} formData={goalFormData} setFormData={setGoalFormData} />
            </>
          )}
        </main>
      </div>

      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Create Habit"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormInput
            label="Habit Name"
            value={formData.name}
            onChange={(value) => setFormData({ ...formData, name: value })}
            placeholder="e.g., Morning Meditation"
            required
          />
          <FormInput
            label="Description"
            type="textarea"
            value={formData.description}
            onChange={(value) => setFormData({ ...formData, description: value })}
            placeholder="What does this habit involve?"
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <FormInput
              label="Frequency"
              type="select"
              value={formData.frequency}
              onChange={(value) => setFormData({ ...formData, frequency: value })}
              options={[
                { value: 'daily', label: 'Daily' },
                { value: 'weekly', label: 'Weekly' },
                { value: 'monthly', label: 'Monthly' }
              ]}
            />
            <FormInput
              label="Reminder Time"
              type="time"
              value={formData.reminder_time}
              onChange={(value) => setFormData({ ...formData, reminder_time: value })}
              required
            />
          </div>
          <FormInput
            label="Next Occurrence"
            type="date"
            value={formData.next_occurrence}
            onChange={(value) => setFormData({ ...formData, next_occurrence: value })}
            required
          />
          <button type="submit" className="w-full pp-btn-primary">Create Habit</button>
        </form>
      </Modal>
    </div>
  );
};

export default Habits;
