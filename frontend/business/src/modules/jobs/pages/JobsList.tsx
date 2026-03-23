import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../../stores/authStore';
import {
    JobListItem,
    JobListStats,
    JobSortField,
    fetchJobs,
    fetchJobStats,
    deleteJob,
} from '../services/jobs.api';
import PageHeader from '../../../components/ui/PageHeader';
import SurfaceCard from '../../../components/ui/SurfaceCard';
import StatePanel from '../../../components/ui/StatePanel';
import { formatListDate, ModuleDataListPagination } from '../../../components/ui/moduleDataList';
import './JobsList.css';

const LS_PAGE = 'jobsList.v1.pageSize';
const LS_COLS = 'jobsList.v1.columns';
const LS_DENSITY = 'jobsList.v1.density';
const LS_PRESETS = 'jobsList.v1.presets';
const LS_ADV_FILTERS = 'jobsList.v1.advancedFiltersOpen';
const LS_FAVORITES = 'jobsList.v1.favorites';

type Density = 'comfortable' | 'compact';
type ColumnId =
    | 'select'
    | 'job'
    | 'client_ref'
    | 'department'
    | 'location'
    | 'employment'
    | 'status'
    | 'salary'
    | 'updated'
    | 'actions';

const ALL_COLUMNS: ColumnId[] = [
    'select',
    'job',
    'client_ref',
    'department',
    'location',
    'employment',
    'status',
    'salary',
    'updated',
    'actions',
];

const COLUMN_LABEL: Record<ColumnId, string> = {
    select: 'Bulk select',
    job: 'Job',
    client_ref: 'Client ref',
    department: 'Department',
    location: 'Location',
    employment: 'Employment',
    status: 'Status',
    salary: 'Salary',
    updated: 'Updated',
    actions: 'Actions',
};

const SORT_MAP: Partial<Record<ColumnId, JobSortField>> = {
    job: 'title',
    client_ref: 'job_code',
    department: 'department',
    location: 'location',
    employment: 'employment_type',
    status: 'status',
    salary: 'salary_min',
    updated: 'updated_at',
};

type SavedPreset = {
    id: string;
    name: string;
    search: string;
    status: string;
    department: string;
    location: string;
    clientId: string;
};

function readUrlFilters(): {
    search: string;
    status: string;
    department: string;
    location: string;
    clientId: string;
    page: number;
    limit: number;
    sortBy: JobSortField;
    sortOrder: 'ASC' | 'DESC';
} {
    const sp = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    const sortParam = sp.get('sort') as JobSortField | null;
    const allowed: JobSortField[] = [
        'created_at',
        'updated_at',
        'title',
        'status',
        'department',
        'location',
        'employment_type',
        'job_code',
        'salary_min',
    ];
    return {
        search: sp.get('q') || '',
        status: sp.get('status') || '',
        department: sp.get('dept') || '',
        location: sp.get('loc') || '',
        clientId: sp.get('clientId') || '',
        page: Math.max(1, parseInt(sp.get('page') || '1', 10) || 1),
        limit: Math.min(100, Math.max(10, parseInt(sp.get('limit') || '20', 10) || 20)),
        sortBy: sortParam && allowed.includes(sortParam) ? sortParam : 'updated_at',
        sortOrder: sp.get('ord') === 'ASC' ? 'ASC' : 'DESC',
    };
}

function loadJson<T>(key: string, fallback: T): T {
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return fallback;
        return JSON.parse(raw) as T;
    } catch {
        return fallback;
    }
}

function saveJson(key: string, value: unknown) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch {
        /* ignore */
    }
}

