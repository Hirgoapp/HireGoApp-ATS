import { ChevronLeft, Building2, Mail, FileText, Zap, Users, Calendar, Copy, Edit2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import companyService, { Company } from '../services/companyService';
import { paths } from '../constants/routes';

export default function CompanyDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const [company, setCompany] = useState<Company | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showAdminModal, setShowAdminModal] = useState(false);
    const [adminForm, setAdminForm] = useState({ firstName: '', lastName: '', email: '', password: '' });
    const [savingAdmin, setSavingAdmin] = useState(false);
    const [adminError, setAdminError] = useState<string | null>(null);
    const [inviteInfo, setInviteInfo] = useState<{ email: string; password: string; loginUrl: string } | null>(null);

    const [admins, setAdmins] = useState<Array<{ id: string | number; email: string; firstName: string; lastName: string; role: string; isActive: boolean; createdAt: string }>>([]);
    const [adminsLoading, setAdminsLoading] = useState(false);

    const [showEditAdminModal, setShowEditAdminModal] = useState(false);
    const [selectedAdmin, setSelectedAdmin] = useState<{ id: string | number; email: string; firstName: string; lastName: string; role: string; isActive: boolean } | null>(null);
    const [editAdminForm, setEditAdminForm] = useState<{ firstName: string; lastName: string; email: string; role: string; isActive: boolean; password?: string }>({
        firstName: '',
        lastName: '',
        email: '',
        role: 'admin',
        isActive: true,
        password: '',
    });
    const [savingEditAdmin, setSavingEditAdmin] = useState(false);
    const [editAdminError, setEditAdminError] = useState<string | null>(null);

    // Default login URL for company admins (configure via Vite env)
    const companyLoginUrl =
        import.meta.env.VITE_COMPANY_PORTAL_URL ||
        `${window.location.protocol}//${window.location.hostname}:5180/login`;

    const copyToClipboard = (text: string) => {
        try {
            navigator.clipboard.writeText(text);
        } catch (e) {
            console.warn('Clipboard copy failed', e);
        }
    };

    // Get company from navigation state if available
    const initialCompany = location.state?.company;

    useEffect(() => {
        const loadCompanyDetail = async () => {
            setLoading(true);
            setError(null);
            try {
                // If we have company from navigation state, use that
                if (initialCompany) {
                    setCompany(initialCompany);
                } else if (id) {
                    // Otherwise fetch from API
                    const result = await companyService.getCompanyById(id);
                    setCompany(result);
                }
            } catch (err: any) {
                setError(err.response?.data?.message || 'Failed to load company details');
                console.error('Error loading company detail:', err);
            } finally {
                setLoading(false);
            }
        };

        loadCompanyDetail();
    }, [id, initialCompany]);

    useEffect(() => {
        const loadAdmins = async () => {
            if (!id) return;
            setAdminsLoading(true);
            try {
                const list = await companyService.getCompanyAdmins(id);
                setAdmins(list);
            } catch (err: any) {
                console.error('Error loading company admins:', err);
            } finally {
                setAdminsLoading(false);
            }
        };
        loadAdmins();
    }, [id]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-gray-400">Loading...</div>
            </div>
        );
    }

    if (error || !company) {
        return (
            <div className="min-h-screen bg-gray-900 p-8">
                <div className="max-w-4xl mx-auto">
                    <button
                        onClick={() => navigate(paths.companies)}
                        className="inline-flex items-center gap-2 text-brand-blue hover:text-brand-blue/80 mb-6"
                    >
                        <ChevronLeft className="w-5 h-5" />
                        Back to Companies
                    </button>
                    <div className="bg-red-900/20 border border-red-700 rounded-lg p-4 text-red-400">
                        {error || 'Company not found'}
                    </div>
                </div>
            </div>
        );
    }

    const licenseTypeColors: Record<string, string> = {
        starter: 'bg-gray-600',
        premium: 'bg-brand-blue',
        enterprise: 'bg-purple-600',
    };

    const licenseTypeLabels: Record<string, string> = {
        starter: 'Starter',
        premium: 'Premium',
        enterprise: 'Enterprise',
    };

    return (
        <div className="min-h-screen bg-gray-900 p-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate(paths.companies)}
                            className="inline-flex items-center gap-2 text-brand-blue hover:text-brand-blue/80"
                        >
                            <ChevronLeft className="w-5 h-5" />
                            Back to Companies
                        </button>
                    </div>
                    <button
                        onClick={() => navigate(paths.companies)}
                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
                    >
                        Close
                    </button>
                </div>

                {/* Main Card */}
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-8">
                    {/* Company Header */}
                    <div className="flex items-start gap-4 mb-8 pb-8 border-b border-gray-700">
                        <div className="bg-brand-blue/20 p-3 rounded-lg">
                            <Building2 className="w-8 h-8 text-brand-blue" />
                        </div>
                        <div className="flex-1">
                            <h1 className="text-3xl font-bold text-white mb-2">{company.name}</h1>
                            <p className="text-gray-400">Company ID: {company.id}</p>
                            {/* Company Slug */}
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Company Slug</label>
                                <p className="text-white font-mono text-sm bg-gray-700 p-3 rounded-lg">{company.slug}</p>
                            </div>

                            {/* Status */}
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Status</label>
                                <div className="flex items-center gap-2">
                                    <div
                                        className={`w-3 h-3 rounded-full ${company.status === 'active' ? 'bg-green-500' : 'bg-red-500'
                                            }`}
                                    ></div>
                                    <span className="text-white capitalize">{company.status || 'unknown'}</span>
                                </div>
                            </div>

                            {/* User Count */}
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                                    <Users className="w-4 h-4" />
                                    Users
                                </label>
                                <p className="text-white text-lg font-semibold">{company.userCount || 0}</p>
                            </div>
                        </div>

                        {/* Right Column */}
                        <div className="space-y-6">
                            {/* License Type */}
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                                    <Zap className="w-4 h-4" />
                                    License Type
                                </label>
                                <div className="flex items-center gap-2">
                                    {company.licenseType ? (
                                        <>
                                            <div
                                                className={`px-3 py-1 rounded-full text-sm font-medium text-white ${licenseTypeColors[company.licenseType as keyof typeof licenseTypeColors] ||
                                                    'bg-gray-600'
                                                    }`}
                                            >
                                                {licenseTypeLabels[company.licenseType as keyof typeof licenseTypeLabels] ||
                                                    company.licenseType}
                                            </div>
                                        </>
                                    ) : (
                                        <span className="text-gray-500 italic">Not assigned</span>
                                    )}
                                </div>
                            </div>

                            {/* Created Date */}
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                                    <Calendar className="w-4 h-4" />
                                    Created Date
                                </label>
                                <p className="text-white">
                                    {new Date(company.createdAt).toLocaleDateString(undefined, {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    })}
                                </p>
                            </div>

                            {/* Updated Date */}
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Last Updated</label>
                                <p className="text-white">
                                    {new Date(company.updatedAt).toLocaleDateString(undefined, {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    })}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Admin Information */}
                    <div className="mt-8 pt-8 border-t border-gray-700">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-white">Company Administrators</h2>
                            <button onClick={() => setShowAdminModal(true)} className="px-3 py-2 bg-brand-blue hover:bg-brand-blue/90 text-white rounded-md text-sm">Add Admin</button>
                        </div>
                        {adminsLoading ? (
                            <p className="text-gray-400">Loading admins...</p>
                        ) : admins.length > 0 ? (
                            <div className="space-y-3">
                                {admins.map((a) => (
                                    <div key={String(a.id)} className="bg-gray-700/30 rounded-lg p-4 flex items-center justify-between">
                                        <div className="space-y-1">
                                            <div className="text-white font-medium">
                                                {a.firstName} {a.lastName}{' '}
                                                <span className="text-xs text-gray-400 ml-2">({a.role})</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-gray-200 text-sm">
                                                <Mail className="w-4 h-4 text-gray-400" />
                                                <span>{a.email}</span>
                                            </div>
                                            <div className="text-xs">
                                                <span className={a.isActive ? 'text-green-300' : 'text-red-300'}>
                                                    {a.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                            </div>
                                        </div>
                                        <button
                                            className="p-2 hover:bg-gray-700 rounded-lg transition"
                                            title="Edit admin"
                                            onClick={() => {
                                                setEditAdminError(null);
                                                setSelectedAdmin(a);
                                                setEditAdminForm({
                                                    firstName: a.firstName,
                                                    lastName: a.lastName,
                                                    email: a.email,
                                                    role: a.role || 'admin',
                                                    isActive: !!a.isActive,
                                                    password: '',
                                                });
                                                setShowEditAdminModal(true);
                                            }}
                                        >
                                            <Edit2 className="w-4 h-4 text-blue-400" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-400">No admin found for this company.</p>
                        )}
                    </div>

                    {/* Backward-compatible single-admin card (kept for now) */}
                    {company.admin ? (
                        <div className="mt-8 pt-8 border-t border-gray-700">
                            <h2 className="text-lg font-semibold text-white mb-4">Company Administrator</h2>
                            <div className="bg-gray-700/30 rounded-lg p-4 space-y-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-gray-400">Name:</span>
                                    <span className="text-white font-medium">{company.admin?.firstName || ''} {company.admin?.lastName || ''}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Mail className="w-4 h-4 text-gray-400" />
                                    <span className="text-white">{company.admin?.email}</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="mt-8 pt-8 border-t border-gray-700">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-white">Company Administrator</h2>
                                <button onClick={() => setShowAdminModal(true)} className="px-3 py-2 bg-brand-blue hover:bg-brand-blue/90 text-white rounded-md text-sm">Add Admin</button>
                            </div>
                            <p className="text-gray-400 mt-2">No admin found for this company.</p>
                        </div>
                    )}

                    {/* Modules */}
                    {company.modules && Object.keys(company.modules).length > 0 && (
                        <div className="mt-8 pt-8 border-t border-gray-700">
                            <h2 className="text-lg font-semibold text-white mb-4">Enabled Modules</h2>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {Object.keys(company.modules).map((module: string, index: number) => (
                                    <div
                                        key={index}
                                        className="flex items-center gap-2 bg-gray-700/30 px-3 py-2 rounded-lg"
                                    >
                                        <Zap className="w-4 h-4 text-brand-blue" />
                                        <span className="text-white text-sm capitalize">{module}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Create Admin Modal */}
                {showAdminModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 w-full max-w-md">
                            <h3 className="text-lg font-semibold text-white mb-4">Add Company Admin</h3>
                            {adminError && <div className="bg-red-900/20 border border-red-700 text-red-300 rounded p-2 mb-3">{adminError}</div>}
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-sm text-gray-300 mb-1">First Name</label>
                                    <input className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white" value={adminForm.firstName} onChange={(e) => setAdminForm({ ...adminForm, firstName: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-300 mb-1">Last Name</label>
                                    <input className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white" value={adminForm.lastName} onChange={(e) => setAdminForm({ ...adminForm, lastName: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-300 mb-1">Email</label>
                                    <input className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white" value={adminForm.email} onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-300 mb-1">Password</label>
                                    <input type="password" className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white" value={adminForm.password} onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })} />
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 mt-4">
                                <button onClick={() => setShowAdminModal(false)} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded">Cancel</button>
                                <button disabled={savingAdmin} onClick={async () => {
                                    setAdminError(null);
                                    setSavingAdmin(true);
                                    try {
                                        if (!id) throw new Error('Missing company id');
                                        const admin = await companyService.createCompanyAdmin(id, adminForm);
                                        setCompany((prev) => prev ? { ...prev, admin: { id: admin.id, email: admin.email, firstName: admin.firstName, lastName: admin.lastName }, userCount: (prev.userCount || 0) + 1 } : prev);
                                        setAdmins((prev) => [{ id: admin.id, email: admin.email, firstName: admin.firstName, lastName: admin.lastName, role: admin.role, isActive: true, createdAt: admin.createdAt }, ...prev]);
                                        setInviteInfo({ email: admin.email, password: adminForm.password, loginUrl: companyLoginUrl });
                                        setShowAdminModal(false);
                                    } catch (err: any) {
                                        setAdminError(err.response?.data?.message || err.message || 'Failed to create admin');
                                    } finally {
                                        setSavingAdmin(false);
                                    }
                                }} className="px-4 py-2 bg-brand-blue hover:bg-brand-blue/90 text-white rounded">{savingAdmin ? 'Saving...' : 'Save Admin'}</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Edit Admin Modal */}
                {showEditAdminModal && selectedAdmin && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 w-full max-w-md">
                            <h3 className="text-lg font-semibold text-white mb-4">Edit Company Admin</h3>
                            {editAdminError && <div className="bg-red-900/20 border border-red-700 text-red-300 rounded p-2 mb-3">{editAdminError}</div>}
                            <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm text-gray-300 mb-1">First Name</label>
                                        <input className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white" value={editAdminForm.firstName} onChange={(e) => setEditAdminForm({ ...editAdminForm, firstName: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-300 mb-1">Last Name</label>
                                        <input className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white" value={editAdminForm.lastName} onChange={(e) => setEditAdminForm({ ...editAdminForm, lastName: e.target.value })} />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-300 mb-1">Email</label>
                                    <input className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white" value={editAdminForm.email} onChange={(e) => setEditAdminForm({ ...editAdminForm, email: e.target.value })} />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm text-gray-300 mb-1">Role</label>
                                        <select className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white" value={editAdminForm.role} onChange={(e) => setEditAdminForm({ ...editAdminForm, role: e.target.value })}>
                                            <option value="admin">Admin</option>
                                            <option value="manager">Manager</option>
                                            <option value="recruiter">Recruiter</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-300 mb-1">Status</label>
                                        <select className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white" value={editAdminForm.isActive ? 'active' : 'inactive'} onChange={(e) => setEditAdminForm({ ...editAdminForm, isActive: e.target.value === 'active' })}>
                                            <option value="active">Active</option>
                                            <option value="inactive">Inactive</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-300 mb-1">Reset Password (optional)</label>
                                    <input type="password" className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white" value={editAdminForm.password || ''} onChange={(e) => setEditAdminForm({ ...editAdminForm, password: e.target.value })} placeholder="Leave blank to keep unchanged" />
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 mt-4">
                                <button onClick={() => setShowEditAdminModal(false)} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded">Cancel</button>
                                <button
                                    disabled={savingEditAdmin}
                                    onClick={async () => {
                                        if (!id) return;
                                        setEditAdminError(null);
                                        setSavingEditAdmin(true);
                                        try {
                                            const payload: any = {
                                                firstName: editAdminForm.firstName,
                                                lastName: editAdminForm.lastName,
                                                email: editAdminForm.email,
                                                role: editAdminForm.role,
                                                isActive: editAdminForm.isActive,
                                            };
                                            if (editAdminForm.password && editAdminForm.password.trim().length > 0) {
                                                payload.password = editAdminForm.password;
                                            }
                                            const updated = await companyService.updateCompanyAdmin(id, selectedAdmin.id, payload);
                                            setAdmins((prev) => prev.map((a) => String(a.id) === String(updated.id) ? { ...a, email: updated.email, firstName: updated.firstName, lastName: updated.lastName, role: updated.role, isActive: updated.isActive } : a));
                                            setCompany((prev) => {
                                                if (!prev?.admin) return prev;
                                                if (String(prev.admin.id) !== String(updated.id)) return prev;
                                                return { ...prev, admin: { ...prev.admin, email: updated.email, firstName: updated.firstName, lastName: updated.lastName } };
                                            });
                                            setShowEditAdminModal(false);
                                        } catch (err: any) {
                                            setEditAdminError(err.response?.data?.message || err.message || 'Failed to update admin');
                                        } finally {
                                            setSavingEditAdmin(false);
                                        }
                                    }}
                                    className="px-4 py-2 bg-brand-blue hover:bg-brand-blue/90 text-white rounded"
                                >
                                    {savingEditAdmin ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Share Login Details */}
                {inviteInfo && (
                    <div className="mt-6 bg-gray-800 border border-gray-700 rounded-lg p-4">
                        <div className="flex items-center gap-2 text-gray-200 font-semibold mb-3">
                            <FileText className="w-4 h-4" />
                            Share login details with the new admin
                        </div>
                        <div className="space-y-2 text-sm text-gray-200">
                            <div className="flex items-center justify-between bg-gray-900 rounded px-3 py-2">
                                <span>Email: {inviteInfo.email}</span>
                                <button onClick={() => copyToClipboard(inviteInfo.email)} className="text-brand-blue hover:text-brand-blue/80 flex items-center gap-1 text-xs">
                                    <Copy className="w-3 h-3" /> Copy
                                </button>
                            </div>
                            <div className="flex items-center justify-between bg-gray-900 rounded px-3 py-2">
                                <span>Temp Password: {inviteInfo.password}</span>
                                <button onClick={() => copyToClipboard(inviteInfo.password)} className="text-brand-blue hover:text-brand-blue/80 flex items-center gap-1 text-xs">
                                    <Copy className="w-3 h-3" /> Copy
                                </button>
                            </div>
                            <div className="flex items-center justify-between bg-gray-900 rounded px-3 py-2">
                                <span>Login Link: <a className="text-brand-blue" href={inviteInfo.loginUrl} target="_blank" rel="noreferrer">{inviteInfo.loginUrl}</a></span>
                                <button onClick={() => copyToClipboard(inviteInfo.loginUrl)} className="text-brand-blue hover:text-brand-blue/80 flex items-center gap-1 text-xs">
                                    <Copy className="w-3 h-3" /> Copy
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="mt-8 flex gap-3">
                    <button
                        onClick={() => navigate(paths.companies)}
                        className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition font-medium"
                    >
                        Back to List
                    </button>
                    <button
                        onClick={() => {
                            // You can implement edit functionality here
                            navigate(paths.companies, { state: { editCompanyId: company.id } });
                        }}
                        className="flex-1 px-4 py-3 bg-brand-blue hover:bg-brand-blue/90 text-white rounded-lg transition font-medium"
                    >
                        Edit Company
                    </button>
                </div>
            </div>
        </div>
    );
}
