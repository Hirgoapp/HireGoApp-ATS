import api from './api';
import { fetchCandidates } from '../modules/candidates/services/candidates.api';
import { fetchClients } from '../modules/clients/services/clients.api';
import { fetchJobs, fetchJobStats, type JobListStats } from '../modules/jobs/services/jobs.api';
import { fetchRecentActivityFeed, type ActivityFeedItem } from './activityFeed';

export type DashboardRole = 'admin' | 'manager' | 'employee';

export type DashboardWidgetKey =
    | 'kpi-overview'
    | 'pipeline-funnel'
    | 'offers-status'
    | 'interview-health'
    | 'activity-feed'
    | 'quick-actions';

export const WIDGET_REFRESH_MS: Record<DashboardWidgetKey, number> = {
    'kpi-overview': 30000,
    'pipeline-funnel': 45000,
    'offers-status': 45000,
    'interview-health': 30000,
    'activity-feed': 15000,
    'quick-actions': 60000,
};

export interface DashboardWidgetLayout {
    key: DashboardWidgetKey;
    title: string;
    w: 1 | 2;
    h: 1 | 2;
    scope: 'application' | 'operations' | 'all';
}

export interface DashboardKpis {
    activeJobs: number;
    totalJobs: number;
    totalCandidates: number;
    totalClients: number;
    totalSubmissions: number;
    totalInterviews: number;
    offersIssued: number;
    offersAccepted: number;
}

export interface PipelineSummary {
    sourced: number;
    shortlisted: number;
    submitted: number;
    interviewed: number;
    offered: number;
    joined: number;
}

export interface OffersSummary {
    draft: number;
    issued: number;
    accepted: number;
    rejected: number;
    withdrawn: number;
}

export interface InterviewSummary {
    total: number;
    scheduled: number;
    completed: number;
    cancelled: number;
    rescheduled: number;
}

export interface DashboardAction {
    id: string;
    label: string;
    description: string;
    to: string;
}

export interface DashboardSnapshot {
    role: DashboardRole;
    widgets: DashboardWidgetLayout[];
    kpis: DashboardKpis;
    pipeline: PipelineSummary;
    offers: OffersSummary;
    interviews: InterviewSummary;
    activity: ActivityFeedItem[];
    actions: DashboardAction[];
    generatedAt: string;
}

export interface DashboardLayoutPayload {
    widgets: DashboardWidgetKey[];
    hiddenWidgets: DashboardWidgetKey[];
    updatedAt?: string | null;
}

const DEFAULT_WIDGETS: Record<DashboardRole, DashboardWidgetLayout[]> = {
    admin: [
        { key: 'kpi-overview', title: 'System KPIs', w: 2, h: 1, scope: 'application' },
        { key: 'pipeline-funnel', title: 'Operational Funnel', w: 1, h: 1, scope: 'operations' },
        { key: 'offers-status', title: 'Offer Conversion', w: 1, h: 1, scope: 'operations' },
        { key: 'interview-health', title: 'Interview Health', w: 1, h: 1, scope: 'operations' },
        { key: 'activity-feed', title: 'Live Activity Feed', w: 1, h: 2, scope: 'all' },
        { key: 'quick-actions', title: 'Admin Actions', w: 2, h: 1, scope: 'all' },
    ],
    manager: [
        { key: 'kpi-overview', title: 'Team KPIs', w: 2, h: 1, scope: 'application' },
        { key: 'pipeline-funnel', title: 'Pipeline Funnel', w: 1, h: 1, scope: 'operations' },
        { key: 'interview-health', title: 'Interview Health', w: 1, h: 1, scope: 'operations' },
        { key: 'activity-feed', title: 'Team Activity', w: 1, h: 2, scope: 'all' },
        { key: 'quick-actions', title: 'Manager Actions', w: 1, h: 1, scope: 'all' },
        { key: 'offers-status', title: 'Offer Status', w: 1, h: 1, scope: 'operations' },
    ],
    employee: [
        { key: 'kpi-overview', title: 'My Workflow KPIs', w: 2, h: 1, scope: 'application' },
        { key: 'activity-feed', title: 'My Recent Activity', w: 1, h: 2, scope: 'all' },
        { key: 'pipeline-funnel', title: 'Pipeline Snapshot', w: 1, h: 1, scope: 'operations' },
        { key: 'quick-actions', title: 'Next Actions', w: 1, h: 1, scope: 'all' },
        { key: 'offers-status', title: 'Offer Snapshot', w: 1, h: 1, scope: 'operations' },
        { key: 'interview-health', title: 'Interview Snapshot', w: 1, h: 1, scope: 'operations' },
    ],
};

