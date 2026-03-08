import { useState, useEffect } from 'react';
import { Navigation } from '../components/Navigation';
import { PageHeader } from '../components/PageHeader';
import { Trophy, Users, Target, Calendar, Plus, X, Loader } from 'lucide-react';
import client from '../api/client';
import { useToast } from '../contexts/ToastContext';

interface Challenge {
  id: number;
  title: string;
  description: string;
  challenge_type: string;
  target_value: number;
  start_date: string;
  end_date: string;
  participant_count: number;
  is_public: boolean;
  status: string;
}

export default function Challenges({ embedded }: { embedded?: boolean }) {
  const [myChallenges, setMyChallenges] = useState<Challenge[]>([]);
  const [publicChallenges, setPublicChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    loadChallenges();
  }, []);

  const loadChallenges = async () => {
    try {
      const response = await client.get('/challenges');
      if (response.data.success) {
        setMyChallenges(response.data.my_challenges || []);
        setPublicChallenges(response.data.public_challenges || []);
      }
    } catch (error) {
      console.error('Failed to load challenges:', error);
    } finally {
      setLoading(false);
    }
  };

  const joinChallenge = async (challengeId: number) => {
    try {
      const response = await client.post(`/challenges/${challengeId}/join`);
      if (response.data.success) {
        showToast('Joined challenge successfully!', 'success');
        loadChallenges();
      }
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to join challenge', 'error');
    }
  };

  if (loading) {
    return (
      <div className={embedded ? "py-12 text-center" : "min-h-screen bg-[var(--bg-primary)] flex items-center justify-center"}>
        <Loader className="w-8 h-8 text-[var(--brand-primary)] animate-spin mx-auto" />
      </div>
    );
  }

  const content = (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)]">Challenges</h2>
          <p className="text-sm text-[var(--text-muted)]">Compete with friends and push your limits</p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="pp-btn-primary flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" /> Create
        </button>
      </div>

      {/* My Challenges */}
      <section className="mb-8">
        <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">My Challenges</h2>
        {myChallenges.length === 0 ? (
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-lg p-12 text-center">
            <Trophy className="w-16 h-16 text-[var(--text-muted)] mx-auto mb-4 opacity-50" />
            <p className="text-[var(--text-muted)] mb-4">You haven't joined any challenges yet</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-2 bg-[var(--brand-primary)] text-white font-bold rounded-lg hover:opacity-90 transition"
            >
              Create Your First Challenge
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myChallenges.map((challenge) => (
              <ChallengeCard key={challenge.id} challenge={challenge} onJoin={joinChallenge} />
            ))}
          </div>
        )}
      </section>

      {/* Public Challenges */}
      <section>
        <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">Join a Challenge</h2>
        {publicChallenges.length === 0 ? (
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-lg p-8 text-center">
            <p className="text-[var(--text-muted)]">No public challenges available</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {publicChallenges.map((challenge) => (
              <ChallengeCard key={challenge.id} challenge={challenge} isPublic onJoin={joinChallenge} />
            ))}
          </div>
        )}
      </section>

      {/* Create Challenge Modal */}
      {showCreateModal && (
        <CreateChallengeModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadChallenges();
          }}
        />
      )}
    </>
  );

  if (embedded) return content;

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <Navigation currentPage="/community" />
      <div className="lg:ml-64 min-h-screen pt-14 lg:pt-16 pb-20 lg:pb-0">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {content}
        </main>
      </div>
    </div>
  );
}

