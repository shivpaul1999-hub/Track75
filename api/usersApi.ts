
import { User } from '../types';
import { request } from './client';

export async function getUsers(): Promise<User[]> {
  return request<User[]>('/users');
}

export async function createUser(user: Omit<User, 'id'>): Promise<User> {
  return request<User>('/users', {
    method: 'POST',
    body: JSON.stringify(user),
  });
}

export async function updateUser(id: number, data: Partial<User>): Promise<User> {
  return request<User>(`/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteUser(id: number): Promise<void> {
  return request<void>(`/users/${id}`, {
    method: 'DELETE',
  });
}
