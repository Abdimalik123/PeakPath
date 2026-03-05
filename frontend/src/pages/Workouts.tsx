import React, { useState, useEffect } from 'react';
import { WorkoutCard } from '../components/WorkoutCard';
import { Navigation } from '../components/Navigation';
import { PageHeader } from '../components/PageHeader';
import { EmptyState } from '../components/EmptyState';
import { AddWorkoutModal } from '../components/AddWorkoutModal';
import { WorkoutDetails } from '../components/WorkoutDetails';
import { PRCelebration } from '../components/PRCelebration';
import { useWorkouts } from '../hooks/useWorkouts';
import { useToast } from '../contexts/ToastContext';
import { RepeatWorkoutButton } from '../components/RepeatWorkoutButton';
import { EmptyStateGuide } from '../components/EmptyStateGuide';
import client from '../api/client';

interface AvailableExercise {
  id: number;
  name: string;
  category: string;
  muscle_group: string;
  equipment: string;
  description: string;
  last_performance?: {
    weight: number | null;
    reps: number | null;
    sets: number | null;
    date: string | null;
  } | null;
}

const Workouts: React.FC = () => {
  const { showToast } = useToast();
  const {
    workouts,
    selectedWorkout,
    setSelectedWorkout,
    loading,
    error,
    formData,
    setFormData,
    exercisesToAdd,
    prsAchieved,
    setPrsAchieved,
    fetchWorkoutDetails,
    handleSubmit,
    handleDelete,
    addExercise,
    removeExercise,
    addExerciseToWorkout
  } = useWorkouts();
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddExerciseModal, setShowAddExerciseModal] = useState(false);
  
  // Exercise modal state
  const [availableExercises, setAvailableExercises] = useState<AvailableExercise[]>([]);
  const [filteredExercises, setFilteredExercises] = useState<AvailableExercise[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState('');
  const [isCreatingNewExercise, setIsCreatingNewExercise] = useState(false);
  
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
  
  const MAX_CARDS_DISPLAY = 10;
  const isFiltering = searchQuery || selectedCategory || selectedMuscleGroup;
  const showAsCards = isFiltering && filteredExercises.length <= MAX_CARDS_DISPLAY && filteredExercises.length > 0;

  const handleWorkoutSubmit = async (e: React.FormEvent) => {
    const success = await handleSubmit(e);
    if (success) {
      setShowAddModal(false);
      showToast('Workout logged successfully!');
    }
  };
  
  // Exercise modal functions
  const resetExerciseModal = () => {
    setShowAddExerciseModal(false);
    setCurrentExerciseForm({ exercise_id: '', sets: '', reps: '', weight: '', duration: '', notes: '' });
    setIsCreatingNewExercise(false);
    setNewExerciseForm({ name: '', category: '', description: '' });
    setSearchQuery('');
    setSelectedCategory('');
    setSelectedMuscleGroup('');
  };
  
  const getUniqueCategories = () => {
    const categories = availableExercises.map(ex => ex.category).filter(Boolean);
    return Array.from(new Set(categories)).sort();
  };
  
  const getUniqueMuscleGroups = () => {
    const muscleGroups = availableExercises.map(ex => ex.muscle_group).filter(Boolean);
    return Array.from(new Set(muscleGroups)).sort();
  };
  
  const handleCreateNewExercise = async () => {
    if (!newExerciseForm.name || !newExerciseForm.category) {
      return;
    }
    try {
      const response = await client.post('/exercises/create', {
        name: newExerciseForm.name,
        category: newExerciseForm.category,
        description: newExerciseForm.description
      });
      if (response.data.success) {
        // Reload exercises from API to get the new one
        const exResponse = await client.get('/exercises');
        if (exResponse.data.success) {
          setAvailableExercises(exResponse.data.exercises);
        }
        setCurrentExerciseForm({ ...currentExerciseForm, exercise_id: response.data.exercise_id.toString() });
        setIsCreatingNewExercise(false);
        setNewExerciseForm({ name: '', category: '', description: '' });
        showToast('Exercise created!');
      }
    } catch (err) {
      showToast('Failed to create exercise', 'error');
    }
  };
  
  const handleAddExerciseToList = async () => {
    if (!currentExerciseForm.exercise_id) {
      showToast('Please select an exercise', 'warning');
      return;
    }
    
    const selectedExercise = availableExercises.find(
      ex => ex.id === parseInt(currentExerciseForm.exercise_id)
    );
    
    if (!selectedExercise) {
      showToast('Exercise not found', 'error');
      return;
    }
    
    // Check if we're adding to an existing workout or a new one being created
    if (selectedWorkout) {
      // Adding to existing workout - use API
      const exerciseData = {
        exercise_id: parseInt(currentExerciseForm.exercise_id),
        sets: parseInt(currentExerciseForm.sets) || null,
        reps: parseInt(currentExerciseForm.reps) || null,
        weight: parseFloat(currentExerciseForm.weight) || null,
        duration: parseInt(currentExerciseForm.duration) || null,
        notes: currentExerciseForm.notes || null
      };
      
      const success = await addExerciseToWorkout(selectedWorkout.id, exerciseData);
      if (success) {
        resetExerciseModal();
      }
    } else {
      // Adding to new workout being created - add to temporary list
      const exerciseToAdd = {
        exercise_id: parseInt(currentExerciseForm.exercise_id),
        exercise_name: selectedExercise.name,
        sets: parseInt(currentExerciseForm.sets) || 0,
        reps: parseInt(currentExerciseForm.reps) || 0,
        weight: parseFloat(currentExerciseForm.weight) || 0,
        duration: parseInt(currentExerciseForm.duration) || 0,
        notes: currentExerciseForm.notes || ''
      };
      
      addExercise(exerciseToAdd);
      resetExerciseModal();
    }
  };

  // Filter exercises when search/filter changes
  useEffect(() => {
    let filtered = [...availableExercises];
    if (searchQuery) {
      filtered = filtered.filter(ex =>
        ex.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (selectedCategory) {
      filtered = filtered.filter(ex => ex.category === selectedCategory);
    }
    if (selectedMuscleGroup) {
      filtered = filtered.filter(ex => ex.muscle_group === selectedMuscleGroup);
    }
    setFilteredExercises(filtered);
  }, [searchQuery, selectedCategory, selectedMuscleGroup, availableExercises]);
  
  // Load available exercises from API on mount
  useEffect(() => {
    const fetchExercises = async () => {
      try {
        const response = await client.get('/exercises');
        if (response.data.success) {
          setAvailableExercises(response.data.exercises);
        }
      } catch (err) {
        console.error('Failed to load exercises:', err);
      }
    };
    fetchExercises();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="text-[var(--brand-primary)] text-lg font-medium">Loading workouts...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <Navigation currentPage="/workouts" />

      {/* Main Content */}
      <div className="lg:ml-64 min-h-screen">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <PageHeader
            title="Workouts"
            subtitle="Track your training sessions"
            actionButton={{
              label: "+ Log Workout",
              onClick: () => setShowAddModal(true)
            }}
          />

          {error && (
            <div className="mb-6 p-4 bg-[var(--error)]/10 border border-[var(--error)]/30 rounded-[var(--radius-lg)]">
              <p className="text-[var(--error)] text-sm text-center font-medium">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Workouts List */}
            <div className="lg:col-span-2 space-y-4">
              {workouts.length === 0 ? (
                <EmptyStateGuide type="workouts" />
              ) : (
                <>
                <div className="mb-4">
                  <RepeatWorkoutButton onSuccess={() => window.location.reload()} />
                </div>
                workouts.map((workout) => {
                  const workoutData = {
                    id: workout.id.toString(),
                    type: workout.type,
                    date: workout.date,
                    duration: workout.duration,
                    exercise_count: workout.exercise_count || 0
                  };
                  
                  return (
                    <WorkoutCard 
                      key={workout.id}
                      workout={workoutData}
                      onClick={(id) => fetchWorkoutDetails(parseInt(id))}
                    />
                  );
                })
                </>
              )}
            </div>

          <div className="space-y-6">
            {selectedWorkout && (
              <WorkoutDetails 
                workout={selectedWorkout} 
                onDelete={handleDelete}
                onClose={() => setSelectedWorkout(null)}
                onAddExercise={() => {
                  if (selectedWorkout) {
                    setShowAddExerciseModal(true);
                  } else {
                    showToast('Please select a workout first', 'warning');
                  }
                }}
              />
            )}
          </div>
        </div>
      </main>
      </div>

      <AddWorkoutModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleWorkoutSubmit}
        formData={formData}
        setFormData={setFormData}
        exercisesToAdd={exercisesToAdd}
        onAddExercise={() => setShowAddExerciseModal(true)}
        onRemoveExercise={removeExercise}
      />

      {/* Add Exercise Modal */}
      {showAddExerciseModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="pp-card p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-[var(--text-primary)]">Add Exercise</h3>
              <button onClick={resetExerciseModal} className="p-2 hover:bg-[var(--bg-tertiary)] rounded-lg transition">
                <svg className="w-6 h-6 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex gap-2 mb-6">
              <button
                type="button"
                onClick={() => setIsCreatingNewExercise(false)}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold uppercase tracking-wider transition ${
                  !isCreatingNewExercise ? 'pp-btn-primary' : 'pp-btn-ghost'
                }`}
              >
                Select Existing
              </button>
              <button
                type="button"
                onClick={() => setIsCreatingNewExercise(true)}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold uppercase tracking-wider transition ${
                  isCreatingNewExercise ? 'pp-btn-primary' : 'pp-btn-ghost'
                }`}
              >
                Create New
              </button>
            </div>

            {isCreatingNewExercise ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Exercise Name</label>
                  <input
                    type="text"
                    value={newExerciseForm.name}
                    onChange={(e) => setNewExerciseForm({ ...newExerciseForm, name: e.target.value })}
                    className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-[var(--radius-md)] px-4 py-3 text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--brand-primary)] transition"
                    placeholder="e.g., Bench Press"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Category</label>
                  <input
                    type="text"
                    value={newExerciseForm.category}
                    onChange={(e) => setNewExerciseForm({ ...newExerciseForm, category: e.target.value })}
                    className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-[var(--radius-md)] px-4 py-3 text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--brand-primary)] transition"
                    placeholder="e.g., Chest, Cardio, Legs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Description (Optional)</label>
                  <textarea
                    value={newExerciseForm.description}
                    onChange={(e) => setNewExerciseForm({ ...newExerciseForm, description: e.target.value })}
                    className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-[var(--radius-md)] px-4 py-3 text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--brand-primary)] transition resize-none"
                    rows={2}
                    placeholder="Brief description"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleCreateNewExercise}
                  className="w-full pp-btn-primary"
                >
                  Create & Continue
                </button>
              </div>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); handleAddExerciseToList(); }} className="space-y-4">
                {/* Search and Filters */}
                <div className="space-y-3 pb-4 border-b border-[var(--border-subtle)]">
                  <div>
                    <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Search Exercises</label>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-[var(--radius-md)] px-4 py-3 text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--brand-primary)] transition"
                      placeholder="Search by name..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Category</label>
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-[var(--radius-md)] px-4 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-primary)] transition"
                      >
                        <option value="">All Categories</option>
                        {getUniqueCategories().map((cat) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Muscle Group</label>
                      <select
                        value={selectedMuscleGroup}
                        onChange={(e) => setSelectedMuscleGroup(e.target.value)}
                        className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-[var(--radius-md)] px-4 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-primary)] transition"
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
                      <span className="text-[var(--text-muted)]">
                        {filteredExercises.length === 0 ? 'No matches' :
                         filteredExercises.length > MAX_CARDS_DISPLAY ? `${filteredExercises.length} results (narrow down to see cards)` :
                         `Showing ${filteredExercises.length} exercise${filteredExercises.length !== 1 ? 's' : ''}`}
                      </span>
                      <button
                        type="button"
                        onClick={() => { setSearchQuery(''); setSelectedCategory(''); setSelectedMuscleGroup(''); }}
                        className="text-[var(--brand-primary)] hover:text-[var(--brand-primary)]/80 transition"
                      >
                        Clear filters
                      </button>
                    </div>
                  )}
                </div>

                {/* Exercise Selection */}
                {showAsCards ? (
                  <div>
                    <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3">
                      Select Exercise {currentExerciseForm.exercise_id && '✓'}
                    </label>
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                      {filteredExercises.map((exercise) => (
                        <div
                          key={exercise.id}
                          onClick={() => setCurrentExerciseForm({ ...currentExerciseForm, exercise_id: exercise.id.toString() })}
                          className={`p-3 rounded-[var(--radius-md)] cursor-pointer transition-all ${
                            currentExerciseForm.exercise_id === exercise.id.toString()
                              ? 'bg-[var(--brand-primary)] text-[var(--text-inverse)]'
                              : 'bg-[var(--bg-tertiary)] text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]/80 border border-[var(--border-subtle)] hover:border-[var(--brand-primary)]/30'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className={`text-sm font-bold mb-1 ${currentExerciseForm.exercise_id === exercise.id.toString() ? 'text-[var(--text-inverse)]' : 'text-[var(--text-primary)]'}`}>
                                {exercise.name}
                              </p>
                              <div className={`flex flex-wrap gap-2 text-xs ${currentExerciseForm.exercise_id === exercise.id.toString() ? 'text-[var(--text-inverse)]/70' : 'text-[var(--text-muted)]'}`}>
                                {exercise.category && <span className="px-2 py-0.5 bg-black/10 rounded">{exercise.category}</span>}
                                {exercise.muscle_group && <span className="px-2 py-0.5 bg-black/10 rounded">{exercise.muscle_group}</span>}
                                {exercise.equipment && <span className="px-2 py-0.5 bg-black/10 rounded">{exercise.equipment}</span>}
                              </div>
                              {exercise.last_performance && (
                                <p className={`text-xs mt-1 font-semibold ${currentExerciseForm.exercise_id === exercise.id.toString() ? 'text-[var(--text-inverse)]/80' : 'text-[var(--brand-primary)]'}`}>
                                  Last: {exercise.last_performance.weight ? `${exercise.last_performance.weight}kg` : ''}{exercise.last_performance.weight && exercise.last_performance.reps ? ' x ' : ''}{exercise.last_performance.reps ? `${exercise.last_performance.reps} reps` : ''}{exercise.last_performance.sets ? ` (${exercise.last_performance.sets} sets)` : ''}
                                </p>
                              )}
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
                  <div>
                    <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Select Exercise</label>
                    <select
                      value={currentExerciseForm.exercise_id}
                      onChange={(e) => setCurrentExerciseForm({ ...currentExerciseForm, exercise_id: e.target.value })}
                      className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-[var(--radius-md)] px-4 py-3 text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-primary)] transition"
                      required
                    >
                      <option value="">Choose an exercise</option>
                      {(isFiltering ? filteredExercises : availableExercises).map((exercise) => (
                        <option key={exercise.id} value={exercise.id}>
                          {exercise.name} {exercise.category && `• ${exercise.category}`} {exercise.muscle_group && `• ${exercise.muscle_group}`}{exercise.last_performance ? ` • Last: ${exercise.last_performance.weight || ''}kg x ${exercise.last_performance.reps || ''} reps` : ''}
                        </option>
                      ))}
                    </select>
                    {filteredExercises.length > MAX_CARDS_DISPLAY && isFiltering && (
                      <p className="text-xs text-[var(--brand-primary)] mt-2">💡 Narrow your search to {MAX_CARDS_DISPLAY} or fewer to see clickable cards</p>
                    )}
                  </div>
                )}

                {/* Exercise Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Sets</label>
                    <input
                      type="number"
                      value={currentExerciseForm.sets}
                      onChange={(e) => setCurrentExerciseForm({ ...currentExerciseForm, sets: e.target.value })}
                      className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-[var(--radius-md)] px-4 py-3 text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--brand-primary)] transition"
                      placeholder="3"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Reps</label>
                    <input
                      type="number"
                      value={currentExerciseForm.reps}
                      onChange={(e) => setCurrentExerciseForm({ ...currentExerciseForm, reps: e.target.value })}
                      className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-[var(--radius-md)] px-4 py-3 text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--brand-primary)] transition"
                      placeholder="10"
                      min="0"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Weight (kg)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={currentExerciseForm.weight}
                      onChange={(e) => setCurrentExerciseForm({ ...currentExerciseForm, weight: e.target.value })}
                      className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-[var(--radius-md)] px-4 py-3 text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--brand-primary)] transition"
                      placeholder="50"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Duration (min)</label>
                    <input
                      type="number"
                      value={currentExerciseForm.duration}
                      onChange={(e) => setCurrentExerciseForm({ ...currentExerciseForm, duration: e.target.value })}
                      className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-[var(--radius-md)] px-4 py-3 text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--brand-primary)] transition"
                      placeholder="20"
                      min="0"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Notes (Optional)</label>
                  <textarea
                    value={currentExerciseForm.notes}
                    onChange={(e) => setCurrentExerciseForm({ ...currentExerciseForm, notes: e.target.value })}
                    className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-[var(--radius-md)] px-4 py-3 text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--brand-primary)] transition resize-none"
                    rows={3}
                    placeholder="Any notes about this exercise?"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full pp-btn-primary"
                >
                  Add Exercise
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* PR Celebration Modal */}
      {prsAchieved.length > 0 && (
        <PRCelebration 
          prs={prsAchieved} 
          onClose={() => setPrsAchieved([])} 
        />
      )}
    </div>
  );
};

export default Workouts;