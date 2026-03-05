import { Flame } from 'lucide-react';

interface StreakCalendarProps {
  streak: number;
  title?: string;
}

export function StreakCalendar({ streak, title = "Current Streak" }: StreakCalendarProps) {
  const getStreakColor = (days: number) => {
    if (days >= 30) return 'from-orange-500 to-red-600';
    if (days >= 14) return 'from-yellow-500 to-orange-500';
    if (days >= 7) return 'from-green-500 to-yellow-500';
    return 'from-blue-500 to-green-500';
  };

  const getStreakMessage = (days: number) => {
    if (days === 0) return "Start your streak today!";
    if (days === 1) return "Great start!";
    if (days < 7) return "Keep it going!";
    if (days < 14) return "You're on fire!";
    if (days < 30) return "Incredible dedication!";
    return "Legendary streak!";
  };

  return (
    <div className="relative overflow-hidden rounded-lg border border-[var(--border-default)] bg-gradient-to-br from-[var(--bg-secondary)] to-[var(--bg-tertiary)] p-6">
      {/* Background flame effect for high streaks */}
      {streak >= 7 && (
        <div className="absolute inset-0 opacity-10">
          <div className={`absolute inset-0 bg-gradient-to-br ${getStreakColor(streak)}`}></div>
        </div>
      )}

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-[var(--text-muted)] uppercase tracking-wider">
            {title}
          </h3>
          {streak > 0 && (
            <div className={`p-2 rounded-lg bg-gradient-to-br ${getStreakColor(streak)}`}>
              <Flame className="w-5 h-5 text-white" />
            </div>
          )}
        </div>

        <div className="flex items-baseline gap-2 mb-2">
          <span className={`text-5xl font-bold bg-gradient-to-br ${getStreakColor(streak)} bg-clip-text text-transparent`}>
            {streak}
          </span>
          <span className="text-2xl font-bold text-[var(--text-muted)]">
            {streak === 1 ? 'day' : 'days'}
          </span>
        </div>

        <p className="text-sm text-[var(--text-muted)]">
          {getStreakMessage(streak)}
        </p>

        {/* Milestone indicators */}
        {streak > 0 && (
          <div className="mt-4 flex gap-2">
            {[7, 14, 30, 60, 100].map((milestone) => (
              <div
                key={milestone}
                className={`flex-1 h-2 rounded-full transition-all ${
                  streak >= milestone
                    ? `bg-gradient-to-r ${getStreakColor(milestone)}`
                    : 'bg-[var(--bg-tertiary)]'
                }`}
                title={`${milestone} day milestone`}
              />
            ))}
          </div>
        )}

        {streak > 0 && (
          <div className="mt-2 flex justify-between text-xs text-[var(--text-muted)]">
            <span>7</span>
            <span>14</span>
            <span>30</span>
            <span>60</span>
            <span>100</span>
          </div>
        )}
      </div>
    </div>
  );
}
