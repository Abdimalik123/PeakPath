import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navigation } from '../components/Navigation';
import { PageHeader } from '../components/PageHeader';
import { Card, CardContent } from '../components/Card';
import { useToast } from '../contexts/ToastContext';
import {
  Dumbbell, Play, Bookmark, BookmarkCheck, ChevronDown, ChevronUp,
  Zap, Heart, Mountain, Timer, Flame, Waves, Shield, Footprints, StretchHorizontal, Target
} from 'lucide-react';
import client from '../api/client';

interface TemplateExercise {
  exercise_id?: number;
  name: string;
  sets: number;
  reps: string;
  rest?: string;
}

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number;
  exercises: TemplateExercise[];
  icon: string;
  isSaved?: boolean;
}

const BUILT_IN_TEMPLATES: Template[] = [
  {
    id: 'builtin-push',
    name: 'Push Day',
    description: 'Chest, shoulders, and triceps focused session',
    category: 'Strength',
    difficulty: 'intermediate',
    duration: 55,
    icon: 'dumbbell',
    exercises: [
      { name: 'Bench Press', sets: 4, reps: '8-10' },
      { name: 'Overhead Press', sets: 3, reps: '8-10' },
      { name: 'Incline Dumbbell Press', sets: 3, reps: '10-12' },
      { name: 'Lateral Raises', sets: 3, reps: '12-15' },
      { name: 'Tricep Pushdowns', sets: 3, reps: '12-15' },
      { name: 'Overhead Tricep Extension', sets: 3, reps: '10-12' },
    ],
  },
  {
    id: 'builtin-pull',
    name: 'Pull Day',
    description: 'Back and biceps for a strong posterior chain',
    category: 'Strength',
    difficulty: 'intermediate',
    duration: 55,
    icon: 'mountain',
    exercises: [
      { name: 'Deadlift', sets: 4, reps: '5-6' },
      { name: 'Pull-Ups', sets: 3, reps: '8-12' },
      { name: 'Barbell Rows', sets: 4, reps: '8-10' },
      { name: 'Face Pulls', sets: 3, reps: '15-20' },
      { name: 'Barbell Curls', sets: 3, reps: '10-12' },
      { name: 'Hammer Curls', sets: 3, reps: '10-12' },
    ],
  },
  {
    id: 'builtin-legs',
    name: 'Leg Day',
    description: 'Quads, hamstrings, glutes, and calves',
    category: 'Strength',
    difficulty: 'intermediate',
    duration: 60,
    icon: 'footprints',
    exercises: [
      { name: 'Barbell Squat', sets: 4, reps: '6-8' },
      { name: 'Romanian Deadlift', sets: 3, reps: '8-10' },
      { name: 'Leg Press', sets: 3, reps: '10-12' },
      { name: 'Walking Lunges', sets: 3, reps: '12 each' },
      { name: 'Leg Curls', sets: 3, reps: '12-15' },
      { name: 'Calf Raises', sets: 4, reps: '15-20' },
    ],
  },
  {
    id: 'builtin-upper',
    name: 'Upper Body',
    description: 'Complete upper body in one session',
    category: 'Strength',
    difficulty: 'beginner',
    duration: 50,
    icon: 'shield',
    exercises: [
      { name: 'Bench Press', sets: 3, reps: '8-10' },
      { name: 'Barbell Rows', sets: 3, reps: '8-10' },
      { name: 'Overhead Press', sets: 3, reps: '10-12' },
      { name: 'Lat Pulldown', sets: 3, reps: '10-12' },
      { name: 'Dumbbell Curls', sets: 2, reps: '12-15' },
      { name: 'Tricep Dips', sets: 2, reps: '10-12' },
    ],
  },
  {
    id: 'builtin-fullbody',
    name: 'Full Body',
    description: 'Hit every muscle group — perfect for 3x/week training',
    category: 'Strength',
    difficulty: 'beginner',
    duration: 60,
    icon: 'zap',
    exercises: [
      { name: 'Barbell Squat', sets: 3, reps: '8-10' },
      { name: 'Bench Press', sets: 3, reps: '8-10' },
      { name: 'Barbell Rows', sets: 3, reps: '8-10' },
      { name: 'Overhead Press', sets: 3, reps: '8-10' },
      { name: 'Romanian Deadlift', sets: 3, reps: '10-12' },
      { name: 'Plank', sets: 3, reps: '45s hold' },
    ],
  },
  {
    id: 'builtin-hiit',
    name: 'HIIT Circuit',
    description: 'High intensity intervals — max burn in minimum time',
    category: 'Cardio',
    difficulty: 'advanced',
    duration: 30,
    icon: 'flame',
    exercises: [
      { name: 'Burpees', sets: 4, reps: '12' },
      { name: 'Jump Squats', sets: 4, reps: '15' },
      { name: 'Mountain Climbers', sets: 4, reps: '20 each' },
      { name: 'Box Jumps', sets: 4, reps: '10' },
      { name: 'Battle Ropes', sets: 4, reps: '30s' },
      { name: 'Kettlebell Swings', sets: 4, reps: '15' },
    ],
  },
  {
    id: 'builtin-core',
    name: 'Core Crusher',
    description: 'Abs and core stability for a bulletproof midsection',
    category: 'Core',
    difficulty: 'beginner',
    duration: 25,
    icon: 'target',
    exercises: [
      { name: 'Plank', sets: 3, reps: '60s hold' },
      { name: 'Russian Twists', sets: 3, reps: '20' },
      { name: 'Leg Raises', sets: 3, reps: '12-15' },
      { name: 'Dead Bug', sets: 3, reps: '10 each' },
      { name: 'Cable Woodchops', sets: 3, reps: '12 each' },
    ],
  },
  {
    id: 'builtin-mobility',
    name: 'Mobility & Recovery',
    description: 'Active recovery with stretching and foam rolling',
    category: 'Recovery',
    difficulty: 'beginner',
    duration: 30,
    icon: 'stretch',
    exercises: [
      { name: 'Foam Roll - Upper Back', sets: 1, reps: '2 min' },
      { name: 'Foam Roll - Quads', sets: 1, reps: '2 min' },
      { name: 'Hip 90/90 Stretch', sets: 2, reps: '60s each' },
      { name: 'Cat-Cow', sets: 2, reps: '10' },
      { name: 'World\'s Greatest Stretch', sets: 2, reps: '5 each' },
      { name: 'Pigeon Stretch', sets: 2, reps: '60s each' },
    ],
  },
  {
    id: 'builtin-cardio',
    name: 'Steady State Cardio',
    description: 'Low intensity endurance work for heart health',
    category: 'Cardio',
    difficulty: 'beginner',
    duration: 40,
    icon: 'heart',
    exercises: [
      { name: 'Light Jog / Walk', sets: 1, reps: '5 min warmup' },
      { name: 'Moderate Run', sets: 1, reps: '25 min' },
      { name: 'Cool Down Walk', sets: 1, reps: '5 min' },
      { name: 'Standing Quad Stretch', sets: 1, reps: '30s each' },
      { name: 'Hamstring Stretch', sets: 1, reps: '30s each' },
    ],
  },
  {
    id: 'builtin-strength5x5',
    name: 'Strength 5x5',
    description: 'Classic strength program — heavy compound lifts',
    category: 'Strength',
    difficulty: 'advanced',
    duration: 50,
    icon: 'timer',
    exercises: [
      { name: 'Barbell Squat', sets: 5, reps: '5' },
      { name: 'Bench Press', sets: 5, reps: '5' },
      { name: 'Barbell Rows', sets: 5, reps: '5' },
    ],
  },
];

