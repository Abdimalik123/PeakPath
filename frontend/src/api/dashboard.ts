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
    id: number;
    type: string;
    duration: number;
    date: string;
    exercise_count: number;
  }>;
  active_goals: Array<{
    id: number;
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
}

export const fetchDashboard = async (): Promise<DashboardData> => {
  const response = await client.get('/dashboard');
  return response.data.dashboard;
};