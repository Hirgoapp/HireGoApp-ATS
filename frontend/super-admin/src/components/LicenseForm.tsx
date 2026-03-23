import { X, Loader, AlertCircle, CheckCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import apiClient from '../services/apiClient';

interface LicenseFormProps {
    companyId: string;
    companyName: string;
    onClose: () => void;
    onSuccess: () => void;
}

interface License {
    id: string;
    tier: 'basic' | 'premium' | 'enterprise';
    billingCycle: 'monthly' | 'annual' | 'custom';
    startsAt: string;
    expiresAt: string;
    autoRenew: boolean;
}

const LICENSE_TIERS = ['basic', 'premium', 'enterprise'] as const;
const BILLING_CYCLES = ['monthly', 'annual', 'custom'] as const;

export default function LicenseForm({ companyId, companyName, onClose, onSuccess }: LicenseFormProps) {
    const [license, setLicense] = useState<License | null>(null);
    const [formData, setFormData] = useState({
        tier: 'basic' as 'basic' | 'premium' | 'enterprise',
        billingCycle: 'monthly' as 'monthly' | 'annual' | 'custom',
        startsAt: '',
        expiresAt: '',
        autoRenew: true,
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [showSuccess, setShowSuccess] = useState(false);

    // Fetch existing license
    useEffect(() => {
        const fetchLicense = async () => {
            setLoading(true);
            setFetchError(null);
            try {
                const response = await apiClient.get(`/super-admin/licenses/${companyId}`);

                if (response.data.success && response.data.data) {
                    const licenseData = response.data.data;
                    setLicense(licenseData);
                    setFormData({
                        tier: licenseData.tier,
                        billingCycle: licenseData.billingCycle,
                        startsAt: formatDateForInput(licenseData.startsAt),
                        expiresAt: formatDateForInput(licenseData.expiresAt),
                        autoRenew: licenseData.autoRenew,
                    });
                }
            } catch (err) {
                // License not found is okay - user can create new one
                if (err instanceof Error && !err.message.includes('404')) {
                    setFetchError(err.message);
                }
            } finally {
                setLoading(false);
            }
        };

        fetchLicense();
    }, [companyId]);

    // Format date string for input (YYYY-MM-DD)
    const formatDateForInput = (dateString: string) => {
        try {
            return new Date(dateString).toISOString().split('T')[0];
        } catch {
            return '';
        }
    };

    // Format input date to ISO string
    const formatDateToISO = (dateString: string) => {
        if (!dateString) return '';
        try {
            return new Date(dateString).toISOString();
        } catch {
            return '';
        }
    };

    // Validate form
    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.startsAt) newErrors.startsAt = 'Start date is required';
        if (!formData.expiresAt) newErrors.expiresAt = 'Expiration date is required';

        if (formData.startsAt && formData.expiresAt) {
            const startDate = new Date(formData.startsAt);
            const expireDate = new Date(formData.expiresAt);
            if (startDate >= expireDate) {
                newErrors.expiresAt = 'Expiration date must be after start date';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle submit
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        setSubmitting(true);
        setSubmitError(null);
        setShowSuccess(false);

        try {
            const response = await apiClient.post('/super-admin/licenses', {
                companyId,
                tier: formData.tier,
                billingCycle: formData.billingCycle,
                startsAt: formatDateToISO(formData.startsAt),
                expiresAt: formatDateToISO(formData.expiresAt),
                autoRenew: formData.autoRenew,
            });

            if (response.data.success) {
                setShowSuccess(true);
                setTimeout(() => {
                    onSuccess();
                }, 1500);
            } else {
                setSubmitError(response.data.message || 'Failed to update license');
            }
        } catch (err) {
            setSubmitError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-lg border border-gray-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-700">
                    <div>
                        <h2 className="text-2xl font-bold text-white">License Management</h2>
                        <p className="text-gray-400 mt-1">{companyName}</p>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={submitting}
                        className="text-gray-400 hover:text-gray-300 transition-colors disabled:opacity-50"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {/* Loading State */}
                    {loading && (
                        <div className="flex items-center justify-center py-12">
                            <div className="flex flex-col items-center gap-3">
                                <Loader className="w-8 h-8 text-brand-400 animate-spin" />
                                <p className="text-gray-400">Loading license...</p>
                            </div>
                        </div>
                    )}

                    {/* Fetch Error State */}
                    {!loading && fetchError && (
                        <div className="flex items-center gap-3 p-4 bg-red-600/20 border border-red-600/50 rounded-lg">
                            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                            <span className="text-red-400">{fetchError}</span>
                        </div>
                    )}

                    {/* Form */}
                    {!loading && !fetchError && (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Existing License Info */}
                            {license && (
                                <div className="p-4 bg-brand-600/20 border border-brand-600/50 rounded-lg">
                                    <p className="text-sm text-gray-300">
                                        <span className="font-medium">Current License:</span> {license.tier} ({license.billingCycle})
                                    </p>
                                    <p className="text-sm text-gray-400 mt-1">
                                        Expires: {new Date(license.expiresAt).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric',
                                        })}
                                    </p>
                                </div>
                            )}

                            {/* Submit Error */}
                            {submitError && (
                                <div className="flex items-center gap-3 p-4 bg-red-600/20 border border-red-600/50 rounded-lg">
                                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                                    <span className="text-red-400">{submitError}</span>
                                </div>
                            )}

                            {/* Success State */}
                            {showSuccess && (
                                <div className="flex items-center gap-3 p-4 bg-green-600/20 border border-green-600/50 rounded-lg">
                                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                                    <span className="text-green-400">License updated successfully!</span>
                                </div>
                            )}

                            {/* License Tier */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    License Tier *
                                </label>
                                <select
                                    value={formData.tier}
                                    onChange={(e) => {
                                        const value = e.target.value as 'basic' | 'premium' | 'enterprise';
                                        setFormData({
                                            ...formData,
                                            tier: value,
                                        });
                                    }}
                                    disabled={submitting}
                                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50"
                                >
                                    {LICENSE_TIERS.map((tier) => (
                                        <option key={tier} value={tier}>
                                            {tier.charAt(0).toUpperCase() + tier.slice(1)}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Billing Cycle */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Billing Cycle *
                                </label>
                                <select
                                    value={formData.billingCycle}
                                    onChange={(e) => {
                                        const value = e.target.value as 'monthly' | 'annual' | 'custom';
                                        setFormData({
                                            ...formData,
                                            billingCycle: value,
                                        });
                                    }}
                                    disabled={submitting}
                                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50"
                                >
                                    {BILLING_CYCLES.map((cycle) => (
                                        <option key={cycle} value={cycle}>
                                            {cycle.charAt(0).toUpperCase() + cycle.slice(1)}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Date Range */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Start Date */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Start Date *
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.startsAt}
                                        onChange={(e) => setFormData({ ...formData, startsAt: e.target.value })}
                                        disabled={submitting}
                                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50"
                                    />
                                    {errors.startsAt && (
                                        <p className="mt-1 text-sm text-red-400">{errors.startsAt}</p>
                                    )}
                                </div>

                                {/* Expiration Date */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Expiration Date *
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.expiresAt}
                                        onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                                        disabled={submitting}
                                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50"
                                    />
                                    {errors.expiresAt && (
                                        <p className="mt-1 text-sm text-red-400">{errors.expiresAt}</p>
                                    )}
                                </div>
                            </div>

                            {/* Auto Renew */}
                            <div>
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.autoRenew}
                                        onChange={(e) => setFormData({ ...formData, autoRenew: e.target.checked })}
                                        disabled={submitting}
                                        className="w-4 h-4 rounded border-gray-600 text-brand-600 disabled:opacity-50"
                                    />
                                    <span className="text-sm font-medium text-gray-300">Auto-renew license</span>
                                </label>
                                <p className="text-xs text-gray-400 mt-1 ml-7">
                                    Automatically renew when license expires
                                </p>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 justify-end pt-6 border-t border-gray-700">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    disabled={submitting}
                                    className="px-6 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 disabled:opacity-50 transition-colors font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting || showSuccess}
                                    className="flex items-center gap-2 px-6 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50 transition-colors font-medium"
                                >
                                    {submitting && <Loader className="w-4 h-4 animate-spin" />}
                                    {license ? 'Update License' : 'Create License'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