function normalizeRole(input?: string): DashboardRole {
    const role = (input || '').toLowerCase();
    if (role.includes('admin')) return 'admin';
    if (role.includes('manager') || role.includes('lead')) return 'manager';
    return 'employee';
}

export function resolveDashboardRole(role?: string, permissions: string[] = []): DashboardRole {
    const normalized = normalizeRole(role);
    if (normalized === 'admin') return 'admin';

    const hasAdminPower = permissions.some((p) =>
        ['roles:manage', 'users:manage', 'settings:update', 'reports:read'].includes(p)
    );
    if (hasAdminPower) return 'admin';

    const hasManagerPower = permissions.some((p) =>
        ['jobs:update', 'submissions:update', 'interviews:update', 'offers:update'].includes(p)
    );
    if (normalized === 'manager' || hasManagerPower) return 'manager';

    return 'employee';
}

function unwrapApiData<T>(payload: any, fallback: T): T {
    if (payload && typeof payload === 'object' && 'data' in payload) {
        return (payload.data as T) ?? fallback;
    }
    return (payload as T) ?? fallback;
}

async function safeGet<T>(paths: string[], params?: Record<string, any>): Promise<T> {
    let lastError: any = null;

    for (const path of paths) {
        try {
            const response = await api.get<T>(path, params ? { params } : undefined);
            return response.data as T;
        } catch (error: any) {
            lastError = error;
        }
    }

    throw lastError || new Error('Request failed');
}

function toNumber(value: unknown): number {
    if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
    if (typeof value === 'string') {
        const n = Number(value);
        return Number.isFinite(n) ? n : 0;
    }
    return 0;
}

function buildActions(role: DashboardRole): DashboardAction[] {
    if (role === 'admin') {
        return [
            { id: 'a1', label: 'Create Job', description: 'Open a new requirement quickly.', to: '/app/jobs/create' },
            { id: 'a2', label: 'Company Settings', description: 'Manage branding, timezone, currency.', to: '/app/admin/settings/company' },
            { id: 'a3', label: 'Access Control', description: 'Manage users, roles, and permissions.', to: '/app/admin/settings/roles' },
            { id: 'a4', label: 'Client Setup', description: 'Add or update client accounts.', to: '/app/clients/create' },
        ];
    }

    if (role === 'manager') {
        return [
            { id: 'm1', label: 'Review Jobs', description: 'Prioritize active requirements.', to: '/app/jobs' },
            { id: 'm2', label: 'Track Submissions', description: 'Review candidate pipeline progress.', to: '/app/submissions' },
            { id: 'm3', label: 'Interview Queue', description: 'Plan and monitor interview rounds.', to: '/app/interviews' },
            { id: 'm4', label: 'Offer Follow-up', description: 'Push pending offers to closure.', to: '/app/offers' },
        ];
    }

    return [
        { id: 'e1', label: 'Add Candidate', description: 'Create candidate profile.', to: '/app/candidates/create' },
        { id: 'e2', label: 'Browse Jobs', description: 'Find matching job openings.', to: '/app/jobs' },
        { id: 'e3', label: 'My Submissions', description: 'Track current submission status.', to: '/app/submissions' },
        { id: 'e4', label: 'Interviews', description: 'Check upcoming interviews.', to: '/app/interviews' },
    ];
}

