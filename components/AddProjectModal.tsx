import React, { useState } from 'react';
import { Track, Client, User, TrackLifecycle, UserRole, TrackPriority } from '../types';
import Icon from './Icon';

interface AddTrackModalProps {
  clients: Client[];
  owners: User[];
  onClose: () => void;
  // Fix: The parent component is responsible for adding the organizationId, so this modal should not provide it.
  onSave: (track: Omit<Track, 'id' | 'progress' | 'collaboratorIds' | 'organizationId'>) => void;
}

const AddTrackModal: React.FC<AddTrackModalProps> = ({ clients, owners, onClose, onSave }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [clientId, setClientId] = useState<number | ''>('');
  const [ownerId, setOwnerId] = useState<number | ''>('');
  const [priority, setPriority] = useState<TrackPriority>('Medium');
  const [lifecycle, setLifecycle] = useState<TrackLifecycle>(TrackLifecycle.OPEN);
  
  const handleSubmit = () => {
    if (!name || !description) {
      // Basic validation
      alert('Please fill out name and description.');
      return;
    }
    
    const newTrackData: Omit<Track, 'id' | 'progress' | 'collaboratorIds' | 'organizationId'> = {
      name,
      description,
      clientId: clientId ? Number(clientId) : undefined,
      ownerId: ownerId ? Number(ownerId) : undefined,
      priority,
      lifecycle,
    };

    if (lifecycle === TrackLifecycle.OPEN) {
        const startDate = new Date();
        const endDate = new Date();
        endDate.setFullYear(startDate.getFullYear() + 1);
        newTrackData.startDate = startDate.toISOString();
        newTrackData.endDate = endDate.toISOString();
    }
    
    onSave(newTrackData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center p-4 transition-opacity" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg animate-scale-in" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">Add New Track</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <Icon name="close" className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-gray-700">Track Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-primary focus:border-primary sm:text-sm" placeholder="e.g. Track Phoenix" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Overview</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-primary focus:border-primary sm:text-sm" placeholder="A brief description of the track..." />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Client / Stakeholder</label>
              <select value={clientId} onChange={e => setClientId(Number(e.target.value))} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-primary focus:border-primary sm:text-sm">
                <option value="" disabled>Select a client</option>
                {clients.sort((a,b) => a.name.localeCompare(b.name)).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Track Owner</label>
              <select value={ownerId} onChange={e => setOwnerId(Number(e.target.value))} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-primary focus:border-primary sm:text-sm">
                <option value="" disabled>Select an owner</option>
                {owners.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Priority</label>
              <select value={priority} onChange={e => setPriority(e.target.value as TrackPriority)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-primary focus:border-primary sm:text-sm">
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
              </select>
            </div>
             <div>
              <label className="block text-sm font-medium text-gray-700">Lifecycle</label>
              <select value={lifecycle} onChange={e => setLifecycle(e.target.value as TrackLifecycle)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-primary focus:border-primary sm:text-sm">
                {Object.values(TrackLifecycle).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
           <p className="text-xs text-gray-500">Start and end dates will be added automatically for Planning or Active lifecycles.</p>
        </div>
        <div className="p-6 bg-gray-50 rounded-b-lg flex justify-end space-x-3">
          <button onClick={onClose} className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
          <button onClick={handleSubmit} className="px-4 py-2 bg-primary border border-transparent rounded-md text-sm font-medium text-white hover:bg-primary-hover disabled:bg-gray-400 disabled:cursor-not-allowed" disabled={!name || !description}>Save Track</button>
        </div>
      </div>
    </div>
  );
};

export default AddTrackModal;