function ChallengeCard({ challenge, isPublic = false, onJoin }: { challenge: Challenge; isPublic?: boolean; onJoin: (id: number) => void }) {
  const getChallengeTypeLabel = (type: string) => {
    switch (type) {
      case 'workout_count': return 'Workout Count';
      case 'total_volume': return 'Total Volume';
      case 'specific_exercise': return 'Exercise PR';
      case 'streak': return 'Streak';
      default: return type;
    }
  };

  const daysRemaining = Math.ceil((new Date(challenge.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-lg p-6 hover:border-[var(--brand-primary)] transition">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          <h3 className="font-bold text-[var(--text-primary)]">{challenge.title}</h3>
        </div>
        <span className="text-xs px-2 py-1 bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] rounded-full">
          {getChallengeTypeLabel(challenge.challenge_type)}
        </span>
      </div>
      <p className="text-sm text-[var(--text-muted)] mb-4 line-clamp-2">{challenge.description}</p>
      
      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-[var(--text-muted)]">Target:</span>
          <span className="font-bold text-[var(--text-primary)]">{challenge.target_value}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-[var(--text-muted)]">Time left:</span>
          <span className="font-bold text-[var(--text-primary)]">{daysRemaining} days</span>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-1 text-[var(--text-muted)]">
          <Users className="w-4 h-4" />
          {challenge.participant_count} participants
        </div>
        <button
          onClick={() => isPublic && onJoin(challenge.id)}
          className="px-4 py-2 bg-[var(--brand-primary)] text-white text-xs font-bold rounded-lg hover:opacity-90 transition"
        >
          {isPublic ? 'Join' : 'View'}
        </button>
      </div>
    </div>
  );
}

function CreateChallengeModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    challenge_type: 'workout_count',
    title: '',
    description: '',
    target_value: '',
    duration_days: '7',
    is_public: false
  });
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.target_value) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    try {
      setLoading(true);
      const response = await client.post('/challenges', {
        ...formData,
        target_value: parseFloat(formData.target_value),
        duration_days: parseInt(formData.duration_days)
      });

      if (response.data.success) {
        showToast('Challenge created successfully!', 'success');
        onSuccess();
      }
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to create challenge', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-[var(--border-subtle)] flex items-center justify-between">
          <h2 className="text-xl font-bold text-[var(--text-primary)]">Create Challenge</h2>
          <button onClick={onClose} className="p-2 hover:bg-[var(--bg-tertiary)] rounded-lg transition">
            <X className="w-5 h-5 text-[var(--text-muted)]" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-bold text-[var(--text-primary)] mb-2">Challenge Type</label>
            <select
              value={formData.challenge_type}
              onChange={(e) => setFormData({ ...formData, challenge_type: e.target.value })}
              className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-lg px-4 py-2 text-[var(--text-primary)]"
            >
              <option value="workout_count">Workout Count</option>
              <option value="total_volume">Total Volume Lifted</option>
              <option value="specific_exercise">Exercise PR</option>
              <option value="streak">Workout Streak</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-[var(--text-primary)] mb-2">Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-lg px-4 py-2 text-[var(--text-primary)]"
              placeholder="e.g., 30-Day Workout Challenge"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-[var(--text-primary)] mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-lg px-4 py-2 text-[var(--text-primary)] resize-none"
              rows={3}
              placeholder="Describe your challenge..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-[var(--text-primary)] mb-2">Target Value *</label>
              <input
                type="number"
                value={formData.target_value}
                onChange={(e) => setFormData({ ...formData, target_value: e.target.value })}
                className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-lg px-4 py-2 text-[var(--text-primary)]"
                placeholder="e.g., 30"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-[var(--text-primary)] mb-2">Duration (days)</label>
              <input
                type="number"
                value={formData.duration_days}
                onChange={(e) => setFormData({ ...formData, duration_days: e.target.value })}
                className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-lg px-4 py-2 text-[var(--text-primary)]"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_public"
              checked={formData.is_public}
              onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
              className="w-4 h-4"
            />
            <label htmlFor="is_public" className="text-sm text-[var(--text-primary)]">
              Make this challenge public
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-[var(--bg-tertiary)] text-[var(--text-primary)] font-bold rounded-lg hover:bg-[var(--bg-tertiary)]/80 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-[var(--brand-primary)] text-white font-bold rounded-lg hover:opacity-90 transition disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Challenge'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
