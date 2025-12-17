import React, { useState, useEffect } from 'react';
import { User, Organization } from '../types';
import { getOrganization } from '../api/organizationsApi';
import { useToast } from './ToastContext';
import UpgradeModal from './UpgradeModal';
import Icon from './Icon';

interface BillingPageProps {
    currentUser: User;
    onNavigate: (view: any) => void;
}

const BillingPage: React.FC<BillingPageProps> = ({ currentUser, onNavigate }) => {
    const { showToast } = useToast();
    const [organization, setOrganization] = useState<Organization | null>(null);
    const [loading, setLoading] = useState(true);

    // Upgrade State
    const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
    const [billingTab, setBillingTab] = useState<'details' | 'history'>('details');

    const isOrgOwner = currentUser.role === 'Organization Owner';
    // Individual accounts have role 'Organization Owner' for their personal workspace but org name contains "Workspace"
    const isIndividual = organization?.name?.includes('Workspace') || organization?.name?.includes('Personal');

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const org = await getOrganization(currentUser.organizationId);
                setOrganization(org);
            } catch (error) {
                console.error("Failed to fetch organization", error);
                showToast('Failed to load billing information', 'error');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [currentUser.organizationId, showToast]);

    if (loading) return <div className="p-8 text-center text-gray-500">Loading billing information...</div>;

    if (!isOrgOwner && !isIndividual) {
        return (
            <div className="flex flex-col items-center justify-center text-center h-[60vh]">
                <Icon name="lock" className="w-16 h-16 text-gray-300 mb-4" />
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">Access Restricted</h2>
                <p className="text-gray-500 mt-2">Only organization owners can manage billing and subscriptions.</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in mb-20">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Subscription & Billing</h1>
                    <p className="text-gray-500 dark:text-gray-400">Manage your plan, payment methods, and billing history.</p>
                </div>
            </div>

            <div className="bg-white dark:bg-dark-card rounded-xl border border-gray-200 dark:border-dark-elevated overflow-hidden shadow-sm">
                <div className="p-4 border-b border-gray-100 dark:border-dark-elevated flex justify-between items-center">
                    <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <Icon name="credit-card" className="w-5 h-5 text-gray-400" />
                        Current Subscription
                    </h3>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide flex items-center gap-1.5 ${organization?.subscriptionDetails?.plan === 'Organization' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${organization?.subscriptionDetails?.plan === 'Organization' ? 'bg-purple-500' : 'bg-gray-400'}`}></span>
                        {organization?.subscriptionDetails?.plan || 'Individual'} Plan
                    </span>
                </div>

                <div className="p-6">
                    {!organization?.subscriptionDetails ? (
                        // Individual / Free Plan State
                        <div className="flex flex-col gap-6">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <div>
                                    <h4 className="font-bold text-xl text-gray-900 dark:text-white flex items-center gap-2">
                                        Individual Plan
                                        <span className="bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 text-xs px-2 py-0.5 rounded-full uppercase tracking-wide">Current</span>
                                    </h4>
                                    <p className="text-gray-500 dark:text-gray-400 mt-1">Free forever. Basic features for personal use.</p>
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-primary/5 to-purple-500/5 rounded-xl border border-primary/10 p-6 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <Icon name="star" className="w-24 h-24 text-primary" />
                                </div>

                                <div className="flex flex-col md:flex-row gap-8 relative z-10">
                                    <div className="flex-1">
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Upgrade to Organization</h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
                                            Unlock the full potential of Track75 with our Organization plan. Perfect for growing teams.
                                        </p>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {[
                                                "Unlimited Team Members",
                                                "Organization Branding",
                                                "Advanced Roles & Permissions",
                                                "Track Sharing (User ↔ Org)",
                                                "Centralized Notifications",
                                                "Shared Feeds & References"
                                            ].map((feature, idx) => (
                                                <div key={idx} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                                                    <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center flex-shrink-0">
                                                        <Icon name="check" className="w-3 h-3" />
                                                    </div>
                                                    {feature}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex flex-col justify-center items-center md:items-end gap-4 min-w-[200px] border-t md:border-t-0 md:border-l border-primary/10 pt-6 md:pt-0 md:pl-6">
                                        <div className="text-center md:text-right">
                                            <div className="flex items-baseline justify-center md:justify-end gap-1">
                                                <span className="text-3xl font-bold text-gray-900 dark:text-white">$99.99</span>
                                                <span className="text-gray-500 dark:text-gray-400">/month</span>
                                            </div>
                                            <p className="text-xs text-gray-400 mt-1">Billed monthly</p>
                                        </div>
                                        <button
                                            onClick={() => setIsUpgradeModalOpen(true)}
                                            className="w-full bg-primary text-white px-6 py-3 rounded-lg font-bold hover:bg-primary-hover transition-all shadow-lg shadow-primary/20 hover:shadow-primary/30 active:scale-95 flex items-center justify-center gap-2"
                                        >
                                            <Icon name="star" className="w-4 h-4" />
                                            Upgrade Now
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        // Organization / Paid Plan State
                        <div className="space-y-6">
                            <div className="flex items-center gap-4 border-b border-gray-100 dark:border-dark-elevated mb-6">
                                {[
                                    { id: 'details', label: 'Billing Details' },
                                    { id: 'history', label: 'Billing History' }
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setBillingTab(tab.id as any)}
                                        className={`pb-3 text-sm font-medium transition-colors relative ${billingTab === tab.id
                                            ? 'text-primary'
                                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                                            }`}
                                    >
                                        {tab.label}
                                        {billingTab === tab.id && (
                                            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full"></span>
                                        )}
                                    </button>
                                ))}
                            </div>

                            {billingTab === 'details' ? (
                                <div className="animate-fade-in space-y-8">
                                    {/* Current Plan */}
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Current Plan</h4>
                                            <div className="flex items-center gap-3">
                                                <span className="text-2xl font-bold text-gray-900 dark:text-white">Organization Plan</span>
                                                <span className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2.5 py-0.5 rounded-md text-xs font-bold uppercase tracking-wide border border-green-200 dark:border-green-900/50">
                                                    Active
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                                                $99.99/month • Next billing date: {new Date(organization.subscriptionDetails.nextBillingDate).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div className="flex gap-3">
                                            <button className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-dark-elevated border border-gray-200 dark:border-dark-elevated rounded-lg hover:bg-gray-50 dark:hover:bg-dark-elevated/80 transition-colors">
                                                Downgrade
                                            </button>
                                            <button className="px-4 py-2 text-sm font-medium text-white bg-gray-900 dark:bg-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors shadow-sm">
                                                Change Plan
                                            </button>
                                        </div>
                                    </div>

                                    <div className="h-px bg-gray-100 dark:bg-dark-elevated"></div>

                                    {/* Payment Method */}
                                    <div>
                                        <div className="flex items-center justify-between mb-4">
                                            <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Payment Method</h4>
                                            <button className="text-sm text-primary font-bold hover:underline">Update</button>
                                        </div>
                                        <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-dark-elevated/30 rounded-xl border border-gray-200 dark:border-dark-elevated max-w-md">
                                            <div className="w-12 h-8 bg-white dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 flex items-center justify-center shadow-sm">
                                                <Icon name="credit-card" className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                                    {organization.subscriptionDetails.paymentMethod.brand} ending in {organization.subscriptionDetails.paymentMethod.last4}
                                                    {organization.subscriptionDetails.paymentMethod.brand === 'Visa' && (
                                                        <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold">DEFAULT</span>
                                                    )}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Expires 12/28</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="animate-fade-in">
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Billing History</h4>
                                        <button className="text-sm text-primary font-bold hover:underline flex items-center gap-1">
                                            <Icon name="download" className="w-4 h-4" /> Download All
                                        </button>
                                    </div>

                                    <div className="border border-gray-200 dark:border-dark-elevated rounded-xl overflow-hidden">
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-gray-50 dark:bg-dark-elevated/50 text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-dark-elevated">
                                                <tr>
                                                    <th className="px-6 py-3 font-medium">Date</th>
                                                    <th className="px-6 py-3 font-medium">Amount</th>
                                                    <th className="px-6 py-3 font-medium">Status</th>
                                                    <th className="px-6 py-3 font-medium text-right">Invoice</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100 dark:divide-dark-elevated">
                                                {organization.subscriptionDetails.invoices?.map((invoice) => (
                                                    <tr key={invoice.id} className="hover:bg-gray-50 dark:hover:bg-dark-elevated/30 transition-colors">
                                                        <td className="px-6 py-4 text-gray-900 dark:text-white font-medium">
                                                            {new Date(invoice.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                                                        </td>
                                                        <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                                                            ${(invoice.amount / 100).toFixed(2)}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                                                                ${invoice.status === 'paid'
                                                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                                                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'}`}>
                                                                {invoice.status}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <button className="text-gray-400 hover:text-primary transition-colors p-2 hover:bg-gray-100 dark:hover:bg-dark-elevated rounded-lg">
                                                                <Icon name="download" className="w-4 h-4" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {(!organization.subscriptionDetails.invoices || organization.subscriptionDetails.invoices.length === 0) && (
                                                    <tr>
                                                        <td colSpan={4} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400 italic">
                                                            No invoices found in history.
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {isUpgradeModalOpen && organization && (
                <UpgradeModal
                    currentOrgId={organization.id}
                    currentUserEmail={currentUser.email}
                    onClose={() => setIsUpgradeModalOpen(false)}
                    onSuccess={() => {
                        window.location.reload(); // Simple reload to refresh data/state
                    }}
                />
            )}
        </div>
    );
};

export default BillingPage;
