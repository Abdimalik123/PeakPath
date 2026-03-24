import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { Navigation } from '../components/Navigation';
import { PageHeader } from '../components/PageHeader';
import { useToast } from '../contexts/ToastContext';
import { PRCelebration } from '../components/PRCelebration';
import { Play, Pause, Plus, Check, Clock, RotateCcw, ChevronDown, ChevronUp, Dumbbell, Flame, BookOpen, X } from 'lucide-react';
import client from '../api/client';

interface QuickTemplate {
  id: string;
  name: string;
  description: string;
  exercises: { exercise_id: number; name: string; sets: number | null; reps: number | string | null; weight: number | null }[];
}

interface ActiveExercise {
  exercise_id: number;
  exercise_name: string;
  targetSets: number;
  targetReps: number;
  weight: number;
  completedSets: SetLog[];
  isExpanded: boolean;
}

interface SetLog {
  reps: number;
  weight: number;
  completed: boolean;
  restTimerUsed: boolean;
}

interface AvailableExercise {
  id: number;
  name: string;
  category: string;
  muscle_group: string;
  last_performance?: {
    weight: number | null;
    reps: number | null;
    sets: number | null;
  } | null;
}

const REST_PRESETS = [30, 60, 90, 120, 180];

export default function ActiveWorkout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();

  // Workout state
  const [workoutType, setWorkoutType] = useState(searchParams.get('type') || '');
  const [exercises, setExercises] = useState<ActiveExercise[]>([]);
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [prsAchieved, setPrsAchieved] = useState<any[]>([]);

  // Rest timer
  const [restSeconds, setRestSeconds] = useState(0);
  const [restDuration, setRestDuration] = useState(90);
  const [isResting, setIsResting] = useState(false);
  const restAudioRef = useRef<HTMLAudioElement | null>(null);

  // Add exercise modal
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [availableExercises, setAvailableExercises] = useState<AvailableExercise[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [quickSetForm, setQuickSetForm] = useState({ sets: '3', reps: '10', weight: '' });

  // Templates for quick start
  const [quickTemplates, setQuickTemplates] = useState<QuickTemplate[]>([]);

  // RPE rating at end
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [rpe, setRpe] = useState('');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const STORAGE_KEY = 'uptrakk_active_workout';

  // Persist active workout to localStorage whenever state changes
  useEffect(() => {
    if (!isActive) return;
    // Save current wall-clock timestamp so time away is counted on restore
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      workoutType,
      exercises,
      elapsedSeconds,
      restDuration,
      savedAt: isPaused ? null : Date.now(),
    }));
  }, [isActive, workoutType, exercises, elapsedSeconds, restDuration, isPaused]);

  // On mount: restore saved workout if no route state was passed
  useEffect(() => {
    if (location.state) return; // fresh start from template/route takes priority
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;
    try {
      const { workoutType: wt, exercises: ex, elapsedSeconds: el, restDuration: rd, savedAt } = JSON.parse(saved);
      // Add time elapsed while away (only if workout wasn't paused when navigated away)
      const awaySeconds = savedAt ? Math.floor((Date.now() - savedAt) / 1000) : 0;
      setWorkoutType(wt || '');
      setExercises(ex || []);
      setElapsedSeconds((el || 0) + awaySeconds);
      setRestDuration(rd || 90);
      setIsActive(true);
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const clearSavedWorkout = () => localStorage.removeItem(STORAGE_KEY);

  // Elapsed timer
  useEffect(() => {
    if (!isActive || isPaused) return;
    const interval = setInterval(() => setElapsedSeconds(s => s + 1), 1000);
    return () => clearInterval(interval);
  }, [isActive, isPaused]);

  // Rest timer countdown
  useEffect(() => {
    if (!isResting || restSeconds <= 0) return;
    const interval = setInterval(() => {
      setRestSeconds(s => {
        if (s <= 1) {
          setIsResting(false);
          showToast('Rest complete! Next set.', 'info');
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isResting, restSeconds, showToast]);

  // Load exercises and templates on mount
  useEffect(() => {
    const fetchExercises = async () => {
      try {
        const response = await client.get('/exercises');
        if (response.data.success) {
          setAvailableExercises(response.data.exercises);
        }
      } catch {}
    };
    const fetchTemplates = async () => {
      try {
        const res = await client.get('/workout-templates');
        if (res.data.success) {
          setQuickTemplates(res.data.templates || []);
        }
      } catch {}
    };
    fetchExercises();
    fetchTemplates();
  }, []);

  // Load pre-planned exercises from route state (e.g. from template or repeat)
  useEffect(() => {
    const state = location.state as {
      // exercise_id is optional — built-in templates don't have DB IDs yet
      exercises?: { exercise_id?: number; exercise_name: string; sets: number; reps: number; weight: number }[];
      workoutType?: string;
    } | null;

    if (state?.exercises && state.exercises.length > 0) {
      const preloaded: ActiveExercise[] = state.exercises.map(ex => ({
        exercise_id: ex.exercise_id || 0,
        exercise_name: ex.exercise_name,
        targetSets: ex.sets || 3,
        targetReps: ex.reps || 10,
        weight: ex.weight || 0,
        completedSets: Array.from({ length: ex.sets || 3 }, () => ({
          reps: ex.reps || 10,
          weight: ex.weight || 0,
          completed: false,
          restTimerUsed: false,
        })),
        isExpanded: true,
      }));
      setExercises(preloaded);
    }

    if (state?.workoutType) {
      setWorkoutType(state.workoutType);
    }
  }, [location.state]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const startWorkout = () => {
    if (!workoutType.trim()) {
      showToast('Enter a workout type first', 'warning');
      return;
    }
    setIsActive(true);
    setElapsedSeconds(0);
  };

  const startRestTimer = () => {
    setRestSeconds(restDuration);
    setIsResting(true);
  };

  const skipRest = () => {
    setIsResting(false);
    setRestSeconds(0);
  };

  const addExerciseToWorkout = (exercise: AvailableExercise) => {
    const targetSets = parseInt(quickSetForm.sets) || 3;
    const targetReps = parseInt(quickSetForm.reps) || 10;
    const weight = parseFloat(quickSetForm.weight) || (exercise.last_performance?.weight || 0);

    const sets: SetLog[] = Array.from({ length: targetSets }, () => ({
      reps: targetReps,
      weight,
      completed: false,
      restTimerUsed: false,
    }));

    setExercises(prev => [...prev, {
      exercise_id: exercise.id,
      exercise_name: exercise.name,
      targetSets,
      targetReps,
      weight,
      completedSets: sets,
      isExpanded: true,
    }]);

    setShowAddExercise(false);
    setSearchQuery('');
    setQuickSetForm({ sets: '3', reps: '10', weight: '' });
  };

  const completeSet = (exerciseIdx: number, setIdx: number) => {
    const isCompleted = exercises[exerciseIdx].completedSets[setIdx].completed;
    setExercises(prev => prev.map((ex, i) => {
      if (i !== exerciseIdx) return ex;
      const newSets = [...ex.completedSets];
      newSets[setIdx] = { ...newSets[setIdx], completed: !isCompleted };
      return { ...ex, completedSets: newSets };
    }));
    if (!isCompleted) startRestTimer(); // only start rest on completion, not undo
  };

  const updateSetValue = (exerciseIdx: number, setIdx: number, field: 'reps' | 'weight', value: number) => {
    setExercises(prev => prev.map((ex, i) => {
      if (i !== exerciseIdx) return ex;
      const newSets = [...ex.completedSets];
      newSets[setIdx] = { ...newSets[setIdx], [field]: value };
      return { ...ex, completedSets: newSets };
    }));
  };

  const toggleExerciseExpand = (idx: number) => {
    setExercises(prev => prev.map((ex, i) =>
      i === idx ? { ...ex, isExpanded: !ex.isExpanded } : ex
    ));
  };

  const removeExercise = (idx: number) => {
    setExercises(prev => prev.filter((_, i) => i !== idx));
  };

  const totalCompletedSets = exercises.reduce(
    (sum, ex) => sum + ex.completedSets.filter(s => s.completed).length, 0
  );
  const totalSets = exercises.reduce((sum, ex) => sum + ex.completedSets.length, 0);
  const totalVolume = exercises.reduce(
    (sum, ex) => sum + ex.completedSets.filter(s => s.completed).reduce((v, s) => v + (s.weight * s.reps), 0), 0
  );

  const finishWorkout = async () => {
    setIsSaving(true);
    setShowFinishModal(false);
    clearSavedWorkout();
    try {
      const response = await client.post('/workouts', {
        type: workoutType,
        duration: Math.ceil(elapsedSeconds / 60),
        date: new Date().toISOString().split('T')[0],
        notes: notes || null,
        rpe: rpe ? parseInt(rpe) : null,
        exercises: exercises.map(ex => {
          const completedSets = ex.completedSets.filter(s => s.completed);
          const setCount = completedSets.length || ex.targetSets;
          const avgReps = completedSets.length > 0
            ? Math.round(completedSets.reduce((sum, s) => sum + s.reps, 0) / completedSets.length)
            : ex.targetReps;
          const topWeight = completedSets.length > 0 ? completedSets[0].weight : ex.weight;

          // If exercise_id is 0, the exercise came from a built-in template and has no DB ID yet.
          // Send exercise_name so the backend can look it up or create it.
          const exercisePayload: Record<string, unknown> = {
            sets: setCount,
            reps: avgReps,
            weight: topWeight || null,
            duration: null,
            notes: null,
          };
          if (ex.exercise_id && ex.exercise_id > 0) {
            exercisePayload.exercise_id = ex.exercise_id;
          } else {
            exercisePayload.exercise_name = ex.exercise_name;
          }
          return exercisePayload;
        }),
      });

      if (response.data.success) {
        if (response.data.prs_achieved?.length > 0) {
          setPrsAchieved(response.data.prs_achieved);
        } else {
          showToast(`Workout saved! +${response.data.points_earned || 15} points`, 'success');
          navigate('/train');
        }
      } else {
        showToast(response.data.message || 'Failed to save', 'error');
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to save workout', 'error');
      clearSavedWorkout();
      setShowFinishModal(true);
    } finally {
      setIsSaving(false);
    }
  };

  const loadFromTemplate = (template: QuickTemplate) => {
    const preloaded: ActiveExercise[] = template.exercises
      .filter(ex => ex.exercise_id)
      .map(ex => {
        const sets = typeof ex.sets === 'number' ? ex.sets : 3;
        const reps = typeof ex.reps === 'number' ? ex.reps : 10;
        const weight = ex.weight || 0;
        return {
          exercise_id: ex.exercise_id,
          exercise_name: ex.name,
          targetSets: sets,
          targetReps: reps,
          weight,
          completedSets: Array.from({ length: sets }, () => ({
            reps,
            weight,
            completed: false,
            restTimerUsed: false,
          })),
          isExpanded: true,
        };
      });
    setExercises(preloaded);
    setWorkoutType(template.name);
  };

  const filteredExercises = availableExercises.filter(ex =>
    ex.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pre-workout setup screen
  if (!isActive) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)]">
        <Navigation currentPage="/train" />
        <div className="lg:ml-64 min-h-screen pt-14 lg:pt-16 pb-6">
          <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            <PageHeader title="Start Workout" subtitle="Set up your session" />

            {/* Quick Start from Template */}
            {quickTemplates.length > 0 && !exercises.length && (
              <div className="mb-6">
                <h2 className="text-sm font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3 flex items-center gap-2">
                  <BookOpen className="w-4 h-4" /> Quick Start from Template
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {quickTemplates.map(template => (
                    <button
                      key={template.id}
                      onClick={() => loadFromTemplate(template)}
                      className="pp-card p-4 text-left hover:border-[var(--brand-primary)]/50 transition group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[var(--brand-primary)]/15 flex items-center justify-center flex-shrink-0 group-hover:bg-[var(--brand-primary)]/25 transition">
                          <Dumbbell className="w-5 h-5 text-[var(--brand-primary)]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-[var(--text-primary)] text-sm truncate">{template.name}</p>
                          <p className="text-xs text-[var(--text-muted)]">
                            {template.exercises.length} exercise{template.exercises.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <Play className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--brand-primary)] transition flex-shrink-0" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Loaded exercises preview */}
            {exercises.length > 0 && (
              <div className="pp-card p-4 mb-4">
                <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                  Loaded: {exercises.length} exercise{exercises.length !== 1 ? 's' : ''}
                </p>
                <div className="space-y-1">
                  {exercises.map((ex, i) => (
                    <div key={i} className="flex items-center justify-between text-sm py-1 px-2 rounded bg-[var(--bg-tertiary)]">
                      <span className="text-[var(--text-primary)]">{ex.exercise_name}</span>
                      <span className="text-[var(--text-muted)]">{ex.targetSets}x{ex.targetReps}{ex.weight ? ` @ ${ex.weight}kg` : ''}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pp-card p-8 text-center space-y-6">
              {!exercises.length && (
                <div className="w-24 h-24 mx-auto rounded-full bg-[var(--brand-primary)]/20 flex items-center justify-center">
                  <Dumbbell className="w-12 h-12 text-[var(--brand-primary)]" />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                  Workout Type
                </label>
                <input
                  type="text"
                  value={workoutType}
                  onChange={e => setWorkoutType(e.target.value)}
                  className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-[var(--radius-md)] px-4 py-3 text-[var(--text-primary)] text-center text-lg focus:outline-none focus:border-[var(--brand-primary)] transition"
                  placeholder="e.g., Push Day, Upper Body, Leg Day"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                  Default Rest Timer
                </label>
                <div className="flex gap-2 justify-center flex-wrap">
                  {REST_PRESETS.map(seconds => (
                    <button
                      key={seconds}
                      onClick={() => setRestDuration(seconds)}
                      className={`px-4 py-2 rounded-lg text-sm font-bold transition ${
                        restDuration === seconds
                          ? 'bg-[var(--brand-primary)] text-[var(--text-inverse)]'
                          : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]/80'
                      }`}
                    >
                      {seconds < 60 ? `${seconds}s` : `${seconds / 60}m${seconds % 60 ? ` ${seconds % 60}s` : ''}`}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={startWorkout}
                className="w-full py-4 bg-[var(--brand-primary)] text-[var(--text-inverse)] font-bold text-lg rounded-xl hover:opacity-90 transition flex items-center justify-center gap-3"
              >
                <Play className="w-6 h-6" />
                {exercises.length > 0 ? 'Start with Template' : 'Start Workout'}
              </button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <Navigation currentPage="/train" />
      <div className="lg:ml-64 min-h-screen pt-14 lg:pt-16 pb-6">
        <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4 pb-32">

          {/* Live Header */}
          <div className="sticky top-14 lg:top-16 z-20 bg-[var(--bg-primary)] pb-4">
            <div className="pp-card p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-lg font-bold text-[var(--text-primary)]">{workoutType}</h2>
                  <p className="text-xs text-[var(--text-muted)]">
                    {totalCompletedSets}/{totalSets} sets | {Math.round(totalVolume).toLocaleString()}kg volume
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-2xl font-mono font-bold ${isPaused ? 'text-[var(--warning)]' : 'text-[var(--brand-primary)]'}`}>
                    {formatTime(elapsedSeconds)}
                  </p>
                  <div className="flex gap-1 mt-1">
                    <button
                      onClick={() => setIsPaused(!isPaused)}
                      className="w-11 h-11 flex items-center justify-center rounded-lg bg-[var(--bg-tertiary)] hover:bg-[var(--bg-elevated)] transition"
                      title={isPaused ? 'Resume' : 'Pause'}
                    >
                      {isPaused ? <Play className="w-5 h-5 text-[var(--brand-primary)]" /> : <Pause className="w-5 h-5 text-[var(--warning)]" />}
                    </button>
                    <button
                      onClick={() => setShowFinishModal(true)}
                      className="h-11 px-4 flex items-center justify-center rounded-lg bg-[var(--brand-primary)] hover:opacity-90 transition text-[var(--text-inverse)] text-sm font-bold"
                    >
                      Finish
                    </button>
                  </div>
                </div>
              </div>

              {/* Rest Timer Bar */}
              {isResting && (
                <div className="bg-[var(--bg-tertiary)] rounded-xl p-3 border border-[var(--brand-primary)]/30">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[var(--brand-primary)]" />
                      <span className="text-sm font-bold text-[var(--text-primary)]">Rest Timer</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-mono font-bold text-[var(--brand-primary)]">
                        {formatTime(restSeconds)}
                      </span>
                      <button
                        onClick={skipRest}
                        className="text-sm px-3 py-2 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition min-h-[36px]"
                      >
                        Skip
                      </button>
                    </div>
                  </div>
                  <div className="w-full bg-[var(--bg-secondary)] rounded-full h-2">
                    <div
                      className="bg-[var(--brand-primary)] h-2 rounded-full transition-all duration-1000"
                      style={{ width: `${(restSeconds / restDuration) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Exercise List */}
          <div className="space-y-3 mt-2">
            {exercises.map((exercise, exIdx) => (
              <div key={exIdx} className="pp-card overflow-hidden">
                {/* Exercise Header */}
                <button
                  onClick={() => toggleExerciseExpand(exIdx)}
                  className="w-full flex items-center justify-between p-4 hover:bg-[var(--bg-tertiary)]/50 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[var(--brand-primary)]/20 flex items-center justify-center">
                      <Dumbbell className="w-4 h-4 text-[var(--brand-primary)]" />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-[var(--text-primary)] text-sm">{exercise.exercise_name}</p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {exercise.completedSets.filter(s => s.completed).length}/{exercise.completedSets.length} sets
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {exercise.completedSets.every(s => s.completed) && (
                      <Check className="w-5 h-5 text-[var(--success)]" />
                    )}
                    {exercise.isExpanded ? <ChevronUp className="w-4 h-4 text-[var(--text-muted)]" /> : <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />}
                  </div>
                </button>

                {/* Sets */}
                {exercise.isExpanded && (
                  <div className="px-4 pb-4">
                    <div className="grid grid-cols-[32px_1fr_1fr_56px] gap-2 mb-2 text-xs font-bold text-[var(--text-muted)] uppercase">
                      <span>#</span>
                      <span>kg</span>
                      <span>Reps</span>
                      <span></span>
                    </div>
                    {exercise.completedSets.map((set, setIdx) => (
                      <div
                        key={setIdx}
                        className={`grid grid-cols-[32px_1fr_1fr_56px] gap-2 items-center py-1.5 ${
                          set.completed ? 'opacity-60' : ''
                        }`}
                      >
                        <span className={`text-sm font-bold ${set.completed ? 'text-[var(--success)]' : 'text-[var(--text-muted)]'}`}>
                          {setIdx + 1}
                        </span>
                        <input
                          type="number"
                          value={set.weight || ''}
                          onChange={e => updateSetValue(exIdx, setIdx, 'weight', parseFloat(e.target.value) || 0)}
                          className="bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-lg px-2 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-primary)] w-full min-w-0"
                          step="0.5"
                          inputMode="decimal"
                        />
                        <input
                          type="number"
                          value={set.reps || ''}
                          onChange={e => updateSetValue(exIdx, setIdx, 'reps', parseInt(e.target.value) || 0)}
                          className="bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-lg px-2 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-primary)] w-full min-w-0"
                          inputMode="numeric"
                        />
                        <button
                          onClick={() => completeSet(exIdx, setIdx)}
                          disabled={!set.completed && (!set.reps || set.reps < 1)}
                          title={set.completed ? 'Tap to undo' : 'Mark set done'}
                          className={`w-full py-2 rounded-lg text-xs font-bold transition flex items-center justify-center ${
                            set.completed
                              ? 'bg-[var(--success)] text-white hover:bg-[var(--success)]/80'
                              : 'bg-[var(--brand-primary)] text-[var(--text-inverse)] hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed'
                          }`}
                        >
                          {set.completed ? <Check className="w-4 h-4" /> : 'Done'}
                        </button>
                      </div>
                    ))}

                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => {
                          setExercises(prev => prev.map((ex, i) => {
                            if (i !== exIdx) return ex;
                            return {
                              ...ex,
                              completedSets: [...ex.completedSets, {
                                reps: ex.targetReps,
                                weight: ex.weight,
                                completed: false,
                                restTimerUsed: false,
                              }],
                            };
                          }));
                        }}
                        className="text-xs px-3 py-1.5 rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition"
                      >
                        + Add Set
                      </button>
                      <button
                        onClick={() => removeExercise(exIdx)}
                        className="text-xs px-3 py-1.5 rounded-lg text-[var(--error)] hover:bg-[var(--error)]/10 transition"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Add Exercise Button */}
            <button
              onClick={() => setShowAddExercise(true)}
              className="w-full pp-card p-4 border-2 border-dashed border-[var(--border-default)] hover:border-[var(--brand-primary)]/50 transition flex items-center justify-center gap-2 text-[var(--text-muted)] hover:text-[var(--brand-primary)]"
            >
              <Plus className="w-5 h-5" />
              <span className="font-bold text-sm">Add Exercise</span>
            </button>
          </div>
        </main>

        {/* Add Exercise Modal */}
        {showAddExercise && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
            <div className="pp-card p-6 max-w-lg w-full max-h-[85vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-[var(--text-primary)]">Add Exercise</h3>
                <button onClick={() => { setShowAddExercise(false); setSearchQuery(''); }} className="p-2 hover:bg-[var(--bg-tertiary)] rounded-lg">
                  <X className="w-4 h-4 text-[var(--text-muted)]" />
                </button>
              </div>

              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-lg px-4 py-3 text-[var(--text-primary)] mb-4 focus:outline-none focus:border-[var(--brand-primary)]"
                placeholder="Search exercises..."
                autoFocus
              />

              {/* Quick set config */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div>
                  <label className="block text-xs text-[var(--text-muted)] mb-1">Sets</label>
                  <input
                    type="number"
                    value={quickSetForm.sets}
                    onChange={e => setQuickSetForm({ ...quickSetForm, sets: e.target.value })}
                    className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[var(--text-muted)] mb-1">Reps</label>
                  <input
                    type="number"
                    value={quickSetForm.reps}
                    onChange={e => setQuickSetForm({ ...quickSetForm, reps: e.target.value })}
                    className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[var(--text-muted)] mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    value={quickSetForm.weight}
                    onChange={e => setQuickSetForm({ ...quickSetForm, weight: e.target.value })}
                    className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)]"
                    placeholder="Auto"
                  />
                </div>
              </div>

              <div className="space-y-1 max-h-64 overflow-y-auto">
                {filteredExercises.slice(0, 20).map(exercise => (
                  <button
                    key={exercise.id}
                    onClick={() => addExerciseToWorkout(exercise)}
                    className="w-full text-left p-3 rounded-lg hover:bg-[var(--bg-tertiary)] transition"
                  >
                    <p className="text-sm font-bold text-[var(--text-primary)]">{exercise.name}</p>
                    <p className="text-xs text-[var(--text-muted)]">
                      {[exercise.category, exercise.muscle_group].filter(Boolean).join(' / ')}
                      {exercise.last_performance?.weight && (
                        <span className="text-[var(--brand-primary)] ml-2">
                          Last: {exercise.last_performance.weight}kg x {exercise.last_performance.reps}
                        </span>
                      )}
                    </p>
                  </button>
                ))}
                {filteredExercises.length === 0 && (
                  <p className="text-center text-[var(--text-muted)] py-8 text-sm">No exercises found</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Finish Workout Modal */}
        {showFinishModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
            <div className="pp-card p-8 max-w-md w-full">
              <h3 className="text-xl font-bold text-[var(--text-primary)] mb-6 text-center">Finish Workout</h3>

              {/* Summary */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-[var(--brand-primary)]">{formatTime(elapsedSeconds)}</p>
                  <p className="text-xs text-[var(--text-muted)]">Duration</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-[var(--brand-primary)]">{totalCompletedSets}</p>
                  <p className="text-xs text-[var(--text-muted)]">Sets</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-[var(--brand-primary)]">{Math.round(totalVolume).toLocaleString()}kg</p>
                  <p className="text-xs text-[var(--text-muted)]">Volume</p>
                </div>
              </div>

              {/* RPE */}
              <div className="mb-4">
                <label className="block text-xs font-bold text-[var(--text-muted)] uppercase mb-2">
                  How hard was it? (RPE 1-10)
                </label>
                <div className="flex gap-1.5 flex-wrap">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                    <button
                      key={n}
                      onClick={() => setRpe(n.toString())}
                      className={`w-9 h-9 rounded-lg text-sm font-bold transition ${
                        rpe === n.toString()
                          ? 'bg-[var(--brand-primary)] text-[var(--text-inverse)]'
                          : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]/80'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="mb-6">
                <label className="block text-xs font-bold text-[var(--text-muted)] uppercase mb-2">Notes</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-lg px-4 py-3 text-[var(--text-primary)] resize-none focus:outline-none focus:border-[var(--brand-primary)]"
                  rows={2}
                  placeholder="How did it go?"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowFinishModal(false)}
                  className="flex-1 py-3 bg-[var(--bg-tertiary)] text-[var(--text-primary)] font-bold rounded-lg hover:bg-[var(--bg-tertiary)]/80 transition"
                >
                  Continue
                </button>
                <button
                  onClick={finishWorkout}
                  disabled={isSaving || totalCompletedSets === 0}
                  title={totalCompletedSets === 0 ? 'Complete at least one set first' : undefined}
                  className="flex-1 py-3 bg-[var(--brand-primary)] text-[var(--text-inverse)] font-bold rounded-lg hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isSaving ? 'Saving...' : totalCompletedSets === 0 ? 'No sets completed' : 'Save Workout'}
                </button>
              </div>

            </div>
          </div>
        )}

        {/* PR Celebration */}
        {prsAchieved.length > 0 && (
          <PRCelebration
            prs={prsAchieved}
            onClose={() => {
              setPrsAchieved([]);
              showToast('Workout saved!', 'success');
              navigate('/train');
            }}
          />
        )}
      </div>
    </div>
  );
}
