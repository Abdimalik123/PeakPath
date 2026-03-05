import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './Card';
import { Button } from './Button';
import { Scale, TrendingUp, TrendingDown, Plus, X, Calendar } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useToast } from '../contexts/ToastContext';
import client from '../api/client';

interface MeasurementEntry {
  id: number;
  weight_kg: number;
  measured_at: string;
  notes?: string;
  body_fat_percentage?: number;
  chest?: number;
  waist?: number;
  hips?: number;
  bicep_left?: number;
  bicep_right?: number;
  thigh_left?: number;
  thigh_right?: number;
  calf_left?: number;
  calf_right?: number;
  neck?: number;
  shoulders?: number;
}

type MeasurementKey = 'weight_kg' | 'body_fat_percentage' | 'chest' | 'waist' | 'hips' | 'bicep_left' | 'thigh_left' | 'neck' | 'shoulders';

const MEASUREMENT_OPTIONS: { key: MeasurementKey; label: string; unit: string }[] = [
  { key: 'weight_kg', label: 'Weight', unit: 'kg' },
  { key: 'body_fat_percentage', label: 'Body Fat', unit: '%' },
  { key: 'chest', label: 'Chest', unit: 'cm' },
  { key: 'waist', label: 'Waist', unit: 'cm' },
  { key: 'hips', label: 'Hips', unit: 'cm' },
  { key: 'bicep_left', label: 'Biceps', unit: 'cm' },
  { key: 'thigh_left', label: 'Thighs', unit: 'cm' },
  { key: 'neck', label: 'Neck', unit: 'cm' },
  { key: 'shoulders', label: 'Shoulders', unit: 'cm' },
];

interface WeightStats {
  current_weight: number;
  starting_weight: number;
  total_change: number;
  lowest_weight: number;
  highest_weight: number;
  weekly_change?: number;
  monthly_change?: number;
}

