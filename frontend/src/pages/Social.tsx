import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Activity as ActivityIcon, Users, Trophy, TrendingUp, UserPlus, Heart, MessageCircle, Award, Flame, Dumbbell, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface User {
  id: number;
  name: string;
  avatar?: string;
  level: number;
  points: number;
  rank?: number;
  isFollowing?: boolean;
  streak?: number;
}

interface Activity {
  id: number;
  user: User;
  type: 'workout' | 'goal' | 'achievement' | 'habit';
  action: string;
  details: string;
  timestamp: string;
  likes: number;
  comments: number;
  isLiked?: boolean;
}

export default function Social() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'feed' | 'leaderboard' | 'friends'>('feed');
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('week');
  
  const [activities, setActivities] = useState<Activity[]>([]);
  const [leaderboard, setLeaderboard] = useState<User[]>([]);
  const [friends, setFriends] = useState<User[]>([]);
  const [suggestions, setSuggestions] = useState<User[]>([]);

  // Mock current user
  const currentUser = {
    id: 1,
    name: 'You',
    level: 8,
    points: 850,
    rank: 12,
    streak: 12
  };

  // Mock data
  const mockActivities: Activity[] = [
    {
      id: 1,
      user: { id: 2, name: 'Sarah Chen', level: 10, points: 1200 },
      type: 'workout',
      action: 'completed a workout',
      details: 'Push Day - Chest Focus • 60 min • 7 exercises',
      timestamp: '2 hours ago',
      likes: 12,
      comments: 3,
      isLiked: false
    },
    {
      id: 2,
      user: { id: 3, name: 'Mike Johnson', level: 15, points: 2100 },
      type: 'achievement',
      action: 'unlocked an achievement',
      details: '🏆 Century Club - Complete 100 workouts',
      timestamp: '4 hours ago',
      likes: 24,
      comments: 8,
      isLiked: true
    },
    {
      id: 3,
      user: { id: 4, name: 'Emma Davis', level: 7, points: 680 },
      type: 'goal',
      action: 'completed a goal',
      details: '🎯 Lose 10kg - Goal achieved!',
      timestamp: '1 day ago',
      likes: 45,
      comments: 12,
      isLiked: true
    },
    {
      id: 4,
      user: { id: 5, name: 'Alex Rivera', level: 12, points: 1500 },
      type: 'habit',
      action: 'reached a streak',
      details: '🔥 30 day habit streak!',
      timestamp: '1 day ago',
      likes: 18,
      comments: 5,
      isLiked: false
    },
    {
      id: 5,
      user: { id: 6, name: 'Lisa Park', level: 9, points: 950 },
      type: 'workout',
      action: 'completed a workout',
      details: 'HIIT Cardio Blast • 20 min • 5 exercises',
      timestamp: '2 days ago',
      likes: 8,
      comments: 2,
      isLiked: false
    }
  ];

  const mockLeaderboard: User[] = [
    { id: 101, name: 'Dragon Warrior', level: 25, points: 5420, rank: 1, streak: 87 },
    { id: 102, name: 'Iron Mike', level: 23, points: 4850, rank: 2, streak: 45 },
    { id: 103, name: 'Fitness Queen', level: 22, points: 4320, rank: 3, streak: 62 },
    { id: 104, name: 'Gym Rat Pro', level: 20, points: 3900, rank: 4, streak: 38 },
    { id: 105, name: 'Beast Mode', level: 19, points: 3560, rank: 5, streak: 41 },
    { id: 106, name: 'Grind Master', level: 18, points: 3200, rank: 6, streak: 29 },
    { id: 107, name: 'Strong Sarah', level: 17, points: 2980, rank: 7, streak: 52 },
    { id: 108, name: 'Power Lifter', level: 16, points: 2750, rank: 8, streak: 23 },
    { id: 109, name: 'Cardio King', level: 15, points: 2450, rank: 9, streak: 67 },
    { id: 110, name: 'Flex Master', level: 14, points: 2200, rank: 10, streak: 15 },
  ];

  const mockFriends: User[] = [
    { id: 2, name: 'Sarah Chen', level: 10, points: 1200, isFollowing: true, streak: 23 },
    { id: 3, name: 'Mike Johnson', level: 15, points: 2100, isFollowing: true, streak: 45 },
    { id: 4, name: 'Emma Davis', level: 7, points: 680, isFollowing: true, streak: 12 },
    { id: 5, name: 'Alex Rivera', level: 12, points: 1500, isFollowing: true, streak: 34 },
  ];

  const mockSuggestions: User[] = [
    { id: 201, name: 'Chris Lee', level: 11, points: 1350, isFollowing: false },
    { id: 202, name: 'Jenny Wilson', level: 9, points: 920, isFollowing: false },
    { id: 203, name: 'Tom Harris', level: 13, points: 1680, isFollowing: false },
  ];

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    loadSocialData();
  }, [navigate, timeRange]);

  const loadSocialData = async () => {
    try {
      // TODO: Replace with actual API calls
      setActivities(mockActivities);
      setLeaderboard(mockLeaderboard);
      setFriends(mockFriends);
      setSuggestions(mockSuggestions);
    } catch (error: any) {
      if (error?.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLike = (activityId: number) => {
    setActivities(activities.map(activity =>
      activity.id === activityId
        ? {
            ...activity,
            likes: activity.isLiked ? activity.likes - 1 : activity.likes + 1,
            isLiked: !activity.isLiked
          }
        : activity
    ));
  };

  const handleFollow = (userId: number) => {
    setSuggestions(suggestions.map(user =>
      user.id === userId ? { ...user, isFollowing: true } : user
    ));
    // Move to friends list
    const newFriend = suggestions.find(u => u.id === userId);
    if (newFriend) {
      setFriends([...friends, { ...newFriend, isFollowing: true }]);
      setSuggestions(suggestions.filter(u => u.id !== userId));
    }
  };

  const handleUnfollow = (userId: number) => {
    setFriends(friends.filter(f => f.id !== userId));
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'workout': return Dumbbell;
      case 'goal': return Target;
      case 'achievement': return Award;
      case 'habit': return Flame;
      default: return TrendingUp;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'workout': return 'text-emerald-400';
      case 'goal': return 'text-purple-400';
      case 'achievement': return 'text-yellow-400';
      case 'habit': return 'text-orange-400';
      default: return 'text-gray-400';
    }
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  if (loading) {
    return (
      <Layout>
        <div className="p-6 flex items-center justify-center min-h-screen">
          <div className="w-12 h-12 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
              <Users className="w-10 h-10 text-emerald-400" />
              Community
            </h1>
            <p className="text-gray-400">Connect, compete, and stay motivated together</p>
          </div>

          {/* Your Stats Card */}
          <div className="bg-gradient-to-r from-emerald-900/30 to-blue-900/30 backdrop-blur-sm border border-emerald-500/30 rounded-2xl p-6 mb-6">
            <div className="grid md:grid-cols-4 gap-6">
              <div>
                <p className="text-gray-400 text-sm mb-1">Your Rank</p>
                <p className="text-3xl font-bold text-white">#{currentUser.rank}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-1">Total Points</p>
                <p className="text-3xl font-bold text-emerald-400">{currentUser.points}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-1">Current Level</p>
                <p className="text-3xl font-bold text-blue-400">{currentUser.level}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-1">Current Streak</p>
                <p className="text-3xl font-bold text-orange-400">{currentUser.streak} 🔥</p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b border-emerald-900/50">
            {(['feed', 'leaderboard', 'friends'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 font-semibold transition capitalize ${
                  activeTab === tab
                    ? 'text-emerald-400 border-b-2 border-emerald-400'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {tab === 'feed' && <TrendingUp className="w-5 h-5 inline mr-2" />}
                {tab === 'leaderboard' && <Trophy className="w-5 h-5 inline mr-2" />}
                {tab === 'friends' && <Users className="w-5 h-5 inline mr-2" />}
                {tab}
              </button>
            ))}
          </div>

          {/* Activity Feed */}
          {activeTab === 'feed' && (
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Main Feed */}
              <div className="lg:col-span-2 space-y-4">
                {activities.map((activity) => {
                  const Icon = getActivityIcon(activity.type);
                  const colorClass = getActivityColor(activity.type);
                  
                  return (
                    <div
                      key={activity.id}
                      className="bg-slate-900/50 backdrop-blur-sm border border-emerald-900/50 rounded-xl p-6 hover:border-emerald-700/50 transition"
                    >
                      {/* User Info */}
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
                          {activity.user.name[0]}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-white">{activity.user.name}</h3>
                          <p className="text-sm text-gray-400">
                            Level {activity.user.level} • {activity.timestamp}
                          </p>
                        </div>
                        <Icon className={`w-6 h-6 ${colorClass}`} />
                      </div>

                      {/* Activity Content */}
                      <p className="text-gray-300 mb-2">
                        <span className="text-white font-medium">{activity.action}</span>
                      </p>
                      <div className="bg-slate-800/50 rounded-lg p-4 mb-4">
                        <p className="text-white">{activity.details}</p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-6">
                        <button
                          onClick={() => handleLike(activity.id)}
                          className={`flex items-center gap-2 transition ${
                            activity.isLiked
                              ? 'text-red-400'
                              : 'text-gray-400 hover:text-red-400'
                          }`}
                        >
                          <Heart className={`w-5 h-5 ${activity.isLiked ? 'fill-current' : ''}`} />
                          <span>{activity.likes}</span>
                        </button>
                        <button className="flex items-center gap-2 text-gray-400 hover:text-blue-400 transition">
                          <MessageCircle className="w-5 h-5" />
                          <span>{activity.comments}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Friend Suggestions */}
                <div className="bg-slate-900/50 backdrop-blur-sm border border-emerald-900/50 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-emerald-400" />
                    Suggested Friends
                  </h3>
                  <div className="space-y-3">
                    {suggestions.map((user) => (
                      <div key={user.id} className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                          {user.name[0]}
                        </div>
                        <div className="flex-1">
                          <p className="text-white font-medium text-sm">{user.name}</p>
                          <p className="text-xs text-gray-400">Level {user.level}</p>
                        </div>
                        <button
                          onClick={() => handleFollow(user.id)}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-sm rounded-lg transition"
                        >
                          Follow
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top Performers This Week */}
                <div className="bg-slate-900/50 backdrop-blur-sm border border-emerald-900/50 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-emerald-400" />
                    Top This Week
                  </h3>
                  <div className="space-y-3">
                    {leaderboard.slice(0, 5).map((user, index) => (
                      <div key={user.id} className="flex items-center gap-3">
                        <span className="text-2xl">{getRankBadge(index + 1)}</span>
                        <div className="flex-1">
                          <p className="text-white font-medium text-sm">{user.name}</p>
                          <p className="text-xs text-emerald-400">{user.points} pts</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Leaderboard */}
          {activeTab === 'leaderboard' && (
            <div>
              {/* Time Range Filter */}
              <div className="flex gap-2 mb-6">
                {(['week', 'month', 'all'] as const).map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`px-4 py-2 rounded-lg font-medium transition capitalize ${
                      timeRange === range
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-800/50 text-gray-400 hover:bg-slate-800'
                    }`}
                  >
                    {range === 'week' && 'This Week'}
                    {range === 'month' && 'This Month'}
                    {range === 'all' && 'All Time'}
                  </button>
                ))}
              </div>

              {/* Leaderboard List */}
              <div className="space-y-3">
                {leaderboard.map((user) => (
                  <div
                    key={user.id}
                    className={`bg-slate-900/50 backdrop-blur-sm border rounded-xl p-6 flex items-center gap-6 transition ${
                      user.rank && user.rank <= 3
                        ? 'border-yellow-500/50 shadow-lg shadow-yellow-500/10'
                        : 'border-emerald-900/50 hover:border-emerald-700/50'
                    }`}
                  >
                    {/* Rank */}
                    <div className="text-center min-w-[60px]">
                      <div className="text-3xl mb-1">{getRankBadge(user.rank!)}</div>
                      {user.rank && user.rank <= 3 && (
                        <Trophy className="w-6 h-6 text-yellow-400 mx-auto" />
                      )}
                    </div>

                    {/* Avatar */}
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center text-white font-bold text-2xl">
                      {user.name[0]}
                    </div>

                    {/* User Info */}
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white mb-1">{user.name}</h3>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-gray-400">Level {user.level}</span>
                        <span className="text-emerald-400 font-semibold">{user.points} points</span>
                        {user.streak && (
                          <span className="text-orange-400 flex items-center gap-1">
                            <Flame className="w-4 h-4" />
                            {user.streak} day streak
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <button className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition">
                      View Profile
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Friends */}
          {activeTab === 'friends' && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {friends.map((friend) => (
                <div
                  key={friend.id}
                  className="bg-slate-900/50 backdrop-blur-sm border border-emerald-900/50 rounded-xl p-6 text-center hover:border-emerald-700/50 transition"
                >
                  {/* Avatar */}
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center text-white font-bold text-3xl mx-auto mb-4">
                    {friend.name[0]}
                  </div>

                  {/* Name */}
                  <h3 className="text-xl font-bold text-white mb-2">{friend.name}</h3>

                  {/* Stats */}
                  <div className="flex justify-center gap-6 mb-4">
                    <div>
                      <p className="text-2xl font-bold text-emerald-400">{friend.level}</p>
                      <p className="text-xs text-gray-400">Level</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-blue-400">{friend.points}</p>
                      <p className="text-xs text-gray-400">Points</p>
                    </div>
                    {friend.streak && (
                      <div>
                        <p className="text-2xl font-bold text-orange-400">{friend.streak} 🔥</p>
                        <p className="text-xs text-gray-400">Streak</p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition">
                      View
                    </button>
                    <button
                      onClick={() => handleUnfollow(friend.id)}
                      className="flex-1 px-4 py-2 bg-slate-800/50 hover:bg-red-500/20 text-gray-400 hover:text-red-400 rounded-lg font-medium transition"
                    >
                      Unfollow
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}