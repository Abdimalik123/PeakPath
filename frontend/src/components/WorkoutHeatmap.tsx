import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Flame, Dumbbell } from 'lucide-react';
import client from '../api/client';

interface WorkoutDay {
  date: string;
  type?: string;
}

interface WorkoutHeatmapProps {
  userId?: number;
}

export function WorkoutHeatmap({ userId }: WorkoutHeatmapProps) {
  const [workoutsByDate, setWorkoutsByDate] = useState<Map<string, string[]>>(new Map());
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [currentStreak, setCurrentStreak] = useState(0);
  const [monthWorkoutCount, setMonthWorkoutCount] = useState(0);

  useEffect(() => {
    loadWorkoutData();
  }, [userId]);

  useEffect(() => {
    // Count workouts in current displayed month
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    let count = 0;
    workoutsByDate.forEach((_, dateStr) => {
      const d = new Date(dateStr);
      if (d.getFullYear() === year && d.getMonth() === month) count++;
    });
    setMonthWorkoutCount(count);
  }, [currentMonth, workoutsByDate]);

  const loadWorkoutData = async () => {
    try {
      setLoading(true);
      const response = await client.get('/workouts');
      if (response.data.success) {
        const dateMap = new Map<string, string[]>();
        for (const w of response.data.workouts) {
          const dateStr = w.date.split('T')[0];
          const types = dateMap.get(dateStr) || [];
          if (w.type) types.push(w.type);
          dateMap.set(dateStr, types);
        }
        setWorkoutsByDate(dateMap);
        calculateStreak(new Set(dateMap.keys()));
      }
    } catch (error) {
      console.error('Failed to load workout data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStreak = (dates: Set<string>) => {
    const sortedDates = Array.from(dates).sort().reverse();
    if (sortedDates.length === 0) { setCurrentStreak(0); return; }
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Match backend logic: streak can start from today OR yesterday
    // (user may not have worked out yet today but still has an active streak)
    const todayStr = today.toISOString().split('T')[0];
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    let checkDate = new Date(today);
    if (!dates.has(todayStr) && dates.has(yesterdayStr)) {
      // No workout today yet but had one yesterday — start from yesterday
      checkDate = yesterday;
    }

    for (let i = 0; i < sortedDates.length; i++) {
      const workoutDate = new Date(sortedDates[i]);
      workoutDate.setHours(0, 0, 0, 0);
      const expected = new Date(checkDate);
      expected.setDate(checkDate.getDate() - streak);
      expected.setHours(0, 0, 0, 0);
      if (workoutDate.getTime() === expected.getTime()) {
        streak++;
      } else {
        break;
      }
    }
    setCurrentStreak(streak);
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDayOfWeek = firstDay.getDay(); // 0=Sun
    const daysInMonth = lastDay.getDate();

    const days: { date: string; day: number; isCurrentMonth: boolean; isToday: boolean }[] = [];

    // Previous month padding
    for (let i = 0; i < startDayOfWeek; i++) {
      const d = new Date(year, month, -(startDayOfWeek - 1 - i));
      days.push({
        date: d.toISOString().split('T')[0],
        day: d.getDate(),
        isCurrentMonth: false,
        isToday: false,
      });
    }

    // Current month
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      days.push({
        date: date.toISOString().split('T')[0],
        day: d,
        isCurrentMonth: true,
        isToday: date.getTime() === today.getTime(),
      });
    }

    // Next month padding to fill 6 rows
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      days.push({
        date: d.toISOString().split('T')[0],
        day: d.getDate(),
        isCurrentMonth: false,
        isToday: false,
      });
    }

    return days;
  };

  const navigateMonth = (delta: number) => {
    setCurrentMonth(prev => {
      const next = new Date(prev);
      next.setMonth(next.getMonth() + delta);
      return next;
    });
  };

  const monthLabel = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const days = getDaysInMonth(currentMonth);
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  if (loading) {
    return (
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-[var(--bg-tertiary)] rounded w-1/3 mb-4"></div>
          <div className="h-48 bg-[var(--bg-tertiary)] rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-lg font-bold text-[var(--text-primary)] mb-1">Workout Calendar</h3>
          <p className="text-sm text-[var(--text-muted)]">{monthWorkoutCount} workout{monthWorkoutCount !== 1 ? 's' : ''} this month</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/30 rounded-lg">
          <Flame className="w-5 h-5 text-orange-500" />
          <div>
            <p className="text-xs text-[var(--text-muted)]">Streak</p>
            <p className="text-xl font-bold text-orange-500">{currentStreak} days</p>
          </div>
        </div>
      </div>

      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => navigateMonth(-1)}
          className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] transition text-[var(--text-muted)] hover:text-[var(--text-primary)]"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h4 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">{monthLabel}</h4>
        <button
          onClick={() => navigateMonth(1)}
          className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] transition text-[var(--text-muted)] hover:text-[var(--text-primary)]"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {weekDays.map(day => (
          <div key={day} className="text-center text-xs font-bold text-[var(--text-muted)] py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, idx) => {
          const workoutTypes = workoutsByDate.get(day.date) || [];
          const hasWorkout = workoutTypes.length > 0;

          return (
            <div
              key={idx}
              className={`relative aspect-square flex flex-col items-center justify-center rounded-lg text-sm transition cursor-default ${
                !day.isCurrentMonth
                  ? 'text-[var(--text-muted)]/30'
                  : day.isToday
                    ? 'ring-2 ring-[var(--brand-primary)] font-bold text-[var(--text-primary)]'
                    : hasWorkout
                      ? 'bg-[var(--brand-primary)]/15 text-[var(--brand-primary)] font-semibold'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'
              }`}
              title={hasWorkout ? `${day.date}: ${workoutTypes.join(', ')}` : day.date}
            >
              <span className="text-xs">{day.day}</span>
              {hasWorkout && day.isCurrentMonth && (
                <Dumbbell className="w-3 h-3 text-[var(--brand-primary)] mt-0.5" />
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-[var(--border-subtle)]">
        <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-[var(--brand-primary)]/15 flex items-center justify-center">
              <Dumbbell className="w-2 h-2 text-[var(--brand-primary)]" />
            </div>
            <span>Workout day</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded ring-2 ring-[var(--brand-primary)]"></div>
            <span>Today</span>
          </div>
        </div>
        <div className="text-xs text-[var(--text-muted)]">
          {currentStreak > 0 ? (
            <span className="text-orange-500 font-bold">Keep the streak alive!</span>
          ) : (
            <span>Start a new streak today!</span>
          )}
        </div>
      </div>
    </div>
  );
}
