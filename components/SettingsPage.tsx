
import React, { useState, useEffect } from 'react';
import { User, Organization } from '../types';
import { updateUser } from '../api/usersApi';
import { updateOrganization, getOrganization } from '../api/organizationsApi';
import { useToast } from './ToastContext';
import { applyTheme, applyDarkMode } from '../utils/themeUtils';

import UpgradeModal from './UpgradeModal'; // Need to create this
import Icon from './Icon';

const BRAND_COLORS = [
    '#0080FE', // Default Blue
    '#dc2626', // Red
    '#16a34a', // Green
    '#9333ea', // Purple
    '#db2777', // Pink
    '#ea580c', // Orange
    '#0d9488', // Teal
    '#2563eb', // Royal Blue
];

interface SettingsPageProps {
    currentUser: User;
    onNavigate: (view: any) => void;
}

// ... existing code ...

const SettingsPage: React.FC<SettingsPageProps> = ({ currentUser }) => {
    const [themeMode, setThemeMode] = useState<'light' | 'dark'>(currentUser.themePreference || 'light');
    const [brandColor, setBrandColor] = useState<string>('#0080FE');
    const [accentColor, setAccentColor] = useState<string>('#475569');
    const [logoUrl, setLogoUrl] = useState<string>('');
    const [useBranding, setUseBranding] = useState<boolean>(false);
    const [organization, setOrganization] = useState<Organization | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Notifications State
    const [notificationPreferences, setNotificationPreferences] = useState({
        accountChanges: true,
        newTeamMembers: true,
        trackUpdates: true,
        expiringSubscriptions: true,
        deliveryMethod: 'both'
    });

    // Upgrade State
    const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

    const { showToast } = useToast();

    const isOrgOwner = currentUser.role === 'Organization Owner';
    // Individual accounts have role 'Organization Owner' for their personal workspace but org name contains "Workspace"
    const isIndividual = organization?.name?.includes('Workspace') || organization?.name?.includes('Personal');
    const canEditBranding = isOrgOwner && !isIndividual;

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const org = await getOrganization(currentUser.organizationId);
                setOrganization(org);
                if (org.brandColor) {
                    setBrandColor(org.brandColor);
                }
                if (org.accentColor) setAccentColor(org.accentColor);
                if (org.logoUrl) setLogoUrl(org.logoUrl);
                if (org.useBranding !== undefined) setUseBranding(org.useBranding);
            } catch (error) {
                console.error("Failed to fetch organization", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
        if (currentUser.notificationPreferences) {
            setNotificationPreferences(currentUser.notificationPreferences as any);
        }
    }, [currentUser]);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const org = await getOrganization(currentUser.organizationId);
                setOrganization(org);
                if (org.brandColor) {
                    setBrandColor(org.brandColor);
                }
                if (org.accentColor) setAccentColor(org.accentColor);
                if (org.logoUrl) setLogoUrl(org.logoUrl);
                if (org.useBranding !== undefined) setUseBranding(org.useBranding);
            } catch (error) {
                console.error("Failed to fetch organization", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [currentUser.organizationId]);

    const handleSave = async () => {
        setSaving(true);
        try {
            // 1. Update User (Theme & Notifications)
            const userUpdates: Partial<User> = {
                themePreference: themeMode,
                notificationPreferences: notificationPreferences as any
            };
            await updateUser(currentUser.id, userUpdates);

            // 2. Update Organization Brand Color (only for org owners of non-personal orgs)
            if (canEditBranding) {
                await updateOrganization(currentUser.organizationId, {
                    brandColor,
                    accentColor,
                    logoUrl,
                    useBranding
                });
            }

            // Apply changes instantly
            applyDarkMode(themeMode === 'dark');
            // Only apply branding if this is an org account with branding enabled
            if (canEditBranding && useBranding) {
                applyTheme(brandColor, accentColor);
            } else {
                applyTheme('#0080FE'); // Reset to default
            }

            showToast('Settings saved successfully', 'success');
        } catch (error) {
            console.error("Failed to save settings", error);
            showToast('Failed to save settings', 'error');
        } finally {
            setSaving(false);
        }
    };

    // Instant preview when changing color?
    // Let's apply preview immediately for better UX, or just wait for save.
    // Requirement: "Verification: Changing brand color updates the UI immediately." AFTER save or during?
    // "Save Changes button... When user returns, load...\". \"Apply the selected color...\".
    // Let's apply on Save to be safe and avoid flickering state if they cancel.

    const handleThemeToggle = (mode: 'light' | 'dark') => {
        setThemeMode(mode);
        // Instant preview for theme?
        applyDarkMode(mode === 'dark');
    }

    const handleColorSelect = (color: string) => {
        setBrandColor(color);
        // Instant preview for color if branding is enabled?
        // We generally apply on save, but for previewing the picker we might want to see it?
        // Let's stick to apply on save for consistency with the prompt \"When saving: Apply Branding Toggle...\".
    }

    if (loading) return <div className="p-8 text-center text-gray-500">Loading settings...</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in mb-20">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
                    <p className="text-gray-500 dark:text-gray-400">Manage your preferences and organization customization.</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-6 py-2 bg-primary text-white rounded-lg font-semibold shadow-md hover:bg-primary-hover transition-colors disabled:opacity-50"
                >
                    {saving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Appearance Card */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
                    <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Appearance</h2>

                    <div className="mb-6">
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Theme Mode</label>
                        <div className="flex bg-gray-100 dark:bg-slate-900 p-1 rounded-lg inline-flex">
                            <button
                                onClick={() => handleThemeToggle('light')}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${themeMode === 'light' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'}`}
                            >
                                Light
                            </button>
                            <button
                                onClick={() => handleThemeToggle('dark')}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${themeMode === 'dark' ? 'bg-slate-700 shadow-sm text-white' : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'}`}
                            >
                                Dark
                            </button>
                        </div>
                    </div>
                </div>

                {!isIndividual && (
                    <div className="bg-white dark:bg-dark-card p-6 rounded-lg border border-gray-200 dark:border-dark-elevated shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Organization Branding</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Customize how your organization looks to team members.</p>
                            </div>
                            <div className="flex items-center space-x-2">
                                <span className={`text-sm font-medium ${useBranding ? 'text-primary' : 'text-gray-500'}`}>{useBranding ? 'Enabled' : 'Disabled'}</span>
                                <button
                                    onClick={() => setUseBranding(!useBranding)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${useBranding ? 'bg-primary' : 'bg-gray-200 dark:bg-slate-600'}`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${useBranding ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>
                        </div>

                        <div className={`transition-opacity duration-200 ${useBranding ? 'opacity-100 pointer-events-auto' : 'opacity-50 pointer-events-none'}`}>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Primary Brand Color</label>
                            <div className="flex flex-wrap gap-3 mb-6">
                                {BRAND_COLORS.map(color => (
                                    <button
                                        key={color}
                                        onClick={() => handleColorSelect(color)}
                                        className={`w-10 h-10 rounded-full border-2 transition-transform hover:scale-110 ${brandColor === color ? 'border-gray-900 dark:border-white scale-110' : 'border-transparent'}`}
                                        style={{ backgroundColor: color }}
                                        title={color}
                                    />
                                ))}
                                <div className="relative">
                                    <input
                                        type="color"
                                        value={brandColor}
                                        onChange={(e) => handleColorSelect(e.target.value)}
                                        className="w-10 h-10 p-0 border-0 rounded-full overflow-hidden cursor-pointer opacity-0 absolute inset-0"
                                    />
                                    <div className="w-10 h-10 rounded-full border border-gray-300 bg-white flex items-center justify-center text-gray-400 font-bold text-xs pointer-events-none">
                                        +
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Accent Color</label>
                                    <div className="flex items-center space-x-3">
                                        <div className="relative w-10 h-10 rounded-full overflow-hidden border border-gray-200 dark:border-gray-600">
                                            <input
                                                type="color"
                                                value={accentColor}
                                                onChange={(e) => setAccentColor(e.target.value)}
                                                className="absolute -top-2 -left-2 w-16 h-16 p-0 border-0 cursor-pointer"
                                            />
                                        </div>
                                        <input
                                            type="text"
                                            value={accentColor}
                                            onChange={(e) => setAccentColor(e.target.value)}
                                            className="uppercase w-28 px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md text-sm dark:bg-slate-700 dark:text-white"
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Used for subtle UI highlights.</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Logo URL</label>
                                    <div className="flex space-x-2">
                                        <input
                                            type="text"
                                            value={logoUrl}
                                            onChange={(e) => setLogoUrl(e.target.value)}
                                            placeholder="https://example.com/logo.png"
                                            className="flex-1 px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md text-sm dark:bg-slate-700 dark:text-white"
                                        />
                                    </div>
                                    {logoUrl && (
                                        <div className="mt-2 p-2 bg-gray-50 dark:bg-slate-900 rounded border border-gray-200 dark:border-slate-700 inline-block">
                                            <img src={logoUrl} alt="Logo Preview" className="h-8 object-contain" onError={(e) => (e.currentTarget.style.display = 'none')} />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                {/* Notification Settings */}
                <div className="bg-white dark:bg-dark-card p-6 rounded-xl border border-gray-200 dark:border-dark-elevated shadow-sm md:col-span-2">
                    <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Notification Settings</h2>
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Notification Types</h3>
                                <div className="space-y-3">
                                    {[
                                        { key: 'accountChanges', label: 'Account Changes' },
                                        { key: 'newTeamMembers', label: 'New Team Members' },
                                        { key: 'trackUpdates', label: 'Track Updates' },
                                        { key: 'expiringSubscriptions', label: 'Expiring Subscriptions' }
                                    ].map(({ key, label }) => (
                                        <div key={key} className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
                                            <button
                                                onClick={() => setNotificationPreferences(prev => ({ ...prev, [key]: !prev[key as keyof typeof prev] }))}
                                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${notificationPreferences[key as keyof typeof notificationPreferences] ? 'bg-primary' : 'bg-gray-200 dark:bg-slate-600'}`}
                                            >
                                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notificationPreferences[key as keyof typeof notificationPreferences] ? 'translate-x-6' : 'translate-x-1'}`} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Delivery Preferences</h3>
                                <div className="space-y-3">
                                    {['in-app', 'email', 'both'].map((method) => (
                                        <label key={method} className="flex items-center space-x-3 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="deliveryMethod"
                                                value={method}
                                                checked={notificationPreferences.deliveryMethod === method}
                                                onChange={(e) => setNotificationPreferences(prev => ({ ...prev, deliveryMethod: e.target.value as any }))}
                                                className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
                                            />
                                            <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">{method.replace('-', ' ')}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Team Members Section Removed */}
            </div>

            {isUpgradeModalOpen && organization && (
                <UpgradeModal
                    currentOrgId={organization.id}
                    currentUserEmail={currentUser.email}
                    onClose={() => setIsUpgradeModalOpen(false)}
                    onSuccess={() => {
                        window.location.reload(); // Simple reload to refresh data/state for organization
                    }}
                />
            )}
        </div>
    );
};

export default SettingsPage;
