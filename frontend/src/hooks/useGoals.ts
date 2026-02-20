import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';

interface Goal {
  id: number;
  user_id: number;
  name: string;
  type: string;
  target: number;
  progress: number;
  deadline: string;
  created_at: string;
  updated_at: string;
}

export function useGoals() {
  const navigate = useNavigate();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    goal_type: 'fitness',
    target: '',
    progress: '0',
    deadline: ''
  });

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await client.get('/goals');
      
      if (response.data.success) {
        setGoals(response.data.goals);
      } else {
        setError(response.data.message);
      }
    } catch (err: any) {
      if (err?.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        setError('Failed to load goals');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const response = await client.post('/goals', {
        name: formData.name,
        goal_type: formData.goal_type,
        target: parseInt(formData.target),
        progress: parseInt(formData.progress),
        deadline: formData.deadline
      });
      
      if (response.data.success) {
        setFormData({
          name: '',
          goal_type: 'fitness',
          target: '',
          progress: '0',
          deadline: ''
        });
        fetchGoals();
        return true;
      } else {
        setError(response.data.message);
        return false;
      }
    } catch (err) {
      setError('Failed to create goal');
      return false;
    }
  };

  const handleUpdateProgress = async (goalId: number, newProgress: number) => {
    try {
      const response = await client.put(`/goals/${goalId}`, { progress: newProgress });
      
      if (response.data.success) {
        fetchGoals();
        if (selectedGoal && selectedGoal.id === goalId) {
          setSelectedGoal({ ...selectedGoal, progress: newProgress });
        }
      }
    } catch (err) {
      setError('Failed to update progress');
    }
  };

  const handleDelete = async (goalId: number) => {
    if (!confirm('Delete this goal?')) return;

    try {
      const response = await client.delete(`/goals/${goalId}`);
      
      if (response.data.success) {
        fetchGoals();
        setSelectedGoal(null);
      }
    } catch (err) {
      setError('Failed to delete goal');
    }
  };

  const getProgressPercentage = (goal: Goal) => {
    return Math.min(Math.round((goal.progress / goal.target) * 100), 100);
  };

  const getDaysRemaining = (deadline: string) => {
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getGoalTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      'fitness': 'cyan',
      'weight': 'purple',
      'habit': 'blue',
      'skill': 'emerald',
      'other': 'violet'
    };
    return colors[type] || 'cyan';
  };

  return {
    goals,
    selectedGoal,
    setSelectedGoal,
    loading,
    error,
    formData,
    setFormData,
    handleSubmit,
    handleUpdateProgress,
    handleDelete,
    getProgressPercentage,
    getDaysRemaining,
    getGoalTypeColor
  };
}
