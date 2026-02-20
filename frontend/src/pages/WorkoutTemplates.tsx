import { useState, useEffect } from 'react';
import { Navigation } from '../components/Navigation';
import { Dumbbell, Plus, X, Star, Search, Filter, Copy, Trash2, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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

export default function WorkoutTemplates() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<WorkoutTemplate | null>(null);

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
        { name: 'Child\'s Pose', sets: 1, reps: '2 min', rest: 'None' }
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
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    loadTemplates();
  }, [navigate]);

  const loadTemplates = async () => {
    try {
      // TODO: Load custom templates from API
      // const response = await fetchWorkoutTemplates();
      // const customTemplates = response.data;
      
      // For now, combine built-in templates with mock custom ones
      setTemplates([...builtInTemplates]);
    } catch (error: any) {
      if (error?.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUseTemplate = (template: WorkoutTemplate) => {
    // TODO: Navigate to workout creation with template pre-filled
    // For now, just show a message
    alert(`Using template: ${template.name}. This would create a new workout with these exercises.`);
    navigate('/workouts');
  };

  const handleSaveAsCustom = (template: WorkoutTemplate) => {
    // TODO: Save as custom template
    alert('Template saved to your custom templates!');
  };

  const handleDeleteCustom = (templateId: string) => {
    if (!confirm('Delete this custom template?')) return;
    setTemplates(templates.filter(t => t.id !== templateId));
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
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search templates..."
                className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-emerald-900/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Category Filter */}
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-4 py-2 rounded-lg font-medium transition whitespace-nowrap ${
                    selectedCategory === category.id
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-800/50 text-gray-400 hover:bg-slate-800'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          {/* Templates Grid */}
          {filteredTemplates.length === 0 ? (
            <div className="text-center py-12">
              <Dumbbell className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No templates found</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTemplates.map((template) => (
                <div
                  key={template.id}
                  className="bg-slate-900/50 backdrop-blur-sm border border-emerald-900/50 rounded-xl p-6 hover:border-emerald-700/50 transition"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white mb-2">{template.name}</h3>
                      <p className="text-sm text-gray-400 mb-3">{template.description}</p>
                    </div>
                    <button
                      onClick={() => toggleFavorite(template.id)}
                      className={`p-2 rounded-lg transition ${
                        template.isFavorite ? 'text-yellow-400' : 'text-gray-600 hover:text-yellow-400'
                      }`}
                    >
                      <Star className={`w-5 h-5 ${template.isFavorite ? 'fill-current' : ''}`} />
                    </button>
                  </div>

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
                  <div className="flex gap-2">
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

            {/* Equipment Needed */}
            <div className="mb-6">
              <h3 className="text-lg font-bold text-white mb-3">Equipment Needed</h3>
              <div className="flex flex-wrap gap-2">
                {selectedTemplate.equipment.map((item, index) => (
                  <span
                    key={index}
                    className="px-3 py-1.5 bg-slate-800/50 rounded-lg text-sm text-gray-300"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>

            {/* Exercises */}
            <div className="mb-6">
              <h3 className="text-lg font-bold text-white mb-3">Exercises</h3>
              <div className="space-y-3">
                {selectedTemplate.exercises.map((exercise, index) => (
                  <div
                    key={index}
                    className="bg-slate-800/50 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                          <span className="text-emerald-400 font-bold">{index + 1}</span>
                        </div>
                        <h4 className="font-semibold text-white">{exercise.name}</h4>
                      </div>
                    </div>
                    <div className="ml-11 space-y-1">
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
    </div>
  );
}