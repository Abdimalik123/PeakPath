import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navigation } from '../components/Navigation';
import { PageHeader } from '../components/PageHeader';
import { Card, CardContent } from '../components/Card';
import { useToast } from '../contexts/ToastContext';
import {
  Dumbbell, Play, Bookmark, BookmarkCheck, ChevronDown, ChevronUp,
} from 'lucide-react';
import client from '../api/client';

interface TemplateExercise {
  exercise_id: number;
  name: string;
  sets: number;
  reps: string;
  order_index: number;
}

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration_minutes: number;
  exercises: TemplateExercise[];
  is_system: boolean;
}

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: 'text-green-400 bg-green-500/15',
  intermediate: 'text-yellow-400 bg-yellow-500/15',
  advanced: 'text-red-400 bg-red-500/15',
};

export default function Templates() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [systemTemplates, setSystemTemplates] = useState<Template[]>([]);
  const [userTemplates, setUserTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const res = await client.get('/workout-templates');
        if (res.data.success) {
          setSystemTemplates(res.data.system_templates || []);
          setUserTemplates(res.data.user_templates || []);
        }
      } catch {
        showToast('Failed to load templates', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchTemplates();
  }, []);

  const categories = Array.from(
    new Set(systemTemplates.map(t => t.category).filter(Boolean))
  ).sort();

  const filteredSystemTemplates = systemTemplates.filter(t => {
    if (filterCategory && t.category !== filterCategory) return false;
    if (filterDifficulty && t.difficulty !== filterDifficulty) return false;
    return true;
  });

  const startWorkout = (template: Template) => {
    const exercises = template.exercises.map(ex => ({
      exercise_id: ex.exercise_id,
      exercise_name: ex.name,
      sets: ex.sets,
      reps: parseInt(ex.reps) || 10,
      weight: 0,
    }));
    navigate('/active-workout', {
      state: { exercises, workoutType: template.name },
    });
  };

  const saveTemplate = async (template: Template) => {
    setSavingId(template.id);
    try {
      // Create the template header
      const res = await client.post('/workout-templates', {
        name: template.name,
        description: template.description,
      });
      if (!res.data.success) throw new Error('Failed to create template');

      const templateId = res.data.template_id;

      // Link exercises using exercise_id directly (no name lookup needed)
      if (templateId && template.exercises.length > 0) {
        for (let idx = 0; idx < template.exercises.length; idx++) {
          const ex = template.exercises[idx];
          if (!ex.exercise_id) continue;
          await client.post('/template-exercises', {
            template_id: templateId,
            exercise_id: ex.exercise_id,
            sets: ex.sets,
            reps: parseInt(String(ex.reps)) || 10,
            order_index: idx + 1,
          }).catch(() => null);
        }
      }

      // Refresh user templates
      const refreshed = await client.get('/workout-templates');
      if (refreshed.data.success) {
        setUserTemplates(refreshed.data.user_templates || []);
      }

      showToast(`"${template.name}" saved to your templates!`);
    } catch {
      showToast('Failed to save template', 'error');
    } finally {
      setSavingId(null);
    }
  };

  const isAlreadySaved = (template: Template) =>
    userTemplates.some(ut => ut.name === template.name);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="text-[var(--brand-primary)] text-lg font-medium">Loading templates...</div>
      </div>
    );
  }

  const renderTemplateCard = (template: Template, showSave: boolean) => {
    const isExpanded = expandedId === template.id;
    const isSaved = isAlreadySaved(template);

    return (
      <Card key={template.id} className="overflow-hidden">
        <CardContent className="pt-5 pb-4">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-11 h-11 rounded-xl bg-[var(--brand-primary)]/15 flex items-center justify-center flex-shrink-0">
              <Dumbbell className="w-5 h-5 text-[var(--brand-primary)]" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-[var(--text-primary)] mb-0.5">{template.name}</h3>
              <p className="text-xs text-[var(--text-muted)] line-clamp-1">{template.description}</p>
            </div>
          </div>

          {/* Tags */}
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <span className={`px-2 py-0.5 rounded text-xs font-bold ${DIFFICULTY_COLORS[template.difficulty] || 'text-[var(--text-muted)] bg-[var(--bg-tertiary)]'}`}>
              {template.difficulty}
            </span>
            {template.category && (
              <span className="px-2 py-0.5 rounded text-xs font-medium bg-[var(--bg-tertiary)] text-[var(--text-muted)]">
                {template.category}
              </span>
            )}
            {template.duration_minutes > 0 && (
              <span className="px-2 py-0.5 rounded text-xs font-medium bg-[var(--bg-tertiary)] text-[var(--text-muted)]">
                ~{template.duration_minutes} min
              </span>
            )}
            <span className="px-2 py-0.5 rounded text-xs font-medium bg-[var(--bg-tertiary)] text-[var(--text-muted)]">
              {template.exercises.length} exercise{template.exercises.length !== 1 ? 's' : ''}
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
            {showSave && (
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
            )}
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
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <Navigation currentPage="/templates" />

      <div className="lg:ml-64 min-h-screen pt-14 lg:pt-16 pb-6">
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
                  !filterCategory
                    ? 'bg-[var(--brand-primary)] text-white'
                    : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                All
              </button>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(filterCategory === cat ? '' : cat)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    filterCategory === cat
                      ? 'bg-[var(--brand-primary)] text-white'
                      : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
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

          {/* System Templates */}
          {filteredSystemTemplates.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-4 mb-10">
              {filteredSystemTemplates.map(template => renderTemplateCard(template, true))}
            </div>
          ) : (
            <div className="pp-card p-8 text-center mb-10">
              <Dumbbell className="w-10 h-10 text-[var(--text-muted)] mx-auto mb-3 opacity-40" />
              <p className="text-[var(--text-muted)] text-sm">No templates match your filters</p>
              <button
                onClick={() => { setFilterCategory(''); setFilterDifficulty(''); }}
                className="text-[var(--brand-primary)] text-sm mt-2 font-medium"
              >
                Clear filters
              </button>
            </div>
          )}

          {/* My Templates */}
          {userTemplates.length > 0 && (
            <div>
              <h2 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-4">
                My Templates <span className="ml-1">({userTemplates.length})</span>
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                {userTemplates.map(template => renderTemplateCard(template, false))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
