import { Notification } from '../types';
import { handleMockRequest } from './mockService';

export const getNotifications = async (userId: number): Promise<Notification[]> => {
    return handleMockRequest<Notification[]>('/notifications', 'GET');
};

export const markNotificationAsRead = async (notificationId: number): Promise<Notification> => {
    return handleMockRequest<Notification>(`/notifications/${notificationId}/read`, 'PUT');
};

export const respondToInvite = async (notificationId: number, action: 'accept' | 'decline'): Promise<Notification> => {
    return handleMockRequest<Notification>(`/notifications/${notificationId}/respond`, 'POST', JSON.stringify({ action }));
};

export const markAllNotificationsAsRead = async (userId: number): Promise<void> => {
    return handleMockRequest<void>('/notifications/mark-all-read', 'PUT');
};
