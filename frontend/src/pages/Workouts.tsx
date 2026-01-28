import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

interface Workout {
  id: number;
  date: string;
  type: string;
  duration: number;
  notes: string;
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

interface AvailableExercise {
  id: number;
  name: string;
  category: string;
  muscle_group: string;
  equipment: string;
  description: string;
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

const Workouts: React.FC = () => {
  const navigate = useNavigate();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [selectedWorkout, setSelectedWorkout] = useState<WorkoutDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddExerciseModal, setShowAddExerciseModal] = useState(false);
  const [availableExercises, setAvailableExercises] = useState<AvailableExercise[]>([]);
  const [filteredExercises, setFilteredExercises] = useState<AvailableExercise[]>([]);
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState('');
  const [isCreatingNewExercise, setIsCreatingNewExercise] = useState(false);
  
  const [formData, setFormData] = useState({
    type: '',
    duration: '',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });
  const [exercisesToAdd, setExercisesToAdd] = useState<ExerciseToAdd[]>([]);
  const [currentExerciseForm, setCurrentExerciseForm] = useState({
    exercise_id: '',
    sets: '',
    reps: '',
    weight: '',
    duration: '',
    notes: ''
  });
  const [newExerciseForm, setNewExerciseForm] = useState({
    name: '',
    category: '',
    description: ''
  });

  // Determine if we should show cards or dropdown
  const MAX_CARDS_DISPLAY = 10;
  const isFiltering = searchQuery || selectedCategory || selectedMuscleGroup;
  const showAsCards = isFiltering && filteredExercises.length <= MAX_CARDS_DISPLAY && filteredExercises.length > 0;

  useEffect(() => {
    fetchWorkouts();
    fetchAvailableExercises();
  }, []);

  // Filter exercises whenever search/filter params change
  useEffect(() => {
    filterExercises();
  }, [searchQuery, selectedCategory, selectedMuscleGroup, availableExercises]);

