import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from './Card';
import { Button } from './Button';
import { useToast } from '../contexts/ToastContext';
import {
  BookOpen, Plus, Play, Trash2, ChevronDown, ChevronUp, Dumbbell, X
} from 'lucide-react';
import client from '../api/client';

interface TemplateExercise {
  exercise_id: number;
  name: string;
  sets: number | null;
  reps: number | string | null;
  weight: number | null;
  rest: number | null;
  notes: string | null;
}

interface WorkoutTemplate {
  id: string;
  name: string;
  description: string;
  exercises: TemplateExercise[];
  created_at: string | null;
}

interface AvailableExercise {
  id: number;
  name: string;
  category: string;
  muscle_group: string;
}

export function WorkoutTemplates() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddExerciseModal, setShowAddExerciseModal] = useState(false);
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);

  // Create form
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [creating, setCreating] = useState(false);

  // Add exercise form
  const [availableExercises, setAvailableExercises] = useState<AvailableExercise[]>([]);
  const [exerciseSearch, setExerciseSearch] = useState('');
  const [selectedExerciseId, setSelectedExerciseId] = useState('');
  const [exSets, setExSets] = useState('3');
  const [exReps, setExReps] = useState('10');
  const [exWeight, setExWeight] = useState('');

  useEffect(() => { loadTemplates(); }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const res = await client.get('/workout-templates');
      if (res.data.success) {
        setTemplates(res.data.templates || []);
      }
    } catch {
      // Silent fail — templates are supplementary
    } finally {
      setLoading(false);
    }
  };

  const loadExercises = async () => {
    try {
      const res = await client.get('/exercises');
      if (res.data.success) {
        setAvailableExercises(res.data.exercises || []);
      }
    } catch {}
  };

  const handleCreate = async () => {
    if (!newName.trim()) {
      showToast('Template name is required', 'warning');
      return;
    }
    setCreating(true);
    try {
      const res = await client.post('/workout-templates', {
        name: newName.trim(),
        description: newDescription.trim(),
      });
      if (res.data.success) {
        showToast('Template created!');
        setShowCreateModal(false);
        setNewName('');
        setNewDescription('');
        loadTemplates();
      }
    } catch {
      showToast('Failed to create template', 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (templateId: string) => {
    try {
      await client.delete(`/workout-templates/${templateId}`);
      setTemplates(prev => prev.filter(t => t.id !== templateId));
      showToast('Template deleted');
    } catch {
      showToast('Failed to delete template', 'error');
    }
  };

  const handleAddExercise = async () => {
    if (!selectedExerciseId || !activeTemplateId) return;
    try {
      const res = await client.post('/template-exercises', {
        template_id: parseInt(activeTemplateId),
        exercise_id: parseInt(selectedExerciseId),
        sets: parseInt(exSets) || 3,
        reps: parseInt(exReps) || 10,
        weight: parseFloat(exWeight) || null,
        order_index: (templates.find(t => t.id === activeTemplateId)?.exercises.length || 0) + 1,
      });
      if (res.data.success) {
        showToast('Exercise added to template');
        setShowAddExerciseModal(false);
        resetExerciseForm();
        loadTemplates();
      }
    } catch {
      showToast('Failed to add exercise', 'error');
    }
  };

  const resetExerciseForm = () => {
    setSelectedExerciseId('');
    setExSets('3');
    setExReps('10');
    setExWeight('');
    setExerciseSearch('');
  };

  const startFromTemplate = (template: WorkoutTemplate) => {
    const exercises = template.exercises
      .filter(ex => ex.exercise_id)
      .map(ex => ({
        exercise_id: ex.exercise_id,
        exercise_name: ex.name,
        sets: typeof ex.sets === 'number' ? ex.sets : 3,
        reps: typeof ex.reps === 'number' ? ex.reps : 10,
        weight: ex.weight || 0,
      }));

    navigate('/active-workout', {
      state: {
        exercises,
        workoutType: template.name,
      },
    });
  };

  const filteredExercises = availableExercises.filter(ex =>
    ex.name.toLowerCase().includes(exerciseSearch.toLowerCase())
  );

  if (loading) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-[var(--brand-primary)]" />
          Templates
        </h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1.5 text-sm font-medium text-[var(--brand-primary)] hover:opacity-80 transition"
        >
          <Plus className="w-4 h-4" /> New
        </button>
      </div>

      {templates.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <BookOpen className="w-10 h-10 text-[var(--text-muted)] mx-auto mb-3 opacity-40" />
            <p className="text-sm text-[var(--text-muted)] mb-3">
              Save your favorite workout routines as templates for quick access
            </p>
            <Button onClick={() => setShowCreateModal(true)} className="pp-btn-primary">
              Create First Template
            </Button>
          </CardContent>
        </Card>
      ) : (
        templates.map((template) => {
          const isExpanded = expandedId === template.id;
          return (
            <Card key={template.id}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[var(--brand-primary)]/15 flex items-center justify-center flex-shrink-0">
                    <Dumbbell className="w-5 h-5 text-[var(--brand-primary)]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-[var(--text-primary)] truncate">{template.name}</h3>
                    <p className="text-xs text-[var(--text-muted)]">
                      {template.exercises.length} exercise{template.exercises.length !== 1 ? 's' : ''}
                      {template.description && ` — ${template.description}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => startFromTemplate(template)}
                      className="p-2 rounded-lg bg-[var(--brand-primary)] text-white hover:opacity-90 transition"
                      title="Start workout from template"
                    >
                      <Play className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : template.id)}
                      className="p-2 rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-4 pt-3 border-t border-[var(--border-default)]">
                    {template.exercises.length === 0 ? (
                      <p className="text-sm text-[var(--text-muted)] text-center py-3">
                        No exercises yet. Add some to build your routine.
                      </p>
                    ) : (
                      <div className="space-y-2 mb-3">
                        {template.exercises.map((ex, i) => (
                          <div key={i} className="flex items-center justify-between text-sm py-1.5 px-2 rounded bg-[var(--bg-tertiary)]">
                            <span className="text-[var(--text-primary)] font-medium">{ex.name}</span>
                            <span className="text-[var(--text-muted)]">
                              {ex.sets && `${ex.sets} sets`}
                              {ex.reps && ` x ${ex.reps}`}
                              {ex.weight && ` @ ${ex.weight}kg`}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setActiveTemplateId(template.id);
                          setShowAddExerciseModal(true);
                          loadExercises();
                        }}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium text-[var(--brand-primary)] bg-[var(--brand-primary)]/10 rounded-lg hover:bg-[var(--brand-primary)]/20 transition"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Exercise
                      </button>
                      <button
                        onClick={() => handleDelete(template.id)}
                        className="px-3 py-2 text-sm text-[var(--error)] bg-[var(--error)]/10 rounded-lg hover:bg-[var(--error)]/20 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })
      )}

      {/* Create Template Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="pp-card p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-xl font-bold text-[var(--text-primary)]">New Template</h3>
              <button onClick={() => setShowCreateModal(false)} className="p-1 hover:bg-[var(--bg-tertiary)] rounded-lg">
                <X className="w-5 h-5 text-[var(--text-muted)]" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g., Push Day, Full Body A"
                  className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-xl px-4 py-3 text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--brand-primary)]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Description (optional)</label>
                <input
                  type="text"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Brief description"
                  className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-xl px-4 py-3 text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--brand-primary)]"
                />
              </div>
              <button
                onClick={handleCreate}
                disabled={creating || !newName.trim()}
                className="w-full pp-btn-primary disabled:opacity-40"
              >
                {creating ? 'Creating...' : 'Create Template'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Exercise to Template Modal */}
      {showAddExerciseModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="pp-card p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-xl font-bold text-[var(--text-primary)]">Add Exercise</h3>
              <button onClick={() => { setShowAddExerciseModal(false); resetExerciseForm(); }} className="p-1 hover:bg-[var(--bg-tertiary)] rounded-lg">
                <X className="w-5 h-5 text-[var(--text-muted)]" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Search Exercise</label>
                <input
                  type="text"
                  value={exerciseSearch}
                  onChange={(e) => setExerciseSearch(e.target.value)}
                  placeholder="Search..."
                  className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-xl px-4 py-3 text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--brand-primary)]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Exercise</label>
                <select
                  value={selectedExerciseId}
                  onChange={(e) => setSelectedExerciseId(e.target.value)}
                  className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-xl px-4 py-3 text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-primary)]"
                >
                  <option value="">Choose...</option>
                  {filteredExercises.map(ex => (
                    <option key={ex.id} value={ex.id}>{ex.name}{ex.muscle_group ? ` (${ex.muscle_group})` : ''}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Sets</label>
                  <input type="number" value={exSets} onChange={(e) => setExSets(e.target.value)} min="1"
                    className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-xl px-3 py-3 text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-primary)]" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Reps</label>
                  <input type="number" value={exReps} onChange={(e) => setExReps(e.target.value)} min="1"
                    className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-xl px-3 py-3 text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-primary)]" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Weight</label>
                  <input type="number" value={exWeight} onChange={(e) => setExWeight(e.target.value)} step="0.5" placeholder="kg"
                    className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-xl px-3 py-3 text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--brand-primary)]" />
                </div>
              </div>
              <button
                onClick={handleAddExercise}
                disabled={!selectedExerciseId}
                className="w-full pp-btn-primary disabled:opacity-40"
              >
                Add to Template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
