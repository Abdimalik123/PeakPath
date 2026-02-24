import { useState, useEffect } from 'react';
import client from '../api/client';

interface Workout {
  id: number;
  date: string;
  type: string;
  duration: number;
  notes: string;
  exercise_count?: number;
}

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

interface WorkoutDetail extends Workout {
  exercises: Exercise[];
}

interface ExerciseToAdd {
  exercise_id: number;
  exercise_name: string;
  sets: number;
  reps: number;
  weight: number;
  duration: number;
  notes: string;
}

interface ExerciseData {
  exercise_id: number;
  sets: number | null;
  reps: number | null;
  weight: number | null;
  duration: number | null;
  notes: string | null;
}

export function useWorkouts() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [selectedWorkout, setSelectedWorkout] = useState<WorkoutDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exercisesToAdd, setExercisesToAdd] = useState<ExerciseToAdd[]>([]);
  
  const [formData, setFormData] = useState({
    type: '',
    duration: '',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  useEffect(() => {
    fetchWorkouts();
  }, []);

  const fetchWorkouts = async () => {
    try {
      const response = await client.get('/workouts');
      
      if (response.data.success) {
        setWorkouts(response.data.workouts);
      } else {
        setError(response.data.message);
      }
    } catch (err: any) {
      setError('Failed to load workouts');
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkoutDetails = async (workoutId: number) => {
    try {
      const response = await client.get(`/workouts/${workoutId}`);
      if (response.data.success) {
        setSelectedWorkout(response.data.workout);
      }
    } catch (err) {
      console.error('Failed to load workout details', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const response = await client.post('/workouts', {
        type: formData.type,
        duration: parseInt(formData.duration),
        date: formData.date,
        notes: formData.notes,
        exercises: exercisesToAdd.map(ex => ({
          exercise_id: ex.exercise_id,
          sets: ex.sets || null,
          reps: ex.reps || null,
          weight: ex.weight || null,
          duration: ex.duration || null,
          notes: ex.notes || null
        }))
      });

      if (!response.data.success) {
        setError(response.data.message);
        return false;
      }

      setFormData({ type: '', duration: '', date: new Date().toISOString().split('T')[0], notes: '' });
      setExercisesToAdd([]);
      fetchWorkouts();
      return true;

    } catch (err) {
      setError('Failed to create workout');
      return false;
    }
  };

  const handleDelete = async (workoutId: number) => {
    if (!confirm('Delete this workout?')) return;

    try {
      const response = await client.delete(`/workouts/${workoutId}`);
      if (response.data.success) {
        fetchWorkouts();
        setSelectedWorkout(null);
      }
    } catch (err) {
      setError('Failed to delete workout');
    }
  };

  const addExerciseToWorkout = async (workoutId: number, exerciseData: ExerciseData) => {
    try {
      const response = await client.post(`/workouts/${workoutId}/exercises`, exerciseData);
      if (response.data.success) {
        fetchWorkoutDetails(workoutId);
        return true;
      }
      return false;
    } catch (err) {
      setError('Failed to add exercise to workout');
      return false;
    }
  };

  const addExercise = (exercise: ExerciseToAdd) => {
    setExercisesToAdd([...exercisesToAdd, exercise]);
  };

  const removeExercise = (index: number) => {
    setExercisesToAdd(exercisesToAdd.filter((_, i) => i !== index));
  };

  return {
    workouts,
    selectedWorkout,
    setSelectedWorkout,
    loading,
    error,
    formData,
    setFormData,
    exercisesToAdd,
    fetchWorkoutDetails,
    handleSubmit,
    handleDelete,
    addExercise,
    removeExercise,
    addExerciseToWorkout,
    setError
  };
}
