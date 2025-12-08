
import React, { useState, useEffect } from 'react';
import { FeedEntry, User } from '../types';
import Icon from './Icon';

interface MetaDataPanelProps {
  entry: FeedEntry;
  onClose: () => void;
  users: User[];
}

const MetaDataPanel: React.FC<MetaDataPanelProps> = ({ entry, onClose, users }) => {
  const [isVisible, setIsVisible] = useState(false);
  const author = users.find(u => u.id === entry.authorId) as User;

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      const day = date.getDate();
      const month = date.toLocaleString('default', { month: 'short' });
      const year = date.getFullYear();

      let suffix = 'th';
      if (day === 1 || day === 21 || day === 31) suffix = 'st';
      else if (day === 2 || day === 22) suffix = 'nd';
      else if (day === 3 || day === 23) suffix = 'rd';

      return `${day}${suffix} ${month}, ${year}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300" onClick={handleClose}>
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-xl flex flex-col transform transition-transform duration-300 ease-in-out ${isVisible ? 'translate-x-0' : 'translate-x-full'}`}
        onClick={e => e.stopPropagation()}
      >
        <div className="p-5 border-b border-gray-200 flex justify-between items-center bg-gray-50 flex-shrink-0">
          <h3 className="text-lg font-bold text-gray-800 flex items-center">
            <Icon name="settings" className="w-5 h-5 mr-3 text-gray-500"/>
            Meta Data / Project Info
          </h3>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-full">
            <Icon name="close" className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-grow">
          <p className="text-sm text-gray-600 mb-4 whitespace-pre-wrap">{entry.content}</p>
          {entry.chips && entry.chips.length > 0 && (
            <div className="mb-4">
              <h4 className="font-semibold text-gray-700 text-sm mb-2">Category</h4>
              <div className="flex flex-wrap gap-2">
                {entry.chips.map(chip => (
                  <span key={chip} className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    {chip}
                  </span>
                ))}
              </div>
            </div>
          )}
          <div className="border-t border-gray-200 pt-4 mt-4 text-sm space-y-3">
             <div className="flex justify-between">
                <span className="font-semibold text-gray-700">Owner</span>
                <span className="text-gray-600">{author?.name || 'Unknown'}</span>
             </div>
             <div className="flex justify-between">
                <span className="font-semibold text-gray-700">Date</span>
                <span className="text-gray-600">{formatDate(entry.timestamp)}</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MetaDataPanel;