export async function loadDashboardSnapshot(role: DashboardRole): Promise<DashboardSnapshot> {
    let overviewPayload: any = null;
    try {
        const overview = await api.get('/dashboard/overview');
        overviewPayload = unwrapApiData<any>(overview.data, null);
    } catch {
        overviewPayload = null;
    }

    if (overviewPayload) {
        const activity = await fetchRecentActivityFeed(12).catch(() => []);
        return {
            role,
            widgets: DEFAULT_WIDGETS[role],
            kpis: {
                activeJobs: toNumber(overviewPayload?.kpis?.activeJobs),
                totalJobs: toNumber(overviewPayload?.kpis?.totalJobs),
                totalCandidates: toNumber(overviewPayload?.kpis?.totalCandidates),
                totalClients: toNumber(overviewPayload?.kpis?.totalClients),
                totalSubmissions: toNumber(overviewPayload?.kpis?.totalSubmissions),
                totalInterviews: toNumber(overviewPayload?.kpis?.totalInterviews),
                offersIssued: toNumber(overviewPayload?.kpis?.offersIssued),
                offersAccepted: toNumber(overviewPayload?.kpis?.offersAccepted),
            },
            pipeline: {
                sourced: toNumber(overviewPayload?.pipeline?.sourced),
                shortlisted: toNumber(overviewPayload?.pipeline?.shortlisted),
                submitted: toNumber(overviewPayload?.pipeline?.submitted),
                interviewed: toNumber(overviewPayload?.pipeline?.interviewed),
                offered: toNumber(overviewPayload?.pipeline?.offered),
                joined: toNumber(overviewPayload?.pipeline?.joined),
            },
            offers: {
                draft: toNumber(overviewPayload?.offers?.draft),
                issued: toNumber(overviewPayload?.offers?.issued),
                accepted: toNumber(overviewPayload?.offers?.accepted),
                rejected: toNumber(overviewPayload?.offers?.rejected),
                withdrawn: toNumber(overviewPayload?.offers?.withdrawn),
            },
            interviews: {
                total: toNumber(overviewPayload?.interviews?.total),
                scheduled: toNumber(overviewPayload?.interviews?.scheduled),
                completed: toNumber(overviewPayload?.interviews?.completed),
                cancelled: toNumber(overviewPayload?.interviews?.cancelled),
                rescheduled: toNumber(overviewPayload?.interviews?.rescheduled),
            },
            activity,
            actions: buildActions(role),
            generatedAt: overviewPayload?.generatedAt || new Date().toISOString(),
        };
    }

    const [jobStats, candidatesRes, clientsRes, submissionsRes, interviewsRes, offersRes, jobsRes, activityRes] =
        await Promise.allSettled([
            fetchJobStats(),
            fetchCandidates({ page: 1, limit: 1 }),
            fetchClients({ page: 1, limit: 1 }),
            safeGet<any>(['/submissions', '/api/v1/submissions'], { skip: 0, take: 100 }),
            safeGet<any>(['/interviews'], { skip: 0, take: 100 }),
            safeGet<any>(['/offers/stats/by-status', '/api/v1/offers/stats/by-status']),
            fetchJobs({ page: 1, limit: 100, orderBy: 'updated_at', orderDirection: 'DESC' }),
            fetchRecentActivityFeed(12),
        ]);

    const jobsStatsData: Partial<JobListStats> =
        jobStats.status === 'fulfilled' ? jobStats.value ?? {} : {};
    const candidatesTotal = candidatesRes.status === 'fulfilled' ? toNumber(candidatesRes.value.total) : 0;
    const clientsTotal = clientsRes.status === 'fulfilled' ? toNumber(clientsRes.value.total) : 0;

    const submissionsPayload = submissionsRes.status === 'fulfilled' ? submissionsRes.value : { data: [], total: 0 };
    const submissionsList: any[] = Array.isArray(submissionsPayload?.data) ? submissionsPayload.data : [];
    const submissionsTotal = toNumber(submissionsPayload?.total ?? submissionsList.length);

    const interviewsPayload = interviewsRes.status === 'fulfilled' ? interviewsRes.value : { data: [], total: 0 };
    const interviewsList: any[] = Array.isArray(interviewsPayload?.data) ? interviewsPayload.data : [];
    const interviewsTotal = toNumber(interviewsPayload?.total ?? interviewsList.length);

    const offerStats = offersRes.status === 'fulfilled' ? offersRes.value || {} : {};
    const jobsList = jobsRes.status === 'fulfilled' ? jobsRes.value.items || [] : [];
    const activity = activityRes.status === 'fulfilled' ? activityRes.value : [];

    const scheduledInterviews = interviewsList.filter((x) => String(x.status || '').toLowerCase() === 'scheduled').length;
    const completedInterviews = interviewsList.filter((x) => String(x.status || '').toLowerCase() === 'completed').length;
    const cancelledInterviews = interviewsList.filter((x) => String(x.status || '').toLowerCase().includes('cancel')).length;
    const rescheduledInterviews = interviewsList.filter((x) => String(x.status || '').toLowerCase().includes('resched')).length;

    const shortlisted = Math.max(
        submissionsTotal - Math.floor(toNumber(offerStats.issued) + toNumber(offerStats.accepted)),
        0
    );

    const openJobsFallback = jobsList.filter((j: any) => String(j.status || '').toLowerCase() === 'open').length;

    return {
        role,
        widgets: DEFAULT_WIDGETS[role],
        kpis: {
            activeJobs: toNumber(jobsStatsData.openJobs ?? openJobsFallback),
            totalJobs: toNumber(jobsStatsData.totalJobs ?? jobsList.length),
            totalCandidates: candidatesTotal,
            totalClients: clientsTotal,
            totalSubmissions: submissionsTotal,
            totalInterviews: interviewsTotal,
            offersIssued: toNumber(offerStats.issued),
            offersAccepted: toNumber(offerStats.accepted),
        },
        pipeline: {
            sourced: candidatesTotal,
            shortlisted,
            submitted: submissionsTotal,
            interviewed: interviewsTotal,
            offered: toNumber(offerStats.issued) + toNumber(offerStats.accepted),
            joined: toNumber(offerStats.accepted),
        },
        offers: {
            draft: toNumber(offerStats.draft),
            issued: toNumber(offerStats.issued),
            accepted: toNumber(offerStats.accepted),
            rejected: toNumber(offerStats.rejected),
            withdrawn: toNumber(offerStats.withdrawn),
        },
        interviews: {
            total: interviewsTotal,
            scheduled: scheduledInterviews,
            completed: completedInterviews,
            cancelled: cancelledInterviews,
            rescheduled: rescheduledInterviews,
        },
        activity,
        actions: buildActions(role),
        generatedAt: new Date().toISOString(),
    };
}

