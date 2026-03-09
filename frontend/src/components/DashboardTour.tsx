import { useState, useEffect, useCallback } from 'react';
import { ArrowRight, ArrowLeft, Sparkles } from 'lucide-react';

const TOUR_KEY = 'dashboard_tour_complete';
const PAD = 10;

const STEPS = [
  {
    id: null as string | null,
    mobileId: undefined as string | undefined,
    title: 'Welcome to your dashboard!',
    description: "You're all set up. Let us take 30 seconds to show you what's here and where everything lives.",
  },
  {
    id: 'tour-stats',
    mobileId: undefined,
    title: 'Your daily overview',
    description: 'Four cards, one glance — workouts completed today, habits logged, active goals, and your current streak.',
  },
  {
    id: 'tour-quests',
    mobileId: undefined,
    title: 'Daily Quests',
    description: 'New challenges every day. Completing quests earns you XP, grows your streak, and pushes you toward the next rank.',
  },
  {
    id: 'tour-sessions',
    mobileId: undefined,
    title: 'Recent Sessions',
    description: 'Your latest workout sessions appear here. Tap "View all" to browse your full training history on the Workout page.',
  },
  {
    id: 'tour-heatmap',
    mobileId: undefined,
    title: 'Consistency Heatmap',
    description: 'Every square is a day. Darker green means more training. Build your streak and watch this fill in — it\'s the best motivator to keep going.',
  },
  {
    id: 'tour-fab',
    mobileId: undefined,
    title: 'Start a Workout',
    description: "This button is always visible — tap it any time you're ready to begin a new session, without navigating anywhere.",
  },
  {
    id: 'tour-nav-desktop',
    mobileId: 'tour-nav-mobile',
    title: 'App Navigation',
    description: 'Everything in one place: Workouts, Stats (your historical charts & trends), Routines, Goals, and the Community.',
  },
];

function resolveElement(id: string | null, mobileId?: string): HTMLElement | null {
  if (!id) return null;
  const el = document.getElementById(id);
  if (el && el.getBoundingClientRect().height > 0) return el;
  if (mobileId) {
    const mobileEl = document.getElementById(mobileId);
    if (mobileEl && mobileEl.getBoundingClientRect().height > 0) return mobileEl;
  }
  return null;
}

