import { User, Activity, TrendingUp, Save, AlertCircle, LogOut, Dumbbell, Flame, Award, Target, Trophy, Clock } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Navigation } from '../components/Navigation';
import { getProfile, updateProfile } from '../api/profile';
import client from '../api/client';
import Achievements from './Achievements';

interface GamificationStats {
  total_points: number;
  level: number;
  points_to_next_level: number;
  achievements_earned: number;
  achievements_total: number;
}

export default function Profile() {
  const { user: authUser, logout } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'achievements' | 'edit'>('overview');

  const [userInfo, setUserInfo] = useState({
    firstname: '',
    lastname: '',
    email: '',
  });

  const [profileData, setProfileData] = useState({
    age: '',
    gender: '',
    height: '',
    current_weight: '',
    goal_weight: '',
    activity_level: '',
  });

  const [stats, setStats] = useState<GamificationStats | null>(null);
  const [streak, setStreak] = useState(0);
  const [totalWorkouts, setTotalWorkouts] = useState(0);
  const [recentWorkouts, setRecentWorkouts] = useState<Array<{ id: number; type: string; date: string; duration: number }>>([]);

  useEffect(() => {
    if (authUser) {
      setUserInfo({
        firstname: authUser.firstname || '',
        lastname: authUser.lastname || '',
        email: authUser.email || '',
      });
    }
    loadAll();
  }, [authUser]);

  // Fallback: fetch user info from API if authUser is missing name
  useEffect(() => {
    if (!userInfo.firstname && !userInfo.lastname) {
      const fetchUser = async () => {
        try {
          const res = await client.get('/me');
          if (res.data.success && res.data.user) {
            setUserInfo({
              firstname: res.data.user.firstname || '',
              lastname: res.data.user.lastname || '',
              email: res.data.user.email || '',
            });
          }
        } catch {}
      };
      fetchUser();
    }
  }, [userInfo.firstname, userInfo.lastname]);

  const loadAll = async () => {
    try {
      const [profileRes, gamRes, analyticsRes, workoutsRes] = await Promise.allSettled([
        getProfile(),
        client.get('/gamification/stats'),
        client.get('/analytics/enhanced?range=year'),
        client.get('/workouts?per_page=5'),
      ]);

      if (profileRes.status === 'fulfilled') {
        const d = profileRes.value.data;
        setProfileData({
          age: d.age?.toString() || '',
          gender: d.gender || '',
          height: d.height_cm?.toString() || '',
          current_weight: d.current_weight_kg?.toString() || '',
          goal_weight: d.goal_weight_kg?.toString() || '',
          activity_level: d.activity_level || '',
        });
      }

      if (gamRes.status === 'fulfilled' && gamRes.value.data.success) {
        const g = gamRes.value.data;
        setStats({
          total_points: g.points?.total || 0,
          level: g.points?.level || 1,
          points_to_next_level: g.points?.points_to_next_level || 100,
          achievements_earned: g.achievements?.total_earned || 0,
          achievements_total: g.achievements?.total_available || 0,
        });
      }

      if (analyticsRes.status === 'fulfilled' && analyticsRes.value.data.success) {
        const a = analyticsRes.value.data.stats;
        setStreak(a.current_streak || 0);
        setTotalWorkouts(a.total_workouts || 0);
      }

      if (workoutsRes.status === 'fulfilled' && workoutsRes.value.data.success) {
        setRecentWorkouts(workoutsRes.value.data.workouts?.slice(0, 5) || []);
      }
    } catch {
      setError('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      await updateProfile({
        age: parseInt(profileData.age),
        gender: profileData.gender,
        height: parseFloat(profileData.height),
        current_weight: parseFloat(profileData.current_weight),
        goal_weight: parseFloat(profileData.goal_weight),
        activity_level: profileData.activity_level,
      });
      showToast('Profile updated!', 'success');
      setActiveTab('overview');
    } catch (error: any) {
      setError(error?.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const activityLabels: Record<string, string> = {
    sedentary: 'Sedentary',
    lightly_active: 'Lightly Active',
    moderately_active: 'Moderately Active',
    very_active: 'Very Active',
    extra_active: 'Extra Active',
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[var(--brand-primary)] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <Navigation currentPage="/profile" />

      <div className="lg:ml-64 min-h-screen pt-14 lg:pt-16 pb-20 lg:pb-0">
        <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

          {/* Profile Header */}
          <div className="pp-card p-6 mb-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[var(--brand-primary)] to-emerald-600 flex items-center justify-center text-white text-2xl font-bold">
                {(userInfo.firstname?.[0] || '').toUpperCase()}{(userInfo.lastname?.[0] || '').toUpperCase()}
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-[var(--text-primary)]">
                  {userInfo.firstname} {userInfo.lastname}
                </h1>
                <p className="text-sm text-[var(--text-muted)]">{userInfo.email}</p>
                {stats && (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-0.5 bg-[var(--brand-primary)]/20 text-[var(--brand-primary)] text-xs font-bold rounded-full">
                      Level {stats.level}
                    </span>
                    <span className="text-xs text-[var(--text-muted)]">{stats.total_points} pts</span>
                  </div>
                )}
              </div>
              <button
                onClick={() => { logout(); }}
                className="p-2 hover:bg-[var(--error)]/10 rounded-lg transition text-[var(--error)]"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="text-center p-3 bg-[var(--bg-tertiary)] rounded-xl">
                <Dumbbell className="w-4 h-4 text-[var(--brand-primary)] mx-auto mb-1" />
                <p className="text-lg font-bold text-[var(--text-primary)]">{totalWorkouts}</p>
                <p className="text-xs text-[var(--text-muted)]">Workouts</p>
              </div>
              <div className="text-center p-3 bg-[var(--bg-tertiary)] rounded-xl">
                <Flame className="w-4 h-4 text-orange-400 mx-auto mb-1" />
                <p className="text-lg font-bold text-[var(--text-primary)]">{streak}</p>
                <p className="text-xs text-[var(--text-muted)]">Streak</p>
              </div>
              <div className="text-center p-3 bg-[var(--bg-tertiary)] rounded-xl">
                <Award className="w-4 h-4 text-yellow-400 mx-auto mb-1" />
                <p className="text-lg font-bold text-[var(--text-primary)]">{stats?.achievements_earned || 0}</p>
                <p className="text-xs text-[var(--text-muted)]">Badges</p>
              </div>
              <div className="text-center p-3 bg-[var(--bg-tertiary)] rounded-xl">
                <TrendingUp className="w-4 h-4 text-purple-400 mx-auto mb-1" />
                <p className="text-lg font-bold text-[var(--text-primary)]">{stats?.level || 1}</p>
                <p className="text-xs text-[var(--text-muted)]">Level</p>
              </div>
            </div>

            {/* Level Progress */}
            {stats && (
              <div className="mt-4">
                <div className="flex justify-between text-xs text-[var(--text-muted)] mb-1">
                  <span>Level {stats.level}</span>
                  <span>{stats.points_to_next_level} pts to Level {stats.level + 1}</span>
                </div>
                <div className="w-full bg-[var(--bg-tertiary)] rounded-full h-2">
                  <div
                    className="bg-[var(--brand-primary)] h-2 rounded-full transition-all"
                    style={{ width: `${Math.max(5, 100 - (stats.points_to_next_level / (stats.level * 100)) * 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            {(['overview', 'achievements', 'edit'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition flex items-center gap-2 ${
                  activeTab === tab
                    ? 'bg-[var(--brand-primary)] text-[var(--text-inverse)]'
                    : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]'
                }`}
              >
                {tab === 'overview' && <User className="w-4 h-4" />}
                {tab === 'achievements' && <Trophy className="w-4 h-4" />}
                {tab === 'edit' && <Save className="w-4 h-4" />}
                {tab === 'overview' ? 'Overview' : tab === 'achievements' ? 'Achievements' : 'Edit Profile'}
              </button>
            ))}
          </div>

          {error && (
            <div className="flex items-center gap-2 p-4 bg-[var(--error)]/10 border border-[var(--error)]/30 rounded-xl mb-6">
              <AlertCircle className="w-5 h-5 text-[var(--error)]" />
              <p className="text-[var(--error)] text-sm">{error}</p>
            </div>
          )}

          {activeTab === 'achievements' ? (
            <Achievements embedded />
          ) : activeTab === 'overview' ? (
            <div className="space-y-4">
              {/* Body Info */}
              <div className="pp-card p-6">
                <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-[var(--brand-primary)]" />
                  Body Metrics
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-[var(--bg-tertiary)] rounded-xl">
                    <p className="text-xs text-[var(--text-muted)] uppercase mb-1">Height</p>
                    <p className="text-lg font-bold text-[var(--text-primary)]">{profileData.height ? `${profileData.height} cm` : '-'}</p>
                  </div>
                  <div className="p-3 bg-[var(--bg-tertiary)] rounded-xl">
                    <p className="text-xs text-[var(--text-muted)] uppercase mb-1">Weight</p>
                    <p className="text-lg font-bold text-[var(--text-primary)]">{profileData.current_weight ? `${profileData.current_weight} kg` : '-'}</p>
                  </div>
                  <div className="p-3 bg-[var(--bg-tertiary)] rounded-xl">
                    <p className="text-xs text-[var(--text-muted)] uppercase mb-1">Goal Weight</p>
                    <p className="text-lg font-bold text-[var(--text-primary)]">{profileData.goal_weight ? `${profileData.goal_weight} kg` : '-'}</p>
                  </div>
                  <div className="p-3 bg-[var(--bg-tertiary)] rounded-xl">
                    <p className="text-xs text-[var(--text-muted)] uppercase mb-1">Age</p>
                    <p className="text-lg font-bold text-[var(--text-primary)]">{profileData.age || '-'}</p>
                  </div>
                </div>
                {profileData.activity_level && (
                  <div className="mt-4 p-3 bg-[var(--bg-tertiary)] rounded-xl">
                    <p className="text-xs text-[var(--text-muted)] uppercase mb-1">Activity Level</p>
                    <p className="text-lg font-bold text-[var(--text-primary)]">{activityLabels[profileData.activity_level] || profileData.activity_level}</p>
                  </div>
                )}
                {profileData.current_weight && profileData.goal_weight && (
                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-[var(--text-muted)] mb-1">
                      <span>Weight Progress</span>
                      <span>{profileData.current_weight}kg / {profileData.goal_weight}kg goal</span>
                    </div>
                    <div className="w-full bg-[var(--bg-tertiary)] rounded-full h-2">
                      <div
                        className="bg-emerald-500 h-2 rounded-full transition-all"
                        style={(() => {
                          const cw = parseFloat(profileData.current_weight);
                          const gw = parseFloat(profileData.goal_weight);
                          // Progress = how close current is to goal (0% = far, 100% = reached)
                          // Works for both weight loss (cw > gw) and gain (cw < gw)
                          const startWeight = cw > gw ? Math.max(cw * 1.1, cw + 5) : Math.min(cw * 0.9, cw - 5);
                          const range = Math.abs(startWeight - gw);
                          const done = Math.abs(cw - startWeight);
                          const pct = range > 0 ? Math.min(100, Math.max(5, (done / range) * 100)) : 5;
                          return { width: `${pct}%` };
                        })()}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Recent Activity */}
              <div className="pp-card p-6">
                <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-[var(--brand-primary)]" />
                  Recent Activity
                </h2>
                {recentWorkouts.length === 0 ? (
                  <div className="text-center py-6">
                    <Dumbbell className="w-8 h-8 text-[var(--text-muted)] mx-auto mb-2 opacity-40" />
                    <p className="text-sm text-[var(--text-muted)]">No workouts yet</p>
                    <Link to="/train" className="text-sm text-[var(--brand-primary)] font-medium mt-1 inline-block">Start training</Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentWorkouts.map((w) => (
                      <div key={w.id} className="flex items-center gap-3 p-3 bg-[var(--bg-tertiary)] rounded-xl">
                        <div className="w-9 h-9 rounded-lg bg-[var(--brand-primary)]/15 flex items-center justify-center">
                          <Dumbbell className="w-4 h-4 text-[var(--brand-primary)]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[var(--text-primary)] truncate">{w.type}</p>
                          <p className="text-xs text-[var(--text-muted)]">{w.date}</p>
                        </div>
                        <span className="text-xs text-[var(--text-muted)] whitespace-nowrap">{w.duration} min</span>
                      </div>
                    ))}
                    <Link to="/train" className="block text-center text-sm text-[var(--brand-primary)] font-medium pt-2">
                      View all workouts
                    </Link>
                  </div>
                )}
              </div>

              {/* Quick Links */}
              <div className="pp-card p-6">
                <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">Quick Links</h2>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => setActiveTab('achievements')} className="flex items-center gap-3 p-3 bg-[var(--bg-tertiary)] rounded-xl hover:bg-[var(--bg-tertiary)]/80 transition text-sm font-medium text-[var(--text-primary)]">
                    <Award className="w-4 h-4 text-yellow-400" /> Achievements
                  </button>
                  <Link to="/progress" className="flex items-center gap-3 p-3 bg-[var(--bg-tertiary)] rounded-xl hover:bg-[var(--bg-tertiary)]/80 transition text-sm font-medium text-[var(--text-primary)]">
                    <TrendingUp className="w-4 h-4 text-purple-400" /> Progress
                  </Link>
                  <Link to="/train" className="flex items-center gap-3 p-3 bg-[var(--bg-tertiary)] rounded-xl hover:bg-[var(--bg-tertiary)]/80 transition text-sm font-medium text-[var(--text-primary)]">
                    <Dumbbell className="w-4 h-4 text-[var(--brand-primary)]" /> Train
                  </Link>
                  <Link to="/community" className="flex items-center gap-3 p-3 bg-[var(--bg-tertiary)] rounded-xl hover:bg-[var(--bg-tertiary)]/80 transition text-sm font-medium text-[var(--text-primary)]">
                    <User className="w-4 h-4 text-cyan-400" /> Community
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            /* Edit Tab */
            <div className="space-y-6">
              {/* Account Info */}
              <div className="pp-card p-6">
                <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-[var(--brand-primary)]" />
                  Account
                </h2>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <input type="text" value={userInfo.firstname} disabled
                      className="w-full px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-xl text-[var(--text-muted)] cursor-not-allowed text-sm"
                      placeholder="First Name" />
                    <input type="text" value={userInfo.lastname} disabled
                      className="w-full px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-xl text-[var(--text-muted)] cursor-not-allowed text-sm"
                      placeholder="Last Name" />
                  </div>
                  <input type="email" value={userInfo.email} disabled
                    className="w-full px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-xl text-[var(--text-muted)] cursor-not-allowed text-sm"
                    placeholder="Email" />
                </div>
              </div>

              {/* Body Metrics */}
              <div className="pp-card p-6">
                <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-[var(--brand-primary)]" />
                  Body Metrics
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[var(--text-muted)] uppercase mb-1">Height (cm)</label>
                    <input type="number" value={profileData.height}
                      onChange={e => setProfileData({ ...profileData, height: e.target.value })}
                      className="w-full px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-xl text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--brand-primary)]"
                      placeholder="175" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[var(--text-muted)] uppercase mb-1">Current Weight (kg)</label>
                    <input type="number" value={profileData.current_weight}
                      onChange={e => setProfileData({ ...profileData, current_weight: e.target.value })}
                      className="w-full px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-xl text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--brand-primary)]"
                      placeholder="75" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[var(--text-muted)] uppercase mb-1">Goal Weight (kg)</label>
                    <input type="number" value={profileData.goal_weight}
                      onChange={e => setProfileData({ ...profileData, goal_weight: e.target.value })}
                      className="w-full px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-xl text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--brand-primary)]"
                      placeholder="70" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[var(--text-muted)] uppercase mb-1">Age</label>
                    <input type="number" value={profileData.age}
                      onChange={e => setProfileData({ ...profileData, age: e.target.value })}
                      className="w-full px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-xl text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--brand-primary)]"
                      placeholder="25" />
                  </div>
                </div>

                <div className="mt-3">
                  <label className="block text-xs font-bold text-[var(--text-muted)] uppercase mb-1">Gender</label>
                  <select value={profileData.gender}
                    onChange={e => setProfileData({ ...profileData, gender: e.target.value })}
                    className="w-full px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-xl text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--brand-primary)]">
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="mt-3">
                  <label className="block text-xs font-bold text-[var(--text-muted)] uppercase mb-1">Activity Level</label>
                  <select value={profileData.activity_level}
                    onChange={e => setProfileData({ ...profileData, activity_level: e.target.value })}
                    className="w-full px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-xl text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--brand-primary)]">
                    <option value="sedentary">Sedentary - Little or no exercise</option>
                    <option value="lightly_active">Lightly Active - 1-3 days/week</option>
                    <option value="moderately_active">Moderately Active - 3-5 days/week</option>
                    <option value="very_active">Very Active - 6-7 days/week</option>
                    <option value="extra_active">Extra Active - Physical job + exercise</option>
                  </select>
                </div>
              </div>

              <button onClick={handleSave} disabled={saving}
                className="w-full py-4 pp-btn-primary flex items-center justify-center gap-2 disabled:opacity-50">
                <Save className="w-5 h-5" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
