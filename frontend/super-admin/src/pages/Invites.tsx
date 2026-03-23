import {
    Mail,
    Search,
    ChevronLeft,
    ChevronRight,
    Loader,
    Plus,
    RefreshCw,
    Ban,
    Copy,
    X,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    listInvites,
    createInvite,
    resendInvite,
    revokeInvite,
    type InviteStatus,
    type SuperAdminInviteRow,
} from '../services/invites.api';
import companyService from '../services/companyService';
import { paths } from '../constants/routes';

const ROLE_OPTIONS = [
    { value: 'super_admin', label: 'Super admin (console)' },
    { value: 'company_admin', label: 'Company admin' },
    { value: 'admin', label: 'Admin (legacy)' },
    { value: 'recruiter', label: 'Recruiter' },
    { value: 'hiring_manager', label: 'Hiring manager' },
    { value: 'viewer', label: 'Viewer' },
];

export default function Invites() {
    const [invites, setInvites] = useState<SuperAdminInviteRow[]>([]);
    const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20 });
    const [statusFilter, setStatusFilter] = useState<InviteStatus | ''>('');
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const [showCreate, setShowCreate] = useState(false);
    const [createEmail, setCreateEmail] = useState('');
    const [createRole, setCreateRole] = useState('company_admin');
    const [createCompanyId, setCreateCompanyId] = useState('');
    const [createExpiresDays, setCreateExpiresDays] = useState(7);
    const [createMessage, setCreateMessage] = useState('');
    const [companyOptions, setCompanyOptions] = useState<{ id: string; name: string }[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [lastAcceptUrl, setLastAcceptUrl] = useState<string | null>(null);

    const load = useCallback(
        async (page = 1) => {
            setLoading(true);
            setError(null);
            try {
                const result = await listInvites({
                    page,
                    limit: pagination.limit,
                    status: statusFilter || undefined,
                    search: search.trim() || undefined,
                });
                setInvites(result.invites);
                setPagination(result.pagination);
            } catch (err: unknown) {
                const e = err as { response?: { data?: { message?: string } }; message?: string };
                setError(e.response?.data?.message || e.message || 'Failed to load invites');
            } finally {
                setLoading(false);
            }
        },
        [pagination.limit, statusFilter, search],
    );

    useEffect(() => {
        load(1);
    }, [statusFilter]);

    useEffect(() => {
        (async () => {
            try {
                const res = await companyService.getCompanies(1, 100);
                setCompanyOptions(res.companies.map((c) => ({ id: c.id, name: c.name })));
            } catch {
                setCompanyOptions([]);
            }
        })();
    }, []);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        load(1);
    };

    const formatDate = (iso: string | null) => {
        if (!iso) return '—';
        try {
            return new Date(iso).toLocaleString();
        } catch {
            return iso;
        }
    };

    const statusBadge = (s: InviteStatus) => {
        const map: Record<InviteStatus, string> = {
            pending: 'bg-yellow-900/50 text-yellow-200 border-yellow-700',
            accepted: 'bg-green-900/50 text-green-200 border-green-700',
            expired: 'bg-gray-700 text-gray-300 border-gray-600',
            revoked: 'bg-red-900/40 text-red-200 border-red-700',
        };
        return (
            <span className={`px-2 py-0.5 rounded text-xs font-medium border ${map[s]}`}>{s}</span>
        );
    };

    const onCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);
        setSuccess(null);
        setLastAcceptUrl(null);
        try {
            const body: Parameters<typeof createInvite>[0] = {
                email: createEmail.trim(),
                role: createRole,
                expiresInDays: createExpiresDays,
            };
            if (createRole !== 'super_admin' && createCompanyId) {
                body.companyId = createCompanyId;
            }
            if (createMessage.trim()) {
                body.personalMessage = createMessage.trim();
            }
            const { acceptUrl } = await createInvite(body);
            setLastAcceptUrl(acceptUrl);
            setSuccess('Invitation created and email queued (if mailer is configured).');
            setShowCreate(false);
            setCreateEmail('');
            setCreateMessage('');
            await load(pagination.page);
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string | string[] } }; message?: string };
            const m = e.response?.data?.message;
            setError(Array.isArray(m) ? m.join(' ') : m || e.message || 'Create failed');
        } finally {
            setSubmitting(false);
        }
    };

    const onResend = async (id: string) => {
        setError(null);
        try {
            const { acceptUrl } = await resendInvite(id);
            setLastAcceptUrl(acceptUrl);
            setSuccess('Invite resent.');
            await load(pagination.page);
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } }; message?: string };
            setError(e.response?.data?.message || e.message || 'Resend failed');
        }
    };

    const onRevoke = async (id: string) => {
        if (!window.confirm('Revoke this invitation?')) return;
        setError(null);
        try {
            await revokeInvite(id);
            setSuccess('Invite revoked.');
            await load(pagination.page);
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } }; message?: string };
            setError(e.response?.data?.message || e.message || 'Revoke failed');
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Mail className="w-8 h-8 text-brand-400" />
                        Invitations
                    </h1>
                    <p className="text-gray-400 mt-1">
                        Create and manage super-admin and tenant user invitations.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Link
                        to={paths.dashboard}
                        className="px-4 py-2 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-800"
                    >
                        Dashboard
                    </Link>
                    <button
                        type="button"
                        onClick={() => {
                            setShowCreate(true);
                            setError(null);
                            setLastAcceptUrl(null);
                        }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 text-white font-semibold hover:bg-brand-700"
                    >
                        <Plus className="w-5 h-5" />
                        New invite
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-red-900/30 border border-red-600 text-red-200 px-4 py-3 rounded-lg flex justify-between gap-4">
                    <span>{error}</span>
                    <button type="button" onClick={() => setError(null)} className="text-red-300 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>
            )}
            {success && (
                <div className="bg-green-900/30 border border-green-600 text-green-200 px-4 py-3 rounded-lg flex justify-between gap-4">
                    <span>{success}</span>
                    <button type="button" onClick={() => setSuccess(null)} className="text-green-300 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>
            )}
            {lastAcceptUrl && (
                <div className="bg-gray-800 border border-gray-600 rounded-lg p-4 space-y-2">
                    <p className="text-sm text-gray-300">Accept link (copy for manual delivery):</p>
                    <div className="flex gap-2 flex-wrap items-center">
                        <code className="text-xs text-brand-300 break-all flex-1 min-w-0">{lastAcceptUrl}</code>
                        <button
                            type="button"
                            onClick={() => void navigator.clipboard.writeText(lastAcceptUrl)}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded bg-gray-700 text-white text-sm"
                        >
                            <Copy className="w-4 h-4" /> Copy
                        </button>
                    </div>
                </div>
            )}

            <div className="flex flex-col md:flex-row gap-4 md:items-end">
                <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                        <input
                            value={search}
                            onChange={(ev) => setSearch(ev.target.value)}
                            placeholder="Search email or company…"
                            className="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-800 border border-gray-600 text-white"
                        />
                    </div>
                    <button
                        type="submit"
                        className="px-4 py-2 rounded-lg bg-gray-700 text-white hover:bg-gray-600"
                    >
                        Search
                    </button>
                </form>
                <div>
                    <label className="block text-xs text-gray-500 mb-1">Status</label>
                    <select
                        value={statusFilter}
                        onChange={(ev) => setStatusFilter(ev.target.value as InviteStatus | '')}
                        className="px-3 py-2 rounded-lg bg-gray-800 border border-gray-600 text-white"
                    >
                        <option value="">All</option>
                        <option value="pending">Pending</option>
                        <option value="accepted">Accepted</option>
                        <option value="expired">Expired</option>
                        <option value="revoked">Revoked</option>
                    </select>
                </div>
            </div>

            <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                        <thead className="bg-gray-900/80 text-gray-400">
                            <tr>
                                <th className="px-4 py-3 font-medium">Email</th>
                                <th className="px-4 py-3 font-medium">Company</th>
                                <th className="px-4 py-3 font-medium">Role</th>
                                <th className="px-4 py-3 font-medium">Status</th>
                                <th className="px-4 py-3 font-medium">Expires</th>
                                <th className="px-4 py-3 font-medium">Invited by</th>
                                <th className="px-4 py-3 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                                        <Loader className="w-8 h-8 animate-spin inline" />
                                    </td>
                                </tr>
                            ) : invites.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                                        No invitations match your filters.
                                    </td>
                                </tr>
                            ) : (
                                invites.map((inv) => (
                                    <tr key={inv.id} className="text-gray-200 hover:bg-gray-800/50">
                                        <td className="px-4 py-3 font-mono text-xs sm:text-sm">{inv.email}</td>
                                        <td className="px-4 py-3">{inv.companyName || '—'}</td>
                                        <td className="px-4 py-3">{inv.role}</td>
                                        <td className="px-4 py-3">{statusBadge(inv.status)}</td>
                                        <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                                            {formatDate(inv.expiresAt)}
                                        </td>
                                        <td className="px-4 py-3 text-gray-400 text-xs">
                                            {inv.invitedByEmail || '—'}
                                        </td>
                                        <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                                            {inv.status === 'pending' && (
                                                <>
                                                    <button
                                                        type="button"
                                                        onClick={() => onResend(inv.id)}
                                                        className="inline-flex items-center gap-1 text-brand-400 hover:text-brand-300"
                                                    >
                                                        <RefreshCw className="w-4 h-4" /> Resend
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => onRevoke(inv.id)}
                                                        className="inline-flex items-center gap-1 text-red-400 hover:text-red-300"
                                                    >
                                                        <Ban className="w-4 h-4" /> Revoke
                                                    </button>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-700 text-sm text-gray-400">
                    <span>
                        Page {pagination.page} · {pagination.total} total
                    </span>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            disabled={pagination.page <= 1 || loading}
                            onClick={() => load(pagination.page - 1)}
                            className="p-2 rounded border border-gray-600 disabled:opacity-40"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                            type="button"
                            disabled={pagination.page * pagination.limit >= pagination.total || loading}
                            onClick={() => load(pagination.page + 1)}
                            className="p-2 rounded border border-gray-600 disabled:opacity-40"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {showCreate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                    <div className="bg-gray-800 border border-gray-600 rounded-xl max-w-lg w-full p-6 space-y-4 shadow-xl">
                        <h2 className="text-lg font-semibold text-white">New invitation</h2>
                        <form onSubmit={onCreate} className="space-y-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Email</label>
                                <input
                                    type="email"
                                    required
                                    value={createEmail}
                                    onChange={(ev) => setCreateEmail(ev.target.value)}
                                    className="w-full px-3 py-2 rounded-lg bg-gray-900 border border-gray-600 text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Role</label>
                                <select
                                    value={createRole}
                                    onChange={(ev) => setCreateRole(ev.target.value)}
                                    className="w-full px-3 py-2 rounded-lg bg-gray-900 border border-gray-600 text-white"
                                >
                                    {ROLE_OPTIONS.map((o) => (
                                        <option key={o.value} value={o.value}>
                                            {o.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            {createRole !== 'super_admin' && (
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Company</label>
                                    <select
                                        required
                                        value={createCompanyId}
                                        onChange={(ev) => setCreateCompanyId(ev.target.value)}
                                        className="w-full px-3 py-2 rounded-lg bg-gray-900 border border-gray-600 text-white"
                                    >
                                        <option value="">Select company…</option>
                                        {companyOptions.map((c) => (
                                            <option key={c.id} value={c.id}>
                                                {c.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Expires in (days)</label>
                                <input
                                    type="number"
                                    min={1}
                                    max={90}
                                    value={createExpiresDays}
                                    onChange={(ev) => setCreateExpiresDays(Number(ev.target.value) || 7)}
                                    className="w-full px-3 py-2 rounded-lg bg-gray-900 border border-gray-600 text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Message (optional)</label>
                                <textarea
                                    value={createMessage}
                                    onChange={(ev) => setCreateMessage(ev.target.value)}
                                    rows={3}
                                    className="w-full px-3 py-2 rounded-lg bg-gray-900 border border-gray-600 text-white"
                                />
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowCreate(false)}
                                    className="px-4 py-2 rounded-lg border border-gray-600 text-gray-300"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-4 py-2 rounded-lg bg-brand-600 text-white font-semibold disabled:opacity-50"
                                >
                                    {submitting ? 'Creating…' : 'Create invite'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
