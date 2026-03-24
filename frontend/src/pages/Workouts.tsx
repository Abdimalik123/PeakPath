import React, { useState, useEffect } from 'react';
import { Navigation } from '../components/Navigation';
import { PageHeader } from '../components/PageHeader';
import { AddWorkoutModal } from '../components/AddWorkoutModal';
import { PRCelebration } from '../components/PRCelebration';
import { useWorkouts } from '../hooks/useWorkouts';
import { useToast } from '../contexts/ToastContext';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Filter, Dumbbell, Play, Trash2, Timer, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';
import client from '../api/client';

interface SavedTemplate {
  id: number;
  name: string;
  description: string;
  exercises: { exercise_id: number; name: string; sets: number; reps: string | number; weight: number | null }[];
}

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

const formatWorkoutDate = (dateStr: string) => {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  d.setHours(0, 0, 0, 0);
  if (d.getTime() === today.getTime()) return 'Today';
  if (d.getTime() === yesterday.getTime()) return 'Yesterday';
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
};

const Workouts: React.FC = () => {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [savedTemplates, setSavedTemplates] = useState<SavedTemplate[]>([]);
  const [activeWorkoutName, setActiveWorkoutName] = useState<string | null>(null);
  const [showAllTemplates, setShowAllTemplates] = useState(false);
  const TEMPLATES_LIMIT = 4;

  useEffect(() => {
    const saved = localStorage.getItem('uptrakk_active_workout');
    if (saved) {
      try {
        const { workoutType } = JSON.parse(saved);
        setActiveWorkoutName(workoutType || 'Workout');
      } catch {
        localStorage.removeItem('uptrakk_active_workout');
      }
    }
  }, []);
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
  const [historySearch, setHistorySearch] = useState('');
  const [historyTypeFilter, setHistoryTypeFilter] = useState('');

  const workoutTypes = Array.from(new Set(workouts.map(w => w.type))).sort();
  const filteredWorkouts = workouts.filter(w => {
    const matchesSearch = !historySearch ||
      w.type.toLowerCase().includes(historySearch.toLowerCase()) ||
      w.date?.toLowerCase().includes(historySearch.toLowerCase());
    const matchesType = !historyTypeFilter || w.type === historyTypeFilter;
    return matchesSearch && matchesType;
  });

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
  const [newExerciseErrors, setNewExerciseErrors] = useState({ name: false, category: false });
  
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
    setNewExerciseErrors({ name: false, category: false });
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
    const errors = { name: !newExerciseForm.name.trim(), category: !newExerciseForm.category.trim() };
    setNewExerciseErrors(errors);
    if (errors.name || errors.category) return;
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
        setNewExerciseErrors({ name: false, category: false });
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
  
  // Load available exercises and saved templates on mount
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
    const fetchTemplates = async () => {
      try {
        const res = await client.get('/workout-templates');
        if (res.data.success) {
          // Support both new (user_templates) and legacy (templates) response keys
          setSavedTemplates(res.data.user_templates || res.data.templates || []);
        }
      } catch {}
    };

    fetchExercises();
    fetchTemplates();
  }, []);

  const deleteTemplate = async (id: number) => {
    try {
      await client.delete(`/workout-templates/${id}`);
      setSavedTemplates(prev => prev.filter(t => Number(t.id) !== Number(id)));
      showToast('Template deleted');
    } catch {
      showToast('Failed to delete template', 'error');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="text-[var(--brand-primary)] text-lg font-medium">Loading workouts...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <Navigation currentPage="/train" />

      {/* Main Content */}
      <div className="lg:ml-64 min-h-screen pt-14 lg:pt-16 pb-6">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <PageHeader
            title="Workouts"
            subtitle="Track your training sessions"
            actionButton={{
              label: "Create Workout",
              onClick: () => setShowAddModal(true)
            }}
          />

          {/* Resume in-progress workout */}
          {activeWorkoutName && (
            <button
              onClick={() => navigate('/active-workout')}
              className="w-full mb-4 flex items-center gap-3 p-4 rounded-[var(--radius-lg)] bg-[var(--brand-primary)]/10 border border-[var(--brand-primary)]/40 hover:bg-[var(--brand-primary)]/15 transition text-left"
            >
              <div className="w-9 h-9 rounded-full bg-[var(--brand-primary)] flex items-center justify-center flex-shrink-0 animate-pulse">
                <Timer className="w-4 h-4 text-[var(--text-inverse)]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-[var(--brand-primary)]">Workout in progress</p>
                <p className="text-xs text-[var(--text-muted)] truncate">{activeWorkoutName} — tap to resume</p>
              </div>
            </button>
          )}

          {/* Primary Action */}
          <div className="mb-6">
            <Link
              to="/active-workout"
              className="flex items-center justify-center gap-2 w-full py-3.5 bg-[var(--brand-primary)] text-[var(--text-inverse)] font-bold rounded-[var(--radius-lg)] hover:opacity-90 transition text-sm"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Start Workout
            </Link>
          </div>

          {/* Saved Templates */}
          {savedTemplates.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                  My Templates <span className="ml-1 text-[var(--text-muted)]">({savedTemplates.length})</span>
                </h2>
                {savedTemplates.length > TEMPLATES_LIMIT && (
                  <button
                    onClick={() => setShowAllTemplates(v => !v)}
                    className="flex items-center gap-1 text-xs text-[var(--brand-primary)] hover:opacity-80 transition"
                  >
                    {showAllTemplates ? (
                      <><ChevronUp className="w-3.5 h-3.5" /> Show less</>
                    ) : (
                      <><ChevronDown className="w-3.5 h-3.5" /> Show all {savedTemplates.length}</>
                    )}
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(showAllTemplates ? savedTemplates : savedTemplates.slice(0, TEMPLATES_LIMIT)).map(template => (
                  <div key={template.id} className="pp-card p-4 flex items-center gap-3 group">
                    <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--brand-primary)]/15 flex items-center justify-center flex-shrink-0">
                      <Dumbbell className="w-5 h-5 text-[var(--brand-primary)]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[var(--text-primary)] text-sm truncate">{template.name}</p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {template.exercises.length} exercise{template.exercises.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <button
                      onClick={() => navigate('/active-workout', {
                        state: {
                          exercises: template.exercises.map(ex => ({
                            exercise_id: ex.exercise_id,
                            exercise_name: ex.name,
                            sets: ex.sets || 3,
                            reps: parseInt(String(ex.reps)) || 10,
                            weight: ex.weight || 0,
                          })),
                          workoutType: template.name,
                        }
                      })}
                      className="p-2 rounded-[var(--radius-md)] hover:bg-[var(--brand-primary)]/15 text-[var(--text-muted)] hover:text-[var(--brand-primary)] transition flex-shrink-0"
                      title="Start workout"
                    >
                      <Play className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteTemplate(Number(template.id))}
                      className="p-2 rounded-[var(--radius-md)] hover:bg-[var(--error)]/10 text-[var(--text-muted)] hover:text-[var(--error)] transition flex-shrink-0"
                      title="Delete template"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-[var(--error)]/10 border border-[var(--error)]/30 rounded-[var(--radius-lg)]">
              <p className="text-[var(--error)] text-sm text-center font-medium">{error}</p>
            </div>
          )}

          {/* Workout Log */}
          <div className="space-y-3">
            {/* Search & Filter */}
            {workouts.length > 0 && (
              <div className="flex gap-2 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                  <input
                    type="text"
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                    placeholder="Search workouts..."
                    className="w-full pl-9 pr-3 py-2.5 bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-[var(--radius-lg)] text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--brand-primary)]"
                  />
                </div>
                {workoutTypes.length > 1 && (
                  <select
                    value={historyTypeFilter}
                    onChange={(e) => setHistoryTypeFilter(e.target.value)}
                    className="px-3 py-2.5 bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-[var(--radius-lg)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-primary)]"
                  >
                    <option value="">All Types</option>
                    {workoutTypes.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {filteredWorkouts.length === 0 && workouts.length > 0 ? (
              <div className="pp-card p-8 text-center">
                <Filter className="w-10 h-10 text-[var(--text-muted)] mx-auto mb-3 opacity-40" />
                <p className="text-[var(--text-muted)] text-sm">No workouts match your search</p>
                <button onClick={() => { setHistorySearch(''); setHistoryTypeFilter(''); }} className="text-[var(--brand-primary)] text-sm mt-2 font-medium">Clear filters</button>
              </div>
            ) : workouts.length === 0 ? (
              <div className="pp-card p-12 text-center">
                <svg className="w-16 h-16 text-[var(--text-muted)] mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">No Workouts Yet</h3>
                <p className="text-[var(--text-muted)] text-sm">Hit 'Start Workout' above to begin your first session, or 'Create Workout' to log a previous one.</p>
              </div>
            ) : (
              filteredWorkouts.map((workout) => {
                const isExpanded = selectedWorkout?.id === workout.id;
                return (
                  <div key={workout.id} className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-secondary)] overflow-hidden">
                    {/* Summary row — always visible */}
                    <button
                      className="w-full p-4 flex items-center gap-3 hover:bg-[var(--bg-tertiary)] transition text-left"
                      onClick={() => isExpanded ? setSelectedWorkout(null) : fetchWorkoutDetails(workout.id)}
                    >
                      <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--brand-primary)]/15 flex items-center justify-center flex-shrink-0">
                        <Dumbbell className="w-5 h-5 text-[var(--brand-primary)]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-[var(--text-primary)] text-sm">{workout.type}</p>
                        <p className="text-xs text-[var(--text-muted)] mt-0.5">
                          {formatWorkoutDate(workout.date)}
                          {workout.duration ? ` · ${workout.duration} min` : ''}
                          {workout.exercise_count != null ? ` · ${workout.exercise_count} exercise${workout.exercise_count !== 1 ? 's' : ''}` : ''}
                        </p>
                      </div>
                      {isExpanded
                        ? <ChevronUp className="w-4 h-4 text-[var(--text-muted)] flex-shrink-0" />
                        : <ChevronDown className="w-4 h-4 text-[var(--text-muted)] flex-shrink-0" />
                      }
                    </button>

                    {/* Expanded exercise log */}
                    {isExpanded && (
                      <div className="border-t border-[var(--border-default)] px-4 pb-4">
                        {!selectedWorkout ? (
                          <div className="flex justify-center py-5">
                            <div className="w-5 h-5 border-2 border-[var(--brand-primary)] border-t-transparent rounded-full animate-spin" />
                          </div>
                        ) : selectedWorkout.exercises?.length > 0 ? (
                          <div className="mt-1">
                            {selectedWorkout.exercises.map((ex, i) => (
                              <div key={i} className="flex items-center justify-between py-2.5 border-b border-[var(--border-default)] last:border-0">
                                <span className="text-sm font-medium text-[var(--text-primary)]">{ex.name}</span>
                                <span className="text-xs text-[var(--text-muted)]">
                                  {[
                                    ex.sets > 0 ? `${ex.sets} sets` : null,
                                    ex.reps > 0 ? `${ex.reps} reps` : null,
                                    ex.weight > 0 ? `${ex.weight} kg` : null,
                                  ].filter(Boolean).join(' · ')}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-[var(--text-muted)] text-center py-4">No exercises recorded for this session</p>
                        )}
                        <div className="flex items-center justify-between mt-3 pt-1">
                          <div className="flex gap-3">
                            <button
                              onClick={() => setShowAddExerciseModal(true)}
                              className="text-xs text-[var(--brand-primary)] hover:opacity-80 font-medium transition"
                            >
                              + Add exercise
                            </button>
                            <button
                              onClick={() => navigate('/active-workout', {
                                state: {
                                  exercises: selectedWorkout?.exercises?.map(ex => ({
                                    exercise_id: ex.exercise_id,
                                    exercise_name: ex.name,
                                    sets: ex.sets || 3,
                                    reps: ex.reps || 10,
                                    weight: ex.weight || 0,
                                  })) ?? [],
                                  workoutType: workout.type,
                                }
                              })}
                              className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] font-medium transition flex items-center gap-1"
                            >
                              <RotateCcw className="w-3 h-3" /> Repeat
                            </button>
                          </div>
                          <button
                            onClick={() => handleDelete(workout.id)}
                            className="p-1.5 hover:bg-[var(--error)]/10 rounded-[var(--radius-md)] text-[var(--text-muted)] hover:text-[var(--error)] transition"
                            title="Delete workout"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          <Link
            to="/templates"
            className="mt-2 flex items-center justify-between px-4 py-3 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] transition text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            <span>Browse workout templates</span>
            <span className="text-[var(--brand-primary)]">→</span>
          </Link>
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
              <button onClick={resetExerciseModal} className="p-2 hover:bg-[var(--bg-tertiary)] rounded-[var(--radius-md)] transition">
                <svg className="w-6 h-6 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex gap-2 mb-6">
              <button
                type="button"
                onClick={() => setIsCreatingNewExercise(false)}
                className={`flex-1 py-2 px-4 rounded-[var(--radius-md)] text-sm font-bold uppercase tracking-wider transition ${
                  !isCreatingNewExercise ? 'pp-btn-primary' : 'pp-btn-ghost'
                }`}
              >
                Select Existing
              </button>
              <button
                type="button"
                onClick={() => setIsCreatingNewExercise(true)}
                className={`flex-1 py-2 px-4 rounded-[var(--radius-md)] text-sm font-bold uppercase tracking-wider transition ${
                  isCreatingNewExercise ? 'pp-btn-primary' : 'pp-btn-ghost'
                }`}
              >
                Create New
              </button>
            </div>

            {isCreatingNewExercise ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                    Exercise Name <span className="text-[var(--error)]">*</span>
                  </label>
                  <input
                    type="text"
                    value={newExerciseForm.name}
                    onChange={(e) => {
                      setNewExerciseForm({ ...newExerciseForm, name: e.target.value });
                      if (e.target.value.trim()) setNewExerciseErrors(prev => ({ ...prev, name: false }));
                    }}
                    className={`w-full bg-[var(--bg-tertiary)] border rounded-[var(--radius-md)] px-4 py-3 text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none transition ${newExerciseErrors.name ? 'border-[var(--error)] focus:border-[var(--error)]' : 'border-[var(--border-default)] focus:border-[var(--brand-primary)]'}`}
                    placeholder="e.g., Bench Press"
                  />
                  {newExerciseErrors.name && <p className="text-[var(--error)] text-xs mt-1">Exercise name is required</p>}
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                    Category <span className="text-[var(--error)]">*</span>
                  </label>
                  <input
                    type="text"
                    value={newExerciseForm.category}
                    onChange={(e) => {
                      setNewExerciseForm({ ...newExerciseForm, category: e.target.value });
                      if (e.target.value.trim()) setNewExerciseErrors(prev => ({ ...prev, category: false }));
                    }}
                    className={`w-full bg-[var(--bg-tertiary)] border rounded-[var(--radius-md)] px-4 py-3 text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none transition ${newExerciseErrors.category ? 'border-[var(--error)] focus:border-[var(--error)]' : 'border-[var(--border-default)] focus:border-[var(--brand-primary)]'}`}
                    placeholder="e.g., Strength, Cardio, Bodyweight"
                  />
                  {newExerciseErrors.category && <p className="text-[var(--error)] text-xs mt-1">Category is required</p>}
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Description <span className="text-[var(--text-muted)] normal-case font-normal">(optional)</span></label>
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