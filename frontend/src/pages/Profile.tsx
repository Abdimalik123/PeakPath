import { User, Activity, TrendingUp, Save, AlertCircle, LogOut } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
      <div className="min-h-screen bg-[#121420] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121420] text-gray-300">

      {/* Navigation */}
      <nav className="border-b border-white/5 bg-[#121420]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-8">
              <Link to="/dashboard" className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.5)]"></div>
                <h1 className="text-xl font-bold tracking-tight text-white">LIFE<span className="text-cyan-400">TRACKER</span></h1>
              </Link>

              <div className="hidden md:flex items-center gap-6">
                <Link to="/dashboard" className="text-gray-400 hover:text-white font-medium text-sm transition">DASHBOARD</Link>
                <Link to="/workouts" className="text-gray-400 hover:text-white font-medium text-sm transition">WORKOUTS</Link>
                <Link to="/habits" className="text-gray-400 hover:text-white font-medium text-sm transition">HABITS</Link>
                <Link to="/goals" className="text-gray-400 hover:text-white font-medium text-sm transition">GOALS</Link>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Link
                to="/profile"
                className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center text-[#121420] font-bold shadow-[0_0_20px_rgba(34,211,238,0.3)]"
              >
                U
              </Link>
              <button
                onClick={() => {
                  localStorage.removeItem('token');
                  localStorage.removeItem('onboarding_complete');
                  localStorage.removeItem('user');
                  navigate('/');
                }}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
            <div className="flex items-center gap-2 p-4 bg-red-500/20 border border-red-500/50 rounded-[2rem]">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <p className="text-red-300">{error}</p>
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 p-4 bg-green-500/20 border border-green-500/50 rounded-[2rem]">
              <Save className="w-5 h-5 text-green-400" />
              <p className="text-green-300">{success}</p>
            </div>
          )}

          {/* Profile Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

            {/* Account Info */}
            <div className="bg-[#1c1f2e]/70 border border-white/5 p-6 rounded-[2rem] backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-4">
                <User className="w-6 h-6 text-cyan-400" />
                <h2 className="text-xl font-bold text-white">Account Information</h2>
              </div>
              <div className="space-y-4">
                <input
                  type="text"
                  value={userInfo.firstname}
                  disabled
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-gray-400 cursor-not-allowed"
                  placeholder="First Name"
                />
                <input
                  type="text"
                  value={userInfo.lastname}
                  disabled
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-gray-400 cursor-not-allowed"
                  placeholder="Last Name"
                />
                <input
                  type="email"
                  value={userInfo.email}
                  disabled
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-gray-400 cursor-not-allowed"
                  placeholder="Email"
                />
                <p className="text-xs text-gray-500">Contact support to change name or email</p>
              </div>
            </div>

            {/* Body Metrics */}
            <div className="bg-[#1c1f2e]/70 border border-white/5 p-6 rounded-[2rem] backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-4">
                <Activity className="w-6 h-6 text-cyan-400" />
                <h2 className="text-xl font-bold text-white">Body Metrics</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="number"
                  value={profileData.height}
                  onChange={(e) => setProfileData({ ...profileData, height: e.target.value })}
                  placeholder="Height (cm)"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-cyan-500"
                />
                <input
                  type="number"
                  value={profileData.current_weight}
                  onChange={(e) => setProfileData({ ...profileData, current_weight: e.target.value })}
                  placeholder="Current Weight (kg)"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-cyan-500"
                />
                <input
                  type="number"
                  value={profileData.goal_weight}
                  onChange={(e) => setProfileData({ ...profileData, goal_weight: e.target.value })}
                  placeholder="Goal Weight (kg)"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-cyan-500"
                />
                <input
                  type="number"
                  value={profileData.age}
                  onChange={(e) => setProfileData({ ...profileData, age: e.target.value })}
                  placeholder="Age"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-cyan-500"
                />
              </div>
            </div>

            {/* Activity Level */}
            <div className="bg-[#1c1f2e]/70 border border-white/5 p-6 rounded-[2rem] backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-4">
                <TrendingUp className="w-6 h-6 text-cyan-400" />
                <h2 className="text-xl font-bold text-white">Activity Level</h2>
              </div>
              <select
                value={profileData.activity_level}
                onChange={(e) => setProfileData({ ...profileData, activity_level: e.target.value })}
                className="w-full px-4 py-3 bg-[#0f111a] border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-cyan-500"
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
            className="w-full py-4 bg-cyan-500 hover:bg-cyan-600 rounded-[2rem] font-bold text-white transition flex items-center justify-center gap-2 disabled:bg-gray-600"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
