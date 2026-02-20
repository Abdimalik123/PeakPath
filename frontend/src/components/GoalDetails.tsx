import React from 'react';

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

interface GoalDetailsProps {
  goal: Goal | null;
  onDelete: (id: number) => void;
  onUpdateProgress: (id: number, progress: number) => void;
}

export function GoalDetails({ goal, onDelete, onUpdateProgress }: GoalDetailsProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getProgressPercentage = (goal: Goal) => {
    return Math.min(Math.round((goal.progress / goal.target) * 100), 100);
  };

  if (!goal) {
    return (
      <div className="bg-[#1c1f2e] border border-white/5 p-12 rounded-[2rem] text-center sticky top-24">
        <svg className="w-12 h-12 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-gray-500 text-sm">Select a goal to view details</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-[#1c1f2e] border border-white/5 p-6 rounded-[2rem]">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-xl font-bold text-white mb-1">{goal.name}</h3>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Goal Details</p>
          </div>
          <button
            onClick={() => onDelete(goal.id)}
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
              <span className="text-3xl font-bold text-white">{goal.progress}</span>
              <span className="text-gray-500 mb-1">/ {goal.target}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-[#0f111a] rounded-xl text-center">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Type</p>
              <p className="text-sm font-bold text-white capitalize">{goal.type}</p>
            </div>
            <div className="p-3 bg-[#0f111a] rounded-xl text-center">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Deadline</p>
              <p className="text-sm font-bold text-white">{formatDate(goal.deadline)}</p>
            </div>
          </div>
        </div>

        {/* Update Progress */}
        <div className="space-y-3">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Update Progress</label>
          <input
            type="number"
            min="0"
            max={goal.target}
            defaultValue={goal.progress}
            onChange={(e) => {
              const newProgress = parseInt(e.target.value);
              if (newProgress >= 0 && newProgress <= goal.target) {
                onUpdateProgress(goal.id, newProgress);
              }
            }}
            className="w-full bg-[#0f111a] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
          />
        </div>
      </div>

      {/* Achievement Status */}
      {getProgressPercentage(goal) === 100 ? (
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
            <span className="text-5xl font-bold text-white">{getProgressPercentage(goal)}%</span>
            <span className="text-cyan-100 mb-2 uppercase tracking-wider text-sm">complete</span>
          </div>
          <p className="text-xs text-cyan-100 uppercase tracking-wider">
            {goal.target - goal.progress} more to go
          </p>
        </div>
      )}
    </>
  );
}
