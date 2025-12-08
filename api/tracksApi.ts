
import { Track } from '../types';
import { request } from './client';

export async function getTracks(): Promise<Track[]> {
  return request<Track[]>('/tracks');
}

export async function createTrack(track: Omit<Track, 'id'>): Promise<Track> {
  return request<Track>('/tracks', {
    method: 'POST',
    body: JSON.stringify(track),
  });
}

export async function updateTrack(id: number, data: Partial<Track>): Promise<Track> {
  return request<Track>(`/tracks/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteTrack(id: number): Promise<void> {
  return request<void>(`/tracks/${id}`, {
    method: 'DELETE',
  });
}
