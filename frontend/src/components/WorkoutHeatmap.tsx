import { useEffect, useState } from 'react';
import { Flame } from 'lucide-react';
import client from '../api/client';

interface WorkoutHeatmapProps {
  userId?: number;
}

export function WorkoutHeatmap({ userId }: WorkoutHeatmapProps) {
  const [workoutDates, setWorkoutDates] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [currentStreak, setCurrentStreak] = useState(0);

  useEffect(() => {
    loadWorkoutData();
  }, [userId]);

  const loadWorkoutData = async () => {
    try {
      setLoading(true);
      const response = await client.get('/workouts');
      if (response.data.success) {
        const dates = new Set<string>(
          response.data.workouts.map((w: any) => w.date.split('T')[0])
        );
        setWorkoutDates(dates);
        calculateStreak(dates);
      }
    } catch (error) {
      console.error('Failed to load workout data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStreak = (dates: Set<string>) => {
    const sortedDates = Array.from(dates).sort().reverse();
    if (sortedDates.length === 0) {
      setCurrentStreak(0);
      return;
    }

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < sortedDates.length; i++) {
      const workoutDate = new Date(sortedDates[i]);
      workoutDate.setHours(0, 0, 0, 0);
      
      const expectedDate = new Date(today);
      expectedDate.setDate(today.getDate() - streak);
      
      if (workoutDate.getTime() === expectedDate.getTime()) {
        streak++;
      } else {
        break;
      }
    }

    setCurrentStreak(streak);
  };

  const getLastYear = () => {
    const weeks = [];
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 364); // 52 weeks

    for (let week = 0; week < 52; week++) {
      const days = [];
      for (let day = 0; day < 7; day++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + (week * 7) + day);
        
        if (date <= today) {
          const dateStr = date.toISOString().split('T')[0];
          const hasWorkout = workoutDates.has(dateStr);
          days.push({
            date: dateStr,
            hasWorkout,
            dayOfWeek: date.getDay()
          });
        }
      }
      if (days.length > 0) {
        weeks.push(days);
      }
    }
    return weeks;
  };

  const getIntensityClass = (hasWorkout: boolean) => {
    if (!hasWorkout) return 'bg-[var(--bg-tertiary)] border border-[var(--border-subtle)]';
    return 'bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-secondary)] border border-[var(--brand-primary)]';
  };

  const weeks = getLastYear();
  const totalWorkouts = workoutDates.size;

  if (loading) {
    return (
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-[var(--bg-tertiary)] rounded w-1/3 mb-4"></div>
          <div className="h-32 bg-[var(--bg-tertiary)] rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-[var(--text-primary)] mb-1">Workout Activity</h3>
          <p className="text-sm text-[var(--text-muted)]">{totalWorkouts} workouts in the last year</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/30 rounded-lg">
          <Flame className="w-5 h-5 text-orange-500" />
          <div>
            <p className="text-xs text-[var(--text-muted)]">Current Streak</p>
            <p className="text-xl font-bold text-orange-500">{currentStreak} days</p>
          </div>
        </div>
      </div>

      {/* Heatmap */}
      <div className="overflow-x-auto">
        <div className="inline-flex gap-1">
          {weeks.map((week, weekIdx) => (
            <div key={weekIdx} className="flex flex-col gap-1">
              {week.map((day, dayIdx) => (
                <div
                  key={dayIdx}
                  className={`w-3 h-3 rounded-sm ${getIntensityClass(day.hasWorkout)} transition-all hover:scale-125 cursor-pointer`}
                  title={`${day.date}${day.hasWorkout ? ' - Workout logged' : ' - Rest day'}`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-[var(--border-subtle)]">
        <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
          <span>Less</span>
          <div className="flex gap-1">
            <div className="w-3 h-3 bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] rounded-sm"></div>
            <div className="w-3 h-3 bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-secondary)] rounded-sm"></div>
          </div>
          <span>More</span>
        </div>
        <div className="text-xs text-[var(--text-muted)]">
          {currentStreak > 0 ? (
            <span className="text-orange-500 font-bold">🔥 Keep the streak alive!</span>
          ) : (
            <span>Start a new streak today!</span>
          )}
        </div>
      </div>
    </div>
  );
}
