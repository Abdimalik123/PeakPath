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
    <div className="pp-card p-6 hover:border-[var(--brand-primary)]/50 transition-all group">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onToggle(habit.id)}
            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition ${
              habit.completed 
                ? 'bg-[var(--brand-primary)] border-[var(--brand-primary)] text-[var(--text-inverse)]' 
                : 'border-[var(--border-default)] hover:border-[var(--brand-primary)]'
            }`}
          >
            {habit.completed && <CheckIcon className="w-4 h-4" />}
          </button>
          <div>
            <h3 className="font-semibold text-[var(--text-primary)]">{habit.name}</h3>
            <p className="text-xs text-[var(--text-muted)] uppercase">{habit.category}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold text-[var(--brand-primary)]">{habit.streak}</p>
          <p className="text-xs text-[var(--text-muted)]">day streak</p>
        </div>
      </div>
    </div>
  );
}