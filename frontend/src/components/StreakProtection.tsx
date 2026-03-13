import { useState, useEffect } from 'react';
import { Flame, Shield, AlertTriangle } from 'lucide-react';
import client from '../api/client';
import { useToast } from '../contexts/ToastContext';

interface StreakStatus {
  streak: number;
  streak_at_risk: boolean;
  can_freeze: boolean;
  can_afford_freeze: boolean;
  freeze_cost: number;
  freezes_used_this_week: number;
  max_freezes_per_week: number;
}

export function StreakProtection() {
  const [status, setStatus] = useState<StreakStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [freezing, setFreezing] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await client.get('/streak/status');
      if (response.data.success) {
        setStatus(response.data);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const useFreeze = async () => {
    if (!status?.can_freeze || !status?.can_afford_freeze) return;
    try {
      setFreezing(true);
      const response = await client.post('/streak/freeze');
      if (response.data.success) {
        showToast('Streak freeze activated! Your streak is safe.', 'success');
        fetchStatus();
      } else {
        showToast(response.data.message, 'error');
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to use freeze', 'error');
    } finally {
      setFreezing(false);
    }
  };

  if (loading || !status || status.streak === 0) return null;
  if (!status.streak_at_risk) return null;

  return (
    <div className="bg-gradient-to-r from-[var(--brand-secondary)]/10 to-[var(--brand-secondary)]/5 border border-[var(--brand-secondary)]/30 rounded-[var(--radius-lg)] p-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-[var(--brand-secondary)]/15 flex items-center justify-center flex-shrink-0">
          <AlertTriangle className="w-5 h-5 text-[var(--brand-secondary)]" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Flame className="w-4 h-4 text-[var(--brand-secondary)]" />
            <h4 className="font-bold text-[var(--text-primary)] text-sm">
              {status.streak}-day streak at risk!
            </h4>
          </div>
          <p className="text-xs text-[var(--text-muted)] mb-3">
            No workout logged today. Work out or use a streak freeze to protect your streak.
          </p>
          {status.can_freeze && status.can_afford_freeze && (
            <button
              onClick={useFreeze}
              disabled={freezing}
              className="flex items-center gap-2 px-3 py-2 bg-[var(--brand-secondary)]/15 border border-[var(--brand-secondary)]/30 rounded-[var(--radius-md)] text-[var(--brand-secondary)] text-xs font-bold hover:bg-[var(--brand-secondary)]/25 transition disabled:opacity-50"
            >
              <Shield className="w-3.5 h-3.5" />
              {freezing ? 'Activating...' : `Freeze Streak (${status.freeze_cost} pts)`}
            </button>
          )}
          {status.can_freeze && !status.can_afford_freeze && (
            <p className="text-xs text-[var(--text-muted)]">
              Need {status.freeze_cost} points to freeze. Keep working out to earn more!
            </p>
          )}
          {!status.can_freeze && (
            <p className="text-xs text-[var(--text-muted)]">
              Freeze already used this week. Log a workout to keep your streak!
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