function csvEscape(cell: string): string {
    if (/[",\n\r]/.test(cell)) return `"${cell.replace(/"/g, '""')}"`;
    return cell;
}

function jobsToCsv(rows: JobListItem[]): string {
    const headers = [
        'id',
        'title',
        'job_code',
        'status',
        'department',
        'location',
        'employment_type',
        'salary_min',
        'salary_max',
        'client_id',
        'client_code',
        'client_req_id',
        'created_at',
        'updated_at',
    ];
    const lines = [headers.join(',')];
    for (const j of rows) {
        const vals = [
            j.id,
            j.title,
            j.job_code || '',
            j.status,
            j.department || '',
            j.location || '',
            j.employment_type || '',
            j.salary_min != null ? String(j.salary_min) : '',
            j.salary_max != null ? String(j.salary_max) : '',
            j.client_id || '',
            j.client_code || '',
            j.client_req_id || '',
            j.created_at || '',
            j.updated_at || '',
        ].map((v) => csvEscape(String(v)));
        lines.push(vals.join(','));
    }
    return lines.join('\n');
}

function downloadText(filename: string, text: string, mime: string) {
    const blob = new Blob([text], { type: mime });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
}

function formatSalaryRange(job: JobListItem): string {
    const min = job.salary_min != null ? Number(job.salary_min) : null;
    const max = job.salary_max != null ? Number(job.salary_max) : null;
    if (min != null && max != null) {
        return `$${(min / 1000).toFixed(0)}k – $${(max / 1000).toFixed(0)}k`;
    }
    if (min != null) return `$${(min / 1000).toFixed(0)}k+`;
    if (max != null) return `≤ $${(max / 1000).toFixed(0)}k`;
    return '—';
}

function JobStatusBadge({ status }: { status: string }) {
    const s = (status || '').toLowerCase();
    let cls = 'jobs-list__badge jobs-list__badge--default';
    if (s === 'open') cls = 'jobs-list__badge jobs-list__badge--job-open';
    else if (s === 'closed') cls = 'jobs-list__badge jobs-list__badge--job-closed';
    else if (s === 'draft') cls = 'jobs-list__badge jobs-list__badge--job-draft';
    else if (s === 'archived') cls = 'jobs-list__badge jobs-list__badge--job-archived';
    const label = status ? status.charAt(0).toUpperCase() + status.slice(1) : '—';
    return <span className={cls}>{label}</span>;
}

export default function JobsList() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const searchInputRef = useRef<HTMLInputElement>(null);
    const permissions = useAuthStore((s) => s.user?.permissions || []);

    const hasPermission = (permission: string) =>
        permissions.includes('*') || permissions.includes(permission);

    const canRead = hasPermission('jobs:view') || hasPermission('jobs:read');
    const canCreate = hasPermission('jobs:create');
    const canUpdate = hasPermission('jobs:update');
    const canDelete = hasPermission('jobs:delete');

    const url0 = useMemo(() => readUrlFilters(), []);

    const [searchDraft, setSearchDraft] = useState(url0.search);
    const [searchQuery, setSearchQuery] = useState(url0.search);
    const [statusFilter, setStatusFilter] = useState(url0.status);
    const [departmentFilter, setDepartmentFilter] = useState(url0.department);
    const [locationFilter, setLocationFilter] = useState(url0.location);
    const [clientIdFilter, setClientIdFilter] = useState(() => url0.clientId);

    useEffect(() => {
        const c = searchParams.get('clientId')?.trim();
        if (c) setClientIdFilter(c);
    }, [searchParams]);
    const [page, setPage] = useState(url0.page);
    const [limit, setLimit] = useState(() => {
        const stored = loadJson<number | null>(LS_PAGE, null);
        if (stored && [10, 20, 50, 100].includes(stored)) return stored;
        return url0.limit;
    });
    const [sortBy, setSortBy] = useState<JobSortField>(url0.sortBy);
    const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>(url0.sortOrder);

    const [visibleCols, setVisibleCols] = useState<ColumnId[]>(() => {
        const stored = loadJson<ColumnId[] | null>(LS_COLS, null);
        if (stored?.length) {
            const merged = ALL_COLUMNS.filter((c) => stored!.includes(c));
            return merged.length ? merged : [...ALL_COLUMNS];
        }
        return [...ALL_COLUMNS];
    });

    const [density, setDensity] = useState<Density>(() => loadJson<Density | null>(LS_DENSITY, null) || 'comfortable');
    const [presets, setPresets] = useState<SavedPreset[]>(() => loadJson<SavedPreset[]>(LS_PRESETS, []));

    const [items, setItems] = useState<JobListItem[]>([]);
    const [total, setTotal] = useState(0);
    const [stats, setStats] = useState<JobListStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [statsLoading, setStatsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [deleteTarget, setDeleteTarget] = useState<JobListItem | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [showColumnMenu, setShowColumnMenu] = useState(false);
    const [showPresetMenu, setShowPresetMenu] = useState(false);
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [showMoreMenu, setShowMoreMenu] = useState(false);
    const [advancedFiltersOpen, setAdvancedFiltersOpen] = useState(
        () => loadJson<boolean | null>(LS_ADV_FILTERS, null) ?? false,
    );
    const [favoriteIds, setFavoriteIds] = useState<Set<string>>(() => new Set(loadJson<string[]>(LS_FAVORITES, [])));
    const [actionMenu, setActionMenu] = useState<{ jobId: string; top: number; left: number } | null>(null);
    const [toast, setToast] = useState<string | null>(null);

    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            setSearchQuery(searchDraft);
            setPage(1);
        }, 420);
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [searchDraft]);

    useEffect(() => {
        saveJson(LS_PAGE, limit);
    }, [limit]);

    useEffect(() => {
        saveJson(LS_COLS, visibleCols);
    }, [visibleCols]);

    useEffect(() => {
        saveJson(LS_DENSITY, density);
    }, [density]);

    useEffect(() => {
        saveJson(LS_PRESETS, presets);
    }, [presets]);

    useEffect(() => {
        saveJson(LS_ADV_FILTERS, advancedFiltersOpen);
    }, [advancedFiltersOpen]);

    useEffect(() => {
        if (actionMenu && !items.some((j) => j.id === actionMenu.jobId)) {
            setActionMenu(null);
        }
    }, [items, actionMenu]);

    useEffect(() => {
        if (!toast) return;
        const t = setTimeout(() => setToast(null), 2600);
        return () => clearTimeout(t);
    }, [toast]);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
            if (e.key === '/') {
                e.preventDefault();
                searchInputRef.current?.focus();
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    const buildFilters = useCallback(
        (pageOverride?: number) => ({
            page: pageOverride ?? page,
            limit,
            search: searchQuery.trim() || undefined,
            status: statusFilter ? (statusFilter as JobListItem['status']) : undefined,
            department: departmentFilter.trim() || undefined,
            location: locationFilter.trim() || undefined,
            client_id: clientIdFilter.trim() || undefined,
            orderBy: sortBy,
            orderDirection: sortOrder,
        }),
        [
            page,
            limit,
            searchQuery,
            statusFilter,
            departmentFilter,
            locationFilter,
            clientIdFilter,
            sortBy,
            sortOrder,
        ],
    );

    const loadStats = useCallback(async () => {
        if (!canRead) return;
        try {
            setStatsLoading(true);
            const s = await fetchJobStats();
            setStats(s);
        } catch {
            setStats(null);
        } finally {
            setStatsLoading(false);
        }
    }, [canRead]);

    const load = useCallback(async () => {
        if (!canRead) return;
        try {
            setLoading(true);
            setError(null);
            const res = await fetchJobs(buildFilters());
            setItems(res.items);
            setTotal(res.total);
            if (res.page != null && res.page !== page) setPage(res.page);
            setSelected(new Set());
        } catch (err: unknown) {
            const message =
                (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
                (err as Error)?.message ||
                'Failed to load jobs';
            setError(message);
        } finally {
            setLoading(false);
        }
    }, [canRead, buildFilters, page]);

    useEffect(() => {
        void load();
    }, [load]);

    useEffect(() => {
        void loadStats();
    }, [loadStats]);

    const onSortColumn = (col: ColumnId) => {
        const field = SORT_MAP[col];
        if (!field) return;
        if (sortBy === field) setSortOrder((o) => (o === 'ASC' ? 'DESC' : 'ASC'));
        else {
            setSortBy(field);
            setSortOrder(field === 'title' || field === 'job_code' || field === 'department' || field === 'location' ? 'ASC' : 'DESC');
        }
        setPage(1);
    };

    const sortIndicator = (col: ColumnId) => {
        const field = SORT_MAP[col];
        if (!field) return null;
        if (sortBy !== field) {
            return (
                <span className="jobs-list__sort-idle" aria-hidden>
                    ↕
                </span>
            );
        }
        return (
            <span className="jobs-list__sort-active" title={sortOrder === 'ASC' ? 'Sorted ascending' : 'Sorted descending'}>
                {sortOrder === 'ASC' ? '↑' : '↓'}
            </span>
        );
    };

    const toggleCol = (id: ColumnId) => {
        if (id === 'job' || id === 'actions') return;
        setVisibleCols((prev) => {
            if (prev.includes(id)) {
                const next = prev.filter((c) => c !== id);
                if (!next.includes('job')) return prev;
                if (!next.includes('actions')) return prev;
                return next;
            }
            return [...prev, id].sort((a, b) => ALL_COLUMNS.indexOf(a) - ALL_COLUMNS.indexOf(b));
        });
    };

    const resetFilters = () => {
        setSearchDraft('');
        setSearchQuery('');
        setStatusFilter('');
        setDepartmentFilter('');
        setLocationFilter('');
        setClientIdFilter('');
        setPage(1);
        setSortBy('updated_at');
        setSortOrder('DESC');
    };

    const savePreset = () => {
        const name = window.prompt('Name this view (filters + search)');
        if (!name?.trim()) return;
        const id = `${Date.now()}`;
        const next: SavedPreset = {
            id,
            name: name.trim(),
            search: searchQuery,
            status: statusFilter,
            department: departmentFilter,
            location: locationFilter,
            clientId: clientIdFilter,
        };
        setPresets((p) => [next, ...p].slice(0, 12));
        setToast(`Saved view “${next.name}”`);
        setShowPresetMenu(false);
    };

    const applyPreset = (pr: SavedPreset) => {
        setSearchDraft(pr.search);
        setSearchQuery(pr.search);
        setStatusFilter(pr.status);
        setDepartmentFilter(pr.department);
        setLocationFilter(pr.location);
        setClientIdFilter(pr.clientId);
        setPage(1);
        setShowPresetMenu(false);
        setToast(`Applied “${pr.name}”`);
    };

    const removePreset = (id: string) => {
        setPresets((p) => p.filter((x) => x.id !== id));
    };

    const copyShareLink = () => {
        const p = new URLSearchParams();
        if (searchQuery.trim()) p.set('q', searchQuery.trim());
        if (statusFilter) p.set('status', statusFilter);
        if (departmentFilter.trim()) p.set('dept', departmentFilter.trim());
        if (locationFilter.trim()) p.set('loc', locationFilter.trim());
        if (clientIdFilter.trim()) p.set('clientId', clientIdFilter.trim());
        if (page > 1) p.set('page', String(page));
        if (limit !== 20) p.set('limit', String(limit));
        if (sortBy !== 'updated_at') p.set('sort', sortBy);
        if (sortOrder !== 'DESC') p.set('ord', sortOrder);
        const url = `${window.location.origin}${window.location.pathname}?${p.toString()}`;
        void navigator.clipboard.writeText(url).then(
            () =>
                setToast(
                    'List link copied — includes filters & sort. Share so others open the same job list view.',
                ),
            () => setToast('Could not copy link'),
        );
    };

    const exportCsv = (rows: JobListItem[]) => {
        const csv = jobsToCsv(rows);
        downloadText(`jobs-export-${new Date().toISOString().slice(0, 10)}.csv`, csv, 'text/csv;charset=utf-8');
        setToast(`Exported ${rows.length} row(s)`);
    };

    const exportFilteredUpTo500 = async () => {
        try {
            const res = await fetchJobs({ ...buildFilters(1), page: 1, limit: 500 });
            exportCsv(res.items);
        } catch {
            setToast('Export failed');
        }
    };

    const toggleSelect = (id: string) => {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const toggleSelectAllPage = () => {
        if (!items.length) return;
        const pageIds = items.map((j) => j.id);
        const allOn = pageIds.every((id) => selected.has(id));
        setSelected((prev) => {
            const next = new Set(prev);
            if (allOn) pageIds.forEach((id) => next.delete(id));
            else pageIds.forEach((id) => next.add(id));
            return next;
        });
    };

    const selectedRows = useMemo(() => items.filter((j) => selected.has(j.id)), [items, selected]);

    const displayItems = useMemo(() => {
        return items
            .map((item, idx) => ({ item, idx }))
            .sort((a, b) => {
                const fa = favoriteIds.has(a.item.id) ? 1 : 0;
                const fb = favoriteIds.has(b.item.id) ? 1 : 0;
                if (fb !== fa) return fb - fa;
                return a.idx - b.idx;
            })
            .map(({ item }) => item);
    }, [items, favoriteIds]);

    const toggleFavorite = (id: string) => {
        setFavoriteIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            saveJson(LS_FAVORITES, [...next]);
            return next;
        });
    };

    const advancedFiltersDirty = Boolean(locationFilter.trim()) || Boolean(clientIdFilter.trim());

    const closeAllDropdowns = () => {
        setShowColumnMenu(false);
        setShowPresetMenu(false);
        setShowExportMenu(false);
        setShowMoreMenu(false);
        setActionMenu(null);
    };

    const openRowActionMenu = (e: React.MouseEvent, jobId: string) => {
        e.stopPropagation();
        const el = e.currentTarget as HTMLElement;
        const r = el.getBoundingClientRect();
        const w = 184;
        const menuH = 220;
        const left = Math.max(8, Math.min(r.right - w, window.innerWidth - w - 8));
        let top = r.bottom + 6;
        if (top + menuH > window.innerHeight - 8) {
            top = Math.max(8, r.top - menuH - 6);
        }
        setActionMenu((cur) => (cur?.jobId === jobId ? null : { jobId, top, left }));
        setShowColumnMenu(false);
        setShowPresetMenu(false);
        setShowExportMenu(false);
        setShowMoreMenu(false);
    };

    const actionMenuJob = useMemo(
        () => (actionMenu ? items.find((j) => j.id === actionMenu.jobId) : undefined),
        [actionMenu, items],
    );

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            await deleteJob(deleteTarget.id);
            setDeleteTarget(null);
            setToast(`Removed “${deleteTarget.title}”`);
            await load();
            await loadStats();
        } catch {
            setToast('Delete failed');
        } finally {
            setDeleting(false);
        }
    };

    const colVisible = (id: ColumnId) => visibleCols.includes(id);

    if (!canRead) {
        return (
            <StatePanel title="Access Denied" message="You do not have permission to view jobs." tone="danger" />
        );
    }

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return (
        <>
            <div className={`page-stack jobs-list jobs-list--${density}`}>
                {toast ? (
                    <div role="status" className="jobs-list__toast">
                        {toast}
                    </div>
                ) : null}

                <PageHeader
                    title="Jobs"
                    subtitle="Roles and reqs for your pipeline — starred jobs stay at the top of the list."
                    actions={
                        canCreate ? (
                            <button
                                onClick={() => navigate('/app/jobs/create')}
                                className="success-button jobs-list__cta-add"
                                type="button"
                            >
                                + Create job
                            </button>
                        ) : null
                    }
                />

                <SurfaceCard className="jobs-list__surface--stats">
                    <div className="jobs-list__stats">
                        <div className="jobs-list__stat">
                            <div className="jobs-list__stat-value">{statsLoading ? '…' : stats?.totalJobs ?? '—'}</div>
                            <div className="jobs-list__stat-label">Total jobs</div>
                        </div>
                        <div className="jobs-list__stat">
                            <div className="jobs-list__stat-value">{statsLoading ? '…' : stats?.openJobs ?? '—'}</div>
                            <div className="jobs-list__stat-label">Open</div>
                        </div>
                        <div className="jobs-list__stat">
                            <div className="jobs-list__stat-value">{statsLoading ? '…' : stats?.closedJobs ?? '—'}</div>
                            <div className="jobs-list__stat-label">Closed</div>
                        </div>
                        <div className="jobs-list__stat">
                            <div className="jobs-list__stat-value">{statsLoading ? '…' : stats?.draftJobs ?? '—'}</div>
                            <div className="jobs-list__stat-label">Draft</div>
                        </div>
                        <div className="jobs-list__stat">
                            <div className="jobs-list__stat-value">{statsLoading ? '…' : stats?.archivedJobs ?? '—'}</div>
                            <div className="jobs-list__stat-label">Archived</div>
                        </div>
                    </div>
                </SurfaceCard>

                <SurfaceCard className="jobs-list__surface--filters">
                    <div className="jobs-list__filters-bar">
                        <div className="jobs-list__filters-bar-main">
                            <div>
                                <div className="jobs-list__filter-label">Search</div>
                                <input
                                    ref={searchInputRef}
                                    className="jobs-list__input"
                                    value={searchDraft}
                                    onChange={(e) => setSearchDraft(e.target.value)}
                                    placeholder="Title, code, location, client req ID, department…"
                                    aria-label="Search jobs"
                                />
                            </div>
                            <div>
                                <div className="jobs-list__filter-label">Status</div>
                                <select
                                    className="jobs-list__select"
                                    value={statusFilter}
                                    onChange={(e) => {
                                        setStatusFilter(e.target.value);
                                        setPage(1);
                                    }}
                                >
                                    <option value="">All statuses</option>
                                    <option value="open">Open</option>
                                    <option value="closed">Closed</option>
                                    <option value="draft">Draft</option>
                                    <option value="archived">Archived</option>
                                </select>
                            </div>
                            <div>
                                <div className="jobs-list__filter-label">Department</div>
                                <input
                                    className="jobs-list__input"
                                    value={departmentFilter}
                                    onChange={(e) => {
                                        setDepartmentFilter(e.target.value);
                                        setPage(1);
                                    }}
                                    placeholder="Department contains…"
                                />
                            </div>
                        </div>
                        <button
                            type="button"
                            className={`jobs-list__filter-gear${advancedFiltersDirty ? ' jobs-list__filter-gear-dot' : ''}`}
                            aria-label={advancedFiltersOpen ? 'Hide extra filters' : 'More filters'}
                            aria-pressed={advancedFiltersOpen}
                            title="Location & linked client"
                            onClick={() => setAdvancedFiltersOpen((o) => !o)}
                        >
                            ⚙
                        </button>
                    </div>

                    {advancedFiltersOpen ? (
                        <div className="jobs-list__filters-advanced">
                            <div>
                                <div className="jobs-list__filter-label">Location</div>
                                <input
                                    className="jobs-list__input"
                                    value={locationFilter}
                                    onChange={(e) => {
                                        setLocationFilter(e.target.value);
                                        setPage(1);
                                    }}
                                    placeholder="Location contains…"
                                />
                            </div>
                            <div>
                                <div className="jobs-list__filter-label">Linked client (UUID)</div>
                                <input
                                    className="jobs-list__input"
                                    value={clientIdFilter}
                                    onChange={(e) => {
                                        setClientIdFilter(e.target.value);
                                        setPage(1);
                                    }}
                                    placeholder="Filter jobs linked to a client"
                                />
                            </div>
                        </div>
                    ) : null}
                </SurfaceCard>

                <SurfaceCard className="no-padding jobs-list__table-shell">
                    <div className="jobs-list__table-toolbar">
                        <div className="jobs-list__dropdown">
                            <button
                                type="button"
                                className="jobs-list__menu-trigger jobs-list__menu-trigger--chevron"
                                aria-expanded={showExportMenu}
                                onClick={() => {
                                    setShowExportMenu((v) => !v);
                                    setShowMoreMenu(false);
                                    setShowColumnMenu(false);
                                    setShowPresetMenu(false);
                                }}
                            >
                                Export
                            </button>
                            {showExportMenu ? (
                                <div className="jobs-list__dropdown-panel" role="menu">
                                    <button
                                        type="button"
                                        className="jobs-list__dropdown-action"
                                        role="menuitem"
                                        onClick={() => {
                                            exportCsv(items);
                                            setShowExportMenu(false);
                                        }}
                                    >
                                        Current page (CSV)
                                    </button>
                                    <button
                                        type="button"
                                        className="jobs-list__dropdown-action"
                                        role="menuitem"
                                        onClick={() => {
                                            void exportFilteredUpTo500();
                                            setShowExportMenu(false);
                                        }}
                                    >
                                        Filtered results (up to 500)
                                    </button>
                                    <button
                                        type="button"
                                        className="jobs-list__dropdown-action"
                                        role="menuitem"
                                        disabled={selectedRows.length === 0}
                                        onClick={() => {
                                            exportCsv(selectedRows);
                                            setShowExportMenu(false);
                                        }}
                                    >
                                        Selected rows{selectedRows.length ? ` (${selectedRows.length})` : ''}
                                    </button>
                                </div>
                            ) : null}
                        </div>

                        <div className="jobs-list__dropdown">
                            <button
                                type="button"
                                className="jobs-list__menu-trigger jobs-list__menu-trigger--chevron"
                                aria-expanded={showMoreMenu}
                                onClick={() => {
                                    setShowMoreMenu((v) => !v);
                                    setShowExportMenu(false);
                                    setShowColumnMenu(false);
                                    setShowPresetMenu(false);
                                }}
                            >
                                More
                            </button>
                            {showMoreMenu ? (
                                <div className="jobs-list__dropdown-panel" role="menu">
                                    <button
                                        type="button"
                                        className="jobs-list__dropdown-action"
                                        role="menuitem"
                                        disabled={loading}
                                        onClick={() => {
                                            void load();
                                            setShowMoreMenu(false);
                                        }}
                                    >
                                        Refresh list
                                    </button>
                                    <button
                                        type="button"
                                        className="jobs-list__dropdown-action"
                                        role="menuitem"
                                        disabled={statsLoading}
                                        onClick={() => {
                                            void loadStats();
                                            setShowMoreMenu(false);
                                        }}
                                    >
                                        Refresh stats
                                    </button>
                                    <button
                                        type="button"
                                        className="jobs-list__dropdown-action"
                                        role="menuitem"
                                        onClick={() => {
                                            copyShareLink();
                                            setShowMoreMenu(false);
                                        }}
                                    >
                                        Copy list link (filters & sort)
                                    </button>
                                    <div className="jobs-list__dropdown-divider" />
                                    <button
                                        type="button"
                                        className="jobs-list__dropdown-action"
                                        role="menuitem"
                                        onClick={() => {
                                            resetFilters();
                                            setShowMoreMenu(false);
                                        }}
                                    >
                                        Clear all filters
                                    </button>
                                </div>
                            ) : null}
                        </div>

                        <div className="jobs-list__dropdown">
                            <button
                                type="button"
                                className="jobs-list__menu-trigger jobs-list__menu-trigger--chevron"
                                aria-expanded={showColumnMenu}
                                onClick={() => {
                                    setShowColumnMenu((v) => !v);
                                    setShowExportMenu(false);
                                    setShowMoreMenu(false);
                                    setShowPresetMenu(false);
                                }}
                            >
                                Columns
                            </button>
                            {showColumnMenu ? (
                                <div className="jobs-list__dropdown-panel" role="menu">
                                    {ALL_COLUMNS.map((cid) => (
                                        <label key={cid} className="jobs-list__dropdown-item">
                                            <input
                                                type="checkbox"
                                                checked={colVisible(cid)}
                                                disabled={cid === 'job' || cid === 'actions'}
                                                onChange={() => toggleCol(cid)}
                                            />
                                            {COLUMN_LABEL[cid]}
                                        </label>
                                    ))}
                                    <div className="jobs-list__dropdown-divider" />
                                    <button type="button" className="jobs-list__dropdown-action" onClick={() => setVisibleCols([...ALL_COLUMNS])}>
                                        Reset columns
                                    </button>
                                </div>
                            ) : null}
                        </div>

                        <div className="jobs-list__dropdown">
                            <button
                                type="button"
                                className="jobs-list__menu-trigger jobs-list__menu-trigger--chevron"
                                aria-expanded={showPresetMenu}
                                onClick={() => {
                                    setShowPresetMenu((v) => !v);
                                    setShowExportMenu(false);
                                    setShowMoreMenu(false);
                                    setShowColumnMenu(false);
                                }}
                            >
                                Saved views
                            </button>
                            {showPresetMenu ? (
                                <div className="jobs-list__dropdown-panel" role="menu">
                                    <button type="button" className="jobs-list__dropdown-action" onClick={savePreset}>
                                        + Save current filters
                                    </button>
                                    <div className="jobs-list__dropdown-divider" />
                                    {presets.length === 0 ? (
                                        <div style={{ padding: '10px 16px', fontSize: 13, color: '#64748b' }}>No saved views yet.</div>
                                    ) : (
                                        presets.map((pr) => (
                                            <div
                                                key={pr.id}
                                                className="jobs-list__dropdown-item"
                                                style={{ justifyContent: 'space-between' }}
                                            >
                                                <button
                                                    type="button"
                                                    style={{
                                                        border: 'none',
                                                        background: 'none',
                                                        cursor: 'pointer',
                                                        textAlign: 'left',
                                                        flex: 1,
                                                        fontSize: 13,
                                                        fontWeight: 500,
                                                        color: '#334155',
                                                    }}
                                                    onClick={() => applyPreset(pr)}
                                                >
                                                    {pr.name}
                                                </button>
                                                <button
                                                    type="button"
                                                    className="jobs-list__dropdown-action"
                                                    style={{ width: 'auto', padding: '4px 8px' }}
                                                    onClick={() => removePreset(pr.id)}
                                                    aria-label={`Remove ${pr.name}`}
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            ) : null}
                        </div>

                        <label className="jobs-list__menu-trigger" style={{ cursor: 'pointer', margin: 0 }}>
                            <span style={{ color: '#64748b', fontWeight: 600 }}>Rows</span>
                            <select
                                className="jobs-list__select"
                                style={{ width: 'auto', minWidth: 64, marginLeft: 6, padding: '4px 8px', border: 'none', boxShadow: 'none' }}
                                value={limit}
                                onChange={(e) => {
                                    setLimit(Number(e.target.value));
                                    setPage(1);
                                }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                {[10, 20, 50, 100].map((n) => (
                                    <option key={n} value={n}>
                                        {n}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label className="jobs-list__menu-trigger" style={{ cursor: 'pointer', margin: 0 }}>
                            <span style={{ color: '#64748b', fontWeight: 600 }}>Density</span>
                            <select
                                className="jobs-list__select"
                                style={{ width: 'auto', minWidth: 108, marginLeft: 6, padding: '4px 8px', border: 'none', boxShadow: 'none' }}
                                value={density}
                                onChange={(e) => setDensity(e.target.value as Density)}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <option value="comfortable">Comfortable</option>
                                <option value="compact">Compact</option>
                            </select>
                        </label>
                    </div>

                    {showColumnMenu || showPresetMenu || showExportMenu || showMoreMenu ? (
                        <button type="button" className="jobs-list__overlay" aria-label="Close menus" onClick={closeAllDropdowns} />
                    ) : null}

                    <div className="jobs-list__table-wrap">
                        <table className="jobs-list__table">
                            <thead className="jobs-list__thead">
                                <tr>
                                    {colVisible('select') ? (
                                        <th className="jobs-list__th" style={{ width: 40 }}>
                                            <input
                                                type="checkbox"
                                                checked={items.length > 0 && items.every((j) => selected.has(j.id))}
                                                onChange={toggleSelectAllPage}
                                                aria-label="Select all on page"
                                            />
                                        </th>
                                    ) : null}
                                    {colVisible('job') ? (
                                        <th className="jobs-list__th jobs-list__th--sortable" onClick={() => onSortColumn('job')}>
                                            Job {sortIndicator('job')}
                                        </th>
                                    ) : null}
                                    {colVisible('client_ref') ? (
                                        <th className="jobs-list__th jobs-list__th--sortable" onClick={() => onSortColumn('client_ref')}>
                                            Client ref {sortIndicator('client_ref')}
                                        </th>
                                    ) : null}
                                    {colVisible('department') ? (
                                        <th className="jobs-list__th jobs-list__th--sortable" onClick={() => onSortColumn('department')}>
                                            Department {sortIndicator('department')}
                                        </th>
                                    ) : null}
                                    {colVisible('location') ? (
                                        <th className="jobs-list__th jobs-list__th--sortable" onClick={() => onSortColumn('location')}>
                                            Location {sortIndicator('location')}
                                        </th>
                                    ) : null}
                                    {colVisible('employment') ? (
                                        <th className="jobs-list__th jobs-list__th--sortable" onClick={() => onSortColumn('employment')}>
                                            Employment {sortIndicator('employment')}
                                        </th>
                                    ) : null}
                                    {colVisible('status') ? (
                                        <th className="jobs-list__th jobs-list__th--sortable" onClick={() => onSortColumn('status')}>
                                            Status {sortIndicator('status')}
                                        </th>
                                    ) : null}
                                    {colVisible('salary') ? (
                                        <th className="jobs-list__th jobs-list__th--sortable" onClick={() => onSortColumn('salary')}>
                                            Salary {sortIndicator('salary')}
                                        </th>
                                    ) : null}
                                    {colVisible('updated') ? (
                                        <th className="jobs-list__th jobs-list__th--sortable" onClick={() => onSortColumn('updated')}>
                                            Updated {sortIndicator('updated')}
                                        </th>
                                    ) : null}
                                    {colVisible('actions') ? (
                                        <th className="jobs-list__th jobs-list__th--actions" aria-label="Row actions" />
                                    ) : null}
                                </tr>
                            </thead>
                            <tbody>
                                {loading
                                    ? Array.from({ length: 8 }).map((_, i) => (
                                          <tr key={i} className="jobs-list__row">
                                              {visibleCols.map((col) => (
                                                  <td key={col} className="jobs-list__td">
                                                      <div className="jobs-list__skel" />
                                                  </td>
                                              ))}
                                          </tr>
                                      ))
                                    : null}
                                {!loading && error ? (
                                    <tr>
                                        <td colSpan={visibleCols.length} style={{ padding: 24, textAlign: 'center', color: '#b91c1c' }}>
                                            {error}
                                            <div style={{ marginTop: 12 }}>
                                                <button type="button" className="ghost-button" onClick={() => void load()}>
                                                    Retry
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ) : null}
                                {!loading && !error && items.length === 0 ? (
                                    <tr>
                                        <td colSpan={visibleCols.length} style={{ padding: 32, textAlign: 'center' }}>
                                            <div style={{ fontWeight: 600, marginBottom: 8 }}>No jobs match</div>
                                            <div style={{ color: '#6b7280', marginBottom: 16 }}>Adjust filters or create a job.</div>
                                            {canCreate ? (
                                                <button type="button" onClick={() => navigate('/app/jobs/create')} className="success-button">
                                                    + Create job
                                                </button>
                                            ) : null}
                                        </td>
                                    </tr>
                                ) : null}
                                {!loading &&
                                    !error &&
                                    displayItems.map((j) => (
                                        <tr
                                            key={j.id}
                                            className={`jobs-list__row${selected.has(j.id) ? ' jobs-list__row--selected' : ''}`}
                                        >
                                            {colVisible('select') ? (
                                                <td className="jobs-list__td">
                                                    <input
                                                        type="checkbox"
                                                        checked={selected.has(j.id)}
                                                        onChange={() => toggleSelect(j.id)}
                                                        onClick={(e) => e.stopPropagation()}
                                                        aria-label={`Select ${j.title}`}
                                                    />
                                                </td>
                                            ) : null}
                                            {colVisible('job') ? (
                                                <td className="jobs-list__td">
                                                    <div className="jobs-list__client-cell-inner">
                                                        <button
                                                            type="button"
                                                            className={`jobs-list__fav${favoriteIds.has(j.id) ? ' jobs-list__fav--on' : ''}`}
                                                            aria-label={favoriteIds.has(j.id) ? 'Remove from favorites' : 'Add to favorites'}
                                                            aria-pressed={favoriteIds.has(j.id)}
                                                            title="Favorite — keeps this job at the top"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                toggleFavorite(j.id);
                                                            }}
                                                        >
                                                            {favoriteIds.has(j.id) ? '★' : '☆'}
                                                        </button>
                                                        <div className="jobs-list__client-cell-text">
                                                            <button
                                                                type="button"
                                                                className="jobs-list__client-name"
                                                                onClick={() => navigate(`/app/jobs/${j.id}`)}
                                                            >
                                                                {j.title}
                                                            </button>
                                                            {j.job_code ? <div className="jobs-list__job-sub">{j.job_code}</div> : null}
                                                        </div>
                                                    </div>
                                                </td>
                                            ) : null}
                                            {colVisible('client_ref') ? (
                                                <td className="jobs-list__td">
                                                    <div className="jobs-list__contact-primary">{j.client_code || '—'}</div>
                                                    {j.client_req_id ? (
                                                        <div className="jobs-list__contact-secondary">Req: {j.client_req_id}</div>
                                                    ) : null}
                                                </td>
                                            ) : null}
                                            {colVisible('department') ? <td className="jobs-list__td">{j.department || '—'}</td> : null}
                                            {colVisible('location') ? <td className="jobs-list__td">{j.location || '—'}</td> : null}
                                            {colVisible('employment') ? (
                                                <td className="jobs-list__td">{j.employment_type || '—'}</td>
                                            ) : null}
                                            {colVisible('status') ? (
                                                <td className="jobs-list__td">
                                                    <JobStatusBadge status={j.status} />
                                                </td>
                                            ) : null}
                                            {colVisible('salary') ? (
                                                <td className="jobs-list__td">{formatSalaryRange(j)}</td>
                                            ) : null}
                                            {colVisible('updated') ? (
                                                <td className="jobs-list__td">{formatListDate(j.updated_at)}</td>
                                            ) : null}
                                            {colVisible('actions') ? (
                                                <td className="jobs-list__td jobs-list__td--actions">
                                                    <button
                                                        type="button"
                                                        className="jobs-list__kebab"
                                                        aria-label={`Actions for ${j.title}`}
                                                        aria-expanded={actionMenu?.jobId === j.id}
                                                        aria-haspopup="menu"
                                                        onClick={(e) => openRowActionMenu(e, j.id)}
                                                    >
                                                        ⋮
                                                    </button>
                                                </td>
                                            ) : null}
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>

                    {total > 0 ? (
                        <div style={{ padding: '10px 16px 14px' }}>
                            <ModuleDataListPagination
                                page={page}
                                pageSize={limit}
                                total={total}
                                onPrev={() => setPage((p) => Math.max(1, p - 1))}
                                onNext={() => setPage((p) => (p < totalPages ? p + 1 : p))}
                            />
                        </div>
                    ) : null}
                </SurfaceCard>

                {deleteTarget ? (
                    <div
                        role="dialog"
                        aria-modal
                        style={{
                            position: 'fixed',
                            inset: 0,
                            background: 'rgba(15,23,42,0.45)',
                            zIndex: 200,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: 16,
                        }}
                    >
                        <div style={{ maxWidth: 400, width: '100%' }}>
                            <SurfaceCard>
                                <div style={{ fontWeight: 700, marginBottom: 8 }}>Delete job?</div>
                                <div style={{ color: '#4b5563', marginBottom: 16 }}>
                                    “{deleteTarget.title}” will be removed. This cannot be undone from the list.
                                </div>
                                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                    <button type="button" className="ghost-button" onClick={() => setDeleteTarget(null)}>
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        className="success-button"
                                        style={{ background: '#b91c1c', borderColor: '#b91c1c' }}
                                        disabled={deleting}
                                        onClick={() => void confirmDelete()}
                                    >
                                        {deleting ? 'Deleting…' : 'Delete'}
                                    </button>
                                </div>
                            </SurfaceCard>
                        </div>
                    </div>
                ) : null}
            </div>

            {actionMenu && actionMenuJob ? (
                <>
                    <button type="button" className="jobs-list__overlay" aria-label="Close menu" onClick={() => setActionMenu(null)} />
                    <div className="jobs-list__action-flyout" role="menu" style={{ top: actionMenu.top, left: actionMenu.left }}>
                        <button
                            type="button"
                            role="menuitem"
                            onClick={() => {
                                navigate(`/app/jobs/${actionMenuJob.id}`);
                                setActionMenu(null);
                            }}
                        >
                            View
                        </button>
                        {canUpdate ? (
                            <button
                                type="button"
                                role="menuitem"
                                onClick={() => {
                                    navigate(`/app/jobs/${actionMenuJob.id}/edit`);
                                    setActionMenu(null);
                                }}
                            >
                                Edit
                            </button>
                        ) : null}
                        <button
                            type="button"
                            role="menuitem"
                            onClick={() => {
                                const url = `${window.location.origin}/app/jobs/${actionMenuJob.id}`;
                                void navigator.clipboard.writeText(url).then(
                                    () => setToast('Job link copied — open in browser while signed in.'),
                                    () => setToast('Copy failed'),
                                );
                                setActionMenu(null);
                            }}
                        >
                            Copy job link
                        </button>
                        {canDelete ? (
                            <button
                                type="button"
                                role="menuitem"
                                className="jobs-list__action-danger"
                                onClick={() => {
                                    setDeleteTarget(actionMenuJob);
                                    setActionMenu(null);
                                }}
                            >
                                Delete…
                            </button>
                        ) : null}
                    </div>
                </>
            ) : null}
        </>
    );
}
