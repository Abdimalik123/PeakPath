import client from './client';

export const fetchGoals = () => client.get('/goals');
export const createGoal = (data: any) => client.post('/goals', data);
export const updateGoal = (id: string, data: any) => client.put(`/goals/${id}`, data);
export const deleteGoal = (id: string) => client.delete(`/goals/${id}`);