const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  dumbbell: Dumbbell,
  zap: Zap,
  heart: Heart,
  mountain: Mountain,
  timer: Timer,
  flame: Flame,
  waves: Waves,
  shield: Shield,
  footprints: Footprints,
  stretch: StretchHorizontal,
  target: Target,
};

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: 'text-green-400 bg-green-500/15',
  intermediate: 'text-yellow-400 bg-yellow-500/15',
  advanced: 'text-red-400 bg-red-500/15',
};

export default function Templates() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('');

  // Load user's saved templates to mark which built-ins are already saved
  useEffect(() => {
    const checkSaved = async () => {
      try {
        const res = await client.get('/workout-templates');
        if (res.data.success) {
          const names = new Set((res.data.templates || []).map((t: any) => t.name));
          const matched = new Set<string>();
          BUILT_IN_TEMPLATES.forEach(t => {
            if (names.has(t.name)) matched.add(t.id);
          });
          setSavedIds(matched);
        }
      } catch {}
    };
    checkSaved();
  }, []);

  const categories = Array.from(new Set(BUILT_IN_TEMPLATES.map(t => t.category)));

  const filteredTemplates = BUILT_IN_TEMPLATES.filter(t => {
    if (filterCategory && t.category !== filterCategory) return false;
    if (filterDifficulty && t.difficulty !== filterDifficulty) return false;
    return true;
  });

  const saveTemplate = async (template: Template) => {
    setSavingId(template.id);
    try {
      // Step 1: Create the template header
      const res = await client.post('/workout-templates', {
        name: template.name,
        description: template.description,
      });
      if (!res.data.success) throw new Error('Failed to create template');

      const templateId = res.data.template_id;

      // Step 2: For each exercise, look up its DB ID by name, then link to template
      if (templateId && template.exercises.length > 0) {
        // Fetch all exercises to find IDs by name
        let exerciseList: { id: number; name: string }[] = [];
        try {
          const exRes = await client.get('/exercises');
          if (exRes.data.success) exerciseList = exRes.data.exercises || [];
        } catch {}

        for (let idx = 0; idx < template.exercises.length; idx++) {
          const ex = template.exercises[idx];
          let exerciseId: number | null = null;

          // Look up by name (case-insensitive)
          const found = exerciseList.find(
            e => e.name.toLowerCase() === ex.name.toLowerCase()
          );
          if (found) {
            exerciseId = found.id;
          } else {
            // Create the exercise if it doesn't exist
            try {
              const createRes = await client.post('/exercises/create', {
                name: ex.name,
                category: 'General',
                description: '',
              });
              if (createRes.data.success) {
                exerciseId = createRes.data.exercise_id;
              }
            } catch {}
          }

          if (exerciseId) {
            await client.post('/template-exercises', {
              template_id: templateId,
              exercise_id: exerciseId,
              sets: ex.sets,
              reps: String(ex.reps),
              order_index: idx + 1,
            }).catch(() => null); // non-fatal
          }
        }
      }

      setSavedIds(prev => new Set(prev).add(template.id));
      showToast(`"${template.name}" saved to your templates!`);
    } catch {
      showToast('Failed to save template', 'error');
    } finally {
      setSavingId(null);
    }
  };

  const startWorkout = (template: Template) => {
    const exercises = template.exercises.map(ex => ({
      // No exercise_id for built-in templates — backend will look up or create by name
      exercise_name: ex.name,
      sets: ex.sets,
      reps: parseInt(ex.reps) || 10,
      weight: 0,
    }));

    navigate('/active-workout', {
      state: {
        exercises,
        workoutType: template.name,
      },
    });
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <Navigation currentPage="/templates" />

      <div className="lg:ml-64 min-h-screen pt-14 lg:pt-16 pb-20 lg:pb-0">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <PageHeader
            title="Workout Templates"
            subtitle="Choose a program and start training"
          />

          {/* Filters */}
          <div className="flex flex-col gap-3 mb-6">
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setFilterCategory('')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  !filterCategory ? 'bg-[var(--brand-primary)] text-white' : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                All
              </button>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(filterCategory === cat ? '' : cat)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    filterCategory === cat ? 'bg-[var(--brand-primary)] text-white' : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <div>
              <select
                value={filterDifficulty}
                onChange={e => setFilterDifficulty(e.target.value)}
                className="px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none"
              >
                <option value="">All Levels</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>

          {/* Template Grid */}
          <div className="grid md:grid-cols-2 gap-4">
            {filteredTemplates.map(template => {
              const Icon = ICON_MAP[template.icon] || Dumbbell;
              const isExpanded = expandedId === template.id;
              const isSaved = savedIds.has(template.id);

              return (
                <Card key={template.id} className="overflow-hidden">
                  <CardContent className="pt-5 pb-4">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-11 h-11 rounded-xl bg-[var(--brand-primary)]/15 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5 text-[var(--brand-primary)]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-[var(--text-primary)] mb-0.5">{template.name}</h3>
                        <p className="text-xs text-[var(--text-muted)] line-clamp-1">{template.description}</p>
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="flex items-center gap-2 mb-4 flex-wrap">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${DIFFICULTY_COLORS[template.difficulty]}`}>
                        {template.difficulty}
                      </span>
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-[var(--bg-tertiary)] text-[var(--text-muted)]">
                        {template.category}
                      </span>
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-[var(--bg-tertiary)] text-[var(--text-muted)]">
                        ~{template.duration} min
                      </span>
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-[var(--bg-tertiary)] text-[var(--text-muted)]">
                        {template.exercises.length} exercises
                      </span>
                    </div>

                    {/* Expanded exercises */}
                    {isExpanded && (
                      <div className="mb-4 space-y-1.5 border-t border-[var(--border-default)] pt-3">
                        {template.exercises.map((ex, i) => (
                          <div key={i} className="flex items-center justify-between text-sm py-1.5 px-2.5 rounded bg-[var(--bg-tertiary)]">
                            <span className="text-[var(--text-primary)] font-medium">{ex.name}</span>
                            <span className="text-[var(--text-muted)] text-xs">{ex.sets} x {ex.reps}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => startWorkout(template)}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[var(--brand-primary)] text-white font-semibold text-sm rounded-lg hover:opacity-90 transition"
                      >
                        <Play className="w-4 h-4" /> Start
                      </button>
                      <button
                        onClick={() => isSaved ? null : saveTemplate(template)}
                        disabled={!!savingId || isSaved}
                        className={`flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                          isSaved
                            ? 'bg-[var(--brand-primary)]/15 text-[var(--brand-primary)]'
                            : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/10'
                        }`}
                        title={isSaved ? 'Saved to your templates' : 'Save to your templates'}
                      >
                        {savingId === template.id ? (
                          <div className="w-4 h-4 border-2 border-[var(--brand-primary)] border-t-transparent rounded-full animate-spin" />
                        ) : isSaved ? (
                          <BookmarkCheck className="w-4 h-4" />
                        ) : (
                          <Bookmark className="w-4 h-4" />
                        )}
                        <span>{isSaved ? 'Saved' : 'Save'}</span>
                      </button>
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : template.id)}
                        className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition text-sm font-medium"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        <span>{isExpanded ? 'Less' : 'More'}</span>
                      </button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </main>
      </div>
    </div>
  );
}
