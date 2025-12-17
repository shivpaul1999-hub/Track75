import React, { useRef, useEffect } from 'react';
import { Notification } from '../types';
import { markNotificationAsRead, respondToInvite, markAllNotificationsAsRead } from '../api/notificationsApi';
import Icon from './Icon';

interface NotificationCenterProps {
    userId: number;
    isOpen: boolean;
    onClose: () => void;
    notifications: Notification[];
    onNotificationsUpdate: () => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ userId, isOpen, onClose, notifications, onNotificationsUpdate }) => {
    const centerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (centerRef.current && !centerRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);

    const handleMarkAsRead = async (id: number) => {
        await markNotificationAsRead(id);
        onNotificationsUpdate();
    };

    const handleMarkAllAsRead = async () => {
        await markAllNotificationsAsRead(userId);
        onNotificationsUpdate();
    };

    const handleInviteResponse = async (id: number, action: 'accept' | 'decline') => {
        await respondToInvite(id, action);
        onNotificationsUpdate();
    };

    if (!isOpen) return null;

    return (
        <div ref={centerRef} className="absolute top-16 right-4 w-96 max-h-[80vh] bg-white dark:bg-dark-card rounded-xl shadow-2xl border border-gray-200 dark:border-dark-elevated z-50 animate-fade-in flex flex-col overflow-hidden">
            <div className="p-4 border-b border-gray-100 dark:border-dark-elevated flex justify-between items-center bg-gray-50/50 dark:bg-dark-elevated/30">
                <div className="flex items-center gap-2">
                    <h3 className="font-bold text-gray-800 dark:text-white">Notifications</h3>
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">
                        {notifications.filter(n => !n.read).length} New
                    </span>
                </div>
                {notifications.some(n => !n.read) && (
                    <button
                        onClick={handleMarkAllAsRead}
                        className="text-xs text-gray-500 hover:text-primary dark:text-gray-400 font-medium transition-colors"
                    >
                        Mark all read
                    </button>
                )}
            </div>

            <div className="overflow-y-auto p-2 space-y-2 custom-scrollbar flex-1">
                {notifications.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                        <Icon name="check" className="w-12 h-12 mx-auto mb-2 opacity-20" />
                        <p className="text-sm">No notifications yet</p>
                    </div>
                ) : (
                    notifications.map(notification => (
                        <div
                            key={notification.id}
                            className={`p-3 rounded-lg flex gap-3 transition-colors ${notification.read ? 'bg-transparent hover:bg-gray-50 dark:hover:bg-dark-elevated/50' : 'bg-blue-50/50 dark:bg-primary/5 hover:bg-blue-50 dark:hover:bg-primary/10'}`}
                        >
                            <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${notification.read ? 'bg-transparent' : 'bg-primary'}`} />
                            <div className="flex-1">
                                <p className="text-sm text-gray-800 dark:text-gray-200 mb-1 leading-snug">{notification.content}</p>

                                {/* Invitation Actions */}
                                {notification.type === 'invite' && notification.metadata?.status === 'pending' && (
                                    <div className="flex gap-2 mt-2 mb-1">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleInviteResponse(notification.id, 'accept'); }}
                                            className="px-3 py-1 bg-primary text-white text-xs font-bold rounded-md hover:bg-primary-hover shadow-sm transition-colors"
                                        >
                                            Accept
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleInviteResponse(notification.id, 'decline'); }}
                                            className="px-3 py-1 bg-white dark:bg-dark-elevated text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 text-xs font-bold rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                        >
                                            Decline
                                        </button>
                                    </div>
                                )}

                                <div className="flex justify-between items-center mt-2">
                                    <span className="text-[10px] text-gray-400">{new Date(notification.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    {!notification.read && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleMarkAsRead(notification.id); }}
                                            className="text-[10px] font-bold text-primary hover:underline uppercase tracking-wide"
                                        >
                                            Mark as read
                                        </button>
                                    )}
                                </div>
                                {notification.actionUrl && notification.metadata?.status !== 'pending' && (
                                    <button className="mt-2 w-full py-1.5 bg-white dark:bg-dark-elevated border border-gray-200 dark:border-gray-700 rounded text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                        View Details
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default NotificationCenter;
