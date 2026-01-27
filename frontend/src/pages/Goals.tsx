import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

interface Goal {
  id: number;
  user_id: number;
  name: string;
  type: string;
  target: number;
  progress: number;
  deadline: string;
  created_at: string;
  updated_at: string;
}

const Goals: React.FC = () => {
  const navigate = useNavigate();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    goal_type: 'fitness',
    target: '',
    progress: '0',
    deadline: ''
  });

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch('http://localhost:5000/goals', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        setGoals(data.goals);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to load goals');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/goals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: formData.name,
          goal_type: formData.goal_type,
          target: parseInt(formData.target),
          progress: parseInt(formData.progress),
          deadline: formData.deadline
        })
      });

      const data = await response.json();
      if (data.success) {
        setShowAddModal(false);
        setFormData({
          name: '',
          goal_type: 'fitness',
          target: '',
          progress: '0',
          deadline: ''
        });
        fetchGoals();
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to create goal');
    }
  };

  const handleUpdateProgress = async (goalId: number, newProgress: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/goals/${goalId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ progress: newProgress })
      });

      const data = await response.json();
      if (data.success) {
        fetchGoals();
        if (selectedGoal && selectedGoal.id === goalId) {
          setSelectedGoal({ ...selectedGoal, progress: newProgress });
        }
      }
    } catch (err) {
      setError('Failed to update progress');
    }
  };

  const handleDelete = async (goalId: number) => {
    if (!confirm('Delete this goal?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/goals/${goalId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        fetchGoals();
        setSelectedGoal(null);
      }
    } catch (err) {
      setError('Failed to delete goal');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getProgressPercentage = (goal: Goal) => {
    return Math.min(Math.round((goal.progress / goal.target) * 100), 100);
  };

  const getDaysRemaining = (deadline: string) => {
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getGoalTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      'fitness': 'cyan',
      'weight': 'purple',
      'habit': 'blue',
      'skill': 'emerald',
      'other': 'violet'
    };
    return colors[type] || 'cyan';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#121420] flex items-center justify-center">
        <div className="text-cyan-400 text-xl">Loading goals...</div>
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
                <Link to="/habits" className="text-gray-400 hover:text-white font-medium text-sm transition">HABITS</Link>
                <Link to="/goals" className="text-cyan-400 font-medium text-sm border-b-2 border-cyan-400 pb-1">GOALS</Link>
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
            <h2 className="text-3xl font-bold text-white mb-2">Goals & Milestones</h2>
            <p className="text-gray-400 text-sm uppercase tracking-wider">LONG-TERM OBJECTIVES // PROGRESS TRACKING</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-cyan-500 hover:bg-cyan-400 text-[#121420] px-6 py-3 rounded-xl font-bold text-sm uppercase tracking-wider transition shadow-[0_0_20px_rgba(34,211,238,0.3)] flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            New Goal
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-xl">
            <p className="text-red-400 text-sm text-center font-medium">{error}</p>
          </div>
        )}

        {/* Goals Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Goals List */}
          <div className="lg:col-span-2 space-y-4">
            {goals.length === 0 ? (
              <div className="bg-[#1c1f2e] border border-white/5 p-12 rounded-[2rem] text-center">
                <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
                <h3 className="text-xl font-bold text-white mb-2">No Goals Yet</h3>
                <p className="text-gray-500 mb-6">Set your first milestone and start tracking progress</p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="bg-cyan-500 hover:bg-cyan-400 text-[#121420] px-6 py-2 rounded-xl font-bold text-sm uppercase tracking-wider transition"
                >
                  Create First Goal
                </button>
              </div>
            ) : (
              goals.map((goal) => {
                const percentage = getProgressPercentage(goal);
                const daysLeft = getDaysRemaining(goal.deadline);
                const color = getGoalTypeColor(goal.type);
                
                return (
                  <div
                    key={goal.id}
                    onClick={() => setSelectedGoal(goal)}
                    className="bg-[#1c1f2e] border border-white/5 p-6 rounded-[2rem] hover:border-purple-500/50 transition-all cursor-pointer group"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`p-2 bg-${color}-500/10 rounded-xl`}>
                            <svg className={`w-5 h-5 text-${color}-400`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                            </svg>
                          </div>
                          <h4 className="text-lg font-bold text-white">{goal.name}</h4>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                          <span className="uppercase tracking-wider bg-white/5 px-3 py-1 rounded-full">{goal.type}</span>
                          <span>Deadline: {formatDate(goal.deadline)}</span>
                          {daysLeft > 0 ? (
                            <span className="text-cyan-400">{daysLeft} days left</span>
                          ) : (
                            <span className="text-red-400">Overdue</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-bold text-white mb-1">{percentage}%</p>
                        <p className="text-xs text-gray-500 uppercase tracking-wider">Complete</p>
                      </div>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="mb-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs text-gray-500 font-mono">{goal.progress} / {goal.target}</span>
                        <span className="text-xs text-gray-500">{goal.target - goal.progress} remaining</span>
                      </div>
                      <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full bg-${color}-400 rounded-full shadow-[0_0_10px_rgba(34,211,238,0.4)] transition-all duration-500`}
                          style={{width: `${percentage}%`}}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Goal Details Sidebar */}
          <div className="space-y-6">
            {selectedGoal ? (
              <>
                <div className="bg-[#1c1f2e] border border-white/5 p-6 rounded-[2rem]">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-xl font-bold text-white mb-1">{selectedGoal.name}</h3>
                      <p className="text-xs text-gray-500 uppercase tracking-wider">Goal Details</p>
                    </div>
                    <button
                      onClick={() => handleDelete(selectedGoal.id)}
                      className="p-2 hover:bg-red-500/10 rounded-lg transition text-red-400"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>

                  <div className="space-y-4 mb-6">
                    <div className="p-4 bg-[#0f111a] rounded-xl">
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Progress</p>
                      <div className="flex items-end gap-2">
                        <span className="text-3xl font-bold text-white">{selectedGoal.progress}</span>
                        <span className="text-gray-500 mb-1">/ {selectedGoal.target}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-[#0f111a] rounded-xl text-center">
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Type</p>
                        <p className="text-sm font-bold text-white capitalize">{selectedGoal.type}</p>
                      </div>
                      <div className="p-3 bg-[#0f111a] rounded-xl text-center">
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Deadline</p>
                        <p className="text-sm font-bold text-white">{formatDate(selectedGoal.deadline)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Update Progress */}
                  <div className="space-y-3">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Update Progress</label>
                    <input
                      type="number"
                      min="0"
                      max={selectedGoal.target}
                      defaultValue={selectedGoal.progress}
                      onChange={(e) => {
                        const newProgress = parseInt(e.target.value);
                        if (newProgress >= 0 && newProgress <= selectedGoal.target) {
                          handleUpdateProgress(selectedGoal.id, newProgress);
                        }
                      }}
                      className="w-full bg-[#0f111a] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
                    />
                  </div>
                </div>

                {/* Achievement Status */}
                {getProgressPercentage(selectedGoal) === 100 ? (
                  <div className="bg-gradient-to-br from-emerald-500 to-cyan-600 rounded-[2rem] p-6 shadow-[0_0_40px_rgba(52,211,153,0.3)]">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">Goal Achieved!</h3>
                      <p className="text-sm text-emerald-100">Congratulations on reaching your target</p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gradient-to-br from-cyan-500 to-blue-600 rounded-[2rem] p-6 shadow-[0_0_40px_rgba(34,211,238,0.3)]">
                    <h3 className="text-xl font-bold text-white mb-2">Keep Going!</h3>
                    <div className="flex items-end gap-2 mb-3">
                      <span className="text-5xl font-bold text-white">{getProgressPercentage(selectedGoal)}%</span>
                      <span className="text-cyan-100 mb-2 uppercase tracking-wider text-sm">complete</span>
                    </div>
                    <p className="text-xs text-cyan-100 uppercase tracking-wider">
                      {selectedGoal.target - selectedGoal.progress} more to go
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-[#1c1f2e] border border-white/5 p-12 rounded-[2rem] text-center sticky top-24">
                <svg className="w-12 h-12 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-gray-500 text-sm">Select a goal to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Goal Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1c1f2e] border border-white/5 rounded-[2rem] p-8 max-w-md w-full">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-white">Create Goal</h3>
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
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Goal Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-[#0f111a] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
                  placeholder="e.g., Run 100km this month"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Type</label>
                  <select
                    value={formData.goal_type}
                    onChange={(e) => setFormData({ ...formData, goal_type: e.target.value })}
                    className="w-full bg-[#0f111a] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
                  >
                    <option value="fitness">Fitness</option>
                    <option value="weight">Weight</option>
                    <option value="habit">Habit</option>
                    <option value="skill">Skill</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Target</label>
                  <input
                    type="number"
                    value={formData.target}
                    onChange={(e) => setFormData({ ...formData, target: e.target.value })}
                    className="w-full bg-[#0f111a] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
                    placeholder="100"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Current Progress</label>
                <input
                  type="number"
                  value={formData.progress}
                  onChange={(e) => setFormData({ ...formData, progress: e.target.value })}
                  className="w-full bg-[#0f111a] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Deadline</label>
                <input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  className="w-full bg-[#0f111a] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-cyan-500 hover:bg-cyan-400 text-[#121420] py-4 rounded-xl font-bold uppercase tracking-wider text-sm transition shadow-[0_0_20px_rgba(34,211,238,0.3)]"
              >
                Create Goal
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Goals;