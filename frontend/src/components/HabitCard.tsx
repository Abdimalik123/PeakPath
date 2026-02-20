import React from 'react';

interface HabitCardProps {
  habit: {
    id: string;
    name: string;
    completed: boolean;
    streak: number;
    category: string;
  };
  onToggle: (id: string) => void;
}

const CheckIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

export function HabitCard({ habit, onToggle }: HabitCardProps) {
  return (
    <div className="bg-[#1c1f2e] border border-white/5 p-6 rounded-xl hover:border-blue-500/50 transition-all group">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onToggle(habit.id)}
            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition ${
              habit.completed 
                ? 'bg-blue-500 border-blue-500 text-white' 
                : 'border-white/20 hover:border-blue-500'
            }`}
          >
            {habit.completed && <CheckIcon className="w-4 h-4" />}
          </button>
          <div>
            <h3 className="font-semibold text-white">{habit.name}</h3>
            <p className="text-xs text-gray-500 uppercase">{habit.category}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold text-blue-400">{habit.streak}</p>
          <p className="text-xs text-gray-500">day streak</p>
        </div>
      </div>
    </div>
  );
}