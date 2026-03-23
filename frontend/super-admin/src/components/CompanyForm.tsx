import { X, Loader, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import apiClient from '../services/apiClient';

interface CompanyFormProps {
    mode: 'create' | 'edit';
    company?: {
        id: string;
        name: string;
        slug: string;
        email: string;
        licenseTier: 'basic' | 'premium' | 'enterprise';
        isActive: boolean;
    };
    onClose: () => void;
    onSuccess: () => void;
}

const LICENSE_TIERS = ['basic', 'premium', 'enterprise'] as const;

export default function CompanyForm({ mode, company, onClose, onSuccess }: CompanyFormProps) {
    const [formData, setFormData] = useState({
        name: company?.name || '',
        slug: company?.slug || '',
        email: company?.email || '',
        licenseTier: company?.licenseTier || 'basic' as const,
        isActive: company?.isActive ?? true,
        // Create mode only
        firstName: '',
        lastName: '',
        adminEmail: '',
        password: '',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    // Validate form
    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.name.trim()) newErrors.name = 'Company name is required';
        if (!formData.slug.trim()) newErrors.slug = 'Slug is required';
        if (!formData.email.trim()) newErrors.email = 'Email is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email format';

        if (mode === 'create') {
            if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
            if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
            if (!formData.adminEmail.trim()) newErrors.adminEmail = 'Admin email is required';
            else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.adminEmail))
                newErrors.adminEmail = 'Invalid email format';
            if (!formData.password.trim()) newErrors.password = 'Password is required';
            else if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle submit
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        setLoading(true);
        setSubmitError(null);

        try {
            if (mode === 'create') {
                // POST /api/super-admin/companies
                const response = await apiClient.post('/super-admin/companies', {
                    name: formData.name,
                    slug: formData.slug,
                    email: formData.email,
                    licenseTier: formData.licenseTier,
                    initialAdmin: {
                        firstName: formData.firstName,
                        lastName: formData.lastName,
                        email: formData.adminEmail,
                        password: formData.password,
                    },
                });

                if (response.data.success) {
                    onSuccess();
                } else {
                    setSubmitError(response.data.message || 'Failed to create company');
                }
            } else {
                // PATCH /api/super-admin/companies/:companyId
                const response = await apiClient.patch(`/super-admin/companies/${company!.id}`, {
                    name: formData.name,
                    email: formData.email,
                    licenseTier: formData.licenseTier,
                    isActive: formData.isActive,
                });

                if (response.data.success) {
                    onSuccess();
                } else {
                    setSubmitError(response.data.message || 'Failed to update company');
                }
            }
        } catch (err) {
            setSubmitError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-lg border border-gray-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-700">
                    <h2 className="text-2xl font-bold text-white">
                        {mode === 'create' ? 'Create Company' : 'Edit Company'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-300 transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {submitError && (
                        <div className="flex items-center gap-3 p-4 bg-red-600/20 border border-red-600/50 rounded-lg">
                            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                            <span className="text-red-400">{submitError}</span>
                        </div>
                    )}

                    {/* Company Information Section */}
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-4">Company Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Company Name *
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                                    placeholder="e.g., Acme Corporation"
                                />
                                {errors.name && (
                                    <p className="mt-1 text-sm text-red-400">{errors.name}</p>
                                )}
                            </div>

                            {/* Slug */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Slug *
                                </label>
                                <input
                                    type="text"
                                    value={formData.slug}
                                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                                    placeholder="e.g., acme-corp"
                                />
                                {errors.slug && (
                                    <p className="mt-1 text-sm text-red-400">{errors.slug}</p>
                                )}
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Company Email *
                                </label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                                    placeholder="e.g., contact@acme.com"
                                />
                                {errors.email && (
                                    <p className="mt-1 text-sm text-red-400">{errors.email}</p>
                                )}
                            </div>

                            {/* License Tier */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    License Tier *
                                </label>
                                <select
                                    value={formData.licenseTier}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            licenseTier: e.target.value as 'basic' | 'premium' | 'enterprise',
                                        })
                                    }
                                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                                >
                                    {LICENSE_TIERS.map((tier) => (
                                        <option key={tier} value={tier}>
                                            {tier.charAt(0).toUpperCase() + tier.slice(1)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Status Section (Edit Mode Only) */}
                    {mode === 'edit' && (
                        <div>
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.isActive}
                                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                    className="w-4 h-4 rounded border-gray-600 text-brand-600"
                                />
                                <span className="text-sm font-medium text-gray-300">Company is Active</span>
                            </label>
                        </div>
                    )}

                    {/* Initial Admin Section (Create Mode Only) */}
                    {mode === 'create' && (
                        <div>
                            <h3 className="text-lg font-semibold text-white mb-4">Initial Admin Account</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* First Name */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        First Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.firstName}
                                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                                        placeholder="e.g., John"
                                    />
                                    {errors.firstName && (
                                        <p className="mt-1 text-sm text-red-400">{errors.firstName}</p>
                                    )}
                                </div>

                                {/* Last Name */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Last Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.lastName}
                                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                                        placeholder="e.g., Doe"
                                    />
                                    {errors.lastName && (
                                        <p className="mt-1 text-sm text-red-400">{errors.lastName}</p>
                                    )}
                                </div>

                                {/* Admin Email */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Admin Email *
                                    </label>
                                    <input
                                        type="email"
                                        value={formData.adminEmail}
                                        onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                                        placeholder="e.g., admin@acme.com"
                                    />
                                    {errors.adminEmail && (
                                        <p className="mt-1 text-sm text-red-400">{errors.adminEmail}</p>
                                    )}
                                </div>

                                {/* Password */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Password *
                                    </label>
                                    <input
                                        type="password"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                                        placeholder="••••••••"
                                    />
                                    {errors.password && (
                                        <p className="mt-1 text-sm text-red-400">{errors.password}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 justify-end pt-6 border-t border-gray-700">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="px-6 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 disabled:opacity-50 transition-colors font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center gap-2 px-6 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50 transition-colors font-medium"
                        >
                            {loading && <Loader className="w-4 h-4 animate-spin" />}
                            {mode === 'create' ? 'Create Company' : 'Update Company'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
