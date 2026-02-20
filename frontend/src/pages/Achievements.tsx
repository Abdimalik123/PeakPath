import { useState, useEffect } from 'react';
import { Navigation } from '../components/Navigation';
import { Award, Trophy, Star, Zap, Target, Calendar, Dumbbell, Flame, Lock, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlocked: boolean;
  unlockedAt?: string;
  progress: number;
  target: number;
  category: 'workouts' | 'habits' | 'goals' | 'streaks' | 'social' | 'special';
  points: number;
}

export default function Achievements() {
  const navigate = useNavigate();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showUnlockModal, setShowUnlockModal] = useState<Achievement | null>(null);

  // Mock achievements data - Replace with API call later
  const allAchievements: Achievement[] = [
    // WORKOUTS
    { id: 'w1', name: 'First Step', description: 'Complete your first workout', icon: 'dumbbell', rarity: 'common', unlocked: true, unlockedAt: '2025-01-15', progress: 1, target: 1, category: 'workouts', points: 10 },
    { id: 'w2', name: 'Getting Started', description: 'Complete 10 workouts', icon: 'dumbbell', rarity: 'common', unlocked: true, unlockedAt: '2025-01-20', progress: 10, target: 10, category: 'workouts', points: 10 },
    { id: 'w3', name: 'Dedicated', description: 'Complete 50 workouts', icon: 'dumbbell', rarity: 'rare', unlocked: false, progress: 23, target: 50, category: 'workouts', points: 25 },
    { id: 'w4', name: 'Century Club', description: 'Complete 100 workouts', icon: 'trophy', rarity: 'epic', unlocked: false, progress: 23, target: 100, category: 'workouts', points: 50 },
    { id: 'w5', name: 'Legend', description: 'Complete 500 workouts', icon: 'star', rarity: 'legendary', unlocked: false, progress: 23, target: 500, category: 'workouts', points: 100 },
    { id: 'w6', name: 'Early Bird', description: 'Complete 20 morning workouts (before 9 AM)', icon: 'dumbbell', rarity: 'rare', unlocked: false, progress: 5, target: 20, category: 'workouts', points: 25 },
    { id: 'w7', name: 'Night Owl', description: 'Complete 20 evening workouts (after 8 PM)', icon: 'dumbbell', rarity: 'rare', unlocked: false, progress: 8, target: 20, category: 'workouts', points: 25 },
    { id: 'w8', name: 'Variety Seeker', description: 'Try 10 different workout types', icon: 'star', rarity: 'rare', unlocked: false, progress: 4, target: 10, category: 'workouts', points: 25 },
    
    // HABITS
    { id: 'h1', name: 'Habit Starter', description: 'Create your first habit', icon: 'calendar', rarity: 'common', unlocked: true, unlockedAt: '2025-01-10', progress: 1, target: 1, category: 'habits', points: 10 },
    { id: 'h2', name: 'Habit Builder', description: 'Create 5 habits', icon: 'calendar', rarity: 'common', unlocked: false, progress: 3, target: 5, category: 'habits', points: 10 },
    { id: 'h3', name: 'Habit Master', description: 'Create 10 habits', icon: 'star', rarity: 'epic', unlocked: false, progress: 3, target: 10, category: 'habits', points: 50 },
    { id: 'h4', name: 'Daily Grind', description: 'Log 50 habits', icon: 'calendar', rarity: 'rare', unlocked: false, progress: 18, target: 50, category: 'habits', points: 25 },
    { id: 'h5', name: 'Consistency King', description: '90% habit completion rate (30 days)', icon: 'trophy', rarity: 'legendary', unlocked: false, progress: 75, target: 90, category: 'habits', points: 100 },
    
    // STREAKS
    { id: 's1', name: 'Week Warrior', description: 'Maintain a 7-day habit streak', icon: 'flame', rarity: 'rare', unlocked: true, unlockedAt: '2025-01-22', progress: 7, target: 7, category: 'streaks', points: 25 },
    { id: 's2', name: 'Month Master', description: 'Maintain a 30-day habit streak', icon: 'flame', rarity: 'epic', unlocked: false, progress: 12, target: 30, category: 'streaks', points: 50 },
    { id: 's3', name: 'Iron Will', description: 'Maintain a 60-day habit streak', icon: 'flame', rarity: 'legendary', unlocked: false, progress: 12, target: 60, category: 'streaks', points: 100 },
    { id: 's4', name: 'Unbreakable', description: 'Maintain a 100-day habit streak', icon: 'zap', rarity: 'legendary', unlocked: false, progress: 12, target: 100, category: 'streaks', points: 100 },
    { id: 's5', name: 'On Fire', description: '7-day workout streak', icon: 'flame', rarity: 'rare', unlocked: false, progress: 3, target: 7, category: 'streaks', points: 25 },
    { id: 's6', name: 'Blazing', description: '14-day workout streak', icon: 'flame', rarity: 'epic', unlocked: false, progress: 3, target: 14, category: 'streaks', points: 50 },
    { id: 's7', name: 'Inferno', description: '30-day workout streak', icon: 'zap', rarity: 'legendary', unlocked: false, progress: 3, target: 30, category: 'streaks', points: 100 },
    
    // GOALS
    { id: 'g1', name: 'Dreamer', description: 'Set your first goal', icon: 'target', rarity: 'common', unlocked: true, unlockedAt: '2025-01-08', progress: 1, target: 1, category: 'goals', points: 10 },
    { id: 'g2', name: 'Achiever', description: 'Complete 1 goal', icon: 'target', rarity: 'common', unlocked: false, progress: 0, target: 1, category: 'goals', points: 10 },
    { id: 'g3', name: 'Goal Crusher', description: 'Complete 5 goals', icon: 'trophy', rarity: 'rare', unlocked: false, progress: 0, target: 5, category: 'goals', points: 25 },
    { id: 'g4', name: 'Overachiever', description: 'Complete 10 goals', icon: 'star', rarity: 'epic', unlocked: false, progress: 0, target: 10, category: 'goals', points: 50 },
    { id: 'g5', name: 'Unstoppable', description: 'Complete 20 goals', icon: 'zap', rarity: 'legendary', unlocked: false, progress: 0, target: 20, category: 'goals', points: 100 },
    { id: 'g6', name: 'Speed Demon', description: 'Complete a goal 30 days early', icon: 'zap', rarity: 'epic', unlocked: false, progress: 0, target: 1, category: 'goals', points: 50 },
    
    // SPECIAL
    { id: 'sp1', name: 'Welcome', description: 'Complete onboarding', icon: 'star', rarity: 'common', unlocked: true, unlockedAt: '2025-01-05', progress: 1, target: 1, category: 'special', points: 10 },
    { id: 'sp2', name: 'Perfect Week', description: 'Workout every day for a week', icon: 'trophy', rarity: 'epic', unlocked: false, progress: 3, target: 7, category: 'special', points: 50 },
    { id: 'sp3', name: 'Weekend Warrior', description: 'Workout 10 Saturdays in a row', icon: 'dumbbell', rarity: 'rare', unlocked: false, progress: 2, target: 10, category: 'special', points: 25 },
    { id: 'sp4', name: 'Transformer', description: 'Upload before and after photos', icon: 'star', rarity: 'epic', unlocked: false, progress: 0, target: 1, category: 'special', points: 50 },
    { id: 'sp5', name: 'New Year New Me', description: 'Start your journey in January', icon: 'star', rarity: 'rare', unlocked: false, progress: 0, target: 1, category: 'special', points: 25 },
  ];

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    loadAchievements();
  }, [navigate]);

  const loadAchievements = async () => {
    try {
      // TODO: Replace with actual API call
      // const response = await fetchAchievements();
      // setAchievements(response.data);
      
      // For now, use mock data
      setAchievements(allAchievements);
    } catch (error: any) {
      if (error?.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const getIconComponent = (iconName: string) => {
    const icons: { [key: string]: any } = {
      dumbbell: Dumbbell,
      trophy: Trophy,
      star: Star,
      zap: Zap,
      target: Target,
      calendar: Calendar,
      flame: Flame,
    };
    return icons[iconName] || Award;
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'from-gray-500 to-gray-700';
      case 'rare': return 'from-blue-500 to-blue-700';
      case 'epic': return 'from-purple-500 to-purple-700';
      case 'legendary': return 'from-yellow-500 to-orange-600';
      default: return 'from-gray-500 to-gray-700';
    }
  };

  const getRarityBorder = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'border-gray-500/50';
      case 'rare': return 'border-blue-500/50';
      case 'epic': return 'border-purple-500/50';
      case 'legendary': return 'border-yellow-500/50 shadow-yellow-500/20 shadow-lg';
      default: return 'border-gray-500/50';
    }
  };

  const getRarityText = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'text-gray-400';
      case 'rare': return 'text-blue-400';
      case 'epic': return 'text-purple-400';
      case 'legendary': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  const categories = [
    { id: 'all', name: 'All', icon: Award },
    { id: 'workouts', name: 'Workouts', icon: Dumbbell },
    { id: 'habits', name: 'Habits', icon: Calendar },
    { id: 'goals', name: 'Goals', icon: Target },
    { id: 'streaks', name: 'Streaks', icon: Flame },
    { id: 'special', name: 'Special', icon: Star },
  ];

  const filteredAchievements = selectedCategory === 'all'
    ? achievements
    : achievements.filter(a => a.category === selectedCategory);

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalCount = achievements.length;
  const completionPercentage = Math.round((unlockedCount / totalCount) * 100);
  const totalPoints = achievements.filter(a => a.unlocked).reduce((sum, a) => sum + a.points, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[var(--brand-primary)] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <Navigation currentPage="/achievements" />
      <div className="lg:ml-64 min-h-screen">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
              <Trophy className="w-10 h-10 text-yellow-400" />
              Achievements
            </h1>
            <p className="text-gray-400">Track your progress and unlock rewards</p>
          </div>

          {/* Stats Card */}
          <div className="bg-gradient-to-r from-emerald-900/30 to-blue-900/30 backdrop-blur-sm border border-emerald-500/30 rounded-2xl p-6 mb-8">
            <div className="grid md:grid-cols-3 gap-6 mb-4">
              <div>
                <p className="text-gray-400 text-sm mb-1">Unlocked</p>
                <p className="text-3xl font-bold text-white">{unlockedCount} / {totalCount}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-1">Completion</p>
                <p className="text-3xl font-bold text-emerald-400">{completionPercentage}%</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-1">Total Points</p>
                <p className="text-3xl font-bold text-yellow-400">{totalPoints}</p>
              </div>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-emerald-500 to-blue-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${completionPercentage}%` }}
              ></div>
            </div>
          </div>

          {/* Category Filter */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {categories.map((category) => {
              const Icon = category.icon;
              const count = category.id === 'all' 
                ? achievements.length 
                : achievements.filter(a => a.category === category.id).length;
              const unlockedInCategory = category.id === 'all'
                ? unlockedCount
                : achievements.filter(a => a.category === category.id && a.unlocked).length;
              
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition whitespace-nowrap ${
                    selectedCategory === category.id
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-800/50 text-gray-400 hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{category.name}</span>
                  <span className="text-xs opacity-75">({unlockedInCategory}/{count})</span>
                </button>
              );
            })}
          </div>

          {/* Achievements Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAchievements.map((achievement) => {
              const Icon = getIconComponent(achievement.icon);
              const progressPercentage = Math.round((achievement.progress / achievement.target) * 100);
              
              return (
                <div
                  key={achievement.id}
                  className={`bg-slate-900/50 backdrop-blur-sm border-2 rounded-xl p-6 transition ${
                    achievement.unlocked
                      ? `${getRarityBorder(achievement.rarity)} hover:scale-105`
                      : 'border-slate-800 opacity-60'
                  }`}
                >
                  {/* Icon and Rarity */}
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${getRarityColor(achievement.rarity)} flex items-center justify-center ${achievement.unlocked ? '' : 'opacity-40'}`}>
                      {achievement.unlocked ? (
                        <Icon className="w-8 h-8 text-white" />
                      ) : (
                        <Lock className="w-8 h-8 text-white" />
                      )}
                    </div>
                    <div className="text-right">
                      <p className={`text-xs font-bold uppercase ${getRarityText(achievement.rarity)}`}>
                        {achievement.rarity}
                      </p>
                      <p className="text-xs text-gray-500">{achievement.points} pts</p>
                    </div>
                  </div>

                  {/* Title and Description */}
                  <h3 className="text-lg font-bold text-white mb-2">{achievement.name}</h3>
                  <p className="text-sm text-gray-400 mb-4">{achievement.description}</p>

                  {/* Progress */}
                  {achievement.unlocked ? (
                    <div className="flex items-center gap-2 text-emerald-400">
                      <Check className="w-5 h-5" />
                      <span className="text-sm font-semibold">Unlocked</span>
                      {achievement.unlockedAt && (
                        <span className="text-xs text-gray-500 ml-auto">
                          {new Date(achievement.unlockedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-400">Progress</span>
                        <span className="text-emerald-400 font-semibold">
                          {achievement.progress} / {achievement.target}
                        </span>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-2">
                        <div
                          className={`bg-gradient-to-r ${getRarityColor(achievement.rarity)} h-2 rounded-full transition-all`}
                          style={{ width: `${progressPercentage}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Empty State */}
          {filteredAchievements.length === 0 && (
            <div className="text-center py-12">
              <Award className="w-16 h-16 text-[var(--text-muted)] mx-auto mb-4" />
              <p className="text-[var(--text-muted)]">No achievements in this category yet</p>
            </div>
          )}
        </main>
      </div>

      {/* Unlock Modal */}
      {showUnlockModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-[var(--bg-secondary)] border-2 border-[var(--warning)] rounded-[var(--radius-lg)] p-8 max-w-md w-full text-center">
            <div className="mb-6">
              <div className="w-24 h-24 mx-auto bg-gradient-to-br from-[var(--warning)] to-orange-600 rounded-full flex items-center justify-center">
                <Trophy className="w-12 h-12 text-white" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-2">Achievement Unlocked!</h2>
            <h3 className="text-xl font-bold text-[var(--warning)] mb-4">{showUnlockModal.name}</h3>
            <p className="text-[var(--text-secondary)] mb-6">{showUnlockModal.description}</p>
            <div className="flex items-center justify-center gap-2 mb-6">
              <Star className="w-5 h-5 text-[var(--warning)]" />
              <span className="text-2xl font-bold text-[var(--warning)]">+{showUnlockModal.points} points</span>
            </div>
            <button
              onClick={() => setShowUnlockModal(null)}
              className="px-6 py-3 pp-btn-primary"
            >
              Awesome!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}