import React, { useState, useEffect } from 'react';
import { User, Organization, UserStatus } from '../types';
import Icon from './Icon';
import { useToast } from './ToastContext';
import { updateUser, getUsers, createUser, deleteUser } from '../api/usersApi';
import { getOrganization, updateOrganization } from '../api/organizationsApi';
import ChangePasswordModal from './ChangePasswordModal';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import { TEMPLATE_OPTIONS } from '../constants';

interface AccountSettingsPageProps {
    currentUser: User;
    onNavigate: (view: any) => void;
    onLogout: () => void;
}

const AccountSettingsPage: React.FC<AccountSettingsPageProps> = ({ currentUser, onNavigate, onLogout }) => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [organization, setOrganization] = useState<Organization | null>(null);
    const [teamMembers, setTeamMembers] = useState<User[]>([]);
    const { showToast } = useToast();

    // Modals
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [deleteAccountModalUser, setDeleteAccountModalUser] = useState<User | null>(null);

    // Form State - My Account
    const [name, setName] = useState(currentUser.name);
    const [email, setEmail] = useState(currentUser.email);
    const [phone, setPhone] = useState(currentUser.phone || '');
    const [avatarUrl, setAvatarUrl] = useState(currentUser.avatarUrl || '');

    // Form State - Org Info
    const [orgName, setOrgName] = useState('');
    const [orgLogoUrl, setOrgLogoUrl] = useState('');
    const [billingEmail, setBillingEmail] = useState('');
    const [defaultTemplate, setDefaultTemplate] = useState('General');

    // Form State - Invite User
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState('Member');
    const [inviteLoading, setInviteLoading] = useState(false);

    const isOrgOwner = currentUser.role === 'Organization Owner';
    const isIndividual = currentUser.organizationId === 1; // Assuming 1 is default individual org logic from App.tsx/mock

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch latest user data to be safe, though currentUser prop is passed
                // Fetch Org Data
                if (currentUser.organizationId) {
                    const org = await getOrganization(currentUser.organizationId);
                    setOrganization(org);
                    setOrgName(org.name);
                    setOrgLogoUrl(org.logoUrl || '');
                    setBillingEmail(org.billingContactEmail || '');
                    setDefaultTemplate(org.defaultTemplate || 'General');

                    // Fetch Team if allowed
                    if (isOrgOwner) {
                        const allUsers = await getUsers();
                        setTeamMembers(allUsers.filter(u => u.organizationId === currentUser.organizationId));
                    }
                }
            } catch (error) {
                console.error("Failed to load account settings", error);
                showToast("Failed to load settings", 'error');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [currentUser, isOrgOwner, showToast]);

    const handleSaveProfile = async () => {
        setSaving(true);
        try {
            // 1. Update User
            await updateUser(currentUser.id, {
                name,
                email,
                phone,
                avatarUrl
            });

            // 2. Update Org (if Owner)
            if (isOrgOwner && organization) {
                await updateOrganization(organization.id, {
                    name: orgName,
                    logoUrl: orgLogoUrl,
                    billingContactEmail: billingEmail,
                    defaultTemplate
                });
            }

            showToast('Settings saved successfully', 'success');
        } catch (error) {
            console.error("Failed to save settings", error);
            showToast('Failed to save settings', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleInviteUser = async () => {
        if (!inviteEmail) return;
        setInviteLoading(true);
        try {
            // Mock invite logic -> create user directly for now as per previous logic
            const newUser = await createUser({
                name: inviteEmail.split('@')[0], // Placeholder name
                email: inviteEmail,
                role: inviteRole as any,
                status: UserStatus.ACTIVE,
                initials: inviteEmail.substring(0, 2).toUpperCase(),
                organizationId: currentUser.organizationId
            });
            setTeamMembers([...teamMembers, newUser]);
            setInviteEmail('');
            showToast('User invited successfully', 'success');
        } catch (error) {
            console.error("Failed to invite user", error);
            showToast('Failed to invite user', 'error');
        } finally {
            setInviteLoading(false);
        }
    };

    const handleRemoveMember = async (user: User) => {
        // Confirmation is handled by modal, but simplified here we might just delete or show modal
        // Re-using DeleteConfirmationModal
        setDeleteAccountModalUser(user);
    };

    const confirmDeleteMember = async () => {
        if (!deleteAccountModalUser) return;
        try {
            await deleteUser(deleteAccountModalUser.id);
            setTeamMembers(teamMembers.filter(u => u.id !== deleteAccountModalUser.id));
            if (deleteAccountModalUser.id === currentUser.id) {
                onLogout(); // Self delete
            }
            setDeleteAccountModalUser(null);
            showToast('User removed successfully', 'success');
        } catch (error) {
            showToast('Failed to remove user', 'error');
        }
    }

    if (loading) return <div className="p-8 text-center text-gray-500">Loading account settings...</div>;

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-12">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Account Settings</h1>
                    <p className="text-gray-500 dark:text-gray-400">Manage your profile{isOrgOwner ? ' and organization' : ''}.</p>
                </div>
                <button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="px-6 py-2 bg-primary text-white rounded-lg font-semibold shadow-md hover:bg-primary-hover transition-colors disabled:opacity-50"
                >
                    {saving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>

            {/* My Account Section */}
            <div className="bg-white dark:bg-dark-card rounded-xl shadow-sm border border-gray-200 dark:border-dark-elevated overflow-hidden">
                <div className="p-6 border-b border-gray-200 dark:border-dark-elevated">
                    <h2 className="text-lg font-bold text-gray-800 dark:text-white">My Account</h2>
                </div>
                <div className="p-6 space-y-6">
                    {/* Profile Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Profile Image</label>
                            <div className="flex items-center space-x-4">
                                {avatarUrl ? (
                                    <img src={avatarUrl} alt="Profile" className="w-16 h-16 rounded-full object-cover border border-gray-200 dark:border-gray-600" />
                                ) : (
                                    <div className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center font-bold text-2xl">
                                        {currentUser.initials}
                                    </div>
                                )}
                                <div className="flex-1">
                                    <input
                                        type="text"
                                        placeholder="Image URL"
                                        value={avatarUrl}
                                        onChange={(e) => setAvatarUrl(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-dark-elevated rounded-md text-sm dark:bg-dark-elevated dark:text-white"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Enter a URL for your profile picture.</p>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                                <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-dark-elevated rounded-md text-sm dark:bg-dark-elevated dark:text-white" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
                                <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-dark-elevated rounded-md text-sm dark:bg-dark-elevated dark:text-white" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Phone Number <span className="text-gray-400 font-normal">(Optional)</span></label>
                                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-dark-elevated rounded-md text-sm dark:bg-dark-elevated dark:text-white" />
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100 dark:border-dark-elevated">
                        <button onClick={() => setIsPasswordModalOpen(true)} className="text-primary hover:text-primary-hover text-sm font-medium flex items-center">
                            <Icon name="lock" className="w-4 h-4 mr-2" />
                            Change Password
                        </button>
                    </div>

                    {/* Organization Info (Org Accounts Only) */}
                    {isOrgOwner && !isIndividual && (
                        <div className="pt-6 border-t border-gray-100 dark:border-dark-elevated">
                            <h3 className="text-md font-bold text-gray-800 dark:text-white mb-4">Organization Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Organization Name</label>
                                    <input type="text" value={orgName} onChange={e => setOrgName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-dark-elevated rounded-md text-sm dark:bg-dark-elevated dark:text-white" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Billing Contact Email</label>
                                    <input type="email" value={billingEmail} onChange={e => setBillingEmail(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-dark-elevated rounded-md text-sm dark:bg-dark-elevated dark:text-white" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Default Track Template</label>
                                    <select value={defaultTemplate} onChange={e => setDefaultTemplate(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-dark-elevated rounded-md text-sm dark:bg-dark-elevated dark:text-white">
                                        {TEMPLATE_OPTIONS.map(opt => (
                                            <option key={opt} value={opt}>{opt}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Organization Logo</label>
                                    <div className="flex items-center space-x-3">
                                        <input
                                            type="text"
                                            placeholder="Logo URL"
                                            value={orgLogoUrl}
                                            onChange={(e) => setOrgLogoUrl(e.target.value)}
                                            className="flex-1 px-3 py-2 border border-gray-300 dark:border-dark-elevated rounded-md text-sm dark:bg-dark-elevated dark:text-white"
                                        />
                                        {orgLogoUrl && <img src={orgLogoUrl} alt="Logo" className="h-9 w-9 object-contain bg-gray-50 rounded border border-gray-200" />}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="pt-6 border-t border-gray-100 dark:border-dark-elevated flex justify-between items-center">
                        <p className="text-xs text-gray-500">Member since {new Date().getFullYear()}</p>
                        <button onClick={() => setDeleteAccountModalUser(currentUser)} className="text-red-500 hover:text-red-700 text-sm font-medium">Delete Account</button>
                    </div>
                </div>
            </div>

            {/* Team Management Section (Org Only) */}
            {isOrgOwner && !isIndividual && (
                <div className="bg-white dark:bg-dark-card rounded-xl shadow-sm border border-gray-200 dark:border-dark-elevated overflow-hidden">
                    <div className="p-6 border-b border-gray-200 dark:border-dark-elevated flex justify-between items-center">
                        <h2 className="text-lg font-bold text-gray-800 dark:text-white">Team & User Management</h2>
                        <span className="bg-primary/10 text-primary text-xs font-bold px-2.5 py-1 rounded-full">{teamMembers.length} Members</span>
                    </div>

                    {/* Invite Section */}
                    <div className="p-6 bg-gray-50 dark:bg-dark-elevated/50 border-b border-gray-200 dark:border-dark-elevated">
                        <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">Invite New User</h3>
                        <div className="flex flex-col md:flex-row gap-3">
                            <input
                                type="email"
                                placeholder="Enter email address"
                                value={inviteEmail}
                                onChange={e => setInviteEmail(e.target.value)}
                                className="flex-1 px-3 py-2 border border-gray-300 dark:border-dark-elevated rounded-md text-sm dark:bg-dark-elevated dark:text-white"
                            />
                            <select
                                value={inviteRole}
                                onChange={e => setInviteRole(e.target.value)}
                                className="w-full md:w-40 px-3 py-2 border border-gray-300 dark:border-dark-elevated rounded-md text-sm dark:bg-dark-elevated dark:text-white"
                            >
                                <option value="Admin">Admin</option>
                                <option value="Manager">Manager</option>
                                <option value="Member">Member</option>
                            </select>
                            <button
                                onClick={handleInviteUser}
                                disabled={!inviteEmail || inviteLoading}
                                className="px-4 py-2 bg-primary text-white rounded-md text-sm font-semibold hover:bg-primary-hover disabled:opacity-50 whitespace-nowrap"
                            >
                                {inviteLoading ? 'Sending...' : 'Send Invite'}
                            </button>
                        </div>
                    </div>

                    {/* Team List */}
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-elevated">
                            <thead className="bg-gray-50 dark:bg-dark-elevated">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Member</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Role</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                                    <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-dark-card divide-y divide-gray-200 dark:divide-dark-elevated">
                                {teamMembers.map(member => (
                                    <tr key={member.id} className="hover:bg-gray-50 dark:hover:bg-dark-elevated transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                {member.avatarUrl ? (
                                                    <img src={member.avatarUrl} alt="" className="h-8 w-8 rounded-full" />
                                                ) : (
                                                    <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs">{member.initials}</div>
                                                )}
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900 dark:text-white">{member.name}</div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400">{member.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{member.role}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${member.status === 'Active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'}`}>
                                                {member.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            {member.id !== currentUser.id && (
                                                <button
                                                    onClick={() => handleRemoveMember(member)}
                                                    className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                                >
                                                    Remove
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {isPasswordModalOpen && <ChangePasswordModal onClose={() => setIsPasswordModalOpen(false)} />}
            {deleteAccountModalUser && (
                <DeleteConfirmationModal
                    user={deleteAccountModalUser}
                    onCancel={() => setDeleteAccountModalUser(null)}
                    onConfirm={confirmDeleteMember}
                />
            )}
        </div>
    );
};

export default AccountSettingsPage;
