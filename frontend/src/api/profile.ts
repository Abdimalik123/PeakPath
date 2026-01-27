import client from './client';

export const getProfile = () => client.get('/profile');
export const createProfile = (data: any) => client.post('/profile', data);
export const updateProfile = (data: any) => client.put('/profile', data);
