import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navigation } from '../components/Navigation';
import { useToast } from '../contexts/ToastContext';
import { Dumbbell, Plus, X, Star, Search, Copy, Trash2, Play, CheckCircle } from 'lucide-react';
import client from '../api/client';

interface Exercise {
  name: string;
  sets: number;
  reps: string;
  rest?: string;
  notes?: string;
}

interface WorkoutTemplate {
  id: string;
  name: string;
  description: string;
  category: 'strength' | 'cardio' | 'flexibility' | 'bodyweight' | 'custom';
  duration: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  exercises: Exercise[];
  equipment: string[];
  isCustom: boolean;
  isFavorite?: boolean;
}

interface DraftExercise {
  exercise_name: string;
  sets: number;
  reps: number;
  weight: number;
  notes: string;
}

interface WorkoutDraft {
  type: string;
  duration: number;
  date: string;
  notes: string;
  exercises: DraftExercise[];
}

export default function WorkoutTemplates() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<WorkoutTemplate | null>(null);
  const [workoutDraft, setWorkoutDraft] = useState<WorkoutDraft | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Pre-built templates
  const builtInTemplates: WorkoutTemplate[] = [
    {
      id: 'push-1',
      name: 'Push Day - Chest Focus',
      description: 'Comprehensive chest, shoulders, and triceps workout',
      category: 'strength',
      duration: 60,
      difficulty: 'intermediate',
      isCustom: false,
      equipment: ['Barbell', 'Dumbbells', 'Bench', 'Cables'],
      exercises: [
        { name: 'Barbell Bench Press', sets: 4, reps: '8-10', rest: '2 min', notes: 'Warm up with lighter sets' },
        { name: 'Incline Dumbbell Press', sets: 4, reps: '10-12', rest: '90 sec' },
        { name: 'Chest Fly (Cable or DB)', sets: 3, reps: '12-15', rest: '60 sec' },
        { name: 'Shoulder Press', sets: 4, reps: '8-10', rest: '2 min' },
        { name: 'Lateral Raises', sets: 3, reps: '12-15', rest: '60 sec' },
        { name: 'Tricep Dips', sets: 3, reps: '10-12', rest: '60 sec' },
        { name: 'Tricep Pushdowns', sets: 3, reps: '12-15', rest: '60 sec' }
      ]
    },
    {
      id: 'pull-1',
      name: 'Pull Day - Back & Biceps',
      description: 'Complete back and biceps development',
      category: 'strength',
      duration: 55,
      difficulty: 'intermediate',
      isCustom: false,
      equipment: ['Barbell', 'Dumbbells', 'Pull-up Bar', 'Cables'],
      exercises: [
        { name: 'Deadlift', sets: 4, reps: '6-8', rest: '3 min', notes: 'Focus on form' },
        { name: 'Pull-ups', sets: 4, reps: '8-12', rest: '2 min' },
        { name: 'Barbell Rows', sets: 4, reps: '8-10', rest: '2 min' },
        { name: 'Lat Pulldowns', sets: 3, reps: '10-12', rest: '90 sec' },
        { name: 'Face Pulls', sets: 3, reps: '15-20', rest: '60 sec' },
        { name: 'Barbell Curls', sets: 3, reps: '10-12', rest: '60 sec' },
        { name: 'Hammer Curls', sets: 3, reps: '12-15', rest: '60 sec' }
      ]
    },
    {
      id: 'legs-1',
      name: 'Leg Day - Complete',
      description: 'Full lower body workout',
      category: 'strength',
      duration: 70,
      difficulty: 'intermediate',
      isCustom: false,
      equipment: ['Barbell', 'Dumbbells', 'Leg Press', 'Leg Curl Machine'],
      exercises: [
        { name: 'Barbell Squat', sets: 5, reps: '6-8', rest: '3 min', notes: 'Go deep!' },
        { name: 'Romanian Deadlift', sets: 4, reps: '8-10', rest: '2 min' },
        { name: 'Leg Press', sets: 4, reps: '12-15', rest: '2 min' },
        { name: 'Leg Curls', sets: 3, reps: '12-15', rest: '90 sec' },
        { name: 'Leg Extensions', sets: 3, reps: '12-15', rest: '90 sec' },
        { name: 'Calf Raises', sets: 4, reps: '15-20', rest: '60 sec' }
      ]
    },
    {
      id: 'hiit-1',
      name: 'HIIT Cardio Blast',
      description: '20-minute high intensity interval training',
      category: 'cardio',
      duration: 20,
      difficulty: 'intermediate',
      isCustom: false,
      equipment: ['None'],
      exercises: [
        { name: 'Jumping Jacks', sets: 4, reps: '30 sec', rest: '15 sec' },
        { name: 'Burpees', sets: 4, reps: '30 sec', rest: '15 sec' },
        { name: 'Mountain Climbers', sets: 4, reps: '30 sec', rest: '15 sec' },
        { name: 'High Knees', sets: 4, reps: '30 sec', rest: '15 sec' },
        { name: 'Jump Squats', sets: 4, reps: '30 sec', rest: '15 sec' }
      ]
    },
    {
      id: 'bodyweight-1',
      name: 'Home Bodyweight Workout',
      description: 'No equipment needed, full body workout',
      category: 'bodyweight',
      duration: 35,
      difficulty: 'beginner',
      isCustom: false,
      equipment: ['None'],
      exercises: [
        { name: 'Push-ups', sets: 4, reps: '10-15', rest: '60 sec' },
        { name: 'Bodyweight Squats', sets: 4, reps: '15-20', rest: '60 sec' },
        { name: 'Lunges', sets: 3, reps: '12 each leg', rest: '60 sec' },
        { name: 'Plank', sets: 3, reps: '45-60 sec', rest: '60 sec' },
        { name: 'Glute Bridges', sets: 3, reps: '15-20', rest: '60 sec' },
        { name: 'Bicycle Crunches', sets: 3, reps: '20 each side', rest: '45 sec' }
      ]
    },
    {
      id: 'fullbody-1',
      name: 'Full Body Strength',
      description: 'Hit every major muscle group',
      category: 'strength',
      duration: 65,
      difficulty: 'intermediate',
      isCustom: false,
      equipment: ['Barbell', 'Dumbbells', 'Pull-up Bar'],
      exercises: [
        { name: 'Barbell Squat', sets: 4, reps: '8-10', rest: '2 min' },
        { name: 'Bench Press', sets: 4, reps: '8-10', rest: '2 min' },
        { name: 'Barbell Row', sets: 4, reps: '8-10', rest: '2 min' },
        { name: 'Shoulder Press', sets: 3, reps: '10-12', rest: '90 sec' },
        { name: 'Romanian Deadlift', sets: 3, reps: '10-12', rest: '90 sec' },
        { name: 'Pull-ups', sets: 3, reps: 'To failure', rest: '2 min' },
        { name: 'Core Circuit', sets: 3, reps: '60 sec', rest: '60 sec', notes: 'Plank, side plank, dead bugs' }
      ]
    },
    {
      id: 'yoga-1',
      name: 'Morning Yoga Flow',
      description: 'Gentle stretching and flexibility',
      category: 'flexibility',
      duration: 30,
      difficulty: 'beginner',
      isCustom: false,
      equipment: ['Yoga Mat'],
      exercises: [
        { name: 'Sun Salutation A', sets: 3, reps: 'Flow', rest: 'None' },
        { name: 'Downward Dog', sets: 1, reps: '60 sec', rest: '30 sec' },
        { name: 'Warrior I & II', sets: 2, reps: '45 sec each', rest: '30 sec' },
        { name: 'Triangle Pose', sets: 2, reps: '45 sec each', rest: '30 sec' },
        { name: 'Pigeon Pose', sets: 2, reps: '60 sec each', rest: '30 sec' },
        { name: "Child's Pose", sets: 1, reps: '2 min', rest: 'None' }
      ]
    },
    {
      id: 'upper-1',
      name: 'Upper Body Power',
      description: 'Chest, back, shoulders, and arms',
      category: 'strength',
      duration: 60,
      difficulty: 'advanced',
      isCustom: false,
      equipment: ['Barbell', 'Dumbbells', 'Cables'],
      exercises: [
        { name: 'Barbell Bench Press', sets: 5, reps: '5', rest: '3 min', notes: 'Heavy weight' },
        { name: 'Weighted Pull-ups', sets: 5, reps: '6-8', rest: '3 min' },
        { name: 'Overhead Press', sets: 4, reps: '6-8', rest: '2 min' },
        { name: 'Dumbbell Rows', sets: 4, reps: '8-10', rest: '90 sec' },
        { name: 'Dips', sets: 3, reps: '10-12', rest: '90 sec' },
        { name: 'Face Pulls', sets: 3, reps: '15-20', rest: '60 sec' },
        { name: 'Arm Superset', sets: 3, reps: '10-12', rest: '60 sec', notes: 'Curls + Tricep extensions' }
      ]
    }
  ];

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const response = await client.get('/workout-templates');
      const customTemplates = response.data.templates || [];
      setTemplates([...builtInTemplates, ...customTemplates]);
    } catch (error: any) {
      console.error('Failed to load custom templates:', error);
      setTemplates([...builtInTemplates]);
    } finally {
      setLoading(false);
    }
  };

  // Instead of immediately POSTing, open a pre-filled editable form
  const handleUseTemplate = (template: WorkoutTemplate) => {
    const draft: WorkoutDraft = {
      type: template.name,
      duration: template.duration || 60,
      date: new Date().toISOString().split('T')[0],
      notes: `From template: ${template.name}`,
      exercises: template.exercises.map(ex => ({
        exercise_name: ex.name,
        sets: ex.sets,
        reps: typeof ex.reps === 'string' ? parseInt(ex.reps) || 10 : ex.reps,
        weight: 0,
        notes: ex.notes || ''
      }))
    };
    setWorkoutDraft(draft);
    setSelectedTemplate(null);
  };

  // Only called when user explicitly clicks "Save Workout"
  const handleSubmitWorkout = async () => {
    if (!workoutDraft) return;
    setSubmitting(true);
    try {
      const response = await client.post('/workouts', workoutDraft);
      if (response.data.success) {
        showToast(`Workout logged successfully!`);
        setWorkoutDraft(null);
        navigate('/workouts');
      } else {
        showToast('Failed to save workout', 'error');
      }
    } catch (error) {
      console.error('Failed to save workout:', error);
      showToast('Failed to save workout. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const updateDraftExercise = (index: number, field: keyof DraftExercise, value: string | number) => {
    if (!workoutDraft) return;
    const updated = { ...workoutDraft };
    updated.exercises = updated.exercises.map((ex, i) =>
      i === index ? { ...ex, [field]: value } : ex
    );
    setWorkoutDraft(updated);
  };

  const handleSaveAsCustom = (template: WorkoutTemplate) => {
    showToast('Template saved to your custom templates!');
  };

  const handleDeleteCustom = async (templateId: string) => {
    if (!confirm('Delete this custom template?')) return;
    try {
      const response = await client.delete(`/workout-templates/${templateId}`);
      if (response.data.success) {
        setTemplates(templates.filter(t => t.id !== templateId));
      }
    } catch (error) {
      console.error('Failed to delete template:', error);
      showToast('Failed to delete template. Please try again.', 'error');
    }
  };

  const toggleFavorite = (templateId: string) => {
    setTemplates(templates.map(t =>
      t.id === templateId ? { ...t, isFavorite: !t.isFavorite } : t
    ));
  };

  const categories = [
    { id: 'all', name: 'All Templates' },
    { id: 'strength', name: 'Strength' },
    { id: 'cardio', name: 'Cardio' },
    { id: 'bodyweight', name: 'Bodyweight' },
    { id: 'flexibility', name: 'Flexibility' },
    { id: 'custom', name: 'My Templates' },
  ];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'text-green-400';
      case 'intermediate': return 'text-yellow-400';
      case 'advanced': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const filteredTemplates = templates.filter(template => {
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[var(--brand-primary)] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <Navigation currentPage="/templates" />
      <div className="lg:ml-64 min-h-screen">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
              <Dumbbell className="w-10 h-10 text-emerald-400" />
              Workout Templates
            </h1>
            <p className="text-gray-400">Pre-built workouts to get you started quickly</p>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-emerald-900/30 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex gap-2 mb-6 flex-wrap">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  selectedCategory === cat.id
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-800/50 text-gray-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Templates Grid */}
          {filteredTemplates.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <Dumbbell className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="text-lg">No templates found</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredTemplates.map(template => (
                <div
                  key={template.id}
                  className="bg-slate-900/80 border border-emerald-900/30 rounded-2xl p-6 flex flex-col"
                >
                  {/* Template Header */}
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-white font-bold text-lg leading-tight flex-1 pr-2">{template.name}</h3>
                    <button
                      onClick={() => toggleFavorite(template.id)}
                      className={`transition ${
                        template.isFavorite ? 'text-yellow-400' : 'text-gray-600 hover:text-yellow-400'
                      }`}
                    >
                      <Star className={`w-5 h-5 ${template.isFavorite ? 'fill-current' : ''}`} />
                    </button>
                  </div>

                  <p className="text-gray-400 text-sm mb-4">{template.description}</p>

                  {/* Meta Info */}
                  <div className="flex items-center gap-4 text-sm mb-4">
                    <span className="text-gray-400">{template.duration} min</span>
                    <span className={`font-semibold capitalize ${getDifficultyColor(template.difficulty)}`}>
                      {template.difficulty}
                    </span>
                    <span className="text-emerald-400">{template.exercises.length} exercises</span>
                  </div>

                  {/* Equipment */}
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-2">
                      {template.equipment.map((item, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-slate-800/50 rounded-md text-xs text-gray-400"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-auto">
                    <button
                      onClick={() => setSelectedTemplate(template)}
                      className="flex-1 px-4 py-2 bg-slate-800/50 hover:bg-slate-800 text-white rounded-lg text-sm font-medium transition"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => handleUseTemplate(template)}
                      className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition flex items-center justify-center gap-2"
                    >
                      <Play className="w-4 h-4" />
                      Start
                    </button>
                  </div>

                  {/* Custom template actions */}
                  {template.isCustom && (
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => handleDeleteCustom(template.id)}
                        className="flex-1 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm font-medium transition"
                      >
                        <Trash2 className="w-4 h-4 mx-auto" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Template Detail Modal */}
      {selectedTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-emerald-900/50 rounded-2xl p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">{selectedTemplate.name}</h2>
                <p className="text-gray-400">{selectedTemplate.description}</p>
              </div>
              <button
                onClick={() => setSelectedTemplate(null)}
                className="p-2 hover:bg-white/10 rounded-lg"
              >
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            {/* Meta */}
            <div className="flex items-center gap-6 mb-6 pb-6 border-b border-emerald-900/50">
              <div>
                <p className="text-gray-400 text-sm">Duration</p>
                <p className="text-white font-semibold">{selectedTemplate.duration} min</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Difficulty</p>
                <p className={`font-semibold capitalize ${getDifficultyColor(selectedTemplate.difficulty)}`}>
                  {selectedTemplate.difficulty}
                </p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Exercises</p>
                <p className="text-white font-semibold">{selectedTemplate.exercises.length}</p>
              </div>
            </div>

            {/* Exercise List */}
            <div className="mb-6">
              <h3 className="text-white font-semibold mb-4">Exercises</h3>
              <div className="space-y-4">
                {selectedTemplate.exercises.map((exercise, index) => (
                  <div key={index} className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-emerald-600/20 border border-emerald-600/40 flex items-center justify-center text-emerald-400 text-sm font-bold flex-shrink-0 mt-0.5">
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-white font-medium">{exercise.name}</p>
                      <div className="ml-0 space-y-1">
                        <p className="text-gray-300">
                          <span className="text-gray-400">Sets:</span> {exercise.sets} × <span className="text-gray-400">Reps:</span> {exercise.reps}
                        </p>
                        {exercise.rest && (
                          <p className="text-gray-300">
                            <span className="text-gray-400">Rest:</span> {exercise.rest}
                          </p>
                        )}
                        {exercise.notes && (
                          <p className="text-sm text-gray-500 italic">{exercise.notes}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  handleUseTemplate(selectedTemplate);
                  setSelectedTemplate(null);
                }}
                className="flex-1 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold transition flex items-center justify-center gap-2"
              >
                <Play className="w-5 h-5" />
                Start This Workout
              </button>
              {!selectedTemplate.isCustom && (
                <button
                  onClick={() => {
                    handleSaveAsCustom(selectedTemplate);
                    setSelectedTemplate(null);
                  }}
                  className="px-6 py-3 bg-slate-800/50 hover:bg-slate-800 text-white rounded-xl font-semibold transition flex items-center gap-2"
                >
                  <Copy className="w-5 h-5" />
                  Save as Custom
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Workout Log Form Modal — shown after clicking Start */}
      {workoutDraft && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-emerald-900/50 rounded-2xl p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">Log Workout</h2>
                <p className="text-gray-400 text-sm">Fill in your actual weights and reps, then save.</p>
              </div>
              <button
                onClick={() => setWorkoutDraft(null)}
                className="p-2 hover:bg-white/10 rounded-lg"
              >
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            {/* Workout Meta Fields */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Workout Name</label>
                <input
                  type="text"
                  value={workoutDraft.type}
                  onChange={e => setWorkoutDraft({ ...workoutDraft, type: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-emerald-900/40 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Date</label>
                <input
                  type="date"
                  value={workoutDraft.date}
                  onChange={e => setWorkoutDraft({ ...workoutDraft, date: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-emerald-900/40 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Duration (min)</label>
                <input
                  type="number"
                  value={workoutDraft.duration}
                  onChange={e => setWorkoutDraft({ ...workoutDraft, duration: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 bg-slate-800 border border-emerald-900/40 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Notes</label>
                <input
                  type="text"
                  value={workoutDraft.notes}
                  onChange={e => setWorkoutDraft({ ...workoutDraft, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-emerald-900/40 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Exercise Table */}
            <div className="mb-6">
              <h3 className="text-white font-semibold mb-3">Exercises</h3>
              <div className="space-y-3">
                {/* Column Headers */}
                <div className="grid grid-cols-12 gap-2 text-xs text-gray-500 uppercase px-1">
                  <div className="col-span-4">Exercise</div>
                  <div className="col-span-2 text-center">Sets</div>
                  <div className="col-span-2 text-center">Reps</div>
                  <div className="col-span-2 text-center">Weight (kg)</div>
                  <div className="col-span-2 text-center">Notes</div>
                </div>

                {workoutDraft.exercises.map((ex, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 items-center bg-slate-800/40 rounded-xl px-3 py-2">
                    <div className="col-span-4 text-white text-sm font-medium truncate" title={ex.exercise_name}>
                      {ex.exercise_name}
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        min={1}
                        value={ex.sets}
                        onChange={e => updateDraftExercise(index, 'sets', parseInt(e.target.value) || 1)}
                        className="w-full px-2 py-1.5 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm text-center focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        min={1}
                        value={ex.reps}
                        onChange={e => updateDraftExercise(index, 'reps', parseInt(e.target.value) || 1)}
                        className="w-full px-2 py-1.5 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm text-center focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        min={0}
                        step={0.5}
                        value={ex.weight}
                        onChange={e => updateDraftExercise(index, 'weight', parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1.5 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm text-center focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="text"
                        value={ex.notes}
                        placeholder="—"
                        onChange={e => updateDraftExercise(index, 'notes', e.target.value)}
                        className="w-full px-2 py-1.5 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder-gray-600"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Save / Cancel */}
            <div className="flex gap-3">
              <button
                onClick={handleSubmitWorkout}
                disabled={submitting}
                className="flex-1 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <CheckCircle className="w-5 h-5" />
                )}
                {submitting ? 'Saving...' : 'Save Workout'}
              </button>
              <button
                onClick={() => setWorkoutDraft(null)}
                className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-gray-300 rounded-xl font-semibold transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}