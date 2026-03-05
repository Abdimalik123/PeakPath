import { useState, useEffect } from 'react';
import { Navigation } from '../components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card';
import { Button } from '../components/Button';
import { UserSearch } from '../components/UserSearch';
import { EmojiReactions } from '../components/EmojiReactions';
import {
  Users, Trophy, TrendingUp, UserPlus, Heart, MessageCircle, Award,
  Flame, Dumbbell, Target, Clock, Check, X, ChevronDown, ChevronUp, Send
} from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import client from '../api/client';

interface SocialUser {
  id: number;
  name: string;
  level: number;
  points: number;
  rank?: number;
  isFollowing?: boolean;
  streak?: number;
}

interface FriendRequest {
  friendship_id: number;
  id: number;
  name: string;
  level: number;
  points: number;
}

interface WorkoutExercise {
  name: string;
  sets: number;
  reps: number;
  weight: number | null;
  duration: number | null;
  notes: string | null;
}

interface WorkoutDetail {
  type: string;
  duration: number;
  date: string | null;
  notes: string | null;
  exercises: WorkoutExercise[];
}

interface CommentItem {
  id: number;
  user_id: number;
  name: string;
  comment: string;
  timestamp: string;
}

interface ActivityItem {
  id: number;
  user: SocialUser;
  type: 'workout' | 'goal' | 'achievement' | 'habit';
  action: string;
  details: string;
  timestamp: string;
  likes: number;
  comments: number;
  isLiked?: boolean;
  workout: WorkoutDetail | null;
}

