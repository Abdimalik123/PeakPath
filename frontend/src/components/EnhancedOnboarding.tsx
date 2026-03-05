import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { 
  User, 
  Scale, 
  Target, 
  Dumbbell, 
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Sparkles
} from 'lucide-react';
import client from '../api/client';

export function EnhancedOnboarding() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    // Step 1: Basic Info
    age: '',
    gender: '',
    
    // Step 2: Body Stats
    height: '',
    current_weight: '',
    
    // Step 3: Goals
    primary_goal: '',
    goal_weight: '',
    
    // Step 4: Experience
    fitness_level: '',
    workouts_per_week: '',
    
    // Step 5: Sample Workout
    create_sample: true
  });

  const totalSteps = 5;

  const handleNext = () => {
    // Validation
    if (step === 1 && (!formData.age || !formData.gender)) {
      showToast('Please complete all fields', 'warning');
      return;
    }
    if (step === 2 && (!formData.height || !formData.current_weight)) {
      showToast('Please enter your measurements', 'warning');
      return;
    }
    if (step === 3 && !formData.primary_goal) {
      showToast('Please select your primary goal', 'warning');
      return;
    }
    if (step === 4 && (!formData.fitness_level || !formData.workouts_per_week)) {
      showToast('Please complete your fitness profile', 'warning');
      return;
    }

    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleComplete = async () => {
    setLoading(true);

    try {
      // 1. Update user profile
      await client.put('/profile', {
        age: parseInt(formData.age),
        gender: formData.gender,
        height: parseInt(formData.height),
        fitness_level: formData.fitness_level,
        workout_frequency: parseInt(formData.workouts_per_week),
        primary_goal: formData.primary_goal
      });

      // 2. Log initial weight
      await client.post('/body-measurements', {
        weight_kg: parseFloat(formData.current_weight),
        measured_at: new Date().toISOString().split('T')[0],
        notes: 'Initial weight from onboarding'
      });

      // 3. Create weight goal if applicable
      if (formData.goal_weight && formData.primary_goal !== 'maintain_weight') {
        const target = parseFloat(formData.goal_weight);
        const current = parseFloat(formData.current_weight);
        const goalTitle = target < current ? 'Lose Weight' : 'Gain Weight';
        
        await client.post('/goals', {
          title: `Reach ${target}kg`,
          description: goalTitle,
          target: Math.abs(target - current),
          progress: 0,
          category: 'weight',
          deadline: null
        });
      }

      // 4. Create sample workout if selected
      if (formData.create_sample) {
        const sampleWorkout = {
          type: 'Full Body Workout',
          duration: 45,
          date: new Date().toISOString().split('T')[0],
          notes: 'Welcome workout! Log your first session.',
          exercises: [
            { exercise_name: 'Squat', sets: 3, reps: 10, weight: 0, notes: 'Bodyweight or barbell' },
            { exercise_name: 'Push-ups', sets: 3, reps: 10, weight: 0, notes: '' },
            { exercise_name: 'Plank', sets: 3, reps: 30, weight: 0, notes: '30 seconds each' }
          ]
        };

        await client.post('/workouts', sampleWorkout);
      }

      // 5. Create starter habits
      const starterHabits = [
        {
          name: 'Drink 2L Water',
          description: 'Stay hydrated throughout the day',
          frequency: 'daily',
          reminder_time: '09:00:00',
          next_occurrence: new Date().toISOString().split('T')[0]
        },
        {
          name: 'Get 8 Hours Sleep',
          description: 'Prioritize recovery and rest',
          frequency: 'daily',
          reminder_time: '22:00:00',
          next_occurrence: new Date().toISOString().split('T')[0]
        }
      ];

      for (const habit of starterHabits) {
        await client.post('/habits', habit);
      }

      showToast('Welcome to PeakPath! 🎉', 'success');
      
      // Mark onboarding as complete
      localStorage.setItem('onboarding_complete', 'true');
      
      // Redirect to dashboard
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);

    } catch (error: any) {
      console.error('Onboarding error:', error);
      showToast('Failed to complete onboarding', 'error');
    } finally {
      setLoading(false);
    }
  };

  const progressPercent = (step / totalSteps) * 100;

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-[var(--text-secondary)]">
              Step {step} of {totalSteps}
            </span>
            <span className="text-sm text-[var(--brand-primary)] font-medium">
              {Math.round(progressPercent)}%
            </span>
          </div>
          <div className="h-2 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-secondary)] transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Content Card */}
        <div className="bg-[var(--bg-secondary)] rounded-xl p-8 shadow-xl border border-[var(--border-default)]">
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-full bg-[var(--brand-primary)]/15 flex items-center justify-center mx-auto mb-4">
                  <User className="w-8 h-8 text-[var(--brand-primary)]" />
                </div>
                <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
                  Tell us about yourself
                </h2>
                <p className="text-[var(--text-secondary)]">
                  This helps us personalize your experience
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  Age
                </label>
                <input
                  type="number"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-primary)]"
                  placeholder="25"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  Gender
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {['male', 'female', 'other'].map((gender) => (
                    <button
                      key={gender}
                      type="button"
                      onClick={() => setFormData({ ...formData, gender })}
                      className={`px-4 py-3 rounded-lg font-medium transition ${
                        formData.gender === gender
                          ? 'bg-[var(--brand-primary)] text-white'
                          : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]'
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
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-full bg-[var(--brand-secondary)]/15 flex items-center justify-center mx-auto mb-4">
                  <Scale className="w-8 h-8 text-[var(--brand-secondary)]" />
                </div>
                <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
                  Your measurements
                </h2>
                <p className="text-[var(--text-secondary)]">
                  We'll track your progress from here
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  Height (cm)
                </label>
                <input
                  type="number"
                  value={formData.height}
                  onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-primary)]"
                  placeholder="175"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  Current Weight (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.current_weight}
                  onChange={(e) => setFormData({ ...formData, current_weight: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-primary)]"
                  placeholder="70.0"
                />
              </div>
            </div>
          )}

          {/* Step 3: Goals */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-full bg-purple-500/15 flex items-center justify-center mx-auto mb-4">
                  <Target className="w-8 h-8 text-purple-400" />
                </div>
                <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
                  What's your main goal?
                </h2>
                <p className="text-[var(--text-secondary)]">
                  We'll help you get there
                </p>
              </div>

              <div className="grid gap-3">
                {[
                  { value: 'lose_weight', label: 'Lose Weight', emoji: '📉' },
                  { value: 'gain_muscle', label: 'Build Muscle', emoji: '💪' },
                  { value: 'get_stronger', label: 'Get Stronger', emoji: '🏋️' },
                  { value: 'improve_endurance', label: 'Improve Endurance', emoji: '🏃' },
                  { value: 'maintain_weight', label: 'Maintain Weight', emoji: '⚖️' }
                ].map((goal) => (
                  <button
                    key={goal.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, primary_goal: goal.value })}
                    className={`px-4 py-4 rounded-lg font-medium transition text-left flex items-center gap-3 ${
                      formData.primary_goal === goal.value
                        ? 'bg-[var(--brand-primary)] text-white'
                        : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]'
                    }`}
                  >
                    <span className="text-2xl">{goal.emoji}</span>
                    <span>{goal.label}</span>
                  </button>
                ))}
              </div>

              {formData.primary_goal && formData.primary_goal !== 'maintain_weight' && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                    Target Weight (kg) - Optional
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.goal_weight}
                    onChange={(e) => setFormData({ ...formData, goal_weight: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-primary)]"
                    placeholder="65.0"
                  />
                </div>
              )}
            </div>
          )}

          {/* Step 4: Experience */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-full bg-orange-500/15 flex items-center justify-center mx-auto mb-4">
                  <Dumbbell className="w-8 h-8 text-orange-400" />
                </div>
                <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
                  Your fitness background
                </h2>
                <p className="text-[var(--text-secondary)]">
                  This helps us recommend the right programs
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  Fitness Level
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {['beginner', 'intermediate', 'advanced'].map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setFormData({ ...formData, fitness_level: level })}
                      className={`px-4 py-3 rounded-lg font-medium transition ${
                        formData.fitness_level === level
                          ? 'bg-[var(--brand-primary)] text-white'
                          : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]'
                      }`}
                    >
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  How many days per week can you workout?
                </label>
                <div className="grid grid-cols-4 gap-3">
                  {[2, 3, 4, 5, 6].map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => setFormData({ ...formData, workouts_per_week: days.toString() })}
                      className={`px-4 py-3 rounded-lg font-medium transition ${
                        formData.workouts_per_week === days.toString()
                          ? 'bg-[var(--brand-primary)] text-white'
                          : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]'
                      }`}
                    >
                      {days}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Ready to Start */}
          {step === 5 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-full bg-[var(--brand-primary)]/15 flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-[var(--brand-primary)]" />
                </div>
                <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
                  You're all set!
                </h2>
                <p className="text-[var(--text-secondary)]">
                  Let's kick things off
                </p>
              </div>

              <div className="bg-[var(--bg-tertiary)] rounded-lg p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-[var(--brand-primary)] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-[var(--text-primary)]">Profile Created</p>
                    <p className="text-sm text-[var(--text-secondary)]">Your fitness profile is ready</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-[var(--brand-primary)] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-[var(--text-primary)]">Initial Weight Logged</p>
                    <p className="text-sm text-[var(--text-secondary)]">Track your progress from {formData.current_weight}kg</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-[var(--brand-primary)] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-[var(--text-primary)]">Goals Set</p>
                    <p className="text-sm text-[var(--text-secondary)]">
                      {formData.primary_goal.replace('_', ' ').charAt(0).toUpperCase() + formData.primary_goal.slice(1).replace('_', ' ')}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-[var(--brand-primary)] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-[var(--text-primary)]">Sample Workout Created</p>
                    <p className="text-sm text-[var(--text-secondary)]">Ready to log on your dashboard</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-[var(--brand-primary)] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-[var(--text-primary)]">Healthy Habits Added</p>
                    <p className="text-sm text-[var(--text-secondary)]">Water intake & sleep tracking</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-[var(--brand-primary)]/10 to-[var(--brand-secondary)]/10 rounded-lg p-4 border border-[var(--brand-primary)]/20">
                <p className="text-sm text-[var(--text-secondary)] text-center">
                  <Sparkles className="w-4 h-4 inline mr-1" />
                  You'll earn points, unlock achievements, and level up as you track your fitness journey!
                </p>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-3 mt-8">
            {step > 1 && (
              <button
                onClick={handleBack}
                className="px-6 py-3 rounded-lg font-medium bg-[var(--bg-tertiary)] text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
            )}
            
            <button
              onClick={handleNext}
              disabled={loading}
              className="flex-1 px-6 py-3 rounded-lg font-medium bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-secondary)] text-white hover:opacity-90 transition flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Setting up...
                </>
              ) : step === totalSteps ? (
                <>
                  Complete Setup
                  <CheckCircle className="w-4 h-4" />
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Skip Option */}
        <div className="text-center mt-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}