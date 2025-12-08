
import { FeedEntry } from '../types';
import { request } from './client';

export async function getFeedEntries(): Promise<FeedEntry[]> {
  return request<FeedEntry[]>('/feed_entries');
}

export async function createFeedEntry(entry: Omit<FeedEntry, 'id'>): Promise<FeedEntry> {
  return request<FeedEntry>('/feed_entries', {
    method: 'POST',
    body: JSON.stringify(entry),
  });
}

export async function updateFeedEntry(id: number, data: Partial<FeedEntry>): Promise<FeedEntry> {
  return request<FeedEntry>(`/feed_entries/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteFeedEntry(id: number): Promise<void> {
  return request<void>(`/feed_entries/${id}`, {
    method: 'DELETE',
  });
}