export default function Social() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'feed' | 'leaderboard' | 'friends'>('feed');
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('week');

  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [leaderboard, setLeaderboard] = useState<SocialUser[]>([]);
  const [friends, setFriends] = useState<SocialUser[]>([]);
  const [suggestions, setSuggestions] = useState<SocialUser[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [currentUser, setCurrentUser] = useState<SocialUser>({ id: 0, name: 'You', level: 1, points: 0, rank: 0 });
  const [pendingSent, setPendingSent] = useState<Set<number>>(new Set());
  const [friendIds, setFriendIds] = useState<Set<number>>(new Set());

  // Per-activity comment state
  const [expandedComments, setExpandedComments] = useState<Set<number>>(new Set());
  const [commentInputs, setCommentInputs] = useState<Record<number, string>>({});
  const [activityComments, setActivityComments] = useState<Record<number, CommentItem[]>>({});
  const [submittingComment, setSubmittingComment] = useState<number | null>(null);

  useEffect(() => { loadSocialData(); }, [timeRange]);

  const loadSocialData = async () => {
    try {
      setLoading(true);
      const [activitiesRes, leaderboardRes, friendsRes, suggestionsRes, requestsRes] = await Promise.all([
        client.get('/social/feed'),
        client.get(`/social/leaderboard?range=${timeRange}`),
        client.get('/social/friends'),
        client.get('/social/suggestions'),
        client.get('/social/friend-requests'),
      ]);
      setActivities(activitiesRes.data.activities || []);
      setLeaderboard(leaderboardRes.data.leaderboard || []);
      const fl: SocialUser[] = friendsRes.data.friends || [];
      setFriends(fl);
      setFriendIds(new Set(fl.map((f) => f.id)));
      setSuggestions(suggestionsRes.data.suggestions || []);
      setFriendRequests(requestsRes.data.requests || []);
      if (leaderboardRes.data.current_user) setCurrentUser(leaderboardRes.data.current_user);
    } catch {
      showToast('Failed to load social data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (activityId: number) => {
    try {
      const res = await client.post(`/social/activities/${activityId}/like`);
      if (res.data.success) {
        setActivities((prev) => prev.map((a) =>
          a.id === activityId ? { ...a, likes: res.data.likes_count, isLiked: res.data.action === 'liked' } : a
        ));
      }
    } catch {
      setActivities((prev) => prev.map((a) =>
        a.id === activityId ? { ...a, likes: a.isLiked ? a.likes - 1 : a.likes + 1, isLiked: !a.isLiked } : a
      ));
    }
  };

  const toggleComments = async (activityId: number) => {
    const isOpen = expandedComments.has(activityId);
    if (isOpen) {
      setExpandedComments((prev) => { const s = new Set(prev); s.delete(activityId); return s; });
    } else {
      setExpandedComments((prev) => new Set(prev).add(activityId));
      if (!activityComments[activityId]) {
        try {
          const res = await client.get(`/social/activities/${activityId}/comments`);
          setActivityComments((prev) => ({ ...prev, [activityId]: res.data.comments || [] }));
        } catch {}
      }
    }
  };

  const submitComment = async (activityId: number) => {
    const text = (commentInputs[activityId] || '').trim();
    if (!text) return;
    setSubmittingComment(activityId);
    try {
      const res = await client.post(`/social/activities/${activityId}/comments`, { comment: text });
      if (res.data.success) {
        setActivityComments((prev) => ({
          ...prev,
          [activityId]: [...(prev[activityId] || []), res.data.comment],
        }));
        setCommentInputs((prev) => ({ ...prev, [activityId]: '' }));
        setActivities((prev) => prev.map((a) =>
          a.id === activityId ? { ...a, comments: res.data.comments_count } : a
        ));
      }
    } catch {
      showToast('Failed to post comment', 'error');
    } finally {
      setSubmittingComment(null);
    }
  };

  const handleAddFriend = async (userId: number) => {
    try {
      const res = await client.post(`/social/friends/${userId}`);
      if (res.data.success) {
        if (res.data.message === 'Friend request accepted') { showToast('You are now friends!'); loadSocialData(); }
        else { setPendingSent((prev) => new Set(prev).add(userId)); showToast('Friend request sent'); }
      }
    } catch (error: any) {
      const msg = error?.response?.data?.message || '';
      if (msg === 'Friend request already sent') setPendingSent((prev) => new Set(prev).add(userId));
      else if (msg === 'Already friends') loadSocialData();
      else showToast('Failed to send friend request', 'error');
    }
  };

  const handleUnfollow = async (userId: number) => {
    try {
      await client.delete(`/social/friends/${userId}`);
      setFriends((prev) => prev.filter((f) => f.id !== userId));
      setFriendIds((prev) => { const s = new Set(prev); s.delete(userId); return s; });
    } catch { showToast('Failed to remove friend', 'error'); }
  };

  const handleAcceptRequest = async (friendshipId: number) => {
    try {
      await client.post(`/social/friend-requests/${friendshipId}/accept`);
      showToast('Friend request accepted!');
      loadSocialData();
    } catch { showToast('Failed to accept request', 'error'); }
  };

  const handleDeclineRequest = async (friendshipId: number) => {
    try {
      await client.post(`/social/friend-requests/${friendshipId}/decline`);
      setFriendRequests((prev) => prev.filter((r) => r.friendship_id !== friendshipId));
    } catch { showToast('Failed to decline request', 'error'); }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'workout': return Dumbbell; case 'goal': return Target;
      case 'achievement': return Award; case 'habit': return Flame;
      default: return TrendingUp;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'workout': return 'text-[var(--brand-primary)]'; case 'goal': return 'text-purple-400';
      case 'achievement': return 'text-yellow-400'; case 'habit': return 'text-orange-400';
      default: return 'text-[var(--text-muted)]';
    }
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return '🥇'; if (rank === 2) return '🥈'; if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const renderAddButton = (userId: number) => {
    if (userId === currentUser.id) return null;
    if (friendIds.has(userId)) return <span className="text-xs text-[var(--brand-primary)] font-medium px-3 py-1.5 rounded-lg bg-[var(--brand-primary)]/10">Friends</span>;
    if (pendingSent.has(userId)) return <span className="flex items-center gap-1 text-xs text-[var(--text-muted)] px-3 py-1.5 rounded-lg bg-[var(--bg-tertiary)]"><Clock className="w-3 h-3" /> Pending</span>;
    return (
      <button onClick={() => handleAddFriend(userId)} className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg bg-[var(--brand-primary)] text-white hover:opacity-90 transition">
        <UserPlus className="w-3 h-3" /> Add
      </button>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)]">
        <Navigation currentPage="/social" />
        <div className="lg:ml-64 min-h-screen flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-[var(--brand-primary)] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <Navigation currentPage="/social" />
      <div className="lg:ml-64 min-h-screen">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[var(--text-primary)] flex items-center gap-3">
              <Users className="w-8 h-8 text-[var(--brand-primary)]" /> Community
            </h1>
            <p className="text-sm text-[var(--text-muted)] mt-1">Connect, compete, and stay motivated together</p>
          </div>

          {/* Stats card */}
          <Card className="bg-gradient-brand border-none mb-6">
            <CardContent className="pt-6 text-white">
              <div className="grid md:grid-cols-4 gap-6">
                <div><p className="text-white/70 text-sm mb-1">Your Rank</p><p className="text-3xl font-bold">#{currentUser.rank}</p></div>
                <div><p className="text-white/70 text-sm mb-1">Total Points</p><p className="text-3xl font-bold">{currentUser.points}</p></div>
                <div><p className="text-white/70 text-sm mb-1">Current Level</p><p className="text-3xl font-bold">{currentUser.level}</p></div>
                <div><p className="text-white/70 text-sm mb-1">Current Streak</p><p className="text-3xl font-bold">{currentUser.streak ?? 0} 🔥</p></div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b border-[var(--border-default)]">
            {(['feed', 'leaderboard', 'friends'] as const).map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 font-semibold text-sm transition capitalize ${activeTab === tab ? 'text-[var(--brand-primary)] border-b-2 border-[var(--brand-primary)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}>
                {tab === 'feed' && <TrendingUp className="w-5 h-5 inline mr-2" />}
                {tab === 'leaderboard' && <Trophy className="w-5 h-5 inline mr-2" />}
                {tab === 'friends' && <Users className="w-5 h-5 inline mr-2" />}
                {tab}
                {tab === 'friends' && friendRequests.length > 0 && (
                  <span className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-[var(--brand-primary)] text-white text-xs font-bold">{friendRequests.length}</span>
                )}
              </button>
            ))}
          </div>

          {/* ── FEED ── */}
          {activeTab === 'feed' && (
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                {activities.length === 0 ? (
                  <Card><CardContent className="pt-6 text-center py-16">
                    <TrendingUp className="w-12 h-12 mx-auto mb-4 text-[var(--text-muted)] opacity-40" />
                    <p className="text-[var(--text-muted)] font-medium">No activity yet</p>
                    <p className="text-sm text-[var(--text-muted)] mt-1">Add friends and log workouts to see activity here.</p>
                  </CardContent></Card>
                ) : activities.map((activity) => {
                  const Icon = getActivityIcon(activity.type);
                  const colorClass = getActivityColor(activity.type);
                  const commentsOpen = expandedComments.has(activity.id);
                  const comments = activityComments[activity.id] || [];

                  return (
                    <Card key={activity.id}>
                      <CardContent className="pt-6">
                        {/* User row */}
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-secondary)] flex items-center justify-center text-white font-bold text-lg">
                            {activity.user.name[0]}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-[var(--text-primary)]">{activity.user.name}</h3>
                            <p className="text-sm text-[var(--text-muted)]">Level {activity.user.level} • {activity.timestamp}</p>
                          </div>
                          <Icon className={`w-6 h-6 ${colorClass}`} />
                        </div>

                        {/* Action */}
                        <p className="text-[var(--text-secondary)] mb-3">
                          <span className="text-[var(--text-primary)] font-medium">{activity.action}</span>
                        </p>

                        {/* Workout detail card */}
                        {activity.workout ? (
                          <div className="bg-[var(--bg-tertiary)] rounded-[var(--radius-md)] p-4 mb-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-[var(--text-primary)]">{activity.workout.type}</span>
                              <span className="text-sm text-[var(--text-muted)]">{activity.workout.duration} min</span>
                            </div>
                            {activity.workout.notes && (
                              <p className="text-sm text-[var(--text-muted)] italic">"{activity.workout.notes}"</p>
                            )}
                            {activity.workout.exercises.length > 0 && (
                              <div className="space-y-1 pt-1 border-t border-[var(--border-default)]">
                                {activity.workout.exercises.map((ex, i) => (
                                  <div key={i} className="flex items-center justify-between text-sm">
                                    <span className="text-[var(--text-primary)]">{ex.name}</span>
                                    <span className="text-[var(--text-muted)]">
                                      {ex.sets}×{ex.reps}
                                      {ex.weight ? ` @ ${ex.weight}kg` : ''}
                                      {ex.notes ? <span className="ml-1 italic text-xs">({ex.notes})</span> : null}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="bg-[var(--bg-tertiary)] rounded-[var(--radius-md)] p-4 mb-4">
                            <p className="text-[var(--text-primary)]">{activity.details}</p>
                          </div>
                        )}

                        {/* Emoji Reactions */}
                        <div className="mb-4">
                          <EmojiReactions 
                            activityId={activity.id} 
                            reactions={activity.reactions || {}} 
                            userReactions={activity.user_reactions || []} 
                          />
                        </div>

                        {/* Comment button */}
                        <div className="flex items-center gap-6 mb-3">
                          <button onClick={() => toggleComments(activity.id)}
                            className="flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--brand-secondary)] transition">
                            <MessageCircle className="w-5 h-5" />
                            <span>{activity.comments}</span>
                            {commentsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </div>

                        {/* Comments section */}
                        {commentsOpen && (
                          <div className="border-t border-[var(--border-default)] pt-3 space-y-3">
                            {comments.length === 0 ? (
                              <p className="text-sm text-[var(--text-muted)]">No comments yet. Be the first!</p>
                            ) : comments.map((c) => (
                              <div key={c.id} className="flex gap-2">
                                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-secondary)] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                  {c.name[0]}
                                </div>
                                <div className="flex-1 bg-[var(--bg-tertiary)] rounded-lg px-3 py-2">
                                  <p className="text-xs font-semibold text-[var(--text-primary)]">{c.name} <span className="font-normal text-[var(--text-muted)]">· {c.timestamp}</span></p>
                                  <p className="text-sm text-[var(--text-secondary)] mt-0.5">{c.comment}</p>
                                </div>
                              </div>
                            ))}

                            {/* Comment input */}
                            <div className="flex gap-2 pt-1">
                              <input
                                type="text"
                                value={commentInputs[activity.id] || ''}
                                onChange={(e) => setCommentInputs((prev) => ({ ...prev, [activity.id]: e.target.value }))}
                                onKeyDown={(e) => e.key === 'Enter' && submitComment(activity.id)}
                                placeholder="Write a comment..."
                                className="flex-1 px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-lg text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--brand-primary)]"
                              />
                              <button
                                onClick={() => submitComment(activity.id)}
                                disabled={submittingComment === activity.id || !(commentInputs[activity.id] || '').trim()}
                                className="p-2 bg-[var(--brand-primary)] text-white rounded-lg hover:opacity-90 disabled:opacity-40 transition"
                              >
                                {submittingComment === activity.id
                                  ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                  : <Send className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                <Card>
                  <CardHeader><div className="flex items-center gap-2"><UserPlus className="w-5 h-5 text-[var(--brand-primary)]" /><CardTitle>Suggested Friends</CardTitle></div></CardHeader>
                  <CardContent>
                    {suggestions.length === 0 ? (
                      <p className="text-sm text-[var(--text-muted)]">No suggestions. Find people on the Leaderboard tab.</p>
                    ) : (
                      <div className="space-y-3">
                        {suggestions.map((user) => (
                          <div key={user.id} className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--brand-secondary)] to-purple-600 flex items-center justify-center text-white font-bold">{user.name[0]}</div>
                            <div className="flex-1"><p className="text-[var(--text-primary)] font-medium text-sm">{user.name}</p><p className="text-xs text-[var(--text-muted)]">Level {user.level}</p></div>
                            {renderAddButton(user.id)}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><div className="flex items-center gap-2"><TrendingUp className="w-5 h-5 text-[var(--brand-primary)]" /><CardTitle>Top This Week</CardTitle></div></CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {leaderboard.slice(0, 5).map((user) => (
                        <div key={user.id} className="flex items-center gap-3">
                          <span className="text-lg w-8 text-center">{getRankBadge(user.rank || 0)}</span>
                          <div className="flex-1"><p className="text-[var(--text-primary)] font-medium text-sm">{user.name}</p><p className="text-xs text-[var(--text-muted)]">{user.points} pts</p></div>
                          {renderAddButton(user.id)}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* ── LEADERBOARD ── */}
          {activeTab === 'leaderboard' && (
            <div className="space-y-4">
              <div className="flex gap-2 mb-4">
                {(['week', 'month', 'all'] as const).map((range) => (
                  <button key={range} onClick={() => setTimeRange(range)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition capitalize ${timeRange === range ? 'bg-[var(--brand-primary)] text-white' : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}>
                    {range === 'all' ? 'All Time' : `This ${range.charAt(0).toUpperCase() + range.slice(1)}`}
                  </button>
                ))}
              </div>
              {leaderboard.map((user) => (
                <Card key={user.id} className={user.id === currentUser.id ? 'ring-2 ring-[var(--brand-primary)]' : ''}>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center gap-4">
                      <span className="text-2xl w-10 text-center">{getRankBadge(user.rank || 0)}</span>
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-secondary)] flex items-center justify-center text-white font-bold">{user.name[0]}</div>
                      <div className="flex-1">
                        <p className="font-semibold text-[var(--text-primary)]">{user.name}{user.id === currentUser.id && <span className="ml-2 text-xs text-[var(--brand-primary)]">(You)</span>}</p>
                        <p className="text-sm text-[var(--text-muted)]">Level {user.level}</p>
                      </div>
                      <p className="font-bold text-[var(--brand-primary)] mr-3">{user.points} pts</p>
                      {renderAddButton(user.id)}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* ── FRIENDS ── */}
          {activeTab === 'friends' && (
            <div className="space-y-8">
              {/* User Search */}
              <div>
                <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-[var(--brand-primary)]" />
                  Find Friends
                </h2>
                <Card>
                  <CardContent className="pt-6">
                    <UserSearch onFriendAdded={loadSocialData} />
                  </CardContent>
                </Card>
              </div>

              {friendRequests.length > 0 && (
                <div>
                  <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2"><Clock className="w-5 h-5 text-[var(--brand-primary)]" />Friend Requests ({friendRequests.length})</h2>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {friendRequests.map((req) => (
                      <Card key={req.friendship_id}>
                        <CardContent className="pt-6 text-center">
                          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-secondary)] flex items-center justify-center text-white font-bold text-2xl mx-auto mb-3">{req.name[0]}</div>
                          <h3 className="font-bold text-[var(--text-primary)] mb-1">{req.name}</h3>
                          <p className="text-sm text-[var(--text-muted)] mb-4">Level {req.level} • {req.points} pts</p>
                          <div className="flex gap-2">
                            <button onClick={() => handleAcceptRequest(req.friendship_id)} className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-[var(--brand-primary)] hover:opacity-90 text-white rounded-lg text-sm font-medium transition"><Check className="w-4 h-4" />Accept</button>
                            <button onClick={() => handleDeclineRequest(req.friendship_id)} className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-[var(--bg-tertiary)] hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)] rounded-lg text-sm font-medium transition"><X className="w-4 h-4" />Decline</button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2"><Users className="w-5 h-5 text-[var(--brand-primary)]" />Friends ({friends.length})</h2>
                {friends.length === 0 ? (
                  <Card><CardContent className="pt-6 text-center py-16">
                    <UserPlus className="w-12 h-12 mx-auto mb-4 text-[var(--text-muted)] opacity-40" />
                    <p className="text-[var(--text-muted)] font-medium">No friends yet</p>
                    <p className="text-sm text-[var(--text-muted)] mt-1">Find people on the Leaderboard and send them a request.</p>
                  </CardContent></Card>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {friends.map((friend) => (
                      <Card key={friend.id} className="text-center">
                        <CardContent className="pt-6">
                          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-secondary)] flex items-center justify-center text-white font-bold text-3xl mx-auto mb-4">{friend.name[0]}</div>
                          <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">{friend.name}</h3>
                          <div className="flex justify-center gap-6 mb-4">
                            <div><p className="text-2xl font-bold text-[var(--brand-primary)]">{friend.level}</p><p className="text-xs text-[var(--text-muted)]">Level</p></div>
                            <div><p className="text-2xl font-bold text-[var(--brand-secondary)]">{friend.points}</p><p className="text-xs text-[var(--text-muted)]">Points</p></div>
                          </div>
                          <Button variant="secondary" className="w-full text-[var(--error)] hover:bg-[var(--error)]/10" onClick={() => handleUnfollow(friend.id)}>Remove Friend</Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              {suggestions.length > 0 && (
                <div>
                  <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2"><UserPlus className="w-5 h-5 text-[var(--brand-primary)]" />People You May Know</h2>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {suggestions.map((user) => (
                      <Card key={user.id}>
                        <CardContent className="pt-6 text-center">
                          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[var(--brand-secondary)] to-purple-600 flex items-center justify-center text-white font-bold text-2xl mx-auto mb-3">{user.name[0]}</div>
                          <h3 className="font-bold text-[var(--text-primary)] mb-1">{user.name}</h3>
                          <p className="text-sm text-[var(--text-muted)] mb-4">Level {user.level} • {user.points} pts</p>
                          <div className="flex justify-center">{renderAddButton(user.id)}</div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

        </main>
      </div>
    </div>
  );
}