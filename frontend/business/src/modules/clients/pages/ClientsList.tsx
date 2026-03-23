import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../stores/authStore';
import {
    Client,
    ClientListResponse,
    ClientListSummary,
    ClientFilters,
    ClientSortField,
    fetchClients,
    fetchClientListSummary,
    deleteClient,
} from '../services/clients.api';
import PageHeader from '../../../components/ui/PageHeader';
import SurfaceCard from '../../../components/ui/SurfaceCard';
import StatePanel from '../../../components/ui/StatePanel';
import { formatListDate, ModuleDataListPagination } from '../../../components/ui/moduleDataList';
import './ClientsList.css';

const LS_PAGE = 'clientsList.v1.pageSize';
const LS_COLS = 'clientsList.v1.columns';
const LS_DENSITY = 'clientsList.v1.density';
const LS_PRESETS = 'clientsList.v1.presets';
const LS_ADV_FILTERS = 'clientsList.v1.advancedFiltersOpen';
const LS_FAVORITES = 'clientsList.v1.favorites';

type Density = 'comfortable' | 'compact';
type ColumnId =
    | 'select'
    | 'client'
    | 'code'
    | 'contact'
    | 'location'
    | 'industry'
    | 'status'
    | 'account'
    | 'updated'
    | 'actions';

const ALL_COLUMNS: ColumnId[] = [
    'select',
    'client',
    'code',
    'contact',
    'location',
    'industry',
    'status',
    'account',
    'updated',
    'actions',
];

const COLUMN_LABEL: Record<ColumnId, string> = {
    select: 'Bulk select',
    client: 'Client',
    code: 'Code',
    contact: 'Contact',
    location: 'Location',
    industry: 'Industry',
    status: 'Status',
    account: 'Account active',
    updated: 'Updated',
    actions: 'Actions',
};

const SORT_MAP: Partial<Record<ColumnId, ClientSortField>> = {
    client: 'name',
    code: 'code',
    contact: 'contact_person',
    location: 'city',
    industry: 'industry',
    status: 'status',
    account: 'is_active',
    updated: 'updated_at',
};

type SavedPreset = {
    id: string;
    name: string;
    search: string;
    status: string;
    industry: string;
    city: string;
    country: string;
    state: string;
    isActive: 'all' | 'true' | 'false';
};

