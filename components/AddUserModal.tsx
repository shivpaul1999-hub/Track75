import React, { useState } from 'react';
import { User, UserRole, UserStatus } from '../types';
import Icon from './Icon';

interface AddUserModalProps {
  onClose: () => void;
  // Fix: The parent component is responsible for adding the organizationId, so this modal should not provide it.
  onSave: (user: Omit<User, 'id' | 'initials' | 'organizationId'>) => void;
}

const AddUserModal: React.FC<AddUserModalProps> = ({ onClose, onSave }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.MEMBER);
  const [status, setStatus] = useState<UserStatus>(UserStatus.ACTIVE);
  const [avatar, setAvatar] = useState<string | null>(null);

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
    if (!name || !email) {
      // Basic validation
      return;
    }
    onSave({
      name,
      email,
      phone,
      role,
      status,
      avatarUrl: avatar || undefined,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center p-4 transition-opacity" onClick={onClose}>
      <div className="bg-white dark:bg-dark-popup rounded-lg shadow-xl w-full max-w-lg animate-scale-in" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-200 dark:border-dark-elevated flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">Add New User</h2>
          <button onClick={onClose} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300">
            <Icon name="close" className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
              {avatar ? <img src={avatar} alt="Avatar" className="w-full h-full object-cover" /> : <Icon name="profile" className="w-10 h-10 text-gray-400" />}
            </div>
            <label htmlFor="avatar-upload" className="cursor-pointer text-sm font-semibold text-primary hover:text-primary-hover">
              Upload Profile Pic
              <input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} className="mt-1 block w-full border border-gray-300 dark:border-dark-elevated dark:bg-dark-elevated rounded-md shadow-sm py-2 px-3 focus:ring-primary focus:border-primary sm:text-sm text-gray-900 dark:text-white" placeholder="e.g. Jane Doe" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="mt-1 block w-full border border-gray-300 dark:border-dark-elevated dark:bg-dark-elevated rounded-md shadow-sm py-2 px-3 focus:ring-primary focus:border-primary sm:text-sm text-gray-900 dark:text-white" placeholder="e.g. jane.doe@example.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Phone Number</label>
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="mt-1 block w-full border border-gray-300 dark:border-dark-elevated dark:bg-dark-elevated rounded-md shadow-sm py-2 px-3 focus:ring-primary focus:border-primary sm:text-sm text-gray-900 dark:text-white" placeholder="e.g. 555-123-4567" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Role</label>
              <select value={role} onChange={e => setRole(e.target.value as UserRole)} className="mt-1 block w-full border border-gray-300 dark:border-dark-elevated dark:bg-dark-elevated rounded-md shadow-sm py-2 px-3 focus:ring-primary focus:border-primary sm:text-sm text-gray-900 dark:text-white">
                {Object.values(UserRole).map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
              <select value={status} onChange={e => setStatus(e.target.value as UserStatus)} className="mt-1 block w-full border border-gray-300 dark:border-dark-elevated dark:bg-dark-elevated rounded-md shadow-sm py-2 px-3 focus:ring-primary focus:border-primary sm:text-sm text-gray-900 dark:text-white">
                {Object.values(UserStatus).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>
        <div className="p-6 bg-gray-50 dark:bg-dark-elevated rounded-b-lg flex justify-end space-x-3">
          <button onClick={onClose} className="px-4 py-2 bg-white dark:bg-dark-card border border-gray-300 dark:border-dark-elevated rounded-md text-sm font-medium text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-dark-elevated">Cancel</button>
          <button onClick={handleSubmit} className="px-4 py-2 bg-primary border border-transparent rounded-md text-sm font-medium text-white hover:bg-primary-hover disabled:bg-gray-400 icon-disabled:bg-gray-600 disabled:cursor-not-allowed" disabled={!name || !email}>Save</button>
        </div>
      </div>
    </div>
  );
};

export default AddUserModal;