export function DashboardTour() {
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);
  const [spotRect, setSpotRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (!localStorage.getItem(TOUR_KEY)) {
      const t = setTimeout(() => setActive(true), 700);
      return () => clearTimeout(t);
    }
  }, []);

  const updateSpot = useCallback((stepIndex: number) => {
    const s = STEPS[stepIndex];
    const el = resolveElement(s.id, s.mobileId);
    if (!el) { setSpotRect(null); return; }
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    setTimeout(() => setSpotRect(el.getBoundingClientRect()), 350);
  }, []);

  useEffect(() => {
    if (active) updateSpot(step);
  }, [active, step, updateSpot]);

  useEffect(() => {
    if (!active) return;
    const onResize = () => updateSpot(step);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [active, step, updateSpot]);

  const finish = useCallback(() => {
    localStorage.setItem(TOUR_KEY, 'true');
    setActive(false);
  }, []);

  const next = () => {
    if (step < STEPS.length - 1) setStep(s => s + 1);
    else finish();
  };

  const back = () => {
    if (step > 0) setStep(s => s - 1);
  };

  if (!active) return null;

  const s = STEPS[step];
  const isWelcome = !s.id;
  const isLast = step === STEPS.length - 1;
  const progress = ((step + 1) / STEPS.length) * 100;

  // Tooltip positioning
  let tooltipTop: number | undefined;
  let tooltipBottom: number | undefined;
  let tooltipLeft = 12;
  let arrowDir: 'up' | 'down' | undefined;

  if (spotRect && !isWelcome) {
    const cardWidth = Math.min(340, window.innerWidth - 24);
    tooltipLeft = Math.max(12, Math.min(spotRect.left, window.innerWidth - cardWidth - 12));
    const spaceBelow = window.innerHeight - spotRect.bottom - PAD - 12;
    if (spaceBelow >= 160) {
      tooltipTop = spotRect.bottom + PAD + 8;
      arrowDir = 'up';
    } else {
      tooltipBottom = window.innerHeight - spotRect.top + PAD + 8;
      arrowDir = 'down';
    }
  }

  return (
    <>
      {/* Click-away dismiss */}
      <div className="fixed inset-0 z-[9990] cursor-pointer" onClick={finish} />

      {/* Welcome step dark overlay */}
      {isWelcome && (
        <div className="fixed inset-0 z-[9991] bg-black/70 pointer-events-none" />
      )}

      {/* Spotlight */}
      {spotRect && !isWelcome && (
        <div
          className="fixed pointer-events-none rounded-xl z-[9991] transition-all duration-300"
          style={{
            top: spotRect.top - PAD,
            left: spotRect.left - PAD,
            width: spotRect.width + PAD * 2,
            height: spotRect.height + PAD * 2,
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.72)',
            border: '2px solid var(--brand-primary)',
          }}
        />
      )}

      {/* Welcome card (centered) */}
      {isWelcome && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none">
          <TourCard
            step={step}
            total={STEPS.length}
            progress={progress}
            title={s.title}
            description={s.description}
            isFirst={step === 0}
            isLast={isLast}
            onBack={back}
            onNext={next}
            onSkip={finish}
          />
        </div>
      )}

      {/* Positioned tooltip */}
      {!isWelcome && spotRect && (
        <div
          className="fixed z-[9999] pointer-events-none"
          style={{
            top: tooltipTop,
            bottom: tooltipBottom,
            left: tooltipLeft,
            width: Math.min(340, window.innerWidth - 24),
          }}
        >
          {arrowDir === 'up' && (
            <div
              className="absolute -top-2 left-6 w-4 h-4 rotate-45 border-l border-t border-[var(--border-default)] bg-[var(--bg-secondary)]"
            />
          )}
          <TourCard
            step={step}
            total={STEPS.length}
            progress={progress}
            title={s.title}
            description={s.description}
            isFirst={step === 0}
            isLast={isLast}
            onBack={back}
            onNext={next}
            onSkip={finish}
          />
          {arrowDir === 'down' && (
            <div
              className="absolute -bottom-2 left-6 w-4 h-4 rotate-45 border-r border-b border-[var(--border-default)] bg-[var(--bg-secondary)]"
            />
          )}
        </div>
      )}
    </>
  );
}

interface TourCardProps {
  step: number;
  total: number;
  progress: number;
  title: string;
  description: string;
  isFirst: boolean;
  isLast: boolean;
  onBack: () => void;
  onNext: () => void;
  onSkip: () => void;
}

function TourCard({ step, total, progress, title, description, isFirst, isLast, onBack, onNext, onSkip }: TourCardProps) {
  return (
    <div
      className="pointer-events-auto w-full bg-[var(--bg-secondary)] border border-[var(--brand-primary)]/30 rounded-2xl shadow-2xl overflow-hidden"
      onClick={e => e.stopPropagation()}
    >
      {/* Progress bar */}
      <div className="h-1 bg-[var(--bg-tertiary)]">
        <div
          className="h-full bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-secondary)] transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="p-5">
        {/* Header row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[var(--brand-primary)]" />
            <span className="text-xs font-semibold text-[var(--brand-primary)]">
              {step + 1} of {total}
            </span>
          </div>
          <button
            onClick={onSkip}
            className="text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition"
          >
            Skip tour
          </button>
        </div>

        <h3 className="text-base font-bold text-[var(--text-primary)] mb-1.5">{title}</h3>
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-4">{description}</p>

        <div className="flex gap-2">
          {!isFirst && (
            <button
              onClick={onBack}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-[var(--bg-tertiary)] text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back
            </button>
          )}
          <button
            onClick={onNext}
            className="flex-1 px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-secondary)] text-white hover:opacity-90 transition flex items-center justify-center gap-1.5"
          >
            {isLast ? 'Get started' : (
              <>Next <ArrowRight className="w-3.5 h-3.5" /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
