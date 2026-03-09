import client from './client';

export interface DashboardData {
  user: {
    name: string;
  };
  today: {
    workouts_completed: number;
    habits_logged: number;
  };
  recent_workouts: Array<{
    id: string;
    type: string;
    duration: number;
    date: string;
    exercise_count: number;
  }>;
  active_goals: Array<{
    id: string;
    name: string;
    type: string;
    target: number;
    progress: number;
    progress_percentage: number;
    deadline: string;
  }>;
  weekly_activity: Array<{
    date: string;
    workouts: number;
    habits: number;
  }>;
  pending_habits: Array<{ id: number; name: string }>;
  streaks: {
    current_workout_streak: number;
    longest_workout_streak: number;
  };
}

export const fetchDashboard = async (): Promise<DashboardData> => {
  const response = await client.get('/dashboard');
  return response.data.dashboard;
};