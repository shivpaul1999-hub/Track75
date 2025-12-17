import React, { useState } from 'react';
import Icon from './Icon';
import { useToast } from './ToastContext';

interface ChangePasswordModalProps {
    onClose: () => void;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ onClose }) => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { showToast } = useToast();

    const handleSubmit = async () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            showToast('Please fill in all fields', 'error');
            return;
        }

        if (newPassword !== confirmPassword) {
            showToast('New passwords do not match', 'error');
            return;
        }

        if (newPassword.length < 6) {
            showToast('Password must be at least 6 characters', 'error');
            return;
        }

        setLoading(true);
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            showToast('Password updated successfully', 'success');
            onClose();
        } catch (error) {
            showToast('Failed to update password', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-white dark:bg-dark-popup rounded-lg shadow-xl w-full max-w-md animate-scale-in" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-gray-200 dark:border-dark-elevated flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">Change Password</h2>
                    <button onClick={onClose} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300">
                        <Icon name="close" className="w-6 h-6" />
                    </button>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Current Password</label>
                        <input
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            className="mt-1 block w-full border border-gray-300 dark:border-dark-elevated dark:bg-dark-elevated dark:text-white rounded-md shadow-sm py-2 px-3 focus:ring-primary focus:border-primary sm:text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">New Password</label>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="mt-1 block w-full border border-gray-300 dark:border-dark-elevated dark:bg-dark-elevated dark:text-white rounded-md shadow-sm py-2 px-3 focus:ring-primary focus:border-primary sm:text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Confirm New Password</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="mt-1 block w-full border border-gray-300 dark:border-dark-elevated dark:bg-dark-elevated dark:text-white rounded-md shadow-sm py-2 px-3 focus:ring-primary focus:border-primary sm:text-sm"
                        />
                    </div>
                </div>
                <div className="p-6 bg-gray-50 dark:bg-dark-elevated rounded-b-lg flex justify-end space-x-3">
                    <button onClick={onClose} className="px-4 py-2 bg-white dark:bg-dark-card border border-gray-300 dark:border-dark-elevated rounded-md text-sm font-medium text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-dark-elevated">Cancel</button>
                    <button onClick={handleSubmit} disabled={loading} className="px-4 py-2 bg-primary border border-transparent rounded-md text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50">
                        {loading ? 'Updating...' : 'Update Password'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChangePasswordModal;
