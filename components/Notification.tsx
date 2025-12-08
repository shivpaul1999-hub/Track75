import React from 'react';
import Icon from './Icon';

interface NotificationProps {
  message: string;
}

const Notification: React.FC<NotificationProps> = ({ message }) => {
  if (!message) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 bg-green-600 text-white py-3 px-5 rounded-lg shadow-lg flex items-center animate-fade-in">
      <Icon name="task" className="w-5 h-5 mr-3" />
      <span className="font-medium text-sm">{message}</span>
    </div>
  );
};

export default Notification;