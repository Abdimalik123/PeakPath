import { API_BASE_URL } from './config';

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
  const token = localStorage.getItem('token');
  
  const response = await fetch(`${API_BASE_URL}/dashboard`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch dashboard data');
  }

  const data = await response.json();
  return data.dashboard;
};