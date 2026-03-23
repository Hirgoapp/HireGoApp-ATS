import { BarChart3, Briefcase, Building2, CheckCircle2, Clock3, LayoutGrid, RefreshCw, Users } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/ui/PageHeader';
import SurfaceCard from '../components/ui/SurfaceCard';
import {
    loadDashboardSnapshot,
    loadDashboardLayout,
    saveRoleTemplate,
    resolveDashboardRole,
    saveDashboardLayout,
    WIDGET_REFRESH_MS,
    type DashboardSnapshot,
    type DashboardWidgetKey,
} from '../services/dashboard.service';
import { connectDashboardRealtime } from '../services/dashboardRealtime';
import { useAuthStore } from '../stores/authStore';
import { useWorkspaceStore } from '../stores/workspaceStore';

const AUTO_REFRESH_MS = 30000;

const WIDGET_LABELS: Record<DashboardWidgetKey, string> = {
    'kpi-overview': 'KPI Overview',
    'pipeline-funnel': 'Pipeline Funnel',
    'offers-status': 'Offer Status',
    'interview-health': 'Interview Health',
    'activity-feed': 'Activity Feed',
    'quick-actions': 'Quick Actions',
};

export default function Dashboard() {
    const navigate = useNavigate();
    const user = useAuthStore((state) => state.user);
    const token = useAuthStore((state) => state.token);
    const branding = useWorkspaceStore((state) => state.branding);
    const [snapshot, setSnapshot] = useState<DashboardSnapshot | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [customizeMode, setCustomizeMode] = useState(false);
    const [hiddenWidgets, setHiddenWidgets] = useState<DashboardWidgetKey[]>([]);
    const [widgetOrder, setWidgetOrder] = useState<DashboardWidgetKey[]>([]);
    const [draggingWidget, setDraggingWidget] = useState<DashboardWidgetKey | null>(null);
    const [scope, setScope] = useState<'application' | 'operations'>('operations');
    const [templateSaving, setTemplateSaving] = useState(false);

    const role = useMemo(
        () => resolveDashboardRole(user?.role, user?.permissions || []),
        [user?.role, user?.permissions],
    );

    const layoutStorageKey = useMemo(() => `dashboard-layout-hidden-${role}`, [role]);

    const reload = async (silent = false) => {
        try {
            if (!silent) {
                setLoading(true);
            } else {
                setRefreshing(true);
            }
            setError(null);
            const next = await loadDashboardSnapshot(role);
            setSnapshot(next);
        } catch (err: any) {
            setError(err?.message || 'Unable to load dashboard metrics.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        void reload(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [role]);

    useEffect(() => {
        const raw = window.localStorage.getItem(layoutStorageKey);
        if (!raw) {
            setHiddenWidgets([]);
        } else {
            try {
                const parsed = JSON.parse(raw);
                setHiddenWidgets(Array.isArray(parsed) ? parsed : []);
            } catch {
                setHiddenWidgets([]);
            }
        }

        void (async () => {
            const remote = await loadDashboardLayout(role);
            if (remote) {
                if (Array.isArray(remote.hiddenWidgets)) {
                    setHiddenWidgets(remote.hiddenWidgets);
                    window.localStorage.setItem(layoutStorageKey, JSON.stringify(remote.hiddenWidgets));
                }
                if (Array.isArray(remote.widgets) && remote.widgets.length > 0) {
                    setWidgetOrder(remote.widgets);
                }
            }
        })();
    }, [layoutStorageKey]);

    useEffect(() => {
        if (!snapshot) return;
        if (widgetOrder.length > 0) return;
        setWidgetOrder(snapshot.widgets.map((widget) => widget.key));
    }, [snapshot, widgetOrder.length]);

    useEffect(() => {
        const timer = window.setInterval(() => {
            void reload(true);
        }, AUTO_REFRESH_MS);
        return () => window.clearInterval(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [role]);

    useEffect(() => {
        const companyId = user?.company?.id;
        if (!companyId) return;

        const session = connectDashboardRealtime({
            companyId,
            token,
            onOverview: ({ data }) => {
                setSnapshot((prev) => {
                    if (!prev) return prev;
                    return {
                        ...prev,
                        kpis: {
                            ...prev.kpis,
                            ...(data?.kpis || {}),
                        },
                        pipeline: {
                            ...prev.pipeline,
                            ...(data?.pipeline || {}),
                        },
                        offers: {
                            ...prev.offers,
                            ...(data?.offers || {}),
                        },
                        interviews: {
                            ...prev.interviews,
                            ...(data?.interviews || {}),
                        },
                        generatedAt: data?.generatedAt || prev.generatedAt,
                    };
                });
            },
            onError: (message) => {
                setError((current) => current || message);
            },
        });

        return () => {
            session.disconnect();
        };
    }, [user?.company?.id, token]);

    const updateHiddenWidgets = (next: DashboardWidgetKey[]) => {
        setHiddenWidgets(next);
        window.localStorage.setItem(layoutStorageKey, JSON.stringify(next));
        void saveDashboardLayout(role, {
            widgets: widgetOrder.length > 0 ? widgetOrder : snapshot?.widgets.map((widget) => widget.key) || [],
            hiddenWidgets: next,
            updatedAt: new Date().toISOString(),
        });
    };

    const moveWidget = (sourceKey: DashboardWidgetKey, targetKey: DashboardWidgetKey) => {
        const current = widgetOrder.length > 0 ? widgetOrder : snapshot?.widgets.map((widget) => widget.key) || [];
        if (sourceKey === targetKey || current.length === 0) return;

        const sourceIndex = current.indexOf(sourceKey);
        const targetIndex = current.indexOf(targetKey);
        if (sourceIndex < 0 || targetIndex < 0) return;

        const next = [...current];
        const [moved] = next.splice(sourceIndex, 1);
        next.splice(targetIndex, 0, moved);

        setWidgetOrder(next);
        void saveDashboardLayout(role, {
            widgets: next,
            hiddenWidgets,
            updatedAt: new Date().toISOString(),
        });
    };

    const visibleWidgets = useMemo(() => {
        if (!snapshot) return [];

        const ordered =
            widgetOrder.length > 0
                ? [
                    ...widgetOrder
                        .map((key) => snapshot.widgets.find((widget) => widget.key === key))
                        .filter((widget): widget is DashboardSnapshot['widgets'][number] => !!widget),
                    ...snapshot.widgets.filter((widget) => !widgetOrder.includes(widget.key)),
                ]
                : snapshot.widgets;

        return ordered.filter(
            (widget) =>
                !hiddenWidgets.includes(widget.key) &&
                (widget.scope === 'all' || widget.scope === scope),
        );
    }, [snapshot, hiddenWidgets, scope, widgetOrder]);

    const isWidgetStale = (key: DashboardWidgetKey) => {
        if (!snapshot?.generatedAt) return false;
        const ageMs = Date.now() - new Date(snapshot.generatedAt).getTime();
        return ageMs > (WIDGET_REFRESH_MS[key] * 2);
    };

    const pipelineMax = useMemo(() => {
        if (!snapshot) return 1;
        return Math.max(
            snapshot.pipeline.sourced,
            snapshot.pipeline.shortlisted,
            snapshot.pipeline.submitted,
            snapshot.pipeline.interviewed,
            snapshot.pipeline.offered,
            snapshot.pipeline.joined,
            1,
        );
    }, [snapshot]);

    const freshnessLabel = useMemo(() => {
        if (!snapshot?.generatedAt) return 'Not updated yet';
        return new Date(snapshot.generatedAt).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });
    }, [snapshot?.generatedAt]);

    if (loading && !snapshot) {
        return (
            <div className="dashboard-grid">
                <PageHeader
                    title="Dashboard Workspace"
                    subtitle="Loading your role-based metrics and widgets..."
                />
                <SurfaceCard>
                    <div className="activity-empty">Loading dashboard...</div>
                </SurfaceCard>
            </div>
        );
    }

    return (
        <div className="dashboard-grid">
            <PageHeader
                title="Dashboard Workspace"
                subtitle={`Enterprise dashboard for ${role}. Timezone: ${branding.timezone || 'UTC'} • Currency: ${branding.currency || 'USD'}`}
                actions={
                    <div className="dashboard-toolbar">
                        <div className="dashboard-scope-toggle">
                            <button
                                type="button"
                                className={`ghost-button ${scope === 'application' ? 'is-active' : ''}`}
                                onClick={() => setScope('application')}
                            >
                                Application View
                            </button>
                            <button
                                type="button"
                                className={`ghost-button ${scope === 'operations' ? 'is-active' : ''}`}
                                onClick={() => setScope('operations')}
                            >
                                Operations View
                            </button>
                        </div>
                        <span className="nav-badge" style={{ background: '#eff6ff', color: '#1d4ed8' }}>
                            Auto refresh: 30s
                        </span>
                        <span className="nav-badge" style={{ background: '#f3f4f6', color: '#374151' }}>
                            Updated: {freshnessLabel}
                        </span>
                        <button
                            type="button"
                            className="ghost-button"
                            onClick={() => setCustomizeMode((v) => !v)}
                        >
                            <LayoutGrid size={14} /> Customize
                        </button>
                        <button
                            type="button"
                            className="primary-button"
                            onClick={() => void reload(true)}
                            disabled={refreshing}
                        >
                            <RefreshCw size={14} /> {refreshing ? 'Refreshing...' : 'Refresh'}
                        </button>
                        {role === 'admin' ? (
                            <button
                                type="button"
                                className="ghost-button"
                                disabled={templateSaving}
                                onClick={async () => {
                                    try {
                                        setTemplateSaving(true);
                                        await saveRoleTemplate(role, {
                                            widgets: widgetOrder.length > 0 ? widgetOrder : snapshot?.widgets.map((w) => w.key) || [],
                                            hiddenWidgets,
                                            updatedAt: new Date().toISOString(),
                                        });
                                    } finally {
                                        setTemplateSaving(false);
                                    }
                                }}
                            >
                                {templateSaving ? 'Saving template...' : 'Save As Role Template'}
                            </button>
                        ) : null}
                    </div>
                }
            />

            {error ? (
                <SurfaceCard>
                    <div className="activity-empty">{error}</div>
                </SurfaceCard>
            ) : null}

            {customizeMode && snapshot ? (
                <SurfaceCard>
                    <div className="dashboard-activity-header">
                        <h2 className="block-title">Widget Visibility</h2>
                        <span className="nav-badge">Personalized view</span>
                    </div>
                    <div className="dashboard-widget-toggle-grid">
                        {(snapshot.widgets || []).map((widget) => {
                            const hidden = hiddenWidgets.includes(widget.key);
                            return (
                                <button
                                    key={widget.key}
                                    type="button"
                                    className={`widget-toggle ${hidden ? 'off' : 'on'}`}
                                    draggable
                                    onDragStart={() => setDraggingWidget(widget.key)}
                                    onDragOver={(event) => event.preventDefault()}
                                    onDrop={() => {
                                        if (draggingWidget) {
                                            moveWidget(draggingWidget, widget.key);
                                        }
                                        setDraggingWidget(null);
                                    }}
                                    onDragEnd={() => setDraggingWidget(null)}
                                    onClick={() => {
                                        if (hidden) {
                                            updateHiddenWidgets(hiddenWidgets.filter((key) => key !== widget.key));
                                        } else {
                                            updateHiddenWidgets([...hiddenWidgets, widget.key]);
                                        }
                                    }}
                                >
                                    <span>{WIDGET_LABELS[widget.key]}</span>
                                    <span className="nav-badge">{hidden ? 'Hidden' : 'Visible'}</span>
                                </button>
                            );
                        })}
                    </div>
                </SurfaceCard>
            ) : null}

            <div className="dashboard-workspace-grid">
                {visibleWidgets.map((widget) => {
                    const widgetClass = `workspace-widget w-${widget.w} h-${widget.h}`;

                    if (widget.key === 'kpi-overview' && snapshot) {
                        return (
                            <SurfaceCard key={widget.key} className={widgetClass}>
                                <div className="dashboard-activity-header">
                                    <h2 className="block-title">{widget.title}</h2>
                                    <span className="nav-badge">{isWidgetStale(widget.key) ? 'Stale' : 'Fresh'}</span>
                                </div>
                                <div className="kpi-grid-extended">
                                    <div className="kpi-card">
                                        <Briefcase size={16} />
                                        <div>
                                            <div className="summary-label">Active Jobs</div>
                                            <div className="summary-value">{snapshot.kpis.activeJobs}</div>
                                        </div>
                                    </div>
                                    <div className="kpi-card">
                                        <Users size={16} />
                                        <div>
                                            <div className="summary-label">Candidates</div>
                                            <div className="summary-value">{snapshot.kpis.totalCandidates}</div>
                                        </div>
                                    </div>
                                    <div className="kpi-card">
                                        <Building2 size={16} />
                                        <div>
                                            <div className="summary-label">Clients</div>
                                            <div className="summary-value">{snapshot.kpis.totalClients}</div>
                                        </div>
                                    </div>
                                    <div className="kpi-card">
                                        <BarChart3 size={16} />
                                        <div>
                                            <div className="summary-label">Submissions</div>
                                            <div className="summary-value">{snapshot.kpis.totalSubmissions}</div>
                                        </div>
                                    </div>
                                    <div className="kpi-card">
                                        <Clock3 size={16} />
                                        <div>
                                            <div className="summary-label">Interviews</div>
                                            <div className="summary-value">{snapshot.kpis.totalInterviews}</div>
                                        </div>
                                    </div>
                                    <div className="kpi-card">
                                        <CheckCircle2 size={16} />
                                        <div>
                                            <div className="summary-label">Offers Accepted</div>
                                            <div className="summary-value">{snapshot.kpis.offersAccepted}</div>
                                        </div>
                                    </div>
                                </div>
                            </SurfaceCard>
                        );
                    }

                    if (widget.key === 'pipeline-funnel' && snapshot) {
                        const stages = [
                            { label: 'Sourced', value: snapshot.pipeline.sourced },
                            { label: 'Shortlisted', value: snapshot.pipeline.shortlisted },
                            { label: 'Submitted', value: snapshot.pipeline.submitted },
                            { label: 'Interviewed', value: snapshot.pipeline.interviewed },
                            { label: 'Offered', value: snapshot.pipeline.offered },
                            { label: 'Joined', value: snapshot.pipeline.joined },
                        ];

                        return (
                            <SurfaceCard key={widget.key} className={widgetClass}>
                                <div className="dashboard-activity-header">
                                    <h2 className="block-title">{widget.title}</h2>
                                    <span className="nav-badge">{isWidgetStale(widget.key) ? 'Stale' : 'Live snapshot'}</span>
                                </div>
                                <div className="pipeline-list">
                                    {stages.map((stage) => (
                                        <div key={stage.label} className="pipeline-row">
                                            <div className="pipeline-label">{stage.label}</div>
                                            <div className="pipeline-bar-wrap">
                                                <div
                                                    className="pipeline-bar"
                                                    style={{ width: `${Math.round((stage.value / pipelineMax) * 100)}%` }}
                                                />
                                            </div>
                                            <div className="pipeline-value">{stage.value}</div>
                                        </div>
                                    ))}
                                </div>
                            </SurfaceCard>
                        );
                    }

                    if (widget.key === 'offers-status' && snapshot) {
                        return (
                            <SurfaceCard key={widget.key} className={widgetClass}>
                                <div className="dashboard-activity-header">
                                    <h2 className="block-title">{widget.title}</h2>
                                    <span className="nav-badge">{isWidgetStale(widget.key) ? 'Stale' : (branding.currency || 'USD')}</span>
                                </div>
                                <div className="status-grid">
                                    <div className="status-pill">Draft: {snapshot.offers.draft}</div>
                                    <div className="status-pill">Issued: {snapshot.offers.issued}</div>
                                    <div className="status-pill">Accepted: {snapshot.offers.accepted}</div>
                                    <div className="status-pill">Rejected: {snapshot.offers.rejected}</div>
                                    <div className="status-pill">Withdrawn: {snapshot.offers.withdrawn}</div>
                                </div>
                            </SurfaceCard>
                        );
                    }

                    if (widget.key === 'interview-health' && snapshot) {
                        return (
                            <SurfaceCard key={widget.key} className={widgetClass}>
                                <div className="dashboard-activity-header">
                                    <h2 className="block-title">{widget.title}</h2>
                                    <span className="nav-badge">{isWidgetStale(widget.key) ? 'Stale' : 'Near real-time'}</span>
                                </div>
                                <div className="status-grid">
                                    <div className="status-pill">Total: {snapshot.interviews.total}</div>
                                    <div className="status-pill">Scheduled: {snapshot.interviews.scheduled}</div>
                                    <div className="status-pill">Completed: {snapshot.interviews.completed}</div>
                                    <div className="status-pill">Cancelled: {snapshot.interviews.cancelled}</div>
                                    <div className="status-pill">Rescheduled: {snapshot.interviews.rescheduled}</div>
                                </div>
                            </SurfaceCard>
                        );
                    }

                    if (widget.key === 'activity-feed' && snapshot) {
                        return (
                            <SurfaceCard key={widget.key} className={widgetClass}>
                                <div className="dashboard-activity-header">
                                    <h2 className="block-title">{widget.title}</h2>
                                    <span className="nav-badge">{isWidgetStale(widget.key) ? 'Stale' : `Latest ${snapshot.activity.length}`}</span>
                                </div>
                                {snapshot.activity.length === 0 ? (
                                    <div className="activity-empty">No recent events available for this workspace.</div>
                                ) : (
                                    <div className="activity-list">
                                        {snapshot.activity.map((item) => (
                                            <div key={item.id} className="activity-item">
                                                <div className={`activity-dot ${item.severity}`} />
                                                <div>
                                                    <div className="activity-title">{item.title}</div>
                                                    <div className="activity-description">{item.description}</div>
                                                </div>
                                                <div className="activity-time">
                                                    {new Date(item.timestamp).toLocaleString([], {
                                                        month: 'short',
                                                        day: '2-digit',
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </SurfaceCard>
                        );
                    }

                    if (widget.key === 'quick-actions' && snapshot) {
                        return (
                            <SurfaceCard key={widget.key} className={widgetClass}>
                                <div className="dashboard-activity-header">
                                    <h2 className="block-title">{widget.title}</h2>
                                    <span className="nav-badge">{isWidgetStale(widget.key) ? 'Stale' : 'Role-specific'}</span>
                                </div>
                                <div className="dashboard-module-grid">
                                    {snapshot.actions.map((action) => (
                                        <button
                                            key={action.id}
                                            type="button"
                                            className="module-card"
                                            onClick={() => navigate(action.to)}
                                        >
                                            <div className="module-icon-wrap">
                                                <Briefcase size={18} />
                                            </div>
                                            <div className="module-content">
                                                <div className="module-title">{action.label}</div>
                                                <div className="module-description">{action.description}</div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </SurfaceCard>
                        );
                    }

                    return null;
                })}
            </div>
        </div>
    );
}
