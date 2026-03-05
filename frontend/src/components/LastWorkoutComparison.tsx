import { useEffect, useState } from 'react';
import { Clock, TrendingUp, Dumbbell } from 'lucide-react';
import client from '../api/client';

interface Exercise {
  name: string;
  sets: number;
  reps: number;
  weight: number | null;
  duration: number | null;
  notes: string | null;
}

interface LastWorkout {
  id: number;
  type: string;
  date: string;
  duration: number;
  notes: string | null;
  exercises: Exercise[];
}

interface LastWorkoutComparisonProps {
  workoutType: string;
}

export function LastWorkoutComparison({ workoutType }: LastWorkoutComparisonProps) {
  const [lastWorkout, setLastWorkout] = useState<LastWorkout | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (workoutType && workoutType.length > 2) {
      loadLastWorkout();
    } else {
      setLastWorkout(null);
      setLoading(false);
    }
  }, [workoutType]);

  const loadLastWorkout = async () => {
    try {
      setLoading(true);
      const response = await client.get(`/analytics/last-workout/${encodeURIComponent(workoutType)}`);
      if (response.data.success) {
        setLastWorkout(response.data.last_workout);
      }
    } catch (error) {
      console.error('Failed to load last workout:', error);
      setLastWorkout(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-lg">
        <div className="animate-pulse">
          <div className="h-4 bg-[var(--bg-tertiary)] rounded w-1/3 mb-2"></div>
          <div className="h-3 bg-[var(--bg-tertiary)] rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!lastWorkout) {
    return null;
  }

  const daysAgo = Math.floor(
    (new Date().getTime() - new Date(lastWorkout.date).getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="p-4 bg-gradient-to-br from-[var(--brand-primary)]/5 to-[var(--brand-secondary)]/5 border border-[var(--brand-primary)]/20 rounded-lg">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-[var(--brand-primary)]/10 rounded">
            <TrendingUp className="w-4 h-4 text-[var(--brand-primary)]" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-[var(--text-primary)]">Last Time</h4>
            <p className="text-xs text-[var(--text-muted)]">
              {daysAgo === 0 ? 'Today' : daysAgo === 1 ? 'Yesterday' : `${daysAgo} days ago`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {lastWorkout.duration} min
          </div>
          <div className="flex items-center gap-1">
            <Dumbbell className="w-3 h-3" />
            {lastWorkout.exercises.length} exercises
          </div>
        </div>
      </div>

      {lastWorkout.exercises.length > 0 && (
        <div className="space-y-2">
          {lastWorkout.exercises.map((exercise, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2 bg-[var(--bg-secondary)]/50 rounded text-xs"
            >
              <span className="font-medium text-[var(--text-primary)]">{exercise.name}</span>
              <div className="flex items-center gap-3 text-[var(--text-muted)]">
                {exercise.sets > 0 && <span>{exercise.sets} sets</span>}
                {exercise.reps > 0 && <span>{exercise.reps} reps</span>}
                {exercise.weight && exercise.weight > 0 && (
                  <span className="font-bold text-[var(--brand-primary)]">{exercise.weight} kg</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {lastWorkout.notes && (
        <div className="mt-3 pt-3 border-t border-[var(--border-subtle)]">
          <p className="text-xs text-[var(--text-muted)] italic">&quot;{lastWorkout.notes}&quot;</p>
        </div>
      )}
    </div>
  );
}
