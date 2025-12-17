import React, { useState } from 'react';
import { Client } from '../types';
import Icon from './Icon';

interface AddClientModalProps {
  onClose: () => void;
  // FIX: Changed 'projectIds' to 'trackIds' to match the Client type.
  onSave: (client: Omit<Client, 'id' | 'trackIds' | 'organizationId'>) => void;
}

const AddClientModal: React.FC<AddClientModalProps> = ({ onClose, onSave }) => {
  const [name, setName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');

  const handleSubmit = () => {
    if (!name.trim() || !contactPerson.trim() || !contactEmail.trim()) {
      alert('Please fill out all required fields.');
      return;
    }
    onSave({
      name,
      contactPerson,
      contactEmail,
      contactPhone,
    });
  };
  
  const isFormValid = name.trim() && contactPerson.trim() && contactEmail.trim();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center p-4 transition-opacity" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg animate-scale-in" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">Add New Client</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <Icon name="close" className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-gray-700">Client Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-primary focus:border-primary sm:text-sm" placeholder="e.g. Innovate Corp" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Contact Person</label>
            <input type="text" value={contactPerson} onChange={e => setContactPerson(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-primary focus:border-primary sm:text-sm" placeholder="e.g. Jane Doe" />
          </div>
           <div>
            <label className="block text-sm font-medium text-gray-700">Contact Email</label>
            <input type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-primary focus:border-primary sm:text-sm" placeholder="e.g. jane.doe@innovate.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Contact Phone</label>
            <input type="tel" value={contactPhone} onChange={e => setContactPhone(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-primary focus:border-primary sm:text-sm" placeholder="e.g. 555-123-4567" />
          </div>
        </div>
        <div className="p-6 bg-gray-50 rounded-b-lg flex justify-end space-x-3">
          <button onClick={onClose} className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
          <button onClick={handleSubmit} className="px-4 py-2 bg-primary border border-transparent rounded-md text-sm font-medium text-white hover:bg-primary-hover disabled:bg-gray-400 disabled:cursor-not-allowed" disabled={!isFormValid}>Save Client</button>
        </div>
      </div>
    </div>
  );
};

export default AddClientModal;