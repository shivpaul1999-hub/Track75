import React, { useState, useEffect } from 'react';
import { Organization, OrganizationStatus } from '../types';
import Icon from './Icon';

interface EditOrganizationModalProps {
  organization: Organization;
  onClose: () => void;
  onSave: (org: Organization) => void;
}

const EditOrganizationModal: React.FC<EditOrganizationModalProps> = ({ organization, onClose, onSave }) => {
  const [name, setName] = useState(organization.name);
  const [description, setDescription] = useState(organization.description);
  const [status, setStatus] = useState<OrganizationStatus>(organization.status);

  useEffect(() => {
    setName(organization.name);
    setDescription(organization.description);
    setStatus(organization.status);
  }, [organization]);

  const handleSubmit = () => {
    if (!name.trim()) return;
    onSave({ 
      ...organization,
      name, 
      description, 
      status 
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg animate-scale-in" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">Edit Organization</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <Icon name="close" className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Organization Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-primary focus:border-primary sm:text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-primary focus:border-primary sm:text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <select value={status} onChange={e => setStatus(e.target.value as OrganizationStatus)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-primary focus:border-primary sm:text-sm">
              {Object.values(OrganizationStatus).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div className="p-6 bg-gray-50 rounded-b-lg flex justify-end space-x-3">
          <button onClick={onClose} className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
          <button onClick={handleSubmit} className="px-4 py-2 bg-primary border border-transparent rounded-md text-sm font-medium text-white hover:bg-primary-hover disabled:bg-gray-400" disabled={!name.trim()}>Save Changes</button>
        </div>
      </div>
    </div>
  );
};

export default EditOrganizationModal;