function readUrlFilters(): {
    search: string;
    status: string;
    industry: string;
    city: string;
    country: string;
    state: string;
    isActive: 'all' | 'true' | 'false';
    page: number;
    limit: number;
    sortBy: ClientSortField;
    sortOrder: 'ASC' | 'DESC';
} {
    const sp = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    const ia = sp.get('ia');
    return {
        search: sp.get('q') || '',
        status: sp.get('status') || '',
        industry: sp.get('industry') || '',
        city: sp.get('city') || '',
        country: sp.get('country') || '',
        state: sp.get('state') || '',
        isActive: ia === '1' ? 'true' : ia === '0' ? 'false' : 'all',
        page: Math.max(1, parseInt(sp.get('page') || '1', 10) || 1),
        limit: Math.min(100, Math.max(10, parseInt(sp.get('limit') || '20', 10) || 20)),
        sortBy: (sp.get('sort') as ClientSortField) || 'updated_at',
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

function clientsToCsv(rows: Client[]): string {
    const headers = ['id', 'name', 'code', 'contact', 'email', 'phone', 'city', 'state', 'country', 'industry', 'status', 'is_active', 'website', 'updated_at'];
    const lines = [headers.join(',')];
    for (const c of rows) {
        const isActive = c.is_active === false ? 'false' : 'true';
        const vals = [
            c.id,
            c.name,
            c.code || '',
            c.contact_person || '',
            c.email || '',
            c.phone || '',
            c.city || '',
            c.state || '',
            c.country || '',
            c.industry || '',
            c.status || '',
            isActive,
            c.website || '',
            c.updated_at || '',
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

function displayDomain(url?: string | null): string {
    if (!url?.trim()) return '';
    const s = url.trim();
    try {
        const u = new URL(s.includes('://') ? s : `https://${s}`);
        return u.hostname.replace(/^www\./i, '') || s;
    } catch {
        return s;
    }
}

export default function ClientsList() {
    const navigate = useNavigate();
    const searchInputRef = useRef<HTMLInputElement>(null);
    const permissions = useAuthStore((s) => s.user?.permissions || []);

    const hasPermission = (permission: string) =>
        permissions.includes('*') || permissions.includes(permission);

    const canRead = hasPermission('clients:view') || hasPermission('clients:read');
    const canCreate = hasPermission('clients:create');
    const canUpdate = hasPermission('clients:update');
    const canDelete = hasPermission('clients:delete');

    const url0 = useMemo(() => readUrlFilters(), []);

    const [searchDraft, setSearchDraft] = useState(url0.search);
    const [searchQuery, setSearchQuery] = useState(url0.search);
    const [statusFilter, setStatusFilter] = useState(url0.status);
    const [industryFilter, setIndustryFilter] = useState(url0.industry);
    const [cityFilter, setCityFilter] = useState(url0.city);
    const [countryFilter, setCountryFilter] = useState(url0.country);
    const [stateFilter, setStateFilter] = useState(url0.state);
    const [isActiveFilter, setIsActiveFilter] = useState<'all' | 'true' | 'false'>(url0.isActive);
    const [page, setPage] = useState(url0.page);
    const [limit, setLimit] = useState(() => {
        const stored = loadJson<number | null>(LS_PAGE, null);
        if (stored && [10, 20, 50, 100].includes(stored)) return stored;
        return url0.limit;
    });
    const [sortBy, setSortBy] = useState<ClientSortField>(url0.sortBy);
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

    const [items, setItems] = useState<Client[]>([]);
    const [total, setTotal] = useState(0);
    const [summary, setSummary] = useState<ClientListSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [summaryLoading, setSummaryLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [deleteTarget, setDeleteTarget] = useState<Client | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [showColumnMenu, setShowColumnMenu] = useState(false);
    const [showPresetMenu, setShowPresetMenu] = useState(false);
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [showMoreMenu, setShowMoreMenu] = useState(false);
    const [advancedFiltersOpen, setAdvancedFiltersOpen] = useState(() =>
        loadJson<boolean | null>(LS_ADV_FILTERS, null) ?? false,
    );
    const [favoriteIds, setFavoriteIds] = useState<Set<string>>(() => new Set(loadJson<string[]>(LS_FAVORITES, [])));
    const [actionMenu, setActionMenu] = useState<{ clientId: string; top: number; left: number } | null>(null);
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
        if (actionMenu && !items.some((c) => c.id === actionMenu.clientId)) {
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
        (pageOverride?: number): ClientFilters => {
            const filters: ClientFilters = {
                page: pageOverride ?? page,
                limit,
                search: searchQuery.trim() || undefined,
                status: statusFilter || undefined,
                industry: industryFilter.trim() || undefined,
                city: cityFilter.trim() || undefined,
                country: countryFilter.trim() || undefined,
                state: stateFilter.trim() || undefined,
                sortBy,
                sortOrder,
            };
            if (isActiveFilter === 'true') filters.is_active = true;
            if (isActiveFilter === 'false') filters.is_active = false;
            return filters;
        },
        [
            page,
            limit,
            searchQuery,
            statusFilter,
            industryFilter,
            cityFilter,
            countryFilter,
            stateFilter,
            isActiveFilter,
            sortBy,
            sortOrder,
        ],
    );

    const loadSummary = useCallback(async () => {
        if (!canRead) return;
        try {
            setSummaryLoading(true);
            const s = await fetchClientListSummary();
            setSummary(s);
        } catch {
            setSummary(null);
        } finally {
            setSummaryLoading(false);
        }
    }, [canRead]);

    const load = useCallback(async () => {
        if (!canRead) return;
        try {
            setLoading(true);
            setError(null);
            const filters = buildFilters();
            const res: ClientListResponse = await fetchClients(filters);
            setItems(res.data);
            setTotal(res.total);
            if (res.page != null && res.page !== page) setPage(res.page);
            setSelected(new Set());
        } catch (err: unknown) {
            const message =
                (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
                (err as Error)?.message ||
                'Failed to load clients';
            setError(message);
        } finally {
            setLoading(false);
        }
    }, [canRead, buildFilters, page]);

    useEffect(() => {
        void load();
    }, [load]);

    useEffect(() => {
        loadSummary();
    }, [loadSummary]);

    const onSortColumn = (col: ColumnId) => {
        const field = SORT_MAP[col];
        if (!field) return;
        if (sortBy === field) setSortOrder((o) => (o === 'ASC' ? 'DESC' : 'ASC'));
        else {
            setSortBy(field);
            setSortOrder(field === 'name' || field === 'code' || field === 'city' ? 'ASC' : 'DESC');
        }
        setPage(1);
    };

    const sortIndicator = (col: ColumnId) => {
        const field = SORT_MAP[col];
        if (!field) return null;
        if (sortBy !== field) {
            return (
                <span className="clients-list__sort-idle" aria-hidden>
                    ↕
                </span>
            );
        }
        return (
            <span className="clients-list__sort-active" title={sortOrder === 'ASC' ? 'Sorted ascending' : 'Sorted descending'}>
                {sortOrder === 'ASC' ? '↑' : '↓'}
            </span>
        );
    };

    const toggleCol = (id: ColumnId) => {
        if (id === 'client' || id === 'actions') return;
        setVisibleCols((prev) => {
            if (prev.includes(id)) {
                const next = prev.filter((c) => c !== id);
                if (!next.includes('client')) return prev;
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
        setIndustryFilter('');
        setCityFilter('');
        setCountryFilter('');
        setStateFilter('');
        setIsActiveFilter('all');
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
            industry: industryFilter,
            city: cityFilter,
            country: countryFilter,
            state: stateFilter,
            isActive: isActiveFilter,
        };
        setPresets((p) => [next, ...p].slice(0, 12));
        setToast(`Saved view “${next.name}”`);
        setShowPresetMenu(false);
    };

    const applyPreset = (pr: SavedPreset) => {
        setSearchDraft(pr.search);
        setSearchQuery(pr.search);
        setStatusFilter(pr.status);
        setIndustryFilter(pr.industry);
        setCityFilter(pr.city);
        setCountryFilter(pr.country);
        setStateFilter(pr.state);
        setIsActiveFilter(pr.isActive);
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
        if (industryFilter.trim()) p.set('industry', industryFilter.trim());
        if (cityFilter.trim()) p.set('city', cityFilter.trim());
        if (countryFilter.trim()) p.set('country', countryFilter.trim());
        if (stateFilter.trim()) p.set('state', stateFilter.trim());
        if (isActiveFilter === 'true') p.set('ia', '1');
        if (isActiveFilter === 'false') p.set('ia', '0');
        if (page > 1) p.set('page', String(page));
        if (limit !== 20) p.set('limit', String(limit));
        if (sortBy !== 'updated_at') p.set('sort', sortBy);
        if (sortOrder !== 'DESC') p.set('ord', sortOrder);
        const url = `${window.location.origin}${window.location.pathname}?${p.toString()}`;
        void navigator.clipboard.writeText(url).then(
            () =>
                setToast(
                    'List link copied — includes current filters & sort. Paste in Slack/email so teammates open the same view.',
                ),
            () => setToast('Could not copy link'),
        );
    };

    const exportCsv = (rows: Client[]) => {
        const csv = clientsToCsv(rows);
        downloadText(`clients-export-${new Date().toISOString().slice(0, 10)}.csv`, csv, 'text/csv;charset=utf-8');
        setToast(`Exported ${rows.length} row(s)`);
    };

    const exportFilteredUpTo500 = async () => {
        try {
            const filters = { ...buildFilters(1), page: 1, limit: 500 };
            const res = await fetchClients(filters);
            exportCsv(res.data);
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
        const pageIds = items.map((c) => c.id);
        const allOn = pageIds.every((id) => selected.has(id));
        setSelected((prev) => {
            const next = new Set(prev);
            if (allOn) pageIds.forEach((id) => next.delete(id));
            else pageIds.forEach((id) => next.add(id));
            return next;
        });
    };

    const selectedRows = useMemo(() => items.filter((c) => selected.has(c.id)), [items, selected]);

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

    const advancedFiltersDirty =
        Boolean(industryFilter.trim()) ||
        Boolean(cityFilter.trim()) ||
        Boolean(stateFilter.trim()) ||
        Boolean(countryFilter.trim());

    const closeAllDropdowns = () => {
        setShowColumnMenu(false);
        setShowPresetMenu(false);
        setShowExportMenu(false);
        setShowMoreMenu(false);
        setActionMenu(null);
    };

    const openRowActionMenu = (e: React.MouseEvent, clientId: string) => {
        e.stopPropagation();
        const el = e.currentTarget as HTMLElement;
        const r = el.getBoundingClientRect();
        const w = 184;
        const menuH = 200;
        const left = Math.max(8, Math.min(r.right - w, window.innerWidth - w - 8));
        let top = r.bottom + 6;
        if (top + menuH > window.innerHeight - 8) {
            top = Math.max(8, r.top - menuH - 6);
        }
        setActionMenu((cur) => (cur?.clientId === clientId ? null : { clientId, top, left }));
        setShowColumnMenu(false);
        setShowPresetMenu(false);
        setShowExportMenu(false);
        setShowMoreMenu(false);
    };

    const actionMenuClient = useMemo(
        () => (actionMenu ? items.find((c) => c.id === actionMenu.clientId) : undefined),
        [actionMenu, items],
    );

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            await deleteClient(deleteTarget.id);
            setDeleteTarget(null);
            setToast(`Removed ${deleteTarget.name}`);
            await load();
            await loadSummary();
        } catch {
            setToast('Delete failed');
        } finally {
            setDeleting(false);
        }
    };

    const colVisible = (id: ColumnId) => visibleCols.includes(id);

    if (!canRead) {
        return (
            <StatePanel
                title="Access Denied"
                message="You do not have permission to view clients."
                tone="danger"
            />
        );
    }

    const totalPages = Math.max(1, Math.ceil(total / limit));
    const inactivePlusSuspended =
        summary != null ? summary.inactive + summary.suspended : null;

    return (
        <>
        <div className={`page-stack clients-list clients-list--${density}`}>
            {toast ? (
                <div role="status" className="clients-list__toast">
                    {toast}
                </div>
            ) : null}

            <PageHeader
                title="Clients"
                subtitle="Client companies you work with — starred records stay at the top of your list."
                actions={
                    canCreate ? (
                        <button
                            onClick={() => navigate('/app/clients/create')}
                            className="success-button clients-list__cta-add"
                            type="button"
                        >
                            + Add client
                        </button>
                    ) : null
                }
            />

            <SurfaceCard className="clients-list__surface--stats">
                <div className="clients-list__stats">
                    <div className="clients-list__stat">
                        <div className="clients-list__stat-value">{summaryLoading ? '…' : summary?.total ?? '—'}</div>
                        <div className="clients-list__stat-label">Total clients</div>
                    </div>
                    <div className="clients-list__stat">
                        <div className="clients-list__stat-value">{summaryLoading ? '…' : summary?.active ?? '—'}</div>
                        <div className="clients-list__stat-label">Active</div>
                    </div>
                    <div className="clients-list__stat">
                        <div className="clients-list__stat-value">{summaryLoading ? '…' : inactivePlusSuspended ?? '—'}</div>
                        <div className="clients-list__stat-label">Inactive / suspended</div>
                    </div>
                    <div className="clients-list__stat">
                        <div className="clients-list__stat-value">{summaryLoading ? '…' : summary?.clients_with_open_jobs ?? '—'}</div>
                        <div className="clients-list__stat-label">With open jobs</div>
                    </div>
                </div>
            </SurfaceCard>

            <SurfaceCard className="clients-list__surface--filters">
                <div className="clients-list__filters-bar">
                    <div className="clients-list__filters-bar-main">
                        <div>
                            <div className="clients-list__filter-label">Search</div>
                            <input
                                ref={searchInputRef}
                                className="clients-list__input"
                                value={searchDraft}
                                onChange={(e) => setSearchDraft(e.target.value)}
                                placeholder="Name, code, email, contact, phone…"
                                aria-label="Search clients"
                            />
                        </div>
                        <div>
                            <div className="clients-list__filter-label">Status</div>
                            <select
                                className="clients-list__select"
                                value={statusFilter}
                                onChange={(e) => {
                                    setStatusFilter(e.target.value);
                                    setPage(1);
                                }}
                            >
                                <option value="">All statuses</option>
                                <option value="Active">Active</option>
                                <option value="On Hold">On Hold</option>
                                <option value="Inactive">Inactive</option>
                                <option value="Suspended">Suspended</option>
                            </select>
                        </div>
                        <div>
                            <div className="clients-list__filter-label">Account active</div>
                            <select
                                className="clients-list__select"
                                value={isActiveFilter}
                                onChange={(e) => {
                                    setIsActiveFilter(e.target.value as 'all' | 'true' | 'false');
                                    setPage(1);
                                }}
                            >
                                <option value="all">All</option>
                                <option value="true">Yes</option>
                                <option value="false">No</option>
                            </select>
                        </div>
                    </div>
                    <button
                        type="button"
                        className={`clients-list__filter-gear${advancedFiltersDirty ? ' clients-list__filter-gear-dot' : ''}`}
                        aria-label={advancedFiltersOpen ? 'Hide extra filters' : 'More filters: industry, location'}
                        aria-pressed={advancedFiltersOpen}
                        title="Industry, city, state, country"
                        onClick={() => setAdvancedFiltersOpen((o) => !o)}
                    >
                        ⚙
                    </button>
                </div>

                {advancedFiltersOpen ? (
                    <div className="clients-list__filters-advanced">
                        <div>
                            <div className="clients-list__filter-label">Industry</div>
                            <input
                                className="clients-list__input"
                                value={industryFilter}
                                onChange={(e) => {
                                    setIndustryFilter(e.target.value);
                                    setPage(1);
                                }}
                                placeholder="Industry"
                            />
                        </div>
                        <div>
                            <div className="clients-list__filter-label">City</div>
                            <input
                                className="clients-list__input"
                                value={cityFilter}
                                onChange={(e) => {
                                    setCityFilter(e.target.value);
                                    setPage(1);
                                }}
                                placeholder="City"
                            />
                        </div>
                        <div>
                            <div className="clients-list__filter-label">State / region</div>
                            <input
                                className="clients-list__input"
                                value={stateFilter}
                                onChange={(e) => {
                                    setStateFilter(e.target.value);
                                    setPage(1);
                                }}
                                placeholder="State"
                            />
                        </div>
                        <div>
                            <div className="clients-list__filter-label">Country</div>
                            <input
                                className="clients-list__input"
                                value={countryFilter}
                                onChange={(e) => {
                                    setCountryFilter(e.target.value);
                                    setPage(1);
                                }}
                                placeholder="Country"
                            />
                        </div>
                    </div>
                ) : null}
            </SurfaceCard>

            <SurfaceCard className="no-padding clients-list__table-shell">
                <div className="clients-list__table-toolbar">
                    <div className="clients-list__dropdown">
                        <button
                            type="button"
                            className="clients-list__menu-trigger clients-list__menu-trigger--chevron"
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
                            <div className="clients-list__dropdown-panel" role="menu">
                                <button
                                    type="button"
                                    className="clients-list__dropdown-action"
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
                                    className="clients-list__dropdown-action"
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
                                    className="clients-list__dropdown-action"
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

                    <div className="clients-list__dropdown">
                        <button
                            type="button"
                            className="clients-list__menu-trigger clients-list__menu-trigger--chevron"
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
                            <div className="clients-list__dropdown-panel" role="menu">
                                <button
                                    type="button"
                                    className="clients-list__dropdown-action"
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
                                    className="clients-list__dropdown-action"
                                    role="menuitem"
                                    disabled={summaryLoading}
                                    onClick={() => {
                                        void loadSummary();
                                        setShowMoreMenu(false);
                                    }}
                                >
                                    Refresh stats
                                </button>
                                <button
                                    type="button"
                                    className="clients-list__dropdown-action"
                                    role="menuitem"
                                    onClick={() => {
                                        copyShareLink();
                                        setShowMoreMenu(false);
                                    }}
                                >
                                    Copy list link (filters & sort)
                                </button>
                                <div className="clients-list__dropdown-divider" />
                                <button
                                    type="button"
                                    className="clients-list__dropdown-action"
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

                    <div className="clients-list__dropdown">
                        <button
                            type="button"
                            className="clients-list__menu-trigger clients-list__menu-trigger--chevron"
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
                            <div className="clients-list__dropdown-panel" role="menu">
                                {ALL_COLUMNS.map((cid) => (
                                    <label key={cid} className="clients-list__dropdown-item">
                                        <input
                                            type="checkbox"
                                            checked={colVisible(cid)}
                                            disabled={cid === 'client' || cid === 'actions'}
                                            onChange={() => toggleCol(cid)}
                                        />
                                        {COLUMN_LABEL[cid]}
                                    </label>
                                ))}
                                <div className="clients-list__dropdown-divider" />
                                <button
                                    type="button"
                                    className="clients-list__dropdown-action"
                                    onClick={() => setVisibleCols([...ALL_COLUMNS])}
                                >
                                    Reset columns
                                </button>
                            </div>
                        ) : null}
                    </div>

                    <div className="clients-list__dropdown">
                        <button
                            type="button"
                            className="clients-list__menu-trigger clients-list__menu-trigger--chevron"
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
                            <div className="clients-list__dropdown-panel" role="menu">
                                <button type="button" className="clients-list__dropdown-action" onClick={savePreset}>
                                    + Save current filters
                                </button>
                                <div className="clients-list__dropdown-divider" />
                                {presets.length === 0 ? (
                                    <div style={{ padding: '10px 16px', fontSize: 13, color: '#64748b' }}>No saved views yet.</div>
                                ) : (
                                    presets.map((pr) => (
                                        <div
                                            key={pr.id}
                                            className="clients-list__dropdown-item"
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
                                                className="clients-list__dropdown-action"
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

                    <label
                        className="clients-list__menu-trigger"
                        style={{ cursor: 'pointer', margin: 0 }}
                    >
                        <span style={{ color: '#64748b', fontWeight: 600 }}>Rows</span>
                        <select
                            className="clients-list__select"
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

                    <label className="clients-list__menu-trigger" style={{ cursor: 'pointer', margin: 0 }}>
                        <span style={{ color: '#64748b', fontWeight: 600 }}>Density</span>
                        <select
                            className="clients-list__select"
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
                    <button type="button" className="clients-list__overlay" aria-label="Close menus" onClick={closeAllDropdowns} />
                ) : null}

                <div className="clients-list__table-wrap">
                    <table className="clients-list__table">
                        <thead className="clients-list__thead">
                            <tr>
                                {colVisible('select') ? (
                                    <th className="clients-list__th" style={{ width: 40 }}>
                                        <input
                                            type="checkbox"
                                            checked={items.length > 0 && items.every((c) => selected.has(c.id))}
                                            onChange={toggleSelectAllPage}
                                            aria-label="Select all on page"
                                        />
                                    </th>
                                ) : null}
                                {colVisible('client') ? (
                                    <th
                                        className="clients-list__th clients-list__th--sortable"
                                        onClick={() => onSortColumn('client')}
                                    >
                                        Client {sortIndicator('client')}
                                    </th>
                                ) : null}
                                {colVisible('code') ? (
                                    <th
                                        className="clients-list__th clients-list__th--sortable"
                                        onClick={() => onSortColumn('code')}
                                    >
                                        Code {sortIndicator('code')}
                                    </th>
                                ) : null}
                                {colVisible('contact') ? (
                                    <th
                                        className="clients-list__th clients-list__th--sortable"
                                        onClick={() => onSortColumn('contact')}
                                    >
                                        Contact {sortIndicator('contact')}
                                    </th>
                                ) : null}
                                {colVisible('location') ? (
                                    <th
                                        className="clients-list__th clients-list__th--sortable"
                                        onClick={() => onSortColumn('location')}
                                    >
                                        Location {sortIndicator('location')}
                                    </th>
                                ) : null}
                                {colVisible('industry') ? (
                                    <th
                                        className="clients-list__th clients-list__th--sortable"
                                        onClick={() => onSortColumn('industry')}
                                    >
                                        Industry {sortIndicator('industry')}
                                    </th>
                                ) : null}
                                {colVisible('status') ? (
                                    <th
                                        className="clients-list__th clients-list__th--sortable"
                                        onClick={() => onSortColumn('status')}
                                    >
                                        Status {sortIndicator('status')}
                                    </th>
                                ) : null}
                                {colVisible('account') ? (
                                    <th
                                        className="clients-list__th clients-list__th--sortable"
                                        onClick={() => onSortColumn('account')}
                                    >
                                        Account {sortIndicator('account')}
                                    </th>
                                ) : null}
                                {colVisible('updated') ? (
                                    <th
                                        className="clients-list__th clients-list__th--sortable"
                                        onClick={() => onSortColumn('updated')}
                                    >
                                        Last updated {sortIndicator('updated')}
                                    </th>
                                ) : null}
                                {colVisible('actions') ? (
                                    <th className="clients-list__th clients-list__th--actions" aria-label="Row actions" />
                                ) : null}
                            </tr>
                        </thead>
                        <tbody>
                            {loading
                                ? Array.from({ length: 8 }).map((_, i) => (
                                      <tr key={i} className="clients-list__row">
                                          {visibleCols.map((col) => (
                                              <td key={col} className="clients-list__td">
                                                  <div className="clients-list__skel" />
                                              </td>
                                          ))}
                                      </tr>
                                  ))
                                : null}
                            {!loading && error ? (
                                <tr>
                                    <td
                                        colSpan={visibleCols.length}
                                        style={{ padding: 24, textAlign: 'center', color: '#b91c1c' }}
                                    >
                                        {error}
                                    </td>
                                </tr>
                            ) : null}
                            {!loading && !error && items.length === 0 ? (
                                <tr>
                                    <td colSpan={visibleCols.length} style={{ padding: 32, textAlign: 'center' }}>
                                        <div style={{ fontWeight: 600, marginBottom: 8 }}>No clients match</div>
                                        <div style={{ color: '#6b7280', marginBottom: 16 }}>
                                            Adjust filters or add a client to get started.
                                        </div>
                                        {canCreate ? (
                                            <button
                                                type="button"
                                                onClick={() => navigate('/app/clients/create')}
                                                className="success-button"
                                            >
                                                + Add Client
                                            </button>
                                        ) : null}
                                    </td>
                                </tr>
                            ) : null}
                            {!loading &&
                                !error &&
                                displayItems.map((c) => (
                                    <tr
                                        key={c.id}
                                        className={`clients-list__row${selected.has(c.id) ? ' clients-list__row--selected' : ''}`}
                                    >
                                        {colVisible('select') ? (
                                            <td className="clients-list__td">
                                                <input
                                                    type="checkbox"
                                                    checked={selected.has(c.id)}
                                                    onChange={() => toggleSelect(c.id)}
                                                    onClick={(e) => e.stopPropagation()}
                                                    aria-label={`Select ${c.name}`}
                                                />
                                            </td>
                                        ) : null}
                                        {colVisible('client') ? (
                                            <td className="clients-list__td">
                                                <div className="clients-list__client-cell-inner">
                                                    <button
                                                        type="button"
                                                        className={`clients-list__fav${favoriteIds.has(c.id) ? ' clients-list__fav--on' : ''}`}
                                                        aria-label={favoriteIds.has(c.id) ? 'Remove from favorites' : 'Add to favorites'}
                                                        aria-pressed={favoriteIds.has(c.id)}
                                                        title="Favorite — keeps this client at the top of the list"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            toggleFavorite(c.id);
                                                        }}
                                                    >
                                                        {favoriteIds.has(c.id) ? '★' : '☆'}
                                                    </button>
                                                    <div className="clients-list__client-cell-text">
                                                        <button
                                                            type="button"
                                                            className="clients-list__client-name"
                                                            onClick={() => navigate(`/app/clients/${c.id}`)}
                                                        >
                                                            {c.name}
                                                        </button>
                                                        {displayDomain(c.website) ? (
                                                            <div className="clients-list__client-domain">{displayDomain(c.website)}</div>
                                                        ) : null}
                                                        {c.tags && c.tags.length > 0 ? (
                                                            <div style={{ marginTop: 8, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                                                {c.tags.map((tag) => (
                                                                    <span
                                                                        key={tag}
                                                                        style={{
                                                                            padding: '2px 7px',
                                                                            borderRadius: 999,
                                                                            fontSize: 10,
                                                                            fontWeight: 700,
                                                                            background: '#eef2ff',
                                                                            color: '#4338ca',
                                                                        }}
                                                                    >
                                                                        {tag}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        ) : null}
                                                    </div>
                                                </div>
                                            </td>
                                        ) : null}
                                        {colVisible('code') ? (
                                            <td className="clients-list__td">{c.code || '—'}</td>
                                        ) : null}
                                        {colVisible('contact') ? (
                                            <td className="clients-list__td">
                                                <div className="clients-list__contact-primary">{c.contact_person || '—'}</div>
                                                {(c.email || c.phone) ? (
                                                    <div className="clients-list__contact-secondary">{c.email || c.phone}</div>
                                                ) : null}
                                            </td>
                                        ) : null}
                                        {colVisible('location') ? (
                                            <td className="clients-list__td">
                                                {[c.city, c.state, c.country].filter(Boolean).join(', ') || '—'}
                                            </td>
                                        ) : null}
                                        {colVisible('industry') ? (
                                            <td className="clients-list__td">{c.industry || '—'}</td>
                                        ) : null}
                                        {colVisible('status') ? (
                                            <td className="clients-list__td">
                                                <StatusBadge status={c.status || 'Active'} />
                                            </td>
                                        ) : null}
                                        {colVisible('account') ? (
                                            <td className="clients-list__td">
                                                <span
                                                    className={`clients-list__pill ${c.is_active === false ? 'clients-list__pill--no' : 'clients-list__pill--yes'}`}
                                                >
                                                    {c.is_active === false ? 'No' : 'Yes'}
                                                </span>
                                            </td>
                                        ) : null}
                                        {colVisible('updated') ? (
                                            <td className="clients-list__td">{formatListDate(c.updated_at)}</td>
                                        ) : null}
                                        {colVisible('actions') ? (
                                            <td className="clients-list__td clients-list__td--actions">
                                                <button
                                                    type="button"
                                                    className="clients-list__kebab"
                                                    aria-label={`Actions for ${c.name}`}
                                                    aria-expanded={actionMenu?.clientId === c.id}
                                                    aria-haspopup="menu"
                                                    onClick={(e) => openRowActionMenu(e, c.id)}
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
                        <div style={{ fontWeight: 700, marginBottom: 8 }}>Remove client?</div>
                        <div style={{ color: '#4b5563', marginBottom: 16 }}>
                            {deleteTarget.name} will be archived (soft delete). You can restore from admin workflows if
                            applicable.
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
                                {deleting ? 'Removing…' : 'Remove'}
                            </button>
                        </div>
                    </SurfaceCard>
                    </div>
                </div>
            ) : null}
        </div>

        {actionMenu && actionMenuClient ? (
            <>
                <button type="button" className="clients-list__overlay" aria-label="Close menu" onClick={() => setActionMenu(null)} />
                <div
                    className="clients-list__action-flyout"
                    role="menu"
                    style={{ top: actionMenu.top, left: actionMenu.left }}
                >
                    <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                            navigate(`/app/clients/${actionMenuClient.id}`);
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
                                navigate(`/app/clients/${actionMenuClient.id}/edit`);
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
                            const url = `${window.location.origin}/app/clients/${actionMenuClient.id}`;
                            void navigator.clipboard.writeText(url).then(
                                () =>
                                    setToast(
                                        'Profile link copied — open in browser while signed in to view this client.',
                                    ),
                                () => setToast('Copy failed'),
                            );
                            setActionMenu(null);
                        }}
                    >
                        Copy profile link
                    </button>
                    {canDelete ? (
                        <button
                            type="button"
                            role="menuitem"
                            className="clients-list__action-danger"
                            onClick={() => {
                                setDeleteTarget(actionMenuClient);
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

function StatusBadge({ status }: { status: string }) {
    let cls = 'clients-list__badge clients-list__badge--default';
    if (status === 'Active') cls = 'clients-list__badge clients-list__badge--active';
    else if (status === 'On Hold') cls = 'clients-list__badge clients-list__badge--hold';
    else if (status === 'Inactive') cls = 'clients-list__badge clients-list__badge--inactive';
    else if (status === 'Suspended') cls = 'clients-list__badge clients-list__badge--suspended';

    return <span className={cls}>{status}</span>;
}
