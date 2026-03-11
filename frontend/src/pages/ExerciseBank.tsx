import { useState, useEffect, useRef } from 'react';
import { Navigation } from '../components/Navigation';
import { PageHeader } from '../components/PageHeader';
import { useToast } from '../contexts/ToastContext';
import { Search, X, ChevronDown, Dumbbell } from 'lucide-react';
import client from '../api/client';

interface Exercise {
  id: string;
  name: string;
  muscle_groups: string[];
  equipment: string;
  difficulty: string;
  instructions: string[];
  form_tips: string[];
  common_mistakes: string[];
}

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: 'bg-green-500/20 text-green-400',
  intermediate: 'bg-yellow-500/20 text-yellow-400',
  advanced: 'bg-red-500/20 text-red-400',
};

export default function ExerciseBank() {
  const { showToast } = useToast();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState('');
  const [selectedEquipment, setSelectedEquipment] = useState('');
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const searchRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (searchRef.current) clearTimeout(searchRef.current);
    searchRef.current = setTimeout(() => {
      fetchExercises(search, selectedMuscle, selectedEquipment);
    }, 300);
    return () => { if (searchRef.current) clearTimeout(searchRef.current); };
  }, [search, selectedMuscle, selectedEquipment]);

  const fetchExercises = async (q = '', muscle = '', equipment = '') => {
    try {
      const params = new URLSearchParams();
      if (q) params.set('search', q);
      if (muscle) params.set('muscle', muscle);
      if (equipment) params.set('equipment', equipment);
      const res = await client.get(`/exercise-bank?${params.toString()}`);
      if (res.data.success) setExercises(res.data.exercises);
    } catch {
      showToast('Failed to load exercises', 'error');
    } finally {
      setLoading(false);
    }
  };

  const allMuscles = Array.from(new Set(
    exercises.flatMap(ex => ex.muscle_groups)
  )).sort();

  const allEquipment = Array.from(new Set(
    exercises.map(ex => ex.equipment)
  )).sort();

  const hasFilters = search || selectedMuscle || selectedEquipment;

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <Navigation />

      <main className="lg:ml-64 pt-14 lg:pt-16 pb-6 min-h-screen">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <PageHeader
            title="Exercise Bank"
            subtitle={`${exercises.length} exercises`}
          />

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search exercises..."
                className="w-full bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-[var(--radius-md)] pl-9 pr-4 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--brand-primary)] transition"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="relative">
              <select
                value={selectedMuscle}
                onChange={e => setSelectedMuscle(e.target.value)}
                className="appearance-none bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-[var(--radius-md)] pl-3 pr-8 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-primary)] transition"
              >
                <option value="">All Muscles</option>
                {allMuscles.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] pointer-events-none" />
            </div>

            <div className="relative">
              <select
                value={selectedEquipment}
                onChange={e => setSelectedEquipment(e.target.value)}
                className="appearance-none bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-[var(--radius-md)] pl-3 pr-8 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-primary)] transition"
              >
                <option value="">All Equipment</option>
                {allEquipment.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] pointer-events-none" />
            </div>

            {hasFilters && (
              <button
                onClick={() => { setSearch(''); setSelectedMuscle(''); setSelectedEquipment(''); }}
                className="pp-btn-ghost text-sm whitespace-nowrap"
              >
                Clear filters
              </button>
            )}
          </div>

          {/* Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="pp-card p-4 animate-pulse">
                  <div className="h-4 bg-[var(--bg-tertiary)] rounded w-3/4 mb-3" />
                  <div className="h-3 bg-[var(--bg-tertiary)] rounded w-1/2 mb-2" />
                  <div className="h-3 bg-[var(--bg-tertiary)] rounded w-1/3" />
                </div>
              ))}
            </div>
          ) : exercises.length === 0 ? (
            <div className="text-center py-16">
              <Dumbbell className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-3" />
              <p className="text-[var(--text-muted)]">No exercises found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {exercises.map(ex => (
                <button
                  key={ex.id}
                  onClick={() => setSelectedExercise(ex)}
                  className="pp-card p-4 text-left hover:border-[var(--brand-primary)] transition-all group"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-sm font-bold text-[var(--text-primary)] group-hover:text-[var(--brand-primary)] transition">
                      {ex.name}
                    </h3>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize flex-shrink-0 ml-2 ${DIFFICULTY_COLORS[ex.difficulty] ?? 'bg-[var(--bg-tertiary)] text-[var(--text-muted)]'}`}>
                      {ex.difficulty}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1 mb-2">
                    {ex.muscle_groups.map(m => (
                      <span key={m} className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] capitalize">
                        {m}
                      </span>
                    ))}
                  </div>

                  <p className="text-xs text-[var(--text-muted)] capitalize">{ex.equipment}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Detail Modal */}
      {selectedExercise && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
          onClick={() => setSelectedExercise(null)}
        >
          <div className="pp-card p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold text-[var(--text-primary)] pr-4">{selectedExercise.name}</h2>
              <button onClick={() => setSelectedExercise(null)} className="p-1.5 hover:bg-[var(--bg-tertiary)] rounded-lg transition flex-shrink-0">
                <X className="w-5 h-5 text-[var(--text-muted)]" />
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5 mb-4">
              {selectedExercise.muscle_groups.map(m => (
                <span key={m} className="text-xs font-medium px-2.5 py-1 rounded-full bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] capitalize">
                  {m}
                </span>
              ))}
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${DIFFICULTY_COLORS[selectedExercise.difficulty] ?? 'bg-[var(--bg-tertiary)] text-[var(--text-muted)]'}`}>
                {selectedExercise.difficulty}
              </span>
              <span className="text-xs px-2.5 py-1 rounded-full bg-[var(--bg-tertiary)] text-[var(--text-muted)] capitalize">
                {selectedExercise.equipment}
              </span>
            </div>

            <div className="mb-4">
              <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">How to perform</h3>
              <ol className="space-y-1.5">
                {selectedExercise.instructions.map((step, i) => (
                  <li key={i} className="flex gap-2 text-sm text-[var(--text-secondary)]">
                    <span className="text-[var(--brand-primary)] font-bold flex-shrink-0">{i + 1}.</span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>

            {selectedExercise.form_tips.length > 0 && (
              <div className="mb-4">
                <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Form tips</h3>
                <ul className="space-y-1">
                  {selectedExercise.form_tips.map((tip, i) => (
                    <li key={i} className="text-sm text-[var(--text-secondary)] flex gap-2">
                      <span className="text-[var(--brand-primary)] flex-shrink-0">•</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {selectedExercise.common_mistakes.length > 0 && (
              <div>
                <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Common mistakes</h3>
                <ul className="space-y-1">
                  {selectedExercise.common_mistakes.map((m, i) => (
                    <li key={i} className="text-sm text-[var(--text-secondary)] flex gap-2">
                      <span className="text-red-400 flex-shrink-0">•</span>
                      {m}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
