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
    <div className="bg-[#1c1f2e] border border-white/5 p-6 rounded-xl hover:border-purple-500/50 transition-all">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-bold text-white text-sm uppercase tracking-wider">{goal.name}</h4>
        <span className="text-sm font-mono text-cyan-400">{goal.progress}/{goal.target}</span>
      </div>
      
      <div className="mb-4">
        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-purple-500 to-cyan-400 rounded-full shadow-[0_0_10px_rgba(168,85,247,0.4)] transition-all duration-500"
            style={{ width: `${Math.min(goal.progress_percentage, 100)}%` }}
          />
        </div>
      </div>
      
      <div className="flex justify-between items-center">
        <span className="text-xs text-gray-500">{goal.progress_percentage}% complete</span>
        {goal.deadline && (
          <span className="text-xs text-gray-500">Due: {new Date(goal.deadline).toLocaleDateString()}</span>
        )}
      </div>
    </div>
  );
}