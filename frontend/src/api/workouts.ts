import client from './client';

export const fetchWorkouts = () => client.get('/workouts');
export const fetchWorkout = (id: number) => client.get(`/workouts/${id}`);
export const createWorkout = (data: any) => client.post('/workouts', data);
export const updateWorkout = (id: string, data: any) => client.put(`/workouts/${id}`, data);
export const deleteWorkout = (id: string) => client.delete(`/workouts/${id}`);