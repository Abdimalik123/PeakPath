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
}

export function WorkoutDetails({ workout, onDelete }: WorkoutDetailsProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (!workout) {
    return (
      <div className="bg-[#1c1f2e] border border-white/5 p-12 rounded-[2rem] text-center">
        <svg className="w-12 h-12 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-gray-500 text-sm">Select a workout to view details</p>
      </div>
    );
  }

  return (
    <div className="bg-[#1c1f2e] border border-white/5 p-6 rounded-[2rem] sticky top-24">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-xl font-bold text-white mb-1">Workout Details</h3>
          <p className="text-xs text-gray-500 uppercase tracking-wider">Session Info</p>
        </div>
        <button
          onClick={() => onDelete(workout.id)}
          className="p-2 hover:bg-red-500/10 rounded-lg transition text-red-400"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      <div className="space-y-4 mb-6">
        <div className="flex justify-between items-center p-3 bg-[#0f111a] rounded-xl">
          <span className="text-sm text-gray-500 uppercase tracking-wider">Type</span>
          <span className="text-sm font-bold text-white">{workout.type}</span>
        </div>
        <div className="flex justify-between items-center p-3 bg-[#0f111a] rounded-xl">
          <span className="text-sm text-gray-500 uppercase tracking-wider">Duration</span>
          <span className="text-sm font-bold text-white">{workout.duration} min</span>
        </div>
        <div className="flex justify-between items-center p-3 bg-[#0f111a] rounded-xl">
          <span className="text-sm text-gray-500 uppercase tracking-wider">Date</span>
          <span className="text-sm font-bold text-white">{formatDate(workout.date)}</span>
        </div>
      </div>

      <div className="mb-6">
        <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-3">Exercises</h4>
        {workout.exercises && workout.exercises.length > 0 ? (
          <div className="space-y-2">
            {workout.exercises.map((exercise, idx) => (
              <div key={idx} className="p-3 bg-[#0f111a] rounded-xl">
                <p className="text-sm font-bold text-white mb-1">{exercise.name}</p>
                <div className="flex gap-4 text-xs text-gray-500">
                  {exercise.sets > 0 && <span>{exercise.sets} sets</span>}
                  {exercise.reps > 0 && <span>{exercise.reps} reps</span>}
                  {exercise.weight > 0 && <span>{exercise.weight} kg</span>}
                </div>
                {exercise.notes && (
                  <p className="text-xs text-gray-500 mt-2">{exercise.notes}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 bg-[#0f111a] rounded-xl text-center">
            <p className="text-xs text-gray-500">No exercises logged for this workout</p>
          </div>
        )}
      </div>

      {workout.notes && (
        <div className="mt-6 pt-6 border-t border-white/5">
          <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-2">Notes</h4>
          <p className="text-sm text-gray-400">{workout.notes}</p>
        </div>
      )}
    </div>
  );
}
