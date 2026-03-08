import client from './client';

export const login = (credentials: { email: string; password: string }) =>
  client.post('/login', credentials);

export const register = (data: {
  firstname: string;
  lastname: string;
  email: string;
  password: string;
  confirm_password: string;
}) =>
  client.post('/register', data);

export const forgotPassword = (email: string) =>
  client.post('/forgot-password', { email });

export const resetPassword = (data: {
  token: string;
  new_password: string;
  confirm_password: string;
}) =>
  client.post('/reset-password', data);

// Logout is handled by AuthContext.logout()