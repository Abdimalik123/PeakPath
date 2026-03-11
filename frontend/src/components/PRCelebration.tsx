import { Trophy, TrendingUp, Zap, Award } from 'lucide-react';
import { useEffect, useState } from 'react';

interface PR {
  exercise_name: string;
  pr_types: string[];
  weight: number;
  reps: number;
  volume: number;
  estimated_1rm: number | null;
}

interface PRCelebrationProps {
  prs: PR[];
  onClose: () => void;
}

export function PRCelebration({ prs, onClose }: PRCelebrationProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (prs.length > 0) {
      setShow(true);
    }
  }, [prs]);

  if (!show || prs.length === 0) return null;

  const getPRTypeLabel = (type: string) => {
    switch (type) {
      case 'max_weight': return 'Max Weight';
      case 'max_reps': return 'Max Reps';
      case 'max_volume': return 'Max Volume';
      case 'one_rep_max': return 'Estimated 1RM';
      default: return type;
    }
  };

  const handleClose = () => {
    setShow(false);
    setTimeout(onClose, 300);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative max-w-lg w-full bg-gradient-to-br from-yellow-500/20 to-orange-600/20 border-2 border-yellow-500/50 rounded-2xl p-4 sm:p-8 shadow-2xl animate-scaleIn">
        {/* Celebration confetti effect */}
        <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-yellow-400 rounded-full animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 0.5}s`,
                animationDuration: `${2 + Math.random()}s`
              }}
            />
          ))}
        </div>

        {/* Content */}
        <div className="relative z-10 text-center">
          <div className="mb-4 sm:mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 sm:w-20 sm:h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full mb-3 sm:mb-4 animate-bounce">
              <Trophy className="w-7 h-7 sm:w-10 sm:h-10 text-white" />
            </div>
            <h2 className="text-xl sm:text-3xl font-bold text-white mb-2">
              🎉 New Personal Record{prs.length > 1 ? 's' : ''}! 🎉
            </h2>
            <p className="text-yellow-200">You crushed it!</p>
          </div>

          <div className="space-y-4 mb-6">
            {prs.map((pr, idx) => (
              <div
                key={idx}
                className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-4"
              >
                <h3 className="text-xl font-bold text-white mb-2 flex items-center justify-center gap-2">
                  <Award className="w-5 h-5 text-yellow-400" />
                  {pr.exercise_name}
                </h3>
                <div className="flex flex-wrap justify-center gap-2">
                  {pr.pr_types.map((type, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-yellow-500/20 border border-yellow-500/50 rounded-full text-yellow-200 text-sm font-bold"
                    >
                      {getPRTypeLabel(type)}
                    </span>
                  ))}
                </div>
                <div className="mt-3 flex justify-center gap-4 text-sm text-white/80">
                  {pr.weight > 0 && (
                    <span className="flex items-center gap-1">
                      <TrendingUp className="w-4 h-4" />
                      {pr.weight} kg
                    </span>
                  )}
                  {pr.reps > 0 && (
                    <span className="flex items-center gap-1">
                      <Zap className="w-4 h-4" />
                      {pr.reps} reps
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleClose}
            className="w-full px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold rounded-lg transition-all transform hover:scale-105"
          >
            Awesome!
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes confetti {
          0% { transform: translateY(-100%) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        .animate-scaleIn {
          animation: scaleIn 0.4s ease-out;
        }
        .animate-confetti {
          animation: confetti linear infinite;
        }
      `}</style>
    </div>
  );
}