export async function loadDashboardLayout(role: DashboardRole): Promise<DashboardLayoutPayload | null> {
    try {
        const response = await api.get('/dashboard/layout', { params: { role } });
        const data = unwrapApiData<any>(response.data, null);
        if (!data) return null;
        return {
            widgets: Array.isArray(data.widgets) ? data.widgets : [],
            hiddenWidgets: Array.isArray(data.hiddenWidgets) ? data.hiddenWidgets : [],
            updatedAt: data.updatedAt || null,
        };
    } catch {
        return null;
    }
}

export async function saveDashboardLayout(
    role: DashboardRole,
    payload: DashboardLayoutPayload,
): Promise<void> {
    try {
        await api.put('/dashboard/layout', payload, { params: { role } });
    } catch {
        // Keep dashboard functional even if remote layout persistence is unavailable.
    }
}

export async function loadRoleTemplate(role: DashboardRole): Promise<DashboardLayoutPayload | null> {
    try {
        const response = await api.get('/dashboard/templates/role', { params: { role } });
        const data = unwrapApiData<any>(response.data, null);
        if (!data) return null;
        return {
            widgets: Array.isArray(data.widgets) ? data.widgets : [],
            hiddenWidgets: Array.isArray(data.hiddenWidgets) ? data.hiddenWidgets : [],
            updatedAt: data.updatedAt || null,
        };
    } catch {
        return null;
    }
}

export async function saveRoleTemplate(role: DashboardRole, payload: DashboardLayoutPayload): Promise<void> {
    try {
        await api.put('/dashboard/templates/role', payload, { params: { role } });
    } catch {
        // Non-blocking for UX.
    }
}
