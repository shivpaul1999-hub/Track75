import React, { useState, useEffect } from 'react';
import { User, UserRole, UserStatus } from '../types';
import Icon from './Icon';
import { getOrganization, updateOrganization } from '../api/organizationsApi';

interface EditUserModalProps {
  user: User;
  onClose: () => void;
  onSave: (user: User) => void;
  organizationId?: number;
  isOrganizationOwner?: boolean;
}

const EditUserModal: React.FC<EditUserModalProps> = ({ user, onClose, onSave, organizationId, isOrganizationOwner }) => {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [phone, setPhone] = useState(user.phone || '');
  const [role, setRole] = useState<UserRole>(user.role);
  const [status, setStatus] = useState<UserStatus>(user.status);
  const [avatar, setAvatar] = useState<string | null>(user.avatarUrl || null);

  // Organization Editing State
  const [organizationName, setOrganizationName] = useState('');
  const [isLoadingOrg, setIsLoadingOrg] = useState(false);

  useEffect(() => {
    setName(user.name);
    setEmail(user.email);
    setPhone(user.phone || '');
    setRole(user.role);
    setStatus(user.status);
    setAvatar(user.avatarUrl || null);
  }, [user]);

  // Fetch Organization Name if Owner
  useEffect(() => {
    if (isOrganizationOwner && organizationId && organizationId !== 1) {
      const fetchOrg = async () => {
        setIsLoadingOrg(true);
        try {
          const org = await getOrganization(organizationId);
          setOrganizationName(org.name);
        } catch (error) {
          console.error("Failed to load organization", error);
        } finally {
          setIsLoadingOrg(false);
        }
      };
      fetchOrg();
    }
  }, [isOrganizationOwner, organizationId]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setAvatar(event.target?.result as string);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!name || !email) {
      // Basic validation
      return;
    }

    // Update Organization if changed
    if (isOrganizationOwner && organizationId && organizationId !== 1 && organizationName) {
      try {
        await updateOrganization(organizationId, { name: organizationName });
      } catch (error) {
        console.error("Failed to update organization name", error);
        // We continue to save user even if org update fails? 
        // Ideally explicit error handling, but for now log and proceed.
      }
    }

    onSave({
      ...user,
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
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">Edit User</h2>
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

          {/* Organization Name Field (Only for Owners) */}
          {isOrganizationOwner && organizationId !== 1 && (
            <div className="pt-2 pb-2 border-b border-gray-100 dark:border-dark-elevated mb-2">
              <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-1">Organization Name</label>
              {isLoadingOrg ? (
                <div className="h-9 w-full bg-gray-100 dark:bg-dark-elevated rounded animate-pulse"></div>
              ) : (
                <input
                  type="text"
                  value={organizationName}
                  onChange={e => setOrganizationName(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 dark:border-dark-elevated dark:bg-dark-elevated rounded-md shadow-sm py-2 px-3 focus:ring-primary focus:border-primary sm:text-sm font-semibold bg-gray-50/50 dark:text-white"
                  placeholder="Organization Name"
                />
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">This name is visible to all members of your organization.</p>
            </div>
          )}

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
          <button onClick={handleSubmit} className="px-4 py-2 bg-primary border border-transparent rounded-md text-sm font-medium text-white hover:bg-primary-hover disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed" disabled={!name || !email}>Save Changes</button>
        </div>
      </div>
    </div>
  );
};
export default EditUserModal;