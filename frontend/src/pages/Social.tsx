import { useState, useEffect } from 'react';
import { Navigation } from '../components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card';
import { Button } from '../components/Button';
import { Users, Trophy, TrendingUp, UserPlus, Heart, MessageCircle, Award, Flame, Dumbbell, Target } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import client from '../api/client';

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

interface ActivityItem {
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
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'feed' | 'leaderboard' | 'friends'>('feed');
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('week');
  
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [leaderboard, setLeaderboard] = useState<User[]>([]);
  const [friends, setFriends] = useState<User[]>([]);
  const [suggestions, setSuggestions] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User>({ id: 0, name: 'You', level: 1, points: 0, rank: 0, streak: 0 });

  useEffect(() => {
    loadSocialData();
  }, [timeRange]);

  const loadSocialData = async () => {
    try {
      setLoading(true);
      const [activitiesRes, leaderboardRes, friendsRes, suggestionsRes] = await Promise.all([
        client.get('/social/feed'),
        client.get(`/social/leaderboard?range=${timeRange}`),
        client.get('/social/friends'),
        client.get('/social/suggestions')
      ]);
      
      setActivities(activitiesRes.data.activities || []);
      setLeaderboard(leaderboardRes.data.leaderboard || []);
      setFriends(friendsRes.data.friends || []);
      setSuggestions(suggestionsRes.data.suggestions || []);
      if (leaderboardRes.data.current_user) {
        setCurrentUser(leaderboardRes.data.current_user);
      }
    } catch (error: any) {
      console.error('Social load error:', error);
      showToast('Failed to load social data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (activityId: number) => {
    try {
      const response = await client.post(`/social/activities/${activityId}/like`);
      if (response.data.success) {
        setActivities(activities.map(activity =>
          activity.id === activityId
            ? {
                ...activity,
                likes: response.data.likes_count,
                isLiked: response.data.action === 'liked'
              }
            : activity
        ));
      }
    } catch (error) {
      console.error('Failed to like activity:', error);
      // Optimistic update on error
      setActivities(activities.map(activity =>
        activity.id === activityId
          ? {
              ...activity,
              likes: activity.isLiked ? activity.likes - 1 : activity.likes + 1,
              isLiked: !activity.isLiked
            }
          : activity
      ));
    }
  };

  const handleFollow = async (userId: number) => {
    try {
      const response = await client.post(`/social/friends/${userId}`);
      if (response.data.success) {
        // Remove from suggestions and reload data to get updated friends list
        loadSocialData();
      }
    } catch (error) {
      console.error('Failed to add friend:', error);
      showToast('Failed to add friend. Please try again.', 'error');
    }
  };

  const handleUnfollow = async (userId: number) => {
    try {
      const response = await client.delete(`/social/friends/${userId}`);
      if (response.data.success) {
        setFriends(friends.filter(f => f.id !== userId));
      }
    } catch (error) {
      console.error('Failed to remove friend:', error);
      // Optimistic update on error
      setFriends(friends.filter(f => f.id !== userId));
    }
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
      case 'workout': return 'text-[var(--brand-primary)]';
      case 'goal': return 'text-purple-400';
      case 'achievement': return 'text-[var(--warning)]';
      case 'habit': return 'text-orange-400';
      default: return 'text-[var(--text-muted)]';
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
      <div className="min-h-screen bg-[var(--bg-primary)]">
        <Navigation currentPage="/social" />
        <div className="lg:ml-64 min-h-screen flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-[var(--brand-primary)] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <Navigation currentPage="/social" />
      
      <div className="lg:ml-64 min-h-screen">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[var(--text-primary)] flex items-center gap-3">
              <Users className="w-8 h-8 text-[var(--brand-primary)]" />
              Community
            </h1>
            <p className="text-sm text-[var(--text-muted)] mt-1">
              Connect, compete, and stay motivated together
            </p>
          </div>

          {/* Your Stats Card */}
          <Card className="bg-gradient-brand border-none mb-6">
            <CardContent className="pt-6 text-white">
              <div className="grid md:grid-cols-4 gap-6">
                <div>
                  <p className="text-white/70 text-sm mb-1">Your Rank</p>
                  <p className="text-3xl font-bold">#{currentUser.rank}</p>
                </div>
                <div>
                  <p className="text-white/70 text-sm mb-1">Total Points</p>
                  <p className="text-3xl font-bold">{currentUser.points}</p>
                </div>
                <div>
                  <p className="text-white/70 text-sm mb-1">Current Level</p>
                  <p className="text-3xl font-bold">{currentUser.level}</p>
                </div>
                <div>
                  <p className="text-white/70 text-sm mb-1">Current Streak</p>
                  <p className="text-3xl font-bold">{currentUser.streak} 🔥</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b border-[var(--border-default)]">
            {(['feed', 'leaderboard', 'friends'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 font-semibold text-sm transition capitalize ${
                  activeTab === tab
                    ? 'text-[var(--brand-primary)] border-b-2 border-[var(--brand-primary)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
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
                    <Card key={activity.id}>
                      <CardContent className="pt-6">
                        {/* User Info */}
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-secondary)] flex items-center justify-center text-white font-bold text-lg">
                            {activity.user.name[0]}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-[var(--text-primary)]">{activity.user.name}</h3>
                            <p className="text-sm text-[var(--text-muted)]">
                              Level {activity.user.level} • {activity.timestamp}
                            </p>
                          </div>
                          <Icon className={`w-6 h-6 ${colorClass}`} />
                        </div>

                        {/* Activity Content */}
                        <p className="text-[var(--text-secondary)] mb-2">
                          <span className="text-[var(--text-primary)] font-medium">{activity.action}</span>
                        </p>
                        <div className="bg-[var(--bg-tertiary)] rounded-[var(--radius-md)] p-4 mb-4">
                          <p className="text-[var(--text-primary)]">{activity.details}</p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-6">
                          <button
                            onClick={() => handleLike(activity.id)}
                            className={`flex items-center gap-2 transition ${
                              activity.isLiked
                                ? 'text-[var(--error)]'
                                : 'text-[var(--text-muted)] hover:text-[var(--error)]'
                            }`}
                          >
                            <Heart className={`w-5 h-5 ${activity.isLiked ? 'fill-current' : ''}`} />
                            <span>{activity.likes}</span>
                          </button>
                          <button className="flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--brand-secondary)] transition">
                            <MessageCircle className="w-5 h-5" />
                            <span>{activity.comments}</span>
                          </button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Friend Suggestions */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <UserPlus className="w-5 h-5 text-[var(--brand-primary)]" />
                      <CardTitle>Suggested Friends</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {suggestions.map((user) => (
                        <div key={user.id} className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--brand-secondary)] to-purple-600 flex items-center justify-center text-white font-bold">
                            {user.name[0]}
                          </div>
                          <div className="flex-1">
                            <p className="text-[var(--text-primary)] font-medium text-sm">{user.name}</p>
                            <p className="text-xs text-[var(--text-muted)]">Level {user.level}</p>
                          </div>
                          <Button 
                            variant="primary" 
                            size="sm"
                            onClick={() => handleFollow(user.id)}
                          >
                            Follow
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Top Performers This Week */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-[var(--brand-primary)]" />
                      <CardTitle>Top This Week</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {leaderboard.slice(0, 5).map((user, index) => (
                        <div key={user.id} className="flex items-center gap-3">
                          <span className="text-2xl">{getRankBadge(index + 1)}</span>
                          <div className="flex-1">
                            <p className="text-[var(--text-primary)] font-medium text-sm">{user.name}</p>
                            <p className="text-xs text-[var(--brand-primary)]">{user.points} pts</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
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
                    className={`px-4 py-2 rounded-[var(--radius-md)] font-medium text-sm transition capitalize ${
                      timeRange === range
                        ? 'bg-[var(--brand-primary)] text-[var(--text-inverse)]'
                        : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]'
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
                  <Card
                    key={user.id}
                    className={user.rank && user.rank <= 3 ? 'border-[var(--warning)]/50 shadow-[0_0_20px_rgba(245,158,11,0.1)]' : ''}
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-6">
                        {/* Rank */}
                        <div className="text-center min-w-[60px]">
                          <div className="text-3xl mb-1">{getRankBadge(user.rank!)}</div>
                          {user.rank && user.rank <= 3 && (
                            <Trophy className="w-6 h-6 text-[var(--warning)] mx-auto" />
                          )}
                        </div>

                        {/* Avatar */}
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-secondary)] flex items-center justify-center text-white font-bold text-2xl">
                          {user.name[0]}
                        </div>

                        {/* User Info */}
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-[var(--text-primary)] mb-1">{user.name}</h3>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-[var(--text-muted)]">Level {user.level}</span>
                            <span className="text-[var(--brand-primary)] font-semibold">{user.points} points</span>
                            {user.streak && (
                              <span className="text-orange-400 flex items-center gap-1">
                                <Flame className="w-4 h-4" />
                                {user.streak} day streak
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <Button variant="primary">View Profile</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Friends */}
          {activeTab === 'friends' && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {friends.map((friend) => (
                <Card key={friend.id} className="text-center">
                  <CardContent className="pt-6">
                    {/* Avatar */}
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-secondary)] flex items-center justify-center text-white font-bold text-3xl mx-auto mb-4">
                      {friend.name[0]}
                    </div>

                    {/* Name */}
                    <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">{friend.name}</h3>

                    {/* Stats */}
                    <div className="flex justify-center gap-6 mb-4">
                      <div>
                        <p className="text-2xl font-bold text-[var(--brand-primary)]">{friend.level}</p>
                        <p className="text-xs text-[var(--text-muted)]">Level</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-[var(--brand-secondary)]">{friend.points}</p>
                        <p className="text-xs text-[var(--text-muted)]">Points</p>
                      </div>
                      {friend.streak && (
                        <div>
                          <p className="text-2xl font-bold text-orange-400">{friend.streak} 🔥</p>
                          <p className="text-xs text-[var(--text-muted)]">Streak</p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button variant="primary" className="flex-1">View</Button>
                      <Button 
                        variant="secondary" 
                        className="flex-1 text-[var(--error)] hover:bg-[var(--error)]/10"
                        onClick={() => handleUnfollow(friend.id)}
                      >
                        Unfollow
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}