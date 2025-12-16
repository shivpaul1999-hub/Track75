
import { request, setAuthToken } from './client';
import { User } from '../types';

export async function login(credentials: { email: string; password?: string }): Promise<{ token: string; user: User }> {
  const data = await request<{ token: string; user: User }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });

  if (data.token) {
    setAuthToken(data.token);
  }
  return data;
}

export async function register(data: { name: string; email: string; password?: string; organizationName?: string }): Promise<{ token: string; user: User }> {
  const response = await request<{ token: string; user: User }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });

  if (response.token) {
    setAuthToken(response.token);
  }
  return response;
}

export async function getCurrentUser(): Promise<User> {
  return request<User>('/auth/me');
}
