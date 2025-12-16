
import React, { useState, useEffect } from 'react';
import { Track, TrackLifecycle, TrackPriority } from '../types';
import { TEMPLATE_OPTIONS } from '../constants';
import Icon from './Icon';

interface EditTrackModalProps {
  track: Track;
  onClose: () => void;
  onSave: (track: Track) => void;
}

const getTemplateStyle = (template: string): { bg: string; text: string; border: string } => {
  const normalized = template.toLowerCase();
  if (normalized.includes('creative')) return { bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-200 dark:border-purple-800' };
  if (normalized.includes('project management')) return { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-800' };
  return { bg: 'bg-gray-50 dark:bg-gray-800', text: 'text-gray-700 dark:text-gray-300', border: 'border-gray-200 dark:border-gray-700' };
};

const EditTrackModal: React.FC<EditTrackModalProps> = ({ track, onClose, onSave }) => {
  const [name, setName] = useState(track.name);
  const [description, setDescription] = useState(track.description);
  const [template, setTemplate] = useState<string>(track.template || 'Custom Template');
  const [priority, setPriority] = useState<TrackPriority>(track.priority);
  const [lifecycle, setLifecycle] = useState<TrackLifecycle>(track.lifecycle);
  const [avatar, setAvatar] = useState<string | null>(track.avatarUrl || null);
  const [endDate, setEndDate] = useState<string>('');

  const [isMoreOptionsOpen, setIsMoreOptionsOpen] = useState(false);
  const isReadOnly = track.lifecycle === TrackLifecycle.CLOSED;

  useEffect(() => {
    setName(track.name);
    const desc = track.description.replace(/^\[Template: .*?\]\n?/, '');
    setDescription(desc);

    if (!track.template) {
      const match = track.description.match(/^\[Template: (.*?)\]/);
      setTemplate(match ? match[1] : 'Custom Template');
    } else {
      setTemplate(track.template);
    }

    setPriority(track.priority);
    setLifecycle(track.lifecycle);
    setAvatar(track.avatarUrl || null);

    if (track.endDate) {
      setEndDate(new Date(track.endDate).toISOString().split('T')[0]);
    }
  }, [track]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setAvatar(event.target?.result as string);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleSubmit = () => {
    if (!name.trim()) return;

    onSave({
      ...track,
      name,
      description,
      priority,
      lifecycle,
      template,
      avatarUrl: avatar || undefined,
      endDate: endDate ? new Date(endDate).toISOString() : track.endDate,
    });
  };

  const avatarStyle = getTemplateStyle(template);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center p-4 transition-opacity" onClick={onClose}>
      <div className="bg-white dark:bg-dark-popup rounded-lg shadow-xl w-full max-w-lg animate-scale-in" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-200 dark:border-dark-elevated flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">Edit Track</h2>
          <button onClick={onClose} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300">
            <Icon name="close" className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto custom-scrollbar">
          {isReadOnly && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-4 rounded-r-lg mb-4">
              <p className="text-sm text-yellow-700 dark:text-yellow-300">This track is Closed. Reopen to edit details.</p>
            </div>
          )}
          <div>
            <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-1.5">Track Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} disabled={isReadOnly} className="block w-full bg-white dark:bg-dark-elevated border border-gray-300 dark:border-dark-elevated rounded-lg p-2.5 disabled:bg-gray-100 dark:disabled:bg-dark-card text-gray-900 dark:text-white" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Overview</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} disabled={isReadOnly} className="block w-full bg-white dark:bg-dark-elevated border border-gray-300 dark:border-dark-elevated rounded-lg p-2.5 disabled:bg-gray-100 dark:disabled:bg-dark-card text-gray-900 dark:text-white" />
          </div>

          <div>
            <button type="button" onClick={() => setIsMoreOptionsOpen(!isMoreOptionsOpen)} className="flex items-center text-sm text-gray-500 dark:text-gray-400 hover:text-primary font-medium">
              {isMoreOptionsOpen ? <Icon name="chevron-down" className="w-4 h-4 mr-1 rotate-180" /> : <Icon name="chevron-right" className="w-4 h-4 mr-1" />}
              More Options
            </button>
          </div>

          {isMoreOptionsOpen && (
            <div className="space-y-4 pt-2 animate-fade-in bg-gray-50 dark:bg-dark-elevated p-4 rounded-lg border border-gray-100 dark:border-gray-700">
              <div className="flex items-center space-x-4">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-xl ${avatarStyle.bg} ${avatarStyle.text}`}>
                  {avatar ? <img src={avatar} alt="Avatar" className="w-full h-full object-cover rounded-full" /> : name.substring(0, 2).toUpperCase()}
                </div>
                {!isReadOnly && (
                  <label className="cursor-pointer text-xs font-semibold text-primary hover:text-primary-hover bg-white dark:bg-dark-card border border-primary/20 px-3 py-1.5 rounded-md shadow-sm">
                    Upload Avatar
                    <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                  </label>
                )}
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Template</label>
                <select value={template} onChange={e => setTemplate(e.target.value)} disabled={isReadOnly} className="block w-full bg-white dark:bg-dark-card border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 disabled:bg-gray-100 dark:disabled:bg-dark-card text-gray-900 dark:text-white">
                  {TEMPLATE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Status</label>
                  <select value={lifecycle} onChange={e => setLifecycle(e.target.value as TrackLifecycle)} className="block w-full bg-white dark:bg-dark-card border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 text-gray-900 dark:text-white">
                    <option value={TrackLifecycle.OPEN}>Open</option>
                    <option value={TrackLifecycle.CLOSED}>Closed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Priority</label>
                  <select value={priority} onChange={e => setPriority(e.target.value as TrackPriority)} disabled={isReadOnly} className="block w-full bg-white dark:bg-dark-card border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 disabled:bg-gray-100 dark:disabled:bg-dark-card text-gray-900 dark:text-white">
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="p-6 bg-gray-50 dark:bg-dark-elevated rounded-b-lg flex justify-end space-x-3">
          <button onClick={onClose} className="px-4 py-2 bg-white dark:bg-dark-card border border-gray-300 dark:border-dark-elevated rounded-lg text-sm font-medium text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-dark-elevated">Cancel</button>
          <button onClick={handleSubmit} className="px-6 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary-hover disabled:bg-gray-300 dark:disabled:bg-gray-600" disabled={!name.trim()}>Save Changes</button>
        </div>
      </div>
    </div>
  );
};

export default EditTrackModal;
