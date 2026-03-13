import { useState, useEffect } from 'react';
import { Navigation } from '../components/Navigation';
import { Award, Trophy, Star, Zap, Target, Calendar, Dumbbell, Flame, Lock, Check } from 'lucide-react';
import client from '../api/client';

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
  category: 'workouts' | 'habits' | 'goals' | 'streaks' | 'special';
  points: number;
}

// Curated core achievements - the 20 that matter most for clear progression paths
const CORE_ACHIEVEMENT_KEYS = new Set([
  // Workout progression (4): clear milestones
  'first_workout', 'workouts_10', 'workouts_50', 'workouts_100',
  // Habit progression (3): creation and consistency
  'first_habit_log', 'habits_logged_50', 'habit_consistency_90',
  // Streak progression (4): escalating commitment
  'streak_workout_7', 'streak_workout_14', 'streak_workout_30', 'streak_habit_7',
  // Goal progression (3): achievement ladder
  'first_goal', 'first_goal_completed', 'goals_completed_5',
  // Level/Points milestones (3): overall progress
  'level_5', 'level_10', 'points_1000',
  // Special (3): memorable moments
  'welcome', 'perfect_week', 'transformer',
]);

const RARITY_POINTS: Record<string, number> = {
  common: 10, rare: 25, epic: 50, legendary: 100,
};

