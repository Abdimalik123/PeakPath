import client from './client';

export const fetchHabits = () => client.get('/habits');
export const createHabit = (data: any) => client.post('/habits', data);
export const updateHabit = (id: string, data: any) => client.put(`/habits/${id}`, data);
export const deleteHabit = (id: string) => client.delete(`/habits/${id}`);
export const logHabit = (id: number, data: any) => client.post(`/habits/${id}/log`, data);