import { User, Activity, TrendingUp, Save, AlertCircle, LogOut } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';
import { Navigation } from '../components/Navigation';
import { FormInput } from '../components/FormInput';
import { getProfile, updateProfile } from '../api/profile';

export default function Profile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUserInfo({
          firstname: payload.firstname || '',
          lastname: payload.lastname || '',
          email: payload.email || '',
        });
      } catch (e) {
        console.error('Failed to parse token:', e);
      }
    }
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await getProfile();
      setProfileData({
        age: response.data.age?.toString() || '',
        gender: response.data.gender || '',
        height: response.data.height_cm?.toString() || '',
        current_weight: response.data.current_weight_kg?.toString() || '',
        goal_weight: response.data.goal_weight_kg?.toString() || '',
        activity_level: response.data.activity_level || '',
      });
    } catch (error: any) {
      if (error?.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      } else if (error?.response?.status === 404) {
        setError('Profile not found. Please complete onboarding.');
      } else {
        setError('Failed to load profile');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await updateProfile({
        age: parseInt(profileData.age),
        gender: profileData.gender,
        height: parseFloat(profileData.height),
        current_weight: parseFloat(profileData.current_weight),
        goal_weight: parseFloat(profileData.goal_weight),
        activity_level: profileData.activity_level,
      });
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      setError(error?.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
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
      
      <div className="lg:ml-64 min-h-screen">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-4xl font-bold text-white flex items-center gap-3">
              <User className="w-10 h-10 text-cyan-400" /> Profile
            </h1>
            <p className="text-gray-400">Manage your fitness profile</p>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="flex items-center gap-2 p-4 bg-[var(--error)]/10 border border-[var(--error)]/30 rounded-[var(--radius-lg)]">
              <AlertCircle className="w-5 h-5 text-[var(--error)]" />
              <p className="text-[var(--error)]">{error}</p>
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 p-4 bg-[var(--success)]/10 border border-[var(--success)]/30 rounded-[var(--radius-lg)]">
              <Save className="w-5 h-5 text-[var(--success)]" />
              <p className="text-[var(--success)]">{success}</p>
            </div>
          )}

          {/* Profile Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

            {/* Account Info */}
            <div className="pp-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <User className="w-6 h-6 text-[var(--brand-primary)]" />
                <h2 className="text-xl font-bold text-[var(--text-primary)]">Account Information</h2>
              </div>
              <div className="space-y-4">
                <input
                  type="text"
                  value={userInfo.firstname}
                  disabled
                  className="w-full px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-[var(--radius-md)] text-[var(--text-muted)] cursor-not-allowed"
                  placeholder="First Name"
                />
                <input
                  type="text"
                  value={userInfo.lastname}
                  disabled
                  className="w-full px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-[var(--radius-md)] text-[var(--text-muted)] cursor-not-allowed"
                  placeholder="Last Name"
                />
                <input
                  type="email"
                  value={userInfo.email}
                  disabled
                  className="w-full px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-[var(--radius-md)] text-[var(--text-muted)] cursor-not-allowed"
                  placeholder="Email"
                />
                <p className="text-xs text-[var(--text-muted)]">Contact support to change name or email</p>
              </div>
            </div>

            {/* Body Metrics */}
            <div className="pp-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <Activity className="w-6 h-6 text-[var(--brand-primary)]" />
                <h2 className="text-xl font-bold text-[var(--text-primary)]">Body Metrics</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="number"
                  value={profileData.height}
                  onChange={(e) => setProfileData({ ...profileData, height: e.target.value })}
                  placeholder="Height (cm)"
                  className="w-full px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-[var(--radius-md)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]"
                />
                <input
                  type="number"
                  value={profileData.current_weight}
                  onChange={(e) => setProfileData({ ...profileData, current_weight: e.target.value })}
                  placeholder="Current Weight (kg)"
                  className="w-full px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-[var(--radius-md)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]"
                />
                <input
                  type="number"
                  value={profileData.goal_weight}
                  onChange={(e) => setProfileData({ ...profileData, goal_weight: e.target.value })}
                  placeholder="Goal Weight (kg)"
                  className="w-full px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-[var(--radius-md)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]"
                />
                <input
                  type="number"
                  value={profileData.age}
                  onChange={(e) => setProfileData({ ...profileData, age: e.target.value })}
                  placeholder="Age"
                  className="w-full px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-[var(--radius-md)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]"
                />
              </div>
            </div>

            {/* Activity Level */}
            <div className="pp-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <TrendingUp className="w-6 h-6 text-[var(--brand-primary)]" />
                <h2 className="text-xl font-bold text-[var(--text-primary)]">Activity Level</h2>
              </div>
              <select
                value={profileData.activity_level}
                onChange={(e) => setProfileData({ ...profileData, activity_level: e.target.value })}
                className="w-full px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-[var(--radius-md)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]"
              >
                <option value="sedentary">Sedentary - Little or no exercise</option>
                <option value="light">Lightly Active - Exercise 1-3 days/week</option>
                <option value="moderate">Moderately Active - Exercise 3-5 days/week</option>
                <option value="very">Very Active - Exercise 6-7 days/week</option>
                <option value="extra">Extra Active - Physical job + exercise</option>
              </select>
            </div>

          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-4 pp-btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
        </main>
      </div>
    </div>
  );
}