export function WeightTracker() {
  const { showToast } = useToast();
  const [weights, setWeights] = useState<MeasurementEntry[]>([]);
  const [stats, setStats] = useState<WeightStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLogModal, setShowLogModal] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<MeasurementKey>('weight_kg');
  const [formData, setFormData] = useState({
    weight_kg: '',
    body_fat_percentage: '',
    chest: '',
    waist: '',
    hips: '',
    bicep_left: '',
    thigh_left: '',
    neck: '',
    shoulders: '',
    notes: '',
    measured_at: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchWeights();
    fetchStats();
  }, []);

  const fetchWeights = async () => {
    try {
      const response = await client.get('/body-measurements?days=90');
      if (response.data.success) {
        setWeights(response.data.measurements);
      }
    } catch (error) {
      console.error('Failed to fetch weights:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await client.get('/body-measurements/stats');
      if (response.data.success) {
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.weight_kg) {
      showToast('Please enter your weight', 'error');
      return;
    }

    try {
      const payload: Record<string, any> = {
        weight_kg: parseFloat(formData.weight_kg),
        notes: formData.notes || null,
        measured_at: formData.measured_at
      };
      const optionalFields = ['body_fat_percentage', 'chest', 'waist', 'hips', 'bicep_left', 'thigh_left', 'neck', 'shoulders'] as const;
      for (const field of optionalFields) {
        if (formData[field]) payload[field] = parseFloat(formData[field]);
      }

      const response = await client.post('/body-measurements', payload);

      if (response.data.success) {
        showToast('Measurements logged successfully!', 'success');
        setShowLogModal(false);
        setFormData({
          weight_kg: '', body_fat_percentage: '', chest: '', waist: '', hips: '',
          bicep_left: '', thigh_left: '', neck: '', shoulders: '',
          notes: '', measured_at: new Date().toISOString().split('T')[0]
        });
        fetchWeights();
        fetchStats();
      }
    } catch (error) {
      showToast('Failed to log weight', 'error');
    }
  };

  const selectedOption = MEASUREMENT_OPTIONS.find(o => o.key === selectedMetric)!;

  // Prepare chart data for selected metric
  const chartData = weights
    .slice()
    .filter(w => w[selectedMetric] != null)
    .reverse()
    .map(w => ({
      date: new Date(w.measured_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: w[selectedMetric] as number
    }));

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <div className="w-8 h-8 border-4 border-[var(--brand-primary)] border-t-transparent rounded-full animate-spin mx-auto"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Scale className="w-5 h-5 text-[var(--brand-primary)]" />
              <CardTitle>Body Tracking</CardTitle>
            </div>
            <Button onClick={() => setShowLogModal(true)} className="pp-btn-primary">
              <Plus className="w-4 h-4 mr-2" />
              Log Measurements
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Metric Selector */}
          <div className="flex gap-1 mb-4 overflow-x-auto pb-1">
            {MEASUREMENT_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                onClick={() => setSelectedMetric(opt.key)}
                className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                  selectedMetric === opt.key
                    ? 'bg-[var(--brand-primary)] text-white'
                    : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Stats Grid */}
          {selectedMetric === 'weight_kg' && stats && stats.current_weight && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="p-4 rounded-lg bg-[var(--bg-tertiary)]">
                <p className="text-xs text-[var(--text-muted)] mb-1">Current</p>
                <p className="text-2xl font-bold text-[var(--text-primary)]">
                  {stats.current_weight.toFixed(1)} kg
                </p>
              </div>
              
              <div className="p-4 rounded-lg bg-[var(--bg-tertiary)]">
                <p className="text-xs text-[var(--text-muted)] mb-1">Total Change</p>
                <p className={`text-2xl font-bold flex items-center gap-1 ${
                  stats.total_change > 0 ? 'text-orange-500' : stats.total_change < 0 ? 'text-[var(--brand-primary)]' : 'text-[var(--text-primary)]'
                }`}>
                  {stats.total_change > 0 && <TrendingUp className="w-5 h-5" />}
                  {stats.total_change < 0 && <TrendingDown className="w-5 h-5" />}
                  {stats.total_change >= 0 ? '+' : ''}{stats.total_change.toFixed(1)} kg
                </p>
              </div>
              
              {stats.weekly_change !== undefined && (
                <div className="p-4 rounded-lg bg-[var(--bg-tertiary)]">
                  <p className="text-xs text-[var(--text-muted)] mb-1">This Week</p>
                  <p className={`text-xl font-bold ${
                    stats.weekly_change > 0 ? 'text-orange-500' : stats.weekly_change < 0 ? 'text-[var(--brand-primary)]' : 'text-[var(--text-primary)]'
                  }`}>
                    {stats.weekly_change >= 0 ? '+' : ''}{stats.weekly_change.toFixed(1)} kg
                  </p>
                </div>
              )}
              
              {stats.monthly_change !== undefined && (
                <div className="p-4 rounded-lg bg-[var(--bg-tertiary)]">
                  <p className="text-xs text-[var(--text-muted)] mb-1">This Month</p>
                  <p className={`text-xl font-bold ${
                    stats.monthly_change > 0 ? 'text-orange-500' : stats.monthly_change < 0 ? 'text-[var(--brand-primary)]' : 'text-[var(--text-primary)]'
                  }`}>
                    {stats.monthly_change >= 0 ? '+' : ''}{stats.monthly_change.toFixed(1)} kg
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Chart */}
          {chartData.length > 0 ? (
            <div className="h-64 mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis 
                    dataKey="date" 
                    stroke="var(--text-muted)"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis 
                    stroke="var(--text-muted)"
                    style={{ fontSize: '12px' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--bg-secondary)',
                      border: '1px solid var(--border-default)',
                      borderRadius: 'var(--radius-md)',
                      color: 'var(--text-primary)'
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    name={`${selectedOption.label} (${selectedOption.unit})`}
                    stroke="var(--brand-primary)"
                    strokeWidth={2}
                    dot={{ fill: 'var(--brand-primary)', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-center py-12">
              <Scale className="w-16 h-16 text-[var(--text-muted)] mx-auto mb-4 opacity-50" />
              <p className="text-[var(--text-muted)] mb-4">No {selectedOption.label.toLowerCase()} data yet</p>
              <Button onClick={() => setShowLogModal(true)} className="pp-btn-primary">
                Log Your First Measurements
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Log Weight Modal */}
      {showLogModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--bg-secondary)] rounded-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-[var(--text-primary)]">Log Measurements</h3>
              <button
                onClick={() => setShowLogModal(false)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  Weight (kg) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.weight_kg}
                  onChange={(e) => setFormData({ ...formData, weight_kg: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-primary)]"
                  placeholder="70.5"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  Body Fat % (optional)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.body_fat_percentage}
                  onChange={(e) => setFormData({ ...formData, body_fat_percentage: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-primary)]"
                  placeholder="15.0"
                />
              </div>

              {/* Body Circumference Measurements */}
              <div className="border-t border-[var(--border-default)] pt-3 mt-3">
                <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">Circumference (cm) - optional</p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: 'chest' as const, label: 'Chest' },
                    { key: 'waist' as const, label: 'Waist' },
                    { key: 'hips' as const, label: 'Hips' },
                    { key: 'bicep_left' as const, label: 'Biceps' },
                    { key: 'thigh_left' as const, label: 'Thighs' },
                    { key: 'neck' as const, label: 'Neck' },
                    { key: 'shoulders' as const, label: 'Shoulders' },
                  ].map(({ key, label }) => (
                    <div key={key}>
                      <label className="block text-xs text-[var(--text-muted)] mb-1">{label}</label>
                      <input
                        type="number"
                        step="0.1"
                        value={formData[key]}
                        onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                        className="w-full px-3 py-1.5 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-default)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--brand-primary)]"
                        placeholder="0.0"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Date
                </label>
                <input
                  type="date"
                  value={formData.measured_at}
                  onChange={(e) => setFormData({ ...formData, measured_at: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-primary)]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">
                  Notes (optional)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-primary)]"
                  rows={2}
                  placeholder="How are you feeling today?"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="flex-1 pp-btn-secondary"
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1 pp-btn-primary">
                  Save
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}