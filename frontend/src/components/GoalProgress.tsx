import React from 'react';

interface GoalProgressProps {
  goal: {
    id: string;
    name: string;
    progress: number;
    target: number;
    progress_percentage: number;
    category?: string;
    deadline?: string;
  };
}

export function GoalProgress({ goal }: GoalProgressProps) {
  return (
    <div className="pp-card p-6 hover:border-[var(--brand-primary)]/50 transition-all">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-bold text-[var(--text-primary)] text-sm uppercase tracking-wider">{goal.name}</h4>
        <span className="text-sm font-mono text-[var(--brand-primary)]">{goal.progress}/{goal.target}</span>
      </div>
      
      <div className="mb-4">
        <div className="h-2 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
          <div 
            className="h-full bg-[var(--brand-primary)] rounded-full transition-all duration-500"
            style={{ width: `${Math.min(goal.progress_percentage, 100)}%` }}
          />
        </div>
      </div>
      
      <div className="flex justify-between items-center">
        <span className="text-xs text-[var(--text-muted)]">{goal.progress_percentage}% complete</span>
        {goal.deadline && (
          <span className="text-xs text-[var(--text-muted)]">Due: {new Date(goal.deadline).toLocaleDateString()}</span>
        )}
      </div>
    </div>
  );
}