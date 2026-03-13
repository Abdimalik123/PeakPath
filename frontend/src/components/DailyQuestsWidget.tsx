import { useEffect, useState } from 'react';
import { Trophy, CheckCircle, Loader } from 'lucide-react';
import client from '../api/client';
import { useToast } from '../contexts/ToastContext';

interface Quest {
  id: number;
  quest: {
    id: number;
    quest_type: string;
    title: string;
    description: string;
    points_reward: number;
    target_value: number;
    icon: string;
  };
  current_progress: number;
  is_completed: boolean;
  progress_percentage: number;
}

interface DailyQuestsWidgetProps {
  compact?: boolean;
}

export function DailyQuestsWidget({ compact = false }: DailyQuestsWidgetProps) {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    loadQuests();
  }, []);

  const loadQuests = async () => {
    try {
      setLoading(true);
      const response = await client.get('/daily-quests');
      if (response.data.success) {
        setQuests(response.data.quests || []);
      }
    } catch (error) {
      console.error('Failed to load daily quests:', error);
    } finally {
      setLoading(false);
    }
  };

  const completeQuest = async (questId: number) => {
    try {
      const response = await client.post(`/daily-quests/${questId}/complete`);
      if (response.data.success) {
        showToast(`Quest completed! +${response.data.points_awarded} points`, 'success');
        loadQuests(); // Reload to update UI
      }
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to complete quest', 'error');
    }
  };

  const completedCount = quests.filter(q => q.is_completed).length;
  const totalPoints = quests.reduce((sum, q) => sum + (q.is_completed ? q.quest.points_reward : 0), 0);

  if (loading) {
    return (
      <div className="pp-card p-6">
        <div className="flex items-center justify-center py-8">
          <Loader className="w-6 h-6 text-[var(--brand-primary)] animate-spin" />
        </div>
      </div>
    );
  }

  // ── Compact mode (for dashboard) ──────────────────────────────────────────
  if (compact) {
    return (
      <div className="pp-card p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-[var(--brand-secondary)]" />
            <span className="text-sm font-bold text-[var(--text-primary)]">Daily Quests</span>
          </div>
          <span className="text-xs text-[var(--text-muted)]">
            {completedCount}/{quests.length} done · {totalPoints} pts
          </span>
        </div>
        {quests.length === 0 ? (
          <p className="text-xs text-[var(--text-muted)] text-center py-2">No quests today</p>
        ) : (
          <div className="space-y-2">
            {quests.map((q) => (
              <div key={q.id} className="flex items-center gap-2">
                <span className="text-base flex-shrink-0">{q.quest.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <span className={`text-xs font-medium truncate ${q.is_completed ? 'text-[var(--text-muted)] line-through' : 'text-[var(--text-primary)]'}`}>
                      {q.quest.title}
                    </span>
                    <span className="text-xs text-[var(--text-muted)] flex-shrink-0">
                      {q.current_progress}/{q.quest.target_value}
                    </span>
                  </div>
                  <div className="h-1 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${q.is_completed ? 'bg-[var(--success)]' : 'bg-[var(--brand-primary)]'}`}
                      style={{ width: `${q.progress_percentage}%` }}
                    />
                  </div>
                </div>
                {q.is_completed && <CheckCircle className="w-3.5 h-3.5 text-[var(--success)] flex-shrink-0" />}
              </div>
            ))}
          </div>
        )}
        {completedCount === quests.length && quests.length > 0 && (
          <p className="text-xs text-[var(--success)] font-semibold text-center mt-3">🎉 All done for today!</p>
        )}
      </div>
    );
  }

  // ── Full mode ──────────────────────────────────────────────────────────────
  return (
    <div className="pp-card p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Trophy className="w-5 h-5 text-[var(--brand-secondary)]" />
            <h3 className="text-lg font-bold text-[var(--text-primary)]">Daily Quests</h3>
          </div>
          <p className="text-sm text-[var(--text-muted)]">
            {completedCount}/{quests.length} completed • {totalPoints} points earned
          </p>
        </div>
        {completedCount === quests.length && quests.length > 0 && (
          <div className="text-2xl">🎉</div>
        )}
      </div>

      {/* Quests List */}
      <div className="space-y-4">
        {quests.length === 0 ? (
          <p className="text-center text-[var(--text-muted)] py-4">No quests available today</p>
        ) : (
          quests.map((quest) => (
            <div
              key={quest.id}
              className={`relative overflow-hidden rounded-[var(--radius-md)] border transition-all ${
                quest.is_completed
                  ? 'bg-[var(--success)]/10 border-[var(--success)]/30'
                  : 'bg-[var(--bg-secondary)] border-[var(--border-default)] hover:border-[var(--brand-primary)]/30'
              }`}
            >
              {/* Progress Background */}
              <div
                className="absolute inset-0 bg-gradient-to-r from-[var(--brand-primary)]/10 to-transparent transition-all"
                style={{ width: `${quest.progress_percentage}%` }}
              />

              {/* Content */}
              <div className="relative p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="text-2xl mt-1">{quest.quest.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-bold text-[var(--text-primary)] text-sm">
                          {quest.quest.title}
                        </h4>
                        {quest.is_completed && (
                          <CheckCircle className="w-4 h-4 text-[var(--success)] flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-sm text-[var(--text-secondary)] mb-2">
                        {quest.quest.description}
                      </p>
                      
                      {/* Progress Bar */}
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all ${
                              quest.is_completed
                                ? 'bg-[var(--success)]'
                                : 'bg-[var(--brand-primary)]'
                            }`}
                            style={{ width: `${quest.progress_percentage}%` }}
                          />
                        </div>
                        <span className="text-sm font-bold text-[var(--text-primary)] whitespace-nowrap">
                          {quest.current_progress}/{quest.quest.target_value}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Points Badge */}
                  <div className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${
                    quest.is_completed
                      ? 'bg-[var(--success)]/15 text-[var(--success)]'
                      : 'bg-[var(--warning)]/15 text-[var(--warning)]'
                  }`}>
                    +{quest.quest.points_reward} pts
                  </div>
                </div>

                {/* Manual Complete Button (for testing) */}
                {!quest.is_completed && quest.current_progress >= quest.quest.target_value && (
                  <button
                    onClick={() => completeQuest(quest.id)}
                    className="mt-3 w-full px-4 py-2 bg-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/90 text-[var(--text-inverse)] text-xs font-bold rounded-[var(--radius-md)] transition"
                  >
                    Claim Reward
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Completion Celebration */}
      {completedCount === quests.length && quests.length > 0 && (
        <div className="mt-6 p-4 bg-[var(--success)]/10 border border-[var(--success)]/20 rounded-[var(--radius-md)] text-center">
          <p className="text-sm font-bold text-[var(--success)] mb-1">🎊 All Quests Complete! 🎊</p>
          <p className="text-xs text-[var(--text-muted)]">Come back tomorrow for new quests</p>
        </div>
      )}
    </div>
  );
}
