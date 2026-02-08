import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
    <div className="min-h-screen bg-[#121420] text-gray-300 font-sans">
      {/* Navigation */}
      <nav className="border-b border-white/5 bg-[#121420]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.5)]"></div>
              <h1 className="text-xl font-bold tracking-tight text-white">LIFE<span className="text-cyan-400">TRACKER</span></h1>
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex items-center justify-center min-h-[calc(100vh-5rem)] px-4 py-12">
        <div className="w-full max-w-2xl">
          
          {/* Decorative glow effect */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] -z-10"></div>

          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">Complete Your Profile</h2>
            <p className="text-gray-400 text-sm uppercase tracking-wider">PERSONALIZED FITNESS SETUP</p>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between mb-4">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className="flex items-center gap-2"
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 font-bold transition-all ${
                      s < step
                        ? 'bg-cyan-500 border-cyan-500 text-[#121420]'
                        : s === step
                        ? 'border-cyan-500 text-cyan-400'
                        : 'border-white/10 text-gray-600'
                    }`}
                  >
                    {s < step ? (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      s
                    )}
                  </div>
                  <span className={`text-sm font-medium hidden sm:inline uppercase tracking-wider ${
                    s <= step ? 'text-white' : 'text-gray-600'
                  }`}>
                    {s === 1 ? 'Basic Info' : s === 2 ? 'Body Stats' : 'Activity'}
                  </span>
                </div>
              ))}
            </div>
            <div className="w-full bg-white/5 rounded-full h-2">
              <div
                className="bg-cyan-400 h-2 rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(34,211,238,0.5)]"
                style={{ width: `${(step / 3) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Card */}
          <div className="bg-[#1c1f2e] border border-white/5 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden">
            {/* Subtle background glow inside the card */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-cyan-500/10 rounded-full blur-[60px]"></div>

            <div className="relative z-10">
              {/* Step 1: Basic Info */}
              {step === 1 && (
                <div className="space-y-6">
                  <div className="mb-6">
                    <h3 className="text-2xl font-bold text-white mb-1">Basic Information</h3>
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Tell us about yourself</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Age</label>
                    <input
                      type="number"
                      value={formData.age}
                      onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                      placeholder="25"
                      className="w-full bg-[#0f111a] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Gender</label>
                    <div className="grid grid-cols-3 gap-3">
                      {['male', 'female', 'other'].map((gender) => (
                        <button
                          key={gender}
                          type="button"
                          onClick={() => setFormData({ ...formData, gender })}
                          className={`px-4 py-3 rounded-xl font-bold uppercase tracking-wider text-sm transition ${
                            formData.gender === gender
                              ? 'bg-cyan-500 text-[#121420]'
                              : 'bg-[#0f111a] text-gray-400 hover:bg-white/5 border border-white/10'
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
                  <div className="mb-6">
                    <h3 className="text-2xl font-bold text-white mb-1">Body Metrics</h3>
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Your physical measurements</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Height (cm)</label>
                    <input
                      type="number"
                      value={formData.height}
                      onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                      placeholder="175"
                      className="w-full bg-[#0f111a] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Current Weight (kg)</label>
                    <input
                      type="number"
                      value={formData.current_weight}
                      onChange={(e) => setFormData({ ...formData, current_weight: e.target.value })}
                      placeholder="70"
                      className="w-full bg-[#0f111a] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Goal Weight (kg)</label>
                    <input
                      type="number"
                      value={formData.goal_weight}
                      onChange={(e) => setFormData({ ...formData, goal_weight: e.target.value })}
                      placeholder="65"
                      className="w-full bg-[#0f111a] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
                    />
                  </div>
                </div>
              )}

              {/* Step 3: Activity Level */}
              {step === 3 && (
                <div className="space-y-6">
                  <div className="mb-6">
                    <h3 className="text-2xl font-bold text-white mb-1">Activity Level</h3>
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Select your fitness frequency</p>
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
                        type="button"
                        onClick={() => setFormData({ ...formData, activity_level: level.value })}
                        className={`w-full text-left px-4 py-4 rounded-xl transition border ${
                          formData.activity_level === level.value
                            ? 'bg-cyan-500 border-cyan-500 text-[#121420]'
                            : 'bg-[#0f111a] border-white/10 hover:bg-white/5'
                        }`}
                      >
                        <div className={`font-bold uppercase tracking-wider text-sm mb-1 ${
                          formData.activity_level === level.value ? 'text-[#121420]' : 'text-white'
                        }`}>
                          {level.label}
                        </div>
                        <div className={`text-xs ${
                          formData.activity_level === level.value ? 'text-[#121420]/70' : 'text-gray-500'
                        }`}>
                          {level.desc}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex gap-3 mt-8">
                {step > 1 && (
                  <button
                    type="button"
                    onClick={handleBack}
                    className="px-6 py-4 bg-[#0f111a] hover:bg-white/5 border border-white/10 rounded-xl font-bold uppercase tracking-wider text-sm text-white transition"
                  >
                    Back
                  </button>
                )}
                {step < 3 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={!isStepValid()}
                    className={`flex-1 px-6 py-4 rounded-xl font-bold uppercase tracking-wider text-sm transition shadow-[0_0_20px_rgba(34,211,238,0.3)] ${
                      isStepValid()
                        ? 'bg-cyan-500 hover:bg-cyan-400 text-[#121420]'
                        : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    Continue
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={!isStepValid() || loading}
                    className={`flex-1 px-6 py-4 rounded-xl font-bold uppercase tracking-wider text-sm transition shadow-[0_0_20px_rgba(34,211,238,0.3)] ${
                      isStepValid() && !loading
                        ? 'bg-cyan-500 hover:bg-cyan-400 text-[#121420]'
                        : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {loading ? 'Initializing...' : 'Complete Setup'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Security Badge */}
          <div className="mt-8 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/5">
              <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span className="text-xs text-gray-500 uppercase tracking-wider">SECURE & PRIVATE</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}