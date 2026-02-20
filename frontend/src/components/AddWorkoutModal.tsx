import React from 'react';
import { Modal } from './Modal';
import { FormInput } from './FormInput';

interface ExerciseToAdd {
  exercise_id: number;
  exercise_name: string;
  sets: number;
  reps: number;
  weight: number;
  duration: number;
  notes: string;
}

interface AddWorkoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  formData: {
    type: string;
    duration: string;
    date: string;
    notes: string;
  };
  setFormData: (data: any) => void;
  exercisesToAdd: ExerciseToAdd[];
  onAddExercise: () => void;
  onRemoveExercise: (index: number) => void;
}

export function AddWorkoutModal({
  isOpen,
  onClose,
  onSubmit,
  formData,
  setFormData,
  exercisesToAdd,
  onAddExercise,
  onRemoveExercise
}: AddWorkoutModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Log Workout"
      maxWidth="2xl"
    >
      <form onSubmit={onSubmit} className="space-y-6">
        <div className="space-y-4">
          <FormInput
            label="Workout Type"
            value={formData.type}
            onChange={(value) => setFormData({ ...formData, type: value })}
            placeholder="e.g., Upper Body, Cardio"
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <FormInput
              label="Duration (minutes)"
              type="number"
              value={formData.duration}
              onChange={(value) => setFormData({ ...formData, duration: value })}
              placeholder="45"
              required
            />
            <FormInput
              label="Date"
              type="date"
              value={formData.date}
              onChange={(value) => setFormData({ ...formData, date: value })}
              required
            />
          </div>

          <FormInput
            label="Notes (Optional)"
            type="textarea"
            value={formData.notes}
            onChange={(value) => setFormData({ ...formData, notes: value })}
            placeholder="How did it go?"
            rows={2}
          />
        </div>

        {/* Exercises Section */}
        <div className="border-t border-white/5 pt-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h4 className="text-lg font-bold text-white">Exercises (Optional)</h4>
              <p className="text-xs text-gray-500 mt-1">Add exercises now or skip</p>
            </div>
            <button
              type="button"
              onClick={onAddExercise}
              className="px-4 py-2 bg-cyan-500/10 hover:bg-cyan-500 text-cyan-400 hover:text-[#121420] rounded-lg text-xs font-bold uppercase tracking-wider transition"
            >
              + Add Exercise
            </button>
          </div>

          {exercisesToAdd.length > 0 ? (
            <div className="space-y-2">
              {exercisesToAdd.map((exercise, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-[#0f111a] rounded-xl">
                  <div className="flex-1">
                    <p className="text-sm font-bold text-white mb-1">{exercise.exercise_name}</p>
                    <div className="flex gap-4 text-xs text-gray-500">
                      {exercise.sets > 0 && <span>{exercise.sets} sets</span>}
                      {exercise.reps > 0 && <span>{exercise.reps} reps</span>}
                      {exercise.weight > 0 && <span>{exercise.weight} kg</span>}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemoveExercise(idx)}
                    className="p-1 hover:bg-red-500/10 rounded transition text-red-400"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 bg-[#0f111a] rounded-xl text-center">
              <p className="text-xs text-gray-500">No exercises added yet. Click "Add Exercise" to select from your library.</p>
            </div>
          )}
        </div>

        <button
          type="submit"
          className="w-full bg-cyan-500 hover:bg-cyan-400 text-[#121420] py-4 rounded-xl font-bold uppercase tracking-wider text-sm transition shadow-[0_0_20px_rgba(34,211,238,0.3)]"
        >
          Log Workout
        </button>
      </form>
    </Modal>
  );
}
