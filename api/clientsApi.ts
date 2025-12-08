
import { Client } from '../types';
import { request } from './client';

export async function getClients(): Promise<Client[]> {
  return request<Client[]>('/clients');
}

export async function createClient(client: Omit<Client, 'id'>): Promise<Client> {
  return request<Client>('/clients', {
    method: 'POST',
    body: JSON.stringify(client),
  });
}

export async function updateClient(id: number, data: Partial<Client>): Promise<Client> {
  return request<Client>(`/clients/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteClient(id: number): Promise<void> {
  return request<void>(`/clients/${id}`, {
    method: 'DELETE',
  });
}
