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
  onClose: () => void;
}

export function GoalDetails({ goal, onDelete, onUpdateProgress, onClose }: GoalDetailsProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getProgressPercentage = (goal: Goal) => {
    return Math.min(Math.round((goal.progress / goal.target) * 100), 100);
  };

  if (!goal) {
    return (
      <div className="pp-card p-12 text-center sticky top-24">
        <svg className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-[var(--text-muted)] text-sm">Select a goal to view details</p>
      </div>
    );
  }

  return (
    <>
      <div className="pp-card p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-xl font-bold text-[var(--text-primary)] mb-1">{goal.name}</h3>
            <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider">Goal Details</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="p-2 hover:bg-[var(--bg-tertiary)] rounded-lg transition text-[var(--text-muted)]"
              title="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <button
              onClick={() => onDelete(goal.id)}
              className="p-2 hover:bg-[var(--error)]/10 rounded-lg transition text-[var(--error)]"
              title="Delete"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        <div className="space-y-4 mb-6">
          <div className="p-4 bg-[var(--bg-tertiary)] rounded-[var(--radius-md)]">
            <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-2">Progress</p>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold text-[var(--text-primary)]">{goal.progress}</span>
              <span className="text-[var(--text-muted)] mb-1">/ {goal.target}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-[var(--bg-tertiary)] rounded-[var(--radius-md)] text-center">
              <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1">Type</p>
              <p className="text-sm font-bold text-[var(--text-primary)] capitalize">{goal.type}</p>
            </div>
            <div className="p-3 bg-[var(--bg-tertiary)] rounded-[var(--radius-md)] text-center">
              <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1">Deadline</p>
              <p className="text-sm font-bold text-[var(--text-primary)]">{formatDate(goal.deadline)}</p>
            </div>
          </div>
        </div>

        {/* Update Progress */}
        <div className="space-y-3">
          <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Update Progress</label>
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
            className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-[var(--radius-md)] px-4 py-3 text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-primary)] transition"
          />
        </div>
      </div>

      {/* Achievement Status */}
      {getProgressPercentage(goal) === 100 ? (
        <div className="pp-card p-6 border-[var(--success)]">
          <div className="text-center">
            <div className="w-16 h-16 bg-[var(--success)]/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-[var(--success)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">Goal Achieved!</h3>
            <p className="text-sm text-[var(--text-muted)]">Congratulations on reaching your target</p>
          </div>
        </div>
      ) : (
        <div className="pp-card p-6">
          <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider mb-4">Progress</h3>
          <div className="flex items-end gap-2 mb-3">
            <span className="text-5xl font-bold text-[var(--brand-primary)]">{getProgressPercentage(goal)}%</span>
            <span className="text-[var(--text-muted)] mb-2 uppercase tracking-wider text-sm">complete</span>
          </div>
          <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider">
            {goal.target - goal.progress} more to go
          </p>
        </div>
      )}
    </>
  );
}
