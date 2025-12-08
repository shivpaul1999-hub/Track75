
import { Organization } from '../types';
import { request } from './client';

export async function getOrganizations(): Promise<Organization[]> {
  return request<Organization[]>('/organizations');
}

export async function createOrganization(org: Omit<Organization, 'id'>): Promise<Organization> {
  return request<Organization>('/organizations', {
    method: 'POST',
    body: JSON.stringify(org),
  });
}

export async function updateOrganization(id: number, data: Partial<Organization>): Promise<Organization> {
  return request<Organization>(`/organizations/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}