export default function Achievements({ embedded }: { embedded?: boolean }) {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    loadAchievements();
  }, []);

  const loadAchievements = async () => {
    try {
      const response = await client.get('/gamification/achievements');
      if (response.data.success) {
        const mapped = response.data.achievements
          .filter((ach: any) => CORE_ACHIEVEMENT_KEYS.has(ach.key))
          .map((ach: any) => {
            const rarity = getRarityForAchievement(ach.key);
            return {
              id: ach.key,
              name: ach.name,
              description: ach.description,
              icon: getIconForType(ach.type),
              rarity,
              unlocked: ach.earned,
              unlockedAt: ach.earned_at,
              progress: ach.progress || 0,
              target: ach.target || 1,
              category: mapTypeToCategory(ach.type),
              points: RARITY_POINTS[rarity] || 10,
            };
          });
        setAchievements(mapped);
      }
    } catch (error: any) {
      console.error('Failed to load achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  const getIconForType = (type: string): string => {
    const map: Record<string, string> = {
      workout: 'dumbbell', habit: 'calendar', goal: 'target',
      streak: 'flame', special: 'star', level: 'zap', points: 'trophy',
    };
    return map[type] || 'star';
  };

  const mapTypeToCategory = (type: string): Achievement['category'] => {
    const map: Record<string, Achievement['category']> = {
      workout: 'workouts', habit: 'habits', goal: 'goals',
      streak: 'streaks', special: 'special', level: 'special', points: 'special',
    };
    return map[type] || 'special';
  };

  const getRarityForAchievement = (key: string): Achievement['rarity'] => {
    const map: Record<string, Achievement['rarity']> = {
      first_workout: 'common', workouts_10: 'common', workouts_50: 'rare', workouts_100: 'epic',
      first_habit_log: 'common', habits_logged_50: 'rare', habit_consistency_90: 'legendary',
      streak_workout_7: 'rare', streak_workout_14: 'epic', streak_workout_30: 'legendary', streak_habit_7: 'rare',
      first_goal: 'common', first_goal_completed: 'common', goals_completed_5: 'rare',
      level_5: 'common', level_10: 'rare', points_1000: 'rare',
      welcome: 'common', perfect_week: 'epic', transformer: 'epic',
    };
    return map[key] || 'common';
  };

  const getIconComponent = (iconName: string) => {
    const icons: Record<string, any> = {
      dumbbell: Dumbbell, trophy: Trophy, star: Star, zap: Zap,
      target: Target, calendar: Calendar, flame: Flame,
    };
    return icons[iconName] || Award;
  };

  const getRarityColor = (rarity: string) => {
    const map: Record<string, string> = {
      common: 'from-gray-500 to-gray-700', rare: 'from-blue-500 to-blue-700',
      epic: 'from-purple-500 to-purple-700', legendary: 'from-yellow-500 to-orange-600',
    };
    return map[rarity] || 'from-gray-500 to-gray-700';
  };

  const getRarityBorder = (rarity: string) => {
    const map: Record<string, string> = {
      common: 'border-gray-500/50', rare: 'border-blue-500/50',
      epic: 'border-purple-500/50', legendary: 'border-yellow-500/50 shadow-yellow-500/20 shadow-lg',
    };
    return map[rarity] || 'border-gray-500/50';
  };

  const getRarityText = (rarity: string) => {
    const map: Record<string, string> = {
      common: 'text-[var(--text-muted)]', rare: 'text-blue-600',
      epic: 'text-purple-600', legendary: 'text-yellow-600',
    };
    return map[rarity] || 'text-[var(--text-muted)]';
  };

  const categories = [
    { id: 'all', name: 'All', icon: Award },
    { id: 'workouts', name: 'Workouts', icon: Dumbbell },
    { id: 'habits', name: 'Habits', icon: Calendar },
    { id: 'goals', name: 'Goals', icon: Target },
    { id: 'streaks', name: 'Streaks', icon: Flame },
    { id: 'special', name: 'Milestones', icon: Star },
  ];

  const filteredAchievements = selectedCategory === 'all'
    ? achievements
    : achievements.filter(a => a.category === selectedCategory);

  // Sort: unlocked first (by date), then locked (by progress %)
  const sortedAchievements = [...filteredAchievements].sort((a, b) => {
    if (a.unlocked && !b.unlocked) return -1;
    if (!a.unlocked && b.unlocked) return 1;
    if (a.unlocked && b.unlocked) {
      return new Date(b.unlockedAt || 0).getTime() - new Date(a.unlockedAt || 0).getTime();
    }
    return (b.progress / b.target) - (a.progress / a.target);
  });

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalCount = achievements.length;
  const completionPercentage = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;
  const totalPoints = achievements.filter(a => a.unlocked).reduce((sum, a) => sum + a.points, 0);

  // Next achievement to unlock (closest to completion)
  const nextAchievement = achievements
    .filter(a => !a.unlocked)
    .sort((a, b) => (b.progress / b.target) - (a.progress / a.target))[0];

  if (loading) {
    return (
      <div className={`${embedded ? 'py-12' : 'min-h-screen bg-[var(--bg-primary)]'} flex items-center justify-center`}>
        <div className="w-12 h-12 border-4 border-[var(--brand-primary)] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const mainContent = (
    <>
      {!embedded && (
        <div className="mb-8">
          <h1 className="text-2xl sm:text-4xl font-bold text-[var(--text-primary)] mb-2 flex items-center gap-3">
            <Trophy className="w-7 h-7 sm:w-10 sm:h-10 text-yellow-400" />
            Achievements
          </h1>
          <p className="text-[var(--text-muted)]">Track your progress and unlock rewards</p>
        </div>
      )}

          {/* Stats Card */}
          <div className="pp-card p-4 sm:p-6 mb-6 sm:mb-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 mb-3 sm:mb-4">
              <div>
                <p className="text-[var(--text-muted)] text-sm mb-1">Unlocked</p>
                <p className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">{unlockedCount} / {totalCount}</p>
              </div>
              <div>
                <p className="text-[var(--text-muted)] text-sm mb-1">Completion</p>
                <p className="text-2xl sm:text-3xl font-bold text-[var(--brand-primary)]">{completionPercentage}%</p>
              </div>
              <div>
                <p className="text-[var(--text-muted)] text-sm mb-1">Points Earned</p>
                <p className="text-2xl sm:text-3xl font-bold text-[var(--brand-secondary)]">{totalPoints}</p>
              </div>
              <div>
                <p className="text-[var(--text-muted)] text-sm mb-1">Next Up</p>
                <p className="text-base sm:text-lg font-bold text-[var(--brand-primary)]">{nextAchievement?.name || 'All done!'}</p>
                {nextAchievement && (
                  <p className="text-xs text-[var(--text-muted)]">{nextAchievement.progress}/{nextAchievement.target}</p>
                )}
              </div>
            </div>
            <div className="w-full bg-[var(--bg-tertiary)] rounded-full h-3">
              <div
                className="bg-[var(--brand-primary)] h-3 rounded-full transition-all duration-500"
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
                      ? 'bg-[var(--brand-primary)] text-[var(--text-inverse)]'
                      : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)]'
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
            {sortedAchievements.map((achievement) => {
              const Icon = getIconComponent(achievement.icon);
              const progressPercentage = Math.round((achievement.progress / achievement.target) * 100);

              return (
                <div
                  key={achievement.id}
                  className={`bg-[var(--bg-secondary)] border-2 rounded-xl p-6 transition ${
                    achievement.unlocked
                      ? `${getRarityBorder(achievement.rarity)} hover:scale-105`
                      : 'border-[var(--border-default)] opacity-60'
                  }`}
                >
                  {/* Icon and Rarity */}
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${getRarityColor(achievement.rarity)} flex items-center justify-center ${achievement.unlocked ? '' : 'opacity-40'}`}>
                      {achievement.unlocked ? (
                        <Icon className="w-8 h-8 text-[var(--text-primary)]" />
                      ) : (
                        <Lock className="w-8 h-8 text-[var(--text-primary)]" />
                      )}
                    </div>
                    <div className="text-right">
                      <p className={`text-xs font-bold uppercase ${getRarityText(achievement.rarity)}`}>
                        {achievement.rarity}
                      </p>
                      <p className="text-xs text-[var(--text-muted)]">{achievement.points} pts</p>
                    </div>
                  </div>

                  {/* Title and Description */}
                  <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">{achievement.name}</h3>
                  <p className="text-sm text-[var(--text-muted)] mb-4">{achievement.description}</p>

                  {/* Progress */}
                  {achievement.unlocked ? (
                    <div className="flex items-center gap-2 text-[var(--success)]">
                      <Check className="w-5 h-5" />
                      <span className="text-sm font-semibold">Unlocked</span>
                      {achievement.unlockedAt && (
                        <span className="text-xs text-[var(--text-muted)] ml-auto">
                          {new Date(achievement.unlockedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-[var(--text-muted)]">Progress</span>
                        <span className="text-[var(--success)] font-semibold">
                          {achievement.progress} / {achievement.target}
                        </span>
                      </div>
                      <div className="w-full bg-[var(--bg-tertiary)] rounded-full h-2">
                        <div
                          className={`bg-gradient-to-r ${getRarityColor(achievement.rarity)} h-2 rounded-full transition-all`}
                          style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

      {/* Empty State */}
      {sortedAchievements.length === 0 && (
        <div className="text-center py-12">
          <Award className="w-16 h-16 text-[var(--text-muted)] mx-auto mb-4" />
          <p className="text-[var(--text-muted)]">No achievements in this category yet</p>
        </div>
      )}
    </>
  );

  if (embedded) return mainContent;

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <Navigation currentPage="/achievements" />
      <div className="lg:ml-64 min-h-screen pt-14 lg:pt-16 pb-6">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {mainContent}
        </main>
      </div>
    </div>
  );
}
