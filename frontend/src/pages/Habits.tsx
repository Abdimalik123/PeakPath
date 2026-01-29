import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import client from '../api/client';

interface Habit {
  id: number;
  name: string;
  frequency: string;
  reminder_time: string;
  description: string;
  next_occurrence: string;
  created_at: string;
}

interface HabitLog {
  id: number;
  timestamp: string;
  completed: boolean;
  amount: number;
  notes: string;
}

const Habits: React.FC = () => {
  const navigate = useNavigate();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const [habitLogs, setHabitLogs] = useState<HabitLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    frequency: 'daily',
    reminder_time: '09:00',
    description: '',
    next_occurrence: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchHabits();
  }, []);

  useEffect(() => {
    if (selectedHabit) {
      fetchHabitLogs(selectedHabit.id);
    }
  }, [selectedHabit]);

  const fetchHabits = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await client.get('/habits');
      
      if (response.data.success) {
        setHabits(response.data.habits);
      } else {
        setError(response.data.message);
      }
    } catch (err: any) {
      if (err?.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        setError('Failed to load habits');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchHabitLogs = async (habitId: number) => {
    try {
      const response = await client.get(`/habits/${habitId}/logs`);
      
      if (response.data.success) {
        setHabitLogs(response.data.logs);
      }
    } catch (err) {
      console.error('Failed to load habit logs', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const response = await client.post('/habits', formData);
      
      if (response.data.success) {
        setShowAddModal(false);
        setFormData({
          name: '',
          frequency: 'daily',
          reminder_time: '09:00',
          description: '',
          next_occurrence: new Date().toISOString().split('T')[0]
        });
        fetchHabits();
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      setError('Failed to create habit');
    }
  };

  const handleLogHabit = async (habitId: number) => {
    try {
      const response = await client.post(`/habits/${habitId}/log`, {
        completed: true,
        timestamp: new Date().toISOString()
      });
      
      if (response.data.success) {
        if (selectedHabit && selectedHabit.id === habitId) {
          fetchHabitLogs(habitId);
        }
      }
    } catch (err) {
      setError('Failed to log habit');
    }
  };

  const handleDelete = async (habitId: number) => {
    if (!confirm('Delete this habit?')) return;

    try {
      const response = await client.delete(`/habits/${habitId}`);
      
      if (response.data.success) {
        fetchHabits();
        setSelectedHabit(null);
      }
    } catch (err) {
      setError('Failed to delete habit');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const getStreakDays = (logs: HabitLog[]) => {
    if (logs.length === 0) return 0;
    
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < logs.length; i++) {
      const logDate = new Date(logs[i].timestamp);
      logDate.setHours(0, 0, 0, 0);
      
      const daysDiff = Math.floor((today.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === i && logs[i].completed) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#121420] flex items-center justify-center">
        <div className="text-cyan-400 text-xl">Loading habits...</div>
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
                <Link to="/workouts" className="text-gray-400 hover:text-white font-medium text-sm transition">WORKOUTS</Link>
                <Link to="/habits" className="text-cyan-400 font-medium text-sm border-b-2 border-cyan-400 pb-1">HABITS</Link>
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
            <h2 className="text-3xl font-bold text-white mb-2">Daily Habits</h2>
            <p className="text-gray-400 text-sm uppercase tracking-wider">ROUTINE BUILDER // STREAK TRACKING</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-cyan-500 hover:bg-cyan-400 text-[#121420] px-6 py-3 rounded-xl font-bold text-sm uppercase tracking-wider transition shadow-[0_0_20px_rgba(34,211,238,0.3)] flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Habit
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-xl">
            <p className="text-red-400 text-sm text-center font-medium">{error}</p>
          </div>
        )}

        {/* Habits Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Habits List */}
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
            {habits.length === 0 ? (
              <div className="col-span-2 bg-[#1c1f2e] border border-white/5 p-12 rounded-[2rem] text-center">
                <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-xl font-bold text-white mb-2">No Habits Yet</h3>
                <p className="text-gray-500 mb-6">Start building your daily routine</p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="bg-cyan-500 hover:bg-cyan-400 text-[#121420] px-6 py-2 rounded-xl font-bold text-sm uppercase tracking-wider transition"
                >
                  Create First Habit
                </button>
              </div>
            ) : (
              habits.map((habit) => (
                <div
                  key={habit.id}
                  onClick={() => setSelectedHabit(habit)}
                  className="bg-[#1c1f2e] border border-white/5 p-6 rounded-[2rem] hover:border-blue-500/50 transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-400 group-hover:bg-blue-500 group-hover:text-[#121420] transition-colors">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLogHabit(habit.id);
                      }}
                      className="p-2 bg-cyan-500/10 hover:bg-cyan-500 rounded-lg transition text-cyan-400 hover:text-[#121420]"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                  </div>
                  
                  <h4 className="text-lg font-bold text-white mb-2">{habit.name}</h4>
                  <p className="text-sm text-gray-500 mb-4">{habit.description}</p>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 uppercase tracking-wider bg-white/5 px-3 py-1 rounded-full">
                      {habit.frequency}
                    </span>
                    <span className="text-xs text-cyan-400 font-mono">
                      {habit.reminder_time}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Habit Details Sidebar */}
          <div className="space-y-6">
            {selectedHabit ? (
              <>
                <div className="bg-[#1c1f2e] border border-white/5 p-6 rounded-[2rem]">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-xl font-bold text-white mb-1">{selectedHabit.name}</h3>
                      <p className="text-xs text-gray-500 uppercase tracking-wider">Habit Details</p>
                    </div>
                    <button
                      onClick={() => handleDelete(selectedHabit.id)}
                      className="p-2 hover:bg-red-500/10 rounded-lg transition text-red-400"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>

                  <div className="space-y-4 mb-6">
                    <div className="p-4 bg-[#0f111a] rounded-xl">
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Description</p>
                      <p className="text-sm text-white">{selectedHabit.description}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-[#0f111a] rounded-xl text-center">
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Frequency</p>
                        <p className="text-sm font-bold text-white">{selectedHabit.frequency}</p>
                      </div>
                      <div className="p-3 bg-[#0f111a] rounded-xl text-center">
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Reminder</p>
                        <p className="text-sm font-bold text-white">{selectedHabit.reminder_time}</p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleLogHabit(selectedHabit.id)}
                    className="w-full bg-cyan-500 hover:bg-cyan-400 text-[#121420] py-3 rounded-xl font-bold uppercase tracking-wider text-sm transition flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Complete Today
                  </button>
                </div>

                {/* Streak Info */}
                <div className="bg-gradient-to-br from-cyan-500 to-blue-600 rounded-[2rem] p-6 shadow-[0_0_40px_rgba(34,211,238,0.3)]">
                  <h3 className="text-xl font-bold text-white mb-2">Current Streak</h3>
                  <div className="flex items-end gap-2 mb-3">
                    <span className="text-5xl font-bold text-white">{getStreakDays(habitLogs)}</span>
                    <span className="text-cyan-100 mb-2 uppercase tracking-wider text-sm">days</span>
                  </div>
                  <p className="text-xs text-cyan-100 uppercase tracking-wider">Keep it going!</p>
                </div>

                {/* Recent Activity */}
                <div className="bg-[#1c1f2e] border border-white/5 p-6 rounded-[2rem]">
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Recent Activity</h4>
                  {habitLogs.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">No logs yet</p>
                  ) : (
                    <div className="space-y-2">
                      {habitLogs.slice(0, 7).map((log) => (
                        <div key={log.id} className="flex items-center justify-between p-3 bg-[#0f111a] rounded-xl">
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${log.completed ? 'bg-cyan-400' : 'bg-gray-600'}`}></div>
                            <span className="text-sm text-white">{formatDate(log.timestamp)}</span>
                          </div>
                          <span className="text-xs text-gray-500">{formatTime(log.timestamp)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="bg-[#1c1f2e] border border-white/5 p-12 rounded-[2rem] text-center sticky top-24">
                <svg className="w-12 h-12 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-gray-500 text-sm">Select a habit to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Habit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1c1f2e] border border-white/5 rounded-[2rem] p-8 max-w-md w-full">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-white">Create Habit</h3>
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
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Habit Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-[#0f111a] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
                  placeholder="e.g., Morning Meditation"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-[#0f111a] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition resize-none"
                  rows={3}
                  placeholder="What does this habit involve?"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Frequency</label>
                  <select
                    value={formData.frequency}
                    onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                    className="w-full bg-[#0f111a] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Reminder Time</label>
                  <input
                    type="time"
                    value={formData.reminder_time}
                    onChange={(e) => setFormData({ ...formData, reminder_time: e.target.value })}
                    className="w-full bg-[#0f111a] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Next Occurrence</label>
                <input
                  type="date"
                  value={formData.next_occurrence}
                  onChange={(e) => setFormData({ ...formData, next_occurrence: e.target.value })}
                  className="w-full bg-[#0f111a] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-cyan-500 hover:bg-cyan-400 text-[#121420] py-4 rounded-xl font-bold uppercase tracking-wider text-sm transition shadow-[0_0_20px_rgba(34,211,238,0.3)]"
              >
                Create Habit
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Habits;