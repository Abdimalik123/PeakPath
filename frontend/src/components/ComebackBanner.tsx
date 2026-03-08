import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Dumbbell, X } from 'lucide-react';
import client from '../api/client';

export function ComebackBanner() {
  const [comeback, setComeback] = useState<{
    is_comeback: boolean;
    days_inactive: number;
    bonus_points: number;
    message: string | null;
  } | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await client.get('/comeback-status');
        if (response.data.success && response.data.is_comeback) {
          setComeback(response.data);
        }
      } catch {}
    };
    fetchStatus();
  }, []);

  if (!comeback || !comeback.is_comeback || dismissed) return null;

  return (
    <div className="bg-gradient-to-r from-emerald-900/30 to-teal-900/30 border border-emerald-500/30 rounded-xl p-4 relative">
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-3 right-3 p-1 hover:bg-[var(--bg-tertiary)] rounded-lg"
      >
        <X className="w-4 h-4 text-[var(--text-muted)]" />
      </button>

      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
          <Heart className="w-5 h-5 text-emerald-400" />
        </div>
        <div>
          <h4 className="font-bold text-[var(--text-primary)] text-sm mb-1">Welcome Back!</h4>
          <p className="text-xs text-[var(--text-muted)] mb-3">{comeback.message}</p>
          <Link
            to="/active-workout"
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/20 border border-emerald-500/30 rounded-lg text-emerald-300 text-xs font-bold hover:bg-emerald-500/30 transition"
          >
            <Dumbbell className="w-3.5 h-3.5" />
            Start Workout (+{comeback.bonus_points} bonus pts)
          </Link>
        </div>
      </div>
    </div>
  );
}
