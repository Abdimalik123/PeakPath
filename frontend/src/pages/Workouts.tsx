import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

interface Workout {
  id: number;
  date: string;
  type: string;
  duration: number;
  notes: string;
}

interface Exercise {
  exercise_id: number;
  name: string;
  category: string;
  muscle_group: string;
  sets: number;
  reps: number;
  weight: number;
  notes: string;
}

interface WorkoutDetail extends Workout {
  exercises: Exercise[];
}

const Workouts: React.FC = () => {
  const navigate = useNavigate();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [selectedWorkout, setSelectedWorkout] = useState<WorkoutDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    type: '',
    duration: '',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  useEffect(() => {
    fetchWorkouts();
  }, []);

  const fetchWorkouts = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch('http://localhost:5000/workouts', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        setWorkouts(data.workouts);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to load workouts');
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkoutDetails = async (workoutId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/workouts/${workoutId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        setSelectedWorkout(data.workout);
      }
    } catch (err) {
      console.error('Failed to load workout details', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/workouts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          type: formData.type,
          duration: parseInt(formData.duration),
          date: formData.date,
          notes: formData.notes
        })
      });

      const data = await response.json();
      if (data.success) {
        setShowAddModal(false);
        setFormData({ type: '', duration: '', date: new Date().toISOString().split('T')[0], notes: '' });
        fetchWorkouts();
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to create workout');
    }
  };

  const handleDelete = async (workoutId: number) => {
    if (!confirm('Delete this workout?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/workouts/${workoutId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        fetchWorkouts();
        setSelectedWorkout(null);
      }
    } catch (err) {
      setError('Failed to delete workout');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#121420] flex items-center justify-center">
        <div className="text-cyan-400 text-xl">Loading workouts...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121420] text-gray-300">
      {/* Navigation */}
      <nav className="border-b border-white/5 bg-[#121420]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-8">
              <Link to="/" className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.5)]"></div>
                <h1 className="text-xl font-bold tracking-tight text-white">LIFE<span className="text-cyan-400">TRACKER</span></h1>
              </Link>
              
              <div className="hidden md:flex items-center gap-6">
                <Link to="/dashboard" className="text-gray-400 hover:text-white font-medium text-sm transition">DASHBOARD</Link>
                <Link to="/workouts" className="text-cyan-400 font-medium text-sm border-b-2 border-cyan-400 pb-1">WORKOUTS</Link>
                <Link to="/habits" className="text-gray-400 hover:text-white font-medium text-sm transition">HABITS</Link>
                <Link to="/goals" className="text-gray-400 hover:text-white font-medium text-sm transition">GOALS</Link>
              </div>
            </div>
            
            <Link to="/profile" className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center text-[#121420] font-bold shadow-[0_0_20px_rgba(34,211,238,0.3)]">
              U
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">Workout Log</h2>
            <p className="text-gray-400 text-sm uppercase tracking-wider">TRAINING SESSIONS // PERFORMANCE DATA</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-cyan-500 hover:bg-cyan-400 text-[#121420] px-6 py-3 rounded-xl font-bold text-sm uppercase tracking-wider transition shadow-[0_0_20px_rgba(34,211,238,0.3)] flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Log Workout
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-xl">
            <p className="text-red-400 text-sm text-center font-medium">{error}</p>
          </div>
        )}

        {/* Workouts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Workouts List */}
          <div className="lg:col-span-2 space-y-4">
            {workouts.length === 0 ? (
              <div className="bg-[#1c1f2e] border border-white/5 p-12 rounded-[2rem] text-center">
                <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <h3 className="text-xl font-bold text-white mb-2">No Workouts Yet</h3>
                <p className="text-gray-500 mb-6">Start tracking your training sessions</p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="bg-cyan-500 hover:bg-cyan-400 text-[#121420] px-6 py-2 rounded-xl font-bold text-sm uppercase tracking-wider transition"
                >
                  Log First Workout
                </button>
              </div>
            ) : (
              workouts.map((workout) => (
                <div
                  key={workout.id}
                  onClick={() => fetchWorkoutDetails(workout.id)}
                  className="bg-[#1c1f2e] border border-white/5 p-6 rounded-[2rem] hover:border-cyan-500/50 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-cyan-500/10 rounded-2xl text-cyan-400 group-hover:bg-cyan-500 group-hover:text-[#121420] transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-white mb-1">{workout.type}</h4>
                        <p className="text-xs text-gray-500 font-mono uppercase tracking-wider">{formatDate(workout.date)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-white">{workout.duration}<span className="text-gray-500 text-sm ml-1">min</span></p>
                      <p className="text-xs text-gray-500 uppercase tracking-wider">Duration</p>
                    </div>
                  </div>
                  {workout.notes && (
                    <p className="mt-4 text-sm text-gray-400 border-t border-white/5 pt-4">{workout.notes}</p>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Workout Details Sidebar */}
          <div className="space-y-6">
            {selectedWorkout ? (
              <div className="bg-[#1c1f2e] border border-white/5 p-6 rounded-[2rem] sticky top-24">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">Workout Details</h3>
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Session Info</p>
                  </div>
                  <button
                    onClick={() => handleDelete(selectedWorkout.id)}
                    className="p-2 hover:bg-red-500/10 rounded-lg transition text-red-400"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="flex justify-between items-center p-3 bg-[#0f111a] rounded-xl">
                    <span className="text-sm text-gray-500 uppercase tracking-wider">Type</span>
                    <span className="text-sm font-bold text-white">{selectedWorkout.type}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-[#0f111a] rounded-xl">
                    <span className="text-sm text-gray-500 uppercase tracking-wider">Duration</span>
                    <span className="text-sm font-bold text-white">{selectedWorkout.duration} min</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-[#0f111a] rounded-xl">
                    <span className="text-sm text-gray-500 uppercase tracking-wider">Date</span>
                    <span className="text-sm font-bold text-white">{formatDate(selectedWorkout.date)}</span>
                  </div>
                </div>

                {selectedWorkout.exercises && selectedWorkout.exercises.length > 0 && (
                  <div>
                    <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-3">Exercises</h4>
                    <div className="space-y-2">
                      {selectedWorkout.exercises.map((exercise, idx) => (
                        <div key={idx} className="p-3 bg-[#0f111a] rounded-xl">
                          <p className="text-sm font-bold text-white mb-1">{exercise.name}</p>
                          <div className="flex gap-4 text-xs text-gray-500">
                            <span>{exercise.sets} sets</span>
                            <span>{exercise.reps} reps</span>
                            {exercise.weight > 0 && <span>{exercise.weight} kg</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedWorkout.notes && (
                  <div className="mt-6 pt-6 border-t border-white/5">
                    <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-2">Notes</h4>
                    <p className="text-sm text-gray-400">{selectedWorkout.notes}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-[#1c1f2e] border border-white/5 p-12 rounded-[2rem] text-center">
                <svg className="w-12 h-12 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-gray-500 text-sm">Select a workout to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Workout Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1c1f2e] border border-white/5 rounded-[2rem] p-8 max-w-md w-full">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-white">Log Workout</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-white/5 rounded-lg transition"
              >
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Workout Type</label>
                <input
                  type="text"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full bg-[#0f111a] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
                  placeholder="e.g., Upper Body, Cardio"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Duration (minutes)</label>
                <input
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  className="w-full bg-[#0f111a] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
                  placeholder="45"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Date</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full bg-[#0f111a] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Notes (Optional)</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full bg-[#0f111a] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition resize-none"
                  rows={3}
                  placeholder="How did it go?"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-cyan-500 hover:bg-cyan-400 text-[#121420] py-4 rounded-xl font-bold uppercase tracking-wider text-sm transition shadow-[0_0_20px_rgba(34,211,238,0.3)]"
              >
                Log Workout
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Workouts;