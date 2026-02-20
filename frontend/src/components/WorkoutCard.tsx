import React from 'react';

interface WorkoutCardProps {
  workout: {
    id: string;
    type: string;
    date: string;
    duration: number;
    exercise_count: number;
    calories?: number;
  };
  onClick?: (id: string) => void;
}

const DumbbellIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

export function WorkoutCard({ workout, onClick }: WorkoutCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  return (
    <div 
      className="bg-[#1c1f2e] border border-white/5 p-5 rounded-2xl hover:border-cyan-500/50 transition-all cursor-pointer group"
      onClick={() => onClick?.(workout.id)}
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-cyan-500/10 rounded-xl flex items-center justify-center group-hover:bg-cyan-500 transition-colors">
          <DumbbellIcon className="w-6 h-6 text-cyan-400 group-hover:text-[#121420] transition-colors" />
        </div>
        <div className="flex-1">
          <h4 className="font-bold text-white mb-1">{workout.type}</h4>
          <p className="text-xs text-gray-500 font-mono uppercase tracking-wider">{formatDate(workout.date)}</p>
        </div>
        <div className="text-right">
          <p className="font-bold text-white">{workout.duration}<span className="text-gray-500 text-sm">min</span></p>
          <p className="text-xs text-gray-500 uppercase tracking-wider">{workout.exercise_count} exercises</p>
        </div>
      </div>
    </div>
  );
}