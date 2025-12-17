
import React, { useState, useEffect } from 'react';
import Icon from './Icon';
import { User, Organization, AccessLevel, ShareEntry } from '../types';
import { getUsers } from '../api/usersApi';
import { getOrganizations } from '../api/organizationsApi';

interface ShareTrackModalProps {
    onClose: () => void;
    onShare: (sharedWith: ShareEntry[]) => Promise<void>;
    currentSharedWith: ShareEntry[];
    currentUser: User;
}

const ShareTrackModal: React.FC<ShareTrackModalProps> = ({ onClose, onShare, currentSharedWith, currentUser }) => {
    const [activeTab, setActiveTab] = useState<'user' | 'organization'>('user');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedAccess, setSelectedAccess] = useState<AccessLevel>(AccessLevel.VIEW);

    // Data State
    const [users, setUsers] = useState<User[]>([]);
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [loading, setLoading] = useState(false);

    // Staging State (Pending changes)
    const [recipients, setRecipients] = useState<ShareEntry[]>(currentSharedWith || []);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [fetchedUsers, fetchedOrgs] = await Promise.all([getUsers(), getOrganizations()]);
                // Filter out current user from potential recipients
                setUsers(fetchedUsers.filter(u => u.id !== currentUser.id));
                setOrganizations(fetchedOrgs); // Potentially filter out current org if internal sharing is implied, but usually okay
            } catch (error) {
                console.error("Failed to load users/orgs", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [currentUser.id]);

    const handleAddRecipient = (type: 'user' | 'organization' | 'email', id: number | string, name: string) => {
        // Check if already added
        if (recipients.some(r => r.type === type && (type === 'email' ? r.email === name : r.id === id))) return;

        const newRecipient: ShareEntry = {
            type: type as any,
            accessLevel: selectedAccess
        };

        if (type === 'email') {
            newRecipient.email = name as string;
        } else {
            newRecipient.id = id as number;
        }

        setRecipients([...recipients, newRecipient]);
        setSearchQuery(''); // Clear search
    };

    const handleRemoveRecipient = (type: 'user' | 'organization' | 'email', idOrEmail: number | string) => {
        setRecipients(recipients.filter(r => {
            if (type === 'email') return r.email !== idOrEmail;
            return !(r.type === type && r.id === idOrEmail);
        }));
    };

    const filteredResults = activeTab === 'user'
        ? users.filter(u => u.name.toLowerCase().includes(searchQuery.toLowerCase()) && !recipients.some(r => r.type === 'user' && r.id === u.id))
        : organizations.filter(o => o.name.toLowerCase().includes(searchQuery.toLowerCase()) && !recipients.some(r => r.type === 'organization' && r.id === o.id));

    // Limit results
    const displayedResults = searchQuery ? filteredResults.slice(0, 5) : [];

    const handleShare = async () => {
        await onShare(recipients);
        onClose();
    };

    const getRecipientName = (entry: ShareEntry) => {
        if (entry.type === 'user') {
            return users.find(u => u.id === entry.id)?.name || 'Unknown User';
        } else {
            return organizations.find(o => o.id === entry.id)?.name || 'Unknown Org';
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex justify-center items-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white dark:bg-dark-popup rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-scale-in flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 dark:border-dark-elevated flex justify-between items-center bg-gray-50/50 dark:bg-dark-elevated">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Share Track</h2>
                    <button onClick={onClose} className="p-1 rounded-full text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-elevated transition-colors">
                        <Icon name="close" className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 flex-grow overflow-y-auto">

                    {/* Tabs */}
                    <div className="flex bg-gray-100 dark:bg-dark-elevated p-1 rounded-lg mb-6">
                        <button
                            onClick={() => setActiveTab('user')}
                            className={`flex-1 py-1.5 text-sm font-semibold rounded-md transition-all ${activeTab === 'user' ? 'bg-white dark:bg-dark-popup text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                        >
                            Share with User
                        </button>
                        <button
                            onClick={() => setActiveTab('organization')}
                            className={`flex-1 py-1.5 text-sm font-semibold rounded-md transition-all ${activeTab === 'organization' ? 'bg-white dark:bg-dark-popup text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                        >
                            Share with Organization
                        </button>
                    </div>

                    {/* Inputs Group */}
                    <div className="flex gap-3 mb-2">
                        <div className="flex-1 relative">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder={activeTab === 'user' ? "Search by name or email..." : "Search organization name..."}
                                className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-dark-elevated border border-gray-300 dark:border-dark-elevated rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-gray-900 dark:text-white placeholder-gray-400"
                                autoFocus
                            />
                            <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />

                            {/* Search Results Dropdown */}
                            {searchQuery && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-dark-popup border border-gray-100 dark:border-dark-elevated rounded-lg shadow-xl z-20 max-h-48 overflow-y-auto">
                                    {displayedResults.length > 0 ? (
                                        displayedResults.map((item: any) => (
                                            <div
                                                key={item.id}
                                                className="px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-dark-elevated cursor-pointer flex items-center gap-3 transition-colors"
                                                onClick={() => handleAddRecipient(activeTab, item.id, item.name)}
                                            >
                                                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                                                    {item.initials || item.name.substring(0, 2).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900 dark:text-white">{item.name}</div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400">{item.email || 'Organization'}</div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <>
                                            <div className="px-4 py-3 text-xs text-gray-400 text-center">No results found</div>
                                            {activeTab === 'user' && searchQuery.includes('@') && (
                                                <div
                                                    className="px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-dark-elevated cursor-pointer flex items-center gap-3 transition-colors border-t border-gray-100 dark:border-dark-elevated"
                                                    onClick={() => handleAddRecipient('email', 0, searchQuery)}
                                                >
                                                    <div className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold text-xs">
                                                        <Icon name="mail" className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900 dark:text-white">Invite {searchQuery}</div>
                                                        <div className="text-xs text-gray-500 dark:text-gray-400">Send email invitation</div>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="w-32 flex-shrink-0">
                            <select
                                value={selectedAccess}
                                onChange={(e) => setSelectedAccess(e.target.value as AccessLevel)}
                                className="w-full py-2.5 px-3 bg-white dark:bg-dark-elevated border border-gray-300 dark:border-dark-elevated rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none cursor-pointer text-gray-900 dark:text-white"
                            >
                                <option value={AccessLevel.VIEW}>View Only</option>
                                <option value={AccessLevel.EDIT}>Can Edit</option>
                            </select>
                        </div>
                    </div>

                    {/* Helper Text */}
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">
                        People with view access can read and comment. People with edit access can modify the track.
                    </p>

                    {/* Selected Recipients */}
                    {recipients.length > 0 && (
                        <div>
                            <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">People with access</h3>
                            <div className="space-y-2">
                                {recipients.map((recipient, idx) => (
                                    <div key={`${recipient.type}-${recipient.id || recipient.email}`} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-elevated border border-transparent hover:border-gray-100 dark:hover:border-dark-elevated transition-all">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${recipient.type === 'user' ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300' : recipient.type === 'email' ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300' : 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300'}`}>
                                                {recipient.type === 'user' ? 'U' : recipient.type === 'email' ? '@' : 'O'}
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {recipient.type === 'email' ? recipient.email : getRecipientName(recipient)}
                                                </div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                                                    {recipient.type === 'email' ? 'Pending Invite' : recipient.type} • {recipient.accessLevel}
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleRemoveRecipient(recipient.type as any, recipient.type === 'email' ? recipient.email! : recipient.id!)}
                                            className="text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 p-1.5 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                        >
                                            <Icon name="close" className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 dark:bg-dark-elevated border-t border-gray-100 dark:border-dark-elevated flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-white dark:bg-dark-card border border-gray-300 dark:border-dark-elevated rounded-lg text-sm font-medium text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-dark-elevated transition-colors shadow-sm"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleShare}
                        className="px-6 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary-hover shadow-md shadow-primary/20 transition-all active:scale-95"
                    >
                        Save Changes
                    </button>
                </div>

            </div>
        </div>
    );
};

export default ShareTrackModal;