  const fetchWorkouts = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch('http://localhost:5000/workouts', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        setWorkouts(data.workouts);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to load workouts');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableExercises = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/exercises', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        setAvailableExercises(data.exercises);
      }
    } catch (err) {
      console.error('Failed to load exercises', err);
    }
  };

  const filterExercises = () => {
    let filtered = [...availableExercises];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(ex =>
        ex.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply category filter
    if (selectedCategory) {
      filtered = filtered.filter(ex => ex.category === selectedCategory);
    }

    // Apply muscle group filter
    if (selectedMuscleGroup) {
      filtered = filtered.filter(ex => ex.muscle_group === selectedMuscleGroup);
    }

    setFilteredExercises(filtered);
  };

  const getUniqueCategories = () => {
    const categories = availableExercises.map(ex => ex.category).filter(Boolean);
    return Array.from(new Set(categories)).sort();
  };

  const getUniqueMuscleGroups = () => {
    const muscleGroups = availableExercises.map(ex => ex.muscle_group).filter(Boolean);
    return Array.from(new Set(muscleGroups)).sort();
  };

  const fetchWorkoutDetails = async (workoutId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/workouts/${workoutId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        setSelectedWorkout(data.workout);
      }
    } catch (err) {
      console.error('Failed to load workout details', err);
    }
  };

  const handleCreateNewExercise = async () => {
    if (!newExerciseForm.name || !newExerciseForm.category) {
      setError('Please enter exercise name and category');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/exercises/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newExerciseForm.name,
          category: newExerciseForm.category,
          description: newExerciseForm.description
        })
      });

      const data = await response.json();
      if (data.success) {
        // Refresh the exercise list
        await fetchAvailableExercises();
        
        // Auto-select the newly created exercise
        setCurrentExerciseForm({
          ...currentExerciseForm,
          exercise_id: data.exercise_id.toString()
        });
        
        // Switch back to select mode
        setIsCreatingNewExercise(false);
        setNewExerciseForm({ name: '', category: '', description: '' });
        setError(null);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to create exercise');
    }
  };

  const handleAddExerciseToList = () => {
    if (!currentExerciseForm.exercise_id) {
      setError('Please select an exercise');
      return;
    }

    const selectedExercise = availableExercises.find(
      ex => ex.id === parseInt(currentExerciseForm.exercise_id)
    );

    if (!selectedExercise) return;

    const newExercise: ExerciseToAdd = {
      exercise_id: parseInt(currentExerciseForm.exercise_id),
      exercise_name: selectedExercise.name,
      sets: currentExerciseForm.sets ? parseInt(currentExerciseForm.sets) : 0,
      reps: currentExerciseForm.reps ? parseInt(currentExerciseForm.reps) : 0,
      weight: currentExerciseForm.weight ? parseFloat(currentExerciseForm.weight) : 0,
      duration: currentExerciseForm.duration ? parseInt(currentExerciseForm.duration) : 0,
      notes: currentExerciseForm.notes
    };

    setExercisesToAdd([...exercisesToAdd, newExercise]);
    setCurrentExerciseForm({
      exercise_id: '',
      sets: '',
      reps: '',
      weight: '',
      duration: '',
      notes: ''
    });
    setShowAddExerciseModal(false);
    // Reset filters
    setSearchQuery('');
    setSelectedCategory('');
    setSelectedMuscleGroup('');
  };

  const removeExerciseFromList = (index: number) => {
    setExercisesToAdd(exercisesToAdd.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const token = localStorage.getItem('token');
      
      // Step 1: Create the workout
      const workoutResponse = await fetch('http://localhost:5000/workouts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          type: formData.type,
          duration: parseInt(formData.duration),
          date: formData.date,
          notes: formData.notes
        })
      });

      const workoutData = await workoutResponse.json();
      if (!workoutData.success) {
        setError(workoutData.message);
        return;
      }

      const workoutId = workoutData.workout_id;

      // Step 2: Add exercises to the workout (if any)
      if (exercisesToAdd.length > 0) {
        for (const exercise of exercisesToAdd) {
          await fetch(`http://localhost:5000/workouts/${workoutId}/exercises`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              exercise_id: exercise.exercise_id,
              sets: exercise.sets || null,
              reps: exercise.reps || null,
              weight: exercise.weight || null,
              duration: exercise.duration || null,
              notes: exercise.notes || null
            })
          });
        }
      }

      // Reset form and close modal
      setShowAddModal(false);
      setFormData({ type: '', duration: '', date: new Date().toISOString().split('T')[0], notes: '' });
      setExercisesToAdd([]);
      fetchWorkouts();

    } catch (err) {
      setError('Failed to create workout');
    }
  };

  const handleAddExerciseToExistingWorkout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorkout) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/workouts/${selectedWorkout.id}/exercises`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          exercise_id: parseInt(currentExerciseForm.exercise_id),
          sets: currentExerciseForm.sets ? parseInt(currentExerciseForm.sets) : null,
          reps: currentExerciseForm.reps ? parseInt(currentExerciseForm.reps) : null,
          weight: currentExerciseForm.weight ? parseFloat(currentExerciseForm.weight) : null,
          duration: currentExerciseForm.duration ? parseInt(currentExerciseForm.duration) : null,
          notes: currentExerciseForm.notes || null
        })
      });

      const data = await response.json();
      if (data.success) {
        setShowAddExerciseModal(false);
        setCurrentExerciseForm({ exercise_id: '', sets: '', reps: '', weight: '', duration: '', notes: '' });
        // Reset filters
        setSearchQuery('');
        setSelectedCategory('');
        setSelectedMuscleGroup('');
        // Refresh workout details
        fetchWorkoutDetails(selectedWorkout.id);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to add exercise');
    }
  };

  const handleDelete = async (workoutId: number) => {
    if (!confirm('Delete this workout?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/workouts/${workoutId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        fetchWorkouts();
        setSelectedWorkout(null);
      }
    } catch (err) {
      setError('Failed to delete workout');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#121420] flex items-center justify-center">
        <div className="text-cyan-400 text-xl">Loading workouts...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121420] text-gray-300">
      {/* Navigation */}
      <nav className="border-b border-white/5 bg-[#121420]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-8">
              <Link to="/" className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.5)]"></div>
                <h1 className="text-xl font-bold tracking-tight text-white">LIFE<span className="text-cyan-400">TRACKER</span></h1>
              </Link>
              
              <div className="hidden md:flex items-center gap-6">
                <Link to="/dashboard" className="text-gray-400 hover:text-white font-medium text-sm transition">DASHBOARD</Link>
                <Link to="/workouts" className="text-cyan-400 font-medium text-sm border-b-2 border-cyan-400 pb-1">WORKOUTS</Link>
                <Link to="/habits" className="text-gray-400 hover:text-white font-medium text-sm transition">HABITS</Link>
                <Link to="/goals" className="text-gray-400 hover:text-white font-medium text-sm transition">GOALS</Link>
              </div>
            </div>
            
            <Link to="/profile" className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center text-[#121420] font-bold shadow-[0_0_20px_rgba(34,211,238,0.3)]">
              U
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-4xl font-bold text-white mb-2">Workouts</h2>
            <p className="text-gray-500 text-sm">Track your training sessions</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-[#121420] rounded-xl font-bold uppercase tracking-wider text-sm transition shadow-[0_0_20px_rgba(34,211,238,0.3)]"
          >
            + Log Workout
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Workouts List */}
          <div className="lg:col-span-2 space-y-4">
            {workouts.length === 0 ? (
              <div className="bg-[#1c1f2e] border border-white/5 p-12 rounded-[2rem] text-center">
                <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <h3 className="text-xl font-bold text-white mb-2">No Workouts Yet</h3>
                <p className="text-gray-500 mb-6">Start tracking your fitness journey</p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-[#121420] rounded-xl font-bold uppercase tracking-wider text-sm transition shadow-[0_0_20px_rgba(34,211,238,0.3)]"
                >
                  Log First Workout
                </button>
              </div>
            ) : (
              workouts.map((workout) => (
                <div
                  key={workout.id}
                  onClick={() => fetchWorkoutDetails(workout.id)}
                  className="bg-[#1c1f2e] border border-white/5 p-6 rounded-[2rem] hover:border-cyan-500/50 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-cyan-500/10 rounded-2xl text-cyan-400 group-hover:bg-cyan-500 group-hover:text-[#121420] transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-white mb-1">{workout.type}</h4>
                        <p className="text-xs text-gray-500 font-mono uppercase tracking-wider">{formatDate(workout.date)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-white">{workout.duration}<span className="text-gray-500 text-sm ml-1">min</span></p>
                      <p className="text-xs text-gray-500 uppercase tracking-wider">Duration</p>
                    </div>
                  </div>
                  {workout.notes && (
                    <p className="mt-4 text-sm text-gray-400 border-t border-white/5 pt-4">{workout.notes}</p>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Workout Details Sidebar */}
          <div className="space-y-6">
            {selectedWorkout ? (
              <div className="bg-[#1c1f2e] border border-white/5 p-6 rounded-[2rem] sticky top-24">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">Workout Details</h3>
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Session Info</p>
                  </div>
                  <button
                    onClick={() => handleDelete(selectedWorkout.id)}
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
                    <span className="text-sm font-bold text-white">{selectedWorkout.type}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-[#0f111a] rounded-xl">
                    <span className="text-sm text-gray-500 uppercase tracking-wider">Duration</span>
                    <span className="text-sm font-bold text-white">{selectedWorkout.duration} min</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-[#0f111a] rounded-xl">
                    <span className="text-sm text-gray-500 uppercase tracking-wider">Date</span>
                    <span className="text-sm font-bold text-white">{formatDate(selectedWorkout.date)}</span>
                  </div>
                </div>

                <div className="mb-6">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-sm font-bold text-white uppercase tracking-wider">Exercises</h4>
                    <button
                      onClick={() => setShowAddExerciseModal(true)}
                      className="px-3 py-1.5 bg-cyan-500/10 hover:bg-cyan-500 text-cyan-400 hover:text-[#121420] rounded-lg text-xs font-bold uppercase tracking-wider transition"
                    >
                      + Add
                    </button>
                  </div>
                  
                  {selectedWorkout.exercises && selectedWorkout.exercises.length > 0 ? (
                    <div className="space-y-2">
                      {selectedWorkout.exercises.map((exercise, idx) => (
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
                      <p className="text-xs text-gray-500">No exercises added yet</p>
                    </div>
                  )}
                </div>

                {selectedWorkout.notes && (
                  <div className="mt-6 pt-6 border-t border-white/5">
                    <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-2">Notes</h4>
                    <p className="text-sm text-gray-400">{selectedWorkout.notes}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-[#1c1f2e] border border-white/5 p-12 rounded-[2rem] text-center">
                <svg className="w-12 h-12 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-gray-500 text-sm">Select a workout to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Workout Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1c1f2e] border border-white/5 rounded-[2rem] p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-white">Log Workout</h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setExercisesToAdd([]);
                }}
                className="p-2 hover:bg-white/5 rounded-lg transition"
              >
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Workout Details */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Workout Type</label>
                  <input
                    type="text"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full bg-[#0f111a] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
                    placeholder="e.g., Upper Body, Cardio"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Duration (minutes)</label>
                    <input
                      type="number"
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                      className="w-full bg-[#0f111a] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
                      placeholder="45"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Date</label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full bg-[#0f111a] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Notes (Optional)</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full bg-[#0f111a] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition resize-none"
                    rows={2}
                    placeholder="How did it go?"
                  />
                </div>
              </div>

              {/* Exercises Section */}
              <div className="border-t border-white/5 pt-6">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h4 className="text-lg font-bold text-white">Exercises (Optional)</h4>
                    <p className="text-xs text-gray-500 mt-1">Add exercises now or later</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAddExerciseModal(true)}
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
                          onClick={() => removeExerciseFromList(idx)}
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
                    <p className="text-xs text-gray-500">
                      No exercises added yet. Click "Add Exercise" to select from your library or create a new one.
                    </p>
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
          </div>
        </div>
      )}

      {/* Add Exercise Modal with Smart Display Logic */}
      {showAddExerciseModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-[#1c1f2e] border border-white/5 rounded-[2rem] p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-white">Add Exercise</h3>
              <button
                onClick={() => {
                  setShowAddExerciseModal(false);
                  setCurrentExerciseForm({ exercise_id: '', sets: '', reps: '', weight: '', duration: '', notes: '' });
                  setIsCreatingNewExercise(false);
                  setNewExerciseForm({ name: '', category: '', description: '' });
                  setSearchQuery('');
                  setSelectedCategory('');
                  setSelectedMuscleGroup('');
                }}
                className="p-2 hover:bg-white/5 rounded-lg transition"
              >
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Toggle between Select Existing and Create New */}
            <div className="flex gap-2 mb-6">
              <button
                type="button"
                onClick={() => setIsCreatingNewExercise(false)}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold uppercase tracking-wider transition ${
                  !isCreatingNewExercise
                    ? 'bg-cyan-500 text-[#121420]'
                    : 'bg-[#0f111a] text-gray-400 hover:text-white'
                }`}
              >
                Select Existing
              </button>
              <button
                type="button"
                onClick={() => setIsCreatingNewExercise(true)}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold uppercase tracking-wider transition ${
                  isCreatingNewExercise
                    ? 'bg-cyan-500 text-[#121420]'
                    : 'bg-[#0f111a] text-gray-400 hover:text-white'
                }`}
              >
                Create New
              </button>
            </div>

            {isCreatingNewExercise ? (
              /* Create New Exercise Form */
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Exercise Name</label>
                  <input
                    type="text"
                    value={newExerciseForm.name}
                    onChange={(e) => setNewExerciseForm({ ...newExerciseForm, name: e.target.value })}
                    className="w-full bg-[#0f111a] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
                    placeholder="e.g., Bench Press"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Category</label>
                  <input
                    type="text"
                    value={newExerciseForm.category}
                    onChange={(e) => setNewExerciseForm({ ...newExerciseForm, category: e.target.value })}
                    className="w-full bg-[#0f111a] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
                    placeholder="e.g., Chest, Cardio, Legs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Description (Optional)</label>
                  <textarea
                    value={newExerciseForm.description}
                    onChange={(e) => setNewExerciseForm({ ...newExerciseForm, description: e.target.value })}
                    className="w-full bg-[#0f111a] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition resize-none"
                    rows={2}
                    placeholder="Brief description of the exercise"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleCreateNewExercise}
                  className="w-full bg-cyan-500 hover:bg-cyan-400 text-[#121420] py-4 rounded-xl font-bold uppercase tracking-wider text-sm transition shadow-[0_0_20px_rgba(34,211,238,0.3)]"
                >
                  Create & Continue
                </button>
              </div>
            ) : (
              /* Select Existing Exercise Form with Smart Display */
              <form onSubmit={selectedWorkout ? handleAddExerciseToExistingWorkout : (e) => { e.preventDefault(); handleAddExerciseToList(); }} className="space-y-4">
                
                {/* Search and Filters */}
                <div className="space-y-3 pb-4 border-b border-white/5">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                      Search Exercises
                      {!isFiltering && availableExercises.length > 10 && (
                        <span className="ml-2 text-cyan-400 font-normal normal-case">
                          (Start typing to see cards)
                        </span>
                      )}
                    </label>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-[#0f111a] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
                      placeholder="Search by name..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Category</label>
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-full bg-[#0f111a] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
                      >
                        <option value="">All Categories</option>
                        {getUniqueCategories().map((cat) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Muscle Group</label>
                      <select
                        value={selectedMuscleGroup}
                        onChange={(e) => setSelectedMuscleGroup(e.target.value)}
                        className="w-full bg-[#0f111a] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
                      >
                        <option value="">All Muscles</option>
                        {getUniqueMuscleGroups().map((muscle) => (
                          <option key={muscle} value={muscle}>{muscle}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {isFiltering && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">
                        {filteredExercises.length === 0 ? 'No matches' : 
                         filteredExercises.length > MAX_CARDS_DISPLAY ? `${filteredExercises.length} results (narrow down to see cards)` :
                         `Showing ${filteredExercises.length} exercise${filteredExercises.length !== 1 ? 's' : ''}`}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery('');
                          setSelectedCategory('');
                          setSelectedMuscleGroup('');
                        }}
                        className="text-cyan-400 hover:text-cyan-300 transition"
                      >
                        Clear filters
                      </button>
                    </div>
                  )}
                </div>

                {/* Exercise Selection - Cards or Dropdown based on filtering */}
                {showAsCards ? (
                  /* Clickable Cards when filtered */
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                      Select Exercise {currentExerciseForm.exercise_id && '✓'}
                    </label>
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                      {filteredExercises.map((exercise) => (
                        <div
                          key={exercise.id}
                          onClick={() => setCurrentExerciseForm({ ...currentExerciseForm, exercise_id: exercise.id.toString() })}
                          className={`p-3 rounded-xl cursor-pointer transition-all ${
                            currentExerciseForm.exercise_id === exercise.id.toString()
                              ? 'bg-cyan-500 text-[#121420]'
                              : 'bg-[#0f111a] text-white hover:bg-[#1a1d2e] border border-white/5 hover:border-cyan-500/30'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className={`text-sm font-bold mb-1 ${
                                currentExerciseForm.exercise_id === exercise.id.toString() ? 'text-[#121420]' : 'text-white'
                              }`}>
                                {exercise.name}
                              </p>
                              <div className={`flex flex-wrap gap-2 text-xs ${
                                currentExerciseForm.exercise_id === exercise.id.toString() ? 'text-[#121420]/70' : 'text-gray-500'
                              }`}>
                                {exercise.category && (
                                  <span className="px-2 py-0.5 bg-black/10 rounded">
                                    {exercise.category}
                                  </span>
                                )}
                                {exercise.muscle_group && (
                                  <span className="px-2 py-0.5 bg-black/10 rounded">
                                    {exercise.muscle_group}
                                  </span>
                                )}
                                {exercise.equipment && (
                                  <span className="px-2 py-0.5 bg-black/10 rounded">
                                    {exercise.equipment}
                                  </span>
                                )}
                              </div>
                            </div>
                            {currentExerciseForm.exercise_id === exercise.id.toString() && (
                              <svg className="w-5 h-5 flex-shrink-0 ml-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  /* Dropdown when not filtered or too many results */
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                      Select Exercise
                      {!isFiltering && availableExercises.length > 10 && (
                        <span className="ml-2 text-xs text-gray-500 font-normal normal-case">
                          (or use filters above to browse)
                        </span>
                      )}
                    </label>
                    <select
                      value={currentExerciseForm.exercise_id}
                      onChange={(e) => setCurrentExerciseForm({ ...currentExerciseForm, exercise_id: e.target.value })}
                      className="w-full bg-[#0f111a] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
                      required
                    >
                      <option value="">Choose an exercise</option>
                      {(isFiltering ? filteredExercises : availableExercises).map((exercise) => (
                        <option key={exercise.id} value={exercise.id}>
                          {exercise.name} {exercise.category && `• ${exercise.category}`} {exercise.muscle_group && `• ${exercise.muscle_group}`}
                        </option>
                      ))}
                    </select>
                    {filteredExercises.length === 0 && isFiltering && (
                      <p className="text-xs text-gray-500 mt-2">No exercises match your filters.</p>
                    )}
                    {filteredExercises.length > MAX_CARDS_DISPLAY && isFiltering && (
                      <p className="text-xs text-cyan-400 mt-2">
                        💡 Tip: Narrow your search to {MAX_CARDS_DISPLAY} or fewer to see clickable cards
                      </p>
                    )}
                  </div>
                )}

                {/* Exercise Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Sets</label>
                    <input
                      type="number"
                      value={currentExerciseForm.sets}
                      onChange={(e) => setCurrentExerciseForm({ ...currentExerciseForm, sets: e.target.value })}
                      className="w-full bg-[#0f111a] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
                      placeholder="3"
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Reps</label>
                    <input
                      type="number"
                      value={currentExerciseForm.reps}
                      onChange={(e) => setCurrentExerciseForm({ ...currentExerciseForm, reps: e.target.value })}
                      className="w-full bg-full bg-[#0f111a] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
                      placeholder="10"
                      min="0"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Weight (kg)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={currentExerciseForm.weight}
                      onChange={(e) => setCurrentExerciseForm({ ...currentExerciseForm, weight: e.target.value })}
                      className="w-full bg-[#0f111a] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
                      placeholder="50"
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Duration (min)</label>
                    <input
                      type="number"
                      value={currentExerciseForm.duration}
                      onChange={(e) => setCurrentExerciseForm({ ...currentExerciseForm, duration: e.target.value })}
                      className="w-full bg-[#0f111a] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
                      placeholder="20"
                      min="0"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Notes (Optional)</label>
                  <textarea
                    value={currentExerciseForm.notes}
                    onChange={(e) => setCurrentExerciseForm({ ...currentExerciseForm, notes: e.target.value })}
                    className="w-full bg-[#0f111a] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition resize-none"
                    rows={3}
                    placeholder="Any notes about this exercise?"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-cyan-500 hover:bg-cyan-400 text-[#121420] py-4 rounded-xl font-bold uppercase tracking-wider text-sm transition shadow-[0_0_20px_rgba(34,211,238,0.3)]"
                >
                  {selectedWorkout ? 'Add to Workout' : 'Add Exercise'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Workouts;