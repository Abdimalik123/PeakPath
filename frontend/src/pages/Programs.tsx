import { useState, useEffect } from 'react';
import { Navigation } from '../components/Navigation';
import { PageHeader } from '../components/PageHeader';
import { Dumbbell, Users, Calendar, TrendingUp, Loader } from 'lucide-react';
import client from '../api/client';
import { useNavigate } from 'react-router-dom';

interface Program {
  id: number;
  name: string;
  description: string;
  difficulty: string;
  duration_weeks: number;
  workouts_per_week: number;
  category: string;
  is_enrolled?: boolean;
}

export default function Programs() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  useEffect(() => {
    loadPrograms();
  }, []);
  
  const loadPrograms = async () => {
    try {
      const response = await client.get('/programs');
      if (response.data.success) {
        setPrograms(response.data.programs || []);
      }
    } catch (error) {
      console.error('Failed to load programs:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'beginner': return 'bg-green-500/10 text-green-500';
      case 'intermediate': return 'bg-yellow-500/10 text-yellow-500';
      case 'advanced': return 'bg-red-500/10 text-red-500';
      default: return 'bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]';
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <Loader className="w-8 h-8 text-[var(--brand-primary)] animate-spin" />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <Navigation currentPage="/programs" />
      <div className="lg:ml-64 min-h-screen">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <PageHeader
            title="Workout Programs"
            subtitle="Structured training programs designed to help you reach your goals"
          />
          
          {programs.length === 0 ? (
            <div className="bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-lg p-12 text-center">
              <Dumbbell className="w-16 h-16 text-[var(--text-muted)] mx-auto mb-4 opacity-50" />
              <p className="text-[var(--text-muted)]">No programs available yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {programs.map((program) => (
                <div
                  key={program.id}
                  onClick={() => navigate(`/programs/${program.id}`)}
                  className="bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-lg p-6 cursor-pointer hover:border-[var(--brand-primary)] transition group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-secondary)] rounded-lg flex items-center justify-center">
                      <Dumbbell className="w-6 h-6 text-white" />
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${getDifficultyColor(program.difficulty)}`}>
                      {program.difficulty}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2 group-hover:text-[var(--brand-primary)] transition">
                    {program.name}
                  </h3>
                  <p className="text-sm text-[var(--text-muted)] mb-4 line-clamp-2">
                    {program.description}
                  </p>
                  
                  <div className="flex items-center gap-4 text-xs text-[var(--text-muted)]">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {program.duration_weeks} weeks
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-4 h-4" />
                      {program.workouts_per_week}x/week
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-[var(--border-subtle)]">
                    <span className="text-xs px-2 py-1 bg-[var(--bg-tertiary)] text-[var(--text-secondary)] rounded-full">
                      {program.category}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
