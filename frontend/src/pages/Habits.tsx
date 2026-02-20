import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';
import { HabitCard } from '../components/HabitCard';
import { Navigation } from '../components/Navigation';
import { PageHeader } from '../components/PageHeader';
import { EmptyState } from '../components/EmptyState';
import { Modal } from '../components/Modal';
import { FormInput } from '../components/FormInput';

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
      } else {
        setError(response.data.message);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to log habit');
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
      <Navigation currentPage="/habits" />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PageHeader 
          title="Daily Habits"
          subtitle="ROUTINE BUILDER // STREAK TRACKING"
          actionButton={{
            label: "Add Habit",
            onClick: () => setShowAddModal(true),
            icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            )
          }}
        />

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-xl">
            <p className="text-red-400 text-sm text-center font-medium">{error}</p>
          </div>
        )}

        {/* Habits Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Habits List */}
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
            {habits.length === 0 ? (
              <EmptyState
                className="col-span-2"
                icon={
                  <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
                title="No Habits Yet"
                description="Start building your daily routine"
                actionButton={{
                  label: "Create First Habit",
                  onClick: () => setShowAddModal(true)
                }}
              />
            ) : (
              habits.map((habit) => {
                const habitData = {
                  id: habit.id.toString(),
                  name: habit.name,
                  completed: false, // You may want to track this from logs
                  streak: getStreakDays(habitLogs.filter(log => log.id === habit.id)),
                  category: habit.frequency
                };
                
                return (
                  <div key={habit.id} onClick={() => setSelectedHabit(habit)}>
                    <HabitCard 
                      habit={habitData}
                      onToggle={(id) => handleLogHabit(parseInt(id))}
                    />
                  </div>
                );
              })
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

      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Create Habit"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormInput
            label="Habit Name"
            value={formData.name}
            onChange={(value) => setFormData({ ...formData, name: value })}
            placeholder="e.g., Morning Meditation"
            required
          />

          <FormInput
            label="Description"
            type="textarea"
            value={formData.description}
            onChange={(value) => setFormData({ ...formData, description: value })}
            placeholder="What does this habit involve?"
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <FormInput
              label="Frequency"
              type="select"
              value={formData.frequency}
              onChange={(value) => setFormData({ ...formData, frequency: value })}
              options={[
                { value: 'daily', label: 'Daily' },
                { value: 'weekly', label: 'Weekly' },
                { value: 'monthly', label: 'Monthly' }
              ]}
            />

            <FormInput
              label="Reminder Time"
              type="time"
              value={formData.reminder_time}
              onChange={(value) => setFormData({ ...formData, reminder_time: value })}
              required
            />
          </div>

          <FormInput
            label="Next Occurrence"
            type="date"
            value={formData.next_occurrence}
            onChange={(value) => setFormData({ ...formData, next_occurrence: value })}
            required
          />

          <button
            type="submit"
            className="w-full bg-cyan-500 hover:bg-cyan-400 text-[#121420] py-4 rounded-xl font-bold uppercase tracking-wider text-sm transition shadow-[0_0_20px_rgba(34,211,238,0.3)]"
          >
            Create Habit
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default Habits;