import { useState, useEffect } from 'react';
import { Navigation } from '../components/Navigation';
import { PageHeader } from '../components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card';
import { Calendar, Plus, X, ChevronLeft, ChevronRight, Clock, Dumbbell, Check } from 'lucide-react';
import { Button } from '../components/Button';
import { useToast } from '../contexts/ToastContext';
import client from '../api/client';

interface ScheduledWorkout {
  id: number;
  title: string;
  scheduled_date: string;
  scheduled_time: string | null;
  workout_type: string | null;
  duration_planned: number | null;
  notes: string | null;
  completed: boolean;
  workout_id: number | null;
}

export default function Schedule() {
  const { showToast } = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [schedules, setSchedules] = useState<ScheduledWorkout[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    scheduled_date: '',
    scheduled_time: '',
    workout_type: '',
    duration_planned: '',
    notes: ''
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  useEffect(() => {
    fetchSchedule();
  }, [month, year]);

  const fetchSchedule = async () => {
    try {
      const start = new Date(year, month, 1).toISOString().split('T')[0];
      const end = new Date(year, month + 1, 0).toISOString().split('T')[0];
      const response = await client.get(`/schedule?start=${start}&end=${end}`);
      if (response.data.success) {
        setSchedules(response.data.scheduled_workouts);
      }
    } catch (error) {
      console.error('Failed to fetch schedule:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.scheduled_date) {
      showToast('Title and date are required', 'error');
      return;
    }

    try {
      const payload: Record<string, any> = {
        title: formData.title,
        scheduled_date: formData.scheduled_date,
      };
      if (formData.scheduled_time) payload.scheduled_time = formData.scheduled_time;
      if (formData.workout_type) payload.workout_type = formData.workout_type;
      if (formData.duration_planned) payload.duration_planned = parseInt(formData.duration_planned);
      if (formData.notes) payload.notes = formData.notes;

      const response = await client.post('/schedule', payload);
      if (response.data.success) {
        showToast('Workout scheduled!', 'success');
        setShowModal(false);
        setFormData({ title: '', scheduled_date: '', scheduled_time: '', workout_type: '', duration_planned: '', notes: '' });
        fetchSchedule();
      }
    } catch (error) {
      showToast('Failed to schedule workout', 'error');
    }
  };

  const handleComplete = async (id: number) => {
    try {
      const response = await client.put(`/schedule/${id}`, { completed: true });
      if (response.data.success) {
        showToast('Marked as completed!', 'success');
        fetchSchedule();
      }
    } catch (error) {
      showToast('Failed to update', 'error');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await client.delete(`/schedule/${id}`);
      if (response.data.success) {
        fetchSchedule();
      }
    } catch (error) {
      showToast('Failed to delete', 'error');
    }
  };

  const openModalForDate = (dateStr: string) => {
    setSelectedDate(dateStr);
    setFormData({ ...formData, scheduled_date: dateStr });
    setShowModal(true);
  };

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  // Calendar grid
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date().toISOString().split('T')[0];

  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) calendarDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d);

  const getSchedulesForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return schedules.filter(s => s.scheduled_date === dateStr);
  };

  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)]">
        <Navigation currentPage="/schedule" />
        <div className="lg:ml-64 min-h-screen flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-[var(--brand-primary)] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <Navigation currentPage="/schedule" />

      <div className="lg:ml-64 min-h-screen pt-16 lg:pt-0">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
          <PageHeader
            title="Workout Schedule"
            subtitle="Plan and track your upcoming workouts"
            actionButton={{
              label: 'Schedule Workout',
              onClick: () => {
                setFormData({ ...formData, scheduled_date: today });
                setShowModal(true);
              },
              icon: <Plus className="w-5 h-5" />
            }}
          />

          {/* Calendar Header */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <button onClick={prevMonth} className="p-2 hover:bg-[var(--bg-tertiary)] rounded-lg transition">
                  <ChevronLeft className="w-5 h-5 text-[var(--text-primary)]" />
                </button>
                <CardTitle>{monthName}</CardTitle>
                <button onClick={nextMonth} className="p-2 hover:bg-[var(--bg-tertiary)] rounded-lg transition">
                  <ChevronRight className="w-5 h-5 text-[var(--text-primary)]" />
                </button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Day headers */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                  <div key={d} className="text-center text-xs font-bold text-[var(--text-muted)] py-2">{d}</div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, idx) => {
                  if (day === null) {
                    return <div key={`empty-${idx}`} className="min-h-[80px]" />;
                  }

                  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const daySchedules = getSchedulesForDay(day);
                  const isToday = dateStr === today;

                  return (
                    <div
                      key={day}
                      onClick={() => openModalForDate(dateStr)}
                      className={`min-h-[80px] p-1 rounded-lg border cursor-pointer transition hover:border-[var(--brand-primary)] ${
                        isToday
                          ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)]/5'
                          : 'border-[var(--border-subtle)] bg-[var(--bg-secondary)]'
                      }`}
                    >
                      <span className={`text-xs font-bold ${isToday ? 'text-[var(--brand-primary)]' : 'text-[var(--text-muted)]'}`}>
                        {day}
                      </span>
                      <div className="mt-1 space-y-0.5">
                        {daySchedules.slice(0, 2).map(s => (
                          <div
                            key={s.id}
                            onClick={(e) => e.stopPropagation()}
                            className={`text-[10px] px-1 py-0.5 rounded truncate ${
                              s.completed
                                ? 'bg-[var(--success)]/20 text-[var(--success)]'
                                : 'bg-[var(--brand-primary)]/20 text-[var(--brand-primary)]'
                            }`}
                          >
                            {s.title}
                          </div>
                        ))}
                        {daySchedules.length > 2 && (
                          <div className="text-[10px] text-[var(--text-muted)]">+{daySchedules.length - 2} more</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Workouts List */}
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Workouts</CardTitle>
            </CardHeader>
            <CardContent>
              {schedules.filter(s => !s.completed && s.scheduled_date >= today).length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-3 opacity-50" />
                  <p className="text-[var(--text-muted)] text-sm">No upcoming workouts scheduled</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {schedules
                    .filter(s => !s.completed && s.scheduled_date >= today)
                    .map(s => (
                      <div key={s.id} className="flex items-center justify-between p-4 bg-[var(--bg-tertiary)] rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-[var(--brand-primary)]/20 flex items-center justify-center">
                            <Dumbbell className="w-5 h-5 text-[var(--brand-primary)]" />
                          </div>
                          <div>
                            <p className="font-bold text-sm text-[var(--text-primary)]">{s.title}</p>
                            <div className="flex gap-3 text-xs text-[var(--text-muted)]">
                              <span>{new Date(s.scheduled_date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                              {s.scheduled_time && (
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" /> {s.scheduled_time}
                                </span>
                              )}
                              {s.duration_planned && <span>{s.duration_planned} min</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleComplete(s.id)}
                            className="p-2 hover:bg-[var(--success)]/10 rounded-lg transition text-[var(--success)]"
                            title="Mark complete"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(s.id)}
                            className="p-2 hover:bg-[var(--error)]/10 rounded-lg transition text-[var(--error)]"
                            title="Delete"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>

      {/* Schedule Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--bg-secondary)] rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-[var(--text-primary)]">Schedule Workout</h3>
              <button onClick={() => setShowModal(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-primary)]"
                  placeholder="e.g., Push Day, Cardio"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Date *</label>
                  <input
                    type="date"
                    value={formData.scheduled_date}
                    onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-primary)]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Time</label>
                  <input
                    type="time"
                    value={formData.scheduled_time}
                    onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-primary)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Workout Type</label>
                  <input
                    type="text"
                    value={formData.workout_type}
                    onChange={(e) => setFormData({ ...formData, workout_type: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-primary)]"
                    placeholder="Upper Body"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Duration (min)</label>
                  <input
                    type="number"
                    value={formData.duration_planned}
                    onChange={(e) => setFormData({ ...formData, duration_planned: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-primary)]"
                    placeholder="60"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-primary)]"
                  rows={2}
                  placeholder="Focus on heavy compounds"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="button" onClick={() => setShowModal(false)} className="flex-1 pp-btn-secondary">
                  Cancel
                </Button>
                <Button type="submit" className="flex-1 pp-btn-primary">
                  Schedule
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
