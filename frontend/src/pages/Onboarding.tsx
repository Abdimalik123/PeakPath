import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, User, Target, TrendingUp, CheckCircle } from 'lucide-react';
import { createProfile } from '../api/profile';

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    age: '',
    gender: '',
    height: '',
    current_weight: '',
    goal_weight: '',
    activity_level: '',
  });

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await createProfile({
        age: parseInt(formData.age) || 0,
        gender: formData.gender,
        height: parseFloat(formData.height) || 0,
        current_weight: parseFloat(formData.current_weight),
        goal_weight: parseFloat(formData.goal_weight),
        activity_level: formData.activity_level,
      });
      
      // Mark onboarding as complete
      localStorage.setItem('onboarding_complete', 'true');
      navigate('/dashboard');
    } catch (error) {
      console.error('Failed to create profile:', error);
      alert('Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isStepValid = () => {
    if (step === 1) {
      return formData.age && formData.gender;
    }
    if (step === 2) {
      return formData.height && formData.current_weight && formData.goal_weight;
    }
    if (step === 3) {
      return formData.activity_level;
    }
    return false;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-950 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Activity className="w-10 h-10 text-emerald-400" />
            <span className="text-3xl font-bold text-white">Elevate</span>
          </div>
          <p className="text-gray-400">Let's personalize your fitness journey</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`flex items-center gap-2 ${
                  s < step ? 'text-emerald-400' : s === step ? 'text-white' : 'text-gray-600'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                    s < step
                      ? 'bg-emerald-500 border-emerald-500'
                      : s === step
                      ? 'border-emerald-500'
                      : 'border-gray-600'
                  }`}
                >
                  {s < step ? <CheckCircle className="w-5 h-5" /> : s}
                </div>
                <span className="text-sm font-medium hidden sm:inline">
                  {s === 1 ? 'Basic Info' : s === 2 ? 'Body Stats' : 'Activity Level'}
                </span>
              </div>
            ))}
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Card */}
        <div className="bg-slate-900/50 backdrop-blur-md rounded-2xl border border-emerald-900/50 p-8 shadow-2xl">
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <User className="w-8 h-8 text-emerald-400" />
                <h2 className="text-2xl font-bold text-white">Tell us about yourself</h2>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Age</label>
                <input
                  type="number"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  placeholder="25"
                  className="w-full px-4 py-3 bg-white/5 border border-emerald-900/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Gender</label>
                <div className="grid grid-cols-3 gap-3">
                  {['male', 'female', 'other'].map((gender) => (
                    <button
                      key={gender}
                      onClick={() => setFormData({ ...formData, gender })}
                      className={`px-4 py-3 rounded-xl font-medium transition ${
                        formData.gender === gender
                          ? 'bg-emerald-600 text-white'
                          : 'bg-white/5 text-gray-400 hover:bg-white/10'
                      }`}
                    >
                      {gender.charAt(0).toUpperCase() + gender.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Body Stats */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <Target className="w-8 h-8 text-emerald-400" />
                <h2 className="text-2xl font-bold text-white">Your body metrics</h2>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Height (cm)</label>
                <input
                  type="number"
                  value={formData.height}
                  onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                  placeholder="175"
                  className="w-full px-4 py-3 bg-white/5 border border-emerald-900/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Current Weight (kg)
                </label>
                <input
                  type="number"
                  value={formData.current_weight}
                  onChange={(e) => setFormData({ ...formData, current_weight: e.target.value })}
                  placeholder="70"
                  className="w-full px-4 py-3 bg-white/5 border border-emerald-900/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Goal Weight (kg)
                </label>
                <input
                  type="number"
                  value={formData.goal_weight}
                  onChange={(e) => setFormData({ ...formData, goal_weight: e.target.value })}
                  placeholder="65"
                  className="w-full px-4 py-3 bg-white/5 border border-emerald-900/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          )}

          {/* Step 3: Activity Level */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <TrendingUp className="w-8 h-8 text-emerald-400" />
                <h2 className="text-2xl font-bold text-white">Activity level</h2>
              </div>

              <div className="space-y-3">
                {[
                  { value: 'sedentary', label: 'Sedentary', desc: 'Little or no exercise' },
                  { value: 'light', label: 'Lightly Active', desc: 'Exercise 1-3 days/week' },
                  { value: 'moderate', label: 'Moderately Active', desc: 'Exercise 3-5 days/week' },
                  { value: 'very', label: 'Very Active', desc: 'Exercise 6-7 days/week' },
                  { value: 'extra', label: 'Extra Active', desc: 'Physical job + exercise' },
                ].map((level) => (
                  <button
                    key={level.value}
                    onClick={() => setFormData({ ...formData, activity_level: level.value })}
                    className={`w-full text-left px-4 py-4 rounded-xl transition ${
                      formData.activity_level === level.value
                        ? 'bg-emerald-600 border-2 border-emerald-500'
                        : 'bg-white/5 border-2 border-transparent hover:bg-white/10'
                    }`}
                  >
                    <div className="font-semibold text-white">{level.label}</div>
                    <div className="text-sm text-gray-400">{level.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-3 mt-8">
            {step > 1 && (
              <button
                onClick={handleBack}
                className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-emerald-900/50 rounded-xl font-semibold text-white transition"
              >
                Back
              </button>
            )}
            {step < 3 ? (
              <button
                onClick={handleNext}
                disabled={!isStepValid()}
                className="flex-1 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-xl font-semibold text-white transition"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!isStepValid() || loading}
                className="flex-1 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-xl font-semibold text-white transition"
              >
                {loading ? 'Saving...' : 'Complete Setup'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
