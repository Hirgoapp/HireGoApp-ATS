import { Building2, Plus, Search, ChevronLeft, ChevronRight, AlertCircle, Loader, Edit2, Trash2, Eye, Mail } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import companyService, { Company } from '../services/companyService';
import { paths } from '../constants/routes';
import { z } from 'zod';

type CompanyFormData = Partial<Company> & {
    formMode?: 'create' | 'edit';
    email?: string;
    adminFirstName?: string;
    adminLastName?: string;
    adminEmail?: string;
    adminPassword?: string;
};

const companyValidation = z.object({
    name: z.string().min(1, 'Company name is required').max(255),
    slug: z.string().min(1, 'Slug is required').max(255),
    description: z.string().optional(),
    licenseType: z.enum(['starter', 'premium', 'enterprise']),
    email: z.string().optional(),
    adminFirstName: z.string().optional(),
    adminLastName: z.string().optional(),
    adminEmail: z.string().optional(),
    adminPassword: z.string().optional(),
});

export default function Companies() {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [companies, setCompanies] = useState<Company[]>([]);
    const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20 });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Form states
    const [showForm, setShowForm] = useState(false);
    const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
    const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
    const [formData, setFormData] = useState<CompanyFormData>({
        formMode: 'create',
        name: '',
        slug: '',
        description: '',
        licenseType: 'premium',
    });
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);


    useEffect(() => {
        loadCompanies();
    }, []);

    const loadCompanies = async (page = 1, search = '') => {
        setLoading(true);
        setError(null);
        try {
            const result = await companyService.getCompanies(page, pagination.limit, search || undefined);
            setCompanies(result.companies);
            setPagination(result.pagination);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load companies');
            console.error('Error loading companies:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (term: string) => {
        setSearchTerm(term);
        loadCompanies(1, term);
    };

    const handleCreateClick = () => {
        setFormMode('create');
        setSelectedCompany(null);
        setFormData({
            formMode: 'create',
            name: '',
            slug: '',
            description: '',
            licenseType: 'premium',
            email: '',
            adminFirstName: '',
            adminLastName: '',
            adminEmail: '',
            adminPassword: '',
        });
        setFormErrors({});
        setShowForm(true);
    };

    const handleEditClick = async (company: Company) => {
        setFormMode('edit');
        setSelectedCompany(company);
        setFormErrors({});
        setShowForm(true);
        setFormData({ ...company, formMode: 'edit' });
        try {
            const full = await companyService.getCompanyById(company.id);
            setFormData({
                ...full,
                formMode: 'edit',
                email: full.email ?? '',
                description: full.description ?? '',
                licenseType: full.licenseType ?? 'premium',
                status: full.status ?? 'active',
            });
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load company details');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log('🚀 [SUBMIT] Form submission started');
        console.log('📋 [SUBMIT] Form data:', formData);

        setFormErrors({});
        setSubmitting(true);

        try {
            // Validate common fields
            console.log('✅ [VALIDATION] Starting validation...');
            const validated = companyValidation.parse(formData);
            console.log('✅ [VALIDATION] Common fields validated:', validated);

            // Additional validation for create mode
            if (formMode === 'create') {
                console.log('✅ [VALIDATION] Checking create-mode specific validations...');
                const createValidation = z.object({
                    email: z.string().email('Invalid email format').min(1, 'Company email is required'),
                    adminFirstName: z.string().min(1, 'First name is required'),
                    adminLastName: z.string().min(1, 'Last name is required'),
                    adminEmail: z.string().email('Invalid email format').min(1, 'Admin email is required'),
                    adminPassword: z.string().min(8, 'Password must be at least 8 characters'),
                });
                createValidation.parse(formData);
                console.log('✅ [VALIDATION] Create-mode validations passed');
            }
            // Edit mode: require company email
            if (formMode === 'edit') {
                const editValidation = z.object({
                    email: z.string().min(1, 'Company email is required').email('Invalid email format'),
                });
                editValidation.parse(formData);
            }

            if (formMode === 'create') {
                // Map frontend form fields to backend DTO
                const createDto = {
                    name: validated.name,
                    slug: validated.slug,
                    description: validated.description,
                    email: validated.email || '',
                    licenseTier: validated.licenseType, // Map licenseType -> licenseTier
                    initialAdmin: {
                        firstName: validated.adminFirstName || '',
                        lastName: validated.adminLastName || '',
                        email: validated.adminEmail || '',
                        password: validated.adminPassword || '',
                    },
                };
                console.log('📤 [API] Sending create company request with DTO:', createDto);
                const response = await companyService.createCompany(createDto as any);
                console.log('✅ [API] Company created successfully:', response);
                setSuccessMessage('Company created successfully!');
            } else if (formMode === 'edit' && selectedCompany) {
                const updateData = {
                    name: formData.name,
                    slug: formData.slug,
                    description: formData.description,
                    email: formData.email,
                    licenseTier: formData.licenseType,
                    isActive: formData.status === 'active',
                };
                console.log('📤 [API] Sending update company request:', updateData);
                const response = await companyService.updateCompany(selectedCompany.id, updateData as any);
                console.log('✅ [API] Company updated successfully:', response);
                setSuccessMessage('Company updated successfully!');
            }

            setShowForm(false);
            // Defer list refresh so the modal fully unmounts first and doesn't leave an invisible overlay
            setTimeout(() => {
                loadCompanies(pagination.page, searchTerm);
            }, 0);
            // Clear success message after 3 seconds
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err: any) {
            console.error('❌ [ERROR] Submission failed:', err);
            console.error('❌ [ERROR] Full error object:', err);
            if (err.response) {
                console.error('❌ [ERROR] Response status:', err.response.status);
                console.error('❌ [ERROR] Response data:', err.response.data);
            }

            if (err instanceof z.ZodError) {
                console.error('❌ [VALIDATION ERROR] Zod validation failed:', err.errors);
                const errors: Record<string, string> = {};
                err.errors.forEach((error) => {
                    const path = error.path[0]?.toString() || 'general';
                    errors[path] = error.message;
                });
                setFormErrors(errors);
            } else {
                const status = err.response?.status;
                const errorMsg = err.response?.data?.message || 'Failed to save company';
                console.error('❌ [ERROR] Setting error:', errorMsg);

                // Show API validation/conflict errors directly on the form
                if (status === 409 && /slug/i.test(errorMsg)) {
                    setFormErrors((prev) => ({ ...prev, slug: errorMsg }));
                    setError(null);
                    return;
                }

                setError(errorMsg);
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteClick = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this company?')) return;

        try {
            await companyService.deleteCompany(id);
            setSuccessMessage('Company deleted successfully!');
            loadCompanies(pagination.page, searchTerm);
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to delete company');
        }
    };

    const handleViewClick = (company: Company) => {
        navigate(paths.companyDetail(company.id), { state: { company } });
    };

    const handleResendWelcomeEmail = async (company: Company) => {
        if (!window.confirm(`Resend welcome email to ${company.name}?`)) {
            return;
        }

        try {
            setError(null);
            await companyService.resendWelcomeEmail(company.id);
            setSuccessMessage(`Welcome email resent to ${company.name}`);
            setTimeout(() => setSuccessMessage(null), 5000);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to resend welcome email');
        }
    };

    const handlePageChange = (direction: 'prev' | 'next') => {
        const newPage = direction === 'next' ? pagination.page + 1 : pagination.page - 1;
        if (newPage > 0 && newPage * pagination.limit <= pagination.total) {
            loadCompanies(newPage, searchTerm);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white">Companies</h1>
                    <p className="text-gray-400 mt-2">Manage tenant companies and their configurations</p>
                </div>
                <button
                    onClick={handleCreateClick}
                    className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg transition"
                >
                    <Plus className="w-5 h-5" />
                    New Company
                </button>
            </div>

            {/* Messages */}
            {error && (
                <div className="bg-red-900/30 border border-red-600 text-red-300 px-4 py-3 rounded-lg flex gap-3">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    {error}
                </div>
            )}
            {successMessage && (
                <div className="bg-green-900/30 border border-green-600 text-green-300 px-4 py-3 rounded-lg">
                    {successMessage}
                </div>
            )}

            {/* Search */}
            <div className="flex gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Search companies..."
                        value={searchTerm}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-brand-500"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <Loader className="w-8 h-8 text-brand-400 animate-spin" />
                    </div>
                ) : companies.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                        <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No companies found</p>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-gray-900 border-b border-gray-700">
                            <tr>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Name</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Slug</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">License</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Status</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Users</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Created</th>
                                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-300">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {companies.map((company) => (
                                <tr key={company.id} className="hover:bg-gray-900/50 transition">
                                    <td className="px-6 py-4 text-white font-medium">{company.name}</td>
                                    <td className="px-6 py-4 text-gray-400 font-mono text-sm">{company.slug}</td>
                                    <td className="px-6 py-4 text-gray-300">{company.licenseType}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${company.status === 'active'
                                            ? 'bg-green-900/30 text-green-300'
                                            : company.status === 'suspended'
                                                ? 'bg-yellow-900/30 text-yellow-300'
                                                : 'bg-red-900/30 text-red-300'
                                            }`}>
                                            {company.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-300">{company.userCount || 0}</td>
                                    <td className="px-6 py-4 text-gray-400 text-sm">
                                        {new Date(company.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => handleViewClick(company)}
                                                className="p-2 hover:bg-gray-700 rounded-lg transition"
                                                title="View"
                                            >
                                                <Eye className="w-4 h-4 text-green-400" />
                                            </button>
                                            <button
                                                onClick={() => handleResendWelcomeEmail(company)}
                                                className="p-2 hover:bg-gray-700 rounded-lg transition"
                                                title="Resend Welcome Email"
                                            >
                                                <Mail className="w-4 h-4 text-orange-400" />
                                            </button>
                                            <button
                                                onClick={() => handleEditClick(company)}
                                                className="p-2 hover:bg-gray-700 rounded-lg transition"
                                                title="Edit"
                                            >
                                                <Edit2 className="w-4 h-4 text-blue-400" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteClick(company.id)}
                                                className="p-2 hover:bg-gray-700 rounded-lg transition"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-4 h-4 text-red-400" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Pagination */}
            {!loading && companies.length > 0 && (
                <div className="flex justify-between items-center">
                    <p className="text-gray-400 text-sm">
                        Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                        {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => handlePageChange('prev')}
                            disabled={pagination.page === 1}
                            className="p-2 hover:bg-gray-700 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <span className="px-4 py-2 text-gray-400">
                            Page {pagination.page}
                        </span>
                        <button
                            onClick={() => handlePageChange('next')}
                            disabled={pagination.page * pagination.limit >= pagination.total}
                            className="p-2 hover:bg-gray-700 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}

            {/* Create/Edit Modal */}
            {showForm && (
                <div
                    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
                    onClick={() => setShowForm(false)}
                    role="presentation"
                    aria-hidden={!showForm}
                >
                    <div
                        className="bg-gray-800 rounded-lg border border-gray-700 p-6 w-full max-w-md"
                        onClick={(e) => e.stopPropagation()}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="company-form-title"
                    >
                        <h2 id="company-form-title" className="text-xl font-bold text-white mb-4">
                            {formMode === 'create' ? 'Create Company' : 'Edit Company'}
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {error && (
                                <div className="bg-red-900/20 border border-red-700 text-red-300 rounded p-3">
                                    {error}
                                </div>
                            )}
                            {/* Company Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Name</label>
                                <input
                                    type="text"
                                    value={formData.name || ''}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className={`w-full bg-gray-700 border rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none ${formErrors.name ? 'border-red-500' : 'border-gray-600'
                                        }`}
                                    placeholder="Company name"
                                />
                                {formErrors.name && <p className="text-red-400 text-sm mt-1">{formErrors.name}</p>}
                            </div>

                            {/* Slug */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Slug</label>
                                <input
                                    type="text"
                                    value={formData.slug || ''}
                                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                    className={`w-full bg-gray-700 border rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none ${formErrors.slug ? 'border-red-500' : 'border-gray-600'
                                        }`}
                                    placeholder="company-slug"
                                />
                                {formErrors.slug && <p className="text-red-400 text-sm mt-1">{formErrors.slug}</p>}
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                                <textarea
                                    value={formData.description || ''}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none"
                                    placeholder="Company description"
                                    rows={3}
                                />
                            </div>

                            {/* Company Email - create and edit */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Company Email</label>
                                <input
                                    type="email"
                                    value={formData.email || ''}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className={`w-full bg-gray-700 border rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none ${formErrors.email ? 'border-red-500' : 'border-gray-600'}`}
                                    placeholder="contact@company.com"
                                />
                                {formErrors.email && <p className="text-red-400 text-sm mt-1">{formErrors.email}</p>}
                            </div>

                            {/* License Type - create and edit */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">License Type</label>
                                <select
                                    value={formData.licenseType || 'premium'}
                                    onChange={(e) => setFormData({ ...formData, licenseType: e.target.value })}
                                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none"
                                >
                                    <option value="starter">Starter</option>
                                    <option value="premium">Premium</option>
                                    <option value="enterprise">Enterprise</option>
                                </select>
                            </div>

                            {/* Status - edit only */}
                            {formMode === 'edit' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Status</label>
                                    <select
                                        value={formData.status || 'active'}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'suspended' | 'inactive' })}
                                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none"
                                    >
                                        <option value="active">Active</option>
                                        <option value="suspended">Suspended</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                </div>
                            )}

                            {/* Initial Admin - create only */}
                            {formMode === 'create' && (
                                <>
                                    <div className="pt-4 border-t border-gray-700">
                                        <h3 className="text-sm font-semibold text-gray-300 mb-3">Initial Admin User</h3>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-1">First Name</label>
                                            <input
                                                type="text"
                                                value={formData.adminFirstName || ''}
                                                onChange={(e) => setFormData({ ...formData, adminFirstName: e.target.value })}
                                                className={`w-full bg-gray-700 border rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none ${formErrors.adminFirstName ? 'border-red-500' : 'border-gray-600'}`}
                                                placeholder="John"
                                            />
                                            {formErrors.adminFirstName && <p className="text-red-400 text-sm mt-1">{formErrors.adminFirstName}</p>}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-1">Last Name</label>
                                            <input
                                                type="text"
                                                value={formData.adminLastName || ''}
                                                onChange={(e) => setFormData({ ...formData, adminLastName: e.target.value })}
                                                className={`w-full bg-gray-700 border rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none ${formErrors.adminLastName ? 'border-red-500' : 'border-gray-600'}`}
                                                placeholder="Doe"
                                            />
                                            {formErrors.adminLastName && <p className="text-red-400 text-sm mt-1">{formErrors.adminLastName}</p>}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1">Admin Email</label>
                                        <input
                                            type="email"
                                            value={formData.adminEmail || ''}
                                            onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                                            className={`w-full bg-gray-700 border rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none ${formErrors.adminEmail ? 'border-red-500' : 'border-gray-600'}`}
                                            placeholder="admin@company.com"
                                        />
                                        {formErrors.adminEmail && <p className="text-red-400 text-sm mt-1">{formErrors.adminEmail}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1">Admin Password</label>
                                        <input
                                            type="password"
                                            value={formData.adminPassword || ''}
                                            onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
                                            className={`w-full bg-gray-700 border rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none ${formErrors.adminPassword ? 'border-red-500' : 'border-gray-600'}`}
                                            placeholder="Min 8 characters"
                                        />
                                        {formErrors.adminPassword && <p className="text-red-400 text-sm mt-1">{formErrors.adminPassword}</p>}
                                    </div>
                                </>
                            )}

                            {/* Buttons */}
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowForm(false)}
                                    className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg transition disabled:opacity-50"
                                >
                                    {submitting ? 'Saving...' : 'Save'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
