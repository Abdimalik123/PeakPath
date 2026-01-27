import client from './client';

export const login = (credentials: { email: string; password: string }) =>
  client.post('/login', credentials); // backend should return JWT

export const register = (data: {
    firstname: string;
    lastname: string;
    email: string;
    password: string;
    confirm_password: string;
}) =>
  client.post('/register', data);

export const logout = () => {
  localStorage.removeItem('token');
};