import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './Card';
import { Button } from './Button';
import { Scale, TrendingUp, TrendingDown, Plus, X, Calendar } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useToast } from '../contexts/ToastContext';
import client from '../api/client';

interface WeightEntry {
  id: number;
  weight_kg: number;
  measured_at: string;
  notes?: string;
  body_fat_percentage?: number;
}

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
  const [weights, setWeights] = useState<WeightEntry[]>([]);
  const [stats, setStats] = useState<WeightStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLogModal, setShowLogModal] = useState(false);
  const [formData, setFormData] = useState({
    weight_kg: '',
    body_fat_percentage: '',
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
      const response = await client.post('/body-measurements', {
        weight_kg: parseFloat(formData.weight_kg),
        body_fat_percentage: formData.body_fat_percentage ? parseFloat(formData.body_fat_percentage) : null,
        notes: formData.notes || null,
        measured_at: formData.measured_at
      });

      if (response.data.success) {
        showToast('Weight logged successfully!', 'success');
        setShowLogModal(false);
        setFormData({
          weight_kg: '',
          body_fat_percentage: '',
          notes: '',
          measured_at: new Date().toISOString().split('T')[0]
        });
        fetchWeights();
        fetchStats();
      }
    } catch (error) {
      showToast('Failed to log weight', 'error');
    }
  };

  // Prepare chart data
  const chartData = weights
    .slice()
    .reverse()
    .map(w => ({
      date: new Date(w.measured_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      weight: w.weight_kg
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
              <CardTitle>Weight Tracking</CardTitle>
            </div>
            <Button onClick={() => setShowLogModal(true)} className="pp-btn-primary">
              <Plus className="w-4 h-4 mr-2" />
              Log Weight
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Stats Grid */}
          {stats && stats.current_weight && (
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
                    dataKey="weight"
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
              <p className="text-[var(--text-muted)] mb-4">No weight data yet</p>
              <Button onClick={() => setShowLogModal(true)} className="pp-btn-primary">
                Log Your First Weight
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Log Weight Modal */}
      {showLogModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--bg-secondary)] rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-[var(--text-primary)]">Log Weight</h3>
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