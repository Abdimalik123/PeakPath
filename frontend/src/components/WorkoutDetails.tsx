import React from 'react';

interface Exercise {
  exercise_id: number;
  name: string;
  category: string;
  muscle_group: string;
  sets: number;
  reps: number;
  weight: number;
  notes: string;
}

interface WorkoutDetail {
  id: number;
  date: string;
  type: string;
  duration: number;
  notes: string;
  exercises: Exercise[];
}

interface WorkoutDetailsProps {
  workout: WorkoutDetail | null;
  onDelete: (id: number) => void;
  onAddExercise?: (id: number) => void;
  onClose?: () => void;
}

export function WorkoutDetails({ workout, onDelete, onAddExercise, onClose }: WorkoutDetailsProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (!workout) {
    return (
      <div className="pp-card p-12 text-center">
        <svg className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-[var(--text-muted)] text-sm">Select a workout to view details</p>
      </div>
    );
  }

  return (
    <div className="pp-card p-6 sticky top-24">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-xl font-bold text-[var(--text-primary)] mb-1">Workout Details</h3>
          <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider">Session Info</p>
        </div>
        <div className="flex gap-2">
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-[var(--bg-tertiary)] rounded-lg transition text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              title="Close details"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          <button
            onClick={() => onDelete(workout.id)}
            className="p-2 hover:bg-[var(--error)]/10 rounded-lg transition text-[var(--error)]"
            title="Delete workout"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      <div className="space-y-3 mb-6">
        <div className="flex justify-between items-center p-3 bg-[var(--bg-tertiary)] rounded-[var(--radius-md)]">
          <span className="text-sm text-[var(--text-muted)] uppercase tracking-wider">Type</span>
          <span className="text-sm font-bold text-[var(--text-primary)]">{workout.type}</span>
        </div>
        <div className="flex justify-between items-center p-3 bg-[var(--bg-tertiary)] rounded-[var(--radius-md)]">
          <span className="text-sm text-[var(--text-muted)] uppercase tracking-wider">Duration</span>
          <span className="text-sm font-bold text-[var(--text-primary)]">{workout.duration} min</span>
        </div>
        <div className="flex justify-between items-center p-3 bg-[var(--bg-tertiary)] rounded-[var(--radius-md)]">
          <span className="text-sm text-[var(--text-muted)] uppercase tracking-wider">Date</span>
          <span className="text-sm font-bold text-[var(--text-primary)]">{formatDate(workout.date)}</span>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex justify-between items-center mb-3">
          <h4 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">Exercises</h4>
          <button
            onClick={() => onAddExercise?.(workout.id)}
            className="pp-btn-ghost text-xs py-1.5 px-3"
          >
            + Add Exercise
          </button>
        </div>
        {workout.exercises && workout.exercises.length > 0 ? (
          <div className="space-y-2">
            {workout.exercises.map((exercise, idx) => (
              <div key={idx} className="p-3 bg-[var(--bg-tertiary)] rounded-[var(--radius-md)]">
                <p className="text-sm font-bold text-[var(--text-primary)] mb-1">{exercise.name}</p>
                <div className="flex gap-4 text-xs text-[var(--text-muted)]">
                  {exercise.sets > 0 && <span>{exercise.sets} sets</span>}
                  {exercise.reps > 0 && <span>{exercise.reps} reps</span>}
                  {exercise.weight > 0 && <span>{exercise.weight} kg</span>}
                </div>
                {exercise.notes && (
                  <p className="text-xs text-[var(--text-muted)] mt-2">{exercise.notes}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 bg-[var(--bg-tertiary)] rounded-[var(--radius-md)] text-center">
            <p className="text-xs text-[var(--text-muted)] mb-3">No exercises logged for this workout</p>
            <button
              onClick={() => onAddExercise?.(workout.id)}
              className="pp-btn-ghost text-xs py-1.5 px-3"
            >
              + Add First Exercise
            </button>
          </div>
        )}
      </div>

      {workout.notes && (
        <div className="mt-6 pt-6 border-t border-[var(--border-subtle)]">
          <h4 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider mb-2">Notes</h4>
          <p className="text-sm text-[var(--text-muted)]">{workout.notes}</p>
        </div>
      )}
    </div>
  );
}
