import { useState } from 'react';
import { Navigation } from '../components/Navigation';
import { PageHeader } from '../components/PageHeader';
import { Activity, Clock, MapPin, Heart, TrendingUp } from 'lucide-react';
import client from '../api/client';
import { useToast } from '../contexts/ToastContext';
import { useNavigate } from 'react-router-dom';

const CARDIO_TYPES = [
  { value: 'running', label: 'Running', icon: '🏃' },
  { value: 'cycling', label: 'Cycling', icon: '🚴' },
  { value: 'swimming', label: 'Swimming', icon: '🏊' },
  { value: 'rowing', label: 'Rowing', icon: '🚣' },
  { value: 'walking', label: 'Walking', icon: '🚶' }
];

export default function CardioLogger() {
  const [formData, setFormData] = useState({
    cardio_type: 'running',
    distance: '',
    duration: '',
    calories: '',
    notes: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.distance && !formData.duration) {
      showToast('Please enter distance or duration', 'error');
      return;
    }

    try {
      setLoading(true);
      const response = await client.post('/cardio', {
        ...formData,
        distance: formData.distance ? parseFloat(formData.distance) : null,
        duration: formData.duration ? parseInt(formData.duration) : null,
        calories: formData.calories ? parseInt(formData.calories) : null
      });

      if (response.data.success) {
        showToast(`Cardio logged! +${response.data.points_earned} points`, 'success');
        setFormData({
          cardio_type: 'running',
          distance: '',
          duration: '',
          calories: '',
          notes: '',
          date: new Date().toISOString().split('T')[0]
        });
      }
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to log cardio', 'error');
    } finally {
      setLoading(false);
    }
  };

  const selectedType = CARDIO_TYPES.find(t => t.value === formData.cardio_type);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <Navigation currentPage="/cardio" />
      <div className="lg:ml-64 min-h-screen">
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <PageHeader
            title="Log Cardio Workout"
            subtitle="Track your running, cycling, and other cardio activities"
          />

          <div className="bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-lg p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Cardio Type */}
              <div>
                <label className="block text-sm font-bold text-[var(--text-primary)] mb-3">
                  Activity Type
                </label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {CARDIO_TYPES.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, cardio_type: type.value })}
                      className={`p-4 rounded-lg border-2 transition ${
                        formData.cardio_type === type.value
                          ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)]/10'
                          : 'border-[var(--border-default)] hover:border-[var(--brand-primary)]/50'
                      }`}
                    >
                      <div className="text-3xl mb-2">{type.icon}</div>
                      <div className="text-sm font-medium text-[var(--text-primary)]">{type.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Distance and Duration */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-[var(--text-primary)] mb-2">
                    <MapPin className="w-4 h-4 inline mr-1" />
                    Distance (km)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.distance}
                    onChange={(e) => setFormData({ ...formData, distance: e.target.value })}
                    className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-lg px-4 py-3 text-[var(--text-primary)]"
                    placeholder="5.0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-[var(--text-primary)] mb-2">
                    <Clock className="w-4 h-4 inline mr-1" />
                    Duration (minutes)
                  </label>
                  <input
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-lg px-4 py-3 text-[var(--text-primary)]"
                    placeholder="30"
                  />
                </div>
              </div>

              {/* Calories and Date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-[var(--text-primary)] mb-2">
                    <TrendingUp className="w-4 h-4 inline mr-1" />
                    Calories Burned
                  </label>
                  <input
                    type="number"
                    value={formData.calories}
                    onChange={(e) => setFormData({ ...formData, calories: e.target.value })}
                    className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-lg px-4 py-3 text-[var(--text-primary)]"
                    placeholder="300"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-[var(--text-primary)] mb-2">
                    Date
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-lg px-4 py-3 text-[var(--text-primary)]"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-bold text-[var(--text-primary)] mb-2">
                  Notes (optional)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-lg px-4 py-3 text-[var(--text-primary)] resize-none"
                  rows={3}
                  placeholder="How did it feel? Any notes..."
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => navigate('/workouts')}
                  className="flex-1 px-6 py-3 bg-[var(--bg-tertiary)] text-[var(--text-primary)] font-bold rounded-lg hover:bg-[var(--bg-tertiary)]/80 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-[var(--brand-primary)] text-white font-bold rounded-lg hover:opacity-90 transition disabled:opacity-50"
                >
                  {loading ? 'Logging...' : `Log ${selectedType?.label}`}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
