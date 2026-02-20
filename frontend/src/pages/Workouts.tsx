import React, { useState, useEffect } from 'react';
import { WorkoutCard } from '../components/WorkoutCard';
import { Navigation } from '../components/Navigation';
import { PageHeader } from '../components/PageHeader';
import { EmptyState } from '../components/EmptyState';
import { AddWorkoutModal } from '../components/AddWorkoutModal';
import { WorkoutDetails } from '../components/WorkoutDetails';
import { useWorkouts } from '../hooks/useWorkouts';

const Workouts: React.FC = () => {
  const {
    workouts,
    selectedWorkout,
    loading,
    error,
    formData,
    setFormData,
    exercisesToAdd,
    fetchWorkoutDetails,
    handleSubmit,
    handleDelete,
    removeExercise
  } = useWorkouts();
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddExerciseModal, setShowAddExerciseModal] = useState(false);
  
  // Exercise modal state
  const [availableExercises, setAvailableExercises] = useState<any[]>([]);
  const [filteredExercises, setFilteredExercises] = useState<any[]>([]);
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
    // Mock implementation - replace with actual API call
    const newExercise = {
      id: Date.now(),
      name: newExerciseForm.name,
      category: newExerciseForm.category,
      muscle_group: '',
      equipment: '',
      description: newExerciseForm.description
    };
    setAvailableExercises([...availableExercises, newExercise]);
    setCurrentExerciseForm({ ...currentExerciseForm, exercise_id: newExercise.id.toString() });
    setIsCreatingNewExercise(false);
    setNewExerciseForm({ name: '', category: '', description: '' });
  };
  
  const handleAddExerciseToList = () => {
    if (!currentExerciseForm.exercise_id) return;
    
    const selectedExercise = availableExercises.find(
      ex => ex.id === parseInt(currentExerciseForm.exercise_id)
    );
    
    if (!selectedExercise) return;
    
    // This would be handled by the useWorkouts hook in a real implementation
    resetExerciseModal();
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
  
  // Load available exercises on mount
  useEffect(() => {
    // Mock data - replace with actual API call
    setAvailableExercises([
      { id: 1, name: 'Push-ups', category: 'Chest', muscle_group: 'Chest', equipment: 'Bodyweight' },
      { id: 2, name: 'Squats', category: 'Legs', muscle_group: 'Quadriceps', equipment: 'Bodyweight' },
      { id: 3, name: 'Pull-ups', category: 'Back', muscle_group: 'Lats', equipment: 'Pull-up bar' }
    ]);
  }, []);
  
  if (loading) {
    return (
      <div className="min-h-screen bg-[#121420] flex items-center justify-center">
        <div className="text-cyan-400 text-xl">Loading workouts...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121420] text-gray-300">
      <Navigation currentPage="/workouts" />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <PageHeader
          title="Workouts"
          subtitle="Track your training sessions"
          actionButton={{
            label: "+ Log Workout",
            onClick: () => setShowAddModal(true)
          }}
        />

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Workouts List */}
          <div className="lg:col-span-2 space-y-4">
            {workouts.length === 0 ? (
              <EmptyState
                icon={
                  <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                }
                title="No Workouts Yet"
                description="Start tracking your fitness journey"
                actionButton={{
                  label: "Log First Workout",
                  onClick: () => setShowAddModal(true)
                }}
              />
            ) : (
              workouts.map((workout) => {
                const workoutData = {
                  id: workout.id.toString(),
                  type: workout.type,
                  date: workout.date,
                  duration: workout.duration,
                  exercise_count: 0 // You may want to track this from exercises
                };
                
                return (
                  <WorkoutCard 
                    key={workout.id}
                    workout={workoutData}
                    onClick={(id) => fetchWorkoutDetails(parseInt(id))}
                  />
                );
              })
            )}
          </div>

          <div className="space-y-6">
            {selectedWorkout && (
              <WorkoutDetails workout={selectedWorkout} onDelete={handleDelete} />
            )}
          </div>
        </div>
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
          <div className="bg-[#1c1f2e] border border-white/5 rounded-[2rem] p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-white">Add Exercise</h3>
              <button onClick={resetExerciseModal} className="p-2 hover:bg-white/5 rounded-lg transition">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex gap-2 mb-6">
              <button
                type="button"
                onClick={() => setIsCreatingNewExercise(false)}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold uppercase tracking-wider transition ${
                  !isCreatingNewExercise ? 'bg-cyan-500 text-[#121420]' : 'bg-[#0f111a] text-gray-400 hover:text-white'
                }`}
              >
                Select Existing
              </button>
              <button
                type="button"
                onClick={() => setIsCreatingNewExercise(true)}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold uppercase tracking-wider transition ${
                  isCreatingNewExercise ? 'bg-cyan-500 text-[#121420]' : 'bg-[#0f111a] text-gray-400 hover:text-white'
                }`}
              >
                Create New
              </button>
            </div>

            {isCreatingNewExercise ? (
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
                    placeholder="Brief description"
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
              <form onSubmit={(e) => { e.preventDefault(); handleAddExerciseToList(); }} className="space-y-4">
                {/* Search and Filters */}
                <div className="space-y-3 pb-4 border-b border-white/5">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Search Exercises</label>
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
                        onClick={() => { setSearchQuery(''); setSelectedCategory(''); setSelectedMuscleGroup(''); }}
                        className="text-cyan-400 hover:text-cyan-300 transition"
                      >
                        Clear filters
                      </button>
                    </div>
                  )}
                </div>

                {/* Exercise Selection */}
                {showAsCards ? (
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
                              <p className={`text-sm font-bold mb-1 ${currentExerciseForm.exercise_id === exercise.id.toString() ? 'text-[#121420]' : 'text-white'}`}>
                                {exercise.name}
                              </p>
                              <div className={`flex flex-wrap gap-2 text-xs ${currentExerciseForm.exercise_id === exercise.id.toString() ? 'text-[#121420]/70' : 'text-gray-500'}`}>
                                {exercise.category && <span className="px-2 py-0.5 bg-black/10 rounded">{exercise.category}</span>}
                                {exercise.muscle_group && <span className="px-2 py-0.5 bg-black/10 rounded">{exercise.muscle_group}</span>}
                                {exercise.equipment && <span className="px-2 py-0.5 bg-black/10 rounded">{exercise.equipment}</span>}
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
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Select Exercise</label>
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
                    {filteredExercises.length > MAX_CARDS_DISPLAY && isFiltering && (
                      <p className="text-xs text-cyan-400 mt-2">💡 Narrow your search to {MAX_CARDS_DISPLAY} or fewer to see clickable cards</p>
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
                      className="w-full bg-[#0f111a] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
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
                  Add Exercise
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