import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useToast } from './ToastContext';
import { updateOrganization } from '../api/organizationsApi';
import Icon from './Icon';

interface UpgradeModalProps {
    onClose: () => void;
    currentOrgId: number;
    currentUserEmail: string;
    onSuccess: () => void;
}

const UpgradeModal: React.FC<UpgradeModalProps> = ({ onClose, currentOrgId, currentUserEmail, onSuccess }) => {
    const [step, setStep] = useState(1);
    const [orgName, setOrgName] = useState('');
    const [cardName, setCardName] = useState('');
    const [cardNumber, setCardNumber] = useState('');
    const [expiry, setExpiry] = useState('');
    const [cvc, setCvc] = useState('');
    const [loading, setLoading] = useState(false);
    const { showToast } = useToast();

    const handleUpgrade = async () => {
        setLoading(true);
        try {
            // Mock API call
            await updateOrganization(currentOrgId, {
                name: orgName || undefined,
                subscriptionDetails: {
                    plan: 'Organization',
                    status: 'active',
                    billingInterval: 'monthly',
                    nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                    paymentMethod: {
                        last4: cardNumber.slice(-4) || '4242',
                        brand: 'Visa'
                    },
                    invoices: []
                }
            } as any);

            showToast('Upgraded to Organization Plan successfully!', 'success');
            onSuccess();
            onClose();
        } catch (error) {
            console.error(error);
            showToast('Failed to upgrade. Please try again.', 'error');
        } finally {
            setLoading(false);
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
            {/* Overlay */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div
                className="bg-white dark:bg-dark-card rounded-xl p-8 max-w-md w-full shadow-2xl border border-gray-200 dark:border-dark-elevated animate-scale-in relative z-[10000]"
                style={{
                    position: 'fixed',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)'
                }}
            >
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                    <Icon name="close" className="w-5 h-5" />
                </button>

                <div className="text-center mb-6">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3 text-primary">
                        <Icon name="star" className="w-6 h-6" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Upgrade to Organization</h2>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Unlock team features and advanced tools.</p>
                </div>

                {step === 1 ? (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Organization Name</label>
                            <input
                                type="text"
                                value={orgName}
                                onChange={(e) => setOrgName(e.target.value)}
                                placeholder="Acme Inc."
                                className="w-full px-4 py-2 border border-gray-300 dark:border-dark-elevated rounded-lg dark:bg-dark-elevated dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                            />
                            <p className="text-xs text-gray-500 mt-1">This will be the public name of your workspace.</p>
                        </div>
                        <div className="pt-4">
                            <button
                                onClick={() => {
                                    if (!orgName) {
                                        showToast('Please enter an organization name', 'error');
                                        return;
                                    }
                                    setStep(2);
                                }}
                                className="w-full py-3 bg-primary text-white rounded-lg font-bold shadow-lg hover:bg-primary-hover transition-transform active:scale-95"
                            >
                                Continue to Billing
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Cardholder Name</label>
                            <input
                                type="text"
                                value={cardName}
                                onChange={(e) => setCardName(e.target.value)}
                                placeholder="John Doe"
                                className="w-full px-4 py-2 border border-gray-300 dark:border-dark-elevated rounded-lg dark:bg-dark-elevated dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Card Number</label>
                            <div className="relative">
                                <Icon name="credit-card" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    value={cardNumber}
                                    onChange={(e) => setCardNumber(e.target.value)}
                                    placeholder="4242 4242 4242 4242"
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-dark-elevated rounded-lg dark:bg-dark-elevated dark:text-white"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Expiry</label>
                                <input
                                    type="text"
                                    value={expiry}
                                    onChange={(e) => setExpiry(e.target.value)}
                                    placeholder="MM/YY"
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-dark-elevated rounded-lg dark:bg-dark-elevated dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">CVC</label>
                                <input
                                    type="text"
                                    value={cvc}
                                    onChange={(e) => setCvc(e.target.value)}
                                    placeholder="123"
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-dark-elevated rounded-lg dark:bg-dark-elevated dark:text-white"
                                />
                            </div>
                        </div>
                        <div className="pt-4 flex gap-3">
                            <button
                                onClick={() => setStep(1)}
                                className="flex-1 py-3 bg-gray-100 dark:bg-dark-elevated text-gray-700 dark:text-gray-300 rounded-lg font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                            >
                                Back
                            </button>
                            <button
                                onClick={handleUpgrade}
                                disabled={loading}
                                className="flex-1 py-3 bg-primary text-white rounded-lg font-bold shadow-lg hover:bg-primary-hover transition-transform active:scale-95 disabled:opacity-50"
                            >
                                {loading ? 'Processing...' : 'Pay & Upgrade'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
};

export default UpgradeModal;
