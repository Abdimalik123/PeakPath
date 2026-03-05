import { useEffect, useState } from 'react';
import { TrendingUp, Dumbbell, Activity } from 'lucide-react';
import client from '../api/client';

interface ProgressionData {
  date: string;
  sets: number;
  reps: number;
  weight: number | null;
  volume: number | null;
  duration: number | null;
}

interface Stats {
  total_sessions: number;
  max_weight: number | null;
  avg_weight: number | null;
  max_reps: number | null;
  avg_reps: number | null;
  max_volume: number | null;
  avg_volume: number | null;
}

interface ExerciseProgressionChartProps {
  exerciseId: number;
  exerciseName?: string;
}

export function ExerciseProgressionChart({ exerciseId, exerciseName }: ExerciseProgressionChartProps) {
  const [progression, setProgression] = useState<ProgressionData[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState(exerciseName || '');

  useEffect(() => {
    loadProgression();
  }, [exerciseId]);

  const loadProgression = async () => {
    try {
      setLoading(true);
      const response = await client.get(`/analytics/exercise-progression/${exerciseId}`);
      if (response.data.success) {
        setProgression(response.data.progression || []);
        setStats(response.data.stats || null);
        setName(response.data.exercise_name || exerciseName || 'Exercise');
      }
    } catch (error) {
      console.error('Failed to load exercise progression:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="w-8 h-8 border-4 border-[var(--brand-primary)] border-t-transparent rounded-full animate-spin mx-auto"></div>
      </div>
    );
  }

  if (progression.length === 0) {
    return (
      <div className="p-8 text-center">
        <Dumbbell className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-3" />
        <p className="text-[var(--text-muted)]">No progression data yet for {name}</p>
      </div>
    );
  }

  const maxWeight = Math.max(...progression.map(p => p.weight || 0));
  const maxReps = Math.max(...progression.map(p => p.reps || 0));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-xl font-bold text-[var(--text-primary)] mb-1">{name}</h3>
        <p className="text-sm text-[var(--text-muted)]">Progression over {stats?.total_sessions || 0} sessions</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-[var(--brand-primary)]" />
              <span className="text-xs text-[var(--text-muted)]">Max Weight</span>
            </div>
            <p className="text-2xl font-bold text-[var(--text-primary)]">
              {stats.max_weight ? `${stats.max_weight.toFixed(1)} kg` : 'N/A'}
            </p>
          </div>

          <div className="bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-green-500" />
              <span className="text-xs text-[var(--text-muted)]">Avg Weight</span>
            </div>
            <p className="text-2xl font-bold text-[var(--text-primary)]">
              {stats.avg_weight ? `${stats.avg_weight.toFixed(1)} kg` : 'N/A'}
            </p>
          </div>

          <div className="bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              <span className="text-xs text-[var(--text-muted)]">Max Reps</span>
            </div>
            <p className="text-2xl font-bold text-[var(--text-primary)]">
              {stats.max_reps || 'N/A'}
            </p>
          </div>

          <div className="bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Dumbbell className="w-4 h-4 text-purple-500" />
              <span className="text-xs text-[var(--text-muted)]">Max Volume</span>
            </div>
            <p className="text-2xl font-bold text-[var(--text-primary)]">
              {stats.max_volume ? `${stats.max_volume.toFixed(0)}` : 'N/A'}
            </p>
          </div>
        </div>
      )}

      {/* Simple Line Chart */}
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-lg p-6">
        <h4 className="text-sm font-bold text-[var(--text-primary)] mb-4">Weight Progression</h4>
        <div className="relative h-64">
          {/* Y-axis labels */}
          <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-xs text-[var(--text-muted)] pr-2">
            <span>{maxWeight.toFixed(0)} kg</span>
            <span>{(maxWeight * 0.75).toFixed(0)} kg</span>
            <span>{(maxWeight * 0.5).toFixed(0)} kg</span>
            <span>{(maxWeight * 0.25).toFixed(0)} kg</span>
            <span>0 kg</span>
          </div>

          {/* Chart area */}
          <div className="absolute left-12 right-0 top-0 bottom-8 border-l border-b border-[var(--border-subtle)]">
            {/* Grid lines */}
            {[0, 25, 50, 75, 100].map((percent) => (
              <div
                key={percent}
                className="absolute left-0 right-0 border-t border-[var(--border-subtle)]"
                style={{ bottom: `${percent}%` }}
              />
            ))}

            {/* Data points and line */}
            <svg className="absolute inset-0 w-full h-full overflow-visible">
              {/* Line path */}
              <path
                d={progression
                  .map((point, index) => {
                    const x = (index / (progression.length - 1)) * 100;
                    const y = 100 - ((point.weight || 0) / maxWeight) * 100;
                    return `${index === 0 ? 'M' : 'L'} ${x}% ${y}%`;
                  })
                  .join(' ')}
                fill="none"
                stroke="var(--brand-primary)"
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
              />

              {/* Data points */}
              {progression.map((point, index) => {
                const x = (index / (progression.length - 1)) * 100;
                const y = 100 - ((point.weight || 0) / maxWeight) * 100;
                return (
                  <g key={index}>
                    <circle
                      cx={`${x}%`}
                      cy={`${y}%`}
                      r="4"
                      fill="var(--brand-primary)"
                      className="hover:r-6 transition-all cursor-pointer"
                    />
                    <title>
                      {new Date(point.date).toLocaleDateString()}: {point.weight} kg × {point.reps} reps
                    </title>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* X-axis labels */}
          <div className="absolute left-12 right-0 bottom-0 flex justify-between text-xs text-[var(--text-muted)]">
            {progression.length > 0 && (
              <>
                <span>{new Date(progression[0].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                {progression.length > 1 && (
                  <span>{new Date(progression[progression.length - 1].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Recent Sessions */}
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-lg p-4">
        <h4 className="text-sm font-bold text-[var(--text-primary)] mb-3">Recent Sessions</h4>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {progression.slice(-10).reverse().map((session, idx) => (
            <div key={idx} className="flex items-center justify-between p-2 bg-[var(--bg-tertiary)] rounded">
              <span className="text-xs text-[var(--text-muted)]">
                {new Date(session.date).toLocaleDateString()}
              </span>
              <div className="flex gap-3 text-xs">
                {session.weight && <span className="font-bold text-[var(--brand-primary)]">{session.weight} kg</span>}
                {session.sets && <span className="text-[var(--text-secondary)]">{session.sets} sets</span>}
                {session.reps && <span className="text-[var(--text-secondary)]">{session.reps} reps</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
